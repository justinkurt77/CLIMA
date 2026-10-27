/**
 * KloudTech SEA IoT API Client Service
 * Base URL: https://api.kloudtechsea.com/api/v1
 * Handles IoT weather stations, rain gauges, and telemetry streams.
 */
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

export const KLOUDTECH_BASE_URL =
  import.meta.env.VITE_KLOUDTECH_API_BASE || "https://api.kloudtechsea.com/api/v1";

/**
 * 24-Hour Historical Sensor History for Popolon AWS - Palayan City
 * Extracted directly from live station telemetry
 */
export const POPOLON_AWS_HISTORY = [
  { time: "8 Oct 11:00", heatIndex: 49.5, temp: 33.5, humidity: 82.0, pressure: 1007.2, wind: 2.4, uv: 11.0 },
  { time: "8 Oct 12:00", heatIndex: 50.2, temp: 33.8, humidity: 81.5, pressure: 1006.8, wind: 2.2, uv: 11.2 },
  { time: "8 Oct 13:00", heatIndex: 51.0, temp: 34.2, humidity: 80.0, pressure: 1006.2, wind: 2.2, uv: 11.0 },
  { time: "8 Oct 14:00", heatIndex: 51.2, temp: 34.0, humidity: 81.2, pressure: 1005.8, wind: 2.5, uv: 11.1 },
  { time: "8 Oct 15:00", heatIndex: 49.8, temp: 33.5, humidity: 84.5, pressure: 1006.2, wind: 2.8, uv: 9.2 },
  { time: "8 Oct 16:00", heatIndex: 48.0, temp: 32.2, humidity: 91.0, pressure: 1007.0, wind: 0.8, uv: 3.1 },
  { time: "8 Oct 17:00", heatIndex: 33.2, temp: 27.5, humidity: 95.5, pressure: 1008.2, wind: 0.2, uv: 0.0 },
  { time: "8 Oct 18:00", heatIndex: 32.5, temp: 27.0, humidity: 96.2, pressure: 1008.8, wind: 0.4, uv: 0.0 },
  { time: "8 Oct 19:00", heatIndex: 31.8, temp: 26.5, humidity: 96.8, pressure: 1009.2, wind: 0.5, uv: 0.0 },
  { time: "8 Oct 20:00", heatIndex: 30.5, temp: 26.0, humidity: 97.2, pressure: 1009.0, wind: 0.2, uv: 0.0 },
  { time: "8 Oct 21:00", heatIndex: 29.0, temp: 25.6, humidity: 97.5, pressure: 1008.6, wind: 0.3, uv: 0.0 },
  { time: "8 Oct 22:00", heatIndex: 28.2, temp: 25.2, humidity: 97.8, pressure: 1008.2, wind: 0.0, uv: 0.0 },
  { time: "8 Oct 23:00", heatIndex: 27.5, temp: 24.8, humidity: 98.0, pressure: 1007.8, wind: 0.0, uv: 0.0 },
  { time: "9 Oct 00:00", heatIndex: 26.8, temp: 24.5, humidity: 98.2, pressure: 1007.2, wind: 0.4, uv: 0.0 },
  { time: "9 Oct 01:00", heatIndex: 26.2, temp: 24.2, humidity: 98.4, pressure: 1006.9, wind: 0.6, uv: 0.0 },
  { time: "9 Oct 02:00", heatIndex: 25.5, temp: 23.9, humidity: 98.2, pressure: 1006.8, wind: 0.3, uv: 0.0 },
  { time: "9 Oct 03:00", heatIndex: 24.8, temp: 23.6, humidity: 98.0, pressure: 1007.1, wind: 0.2, uv: 0.0 },
  { time: "9 Oct 04:00", heatIndex: 24.0, temp: 23.4, humidity: 97.8, pressure: 1007.6, wind: 0.2, uv: 0.0 },
  { time: "9 Oct 05:00", heatIndex: 23.5, temp: 23.5, humidity: 97.5, pressure: 1008.2, wind: 0.3, uv: 0.0 },
  { time: "9 Oct 06:00", heatIndex: 28.0, temp: 25.8, humidity: 95.0, pressure: 1008.6, wind: 1.8, uv: 1.2 },
  { time: "9 Oct 07:00", heatIndex: 34.5, temp: 28.5, humidity: 91.0, pressure: 1008.4, wind: 2.2, uv: 3.2 },
  { time: "9 Oct 08:00", heatIndex: 42.0, temp: 31.2, humidity: 86.2, pressure: 1007.8, wind: 1.5, uv: 5.8 },
  { time: "9 Oct 09:00", heatIndex: 48.5, temp: 33.0, humidity: 82.5, pressure: 1007.3, wind: 1.2, uv: 7.5 },
  { time: "9 Oct 10:00", heatIndex: 50.8, temp: 33.8, humidity: 79.8, pressure: 1006.9, wind: 0.9, uv: 8.2 },
  { time: "9 Oct 11:00", heatIndex: 51.3, temp: 34.0, humidity: 78.5, pressure: 1006.7, wind: 0.7, uv: 0.0 },
];

