import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import {
  PALAYAN_BARANGAY_CENTROIDS,
  matchesBarangay,
  parseBarangayList,
  extractBarangaysFromText,
} from "../lib/palayanBarangays";

/**
 * usePowerInterruptionAdvisories
 *
 * Realtime hook that manages active power interruption advisories
 * and maps them to affected Palayan City barangays for map highlighting.
 */
export function usePowerInterruptionAdvisories(barangayGeoJSON = null) {
  const [powerRecords, setPowerRecords] = useState([]);
  const [advisoryRecords, setAdvisoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoJSONData, setGeoJSONData] = useState(barangayGeoJSON);

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
      const today = new Date().toISOString().split("T")[0];

      // 1. Fetch active power interruptions (ongoing, partial, or recent within 24h)
      const { data: pwrData, error: pwrError } = await supabase
        .from("power_interruptions")
        .select("*")
        .or(`restoration_status.in.(ongoing,partial),interruption_date.gte.${today}`)
        .order("interruption_date", { ascending: false });

      if (pwrError) logger.warn("Fetch power_interruptions:", pwrError);

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

  // Aggregate all affected barangays and their metadata
  const affectedBarangayMap = useMemo(() => {
    const map = new Map();

    // From power_interruptions table
    powerRecords.forEach((record) => {
      // Primary: feeders_affected column (stores selected barangays)
      const listFromFeeders = parseBarangayList(record.feeders_affected);
      const listFromDesc = extractBarangaysFromText(record.description);
      const combined = Array.from(new Set([...listFromFeeders, ...listFromDesc]));

      combined.forEach((bgyName) => {
        if (!map.has(bgyName)) {
          const coords = PALAYAN_BARANGAY_CENTROIDS[bgyName] || { lng: 121.0827, lat: 15.5398 };
          map.set(bgyName, {
            name: bgyName,
            lng: coords.lng,
            lat: coords.lat,
            status: record.restoration_status || "ongoing",
            date: record.interruption_date,
            peakTime: record.peak_outage_time,
            duration: record.total_duration_minutes,
            households: record.total_affected_households,
            cause: record.cause,
            description: record.description,
            source: "NEECO Power Interruption Record",
            rawRecord: record,
          });
        }
      });
    });

    // From advisories table (if any additional barangays mentioned)
    advisoryRecords.forEach((advisory) => {
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
  }, [powerRecords, advisoryRecords]);

  const affectedBarangays = useMemo(() => {
    return Array.from(affectedBarangayMap.keys());
  }, [affectedBarangayMap]);

  const affectedBarangayOutages = useMemo(() => {
    return Array.from(affectedBarangayMap.values());
  }, [affectedBarangayMap]);

  // Construct GeoJSON FeatureCollection of highlighted barangay polygons
  const powerOutageGeoJSON = useMemo(() => {
    if (!geoJSONData || !geoJSONData.features || affectedBarangays.length === 0) {
      return { type: "FeatureCollection", features: [] };
    }

    const matchedFeatures = geoJSONData.features
      .filter((f) => {
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
            outageStatus: meta.status || "ongoing",
            outageCause: meta.cause || "Power Interruption",
            outageDate: meta.date || "",
          },
        };
      });

    return { type: "FeatureCollection", features: matchedFeatures };
  }, [geoJSONData, affectedBarangays, affectedBarangayMap]);

  return {
    loading,
    powerRecords,
    advisoryRecords,
    affectedBarangays,
    affectedBarangayOutages,
    powerOutageGeoJSON,
    hasActiveAdvisories: affectedBarangays.length > 0,
    refetch: fetchData,
  };
}
