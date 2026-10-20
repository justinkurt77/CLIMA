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
 * Calculates the exact scheduled end / restoration timestamp for a power interruption record.
 */
export function getOutageEndTime(record) {
  if (!record || !record.interruption_date) return null;
  const timeStr = record.peak_outage_time || "00:00:00";
  const [h, m] = timeStr.split(":").map(Number);
  const start = new Date(`${record.interruption_date}T00:00:00`);
  start.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);

  const durationMins = parseInt(record.total_duration_minutes, 10) || 0;
  if (durationMins > 0) {
    return new Date(start.getTime() + durationMins * 60 * 1000);
  }
  // If no duration set, defaults to end of the day
  return new Date(`${record.interruption_date}T23:59:59`);
}

/**
 * Checks if a power outage is currently active.
 * Returns false if explicitly restored/lifted, or if the set time is met (auto-lift).
 */
export function isPowerOutageActive(record, now = new Date()) {
  if (!record) return false;
  if (record.restoration_status === "restored") return false;

  const endTime = getOutageEndTime(record);
  if (endTime && now >= endTime) {
    return false; // Auto-lift: set time is met!
  }

  return record.restoration_status === "ongoing";
}

/**
 * usePowerInterruptionAdvisories
 *
 * Realtime hook that manages active power interruption advisories
 * and maps them to affected Palayan City barangays for map highlighting.
 * Automatically lifts outages when the set duration/time is met.
 */