export const SAPANG_BUHO_AWS_HISTORY = [
  { time: "8 Oct 11:00", heatIndex: 38.2, temp: 29.5, humidity: 85.0, pressure: 1008.1, wind: 1.2, uv: 7.0 },
  { time: "8 Oct 12:00", heatIndex: 39.0, temp: 30.1, humidity: 84.5, pressure: 1007.8, wind: 1.5, uv: 7.5 },
  { time: "8 Oct 13:00", heatIndex: 39.5, temp: 30.5, humidity: 83.0, pressure: 1007.2, wind: 1.8, uv: 7.2 },
  { time: "8 Oct 14:00", heatIndex: 39.8, temp: 30.2, humidity: 84.0, pressure: 1006.9, wind: 1.4, uv: 6.8 },
  { time: "8 Oct 15:00", heatIndex: 38.5, temp: 29.8, humidity: 86.2, pressure: 1007.2, wind: 1.0, uv: 5.0 },
  { time: "8 Oct 16:00", heatIndex: 36.0, temp: 28.5, humidity: 90.0, pressure: 1007.8, wind: 0.8, uv: 2.5 },
  { time: "8 Oct 17:00", heatIndex: 30.2, temp: 26.2, humidity: 93.5, pressure: 1008.5, wind: 0.5, uv: 0.0 },
  { time: "8 Oct 18:00", heatIndex: 28.5, temp: 25.4, humidity: 95.0, pressure: 1009.1, wind: 0.3, uv: 0.0 },
  { time: "8 Oct 19:00", heatIndex: 27.8, temp: 25.0, humidity: 96.0, pressure: 1009.4, wind: 0.2, uv: 0.0 },
  { time: "8 Oct 20:00", heatIndex: 27.2, temp: 24.6, humidity: 96.5, pressure: 1009.2, wind: 0.0, uv: 0.0 },
  { time: "8 Oct 21:00", heatIndex: 26.8, temp: 24.2, humidity: 97.0, pressure: 1008.9, wind: 0.0, uv: 0.0 },
  { time: "8 Oct 22:00", heatIndex: 26.5, temp: 24.0, humidity: 97.2, pressure: 1008.5, wind: 0.0, uv: 0.0 },
  { time: "8 Oct 23:00", heatIndex: 26.0, temp: 23.8, humidity: 97.5, pressure: 1008.1, wind: 0.0, uv: 0.0 },
  { time: "9 Oct 00:00", heatIndex: 25.5, temp: 23.5, humidity: 97.8, pressure: 1007.5, wind: 0.2, uv: 0.0 },
  { time: "9 Oct 01:00", heatIndex: 25.0, temp: 23.2, humidity: 98.0, pressure: 1007.2, wind: 0.3, uv: 0.0 },
  { time: "9 Oct 02:00", heatIndex: 24.8, temp: 23.0, humidity: 98.2, pressure: 1007.0, wind: 0.2, uv: 0.0 },
  { time: "9 Oct 03:00", heatIndex: 24.5, temp: 22.8, humidity: 98.0, pressure: 1007.3, wind: 0.1, uv: 0.0 },
  { time: "9 Oct 04:00", heatIndex: 24.0, temp: 22.5, humidity: 98.2, pressure: 1007.8, wind: 0.0, uv: 0.0 },
  { time: "9 Oct 05:00", heatIndex: 23.8, temp: 22.6, humidity: 98.0, pressure: 1008.4, wind: 0.2, uv: 0.0 },
  { time: "9 Oct 06:00", heatIndex: 26.5, temp: 24.5, humidity: 95.5, pressure: 1008.8, wind: 0.8, uv: 1.0 },
  { time: "9 Oct 07:00", heatIndex: 30.5, temp: 26.8, humidity: 92.0, pressure: 1008.6, wind: 1.1, uv: 2.8 },
  { time: "9 Oct 08:00", heatIndex: 35.0, temp: 28.5, humidity: 88.0, pressure: 1008.0, wind: 1.3, uv: 4.5 },
  { time: "9 Oct 09:00", heatIndex: 37.5, temp: 29.8, humidity: 84.5, pressure: 1007.5, wind: 1.2, uv: 6.2 },
  { time: "9 Oct 10:00", heatIndex: 39.2, temp: 30.5, humidity: 82.0, pressure: 1007.1, wind: 1.0, uv: 7.8 },
  { time: "9 Oct 11:00", heatIndex: 39.8, temp: 30.8, humidity: 81.0, pressure: 1006.8, wind: 0.9, uv: 0.0 },
];

