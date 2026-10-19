import { useState, useEffect } from "react";
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
  Check,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function getDynamicMetricConfig(telemetry = {}, stationName = "Popolon AWS") {
  const hi = telemetry?.heatIndex != null ? Number(telemetry.heatIndex) : 38.5;
  const temp = telemetry?.temperature != null
    ? Number(telemetry.temperature)
    : telemetry?.temp != null
    ? Number(telemetry.temp)
    : 29.3;
  const rh = telemetry?.humidity != null ? Number(telemetry.humidity) : 91.0;
  const windSpd = telemetry?.wind?.speed != null ? Number(telemetry.wind.speed) : 0.1;
  const windDir =
    typeof telemetry?.wind?.direction === "number"
      ? Math.round(telemetry.wind.direction) + "°"
      : telemetry?.wind?.direction || "E";
  const pres = telemetry?.pressure != null ? Number(telemetry.pressure) : 1009.8;
  const light = telemetry?.lightIntensity != null ? Number(telemetry.lightIntensity) : 3411.7;
  const uv = telemetry?.uvIndex != null ? Number(telemetry.uvIndex) : 3;

  // Heat Index status
  let hiStatus = "Normal";
  let hiStatusColor = "#22c55e";
  if (hi >= 52) {
    hiStatus = "Ext. Danger";
    hiStatusColor = "#991b1b";
  } else if (hi >= 42) {
    hiStatus = "Danger";
    hiStatusColor = "#ef4444";
  } else if (hi >= 33) {
    hiStatus = "Ext. Caution";
    hiStatusColor = "#f97316";
  } else if (hi >= 27) {
    hiStatus = "Caution";
    hiStatusColor = "#eab308";
  }

  // Temp status
  let tempStatus = "Mild";
  let tempStatusColor = "#10b981";
  if (temp > 35) {
    tempStatus = "Hot";
    tempStatusColor = "#ef4444";
  } else if (temp >= 30) {
    tempStatus = "Warm";
    tempStatusColor = "#f97316";
  } else if (temp < 24) {
    tempStatus = "Cool";
    tempStatusColor = "#3b82f6";
  }

  // Humidity status
  let rhStatus = "Comfortable";
  let rhStatusColor = "#10b981";
  if (rh > 80) {
    rhStatus = "Elevated";
    rhStatusColor = "#06b6d4";
  } else if (rh >= 60) {
    rhStatus = "Humid";
    rhStatusColor = "#06b6d4";
  } else if (rh < 40) {
    rhStatus = "Dry";
    rhStatusColor = "#eab308";
  }

  return {
    heatIndex: {
      id: "heatIndex",
      label: "Heat Index",
      shortLabel: "Heat Index",
      value: `${hi.toFixed(1)}°C`,
      unit: "°C",
      color: hiStatusColor,
      glowColor: `${hiStatusColor}66`,
      fillColor: hiStatusColor,
      Icon: Flame,
      status: hiStatus,
      statusColor: hiStatusColor,
      scale: [
        { label: "Safe", range: "<27°C", color: "#22c55e", active: hi < 27 },
        { label: "Caution", range: "27-32°", color: "#eab308", active: hi >= 27 && hi < 33 },
        { label: "Ext. Caution", range: "33-41°", color: "#f97316", active: hi >= 33 && hi < 42 },
        { label: "Danger", range: "42-51°", color: "#ef4444", active: hi >= 42 && hi < 52 },
        { label: "Ext. Danger", range: ">52°", color: "#991b1b", active: hi >= 52 },
      ],
      summary: `${hiStatus} (${hi.toFixed(1)}°C) - Live reading recorded from ${stationName}.`,
    },
    temperature: {
      id: "temperature",
      label: "Temperature",
      shortLabel: "Temp",
      value: `${temp.toFixed(1)}°C`,
      unit: "°C",
      color: tempStatusColor,
      glowColor: `${tempStatusColor}66`,
      fillColor: tempStatusColor,
      Icon: Thermometer,
      status: tempStatus,
      statusColor: tempStatusColor,
      scale: [
        { label: "Cool", range: "<24°C", color: "#3b82f6", active: temp < 24 },
        { label: "Mild", range: "24-29°", color: "#10b981", active: temp >= 24 && temp < 30 },
        { label: "Warm", range: "30-34°", color: "#f97316", active: temp >= 30 && temp <= 35 },
        { label: "Hot", range: ">35°", color: "#ef4444", active: temp > 35 },
      ],
      summary: `Direct physical sensor reading recorded at ${stationName} ground mast.`,
    },
    humidity: {
      id: "humidity",
      label: "Humidity",
      shortLabel: "Humidity",
      value: `${rh.toFixed(1)}%`,
      unit: "%",
      color: "#06b6d4",
      glowColor: "rgba(6, 182, 212, 0.4)",
      fillColor: "#06b6d4",
      Icon: Droplets,
      status: rhStatus,
      statusColor: rhStatusColor,
      scale: [
        { label: "Dry", range: "<40%", color: "#eab308", active: rh < 40 },
        { label: "Comfortable", range: "40-60%", color: "#10b981", active: rh >= 40 && rh < 60 },
        { label: "Humid", range: "60-80%", color: "#06b6d4", active: rh >= 60 && rh <= 80 },
        { label: "Heavy", range: ">80%", color: "#3b82f6", active: rh > 80 },
      ],
      summary: `Relative atmospheric moisture recorded by ${stationName}.`,
    },
    wind: {
      id: "wind",
      label: "Wind Speed",
      shortLabel: "Wind",
      value: `${windSpd.toFixed(1)} km/h ${windDir}`,
      unit: "km/h",
      color: "#10b981",
      glowColor: "rgba(16, 185, 129, 0.4)",
      fillColor: "#10b981",
      Icon: Wind,
      status: windSpd < 5 ? "Calm" : windSpd < 20 ? "Light" : "Moderate",
      statusColor: "#10b981",
      scale: [
        { label: "Calm", range: "<5 km/h", color: "#10b981", active: windSpd < 5 },
        { label: "Light", range: "6-19", color: "#06b6d4", active: windSpd >= 5 && windSpd < 20 },
        { label: "Moderate", range: "20-38", color: "#f59e0b", active: windSpd >= 20 && windSpd <= 38 },
        { label: "Strong", range: ">38", color: "#ef4444", active: windSpd > 38 },
      ],
      summary: `Surface breeze across ${stationName} plains.`,
    },
    pressure: {
      id: "pressure",
      label: "Pressure",
      shortLabel: "Pressure",
      value: `${pres.toFixed(1)} hPa`,
      unit: "hPa",
      color: "#8b5cf6",
      glowColor: "rgba(139, 92, 246, 0.4)",
      fillColor: "#8b5cf6",
      Icon: Gauge,
      status: pres < 1000 ? "Low" : pres <= 1013 ? "Normal" : "High",
      statusColor: "#8b5cf6",
      scale: [
        { label: "Low", range: "<1000", color: "#ef4444", active: pres < 1000 },
        { label: "Normal", range: "1000-1013", color: "#8b5cf6", active: pres >= 1000 && pres <= 1013 },
        { label: "High", range: ">1013", color: "#3b82f6", active: pres > 1013 },
      ],
      summary: `Standard barometric pressure measured at ${stationName}.`,
    },
    lightIntensity: {
      id: "lightIntensity",
      label: "Solar / Light",
      shortLabel: "Solar",
      value: light >= 1000 ? `${(light / 1000).toFixed(1)}k lux` : `${light.toFixed(0)} lux`,
      unit: "lux",
      color: "#eab308",
      glowColor: "rgba(234, 179, 8, 0.4)",
      fillColor: "#eab308",
      Icon: Sun,
      status: light > 50000 ? "Peak Sun" : light > 30000 ? "Bright" : light > 10000 ? "Moderate" : "Overcast",
      statusColor: "#eab308",
      scale: [
        { label: "Overcast", range: "<10k", color: "#64748b", active: light <= 10000 },
        { label: "Moderate", range: "10-30k", color: "#10b981", active: light > 10000 && light <= 30000 },
        { label: "Bright", range: "30-50k", color: "#f59e0b", active: light > 30000 && light <= 50000 },
        { label: "Peak Sun", range: ">50k", color: "#eab308", active: light > 50000 },
      ],
      summary: `Solar illuminance measured live at ${stationName}.`,
    },
    uvIndex: {
      id: "uvIndex",
      label: "UV Index",
      shortLabel: "UV",
      value: `${uv} UV`,
      unit: "UV",
      color: uv >= 11 ? "#8b5cf6" : uv >= 8 ? "#ec4899" : uv >= 6 ? "#f97316" : uv >= 3 ? "#eab308" : "#22c55e",
      glowColor: "rgba(236, 72, 153, 0.4)",
      fillColor: "#ec4899",
      Icon: Shield,
      status: uv >= 11 ? "Extreme" : uv >= 8 ? "Very High" : uv >= 6 ? "High" : uv >= 3 ? "Moderate" : "Low",
      statusColor: uv >= 8 ? "#ec4899" : "#f97316",
      scale: [
        { label: "Low", range: "0-2", color: "#22c55e", active: uv <= 2 },
        { label: "Moderate", range: "3-5", color: "#eab308", active: uv >= 3 && uv <= 5 },
        { label: "High", range: "6-7", color: "#f97316", active: uv >= 6 && uv <= 7 },
        { label: "Very High", range: "8-10", color: "#ec4899", active: uv >= 8 && uv <= 10 },
        { label: "Extreme", range: "11+", color: "#8b5cf6", active: uv >= 11 },
      ],
      summary: `UV radiation measured at ${stationName}.`,
    },
  };
}

