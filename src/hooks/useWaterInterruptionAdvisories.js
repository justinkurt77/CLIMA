import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import {
  PALAYAN_CITY_BARANGAYS,
  PALAYAN_BARANGAY_CENTROIDS,
  matchesBarangay,
  parseBarangayList,
  extractBarangaysFromText,
} from "../lib/palayanBarangays";

/**
 * Calculates the exact scheduled end / restoration timestamp for a water interruption record.
 */
export function getWaterInterruptionEndTime(record) {
  if (!record || !record.interruption_date) return null;
  const timeStr = record.interruption_time || "00:00:00";
  const [h, m] = timeStr.split(":").map(Number);
  const start = new Date(`${record.interruption_date}T00:00:00`);
  start.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);

  const durationHours = parseFloat(record.duration_hours) || 0;
  if (durationHours > 0) {
    return new Date(start.getTime() + durationHours * 3600 * 1000);
  }
  // If no duration set, defaults to end of the day
  return new Date(`${record.interruption_date}T23:59:59`);
}

/**
 * Checks if a water interruption is currently active.
 * Returns false if explicitly restored/lifted, or if the set time is met (auto-lift).
 */
export function isWaterInterruptionActive(record, now = new Date()) {
  if (!record) return false;
  if (
    record.status === "restored" ||
    record.status === "lifted" ||
    record._autoLifted
  ) {
    return false;
  }

  const endTime = getWaterInterruptionEndTime(record);
  if (endTime && now >= endTime) {
    return false; // Auto-lift: set time is met!
  }

  return record.status === "ongoing";
}

/**
 * useWaterInterruptionAdvisories
 *
 * Realtime hook that manages active water interruption records & advisories
 * and maps them to affected Palayan City barangays for map highlighting in blue.
 * Automatically lifts interruptions when the set duration/time is met.
 */