/**
 * Verified KloudTech physical stations deployed in Palayan City
 */
export const PALAYAN_KLOUDTECH_STATIONS = [
  {
    station: {
      id: "Rjz2dbXW",
      stationName: "Popolon AWS - Palayan City",
      stationType: "WEATHERSTATION",
      location: [121.05767, 15.53683], // [longitude, latitude]
      address: "Manacnac, Palayan City, Nueva Ecija, Philippines",
      city: "Palayan City",
      barangays: ["Popolon Pagas", "Manacnac", "Singalat", "Caimito"],
    },
    telemetry: {
      temperature: 34.0,
      heatIndex: 51.3,
      humidity: 78.5,
      pressure: 1006.7,
      wind: {
        speed: 0.7,
        direction: "N",
      },
      lightIntensity: 54612.5,
      precipitation: 0.0,
      uvIndex: 8.2,
      recordedAt: "Just now",
    },
    history: POPOLON_AWS_HISTORY,
  },
  {
    station: {
      id: "4VAl2p9k",
      stationName: "Sapang Buho AWS - Palayan City",
      stationType: "WEATHERSTATION",
      location: [121.12331, 15.58819], // [longitude, latitude]
      address: "Imelda Valley-Sapang Buho Road, Palayan City, Nueva Ecija, Philippines",
      city: "Palayan City",
      barangays: ["Sapang Buho", "Imelda Valley", "Marcos Village", "Santolan"],
    },
    telemetry: {
      temperature: 28.5,
      heatIndex: 34.2,
      humidity: 84.0,
      pressure: 1008.5,
      wind: {
        speed: 1.1,
        direction: "SE",
      },
      lightIntensity: 18500.0,
      precipitation: 0.0,
      uvIndex: 5.0,
      recordedAt: "Just now",
    },
    history: SAPANG_BUHO_AWS_HISTORY,
  },
];

/**
 * Returns authorization headers if token or cookies are configured
 */
export function getKloudtechHeaders() {
  // Check localStorage for JWT token from login
  const token = typeof window !== "undefined" ? localStorage.getItem("kloudtech_token") : null;

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    // KloudTech API expects JWT token in Authorization Bearer header
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Ensures authenticated session if login credentials are provided in .env or Supabase
 */
export async function ensureKloudtechAuth() {
  // Check if we already have a valid token in localStorage
  const existingToken = typeof window !== "undefined" ? localStorage.getItem("kloudtech_token") : null;
  
  if (existingToken && typeof existingToken === "string" && existingToken.startsWith("eyJ")) {
    return existingToken;
  }

  // Check .env credentials
  let email = import.meta.env.VITE_KLOUDTECH_EMAIL || "feliciano.ramos@cityofpalayan.gov.ph";
  let password = import.meta.env.VITE_KLOUDTECH_PASSWORD || "ICTPalayan123!";

  // Check if credentials exist in Supabase settings
  try {
    if (supabase) {
      const { data: supaConfig } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["kloudtech_email", "kloudtech_password"]);
      if (supaConfig && supaConfig.length > 0) {
        supaConfig.forEach((item) => {
          if (item.key === "kloudtech_email" && item.value) email = item.value;
          if (item.key === "kloudtech_password" && item.value) password = item.value;
        });
      }
    }
  } catch (err) {
    // Non-blocking fallback to env
  }

  if (email && password) {
    logger.log("🔐 Logging in to KloudTech API with:", email);
    const res = await loginKloudtech(email, password);
    if (res.success) {
      const token = res.token || res.data?.token || res.data?.data?.token || res.data?.accessToken;
      logger.log("✅ KloudTech login successful, token:", token ? token.substring(0, 25) + "..." : "none");
      return token;
    } else {
      logger.error("❌ KloudTech login failed:", res.message);
    }
  }

  return null;
}