export const IOT_METRIC_CONFIG = getDynamicMetricConfig();

/**
 * Beside-Search Top Bar IoT Weather Controls
 * Renders two sleek pills:
 * 1. Metric Switcher Pill (Circle Icon, "Heat Index", "51.4°C", Chevron)
 * 2. Scale Legend Pill (Square Icon, "Heat Index Scale", Station Status, Chevron)
 * Both are minimized as default and toggle elegant popover dropdowns.
 */
export function KloudtrackMapControls({
  activeMetric = "heatIndex",
  onSelectMetric,
  isMapFullView = true,
  stations = [],
  selectedStation = null,
  onSelectStation = null,
  openDropdown: externalOpenDropdown,
  setOpenDropdown: externalSetOpenDropdown,
}) {
  const { isDark } = useTheme();
  const [internalOpen, setInternalOpen] = useState(null);
  const openDropdown = externalOpenDropdown !== undefined ? externalOpenDropdown : internalOpen;
  const setOpenDropdown = externalSetOpenDropdown || setInternalOpen;

  // Mobile detection for compact controls (< 1024px matches CLIMA mobile view)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMapFullView === false) return null;

  const currentStation =
    selectedStation ||
    (Array.isArray(stations) &&
      stations.find((s) => s?.station?.stationName?.toLowerCase().includes("popolon"))) ||
    (Array.isArray(stations) && stations[0]) ||
    null;

  const stationName = currentStation?.station?.stationName || "Popolon AWS";
  const dynamicConfig = getDynamicMetricConfig(currentStation?.telemetry, stationName);
  const currentConfig = dynamicConfig[activeMetric] || dynamicConfig.heatIndex;
  const MetricIcon = currentConfig.Icon;

  const isMetricOpen = openDropdown === "metric";
  const isScaleOpen = openDropdown === "scale";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      {/* ── 1. IoT Metric Switcher Pill (Heat Index, 51.4°C) ── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setOpenDropdown(isMetricOpen ? null : "metric")}
          className="kloud-metric-btn"
          style={{
            height: isMobile ? 42 : 56,
            borderRadius: 40,
            padding: isMobile ? "0 10px 0 8px" : "0 16px 0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobile ? 6 : 9,
            border: `2px solid ${currentConfig.color}`,
            background: isDark
              ? "rgba(18, 18, 20, 0.96)"
              : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: `0 6px 20px ${currentConfig.glowColor}`,
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          title={`IoT Weather Metric: ${currentConfig.label} (${currentConfig.value})`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
            <div
              style={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: "50%",
                background: currentConfig.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
                boxShadow: `0 2px 8px ${currentConfig.glowColor}`,
              }}
            >
              <MetricIcon size={isMobile ? 13 : 14} strokeWidth={2.4} />
            </div>

            {!isMobile && (
              <span
                className="kloud-metric-label"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : "#09090b",
                  whiteSpace: "nowrap",
                }}
              >
                {currentConfig.label}
              </span>
            )}

            <span
              style={{
                fontSize: isMobile ? 11 : 11.5,
                fontWeight: 800,
                color: currentConfig.color,
                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                padding: "2px 8px",
                borderRadius: 12,
                whiteSpace: "nowrap",
              }}
            >
              {currentConfig.value}
            </span>
          </div>

          {isMetricOpen ? (
            <ChevronUp
              size={16}
              color={isDark ? "#ffffff" : "#09090b"}
              style={{ opacity: 0.7, marginLeft: 4, flexShrink: 0 }}
            />
          ) : (
            <ChevronDown
              size={16}
              color={isDark ? "#ffffff" : "#09090b"}
              style={{ opacity: 0.7, marginLeft: 4, flexShrink: 0 }}
            />
          )}
        </button>

        {/* Metric Switcher Dropdown */}
        <AnimatePresence>
          {isMetricOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 100,
                background: isDark
                  ? "rgba(18, 18, 20, 0.96)"
                  : "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.12)"
                  : "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 18,
                padding: "10px",
                boxShadow: isDark
                  ? "0 16px 40px rgba(0,0,0,0.6)"
                  : "0 16px 40px rgba(0,0,0,0.15)",
                width: 270,
                fontFamily: "Nunito, sans-serif",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isDark ? "#a1a1aa" : "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "4px 8px 8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>IoT Weather Metric</span>
                <span style={{ fontSize: 10, color: currentConfig.color, fontWeight: 700 }}>
                  Live Telemetry
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.values(dynamicConfig).map((metric) => {
                  const isActive = activeMetric === metric.id;
                  const Icon = metric.Icon;

                  return (
                    <button
                      key={metric.id}
                      onClick={() => {
                        if (onSelectMetric) onSelectMetric(metric.id);
                        setOpenDropdown(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        background: isActive
                          ? isDark
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.06)"
                          : "transparent",
                        border: isActive
                          ? `1.5px solid ${metric.color}`
                          : "1.5px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: isActive
                              ? metric.color
                              : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.05)",
                            color: isActive ? "#ffffff" : metric.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.18s ease",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={13} strokeWidth={2.4} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: isActive ? 800 : 700,
                              color: isDark ? "#ffffff" : "#09090b",
                              lineHeight: 1.2,
                            }}
                          >
                            {metric.label}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: metric.color,
                              lineHeight: 1.2,
                            }}
                          >
                            {metric.status}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: metric.color,
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                            padding: "2px 7px",
                            borderRadius: 10,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {metric.value}
                        </span>
                        {isActive && <Check size={14} color={metric.color} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 2. Advisory Scale Legend Pill (Heat Index Scale) ── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setOpenDropdown(isScaleOpen ? null : "scale")}
          className="kloud-scale-btn"
          style={{
            height: isMobile ? 42 : 56,
            borderRadius: 40,
            padding: isMobile ? "0 10px" : "0 16px 0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobile ? 6 : 10,
            background: isDark
              ? "rgba(18, 18, 20, 0.94)"
              : "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: isDark
              ? isScaleOpen
                ? "1px solid rgba(255, 255, 255, 0.3)"
                : "1px solid rgba(255, 255, 255, 0.12)"
              : isScaleOpen
              ? "1px solid rgba(0, 0, 0, 0.2)"
              : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isDark
              ? "0 6px 20px rgba(0,0,0,0.5)"
              : "0 6px 20px rgba(0,0,0,0.08)",
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          title={`Advisory Scale: ${currentConfig.label} (${currentConfig.value} - ${currentConfig.status})`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 9 }}>
            <div
              style={{
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: isMobile ? 6 : 8,
                background: currentConfig.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
                boxShadow: `0 2px 8px ${currentConfig.glowColor || "rgba(239,68,68,0.4)"}`,
              }}
            >
              <MetricIcon size={isMobile ? 13 : 14} strokeWidth={2.4} />
            </div>

            {!isMobile && (
              <div className="kloud-scale-text-block" style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isDark ? "#ffffff" : "#09090b",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentConfig.label} Scale
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: currentConfig.statusColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {stationName.replace(" - Palayan City", "")}: {currentConfig.value} ({currentConfig.status})
                </div>
              </div>
            )}
          </div>

          {isScaleOpen ? (
            <ChevronUp
              size={isMobile ? 14 : 16}
              color={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"}
              style={{ marginLeft: isMobile ? 2 : 4, flexShrink: 0 }}
            />
          ) : (
            <ChevronDown
              size={isMobile ? 14 : 16}
              color={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"}
              style={{ marginLeft: isMobile ? 2 : 4, flexShrink: 0 }}
            />
          )}
        </button>

        {/* Scale Legend Dropdown */}
        <AnimatePresence>
          {isScaleOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 100,
                background: isDark
                  ? "rgba(18, 18, 20, 0.96)"
                  : "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.12)"
                  : "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 18,
                padding: 14,
                boxShadow: isDark
                  ? "0 16px 40px rgba(0,0,0,0.6)"
                  : "0 16px 40px rgba(0,0,0,0.15)",
                width: 290,
                fontFamily: "Nunito, sans-serif",
              }}
            >
              {/* Station Switcher (if > 1 station) */}
              {Array.isArray(stations) && stations.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 10,
                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    padding: 3,
                    borderRadius: 10,
                  }}
                >
                  {stations.map((st) => {
                    const id = st.station?.id;
                    const name = (st.station?.stationName || "Station")
                      .replace(" - Palayan City", "")
                      .replace(" Palayan City", "");
                    const isSelected =
                      (currentStation?.station?.id && currentStation?.station?.id === id) ||
                      currentStation?.station?.stationName === st.station?.stationName;
                    return (
                      <button
                        key={id || name}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectStation) onSelectStation(st);
                        }}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          fontSize: 10.5,
                          fontWeight: isSelected ? 800 : 600,
                          borderRadius: 7,
                          border: isSelected
                            ? `1px solid ${currentConfig.color}`
                            : "1px solid transparent",
                          background: isSelected
                            ? isDark
                              ? "rgba(255,255,255,0.14)"
                              : "#ffffff"
                            : "transparent",
                          color: isSelected
                            ? isDark
                              ? "#ffffff"
                              : "#09090b"
                            : isDark
                            ? "#a1a1aa"
                            : "#71717a",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: isSelected ? currentConfig.color : "#71717a",
                          }}
                        />
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Status Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: isDark ? "#ffffff" : "#09090b",
                  }}
                >
                  {currentConfig.label} Advisory
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: currentConfig.statusColor,
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    padding: "2px 7px",
                    borderRadius: 10,
                  }}
                >
                  {currentConfig.status} ({currentConfig.value})
                </span>
              </div>

              {/* Color Ramp Bar */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 6,
                  overflow: "hidden",
                  height: 9,
                  marginTop: 8,
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
                  marginBottom: 8,
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

              {/* Summary note */}
              <div
                style={{
                  fontSize: 10.5,
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
      </div>
    </div>
  );
}

