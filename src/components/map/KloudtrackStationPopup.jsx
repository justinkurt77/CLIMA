import { useState } from "react";
import {
  X,
  Radio,
  Flame,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Eye,
  Sun,
  Activity,
  Navigation,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { POPOLON_AWS_HISTORY } from "../../services/kloudtechService";

export function KloudtrackStationPopup({
  station,
  onClose,
  onFocusStation,
  isDark = true,
  activeMetric = "heatIndex",
  onSelectMetric,
}) {
  const [activeParam, setActiveParam] = useState(activeMetric || "heatIndex");
  const telemetry = station?.telemetry || {};

  const PARAM_CONFIG = {
    heatIndex: {
      label: "Heat Index",
      val: "51.3 °C",
      unit: "°C",
      badge: "Danger",
      badgeColor: "#ef4444",
      color: "#f97316",
      Icon: Flame,
      dataKey: "heatIndex",
      desc: "Extreme danger of heat cramps, exhaustion, and probable heat stroke with prolonged outdoor exposure.",
    },
    temperature: {
      label: "Temperature",
      val: "34.0 °C",
      unit: "°C",
      badge: "Tropical Hot",
      badgeColor: "#ea580c",
      color: "#ef4444",
      Icon: Thermometer,
      dataKey: "temp",
      desc: "High daytime ambient temperature recorded by the physical weatherstation temperature sensor.",
    },
    humidity: {
      label: "Humidity",
      val: "78.5 %",
      unit: "%",
      badge: "Elevated",
      badgeColor: "#3b82f6",
      color: "#3b82f6",
      Icon: Droplets,
      dataKey: "humidity",
      desc: "High relative atmospheric moisture amplifying apparent heat index throughout the corridor.",
    },
    pressure: {
      label: "Pressure",
      val: "1006.7 hPa",
      unit: "hPa",
      badge: "Normal",
      badgeColor: "#8b5cf6",
      color: "#8b5cf6",
      Icon: Gauge,
      dataKey: "pressure",
      desc: "Standard sea-level calibrated barometric pressure reading indicating fair weather conditions.",
    },
    wind: {
      label: "Wind Speed",
      val: "0.7 kph N",
      unit: "kph",
      badge: "Gentle",
      badgeColor: "#22c55e",
      color: "#22c55e",
      Icon: Wind,
      dataKey: "wind",
      desc: "Light northerly surface breeze across the plains of Manacnac and Popolon Pagas.",
    },
    lightIntensity: {
      label: "Light Intensity",
      val: "54612.5 lux",
      unit: "lux",
      badge: "Bright Sun",
      badgeColor: "#eab308",
      color: "#eab308",
      Icon: Eye,
      dataKey: "heatIndex", // fallback
      desc: "Peak solar illuminance exceeding 50,000 lux corresponding to direct midday sunshine.",
    },
  };

  const currentCfg = PARAM_CONFIG[activeParam];
  const CurrentIcon = currentCfg.Icon;

  return (
    <div
      style={{
        width: 320,
        background: isDark
          ? "rgba(18, 20, 26, 0.98)"
          : "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20,
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.16)"
          : "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: isDark
          ? "0 20px 50px rgba(0, 0, 0, 0.75)"
          : "0 20px 40px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      {/* ── TOP HEADER ── */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
            }}
          >
            <Radio size={18} strokeWidth={2.4} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : "#09090b",
                  letterSpacing: -0.2,
                }}
              >
                Popolon AWS
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#22c55e",
                  background: "rgba(34, 197, 94, 0.12)",
                  padding: "1px 6px",
                  borderRadius: 6,
                }}
              >
                LIVE
              </span>
            </div>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 11,
                color: isDark ? "#a1a1aa" : "#71717a",
                fontWeight: 500,
              }}
            >
              Manacnac, Palayan City
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
            border: "none",
            borderRadius: "50%",
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isDark ? "#ffffff" : "#09090b",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── PARAMETER SELECTOR TABS ── */}
      <div
        style={{
          padding: "12px 14px 6px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {Object.entries(PARAM_CONFIG).map(([key, item]) => {
          const isCurrent = activeParam === key;
          const Icon = item.Icon;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveParam(key);
                if (onSelectMetric) onSelectMetric(key);
              }}
              style={{
                background: isCurrent
                  ? isDark
                    ? "rgba(249, 115, 22, 0.2)"
                    : "rgba(249, 115, 22, 0.12)"
                  : isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.03)",
                border: isCurrent
                  ? "1.5px solid rgba(249, 115, 22, 0.5)"
                  : "1px solid transparent",
                borderRadius: 12,
                padding: "8px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={14} color={isCurrent ? "#f97316" : isDark ? "#a1a1aa" : "#71717a"} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isCurrent ? (isDark ? "#ffffff" : "#09090b") : isDark ? "#a1a1aa" : "#71717a",
                }}
              >
                {item.label.split(" ")[0]}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isCurrent ? "#f97316" : isDark ? "#ffffff" : "#09090b",
                }}
              >
                {item.val.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SELECTED PARAMETER CARD & MINI SPARKLINE ── */}
      <div style={{ padding: "10px 14px 14px" }}>
        <div
          style={{
            background: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.06)",
            borderRadius: 14,
            padding: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CurrentIcon size={16} color={currentCfg.color} />
              <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#ffffff" : "#09090b" }}>
                {currentCfg.label}
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: currentCfg.badgeColor,
                background: `${currentCfg.badgeColor}20`,
                padding: "2px 7px",
                borderRadius: 8,
              }}
            >
              {currentCfg.badge}
            </span>
          </div>

          <div style={{ fontSize: 20, fontWeight: 900, color: currentCfg.color, marginBottom: 4 }}>
            {currentCfg.val}
          </div>

          <p style={{ margin: "0 0 10px", fontSize: 11, lineHeight: 1.4, color: isDark ? "#a1a1aa" : "#71717a" }}>
            {currentCfg.desc}
          </p>

          {/* Mini Sparkline Chart */}
          <div style={{ height: 60, width: "100%", marginTop: 6 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={POPOLON_AWS_HISTORY.slice(-12)}>
                <defs>
                  <linearGradient id="popupAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentCfg.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={currentCfg.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    return (
                      <div
                        style={{
                          background: "#09090b",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        {payload[0].value} {currentCfg.unit}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={currentCfg.dataKey}
                  stroke={currentCfg.color}
                  strokeWidth={2}
                  fill="url(#popupAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={onFocusStation}
            style={{
              flex: 1,
              background: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
              border: "1px solid var(--border-medium)",
              borderRadius: 10,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: isDark ? "#ffffff" : "#09090b",
              cursor: "pointer",
            }}
          >
            <Navigation size={13} />
            <span>Center 3D</span>
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "var(--accent-orange)",
              border: "none",
              borderRadius: 10,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