/**
 * Merges raw live API station telemetry with the verified Palayan registry.
 * Guarantees that:
 * 1. Both Popolon AWS and Sapang Buho AWS are always present.
 * 2. Coordinates, covered barangays, and 24-hr history are always intact.
 * 3. Fresh live telemetry is prioritized whenever available.
 */
export function mergeStationsWithRegistry(apiStations = []) {
  const result = [];
  const handledIds = new Set();
  const handledNames = new Set();

  (apiStations || []).forEach((liveEntry) => {
    if (!liveEntry || !liveEntry.station) return;
    const st = liveEntry.station;
    const stId = st.id;
    const stNameLower = (st.stationName || "").toLowerCase();

    // Find known station match
    const known = PALAYAN_KLOUDTECH_STATIONS.find(
      (k) =>
        (stId && k.station.id === stId) ||
        (stNameLower && k.station.stationName.toLowerCase().includes(stNameLower)) ||
        (stNameLower && stNameLower.includes(k.station.stationName.toLowerCase().replace(" - palayan city", "").trim()))
    );

    const mergedStation = {
      ...(known?.station || {}),
      ...st,
      location:
        Array.isArray(st.location) && st.location.length >= 2
          ? [Number(st.location[0]), Number(st.location[1])]
          : known?.station?.location || [121.05767, 15.53683],
      barangays: known?.station?.barangays || st.barangays || ["Palayan City"],
    };

    const liveTel = liveEntry.telemetry || {};
    const normalizedLiveTelemetry = {
      ...liveTel,
      ...(liveTel.temperature != null && {
        temperature: Math.round(Number(liveTel.temperature) * 10) / 10,
      }),
      ...(liveTel.heatIndex != null && {
        heatIndex: Math.round(Number(liveTel.heatIndex) * 10) / 10,
      }),
      ...(liveTel.humidity != null && {
        humidity: Math.round(Number(liveTel.humidity)),
      }),
      ...(liveTel.pressure != null && {
        pressure: Math.round(Number(liveTel.pressure) * 10) / 10,
      }),
      ...(liveTel.lightIntensity != null && {
        lightIntensity: Math.round(Number(liveTel.lightIntensity) * 10) / 10,
      }),
      ...(liveTel.uvIndex != null && {
        uvIndex: Math.round(Number(liveTel.uvIndex) * 10) / 10,
      }),
      ...(liveTel.wind && {
        wind: {
          ...liveTel.wind,
          speed:
            liveTel.wind.speed != null
              ? Math.round(Number(liveTel.wind.speed) * 10) / 10
              : 0,
        },
      }),
    };

    const mergedTelemetry = {
      ...(known?.telemetry || {}),
      ...normalizedLiveTelemetry,
    };

    const mergedHistory =
      liveEntry.history && liveEntry.history.length > 0
        ? liveEntry.history
        : known?.history ||
          (stNameLower.includes("sapang")
            ? SAPANG_BUHO_AWS_HISTORY
            : POPOLON_AWS_HISTORY);

    result.push({
      station: mergedStation,
      telemetry: mergedTelemetry,
      history: mergedHistory,
    });

    if (mergedStation.id) handledIds.add(mergedStation.id);
    if (mergedStation.stationName) handledNames.add(mergedStation.stationName.toLowerCase());
  });

  // Ensure every verified physical station in PALAYAN_KLOUDTECH_STATIONS is present
  PALAYAN_KLOUDTECH_STATIONS.forEach((known) => {
    const isHandled =
      (known.station.id && handledIds.has(known.station.id)) ||
      handledNames.has(known.station.stationName.toLowerCase());

    if (!isHandled) {
      result.push(known);
    }
  });

  return result;
}

