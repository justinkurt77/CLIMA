import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquareWarning,
  AlertCircle,
  Thermometer,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  CloudSnow,
  CloudFog,
  CloudDrizzle,
} from "lucide-react";

const G1 = "#2d8119"; // dark green for cards
const G2 = "#4aaa1f"; // solid medium green
const G3 = "#5fbc2e"; // bright green
const YELLOW = "#FFFFCC";

import ReportCard from "../components/ui/ReportCard";

export default function HomeScreen({
  onOpenModal,
  userReports = [],
  isMapFullView,
  session,
  userLocation,
}) {
  const [isMinimized, setIsMinimized] = useState(true);

  const allReports = [...(userReports || [])];

  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const dailyReports = allReports.filter((r) =>
    isToday(r.createdAt || r.created_at),
  );

  const total = dailyReports.length;
  const resolved = dailyReports.filter((r) => r.status === "resolved").length;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const recent = allReports; // Restored all reports for the drawer

  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const firstName = session?.user?.user_metadata?.first_name;
  const displayName = firstName ? `${firstName}!` : "Palayano!";

  const [locationName, setLocationName] = useState("Palayan City");
  const [weather, setWeather] = useState({
    temp: "--",
    msg: "Loading...",
    icon: "CloudSun",
  });

  useEffect(() => {
    // Weather fetch
    const lat = userLocation?.lat || 15.5415;
    const lng = userLocation?.lng || 121.0509;

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.current_weather) {
          const code = data.current_weather.weathercode;
          const temp = Math.round(data.current_weather.temperature);

          let msg = "Partly cloudy";
          let icon = "Cloud";
          if (code === 0) {
            msg = "Clear";
            icon = "Sun";
          } else if ([1, 2, 3].includes(code)) {
            msg = "Mainly clear";
            icon = "CloudSun";
          } else if ([45, 48].includes(code)) {
            msg = "Fog";
            icon = "CloudFog";
          } else if ([51, 53, 55].includes(code)) {
            msg = "Drizzle";
            icon = "CloudDrizzle";
          } else if ([61, 63, 65].includes(code)) {
            msg = "Rain";
            icon = "CloudRain";
          } else if ([71, 73, 75].includes(code)) {
            msg = "Snow";
            icon = "CloudSnow";
          } else if ([80, 81, 82].includes(code)) {
            msg = "Showers";
            icon = "CloudRain";
          } else if ([95, 96, 99].includes(code)) {
            msg = "Storm";
            icon = "CloudLightning";
          }

          setWeather({ temp, msg, icon });
        }
      })
      .catch((err) => console.log("Weather error:", err));

    // Reverse geocode
    if (userLocation?.lat && userLocation?.lng) {
      const token = import.meta.env.VITE_MAPBOX_TOKEN || "";
      if (token) {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${userLocation.lng},${userLocation.lat}.json?access_token=${token}&limit=1`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.features && data.features.length > 0) {
              const feature = data.features[0];
              let city = "Palayan City";
              if (feature.context) {
                for (const ctx of feature.context) {
                  if (ctx.id.startsWith("place") || ctx.id.startsWith("locality")) {
                    city = ctx.text;
                    break;
                  }
                }
              }
              setLocationName(city);
            }
          })
          .catch((err) => console.log("Geocoding error:", err));
      } else {
        setLocationName("Palayan City");
      }
    }
  }, [userLocation]);

  return (
    // Full-screen absolute overlay — transparent middle so map shows through
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none", // let map interactions pass through transparent areas
      }}
    >
      {/* ── TOP: Floating Green Island (Header + Stats) ──────────────────── */}
      <AnimatePresence>
        {!isMapFullView && (
          <motion.div
            layoutId="header-search-morph"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.7,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{
              position: "relative",
              zIndex: 10,
              background: "rgba(74, 94, 54, 0.95)", // Unified mossy green
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 32,
              margin: "8px",
              marginTop: "calc(8px + env(safe-area-inset-top, 0px))",
              padding: "16px 20px",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              pointerEvents: "auto",
            }}
          >
        {/* Header content and Weather Widget inline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          {/* Header left side (text container) */}
          <div>
            <div style={{ marginBottom: 2 }}>
              <div
                style={{
                  fontFamily: "'Baloo 2', cursive",
                  fontSize: 20,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                <span style={{ color: YELLOW }}>Pala</span>
                <span style={{ color: "white" }}>Sumbong</span>
              </div>
            </div>
            <div
              style={{
                color: "white",
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              {greeting}, {displayName}
            </div>
            <div
              style={{
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MapPin size={14} color="white" />
              {locationName}
            </div>
          </div>

          {/* Weather Pill */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: 20,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Thermometer size={14} color="#F97316" strokeWidth={2.5} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#4B5563" }}>
                {weather.temp}°C
              </span>
            </div>
            <div style={{ width: 1, height: 14, background: "#D1D5DB" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {weather.icon === "Sun" && (
                <Sun size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              {weather.icon === "CloudSun" && (
                <CloudSun size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              {weather.icon === "Cloud" && (
                <Cloud size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              {weather.icon === "CloudRain" && (
                <CloudRain size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              {weather.icon === "CloudLightning" && (
                <CloudLightning size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              {weather.icon === "CloudSnow" && (
                <CloudSnow size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              {weather.icon === "CloudFog" && (
                <CloudFog size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              {weather.icon === "CloudDrizzle" && (
                <CloudDrizzle size={14} color="#4B5563" strokeWidth={2.5} />
              )}
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>
                {weather.msg}
              </span>
            </div>
          </div>
        </div>

        {/* Stats card inside the green island */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.25)",
            borderRadius: 24,
            padding: "8px 6px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {[
            { num: total, label: "Reports" },
            { num: resolved, label: "Resolved" },
            { num: `${rate}%`, label: "Rate" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{ flex: 1, display: "flex", alignItems: "center" }}
            >
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "rgba(255,255,255,0.4)",
                  }}
                />
              )}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    color: "white",
                    fontSize: 15,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {stat.num}
                </div>
                <div
                  style={{
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* ── ACTIONS AREA: CTA + Recent Reports Drawer (Below Header) ─────────────────── */}
      <div
        style={{
          padding: "0 8px",
          pointerEvents: isMapFullView ? "none" : "auto",
          transform: isMapFullView ? "translateY(-50%)" : "translateY(0)",
          opacity: isMapFullView ? 0 : 1,
          transition:
            "transform 0.4s cubic-bezier(0.3, 1, 0.32, 1), opacity 0.3s",
          flexShrink: 0,
          position: "relative",
          display: "flex",
          gap: 12, // Space between CTA and Drawer
          alignItems: "flex-start", // Align them to top so drawer expands downwards
          zIndex: 20,
        }}
      >
        {/* Mag-Sumbong Button */}
        <button
          onClick={onOpenModal}
          style={{
            flex: "0 0 calc(100% - 162px)", // 150px drawer + 12px gap
            background: "#4B6043",
            border: "none",
            borderRadius: 32,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            height: 48,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={26} fill="white" color="white" />
            <div
              style={{
                position: "absolute",
                top: 4,
                left: "50%",
                transform: "translateX(-50%)",
                background: "white",
                borderRadius: "50%",
                padding: 1,
              }}
            >
              <AlertCircle
                size={13}
                color="#2e5716"
                fill="white"
                strokeWidth={3}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Mag-Sumbong
            </div>
          </div>

          <ChevronRight
            size={18}
            strokeWidth={2.5}
            color="white"
            style={{ flexShrink: 0 }}
          />
        </button>

        {/* Recent Reports drawer */}
        <div
          style={{
            width: isMinimized ? 150 : "calc(100% - 16px)", // Enough width for text + padding
            height: isMinimized ? 48 : 630, // Match smaller button height
            maxHeight: "calc(100vh - 260px)",
            background: "#4B6043",
            border: "none",
            borderRadius: 32,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
            flexShrink: 0,
            position: "absolute",
            top: 0,
            right: 8,
            zIndex: 20,
          }}
        >
          {/* Fixed Drawer Header (Not Scrollable) */}
          <button
            onClick={() => setIsMinimized((m) => !m)}
            style={{
              flexShrink: 0,
              width: "100%",
              height: isMinimized ? 48 : 46, // Match button height
              display: "flex",
              justifyContent: "center", // Center text when minimized
              alignItems: "center",
              gap: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 16px",
              transition: "height 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                flex: isMinimized ? "0 1 auto" : 1, // Take full width only when expanded
                textAlign: isMinimized ? "center" : "left",
              }}
            >
              Recent Reports
            </div>
            <div
              style={{
                display: "flex",
                color: "rgba(255,255,255,0.7)",
                transform: isMinimized ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              <ChevronDown size={16} />
            </div>
          </button>

          {/* Scrollable Container for Cards */}
          <div
            className="hide-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: "0 14px", // Move bottom padding to inner elements
              opacity: isMinimized ? 0 : 1,
              transition: "opacity 0.4s ease",
              transitionDelay: isMinimized ? "0s" : "0.15s",
            }}
          >
            {recent.length === 0 ? (
              <div style={{ textAlign: "center", padding: "10px 0 34px" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📣</div>
                <div
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontWeight: 800,
                    opacity: 0.9,
                  }}
                >
                  No reports yet
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  paddingBottom: 34,
                }}
              >
                {recent.map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
