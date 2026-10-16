import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import {
  MapPin,
  ChevronRight,
  Droplets,
  Wind,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Compass,
  Plus,
  ChevronDown,
  ChevronUp,
  Moon,
  Search,
  ArrowUp,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import {
  fetchKloudtechDashboard,
  fetchKloudtechActiveStations,
  adaptKloudtechTelemetry,
  KLOUDTECH_BASE_URL,
} from "../services/kloudtechService";
import KloudtechStationView from "../components/KloudtechStationView";
import LiveConditionsCard from "../components/dashboard/LiveConditionsCard";

const WEATHER_ICONS = {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Moon,
};

function getWeatherIcon(code, isDay = true) {
  if (code === 0) return isDay ? "Sun" : "Moon";
  if ([1, 2].includes(code)) return isDay ? "CloudSun" : "Moon";
  if (code === 3 || [45, 48, 71, 73, 75, 77].includes(code)) return "Cloud";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86].includes(code)) return "CloudRain";
  if ([95, 96, 99].includes(code)) return "CloudLightning";
  return isDay ? "Sun" : "Moon";
}

function getWeatherIconColor(iconName) {
  if (iconName === "Sun") return "#eab308";
  if (iconName === "CloudRain") return "#60a5fa";
  if (iconName === "CloudLightning") return "#f59e0b";
  if (iconName === "Moon") return "#a78bfa";
  return "#94a3b8";
}

function getWindDirectionText(dirOrDegree) {
  if (!dirOrDegree) return "East-Southeast";
  if (typeof dirOrDegree === "string") {
    const COMPASS_NAMES = {
      N: "North", NNE: "North-Northeast", NE: "Northeast", ENE: "East-Northeast",
      E: "East", ESE: "East-Southeast", SE: "Southeast", SSE: "South-Southeast",
      S: "South", SSW: "South-Southwest", SW: "Southwest", WSW: "West-Southwest",
      W: "West", WNW: "West-Northwest", NW: "Northwest", NNW: "North-Northwest",
    };
    return COMPASS_NAMES[dirOrDegree.toUpperCase()] || dirOrDegree;
  }
  if (typeof dirOrDegree === "number") {
    const sectors = ["North", "North-Northeast", "Northeast", "East-Northeast", "East", "East-Southeast", "Southeast", "South-Southeast", "South", "South-Southwest", "Southwest", "West-Southwest", "West", "West-Northwest", "Northwest", "North-Northwest"];
    const idx = Math.round(dirOrDegree / 22.5) % 16;
    return sectors[idx];
  }
  return "Variable Winds";
}

function getWeatherInfo(code, temp, high, low, isDay = true) {
  const h = high !== undefined ? Math.round(high) : Math.round(temp + 2);
  const l = low !== undefined ? Math.round(low) : Math.round(temp - 4);

  if (code === 0) return { msg: "Clear sky", sub: "with bright sunshine", icon: isDay ? "Sun" : "Moon", high: h, low: l };
  if ([1, 2].includes(code)) return { msg: "Partly cloudy", sub: "with gentle breeze", icon: isDay ? "CloudSun" : "Moon", high: h, low: l };
  if (code === 3) return { msg: "Overcast", sub: "with dense cloud cover", icon: "Cloud", high: h, low: l };
  if ([45, 48].includes(code)) return { msg: "Foggy", sub: "with reduced visibility", icon: "Cloud", high: h, low: l };
  if ([51, 53, 55, 56, 57].includes(code)) return { msg: "Light Drizzle", sub: "with cool breezes", icon: "CloudRain", high: h, low: l };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { msg: "Rain showers", sub: "with steady precipitation", icon: "CloudRain", high: h, low: l };
  if ([95, 96, 99].includes(code)) return { msg: "Thunderstorm", sub: "with lightning & gusts", icon: "CloudLightning", high: h, low: l };
  return { msg: "Partly cloudy", sub: "with pleasant breeze", icon: isDay ? "CloudSun" : "Moon", high: h, low: l };
}

/**
 * Standard NOAA / Rothfusz heat index calculation from temperature (°C) and relative humidity (%)
 */
export function calculateHeatIndex(tempC, humidity) {
  if (tempC == null || humidity == null) return tempC || 0;
  const tF = (tempC * 9) / 5 + 32;
  const rh = humidity;

  if (tF < 80) {
    const simpleHI = 0.5 * (tF + 61.0 + ((tF - 68.0) * 1.2) + (rh * 0.094));
    const finalC = ((simpleHI - 32) * 5) / 9;
    return Math.round(finalC * 10) / 10;
  }

  let hiF =
    -42.379 +
    2.04901523 * tF +
    10.14333127 * rh -
    0.22475541 * tF * rh -
    0.00683783 * tF * tF -
    0.05481717 * rh * rh +
    0.00122874 * tF * tF * rh +
    0.00085282 * tF * rh * rh -
    0.00000199 * tF * tF * rh * rh;

  if (rh < 13 && tF >= 80 && tF <= 112) {
    hiF -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tF - 95)) / 17);
  } else if (rh > 85 && tF >= 80 && tF <= 87) {
    hiF += ((rh - 85) / 10) * ((87 - tF) / 5);
  }

  const hiC = ((hiF - 32) * 5) / 9;
  return Math.round(hiC * 10) / 10;
}

