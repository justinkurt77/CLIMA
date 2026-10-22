import { useEffect, useState } from "react";
import {
  fetchKloudtechDashboard,
  PALAYAN_KLOUDTECH_STATIONS,
} from "../services/kloudtechService";
import { logger } from "../lib/logger";

/**
 * Live operational data for the admin command map.
 *
 *  - KloudTech IoT stations     → polled every 60 s
 *  - Open-Meteo (current+30d)   → polled every 10 min (also backs up the station feed)
 *  - Barangay boundaries        → loaded once; used for real city area / bounds / point-in-polygon
 *  - OpenStreetMap facilities   → hospitals, fire stations, police inside the city (cached 24 h)
 *
 * Nothing in here is hard-coded sample data. Anything that cannot be fetched is
 * returned as null / empty so the UI can say "unavailable" instead of faking it.
 */

const PALAYAN_CENTER = { lat: 15.5413, lng: 121.0471 }; // Popolon AWS
const STATION_POLL_MS = 60 * 1000;
const WEATHER_POLL_MS = 10 * 60 * 1000;
const FACILITY_CACHE_KEY = "clima_osm_facilities_v1";
const FACILITY_CACHE_MS = 24 * 60 * 60 * 1000;

/** PAGASA heat index classification with soft pastel aesthetics */
export function getHeatRisk(heatIndex, isDark = true) {
  const hi = Number(heatIndex);
  if (heatIndex === null || heatIndex === undefined || Number.isNaN(hi)) {
    return {
      label: "No data",
      color: isDark ? "#a1a1aa" : "#71717a",
      bg: isDark ? "rgba(161, 161, 170, 0.14)" : "rgba(244, 244, 246, 0.9)",
      border: isDark ? "rgba(161, 161, 170, 0.3)" : "rgba(212, 212, 216, 0.8)",
      level: -1,
    };
  }
  if (hi >= 52) {
    return {
      label: "Extreme Danger",
      // Authoritative emergency red
      color: isDark ? "#ef4444" : "#dc2626",
      bg: isDark ? "rgba(239, 68, 68, 0.16)" : "rgba(239, 68, 68, 0.1)",
      border: isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(220, 38, 38, 0.3)",
      level: 4,
    };
  }
  if (hi >= 42) {
    return {
      label: "Danger",
      // Soft pastel apricot / peach
      color: isDark ? "#fdba74" : "#ea580c",
      bg: isDark ? "rgba(251, 146, 60, 0.16)" : "rgba(255, 237, 213, 0.9)",
      border: isDark ? "rgba(251, 146, 60, 0.35)" : "rgba(253, 186, 116, 0.75)",
      level: 3,
    };
  }
  if (hi >= 33) {
    return {
      label: "Extreme Caution",
      // Soft pastel amber / butter
      color: isDark ? "#fde68a" : "#d97706",
      bg: isDark ? "rgba(251, 191, 36, 0.16)" : "rgba(254, 243, 199, 0.9)",
      border: isDark ? "rgba(251, 191, 36, 0.35)" : "rgba(252, 211, 77, 0.75)",
      level: 2,
    };
  }
  if (hi >= 27) {
    return {
      label: "Caution",
      // Soft pastel lemon / cream
      color: isDark ? "#fef08a" : "#ca8a04",
      bg: isDark ? "rgba(250, 204, 21, 0.15)" : "rgba(254, 249, 195, 0.9)",
      border: isDark ? "rgba(250, 204, 21, 0.32)" : "rgba(253, 224, 71, 0.75)",
      level: 1,
    };
  }
  return {
    label: "Normal",
    // Soft pastel mint / sage
    color: isDark ? "#86efac" : "#16a34a",
    bg: isDark ? "rgba(74, 222, 128, 0.15)" : "rgba(220, 252, 231, 0.9)",
    border: isDark ? "rgba(74, 222, 128, 0.32)" : "rgba(134, 239, 172, 0.75)",
    level: 0,
  };
}

const num = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

function normalizeStation(entry) {
  const st = entry?.station || {};
  const t = entry?.telemetry || {};

  let location = null;
  if (Array.isArray(st.location) && st.location.length === 2) {
    location = [Number(st.location[0]), Number(st.location[1])];
  } else if (num(st.longitude) !== null && num(st.latitude) !== null) {
    location = [Number(st.longitude), Number(st.latitude)];
  } else if (num(st.lng) !== null && num(st.lat) !== null) {
    location = [Number(st.lng), Number(st.lat)];
  } else {
    // The dashboard endpoint does not always include coordinates – fall back to the verified registry.
    const known = PALAYAN_KLOUDTECH_STATIONS.find(
      (s) => s.station.id === st.id || s.station.stationName === st.stationName,
    );
    location = known?.station.location || null;
  }

  return {
    id: st.id || st.stationName || "station",
    name: st.stationName || "KloudTech Station",
    location,
    temp: num(t.temperature),
    heatIndex: num(t.heatIndex),
    humidity: num(t.humidity),
    pressure: num(t.pressure),
    wind: num(t.wind?.speed),
    uv: num(t.uvIndex),
    rain: num(t.precipitation ?? t.hourlyPrecip),
    recordedAt: t.recordedAt || t.timestamp || t.updatedAt || null,
  };
}