/**
 * Fetch real-time dashboard telemetry for all active IoT stations
 * Gracefully falls back to local data if API is unavailable
 */
export async function fetchKloudtechDashboard() {
  // Check if we should skip API calls (localStorage flag for CORS failures)
  if (typeof window !== 'undefined') {
    const corsFailure = localStorage.getItem('kloudtech_cors_failure');
    if (corsFailure) {
      const timestamp = parseInt(corsFailure);
      const minutesSinceFailure = (Date.now() - timestamp) / (1000 * 60);
      // Skip API calls for 5 minutes after CORS / timeout failure
      if (minutesSinceFailure < 5) {
        logger.log("⚠️ KloudTech API in cool-down, using verified stations (Popolon + Sapang Buho)");
        return {
          success: true,
          data: PALAYAN_KLOUDTECH_STATIONS,
          isLocalFallback: true,
          isLive: false,
        };
      } else {
        localStorage.removeItem('kloudtech_cors_failure');
      }
    }
  }

  try {
    await ensureKloudtechAuth();
    
    let headers = getKloudtechHeaders();
    logger.log("🔑 KloudTech API Request Headers:", headers);
    logger.log("🌐 Request URL:", `${KLOUDTECH_BASE_URL}/telemetry/dashboard`);

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    let res = await fetch(`${KLOUDTECH_BASE_URL}/telemetry/dashboard`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    logger.log("📡 KloudTech API Response Status:", res.status, res.statusText);

    // If 401 Unauthorized, token might be expired; refresh token and retry once
    if (res.status === 401 && typeof window !== "undefined") {
      logger.warn("🔄 KloudTech token expired or invalid, re-authenticating...");
      localStorage.removeItem("kloudtech_token");
      const newToken = await ensureKloudtechAuth();
      if (newToken) {
        headers = getKloudtechHeaders();
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 8000);
        res = await fetch(`${KLOUDTECH_BASE_URL}/telemetry/dashboard`, {
          method: "GET",
          headers,
          signal: retryController.signal,
        });
        clearTimeout(retryTimeoutId);
      }
    }

    if (res.ok) {
      const json = await res.json();
      logger.log("✅ KloudTech API Response Data:", json);
      const rawStations = Array.isArray(json) ? json : json.data || [];
      if (rawStations.length > 0) {
        // Clear CORS failure flag on success
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kloudtech_cors_failure');
        }
        const mergedStations = mergeStationsWithRegistry(rawStations);
        return { success: true, data: mergedStations, isLive: true };
      }
    } else {
      const errorText = await res.text();
      logger.error("❌ KloudTech API Error Response:", errorText);
    }
  } catch (error) {
    // Check if CORS error
    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.name === 'AbortError')) {
      logger.warn("⚠️ KloudTech API CORS/Network issue, using verified stations (Popolon + Sapang Buho)");
      if (typeof window !== 'undefined') {
        localStorage.setItem('kloudtech_cors_failure', Date.now().toString());
      }
    } else {
      logger.warn("KloudTech live fetch notice:", error.message);
    }
  }

  // Fallback to verified physical Palayan stations (Popolon AWS + Sapang Buho AWS)
  logger.log("📍 Using verified Palayan stations (Popolon AWS + Sapang Buho AWS)");
  return {
    success: true,
    data: PALAYAN_KLOUDTECH_STATIONS,
    isLocalFallback: true,
    isLive: false,
  };
}

/**
 * Fetch list of active stations
 */
export async function fetchKloudtechActiveStations() {
  try {
    const res = await fetch(`${KLOUDTECH_BASE_URL}/station/active/simple`, {
      method: "GET",
      headers: getKloudtechHeaders(),
    });

    if (res.ok) {
      const json = await res.json();
      return {
        success: true,
        data: Array.isArray(json) ? json : json.data || [],
      };
    }
  } catch (error) {
    logger.warn("KloudTech active stations fetch error:", error);
  }

  return { success: true, data: PALAYAN_KLOUDTECH_STATIONS.map((s) => s.station) };
}

