import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}) {
  const { isDark, toggleTheme } = useTheme();
  const [currentTemp, setCurrentTemp] = useState(28);
  const [weatherInfo, setWeatherInfo] = useState({
    msg: "Clear sky",
    sub: "with bright sunshine",
    icon: "Sun",
    high: 31,
    low: 24,
  });
  const [humidity, setHumidity] = useState(78);
  const [windSpeed, setWindSpeed] = useState(12);
  const [pressure, setPressure] = useState("1008 hPa");
  const [hourlyForecast, setHourlyForecast] = useState(DEFAULT_HOURLY);
  const [weeklyForecast, setWeeklyForecast] = useState(DEFAULT_WEEKLY);
  const [showReports, setShowReports] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [advisories, setAdvisories] = useState([]);
  const [showAdvisories, setShowAdvisories] = useState(true);

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

  // Heat Index Label based on temperature
  const heatIndex =
    currentTemp >= 42 ? "Extreme Danger" :
    currentTemp >= 38 ? "Danger" :
    currentTemp >= 33 ? "Extreme Caution" :
    currentTemp >= 27 ? "Caution" : "Normal";

  useEffect(() => {
    const lat = userLocation?.lat || 15.5398;
    const lng = userLocation?.lng || 121.0827;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code,is_day&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!data) return;

        // 1. Current conditions
        if (data.current) {
          const cur = data.current;
          const t = Math.round(cur.temperature_2m);
          const code = cur.weather_code;
          const isDay = cur.is_day !== 0;

          setCurrentTemp(t);
          setWindSpeed(Math.round(cur.wind_speed_10m) || 12);
          if (cur.relative_humidity_2m !== undefined) {
            setHumidity(Math.round(cur.relative_humidity_2m));
          }
          if (cur.surface_pressure !== undefined) {
            setPressure(`${Math.round(cur.surface_pressure)} hPa`);
          }

          const todayHigh = data.daily?.temperature_2m_max?.[0] !== undefined
            ? Math.round(data.daily.temperature_2m_max[0])
            : t + 2;
          const todayLow = data.daily?.temperature_2m_min?.[0] !== undefined
            ? Math.round(data.daily.temperature_2m_min[0])
            : t - 4;

          setWeatherInfo(getWeatherInfo(code, t, todayHigh, todayLow, isDay));
        }

        // 2. Next 8 Hourly Forecast Slots
        if (data.hourly?.time && data.hourly?.temperature_2m) {
          const currentTimeISO = data.current?.time || new Date().toISOString();
          const currentHourPrefix = currentTimeISO.slice(0, 13);
          let startIdx = data.hourly.time.findIndex((timeStr) => timeStr.startsWith(currentHourPrefix));
          if (startIdx === -1) {
            startIdx = new Date().getHours();
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
              temp: Math.round(data.hourly.temperature_2m[slotIdx]),
              icon: getWeatherIcon(slotCode, isSlotDay),
              rain: rainProb && rainProb > 20 ? `${Math.round(rainProb)}%` : null,
              active: i === 0,
            });
          }
          if (slots.length > 0) setHourlyForecast(slots);
        }

        // 3. 7-Day Weekly Forecast
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
        console.warn("Open-Meteo forecast fetch error:", err);
      });
  }, [userLocation]);

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
        console.error("Failed to fetch advisories:", err);
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

  return (
    <div className="home-screen-root hide-scroll">
      {/* =========================================================================
          DESKTOP DASHBOARD (>= 1024px) - PIXEL PERFECT MATCH TO REFERENCE IMAGE
          ========================================================================= */}
      <div className="desktop-view-container">
        {/* TOP HEADER BAR */}
        <header className="desktop-top-header">
          {/* Left: Location & Date */}
          <div className="desktop-header-location">
            <div className="desktop-loc-row">
              <MapPin size={17} strokeWidth={2.4} className="desktop-loc-pin" />
              <span className="desktop-loc-city">Palayan City, Nueva Ecija, Philippines</span>
            </div>
            <div className="desktop-loc-date">{formattedDate}</div>
          </div>

          {/* Right: Search, Report Button, and Theme Toggle */}
          <div className="desktop-header-actions">
            {/* Search Button & Expandable Input */}
            <div className="desktop-search-wrapper">
              <AnimatePresence>
                {showSearchInput && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    type="text"
                    placeholder="Search city or barangay..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="desktop-search-input"
                    autoFocus
                  />
                )}
              </AnimatePresence>
              <button
                className="desktop-circle-btn"
                onClick={() => setShowSearchInput((prev) => !prev)}
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
            <div className="desktop-hero-card">
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
            </div>

            {/* 2. HOURLY FORECAST ROW */}
            <div className="desktop-hourly-card">
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
            </div>

            {/* 3. 7-DAY FORECAST GRID */}
            <div className="desktop-weekly-card">
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
            </div>
          </div>

          {/* ──── RIGHT COLUMN (~38%) ──── */}
          <div className="desktop-right-column">
            {/* 1. LIVE CONDITIONS CARD */}
            <div className="desktop-card desktop-live-conditions-card">
              <div className="desktop-card-header">
                <div className="desktop-card-title-row">
                  <span className="desktop-card-title">Live Conditions</span>
                  <ChevronRight size={17} className="desktop-chevron" />
                </div>
              </div>

              {/* Sub header: Rate & Dangerous Tag */}
              <div className="desktop-conditions-meta">
                <div className="desktop-rate-val">
                  <ArrowUp size={14} strokeWidth={2.6} />
                  <span>23.8%</span>
                </div>
                <div className="desktop-danger-badge">{heatIndex}</div>
              </div>

              {/* Smooth Gradient Wave with Glowing Marker */}
              <div className="desktop-wave-container">
                <svg
                  viewBox="0 0 320 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="desktop-wave-svg"
                >
                  <defs>
                    <linearGradient id="liveWaveGrad" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="85%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Flowing curve line matching screenshot */}
                  <path
                    d="M 6 62 C 60 62, 100 24, 160 30 C 215 36, 245 42, 275 22 C 290 12, 305 24, 316 28"
                    stroke="url(#liveWaveGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />

                  {/* Highlight marker dot on the wave */}
                  <circle
                    cx="275"
                    cy="22"
                    r="5.5"
                    fill="#ffffff"
                    stroke="#1e1e24"
                    strokeWidth="2.5"
                    filter="url(#glowFilter)"
                  />
                </svg>
              </div>

              {/* Bottom Sensor Stats (Humidity, Wind, Pressure) */}
              <div className="desktop-conditions-stats">
                <div className="desktop-stat-item">
                  <div className="desktop-stat-label">
                    <Droplets size={14} />
                    <span>{humidity}%</span>
                  </div>
                  <div className="desktop-stat-sub">Humidity</div>
                </div>

                <div className="desktop-stat-item">
                  <div className="desktop-stat-label">
                    <Compass size={14} />
                    <span>{windSpeed} km/h</span>
                  </div>
                  <div className="desktop-stat-sub">Wind</div>
                </div>

                <div className="desktop-stat-item">
                  <div className="desktop-stat-label">
                    <Gauge size={14} />
                    <span>{pressure}</span>
                  </div>
                  <div className="desktop-stat-sub">Pressure</div>
                </div>
              </div>
            </div>

            {/* 2. RECENTLY SEARCHED / RECENT REPORTS */}
            <div className="desktop-card desktop-recent-card">
              <div className="desktop-card-header">
                <span className="desktop-card-title">Recently Searched</span>
                <button
                  className="desktop-see-all-btn"
                  onClick={() => setActiveScreen("maps")}
                >
                  See All &gt;
                </button>
              </div>

              <div className="desktop-recent-list">
                {/* Item 1 */}
                <div
                  className="desktop-recent-item"
                  onClick={() => setActiveScreen("maps")}
                >
                  <div className="desktop-recent-left">
                    <div className="desktop-recent-icon-wrap">
                      <CloudSun size={20} color="#eab308" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="desktop-recent-city">Liverpool, UK</div>
                      <div className="desktop-recent-condition">Partly Cloudy</div>
                    </div>
                  </div>
                  <div className="desktop-recent-temp">16°</div>
                </div>

                {/* Item 2 */}
                <div
                  className="desktop-recent-item"
                  onClick={() => setActiveScreen("maps")}
                >
                  <div className="desktop-recent-left">
                    <div className="desktop-recent-icon-wrap">
                      <CloudRain size={20} color="#60a5fa" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="desktop-recent-city">Palermo, Italy</div>
                      <div className="desktop-recent-condition">Rain/Thunder</div>
                    </div>
                  </div>
                  <div className="desktop-recent-temp">-2°</div>
                </div>
              </div>
            </div>

            {/* 3. WIND MAP / RADAR CARD */}
            <div
              className="desktop-card desktop-wind-card"
              onClick={() => setActiveScreen("maps")}
              title="Click to open interactive map"
            >
              <div className="desktop-wind-overlay">
                <div className="desktop-wind-content">
                  <div className="desktop-wind-title">Wind Map</div>
                  <div className="desktop-wind-speed">{windSpeed} km/h</div>
                  <div className="desktop-wind-direction">Northwest</div>
                </div>

                {/* Circular Pin Action Button */}
                <div className="desktop-wind-pin-btn">
                  <MapPin size={20} strokeWidth={2.4} />
                </div>
              </div>
            </div>
          </div>
        </main>
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
              <MapPin size={13} color="var(--text-primary)" strokeWidth={2.2} />
              <span>Palayan City, Nueva Ecija</span>
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

        {/* ── MOBILE HERO WEATHER CARD ── */}
        <div style={{ padding: "16px 16px 0" }}>
          <div
            style={{
              borderRadius: 28,
              padding: "26px 24px 22px",
              background: isDark
                ? "linear-gradient(150deg, #161619 0%, #0d0d0f 60%, #060607 100%)"
                : "linear-gradient(150deg, #ffffff 0%, #f4f4f6 60%, #e9eaec 100%)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "var(--shadow-card)",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.25s ease",
            }}
          >

        {/* ── OFFICIAL ADVISORIES SECTION ── */}
        {advisories.length > 0 && (
          <div style={{ padding: "16px 16px 0" }}>
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
                                  {advisory.content.length > 120
                                    ? advisory.content.substring(0, 120) + "..."
                                    : advisory.content}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
              <div>
                <div
                  style={{
                    fontSize: 74,
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: -3.5,
                    color: "var(--text-primary)",
                  }}
                >
                  {currentTemp}°
                </div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                  {weatherInfo.msg}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                  Palayan City
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <span
                    style={{
                      background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    H {weatherInfo.high}°
                  </span>
                  <span
                    style={{
                      background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.05)",
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-muted)",
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
                    background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.12)",
                    color: "var(--text-primary)",
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
                    background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
                    borderRadius: 14,
                    padding: "8px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
                    HEAT INDEX
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)" }}>
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
                borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
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
                      color: "var(--text-muted)",
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    <Icon size={12} color="var(--text-primary)" />
                    {label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{val}</div>
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
        </div>
      </div>
    </div>
  );
}