export const PALAYAN_BARANGAYS = [
  { name: "Singalat", lat: 15.5717, lng: 121.0949, desc: "Agri-residential corridor" },
  { name: "Atate", lat: 15.5581, lng: 121.1121, desc: "Commercial & residential center" },
  { name: "Caimito", lat: 15.5490, lng: 121.0875, desc: "City Hall & Capitol district" },
  { name: "Ganaderia", lat: 15.5394, lng: 121.0903, desc: "Central community district" },
  { name: "Caballero", lat: 15.5354, lng: 121.1066, desc: "Eastern agricultural corridor" },
  { name: "Santolan", lat: 15.5340, lng: 121.0894, desc: "City proper urban sector" },
  { name: "Manacnac", lat: 15.5286, lng: 121.0689, desc: "Western plains & farm lands" },
  { name: "Malate", lat: 15.5450, lng: 121.0776, desc: "Riverside barangay zone" },
  { name: "Aulo", lat: 15.5087, lng: 121.0939, desc: "Southern agricultural community" },
  { name: "Mapait", lat: 15.5143, lng: 121.1108, desc: "Rolling hills & valley farms" },
  { name: "Marcos Village", lat: 15.5906, lng: 121.1096, desc: "Northern settlement district" },
  { name: "Imelda Valley", lat: 15.5742, lng: 121.1230, desc: "Eco-tourism & scenic valley" },
  { name: "Sapang Buho", lat: 15.5875, lng: 121.1283, desc: "Upland watershed community" },
  { name: "Popolon Pagas", lat: 15.5413, lng: 121.0471, desc: "Western boundary sector" },
  { name: "Maligaya", lat: 15.4753, lng: 121.1040, desc: "Military reservation zone" },
  { name: "Bagong Buhay", lat: 15.4590, lng: 121.1232, desc: "Resettlement community" },
  { name: "Doña Josefa", lat: 15.4494, lng: 121.1081, desc: "Southern foothills district" },
  { name: "Bo. Militar", lat: 15.4237, lng: 121.1008, desc: "Military base community" },
  { name: "Langka", lat: 15.4277, lng: 121.1521, desc: "Southeastern boundary district" },
];

const DEFAULT_HOURLY = [
  { time: "Now", temp: 28, icon: "Sun", rain: null, active: true },
  { time: "10 AM", temp: 29, icon: "Sun", rain: null },
  { time: "11 AM", temp: 30, icon: "CloudSun", rain: null },
  { time: "12 PM", temp: 31, icon: "CloudSun", rain: null },
  { time: "1 PM", temp: 31, icon: "CloudRain", rain: "30%" },
  { time: "2 PM", temp: 31, icon: "CloudRain", rain: "40%" },
  { time: "3 PM", temp: 30, icon: "Cloud", rain: null },
  { time: "4 PM", temp: 29, icon: "Cloud", rain: null },
];

const DEFAULT_WEEKLY = [
  { day: "Today", dayShort: "Fri", icon: "Sun", iconColor: "#eab308", high: 31, low: 24, rain: null, isToday: true },
  { day: "Sat", dayShort: "Sat", icon: "CloudLightning", iconColor: "#f59e0b", high: 31, low: 24, rain: "80%", isToday: false },
  { day: "Sun", dayShort: "Sun", icon: "CloudLightning", iconColor: "#f59e0b", high: 31, low: 25, rain: "70%", isToday: false },
  { day: "Mon", dayShort: "Mon", icon: "CloudSun", iconColor: "#94a3b8", high: 30, low: 25, rain: "40%", isToday: false },
  { day: "Tue", dayShort: "Tue", icon: "CloudRain", iconColor: "#60a5fa", high: 30, low: 24, rain: "60%", isToday: false },
  { day: "Wed", dayShort: "Wed", icon: "CloudRain", iconColor: "#60a5fa", high: 30, low: 24, rain: "50%", isToday: false },
  { day: "Thu", dayShort: "Thu", icon: "CloudSun", iconColor: "#94a3b8", high: 31, low: 23, rain: null, isToday: false },
];

