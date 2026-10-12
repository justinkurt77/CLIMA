import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Sun,
  Shield,
  ChevronDown,
  ChevronUp,
  Radio,
  Info,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const IOT_METRIC_CONFIG = {
  heatIndex: {
    id: "heatIndex",
    label: "Heat Index",
    shortLabel: "Heat Index",
    value: "51.3°C",
    unit: "°C",
    color: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.4)",
    fillColor: "#ef4444",
    Icon: Flame,
    status: "Danger",
    statusColor: "#ef4444",
    scale: [
      { label: "Safe", range: "<27°C", color: "#22c55e" },
      { label: "Caution", range: "27-32°", color: "#eab308" },
      { label: "Ext. Caution", range: "33-41°", color: "#f97316" },
      { label: "Danger", range: "42-51°", color: "#ef4444", active: true },
      { label: "Ext. Danger", range: ">52°", color: "#991b1b" },
    ],
    summary: "Extreme Danger (51.3°C) — Heat stroke imminent with prolonged outdoor exposure.",
  },
  temperature: {
    id: "temperature",
    label: "Temperature",
    shortLabel: "Temp",
    value: "34.0°C",
    unit: "°C",
    color: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.4)",
    fillColor: "#f97316",
    Icon: Thermometer,
    status: "Tropical Hot",
    statusColor: "#f97316",
    scale: [
      { label: "Cool", range: "<24°C", color: "#3b82f6" },
      { label: "Mild", range: "24-29°", color: "#10b981" },
      { label: "Warm", range: "30-34°", color: "#f97316", active: true },
      { label: "Hot", range: ">35°", color: "#ef4444" },
    ],
    summary: "Direct physical sensor reading recorded at Popolon AWS ground mast.",
  },
  humidity: {
    id: "humidity",
    label: "Humidity",
    shortLabel: "Humidity",
    value: "78.5%",
    unit: "%",
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.4)",
    fillColor: "#06b6d4",
    Icon: Droplets,
    status: "Elevated",
    statusColor: "#06b6d4",
    scale: [
      { label: "Dry", range: "<40%", color: "#eab308" },
      { label: "Comfortable", range: "40-60%", color: "#10b981" },
      { label: "Humid", range: "60-80%", color: "#06b6d4", active: true },
      { label: "Heavy", range: ">80%", color: "#3b82f6" },
    ],
    summary: "High relative atmospheric moisture amplifying felt heat across the corridor.",
  },
  wind: {
    id: "wind",
    label: "Wind Speed",
    shortLabel: "Wind",
    value: "0.7 km/h N",
    unit: "km/h",
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.4)",
    fillColor: "#10b981",
    Icon: Wind,
    status: "Gentle",
    statusColor: "#10b981",
    scale: [
      { label: "Calm", range: "<5 km/h", color: "#10b981", active: true },
      { label: "Light", range: "6-19", color: "#06b6d4" },
      { label: "Moderate", range: "20-38", color: "#f59e0b" },
      { label: "Strong", range: ">38", color: "#ef4444" },
    ],
    summary: "Light northerly surface breeze across Popolon and Manacnac agricultural plains.",
  },
  pressure: {
    id: "pressure",
    label: "Pressure",
    shortLabel: "Pressure",
    value: "1006.7 hPa",
    unit: "hPa",
    color: "#8b5cf6",
    glowColor: "rgba(139, 92, 246, 0.4)",
    fillColor: "#8b5cf6",
    Icon: Gauge,
    status: "Normal",
    statusColor: "#8b5cf6",
    scale: [
      { label: "Low", range: "<1000", color: "#ef4444" },
      { label: "Normal", range: "1000-1013", color: "#8b5cf6", active: true },
      { label: "High", range: ">1013", color: "#3b82f6" },
    ],
    summary: "Standard barometric pressure indicating stable weather atmosphere.",
  },
  lightIntensity: {
    id: "lightIntensity",
    label: "Solar / Light",
    shortLabel: "Solar",
    value: "54.6k lux",
    unit: "lux",
    color: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.4)",
    fillColor: "#eab308",
    Icon: Sun,
    status: "Intense",
    statusColor: "#eab308",
    scale: [
      { label: "Overcast", range: "<10k", color: "#64748b" },
      { label: "Moderate", range: "10-30k", color: "#10b981" },
      { label: "Bright", range: "30-50k", color: "#f59e0b" },
      { label: "Peak Sun", range: ">50k", color: "#eab308", active: true },
    ],
    summary: "Peak solar illuminance over 50,000 lux corresponding to direct midday sunshine.",
  },
  uvIndex: {
    id: "uvIndex",
    label: "UV Index",
    shortLabel: "UV",
    value: "8.2 UV",
    unit: "UV",
    color: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.4)",
    fillColor: "#ec4899",
    Icon: Shield,
    status: "Very High",
    statusColor: "#ec4899",
    scale: [
      { label: "Low", range: "0-2", color: "#22c55e" },
      { label: "Moderate", range: "3-5", color: "#eab308" },
      { label: "High", range: "6-7", color: "#f97316" },
      { label: "Very High", range: "8-10", color: "#ec4899", active: true },
      { label: "Extreme", range: "11+", color: "#8b5cf6" },
    ],
    summary: "UV radiation level 8.2 (Very High). Sun protection strongly advised.",
  },
};