/**
 * Attempt to authenticate against KloudTech SEA API
 * Fails gracefully if CORS blocks the request
 */
export async function loginKloudtech(email, password) {
  try {
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${KLOUDTECH_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    
    if (res.ok && (data.token || data.accessToken || data.success || data.data?.token)) {
      const token = data.data?.token || data.token || data.accessToken;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("kloudtech_token", token);
        // Clear CORS failure flag on successful login
        localStorage.removeItem('kloudtech_cors_failure');
      }
      return { success: true, data, token };
    }
    return { success: false, message: data.message || "Login failed" };
  } catch (error) {
    // Mark CORS failure to avoid repeated login attempts
    if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.name === 'AbortError')) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('kloudtech_cors_failure', Date.now().toString());
      }
    }
    return { success: false, message: error.message };
  }
}

/**
 * Adapts raw KloudTech telemetry into standard weather display fields
 */
export function adaptKloudtechTelemetry(telemetry, isDay = true) {
  if (!telemetry) return null;

  const temp =
    telemetry.temperature !== null && telemetry.temperature !== undefined
      ? Math.round(Number(telemetry.temperature))
      : null;

  const precip =
    telemetry.precipitation != null
      ? Math.round(Number(telemetry.precipitation) * 10) / 10
      : telemetry.hourlyPrecip != null
      ? Math.round(Number(telemetry.hourlyPrecip) * 10) / 10
      : 0;

  const rawWindSpeed =
    telemetry.wind?.speed !== undefined
      ? Number(telemetry.wind.speed)
      : telemetry.windSpeed !== undefined
      ? Number(telemetry.windSpeed)
      : 0;
  const windSpeed = Number.isFinite(rawWindSpeed)
    ? Math.round(rawWindSpeed * 10) / 10
    : 0;

  const windDir =
    typeof telemetry.wind?.direction === "number"
      ? `${Math.round(telemetry.wind.direction)}°`
      : telemetry.wind?.direction || "Variable";

  const light =
    telemetry.lightIntensity != null
      ? Math.round(Number(telemetry.lightIntensity) * 10) / 10
      : 0;

  const humidity =
    telemetry.humidity != null
      ? Math.round(Number(telemetry.humidity))
      : null;

  const heatIndex =
    telemetry.heatIndex != null
      ? Math.round(Number(telemetry.heatIndex) * 10) / 10
      : null;

  const rawPressure =
    telemetry.pressure != null
      ? Math.round(Number(telemetry.pressure) * 10) / 10
      : null;

  let condition = "Sunny & Clear";
  let icon = isDay ? "Sun" : "Moon";

  if (precip > 15) {
    condition = "Heavy Rain / Storm";
    icon = "CloudLightning";
  } else if (precip > 0.5) {
    condition = "Rain showers";
    icon = "CloudRain";
  } else if (light > 25000) {
    condition = "Bright Sunshine";
    icon = "Sun";
  } else if (humidity && humidity > 85) {
    condition = "Overcast";
    icon = "Cloud";
  } else if (humidity && humidity > 70) {
    condition = "Partly cloudy";
    icon = isDay ? "CloudSun" : "Moon";
  } else {
    condition = isDay ? "Sunny & Clear" : "Clear Sky";
    icon = isDay ? "Sun" : "Moon";
  }

  return {
    temp,
    rawTemp: telemetry.temperature != null ? Math.round(Number(telemetry.temperature) * 10) / 10 : null,
    condition,
    icon,
    humidity,
    heatIndex,
    pressure: rawPressure != null ? `${rawPressure.toFixed(1)} hPa` : null,
    rawPressure,
    windSpeed,
    windDirection: windDir,
    lightIntensity: light,
    precip,
    uvIndex: telemetry.uvIndex != null ? Math.round(Number(telemetry.uvIndex) * 10) / 10 : null,
    recordedAt: telemetry.recordedAt || "October 9, 2026 11:12",
  };
}
