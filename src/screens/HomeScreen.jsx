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

const WEATHER_ICONS = {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Moon,
};

function getWeatherInfo(code, temp) {
  if (code === 0) return { msg: "Clear sky", sub: "with bright sunshine", icon: "Sun", high: temp + 2, low: temp - 5 };
  if ([1, 2].includes(code)) return { msg: "Partly cloudy", sub: "with gentle breeze", icon: "CloudSun", high: temp + 2, low: temp - 5 };
  if (code === 3) return { msg: "Overcast", sub: "with partly cloudy", icon: "Cloud", high: temp + 1, low: temp - 5 };
  if ([61, 63, 80, 81].includes(code)) return { msg: "Rain showers", sub: "with cool winds", icon: "CloudRain", high: temp + 1, low: temp - 4 };
  if ([95, 96, 99].includes(code)) return { msg: "Stormy", sub: "with partly cloudy", icon: "CloudLightning", high: temp, low: temp - 4 };
  return { msg: "Stormy", sub: "with partly cloudy", icon: "CloudLightning", high: 29, low: 12 };
}

export default function HomeScreen({
  onOpenModal,
  userReports = [],
  session,
  userLocation,
  setActiveScreen,
}) {
  const { isDark, toggleTheme } = useTheme();
  const [currentTemp, setCurrentTemp] = useState(18);
  const [weatherInfo, setWeatherInfo] = useState({
    msg: "Stormy",
    sub: "with partly cloudy",
    icon: "CloudLightning",
    high: 29,
    low: 12,
  });
  const [humidity, setHumidity] = useState(78);
  const [windSpeed, setWindSpeed] = useState(12);
  const [hourlyData, setHourlyData] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

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

  // Heat Index Label
  const heatIndex =
    currentTemp >= 38 ? "Extreme Danger" :
    currentTemp >= 35 ? "Dangerous" :
    currentTemp >= 32 ? "Warning" : "Dangerous";

  // Live condition trend for mobile recharts
  const liveWaveData = [
    { t: "6AM", v: 15 },
    { t: "8AM", v: 17 },
    { t: "10AM", v: 18 },
    { t: "12PM", v: 20 },
    { t: "2PM", v: 19 },
    { t: "4PM", v: 18 },
    { t: "6PM", v: 16 },
  ];

  // Mobile 7-day forecast
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const weeklyDays = Array.from({ length: 7 }, (_, i) => ({
    day: i === 0 ? "Today" : dayNames[(today + i) % 7],
    high: i === 0 ? 29 : Math.round(24 + (i % 3) * 2),
    low: i === 0 ? 12 : Math.round(10 + (i % 2) * 2),
    icon: i === 3 ? "CloudRain" : i === 5 ? "Cloud" : "Sun",
    rain: i === 3 ? "40%" : null,
    isToday: i === 0,
  }));

  // Desktop specific 8 hourly forecast slots matching reference photo
  const desktopHourly = [
    { time: "Now", temp: currentTemp, icon: "Cloud", rain: null, active: true },
    { time: "2 PM", temp: 19, icon: "Cloud", rain: null },
    { time: "3 PM", temp: 20, icon: "Cloud", rain: null },
    { time: "4 PM", temp: 20, icon: "CloudRain", rain: "60%" },
    { time: "5 PM", temp: 19, icon: "CloudRain", rain: "60%" },
    { time: "6 PM", temp: 18, icon: "Cloud", rain: null },
    { time: "7 PM", temp: 17, icon: "Cloud", rain: null },
    { time: "8 PM", temp: 16, icon: "Moon", rain: null },
  ];

  // Desktop specific 7-day forecast matching reference photo
  const desktopWeekly = [
    { day: "Sun", icon: "Sun", high: 28, low: 12, rain: null, iconColor: "#eab308" },
    { day: "Mon", icon: "CloudSun", high: 26, low: 11, rain: null, iconColor: "#94a3b8" },
    { day: "Tue", icon: "Cloud", high: 27, low: 12, rain: null, iconColor: "#94a3b8" },
    { day: "Wed", icon: "CloudRain", high: 23, low: 13, rain: "60%", iconColor: "#60a5fa" },
    { day: "Thu", icon: "Cloud", high: 30, low: 14, rain: null, iconColor: "#94a3b8" },
    { day: "Fri", icon: "CloudSun", high: 23, low: 10, rain: null, iconColor: "#94a3b8" },
    { day: "Sat", icon: "Sun", high: 24, low: 9, rain: null, iconColor: "#eab308" },
  ];

  useEffect(() => {
    const lat = userLocation?.lat || 15.5398;
    const lng = userLocation?.lng || 121.0827;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current_weather) {
          const t = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          setCurrentTemp(t);
          setWeatherInfo(getWeatherInfo(code, t));
          setWindSpeed(Math.round(data.current_weather.windspeed) || 12);
        }
        if (data?.hourly) {
          const now = new Date().getHours();
          const humidities = data.hourly.relativehumidity_2m?.slice(now, now + 8) || [];
          if (humidities.length > 0) setHumidity(Math.round(humidities[0]));
        }
      })
      .catch(() => {});
  }, [userLocation]);

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
          bg: isDark ? "#ffffff" : "#09090b",
          color: isDark ? "#000000" : "#ffffff",
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
                {desktopHourly.map((slot, idx) => {
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
                {desktopWeekly.map((slot, idx) => {
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
                <div className="desktop-danger-badge">Dangerous</div>
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
                    <span>1 kPa</span>
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
                boxShadow: "var(--shadow-card)",
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
                { Icon: Gauge, label: "Pressure", val: "1 kPa" },
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
              {desktopHourly.map((slot, idx) => {
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
            {weeklyDays.map((d, idx) => {
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