/* ── geometry helpers ── */
function ringContains(ring, lng, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonContains(polygon, lng, lat) {
  if (!polygon.length || !ringContains(polygon[0], lng, lat)) return false;
  for (let i = 1; i < polygon.length; i++) if (ringContains(polygon[i], lng, lat)) return false;
  return true;
}

function cityContains(features, lng, lat) {
  return features.some((f) => {
    const g = f.geometry;
    if (!g) return false;
    if (g.type === "Polygon") return polygonContains(g.coordinates, lng, lat);
    if (g.type === "MultiPolygon") return g.coordinates.some((p) => polygonContains(p, lng, lat));
    return false;
  });
}

function collectBounds(features) {
  let s = 90, w = 180, n = -90, e = -180;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      if (c[0] < w) w = c[0];
      if (c[0] > e) e = c[0];
      if (c[1] < s) s = c[1];
      if (c[1] > n) n = c[1];
    } else c.forEach(walk);
  };
  features.forEach((f) => f.geometry && walk(f.geometry.coordinates));
  return { south: s, west: w, north: n, east: e };
}

const FACILITY_TYPES = {
  hospital: { label: "Hospital", color: "#ef4444" },
  fire_station: { label: "Fire Station", color: "#f97316" },
  police: { label: "Police", color: "#3b82f6" },
};

async function fetchFacilities(bounds, features) {
  try {
    const cached = JSON.parse(localStorage.getItem(FACILITY_CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < FACILITY_CACHE_MS && Array.isArray(cached.items)) {
      return cached.items;
    }
  } catch {
    /* ignore corrupt cache */
  }

  const { south, west, north, east } = bounds;
  const query = `[out:json][timeout:25];nwr["amenity"~"^(hospital|fire_station|police)$"](${south},${west},${north},${east});out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = await res.json();

  const items = (json.elements || [])
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const type = FACILITY_TYPES[el.tags?.amenity];
      if (!type || lat === undefined || lng === undefined) return null;
      return {
        id: `${el.type}-${el.id}`,
        name: el.tags?.name || type.label,
        category: type.label,
        color: type.color,
        lat,
        lng,
      };
    })
    .filter(Boolean)
    .filter((f) => cityContains(features, f.lng, f.lat)); // only facilities actually inside Palayan City

  try {
    localStorage.setItem(FACILITY_CACHE_KEY, JSON.stringify({ at: Date.now(), items }));
  } catch {
    /* storage full / disabled */
  }
  return items;
}

export function useLiveOpsData() {
  const [stations, setStations] = useState({ list: [], isLive: false, fetchedAt: null, error: null });
  const [weather, setWeather] = useState({ current: null, daily: [], fetchedAt: null, error: null });
  const [city, setCity] = useState({ areaKm2: null, barangays: null, bounds: null });
  const [facilities, setFacilities] = useState({ items: [], status: "loading" });

  /* KloudTech stations – 60 s */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const result = await fetchKloudtechDashboard();
        if (cancelled) return;
        const isLive = !!result?.isLive && !result?.isLocalFallback;
        setStations({
          list: (result?.data || []).map(normalizeStation),
          isLive,
          fetchedAt: new Date(),
          error: null,
        });
      } catch (err) {
        logger.warn("Station poll failed:", err?.message);
        if (!cancelled) setStations((p) => ({ ...p, isLive: false, error: err?.message || "failed" }));
      }
    };
    load();
    const id = setInterval(load, STATION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  /* Open-Meteo – current conditions + last 30 days (rainfall) – 10 min */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${PALAYAN_CENTER.lat}&longitude=${PALAYAN_CENTER.lng}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,uv_index` +
          `&daily=precipitation_sum,temperature_2m_max&past_days=30&forecast_days=1` +
          `&timezone=Asia%2FManila&wind_speed_unit=ms`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        const daily = (json.daily?.time || []).map((date, i) => ({
          date,
          rain: json.daily.precipitation_sum?.[i] ?? 0,
          maxTemp: json.daily.temperature_2m_max?.[i] ?? null,
        }));
        setWeather({ current: json.current || null, daily, fetchedAt: new Date(), error: null });
      } catch (err) {
        logger.warn("Open-Meteo poll failed:", err?.message);
        if (!cancelled) setWeather((p) => ({ ...p, error: err?.message || "failed" }));
      }
    };
    load();
    const id = setInterval(load, WEATHER_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  /* City boundaries + OSM facilities – once */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/palayan-barangays.geojson");
        const geo = await res.json();
        const features = geo.features || [];
        const bounds = collectBounds(features);
        const areaM2 = features.reduce((sum, f) => sum + (Number(f.properties?.area_crs) || 0), 0);
        if (cancelled) return;
        setCity({
          areaKm2: areaM2 > 0 ? areaM2 / 1e6 : null,
          barangays: features.length,
          bounds,
        });

        try {
          const items = await fetchFacilities(bounds, features);
          if (!cancelled) setFacilities({ items, status: "ready" });
        } catch (err) {
          logger.warn("Facility lookup failed:", err?.message);
          if (!cancelled) setFacilities({ items: [], status: "error" });
        }
      } catch (err) {
        logger.warn("Boundary load failed:", err?.message);
        if (!cancelled) setFacilities({ items: [], status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stations, weather, city, facilities, center: PALAYAN_CENTER };
}
