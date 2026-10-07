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
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

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
          bg: "#ffffff",
          color: "#000000",
          border: "none",
          label: "Resolved",
          Icon: CheckCircle2,
        };
      case "inprogress":
        return {
          bg: "rgba(255, 255, 255, 0.12)",
          color: "#ffffff",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          label: "In Progress",
          Icon: Clock,
        };
      default:
        return {
          bg: "rgba(255, 255, 255, 0.05)",
          color: "#a1a1aa",
          border: "1px solid rgba(255, 255, 255, 0.1)",
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
        background: "#000000",
        color: "#ffffff",
        fontFamily: "'Nunito', -apple-system, sans-serif",
        paddingBottom: 96,
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
              color: "#a1a1aa",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            <MapPin size={13} color="#ffffff" strokeWidth={2.2} />
            <span>Palayan City, Nueva Ecija</span>
          </div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#ffffff", letterSpacing: -0.3 }}>
            {greeting}, {displayName}!
          </p>
        </div>

        {/* Modern Black & White Report Button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onOpenModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#ffffff",
            color: "#000000",
            border: "none",
            borderRadius: 22,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(255, 255, 255, 0.18)",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        >
          <Plus size={15} strokeWidth={3} color="#000000" />
          Report
        </motion.button>
      </div>

      {/* ── HERO WEATHER CARD ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <div
          style={{
            borderRadius: 28,
            padding: "26px 24px 22px",
            background: "linear-gradient(150deg, #161619 0%, #0d0d0f 60%, #060607 100%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle monochrome ambient glow behind temp */}
          <div
            style={{
              position: "absolute",
              top: -30,
              left: -30,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%)",
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
                  color: "#ffffff",
                }}
              >
                {currentTemp}°
              </div>
              <div
                style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: "#f4f4f5" }}
              >
                {weatherInfo.msg}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#71717a", fontWeight: 600 }}>
                Palayan City
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
                    color: "#a1a1aa",
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
                <div style={{ fontSize: 9, color: "#71717a", fontWeight: 800, letterSpacing: 0.5, marginBottom: 4 }}>
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
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
                    color: "#71717a",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  <Icon size={12} color="#ffffff" />
                  {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f4f4f5" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOURLY FORECAST ROW ── */}
      <div style={{ padding: "14px 16px 0" }}>
        <div
          style={{
            background: "#101012",
            borderRadius: 22,
            padding: "16px 12px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
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
                      ? "rgba(255, 255, 255, 0.14)"
                      : "transparent",
                    border: isFirst ? "1px solid rgba(255, 255, 255, 0.24)" : "1px solid transparent",
                    minWidth: 54,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: 11, color: isFirst ? "#ffffff" : "#71717a", fontWeight: isFirst ? 700 : 600 }}>
                    {slot.time}
                  </span>
                  <Sun size={20} color={isFirst ? "#ffffff" : "#71717a"} strokeWidth={1.8} />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: isFirst ? "#ffffff" : "#a1a1aa",
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
            background: "#101012",
            borderRadius: 22,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
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
                  borderBottom: idx < 6 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                  background: d.isToday ? "rgba(255, 255, 255, 0.05)" : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: d.isToday ? 800 : 600,
                    color: d.isToday ? "#ffffff" : "#a1a1aa",
                    width: 52,
                  }}
                >
                  {d.day}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                  <Icon size={18} color={d.isToday ? "#ffffff" : "#71717a"} strokeWidth={1.8} />
                  {d.rain && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#ffffff",
                        fontWeight: 700,
                        background: "rgba(255, 255, 255, 0.1)",
                        padding: "2px 6px",
                        borderRadius: 6,
                      }}
                    >
                      {d.rain}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                    {d.high}°
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#71717a" }}>
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
            background: "#101012",
            borderRadius: 22,
            padding: "18px 18px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
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
            <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
              Live Conditions
            </span>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
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
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  dot={{ r: 3, fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#ffffff" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#ffffff",
                  }}
                  formatter={(v) => [`${v}°C`, "Temp"]}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 11, color: "#71717a", textAlign: "center" }}>
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
            background: "linear-gradient(145deg, #18181b 0%, #0d0d0f 100%)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 4,
              }}
            >
              Community Map
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>
              Palayan Hotspots
            </div>
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
              {userReports.length > 0 ? userReports.length : "12"} active incident reports
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.08)",
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
            background: "#101012",
            borderRadius: 22,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
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
            <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
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
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                See All ›
              </button>
              {showReports ? (
                <ChevronUp size={16} color="#71717a" />
              ) : (
                <ChevronDown size={16} color="#71717a" />
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
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            flexShrink: 0,
                          }}
                        >
                          <StatusIcon size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5" }}>
                            {r.title || r.category}
                          </div>
                          <div style={{ fontSize: 11, color: "#71717a", marginTop: 1 }}>
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
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
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
                        background: isResolved ? "#ffffff" : "#71717a",
                        boxShadow: isResolved ? "0 0 6px rgba(255,255,255,0.7)" : "none",
                        margin: "0 auto 5px",
                      }}
                    />
                    <div style={{ fontSize: 10, color: "#a1a1aa", fontWeight: 600, lineHeight: 1.2 }}>
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