export function KloudtrackMapControls({
  activeMetric,
  onSelectMetric,
  isMapFullView,
}) {
  const { isDark } = useTheme();
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [barMinimized, setBarMinimized] = useState(false);

  if (!isMapFullView) return null;

  const currentConfig = IOT_METRIC_CONFIG[activeMetric] || IOT_METRIC_CONFIG.heatIndex;
  const MetricIcon = currentConfig.Icon;

  return (
    <>
      {/* ── 1. Bottom Horizontal Parameter Switcher Pill Bar ── */}
      <AnimatePresence mode="wait">
        {barMinimized ? (
          /* Minimized Compact Single Pill — Exact matching size with collapsed legend */
          <motion.button
            key="minimized-pill"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={() => setBarMinimized(false)}
            style={{
              position: "absolute",
              bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
              left: 16,
              zIndex: 10,
              width: 270,
              height: 44,
              boxSizing: "border-box",
              borderRadius: 22,
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `2px solid ${currentConfig.color}`,
              background: isDark
                ? "rgba(18, 20, 26, 0.96)"
                : "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow: `0 6px 20px ${currentConfig.glowColor}`,
              cursor: "pointer",
              pointerEvents: "auto",
              fontFamily: "Nunito, sans-serif",
            }}
            title="Expand IoT Weather Metrics"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: currentConfig.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <MetricIcon size={13} strokeWidth={2.4} />
              </div>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : "#09090b",
                  whiteSpace: "nowrap",
                }}
              >
                {currentConfig.label}
              </span>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: currentConfig.color,
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  padding: "1px 7px",
                  borderRadius: 10,
                  whiteSpace: "nowrap",
                }}
              >
                {currentConfig.value}
              </span>
            </div>

            <ChevronUp size={15} color={isDark ? "#ffffff" : "#09090b"} style={{ opacity: 0.7, flexShrink: 0 }} />
          </motion.button>
        ) : (
          /* Expanded Full Horizontal Metrics Strip */
          <motion.div
            key="expanded-bar"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "absolute",
              bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
              left: 16,
              right: 16,
              zIndex: 10,
              display: "flex",
              gap: 10,
              overflowX: "auto",
              padding: "8px 12px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              pointerEvents: "auto",
            }}
          >
            {/* Collapse / Minimize Button at Front */}
            <button
              onClick={() => setBarMinimized(true)}
              style={{
                height: 42,
                borderRadius: 24,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.16)"
                  : "1px solid rgba(0, 0, 0, 0.12)",
                background: isDark
                  ? "rgba(18, 20, 26, 0.88)"
                  : "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: isDark
                  ? "0 4px 14px rgba(0,0,0,0.35)"
                  : "0 4px 14px rgba(0,0,0,0.08)",
                cursor: "pointer",
                color: isDark ? "#ffffff" : "#09090b",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "Nunito, sans-serif",
                flexShrink: 0,
                transition: "transform 0.15s ease",
              }}
              title="Minimize metrics bar"
            >
              <ChevronDown size={15} />
              <span>Hide</span>
            </button>

            {Object.values(IOT_METRIC_CONFIG).map((metric) => {
              const isActive = activeMetric === metric.id;
              const Icon = metric.Icon;

              return (
                <button
                  key={metric.id}
                  onClick={() => onSelectMetric(metric.id)}
                  style={{
                    height: 42,
                    borderRadius: 24,
                    padding: "0 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    whiteSpace: "nowrap",
                    border: isActive
                      ? `2px solid ${metric.color}`
                      : isDark
                      ? "1px solid rgba(255, 255, 255, 0.14)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                    background: isActive
                      ? isDark
                        ? "rgba(18, 20, 26, 0.96)"
                        : "rgba(255, 255, 255, 0.98)"
                      : isDark
                      ? "rgba(18, 20, 26, 0.82)"
                      : "rgba(255, 255, 255, 0.88)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: isActive
                      ? `0 6px 20px ${metric.glowColor}`
                      : isDark
                      ? "0 4px 14px rgba(0,0,0,0.35)"
                      : "0 4px 14px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: isActive ? "scale(1.03)" : "scale(1)",
                    flexShrink: 0,
                  }}
                  title={`Switch map view to ${metric.label}`}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: isActive ? metric.color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isActive ? "#ffffff" : metric.color,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon size={13} strokeWidth={2.4} />
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 700,
                      color: isActive
                        ? isDark
                          ? "#ffffff"
                          : "#09090b"
                        : isDark
                        ? "#a1a1aa"
                        : "#71717a",
                    }}
                  >
                    {metric.shortLabel}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: metric.color,
                      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                      padding: "1px 7px",
                      borderRadius: 10,
                    }}
                  >
                    {metric.value}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. Bottom-Left Metric Advisory Scale Legend ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          position: "absolute",
          bottom: barMinimized
            ? "calc(16px + env(safe-area-inset-bottom, 0px) + 44px + 8px)"
            : "calc(16px + env(safe-area-inset-bottom, 0px) + 58px + 10px)",
          left: 16,
          zIndex: 8,
          width: 270,
          height: legendCollapsed ? 44 : "auto",
          boxSizing: "border-box",
          background: isDark
            ? "rgba(18, 20, 26, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.14)"
            : "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: legendCollapsed ? 22 : 20,
          padding: legendCollapsed ? "0 14px" : "12px 14px",
          boxShadow: isDark
            ? "0 12px 30px rgba(0,0,0,0.5)"
            : "0 12px 30px rgba(0,0,0,0.12)",
          fontFamily: "Nunito, sans-serif",
          pointerEvents: "auto",
          transition: "bottom 0.25s ease, border-radius 0.2s ease, padding 0.2s ease",
          display: "flex",
          flexDirection: "column",
          justifyContent: legendCollapsed ? "center" : "flex-start",
        }}
      >
        {/* Legend Header */}
        <div
          onClick={() => setLegendCollapsed((c) => !c)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            gap: 10,
            width: "100%",
            height: legendCollapsed ? "100%" : "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                background: currentConfig.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <MetricIcon size={13} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : "#09090b",
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentConfig.label} Scale
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: currentConfig.statusColor,
                  lineHeight: 1.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Popolon AWS: {currentConfig.value} ({currentConfig.status})
              </div>
            </div>
          </div>

          <button
            style={{
              background: "transparent",
              border: "none",
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            {legendCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Legend Body (Collapsible) */}
        <AnimatePresence>
          {!legendCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              {/* Color Ramp Bar */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 6,
                  overflow: "hidden",
                  height: 8,
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                {currentConfig.scale.map((lvl, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      background: lvl.color,
                      opacity: lvl.active ? 1 : 0.65,
                      boxShadow: lvl.active ? "0 0 8px rgba(255,255,255,0.8)" : "none",
                    }}
                    title={`${lvl.label} (${lvl.range})`}
                  />
                ))}
              </div>

              {/* Range Labels */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 9,
                  fontWeight: 700,
                  color: isDark ? "#a1a1aa" : "#71717a",
                  marginBottom: 6,
                }}
              >
                {currentConfig.scale.map((lvl, idx) => (
                  <span
                    key={idx}
                    style={{
                      color: lvl.active ? (isDark ? "#ffffff" : "#09090b") : "inherit",
                      fontWeight: lvl.active ? 900 : 700,
                    }}
                  >
                    {lvl.range}
                  </span>
                ))}
              </div>

              {/* Explanatory summary */}
              <div
                style={{
                  fontSize: 10,
                  color: isDark ? "#d4d4d8" : "#52525b",
                  fontWeight: 600,
                  lineHeight: 1.35,
                  paddingTop: 6,
                  borderTop: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {currentConfig.summary}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
