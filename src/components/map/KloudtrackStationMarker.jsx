import { useState } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Flame,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Sun,
  Shield,
  ChevronRight,
} from "lucide-react";

export function KloudtrackStationMarker({
  station,
  isSelected,
  onClick,
  isDark = true,
  activeMetric = "heatIndex",
}) {
  const [isHovered, setIsHovered] = useState(false);
  const telemetry = station?.telemetry || {};

  const getMetricDisplay = () => {
    switch (activeMetric) {
      case "temperature":
        return {
          primary: `${telemetry.temperature || 34.0}°C`,
          badge: "Tropical Hot",
          badgeColor: "#f97316",
          badgeBg: "rgba(249, 115, 22, 0.18)",
          badgeBorder: "rgba(249, 115, 22, 0.3)",
          color: "#f97316",
          Icon: Thermometer,
        };
      case "humidity":
        return {
          primary: `${telemetry.humidity || 78.5}%`,
          badge: "Elevated",
          badgeColor: "#06b6d4",
          badgeBg: "rgba(6, 182, 212, 0.18)",
          badgeBorder: "rgba(6, 182, 212, 0.3)",
          color: "#06b6d4",
          Icon: Droplets,
        };
      case "wind":
        return {
          primary: `${telemetry.wind?.speed || 0.7} km/h`,
          badge: `${telemetry.wind?.direction || "N"} Gentle`,
          badgeColor: "#10b981",
          badgeBg: "rgba(16, 185, 129, 0.18)",
          badgeBorder: "rgba(16, 185, 129, 0.3)",
          color: "#10b981",
          Icon: Wind,
        };
      case "pressure":
        return {
          primary: `${telemetry.pressure || 1006.7} hPa`,
          badge: "Normal",
          badgeColor: "#8b5cf6",
          badgeBg: "rgba(139, 92, 246, 0.18)",
          badgeBorder: "rgba(139, 92, 246, 0.3)",
          color: "#8b5cf6",
          Icon: Gauge,
        };
      case "lightIntensity":
        return {
          primary: "54.6k lux",
          badge: "Peak Sun",
          badgeColor: "#eab308",
          badgeBg: "rgba(234, 179, 8, 0.18)",
          badgeBorder: "rgba(234, 179, 8, 0.3)",
          color: "#eab308",
          Icon: Sun,
        };
      case "uvIndex":
        return {
          primary: `${telemetry.uvIndex || 8.2} UV`,
          badge: "Very High",
          badgeColor: "#ec4899",
          badgeBg: "rgba(236, 72, 153, 0.18)",
          badgeBorder: "rgba(236, 72, 153, 0.3)",
          color: "#ec4899",
          Icon: Shield,
        };
      case "heatIndex":
      default:
        return {
          primary: `${telemetry.heatIndex || 51.3}°C`,
          badge: "51.3° Danger",
          badgeColor: "#ef4444",
          badgeBg: "rgba(239, 68, 68, 0.18)",
          badgeBorder: "rgba(239, 68, 68, 0.3)",
          color: "#ef4444",
          Icon: Flame,
        };
    }
  };

  const currentMetric = getMetricDisplay();
  const MetricIcon = currentMetric.Icon;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(station);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        transform: isSelected || isHovered ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        filter: isDark
          ? "drop-shadow(0 8px 24px rgba(0,0,0,0.65))"
          : "drop-shadow(0 8px 20px rgba(0,0,0,0.2))",
        position: "relative",
      }}
      title={`${station.station?.stationName || "Popolon AWS"} - Click to inspect live telemetry`}
    >
      {/* ── Outer Pulsing Radar Ring (Color matched to selected metric) ── */}
      <div
        style={{
          position: "absolute",
          top: -12,
          left: "50%",
          transform: "translateX(-50%)",
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: currentMetric.color,
          opacity: 0.3,
          animation: "kloudBeaconPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite",
          pointerEvents: "none",
        }}
      />

      {/* ── Main Station Pill ── */}
      <div
        style={{
          background: isDark
            ? "rgba(18, 20, 26, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isSelected
            ? `2px solid ${currentMetric.color}`
            : isDark
            ? "1px solid rgba(255, 255, 255, 0.16)"
            : "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: 24,
          padding: "6px 12px 6px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: isSelected
            ? `0 0 20px ${currentMetric.color}66`
            : "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        {/* Metric Icon Badge */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            background: currentMetric.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            flexShrink: 0,
            boxShadow: `0 2px 8px ${currentMetric.color}66`,
          }}
        >
          <MetricIcon size={14} strokeWidth={2.4} />
        </div>

        {/* Station Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: isDark ? "#ffffff" : "#09090b",
                letterSpacing: -0.2,
                whiteSpace: "nowrap",
              }}
            >
              Popolon AWS
            </span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
              }}
              title="Online - Receiving live IoT telemetry"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: isDark ? "#ffffff" : "#09090b",
              }}
            >
              {currentMetric.primary}
            </span>

            {/* Severity Pill */}
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                background: currentMetric.badgeBg,
                color: currentMetric.badgeColor,
                border: `1px solid ${currentMetric.badgeBorder}`,
                padding: "1px 5px",
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {currentMetric.badge}
            </span>
          </div>
        </div>

        <ChevronRight
          size={14}
          color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
          style={{ marginLeft: 2 }}
        />
      </div>

      {/* ── Stem Pin Arrow ── */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `7px solid ${
            isSelected
              ? currentMetric.color
              : isDark
              ? "rgba(18, 20, 26, 0.94)"
              : "rgba(255, 255, 255, 0.96)"
          }`,
          marginTop: -1,
        }}
      />
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isSelected ? currentMetric.color : "#22c55e",
          boxShadow: `0 0 8px ${isSelected ? currentMetric.color : "#22c55e"}`,
          marginTop: 2,
        }}
      />
    </div>
  );
}