export default function HomeScreen({
  onOpenModal,
  userReports = [],
  session,
  userLocation,
  setActiveScreen,
  refreshTrigger = 0,
}) {
  const { isDark, toggleTheme } = useTheme();
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTemp, setCurrentTemp] = useState(26);
  const [selectedBarangay, setSelectedBarangay] = useState("Popolon Pagas");
  const [activeCoords, setActiveCoords] = useState({ lat: 15.5413, lng: 121.0471 });

  // Smooth scroll listener for sticky header blur & scroll-to-top button
  useEffect(() => {
    const el = rootRef.current?.closest(".citizen-screen-view") || rootRef.current;
    if (!el) return;

    const handleScroll = () => {
      setIsScrolled(el.scrollTop > 15);
    };

    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);
  const [weatherInfo, setWeatherInfo] = useState({
    msg: "Clear sky",
    sub: "Live Meteorological Sensor • Palayan City",
    icon: "Moon",
    high: 31,
    low: 24,
  });
  const [humidity, setHumidity] = useState(85);
  const [windSpeed, setWindSpeed] = useState(1.2);
  const [windDirection, setWindDirection] = useState("North");
  const [rainChance, setRainChance] = useState(0);
  const [currentHeatIndex, setCurrentHeatIndex] = useState(27.8);
  const [pressure, setPressure] = useState("1007 hPa");
  const [uvIndex, setUvIndex] = useState(0);
  const [isDayTime, setIsDayTime] = useState(false);
  const [liveHistory, setLiveHistory] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState(DEFAULT_HOURLY);
  const [weeklyForecast, setWeeklyForecast] = useState(DEFAULT_WEEKLY);
  const [showReports, setShowReports] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [advisories, setAdvisories] = useState([]);
  const [showAdvisories, setShowAdvisories] = useState(true);
  const [barangayWeathers, setBarangayWeathers] = useState({});

  // Fetch all barangays real-time weather via KloudTech SEA IoT & meteorological sensors
  useEffect(() => {
    let isMounted = true;
    const fetchAllBarangaysWeather = async () => {
      const results = {};

      // 1. First, attempt to query KloudTech SEA IoT telemetry (ONLY if live and authenticated)
      try {
        const ktRes = await fetchKloudtechDashboard();
        if (ktRes.success && Array.isArray(ktRes.data) && ktRes.data.length > 0) {
          ktRes.data.forEach((item) => {
            const stName = item.station?.stationName || item.station?.city || "";
            const tel = item.telemetry;
            if (tel) {
              const adapted = adaptKloudtechTelemetry(tel);
              PALAYAN_BARANGAYS.forEach((bgy) => {
                const bgyLower = bgy.name.toLowerCase();
                const bgyWords = bgyLower.split(" ");
                const isMatch =
                  stName.toLowerCase().includes(bgyLower) ||
                  (item.station?.address && item.station.address.toLowerCase().includes(bgyLower)) ||
                  (Array.isArray(item.station?.barangays) && item.station.barangays.includes(bgy.name)) ||
                  bgyWords.some((w) => w.length >= 4 && stName.toLowerCase().includes(w));

                if (isMatch) {
                  results[bgy.name] = {
                    temp: adapted.temp,
                    condition: adapted.condition || bgy.desc,
                    isKloudtech: true,
                  };
                }
              });
            }
          });
        }
      } catch (e) {
        logger.warn("KloudTech telemetry fetch error:", e);
      }

      // 2. Fetch real-time weather for all remaining barangays
      const pendingBarangays = PALAYAN_BARANGAYS.filter((bgy) => !results[bgy.name]);
      if (pendingBarangays.length > 0) {
        const chunks = [];
        const chunkSize = 5;
        for (let i = 0; i < pendingBarangays.length; i += chunkSize) {
          chunks.push(pendingBarangays.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
          await Promise.all(
            chunk.map(async (bgy) => {
              try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${bgy.lat}&longitude=${bgy.lng}&current=temperature_2m,weather_code,is_day`;
                const res = await fetch(url);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.current) {
                  const t = Math.round(data.current.temperature_2m);
                  const isDay = data.current.is_day !== 0;
                  const info = getWeatherInfo(data.current.weather_code, t, t + 2, t - 4, isDay);
                  results[bgy.name] = {
                    temp: t,
                    condition: info.msg || bgy.desc,
                  };
                }
              } catch (e) {
                logger.error("Failed to fetch for", bgy.name);
              }
            })
          );
        }
      }

      if (isMounted) {
        setBarangayWeathers(results);
      }
    };
    
    fetchAllBarangaysWeather();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  const heroBgUrl = useMemo(() => {
    const icon = weatherInfo.icon;
    if (icon === "Sun" || icon === "CloudSun") {
      return isDark ? "/sunny_dark.webp" : "/sunny.webp";
    }
    if (icon === "CloudRain" || icon === "CloudLightning") {
      return isDark ? "/rainy_dark.webp" : "/rainy.webp";
    }
    if (icon === "Moon") {
      return "/night.webp";
    }
    return isDark ? "/stormy_dark.webp" : "/stormy_clouds.webp";
  }, [weatherInfo.icon, isDark]);

  const getHeroBackground = () => `url('${heroBgUrl}')`;

  // Preload weather background images for immediate smooth cross-fading in both themes
  useEffect(() => {
    [
      "/sunny.webp",
      "/rainy.webp",
      "/night.webp",
      "/stormy_clouds.webp",
      "/sunny_dark.webp",
      "/rainy_dark.webp",
      "/stormy_dark.webp",
      "/wind_radar.webp",
      "/wind_radar_light.webp",
    ].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const firstName = session?.user?.user_metadata?.first_name;
  const displayName = firstName || "Palayano";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Formatted date string (e.g., "Friday, January 4" or localized current date)
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Heat Index Label based on physical sensor reading or calculated index
  const heatIndex = useMemo(() => {
    const val =
      currentHeatIndex !== null && currentHeatIndex !== undefined
        ? currentHeatIndex
        : currentTemp >= 38 ? 45 : currentTemp >= 33 ? 38 : 28;
    if (val >= 52) return "Extreme Danger";
    if (val >= 42) return "Danger";
    if (val >= 33) return "Extreme Caution";
    if (val >= 27) return "Caution";
    return "Normal";
  }, [currentHeatIndex, currentTemp]);

  // Filter Palayan barangays by search input
  const filteredBarangays = useMemo(() => {
    if (!searchQuery.trim()) return PALAYAN_BARANGAYS;
    return PALAYAN_BARANGAYS.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectBarangay = (bgy) => {
    setSelectedBarangay(bgy.name);
    setActiveCoords({ lat: bgy.lat, lng: bgy.lng });
  };

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (filteredBarangays.length > 0) {
      handleSelectBarangay(filteredBarangays[0]);
      setShowSearchInput(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    const lat = activeCoords?.lat || userLocation?.lat || 15.5490;
    const lng = activeCoords?.lng || userLocation?.lng || 121.0875;

    // Atmospheric & forecast data fetch
    const fetchOpenMeteo = (isKloudtechLive = false, liveTemp = null, liveIcon = null) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,is_day,uv_index&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,uv_index,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&past_days=1&timezone=Asia%2FManila`;

      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (!data) return;

          if (data.current && !isKloudtechLive) {
            const cur = data.current;
            const t = Math.round(cur.temperature_2m);
            const code = cur.weather_code;
            const isDay = cur.is_day !== 0;
            setIsDayTime(isDay);

            setCurrentTemp(t);
            setWindSpeed(Math.round(cur.wind_speed_10m * 10) / 10 || 0.5);
            if (cur.wind_direction_10m !== undefined) {
              setWindDirection(getWindDirectionText(cur.wind_direction_10m));
            }
            if (cur.relative_humidity_2m !== undefined) {
              setHumidity(Math.round(cur.relative_humidity_2m));
            }
            if (cur.surface_pressure !== undefined) {
              setPressure(`${Math.round(cur.surface_pressure * 10) / 10} hPa`);
            }
            if (cur.uv_index !== undefined) {
              setUvIndex(cur.uv_index);
            }

            const hi = calculateHeatIndex(cur.temperature_2m, cur.relative_humidity_2m);
            setCurrentHeatIndex(hi);

            const todayHigh = data.daily?.temperature_2m_max?.[0] !== undefined
              ? Math.round(data.daily.temperature_2m_max[0])
              : t + 2;
            const todayLow = data.daily?.temperature_2m_min?.[0] !== undefined
              ? Math.round(data.daily.temperature_2m_min[0])
              : t - 4;

            if (data.daily?.precipitation_probability_max?.[0] !== undefined) {
              setRainChance(Math.round(data.daily.precipitation_probability_max[0]));
            }

            setWeatherInfo(getWeatherInfo(code, t, todayHigh, todayLow, isDay));
          }

          if (data.hourly?.time && data.hourly?.temperature_2m) {
            const currentTimeISO = data.current?.time || new Date().toISOString();
            const currentHourPrefix = currentTimeISO.slice(0, 13);
            let startIdx = data.hourly.time.findIndex((timeStr) => timeStr.startsWith(currentHourPrefix));
            if (startIdx === -1) {
              startIdx = data.hourly.time.length > 24 ? 24 : 0;
            }

            const slots = [];
            for (let i = 0; i < 8; i++) {
              const slotIdx = startIdx + i;
              if (slotIdx >= data.hourly.time.length) break;
              const timeStr = data.hourly.time[slotIdx];
              const hourNum = parseInt(timeStr.slice(11, 13), 10);
              const ampm = hourNum >= 12 ? "PM" : "AM";
              const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
              const isSlotDay = hourNum >= 6 && hourNum < 18;
              const slotCode = data.hourly.weather_code?.[slotIdx] ?? 0;
              const rainProb = data.hourly.precipitation_probability?.[slotIdx];

              slots.push({
                time: i === 0 ? "Now" : `${displayHour} ${ampm}`,
                temp: i === 0 && liveTemp !== null ? liveTemp : Math.round(data.hourly.temperature_2m[slotIdx]),
                icon: i === 0 && liveIcon ? liveIcon : getWeatherIcon(slotCode, isSlotDay),
                rain: rainProb && rainProb > 20 ? `${Math.round(rainProb)}%` : null,
                active: i === 0,
              });
            }
            if (slots.length > 0) setHourlyForecast(slots);

            // Construct 24-hour history slice for telemetry charts
            const historySlice = [];
            const historyStart = Math.max(0, startIdx - 23);
            for (let i = historyStart; i <= startIdx; i++) {
              const tStr = data.hourly.time[i];
              const dObj = new Date(tStr);
              const hourNum = dObj.getHours();
              const dayNum = dObj.getDate();
              const monthShort = dObj.toLocaleString("en-US", { month: "short" });
              const timeLabel = `${dayNum} ${monthShort} ${String(hourNum).padStart(2, "0")}:00`;
              const hourTemp = Math.round(data.hourly.temperature_2m[i] * 10) / 10;
              const hourRh = Math.round(data.hourly.relative_humidity_2m?.[i] || 75);
              const hourHI = calculateHeatIndex(hourTemp, hourRh);
              const hourPres = Math.round((data.hourly.surface_pressure?.[i] || 1010) * 10) / 10;
              const hourWind = Math.round((data.hourly.wind_speed_10m?.[i] || 5) * 10) / 10;
              const hourUv = data.hourly.uv_index?.[i] !== undefined ? data.hourly.uv_index[i] : 0;

              historySlice.push({
                time: timeLabel,
                temp: hourTemp,
                heatIndex: hourHI,
                humidity: hourRh,
                pressure: hourPres,
                wind: hourWind,
                uv: hourUv,
              });
            }
            if (historySlice.length > 0) {
              setLiveHistory(historySlice);
            }
          }

          if (data.daily?.time && data.daily?.weather_code) {
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const days = data.daily.time.slice(0, 7).map((dStr, idx) => {
              const [year, month, day] = dStr.split("-").map(Number);
              const dateObj = new Date(year, month - 1, day);
              const dayName = dayNames[dateObj.getDay()];
              const code = data.daily.weather_code[idx];
              const iconName = getWeatherIcon(code, true);
              const rainProb = data.daily.precipitation_probability_max?.[idx];

              return {
                day: idx === 0 ? "Today" : dayName,
                dayShort: dayName,
                icon: iconName,
                iconColor: getWeatherIconColor(iconName),
                high: Math.round(data.daily.temperature_2m_max[idx]),
                low: Math.round(data.daily.temperature_2m_min[idx]),
                rain: rainProb && rainProb > 20 ? `${Math.round(rainProb)}%` : null,
                isToday: idx === 0,
              };
            });
            if (days.length > 0) setWeeklyForecast(days);
          }
        })
        .catch((err) => {
          logger.warn("Forecast fetch error:", err);
        });
    };

    // Primary: Check KloudTech SEA IoT Telemetry first
    const fetchWeather = async () => {
      let isKloudtechLive = false;
      try {
        const ktRes = await fetchKloudtechDashboard();
        if (ktRes.success && Array.isArray(ktRes.data) && ktRes.data.length > 0) {
          const match = ktRes.data.find((item) => {
            const stName = (item.station?.stationName || item.station?.city || "").toLowerCase();
            const stAddress = (item.station?.address || "").toLowerCase();
            const bgyList = item.station?.barangays || [];
            const selLower = selectedBarangay.toLowerCase();
            const selWords = selLower.split(" ");
            return (
              stName.includes(selLower) ||
              stAddress.includes(selLower) ||
              bgyList.includes(selectedBarangay) ||
              selWords.some((w) => w.length >= 4 && (stName.includes(w) || stAddress.includes(w)))
            );
          });

          if (match && match.telemetry) {
            const adapted = adaptKloudtechTelemetry(match.telemetry);
            if (adapted.temp !== null) setCurrentTemp(adapted.temp);
            if (adapted.humidity !== null) setHumidity(adapted.humidity);
            if (adapted.windSpeed !== null) setWindSpeed(adapted.windSpeed);
            if (adapted.windDirection) setWindDirection(getWindDirectionText(adapted.windDirection));
            if (adapted.pressure) setPressure(adapted.pressure);
            if (adapted.heatIndex !== null) setCurrentHeatIndex(adapted.heatIndex);
            if (adapted.precip === 0) setRainChance(0);

            setWeatherInfo({
              msg: adapted.condition,
              sub: `KloudTech IoT • ${match.station?.stationName || "Live Sensor"}`,
              icon: adapted.icon,
              high: (adapted.temp || 30) + 2,
              low: (adapted.temp || 30) - 4,
            });
            isKloudtechLive = true;
            fetchOpenMeteo(true, adapted.temp, adapted.icon);
            return;
          }
        }
      } catch (err) {
        logger.warn("KloudTech telemetry error:", err);
      }

      fetchOpenMeteo(false);
    };

    fetchWeather();
  }, [userLocation, activeCoords, selectedBarangay, refreshTrigger]);

  // Fetch published advisories
  useEffect(() => {
    const fetchAdvisories = async () => {
      try {
        const { data, error } = await supabase
          .from("advisories")
          .select("*")
          .eq("status", "Published")
          .order("published_at", { ascending: false })
          .limit(5);
        
        if (!error && data) {
          setAdvisories(data);
        }
      } catch (err) {
        logger.error("Failed to fetch advisories:", err);
      }
    };

    fetchAdvisories();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("public_advisories")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "advisories",
          filter: "status=eq.Published",
        },
        () => {
          fetchAdvisories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const recentReports =
    userReports?.length > 0
      ? userReports.slice(0, 4)
      : [
          { id: "1", title: "Water Pump Shortage", location: "Brgy. Singalat", status: "pending" },
          { id: "2", title: "Paddy Crop Heat Stress", location: "Brgy. Atate", status: "inprogress" },
          { id: "3", title: "Irrigation Canal Blockage", location: "Brgy. Caimito", status: "resolved" },
        ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return {
          bg: "var(--accent-orange)",
          color: "#ffffff",
          border: "none",
          label: "Resolved",
          Icon: CheckCircle2,
        };
      case "inprogress":
        return {
          bg: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
          color: isDark ? "#ffffff" : "#09090b",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.12)",
          label: "In Progress",
          Icon: Clock,
        };
      default:
        return {
          bg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
          color: isDark ? "#a1a1aa" : "#71717a",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
          label: "Pending",
          Icon: AlertTriangle,
        };
    }
  };

  const formattedRecordedAt = useMemo(() => {
    const now = new Date();
    return (
      now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }) +
      " " +
      now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  }, [currentTemp, humidity, pressure]);

  const liveStationData = useMemo(() => {
    return {
      recordedAt: formattedRecordedAt,
      heatIndex: currentHeatIndex,
      temp: currentTemp,
      humidity: humidity,
      pressure: String(pressure).includes("hPa") ? pressure : `${pressure} hPa`,
      wind: `${windSpeed} kph ${windDirection?.charAt(0) || "N"}`,
      uv: uvIndex,
      light: isDayTime ? "52400.0 lux" : "0.0 lux",
      precip: `${rainChance > 0 ? (rainChance * 0.1).toFixed(1) : "0.0"} mm`,
      history: liveHistory,
      isLive: true,
    };
  }, [
    formattedRecordedAt,
    currentHeatIndex,
    currentTemp,
    humidity,
    pressure,
    windSpeed,
    windDirection,
    uvIndex,
    isDayTime,
    rainChance,
    liveHistory,
  ]);

  return (
    <div ref={rootRef} className="home-screen-root hide-scroll">
      {/* =========================================================================
          DESKTOP DASHBOARD (>= 1024px) - PIXEL PERFECT MATCH TO REFERENCE IMAGE
          ========================================================================= */}
      <div className="desktop-view-container">
        {/* TOP HEADER BAR */}
        <header
          ref={headerRef}
          className={`desktop-top-header ${isScrolled ? "scrolled-header" : ""}`}
        >
          {/* Frosted glass backdrop (smoothly activates on scroll) */}
          <div className="desktop-header-backdrop" aria-hidden="true" />

          {/* Left: Location & Date */}
          <div className="desktop-header-location">
            <div className="desktop-loc-row">
              <MapPin size={17} strokeWidth={2.4} className="desktop-loc-pin" />
              <span className="desktop-loc-city">Brgy. {selectedBarangay}, Palayan City</span>
            </div>
            <div className="desktop-loc-date">{formattedDate}</div>
          </div>

          {/* Right: Search, Report Button, and Theme Toggle */}
          <div className="desktop-header-actions">
            {/* Search Button & Expandable Input */}
            <div className="desktop-search-wrapper">
              <AnimatePresence>
                {showSearchInput && (
                  <form onSubmit={handleSearchSubmit} style={{ display: "inline-block" }}>
                    <motion.input
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      type="text"
                      placeholder="Search Palayan barangay..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="desktop-search-input"
                      autoFocus
                    />
                  </form>
                )}
              </AnimatePresence>
              <button
                className="desktop-circle-btn"
                onClick={() => {
                  if (showSearchInput && searchQuery.trim()) {
                    handleSearchSubmit();
                  } else {
                    setShowSearchInput((prev) => !prev);
                  }
                }}
                title="Search Location"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={2.2} />
              </button>
            </div>

            {/* Download / Report Action Pill Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenModal}
              className="desktop-report-btn"
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>Submit Report</span>
            </motion.button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="desktop-circle-btn"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={18} strokeWidth={2.2} color="#ffffff" />
              ) : (
                <Moon size={18} strokeWidth={2.2} color="#09090b" />
              )}
            </button>
          </div>
        </header>

        {/* 2-COLUMN MAIN DASHBOARD GRID */}
        <main className="desktop-main-grid">
          {/* ──── LEFT COLUMN (~62%) ──── */}
          <div className="desktop-left-column">
            {/* 1. HERO WEATHER CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 28, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="desktop-hero-card"
              style={{
                backgroundColor: "#161922",
              }}
            >
              {/* Dynamic Animated Background Transition */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={heroBgUrl}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url('${heroBgUrl}')`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                </AnimatePresence>
              </div>
              {/* Left Side: Large Temperature & Conditions */}
              <div className="desktop-hero-info">
                <div className="desktop-hero-temp">{currentTemp}°</div>
                <div className="desktop-hero-condition">{weatherInfo.msg}</div>
                <div className="desktop-hero-subcondition">{weatherInfo.sub}</div>

                <div className="desktop-hero-pills">
                  <span className="desktop-pill">H {weatherInfo.high}°</span>
                  <span className="desktop-pill">L {weatherInfo.low}°</span>
                </div>
              </div>

              {/* Right Side: Frosted Glass Floating Card */}
              <div className="desktop-hero-glass-card">
                <p>
                  With real time data and advanced technology, we provide reliable forecasts for any location around the world.
                </p>
              </div>
            </motion.div>

            {/* 2. HOURLY FORECAST ROW */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="desktop-hourly-card"
            >
              <div className="desktop-hourly-grid">
                {hourlyForecast.map((slot, idx) => {
                  const SlotIcon = WEATHER_ICONS[slot.icon] || Cloud;
                  return (
                    <div
                      key={idx}
                      className={`desktop-hourly-item ${slot.active ? "active-slot" : ""}`}
                    >
                      <div className="desktop-hourly-time">{slot.time}</div>
                      {slot.rain && (
                        <div className="desktop-hourly-rain">{slot.rain}</div>
                      )}
                      <div className="desktop-hourly-icon">
                        <SlotIcon size={22} strokeWidth={1.8} />
                      </div>
                      <div className="desktop-hourly-temp">{slot.temp}°</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* 3. 7-DAY FORECAST GRID */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="desktop-weekly-card"
            >
              <div className="desktop-weekly-grid">
                {weeklyForecast.map((slot, idx) => {
                  const SlotIcon = WEATHER_ICONS[slot.icon] || Sun;
                  return (
                    <div key={idx} className="desktop-weekly-col">
                      <div className="desktop-weekly-day">{slot.day}</div>
                      <div className="desktop-weekly-icon-wrap">
                        <SlotIcon
                          size={24}
                          strokeWidth={1.9}
                          style={{ color: slot.iconColor || "inherit" }}
                        />
                        {slot.rain && (
                          <span className="desktop-weekly-rain-badge">{slot.rain}</span>
                        )}
                      </div>
                      <div className="desktop-weekly-high">{slot.high}°</div>
                      <div className="desktop-weekly-low">{slot.low}°</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* ──── RIGHT COLUMN (~38%) ──── */}
          <div className="desktop-right-column">
            {/* 1. LIVE CONDITIONS CARD */}
            <LiveConditionsCard
              hourlyForecast={hourlyForecast}
              currentTemp={currentTemp}
              currentHeatIndex={currentHeatIndex}
              heatIndex={heatIndex}
              rainChance={rainChance}
              humidity={humidity}
              windSpeed={windSpeed}
              pressure={pressure}
              onOpenModal={onOpenModal}
            />

            {/* 2. PALAYAN BARANGAYS CARD */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="desktop-card desktop-recent-card"
            >
              <div className="desktop-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="desktop-card-title">Palayan Barangays</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 8,
                      background: "rgba(249, 115, 22, 0.12)",
                      color: "var(--accent-orange)",
                    }}
                  >
                    {filteredBarangays.length} Areas
                  </span>
                </div>
                <button
                  className="desktop-see-all-btn"
                  onClick={() => setActiveScreen("maps")}
                  title="View barangays on map"
                >
                  Map &gt;
                </button>
              </div>

              <div
                className="desktop-recent-list hide-scroll"
                style={{ maxHeight: 185, overflowY: "auto", paddingRight: 2 }}
              >
                {filteredBarangays.map((bgy) => {
                  const isCurrent = selectedBarangay.toLowerCase() === bgy.name.toLowerCase();
                  return (
                    <div
                      key={bgy.name}
                      className="desktop-recent-item"
                      onClick={() => handleSelectBarangay(bgy)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 14,
                        cursor: "pointer",
                        background: isCurrent
                          ? isDark
                            ? "rgba(249, 115, 22, 0.16)"
                            : "rgba(249, 115, 22, 0.08)"
                          : "transparent",
                        border: isCurrent
                          ? "1px solid rgba(249, 115, 22, 0.3)"
                          : "1px solid transparent",
                        transition: "all 0.2s ease",
                      }}
                      title={`Select Brgy. ${bgy.name}`}
                    >
                      <div className="desktop-recent-left">
                        <div
                          className="desktop-recent-icon-wrap"
                          style={{
                            background: isCurrent
                              ? "var(--accent-orange)"
                              : isDark
                              ? "rgba(255, 255, 255, 0.06)"
                              : "rgba(0, 0, 0, 0.04)",
                            color: isCurrent ? "#ffffff" : "var(--text-secondary)",
                          }}
                        >
                          <MapPin size={18} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="desktop-recent-city">Brgy. {bgy.name}</span>
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: "var(--accent-orange)",
                                  background: "rgba(249, 115, 22, 0.15)",
                                  padding: "1px 6px",
                                  borderRadius: 6,
                                  }}
                              >
                                Active
                              </span>
                            )}
                          </div>
                          <div className="desktop-recent-condition">
                            {barangayWeathers[bgy.name]?.condition || bgy.desc}
                          </div>
                        </div>
                      </div>
                      <div className="desktop-recent-temp">
                        {barangayWeathers[bgy.name]?.temp !== undefined 
                          ? `${barangayWeathers[bgy.name].temp}°` 
                          : `${currentTemp}°`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* 3. WIND MAP / RADAR CARD */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="desktop-card desktop-wind-card"
              onClick={() => setActiveScreen("maps")}
              title="Click to open interactive map"
            >
              {/* Dynamic Animated Background Transition for Wind Radar */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={isDark ? "wind-dark" : "wind-light"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: isDark ? "url('/wind_radar.webp')" : "url('/wind_radar_light.webp')",
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                </AnimatePresence>
              </div>

              <div className="desktop-wind-overlay">
                <div className="desktop-wind-content">
                  <div className="desktop-wind-title">Wind & Atmosphere</div>
                  <div className="desktop-wind-speed">{windSpeed} km/h</div>
                  <div className="desktop-wind-direction">{windDirection}</div>
                </div>

                {/* Circular Pin Action Button */}
                <div className="desktop-wind-pin-btn">
                  <MapPin size={20} strokeWidth={2.4} />
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* ──── KLOUDTECH IOT WEATHER STATION TELEMETRY & HISTORICAL CHARTS ──── */}
        <KloudtechStationView isDark={isDark} liveData={liveStationData} />

        {/* Floating Scroll-to-Top Command Button */}
        <AnimatePresence>
          {isScrolled && (
            <motion.button
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={() => {
                const el = rootRef.current?.closest(".citizen-screen-view") || rootRef.current;
                el?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="desktop-scroll-top-btn"
              title="Scroll back to top"
            >
              <ArrowUp size={15} strokeWidth={2.4} />
              <span>Top</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* =========================================================================
          MOBILE VIEW (< 1024px) - STREAMLINED CITIZEN MOBILE EXPERIENCE
          ========================================================================= */}
      <div className="mobile-view-container">
        {/* ── LOCATION + GREETING HEADER ── */}
        <div
          style={{
            padding: "20px 20px 0",
            paddingTop: "calc(20px + env(safe-area-inset-top, 0px))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              <MapPin size={13} color="var(--accent-orange)" strokeWidth={2.4} />
              <span>Brgy. {selectedBarangay}, Palayan City</span>
            </div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: -0.3 }}>
              {greeting}, {displayName}!
            </p>
          </div>

          {/* Action Controls: Theme Toggle & Report Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--bg-card)",
                border: "1px solid var(--border-medium)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-card)",
                transition: "all 0.2s ease",
              }}
            >
              {isDark ? (
                <Sun size={17} strokeWidth={2.2} color="#ffffff" />
              ) : (
                <Moon size={17} strokeWidth={2.2} color="#09090b" />
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onOpenModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--btn-primary-bg)",
                color: "var(--btn-primary-text)",
                border: "none",
                borderRadius: 22,
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px var(--accent-glow)",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >
              <Plus size={15} strokeWidth={3} color="var(--btn-primary-text)" />
              Report
            </motion.button>
          </div>
        </div>

        {/* ── OFFICIAL ADVISORIES SECTION ── */}
        {advisories.length > 0 && (
          <div style={{ padding: "14px 16px 0" }}>
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: 22,
                padding: "18px",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={18} color={isDark ? "#fbbf24" : "#f59e0b"} strokeWidth={2.4} />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      letterSpacing: -0.2,
                    }}
                  >
                    Official Advisories
                  </h3>
                </div>
                <button
                  onClick={() => setShowAdvisories(!showAdvisories)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  {showAdvisories ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              <AnimatePresence>
                {showAdvisories && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {advisories.map((advisory) => {
                        const getCategoryColor = (cat) => {
                          switch (cat) {
                            case "Weather":
                              return isDark ? "#60a5fa" : "#3b82f6";
                            case "Water":
                              return isDark ? "#06b6d4" : "#0891b2";
                            case "Power":
                              return isDark ? "#fbbf24" : "#f59e0b";
                            case "Health":
                              return isDark ? "#ef4444" : "#dc2626";
                            default:
                              return isDark ? "#a1a1aa" : "#71717a";
                          }
                        };

                        return (
                          <div
                            key={advisory.id}
                            style={{
                              background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                              border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
                              borderRadius: 16,
                              padding: "14px 16px",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <div
                                style={{
                                  width: 4,
                                  height: 40,
                                  borderRadius: 2,
                                  background: getCategoryColor(advisory.category),
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 6,
                                  }}
                                >
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 8,
                                      background: getCategoryColor(advisory.category) + "20",
                                      color: getCategoryColor(advisory.category),
                                      fontSize: 10,
                                      fontWeight: 800,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.3,
                                    }}
                                  >
                                    {advisory.category}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "var(--text-muted)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {new Date(advisory.published_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4
                                  style={{
                                    margin: "0 0 6px",
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: "var(--text-primary)",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {advisory.title}
                                </h4>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 13,
                                    color: "var(--text-muted)",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {/* Sanitize advisory content to prevent XSS */}
                                  {DOMPurify.sanitize(
                                    advisory.content.length > 120
                                      ? advisory.content.substring(0, 120) + "..."
                                      : advisory.content
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── MOBILE PALAYAN BARANGAYS SELECTOR ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>Palayan Barangays</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "rgba(249, 115, 22, 0.12)",
                  color: "var(--accent-orange)",
                }}
              >
                19 Areas
              </span>
            </div>
            <button
              onClick={() => setActiveScreen("maps")}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent-orange)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Map View ›
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}
            className="hide-scroll"
          >
            {PALAYAN_BARANGAYS.map((bgy) => {
              const isCurrent = selectedBarangay.toLowerCase() === bgy.name.toLowerCase();
              return (
                <button
                  key={bgy.name}
                  onClick={() => handleSelectBarangay(bgy)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: "pointer",
                    background: isCurrent
                      ? "var(--accent-orange)"
                      : isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(0, 0, 0, 0.04)",
                    color: isCurrent ? "#ffffff" : "var(--text-secondary)",
                    border: isCurrent
                      ? "1px solid var(--accent-orange)"
                      : isDark
                      ? "1px solid rgba(255, 255, 255, 0.1)"
                      : "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: isCurrent ? "0 2px 10px rgba(249, 115, 22, 0.3)" : "none",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={12} strokeWidth={isCurrent ? 2.6 : 2} />
                  <span>Brgy. {bgy.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MOBILE HERO WEATHER CARD ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <div
            style={{
              borderRadius: 28,
              padding: "26px 24px 22px",
              backgroundColor: "#161922",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "var(--shadow-card)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Dynamic Animated Background Transition */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: 0,
                pointerEvents: "none",
              }}
            >
              <AnimatePresence initial={false}>
                <motion.div
                  key={heroBgUrl}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url('${heroBgUrl}')`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              </AnimatePresence>
            </div>

            {/* Soft gradient for text legibility */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: isDark
                  ? "linear-gradient(180deg, rgba(10, 12, 16, 0.48) 0%, rgba(10, 12, 16, 0.15) 45%, rgba(10, 12, 16, 0.55) 100%)"
                  : "linear-gradient(180deg, rgba(10, 12, 16, 0.28) 0%, rgba(10, 12, 16, 0.05) 45%, rgba(10, 12, 16, 0.35) 100%)",
                zIndex: 1,
                pointerEvents: "none",
                transition: "background 0.5s ease",
              }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
              <div>
                <div
                  style={{
                    fontSize: 74,
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: -3.5,
                    color: "#ffffff",
                    textShadow: "0 3px 12px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  {currentTemp}°
                </div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: "#ffffff", textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)" }}>
                  {weatherInfo.msg}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#ffffff", fontWeight: 700, textShadow: "0 1px 6px rgba(0, 0, 0, 0.6)" }}>
                  Brgy. {selectedBarangay}, Palayan City
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    H {weatherInfo.high}°
                  </span>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    L {weatherInfo.low}°
                  </span>
                </div>
              </div>

              {/* Heat Index Badge */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                    marginBottom: 8,
                  }}
                >
                  {heatIndex}
                </div>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 14,
                    padding: "8px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 9, color: "rgba(255, 255, 255, 0.7)", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
                    HEAT INDEX
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#ffffff" }}>
                    {currentTemp + 6}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Sensor strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                position: "relative",
                zIndex: 1,
              }}
            >
              {[
                { Icon: Droplets, label: "Humidity", val: `${humidity}%` },
                { Icon: Wind, label: "Wind", val: `${windSpeed} km/h` },
                { Icon: Gauge, label: "Pressure", val: pressure },
              ].map(({ Icon, label, val }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      fontSize: 10,
                      color: "rgba(255, 255, 255, 0.7)",
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    <Icon size={12} color="#ffffff" />
                    {label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE HOURLY FORECAST ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 22,
              padding: "16px 12px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                paddingBottom: 2,
              }}
              className="hide-scroll"
            >
              {hourlyForecast.map((slot, idx) => {
                const isFirst = idx === 0;
                const SlotIcon = WEATHER_ICONS[slot.icon] || Cloud;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px",
                      borderRadius: 16,
                      background: isFirst
                        ? isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.07)"
                        : "transparent",
                      border: isFirst
                        ? isDark ? "1px solid rgba(255, 255, 255, 0.24)" : "1px solid rgba(0, 0, 0, 0.12)"
                        : "1px solid transparent",
                      minWidth: 54,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 11, color: isFirst ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isFirst ? 700 : 600 }}>
                      {slot.time}
                    </span>
                    <SlotIcon size={20} color={isFirst ? "var(--text-primary)" : "var(--text-muted)"} strokeWidth={1.8} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: isFirst ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {slot.temp}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MOBILE 7-DAY FORECAST ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 22,
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {weeklyForecast.map((d, idx) => {
              const Icon = WEATHER_ICONS[d.icon] || Sun;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 20px",
                    borderBottom: idx < 6 ? "1px solid var(--border-subtle)" : "none",
                    background: d.isToday
                      ? isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
                      : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: d.isToday ? 800 : 600,
                      color: d.isToday ? "var(--text-primary)" : "var(--text-secondary)",
                      width: 52,
                    }}
                  >
                    {d.day}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <Icon size={18} color={d.isToday ? "var(--text-primary)" : "var(--text-muted)"} strokeWidth={1.8} />
                    {d.rain && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-primary)",
                          fontWeight: 700,
                          background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                          padding: "2px 6px",
                          borderRadius: 6,
                        }}
                      >
                        {d.rain}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                      {d.high}°
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>
                      {d.low}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MOBILE MAP PREVIEW CARD ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveScreen("maps")}
            style={{
              borderRadius: 22,
              padding: "18px 20px",
              background: isDark
                ? "linear-gradient(145deg, #18181b 0%, #0d0d0f 100%)"
                : "linear-gradient(145deg, #ffffff 0%, #f4f4f6 100%)",
              border: "1px solid var(--border-medium)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                Community Map
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                Palayan Hotspots
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {userReports.length > 0 ? userReports.length : "12"} active climate reports
              </div>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
              }}
            >
              <Compass size={22} strokeWidth={2.2} />
            </div>
          </motion.div>
        </div>

        {/* ── MOBILE RECENT REPORTS ── */}
        <div style={{ padding: "14px 16px 0" }}>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 22,
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              onClick={() => setShowReports((p) => !p)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 18px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                Recent Reports
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveScreen("maps");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  See All ›
                </button>
                {showReports ? (
                  <ChevronUp size={16} color="var(--text-muted)" />
                ) : (
                  <ChevronDown size={16} color="var(--text-muted)" />
                )}
              </div>
            </div>

            <AnimatePresence>
              {showReports && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  {recentReports.map((r, i) => {
                    const badge = getStatusBadge(r.status);
                    const StatusIcon = badge.Icon;
                    return (
                      <div
                        key={r.id || i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 18px",
                          borderTop: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              background: "var(--bg-card-subtle)",
                              border: "1px solid var(--border-subtle)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--text-primary)",
                              flexShrink: 0,
                            }}
                          >
                            <StatusIcon size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                              {r.title || r.category}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                              {r.location || "Palayan City"}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            padding: "4px 8px",
                            borderRadius: 10,
                            background: badge.bg,
                            color: badge.color,
                            border: badge.border,
                            letterSpacing: 0.3,
                            flexShrink: 0,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {!showReports && (
              <div
                onClick={() => setShowReports(true)}
                style={{
                  padding: "0 18px 16px",
                  display: "flex",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                {recentReports.slice(0, 3).map((r, i) => {
                  const isResolved = r.status === "resolved";
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: "var(--bg-card-subtle)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 12,
                        padding: "8px 10px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: isResolved
                            ? isDark ? "#ffffff" : "#09090b"
                            : "var(--text-muted)",
                          boxShadow: isResolved ? `0 0 6px ${isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.3)"}` : "none",
                          margin: "0 auto 5px",
                        }}
                      />
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, lineHeight: 1.2 }}>
                        {r.title?.split(" ").slice(0, 2).join(" ") || r.category}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ──── KLOUDTECH IOT WEATHER STATION TELEMETRY & HISTORICAL CHARTS ──── */}
          <div style={{ marginTop: 20 }}>
            <KloudtechStationView isDark={isDark} liveData={liveStationData} />
          </div>
        </div>
      </div>
    </div>
  );
}
