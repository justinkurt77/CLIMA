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
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "../context/ThemeContext";

const WEATHER_ICONS = {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
};

function getWeatherInfo(code, temp) {
  if (code === 0) return { msg: "Clear sky", icon: "Sun", high: temp + 2, low: temp - 5 };
  if ([1, 2].includes(code)) return { msg: "Mainly clear", icon: "CloudSun", high: temp + 2, low: temp - 5 };
  if (code === 3) return { msg: "Partly cloudy", icon: "Cloud", high: temp + 1, low: temp - 5 };
  if ([61, 63, 80, 81].includes(code)) return { msg: "Rain showers", icon: "CloudRain", high: temp + 1, low: temp - 4 };
  if ([95, 96, 99].includes(code)) return { msg: "Thunderstorm", icon: "CloudLightning", high: temp, low: temp - 4 };
  return { msg: "Partly cloudy", icon: "CloudSun", high: temp + 2, low: temp - 5 };
}

export default function HomeScreen({
  onOpenModal,
  userReports = [],
  session,
  userLocation,
  setActiveScreen,
}) {
  const { isDark, toggleTheme } = useTheme();
  const [currentTemp, setCurrentTemp] = useState(33);
  const [weatherInfo, setWeatherInfo] = useState({ msg: "Loading...", icon: "CloudSun", high: 35, low: 27 });
  const [humidity, setHumidity] = useState(68);
  const [windSpeed, setWindSpeed] = useState(12);
  const [hourlyData, setHourlyData] = useState([]);
  const [showReports, setShowReports] = useState(false);

  const firstName = session?.user?.user_metadata?.first_name;
  const displayName = firstName || "Palayano";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Live condition trend
  const liveWaveData = [
    { t: "6AM", v: 26 },
    { t: "8AM", v: 29 },
    { t: "10AM", v: 33 },
    { t: "12PM", v: Math.max(currentTemp - 2, 28) },
    { t: "2PM", v: currentTemp },
    { t: "4PM", v: currentTemp - 1 },
    { t: "6PM", v: currentTemp - 4 },
  ];

  const heatIndex =
    currentTemp >= 38 ? "Extreme Danger" :
    currentTemp >= 35 ? "Danger" :
    currentTemp >= 32 ? "Severe Warning" : "Caution";

  // 7-day forecast labels
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  const weeklyDays = Array.from({ length: 7 }, (_, i) => ({
    day: i === 0 ? "Today" : dayNames[(today + i) % 7],
    high: currentTemp + (i === 0 ? 2 : Math.round((Math.random() - 0.3) * 4 + 2)),
    low: currentTemp - Math.round(5 + Math.random() * 3),
    icon: i === 3 ? "CloudRain" : i === 5 ? "Cloud" : "Sun",
    rain: i === 3 ? "40%" : null,
    isToday: i === 0,
  }));

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
          setWindSpeed(Math.round(data.current_weather.windspeed));
        }
        if (data?.hourly) {
          const now = new Date().getHours();
          const temps = data.hourly.temperature_2m?.slice(now, now + 8) || [];
          const humidities = data.hourly.relativehumidity_2m?.slice(now, now + 8) || [];
          if (humidities.length > 0) setHumidity(Math.round(humidities[0]));
          setHourlyData(
            temps.map((temp, i) => ({
              time: i === 0 ? "Now" : `${(now + i) % 12 || 12}${(now + i) < 12 ? "AM" : "PM"}`,
              temp: Math.round(temp),
            }))
          );
        }
      })
      .catch(() => {});
  }, [userLocation]);

  const displayedHourly = hourlyData.length > 0
    ? hourlyData
    : [
        { time: "Now", temp: currentTemp },
        { time: "11AM", temp: currentTemp + 1 },
        { time: "12PM", temp: currentTemp + 2 },
        { time: "1PM", temp: currentTemp + 3 },
        { time: "2PM", temp: currentTemp + 2 },
        { time: "3PM", temp: currentTemp + 1 },
        { time: "4PM", temp: currentTemp },
        { time: "5PM", temp: currentTemp - 1 },
      ];

  // Recent reports
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
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
        fontFamily: "'Nunito', -apple-system, sans-serif",
        paddingBottom: 96,
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
      className="hide-scroll"
    >
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
          {/* Light / Dark Mode Toggle Button */}
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

          {/* Report Button */}
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

      {/* ── HERO WEATHER CARD ── */}
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
          {/* Subtle ambient glow behind temp */}
          <div
            style={{
              position: "absolute",
              top: -30,
              left: -30,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: isDark
                ? "radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(0, 0, 0, 0.04) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Top row: temp + heat index */}
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
              <div
                style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}
              >
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

      {/* ── HOURLY FORECAST ROW ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 22,
            padding: "16px 12px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
            transition: "all 0.25s ease",
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
            {displayedHourly.map((slot, idx) => {
              const isFirst = idx === 0;
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
                      ? (isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.07)")
                      : "transparent",
                    border: isFirst
                      ? (isDark ? "1px solid rgba(255, 255, 255, 0.24)" : "1px solid rgba(0, 0, 0, 0.12)")
                      : "1px solid transparent",
                    minWidth: 54,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: 11, color: isFirst ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isFirst ? 700 : 600 }}>
                    {slot.time}
                  </span>
                  <Sun size={20} color={isFirst ? "var(--text-primary)" : "var(--text-muted)"} strokeWidth={1.8} />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: isFirst ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {slot.temp}°
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 7-DAY FORECAST ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 22,
            border: "1px solid var(--border-subtle)",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
            transition: "all 0.25s ease",
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
                    ? (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)")
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

      {/* ── LIVE CONDITIONS TREND ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 22,
            padding: "18px 18px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
            transition: "all 0.25s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
              Live Conditions
            </span>
            <span
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.1)",
                color: "var(--text-primary)",
                fontSize: 10,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 12,
              }}
            >
              {heatIndex}
            </span>
          </div>

          <div style={{ width: "100%", height: 72, marginBottom: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveWaveData}>
                <Line
                  type="natural"
                  dataKey="v"
                  stroke={isDark ? "#ffffff" : "#09090b"}
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: isDark ? "#ffffff" : "#09090b", stroke: isDark ? "#000000" : "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: isDark ? "#ffffff" : "#09090b" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                  formatter={(v) => [`${v}°C`, "Temp"]}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
            Temperature trend today · Updated live
          </div>
        </div>
      </div>

      {/* ── MAP PREVIEW CARD ── */}
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
            transition: "all 0.25s ease",
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
              {userReports.length > 0 ? userReports.length : "12"} active incident reports
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
              boxShadow: "0 0 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Compass size={22} strokeWidth={2.2} />
          </div>
        </motion.div>
      </div>

      {/* ── RECENT REPORTS ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 22,
            border: "1px solid var(--border-subtle)",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
            transition: "all 0.25s ease",
          }}
        >
          {/* Header */}
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

          {/* Collapsed preview row */}
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
                          ? (isDark ? "#ffffff" : "#09090b")
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
  );
}
