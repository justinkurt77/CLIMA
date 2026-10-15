import React, { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Thermometer,
  Flame,
  Droplets,
  Gauge,
  Wind,
  Sun,
  Eye,
  CloudRain,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { POPOLON_AWS_HISTORY } from "../services/kloudtechService";

// Bklit UI Interactive Active Marker (Glowing Ring Indicator)
function BklitActiveDot(props) {
  const { cx, cy, stroke = "#f59e0b" } = props;
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={stroke} fillOpacity={0.25} />
      <circle cx={cx} cy={cy} r={5.5} fill="#ffffff" stroke={stroke} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={2.5} fill={stroke} />
    </g>
  );
}

// Bklit UI Glassmorphism Floating Tooltip
function BklitTooltip({ active, payload, label, unit = "", title = "", isDark = true }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const color = item.stroke || item.color || item.fill || "#f59e0b";
  const rawVal = item.value;
  const val = typeof rawVal === "number" ? rawVal.toFixed(1) : rawVal;

  return (
    <div
      style={{
        background: isDark ? "rgba(18, 20, 26, 0.92)" : "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.14)" : "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
        padding: "8px 12px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
        minWidth: "125px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: isDark ? "#94a3b8" : "#64748b",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
          <span style={{ fontSize: "11px", fontWeight: 600, color: isDark ? "#cbd5e1" : "#475569" }}>
            {title || item.name}
          </span>
        </div>
        <span style={{ fontSize: "13px", fontWeight: 800, color: isDark ? "#ffffff" : "#09090b" }}>
          {val} {unit}
        </span>
      </div>
    </div>
  );
}

const TIME_TICKS = [
  "8 Oct 11:00",
  "8 Oct 14:00",
  "8 Oct 17:00",
  "8 Oct 20:00",
  "8 Oct 23:00",
  "9 Oct 02:00",
  "9 Oct 05:00",
  "9 Oct 11:00",
];

export default function KloudtechStationView({ isDark = true, liveData = null }) {
  const chartsRef = useRef(null);
  const areChartsInView = useInView(chartsRef, { once: true, margin: "-40px" });
  const [dateRange, setDateRange] = useState("1 Day");
  const [interval, setInterval] = useState("1 hour");

  const displayTimestamp =
    liveData?.recordedAt || "October 9, 2026 11:12";
  const displayHeatIndex = liveData?.heatIndex !== undefined ? liveData.heatIndex : 51.3;
  const displayTemp = liveData?.temp !== undefined ? liveData.temp : 34.0;
  const displayHumidity = liveData?.humidity !== undefined ? liveData.humidity : 78.5;
  const displayPressure = liveData?.pressure || "1006.7 hPa";
  const displayWind = liveData?.wind || "0.7 kph N";
  const displayUv = liveData?.uv !== undefined ? liveData.uv : "--";
  const displayLight = liveData?.light || "54612.5 lux";
  const displayPrecip = liveData?.precip || "0.0 mm";
  const chartData = (liveData?.history && liveData.history.length > 0) ? liveData.history : POPOLON_AWS_HISTORY;

  const chartTicks = (chartData && chartData.length > 0)
    ? chartData.filter((_, idx) => idx % 3 === 0 || idx === chartData.length - 1).map((d) => d.time)
    : TIME_TICKS;

  const getHeatIndexBadge = (hi) => {
    const val = typeof hi === "number" ? hi : parseFloat(hi);
    if (isNaN(val)) return { label: "Normal", pillClass: "kloudtech-normal-pill", dotClass: "normal-dot" };
    if (val >= 52) return { label: "Extreme Danger", pillClass: "kloudtech-danger-pill", dotClass: "danger-dot" };
    if (val >= 42) return { label: "Danger", pillClass: "kloudtech-danger-pill", dotClass: "danger-dot" };
    if (val >= 33) return { label: "Extreme Caution", pillClass: "kloudtech-caution-pill", dotClass: "caution-dot" };
    if (val >= 27) return { label: "Caution", pillClass: "kloudtech-caution-pill", dotClass: "caution-dot" };
    return { label: "Normal", pillClass: "kloudtech-normal-pill", dotClass: "normal-dot" };
  };

  const heatBadge = getHeatIndexBadge(displayHeatIndex);

  // Export CSV function for "Download Data" button
  const handleDownloadData = () => {
    const headers =
      "Timestamp,Heat Index (°C),Temperature (°C),Humidity (%),Pressure (hPa),Wind Speed (kph),UV Index\n";
    const rows = chartData.map(
      (d) =>
        `${d.time},${d.heatIndex},${d.temp},${d.humidity},${d.pressure},${d.wind},${d.uv}`
    ).join("\n");
    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Popolon_AWS_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartTooltipStyle = {
    backgroundColor: isDark ? "rgba(18, 20, 26, 0.96)" : "rgba(255, 255, 255, 0.96)",
    borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)",
    borderRadius: "10px",
    color: isDark ? "#ffffff" : "#09090b",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
    fontSize: "12px",
    fontWeight: "600",
  };

  const gridStroke = isDark ? "#232630" : "#e4e4e7";
  const axisTickStyle = { fontSize: 10, fill: "#71717a" };

  return (
    <section className="kloudtech-section">
      {/* ──── 1. TOP BANNER (Dashboard Header) ──── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="kloudtech-top-banner"
      >
        <h1 className="kloudtech-main-heading">Dashboard</h1>
        <p className="kloudtech-main-subheading">
          Manage all users across the platform. Add, edit, assign roles, and control access to organizations and stations.
        </p>
      </motion.div>

      {/* ──── 2. STATION METADATA HEADER ──── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="kloudtech-station-header"
      >
        <div className="kloudtech-station-left">
          <div className="kloudtech-station-title-row">
            <h2 className="kloudtech-station-title">Popolon AWS - Palayan City</h2>
          </div>
          <p className="kloudtech-station-sub">
            {liveData?.isLive
              ? "Live meteorological & microclimate station telemetry for Palayan City"
              : "A weatherstation station located at Manacnac, Palayan City, Nueva Ecija, Philippines"}
          </p>
        </div>

        <div className="kloudtech-station-right">
          <div className="kloudtech-timestamp">{displayTimestamp}</div>
        </div>
      </motion.div>

      {/* ──── 3. LATEST DATA (8 SENSOR CARDS) ──── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="kloudtech-subheading-row"
      >
        <div className="kloudtech-subheading">
          <Sun size={15} className="kloudtech-subheading-icon" />
          <span>Latest Data</span>
        </div>
      </motion.div>

      <div className="kloudtech-metrics-grid">
        {/* 1. Heat Index */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.02, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card highlighted-heat"
        >
          <div className="kloudtech-card-icon-wrap heat-icon">
            <Flame size={19} strokeWidth={2.4} />
          </div>
          <div className="kloudtech-card-val heat-val">{displayHeatIndex} °C</div>
          <div className="kloudtech-card-label">Heat Index</div>
          <div className={heatBadge.pillClass}>
            <span className={heatBadge.dotClass} />
            {heatBadge.label}
          </div>
        </motion.div>

        {/* 2. Temperature */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card"
        >
          <div className="kloudtech-card-icon-wrap temp-icon">
            <Thermometer size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">{displayTemp} °C</div>
          <div className="kloudtech-card-label">Temperature</div>
        </motion.div>

        {/* 3. Humidity */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card"
        >
          <div className="kloudtech-card-icon-wrap humidity-icon">
            <Droplets size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">{displayHumidity} %</div>
          <div className="kloudtech-card-label">Humidity</div>
        </motion.div>

        {/* 4. Pressure */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.11, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card"
        >
          <div className="kloudtech-card-icon-wrap pressure-icon">
            <Gauge size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">{displayPressure}</div>
          <div className="kloudtech-card-label">Pressure</div>
        </motion.div>

        {/* 5. Wind */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card"
        >
          <div className="kloudtech-card-icon-wrap wind-icon">
            <Wind size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">{displayWind}</div>
          <div className="kloudtech-card-label">Wind</div>
        </motion.div>

        {/* 6. UV Index */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.17, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card"
        >
          <div className="kloudtech-card-icon-wrap uv-icon">
            <Sun size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">{displayUv}</div>
          <div className="kloudtech-card-label">UV Index</div>
        </motion.div>

        {/* 7. Light Intensity */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card"
        >
          <div className="kloudtech-card-icon-wrap light-icon">
            <Eye size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val light-val">{displayLight}</div>
          <div className="kloudtech-card-label">Light Intensity</div>
        </motion.div>

        {/* 8. Precipitation */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.45, delay: 0.23, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-metric-card"
        >
          <div className="kloudtech-card-icon-wrap precip-icon">
            <CloudRain size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">{displayPrecip}</div>
          <div className="kloudtech-card-label">Precipitation</div>
        </motion.div>
      </div>

      {/* ──── 4. HISTORICAL DATA CHARTS HEADER ──── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="kloudtech-charts-header-row"
      >
        <div className="kloudtech-subheading">
          <Zap size={15} className="kloudtech-subheading-icon" />
          <span>Historical Data Charts</span>
        </div>

        <div className="kloudtech-filter-controls">
          <div className="kloudtech-select-group">
            <span className="kloudtech-filter-label">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="kloudtech-select"
            >
              <option value="1 Day">1 Day</option>
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
            </select>
          </div>

          <div className="kloudtech-select-group">
            <span className="kloudtech-filter-label">Interval:</span>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="kloudtech-select"
            >
              <option value="1 hour">1 hour</option>
              <option value="3 hours">3 hours</option>
              <option value="6 hours">6 hours</option>
            </select>
          </div>

          <button className="kloudtech-download-btn" onClick={handleDownloadData}>
            Download Data
          </button>
        </div>
      </motion.div>

      {/* ──── 5. CHARTS 2x3 GRID ──── */}
      <div className="kloudtech-charts-grid" ref={chartsRef}>
        {/* CHART 1: Heat Index History */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.03, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-chart-card"
        >
          <div className="kloudtech-chart-header">
            <div className="kloudtech-chart-title">Heat Index History</div>
            <div className="bklit-chart-badge" style={{ color: "#f97316", background: "rgba(249, 115, 22, 0.12)", border: "1px solid rgba(249, 115, 22, 0.25)" }}>
              <span className="bklit-pulse-indicator" style={{ background: "#f97316" }} />
              <span>{displayHeatIndex} °C</span>
            </div>
          </div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="bklit-heat-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.42} />
                    <stop offset="60%" stopColor="#f97316" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} opacity={isDark ? 0.35 : 0.6} />
                <XAxis dataKey="time" ticks={chartTicks} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<BklitTooltip unit="°C" title="Heat Index" isDark={isDark} />} />
                <Area
                  type="monotone"
                  dataKey="heatIndex"
                  stroke="#f97316"
                  strokeWidth={2.4}
                  fill="url(#bklit-heat-grad)"
                  isAnimationActive={areChartsInView}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={60}
                  activeDot={<BklitActiveDot stroke="#f97316" />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* CHART 2: Temperature History */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-chart-card"
        >
          <div className="kloudtech-chart-header">
            <div className="kloudtech-chart-title">Temperature History</div>
            <div className="bklit-chart-badge" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
              <span className="bklit-pulse-indicator" style={{ background: "#ef4444" }} />
              <span>{displayTemp} °C</span>
            </div>
          </div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="bklit-temp-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.42} />
                    <stop offset="60%" stopColor="#ef4444" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} opacity={isDark ? 0.35 : 0.6} />
                <XAxis dataKey="time" ticks={chartTicks} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<BklitTooltip unit="°C" title="Temperature" isDark={isDark} />} />
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#ef4444"
                  strokeWidth={2.4}
                  fill="url(#bklit-temp-grad)"
                  isAnimationActive={areChartsInView}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={120}
                  activeDot={<BklitActiveDot stroke="#ef4444" />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* CHART 3: Humidity History */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.11, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-chart-card"
        >
          <div className="kloudtech-chart-header">
            <div className="kloudtech-chart-title">Humidity History</div>
            <div className="bklit-chart-badge" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.25)" }}>
              <span className="bklit-pulse-indicator" style={{ background: "#3b82f6" }} />
              <span>{typeof displayHumidity === "number" ? displayHumidity.toFixed(1) : displayHumidity} %</span>
            </div>
          </div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="bklit-humidity-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.42} />
                    <stop offset="60%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} opacity={isDark ? 0.35 : 0.6} />
                <XAxis dataKey="time" ticks={chartTicks} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<BklitTooltip unit="%" title="Humidity" isDark={isDark} />} />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={2.4}
                  fill="url(#bklit-humidity-grad)"
                  isAnimationActive={areChartsInView}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={180}
                  activeDot={<BklitActiveDot stroke="#3b82f6" />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* CHART 4: Pressure History */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-chart-card"
        >
          <div className="kloudtech-chart-header">
            <div className="kloudtech-chart-title">Pressure History</div>
            <div className="bklit-chart-badge" style={{ color: "#a855f7", background: "rgba(168, 85, 247, 0.12)", border: "1px solid rgba(168, 85, 247, 0.25)" }}>
              <span className="bklit-pulse-indicator" style={{ background: "#a855f7" }} />
              <span>{displayPressure}</span>
            </div>
          </div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id="bklit-pressure-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.42} />
                    <stop offset="60%" stopColor="#a855f7" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} opacity={isDark ? 0.35 : 0.6} />
                <XAxis dataKey="time" ticks={chartTicks} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<BklitTooltip unit="hPa" title="Pressure" isDark={isDark} />} />
                <Area
                  type="monotone"
                  dataKey="pressure"
                  stroke="#a855f7"
                  strokeWidth={2.4}
                  fill="url(#bklit-pressure-grad)"
                  isAnimationActive={areChartsInView}
                  animationDuration={1300}
                  animationEasing="ease-out"
                  animationBegin={240}
                  activeDot={<BklitActiveDot stroke="#a855f7" />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* CHART 5: Wind History */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.19, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-chart-card"
        >
          <div className="kloudtech-chart-header">
            <div className="kloudtech-chart-title">Wind History</div>
            <div className="bklit-chart-badge" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <span className="bklit-pulse-indicator" style={{ background: "#10b981" }} />
              <span>{displayWind}</span>
            </div>
          </div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="bklit-wind-bar-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} opacity={isDark ? 0.35 : 0.6} />
                <XAxis dataKey="time" ticks={chartTicks} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[0, "auto"]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<BklitTooltip unit="kph" title="Wind Speed" isDark={isDark} />} />
                <Bar
                  dataKey="wind"
                  fill="url(#bklit-wind-bar-grad)"
                  maxBarSize={16}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={areChartsInView}
                  animationDuration={1100}
                  animationEasing="ease-out"
                  animationBegin={280}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* CHART 6: UV Index History */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.5, delay: 0.23, ease: [0.16, 1, 0.3, 1] }}
          className="kloudtech-chart-card"
        >
          <div className="kloudtech-chart-header">
            <div className="kloudtech-chart-title">UV Index History</div>
            <div className="bklit-chart-badge" style={{ color: "#c084fc", background: "rgba(192, 132, 252, 0.12)", border: "1px solid rgba(192, 132, 252, 0.25)" }}>
              <span className="bklit-pulse-indicator" style={{ background: "#c084fc" }} />
              <span>UV {displayUv}</span>
            </div>
          </div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="bklit-uv-bar-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} opacity={isDark ? 0.35 : 0.6} />
                <XAxis dataKey="time" ticks={chartTicks} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[0, "auto"]} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<BklitTooltip unit="" title="UV Index" isDark={isDark} />} />
                <Bar
                  dataKey="uv"
                  fill="url(#bklit-uv-bar-grad)"
                  maxBarSize={16}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={areChartsInView}
                  animationDuration={1100}
                  animationEasing="ease-out"
                  animationBegin={340}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