export function useWaterInterruptionAdvisories(barangayGeoJSON = null) {
  const [waterRecords, setWaterRecords] = useState([]);
  const [advisoryRecords, setAdvisoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoJSONData, setGeoJSONData] = useState(barangayGeoJSON);
  const [tick, setTick] = useState(0);

  // Periodic ticker every 15s to automatically lift outages the second the set time is met
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // If barangayGeoJSON not passed as prop, load it once
  useEffect(() => {
    if (!geoJSONData) {
      fetch("/palayan-barangays.geojson")
        .then((res) => res.json())
        .then((data) => setGeoJSONData(data))
        .catch((err) => logger.warn("Failed to load barangay geojson for water hook:", err));
    }
  }, [geoJSONData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch water interruptions (exclude records explicitly marked 'restored' or 'lifted')
      const { data: wtrData, error: wtrError } = await supabase
        .from("water_interruptions")
        .select("*")
        .neq("status", "restored")
        .neq("status", "lifted")
        .order("interruption_date", { ascending: false });

      if (wtrError) logger.warn("Fetch water_interruptions:", wtrError);

      // Check if any ongoing records have met their set time and auto-lift them in DB
      const now = new Date();
      const expiredIds = (wtrData || [])
        .filter((r) => r.status !== "restored" && r.status !== "lifted" && !isWaterInterruptionActive(r, now))
        .map((r) => r.id);

      if (expiredIds.length > 0) {
        supabase
          .from("water_interruptions")
          .update({ status: "restored", updated_at: now.toISOString() })
          .in("id", expiredIds)
          .then(() => logger.info("Auto-lifted expired water interruptions in DB:", expiredIds))
          .catch((e) => logger.warn("Failed to auto-lift water in DB:", e));

        // Archive corresponding published water interruption advisories in DB
        supabase
          .from("advisories")
          .update({ status: "Archived" })
          .eq("category", "Water Interruption")
          .eq("status", "Published")
          .then(() => logger.info("Auto-archived water advisories in DB"))
          .catch((e) => logger.warn("Failed to auto-archive water advisories in DB:", e));
      }

      // 2. Fetch active Water Interruption advisories
      const { data: advData, error: advError } = await supabase
        .from("advisories")
        .select("*")
        .eq("category", "Water Interruption")
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (advError) logger.warn("Fetch advisories for water:", advError);

      // Merge local fallback records (for demo admin / offline sessions)
      let localRecords = [];
      try {
        const raw = localStorage.getItem("clima_local_water_interruptions");
        if (raw) localRecords = JSON.parse(raw);
      } catch (e) {}

      const combined = [...(wtrData || [])];
      localRecords.forEach((lr) => {
        const idx = combined.findIndex((r) => String(r.id) === String(lr.id));
        if (idx >= 0) {
          combined[idx] = lr;
        } else {
          combined.unshift(lr);
        }
      });

      // Filter active interruptions
      const activeOnly = combined.filter((r) => r.status !== "restored" && r.status !== "lifted");

      setWaterRecords(activeOnly);
      setAdvisoryRecords(advData || []);
    } catch (err) {
      logger.error("useWaterInterruptionAdvisories error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime subscription to water_interruptions and advisories + local event listeners
  useEffect(() => {
    fetchData();

    const handleLocalUpdate = () => fetchData();
    window.addEventListener("clima:water_interruption_change", handleLocalUpdate);
    window.addEventListener("storage", handleLocalUpdate);

    const channelId = `water_advisories_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "water_interruptions" },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "advisories" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("clima:water_interruption_change", handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Aggregate all active affected barangays and their metadata
  const affectedBarangayMap = useMemo(() => {
    const map = new Map();
    const now = new Date();

    // From water_interruptions table - ONLY active, un-lifted interruptions
    waterRecords.forEach((record) => {
      if (!isWaterInterruptionActive(record, now)) {
        return; // Auto-lifted: set time met or explicitly restored
      }

      // Check if this record explicitly targets the whole city
      const bLower = (record.affected_barangays || "").toLowerCase().trim();
      const dLower = (record.description || "").toLowerCase().trim();
      const isExplicitWholeCity =
        bLower === "whole palayan" ||
        bLower === "whole palayan city" ||
        bLower === "all 19 barangays" ||
        bLower === "all barangays" ||
        bLower === "city-wide" ||
        bLower === "citywide" ||
        dLower.includes("whole palayan city") ||
        dLower.includes("all 19 barangays");

      const endTime = getWaterInterruptionEndTime(record);

      if (isExplicitWholeCity) {
        // If whole city is targeted, add all 19 barangays
        PALAYAN_CITY_BARANGAYS.forEach((bgyName) => {
          if (!map.has(bgyName)) {
            const coords = PALAYAN_BARANGAY_CENTROIDS[bgyName] || { lng: 121.0827, lat: 15.5398 };
            map.set(bgyName, {
              name: bgyName,
              lng: coords.lng,
              lat: coords.lat,
              status: "ongoing",
              date: record.interruption_date,
              startTime: record.interruption_time,
              durationHours: record.duration_hours,
              endTime,
              households: record.households_affected,
              cause: record.cause,
              provider: record.provider || "Water Utility",
              description: record.description,
              source: "Water Interruption Record",
              rawRecord: record,
            });
          }
        });
      } else {
        // Primary: affected_barangays column (stores selected barangays)
        const listFromBarangays = parseBarangayList(record.affected_barangays);
        const listFromDesc = listFromBarangays.length === 0 ? extractBarangaysFromText(record.description) : [];
        const combined = Array.from(new Set([...listFromBarangays, ...listFromDesc]));

        combined.forEach((bgyName) => {
          if (!map.has(bgyName)) {
            const coords = PALAYAN_BARANGAY_CENTROIDS[bgyName] || { lng: 121.0827, lat: 15.5398 };
            map.set(bgyName, {
              name: bgyName,
              lng: coords.lng,
              lat: coords.lat,
              status: "ongoing",
              date: record.interruption_date,
              startTime: record.interruption_time,
              durationHours: record.duration_hours,
              endTime,
              households: record.households_affected,
              cause: record.cause,
              provider: record.provider || "Water Utility",
              description: record.description,
              source: "Water Interruption Record",
              rawRecord: record,
            });
          }
        });
      }
    });

    // From advisories table - only active, non-restored alerts
    advisoryRecords.forEach((advisory) => {
      // Water interruption records in water_interruptions are the sole authority for water sync
      const isWaterSync = (advisory.title || "").includes("Water Interruption Advisory");
      if (isWaterSync) {
        return;
      }

      // Check if advisory is expired (e.g. published more than 24 hours ago)
      const pubDate = advisory.published_at || advisory.created_at;
      if (pubDate) {
        const publishedTime = new Date(pubDate).getTime();
        if (now.getTime() - publishedTime > 24 * 60 * 60 * 1000) {
          return;
        }
      }

      const text = `${advisory.title || ""} ${advisory.content || ""}`.toLowerCase();
      if (text.includes("restored") || text.includes("lifted") || text.includes("cleared")) {
        return; // Skip restored advisories
      }

      const listFromTitle = extractBarangaysFromText(advisory.title);
      const listFromContent = extractBarangaysFromText(advisory.content);
      const combined = Array.from(new Set([...listFromTitle, ...listFromContent]));

      combined.forEach((bgyName) => {
        if (!map.has(bgyName)) {
          const coords = PALAYAN_BARANGAY_CENTROIDS[bgyName] || { lng: 121.0827, lat: 15.5398 };
          map.set(bgyName, {
            name: bgyName,
            lng: coords.lng,
            lat: coords.lat,
            status: "ongoing",
            date: advisory.published_at?.split("T")[0] || advisory.created_at?.split("T")[0],
            cause: "Advisory Alert",
            provider: "Water Utility",
            description: advisory.title,
            content: advisory.content,
            source: "Official Water Advisory",
            rawRecord: advisory,
          });
        }
      });
    });

    return map;
  }, [waterRecords, advisoryRecords, tick]);

  const affectedBarangays = useMemo(() => {
    return Array.from(affectedBarangayMap.keys());
  }, [affectedBarangayMap]);

  const affectedBarangayOutages = useMemo(() => {
    return Array.from(affectedBarangayMap.values());
  }, [affectedBarangayMap]);

  // Check if all or nearly all barangays in Palayan City are selected / affected
  const isWholeCity = useMemo(() => {
    if (affectedBarangays.length === 0) return false;

    // Check if at least 16 of the 19 barangays are matched
    const matchCount = PALAYAN_CITY_BARANGAYS.filter((bgy) =>
      affectedBarangays.some((aff) => matchesBarangay(aff, bgy))
    ).length;

    if (matchCount >= 16) return true;
    if (matchCount > 0 && matchCount < 16) return false;

    const now = new Date();
    const hasExplicitWholeCityRecord = waterRecords.some((r) => {
      if (!isWaterInterruptionActive(r, now)) return false;
      const b = (r.affected_barangays || "").toLowerCase().trim();
      const d = (r.description || "").toLowerCase().trim();
      return (
        b === "whole palayan" ||
        b === "whole palayan city" ||
        b === "all 19 barangays" ||
        b === "all barangays" ||
        b === "city-wide" ||
        b === "citywide" ||
        d.includes("whole palayan city") ||
        d.includes("all 19 barangays")
      );
    });
    if (hasExplicitWholeCityRecord) return true;

    const hasActiveWaterRecords = waterRecords.some((r) => isWaterInterruptionActive(r, now));
    if (!hasActiveWaterRecords) {
      const hasExplicitWholeCityAdvisory = advisoryRecords.some((adv) => {
        const isWaterSync = (adv.title || "").includes("Water Interruption Advisory");
        if (isWaterSync) return false;
        const pubDate = adv.published_at || adv.created_at;
        if (pubDate && now.getTime() - new Date(pubDate).getTime() > 24 * 60 * 60 * 1000) {
          return false;
        }
        const text = `${adv.title || ""} ${adv.content || ""}`.toLowerCase();
        if (text.includes("restored") || text.includes("lifted") || text.includes("cleared")) return false;
        return (
          text.includes("whole palayan city") ||
          text.includes("all 19 barangays") ||
          text.includes("city-wide water interruption")
        );
      });
      return hasExplicitWholeCityAdvisory;
    }

    return false;
  }, [affectedBarangays, waterRecords, advisoryRecords, tick]);

  // Unified display markers
  const displayWaterMarkers = useMemo(() => {
    if (affectedBarangays.length === 0) return [];

    if (isWholeCity) {
      const now = new Date();
      const activeRecord = waterRecords.find((r) => isWaterInterruptionActive(r, now)) || advisoryRecords[0];
      const anyMeta = affectedBarangayOutages[0] || {};
      const totalHouseholds = affectedBarangayOutages.reduce(
        (sum, o) => sum + (parseInt(o.households, 10) || 0),
        0
      );

      return [
        {
          name: "Palayan City",
          lng: 121.0827,
          lat: 15.5398,
          isWholeCity: true,
          status: "ongoing",
          date: anyMeta.date || (activeRecord ? activeRecord.interruption_date : ""),
          startTime: anyMeta.startTime || (activeRecord ? activeRecord.interruption_time : ""),
          durationHours: anyMeta.durationHours || (activeRecord ? activeRecord.duration_hours : ""),
          endTime: anyMeta.endTime,
          cause: anyMeta.cause || (activeRecord ? activeRecord.cause : "City-wide Water Interruption"),
          provider: anyMeta.provider || (activeRecord ? activeRecord.provider : "Palayan City Water District"),
          households: totalHouseholds || (activeRecord ? activeRecord.households_affected : 0),
          description: anyMeta.description || (activeRecord ? activeRecord.description : "City-wide water service interruption affecting Palayan City."),
          source: anyMeta.source || "Water Interruption Record",
          rawRecord: anyMeta.rawRecord || activeRecord,
        },
      ];
    }

    return affectedBarangayOutages;
  }, [isWholeCity, affectedBarangays, affectedBarangayOutages, waterRecords, advisoryRecords, tick]);

  // Construct GeoJSON FeatureCollection of highlighted barangay polygons for water (blue)
  const waterInterruptionGeoJSON = useMemo(() => {
    if (!geoJSONData || !geoJSONData.features || affectedBarangays.length === 0) {
      return { type: "FeatureCollection", features: [] };
    }

    const matchedFeatures = geoJSONData.features
      .filter((f) => {
        if (isWholeCity) return true; // Entire city highlighted
        const name = f.properties?.adm4_en;
        return affectedBarangays.some((aff) => matchesBarangay(aff, name));
      })
      .map((f) => {
        const bgyName = f.properties?.adm4_en;
        const meta = affectedBarangayMap.get(bgyName) || {};
        return {
          ...f,
          properties: {
            ...f.properties,
            isWaterInterruption: true,
            isWholeCity,
            waterStatus: meta.status || "ongoing",
            waterProvider: meta.provider || "Water Utility",
            waterCause: meta.cause || "Water Interruption",
            waterDate: meta.date || "",
          },
        };
      });

    return { type: "FeatureCollection", features: matchedFeatures };
  }, [geoJSONData, affectedBarangays, affectedBarangayMap, isWholeCity]);

  return {
    loading,
    waterRecords,
    advisoryRecords,
    affectedBarangays,
    affectedBarangayOutages,
    displayWaterMarkers,
    isWholeCity,
    waterInterruptionGeoJSON,
    hasActiveWaterAdvisories: affectedBarangays.length > 0,
    refetch: fetchData,
  };
}