export function usePowerInterruptionAdvisories(barangayGeoJSON = null) {
  const [powerRecords, setPowerRecords] = useState([]);
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
        .catch((err) => logger.warn("Failed to load barangay geojson for power hook:", err));
    }
  }, [geoJSONData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch power interruptions (exclude records explicitly marked 'restored')
      const { data: pwrData, error: pwrError } = await supabase
        .from("power_interruptions")
        .select("*")
        .neq("restoration_status", "restored")
        .order("interruption_date", { ascending: false });

      if (pwrError) logger.warn("Fetch power_interruptions:", pwrError);

      // Check if any ongoing records have met their set time and auto-lift them in DB
      const now = new Date();
      const expiredIds = (pwrData || [])
        .filter((r) => r.restoration_status !== "restored" && !isPowerOutageActive(r, now))
        .map((r) => r.id);

      if (expiredIds.length > 0) {
        supabase
          .from("power_interruptions")
          .update({ restoration_status: "restored", updated_at: now.toISOString() })
          .in("id", expiredIds)
          .then(() => logger.info("Auto-lifted expired power interruptions in DB:", expiredIds))
          .catch((e) => logger.warn("Failed to auto-lift in DB:", e));
      }

      // 2. Fetch active Power Interruption advisories
      const { data: advData, error: advError } = await supabase
        .from("advisories")
        .select("*")
        .eq("category", "Power Interruption")
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (advError) logger.warn("Fetch advisories for power:", advError);

      setPowerRecords(pwrData || []);
      setAdvisoryRecords(advData || []);
    } catch (err) {
      logger.error("usePowerInterruptionAdvisories error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime subscription to power_interruptions and advisories
  useEffect(() => {
    fetchData();

    const channelId = `power_advisories_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "power_interruptions" },
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
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Aggregate all active affected barangays and their metadata
  const affectedBarangayMap = useMemo(() => {
    const map = new Map();
    const now = new Date();

    // From power_interruptions table - ONLY active, un-lifted outages
    powerRecords.forEach((record) => {
      if (!isPowerOutageActive(record, now)) {
        return; // Auto-lifted: set time met or explicitly restored
      }

      // Check if this record explicitly targets the whole city
      const fLower = (record.feeders_affected || "").toLowerCase().trim();
      const dLower = (record.description || "").toLowerCase().trim();
      const isExplicitWholeCity =
        fLower === "whole palayan" ||
        fLower === "whole palayan city" ||
        fLower === "all 19 barangays" ||
        fLower === "all barangays" ||
        fLower === "city-wide" ||
        fLower === "citywide" ||
        dLower.includes("whole palayan city") ||
        dLower.includes("all 19 barangays");

      const endTime = getOutageEndTime(record);

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
              peakTime: record.peak_outage_time,
              duration: record.total_duration_minutes,
              endTime,
              households: record.total_affected_households,
              cause: record.cause,
              description: record.description,
              source: "NEECO Power Interruption Record",
              rawRecord: record,
            });
          }
        });
      } else {
        // Primary: feeders_affected column (stores selected barangays)
        const listFromFeeders = parseBarangayList(record.feeders_affected);
        // Only inspect description if feeders_affected has no parsed barangays, to prevent false positives
        const listFromDesc = listFromFeeders.length === 0 ? extractBarangaysFromText(record.description) : [];
        const combined = Array.from(new Set([...listFromFeeders, ...listFromDesc]));

        combined.forEach((bgyName) => {
          if (!map.has(bgyName)) {
            const coords = PALAYAN_BARANGAY_CENTROIDS[bgyName] || { lng: 121.0827, lat: 15.5398 };
            map.set(bgyName, {
              name: bgyName,
              lng: coords.lng,
              lat: coords.lat,
              status: "ongoing",
              date: record.interruption_date,
              peakTime: record.peak_outage_time,
              duration: record.total_duration_minutes,
              endTime,
              households: record.total_affected_households,
              cause: record.cause,
              description: record.description,
              source: "NEECO Power Interruption Record",
              rawRecord: record,
            });
          }
        });
      }
    });

    const hasActivePowerRecords = powerRecords.some((r) => isPowerOutageActive(r, now));

    // From advisories table - only active, non-restored alerts
    advisoryRecords.forEach((advisory) => {
      // If active power interruptions exist, skip NEECO sync advisories so powerRecords remains the source of truth
      const isNeecoSync = (advisory.title || "").includes("NEECO Power Interruption Advisory");
      if (hasActivePowerRecords && isNeecoSync) {
        return;
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
            description: advisory.title,
            content: advisory.content,
            source: "Official CDRRMO/NEECO Advisory",
            rawRecord: advisory,
          });
        }
      });
    });

    return map;
  }, [powerRecords, advisoryRecords, tick]);

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

    // 1. If 16 or more of the 19 barangays are affected, it is genuinely whole-city
    if (matchCount >= 16) return true;

    // 2. If specific barangays were selected (1 to 15 barangays), it is strictly a partial outage
    // (Never treat a 2-barangay selection as whole city!)
    if (matchCount > 0 && matchCount < 16) return false;

    // 3. Fallback only if no individual barangays were matched (matchCount === 0):
    // check if an active record explicitly specifies whole city as a single phrase
    const now = new Date();
    const hasExplicitWholeCityRecord = powerRecords.some((r) => {
      if (!isPowerOutageActive(r, now)) return false;
      const f = (r.feeders_affected || "").toLowerCase().trim();
      const d = (r.description || "").toLowerCase().trim();
      return (
        f === "whole palayan" ||
        f === "whole palayan city" ||
        f === "all 19 barangays" ||
        f === "all barangays" ||
        f === "city-wide" ||
        f === "citywide" ||
        d.includes("whole palayan city") ||
        d.includes("all 19 barangays")
      );
    });
    if (hasExplicitWholeCityRecord) return true;

    const hasActivePowerRecords = powerRecords.some((r) => isPowerOutageActive(r, now));
    if (!hasActivePowerRecords) {
      const hasExplicitWholeCityAdvisory = advisoryRecords.some((adv) => {
        const text = `${adv.title || ""} ${adv.content || ""}`.toLowerCase();
        if (text.includes("restored") || text.includes("lifted") || text.includes("cleared")) return false;
        return (
          text.includes("whole palayan city") ||
          text.includes("all 19 barangays") ||
          text.includes("city-wide power interruption")
        );
      });
      return hasExplicitWholeCityAdvisory;
    }

    return false;
  }, [affectedBarangays, powerRecords, advisoryRecords, tick]);

  // Unified display markers:
  // If all of the barangays are selected, collapse to ONE single clean "Whole Palayan City" marker in the center
  // Otherwise, display individual barangay markers
  const displayOutageMarkers = useMemo(() => {
    if (affectedBarangays.length === 0) return [];

    if (isWholeCity) {
      const now = new Date();
      const activeRecord = powerRecords.find((r) => isPowerOutageActive(r, now)) || advisoryRecords[0];
      const anyMeta = affectedBarangayOutages[0] || {};
      const totalHouseholds = affectedBarangayOutages.reduce(
        (sum, o) => sum + (parseInt(o.households, 10) || 0),
        0
      );

      return [
        {
          name: "Palayan City",
          isWholeCity: true,
          totalBarangays: PALAYAN_CITY_BARANGAYS.length,
          barangays: affectedBarangays,
          // Geographic center of Palayan City
          lng: 121.0965,
          lat: 15.5350,
          status: anyMeta.status || "ongoing",
          date: anyMeta.date || (activeRecord ? activeRecord.interruption_date : ""),
          peakTime: anyMeta.peakTime || (activeRecord ? activeRecord.peak_outage_time : ""),
          duration: anyMeta.duration || (activeRecord ? activeRecord.total_duration_minutes : ""),
          endTime: anyMeta.endTime,
          cause: anyMeta.cause || (activeRecord ? activeRecord.cause : "City-wide Power Interruption"),
          households: totalHouseholds || (activeRecord ? activeRecord.total_affected_households : 0),
          description: anyMeta.description || (activeRecord ? activeRecord.description : "City-wide power interruption affecting all barangays of Palayan City."),
          source: anyMeta.source || "NEECO Power Interruption Record",
          rawRecord: anyMeta.rawRecord || activeRecord,
        },
      ];
    }

    return affectedBarangayOutages;
  }, [isWholeCity, affectedBarangays, affectedBarangayOutages, powerRecords, advisoryRecords, tick]);

  // Construct GeoJSON FeatureCollection of highlighted barangay polygons
  const powerOutageGeoJSON = useMemo(() => {
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
            isPowerOutage: true,
            isWholeCity,
            outageStatus: meta.status || "ongoing",
            outageCause: meta.cause || "Power Interruption",
            outageDate: meta.date || "",
          },
        };
      });

    return { type: "FeatureCollection", features: matchedFeatures };
  }, [geoJSONData, affectedBarangays, affectedBarangayMap, isWholeCity]);

  return {
    loading,
    powerRecords,
    advisoryRecords,
    affectedBarangays,
    affectedBarangayOutages,
    displayOutageMarkers,
    isWholeCity,
    powerOutageGeoJSON,
    hasActiveAdvisories: affectedBarangays.length > 0,
    refetch: fetchData,
  };
}
