import React, { useState } from "react";
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

export default function KloudtechStationView({ isDark = true }) {
  const [dateRange, setDateRange] = useState("1 Day");
  const [interval, setInterval] = useState("1 hour");

  // Export CSV function for "Download Data" button
  const handleDownloadData = () => {
    const headers =
      "Timestamp,Heat Index (°C),Temperature (°C),Humidity (%),Pressure (hPa),Wind Speed (kph),UV Index\n";
    const rows = POPOLON_AWS_HISTORY.map(
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
      <div className="kloudtech-top-banner">
        <h1 className="kloudtech-main-heading">Dashboard</h1>
        <p className="kloudtech-main-subheading">
          Manage all users across the platform. Add, edit, assign roles, and control access to organizations and stations.
        </p>
      </div>

      {/* ──── 2. STATION METADATA HEADER ──── */}
      <div className="kloudtech-station-header">
        <div className="kloudtech-station-left">
          <div className="kloudtech-station-title-row">
            <h2 className="kloudtech-station-title">Popolon AWS - Palayan City</h2>
          </div>
          <p className="kloudtech-station-sub">
            A weatherstation station located at Manacnac, Palayan City, Nueva Ecija, Philippines
          </p>
        </div>

        <div className="kloudtech-station-right">
          <div className="kloudtech-timestamp">October 9, 2026 11:12</div>
        </div>
      </div>

      {/* ──── 3. LATEST DATA (8 SENSOR CARDS) ──── */}
      <div className="kloudtech-subheading-row">
        <div className="kloudtech-subheading">
          <Sun size={15} className="kloudtech-subheading-icon" />
          <span>Latest Data</span>
        </div>
      </div>

      <div className="kloudtech-metrics-grid">
        {/* 1. Heat Index */}
        <div className="kloudtech-metric-card highlighted-heat">
          <div className="kloudtech-card-icon-wrap heat-icon">
            <Flame size={19} strokeWidth={2.4} />
          </div>
          <div className="kloudtech-card-val heat-val">51.3 °C</div>
          <div className="kloudtech-card-label">Heat Index</div>
          <div className="kloudtech-danger-pill">
            <span className="danger-dot" />
            Danger
          </div>
        </div>

        {/* 2. Temperature */}
        <div className="kloudtech-metric-card">
          <div className="kloudtech-card-icon-wrap temp-icon">
            <Thermometer size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">34.0 °C</div>
          <div className="kloudtech-card-label">Temperature</div>
        </div>

        {/* 3. Humidity */}
        <div className="kloudtech-metric-card">
          <div className="kloudtech-card-icon-wrap humidity-icon">
            <Droplets size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">78.5 %</div>
          <div className="kloudtech-card-label">Humidity</div>
        </div>

        {/* 4. Pressure */}
        <div className="kloudtech-metric-card">
          <div className="kloudtech-card-icon-wrap pressure-icon">
            <Gauge size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">1006.7 hPa</div>
          <div className="kloudtech-card-label">Pressure</div>
        </div>

        {/* 5. Wind */}
        <div className="kloudtech-metric-card">
          <div className="kloudtech-card-icon-wrap wind-icon">
            <Wind size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">0.7 kph N</div>
          <div className="kloudtech-card-label">Wind</div>
        </div>

        {/* 6. UV Index */}
        <div className="kloudtech-metric-card">
          <div className="kloudtech-card-icon-wrap uv-icon">
            <Sun size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">--</div>
          <div className="kloudtech-card-label">UV Index</div>
        </div>

        {/* 7. Light Intensity */}
        <div className="kloudtech-metric-card">
          <div className="kloudtech-card-icon-wrap light-icon">
            <Eye size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val light-val">54612.5 lux</div>
          <div className="kloudtech-card-label">Light Intensity</div>
        </div>

        {/* 8. Precipitation */}
        <div className="kloudtech-metric-card">
          <div className="kloudtech-card-icon-wrap precip-icon">
            <CloudRain size={19} strokeWidth={2.2} />
          </div>
          <div className="kloudtech-card-val">--</div>
          <div className="kloudtech-card-label">Precipitation</div>
        </div>
      </div>

      {/* ──── 4. HISTORICAL DATA CHARTS HEADER ──── */}
      <div className="kloudtech-charts-header-row">
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
      </div>

      {/* ──── 5. CHARTS 2x3 GRID ──── */}
      <div className="kloudtech-charts-grid">
        {/* CHART 1: Heat Index History */}
        <div className="kloudtech-chart-card">
          <div className="kloudtech-chart-title">Heat Index History</div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={POPOLON_AWS_HISTORY} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" ticks={TIME_TICKS} tick={axisTickStyle} />
                <YAxis domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} tick={axisTickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => [`${val} °C`, "Heat Index"]} />
                <Area type="monotone" dataKey="heatIndex" stroke="#ea580c" strokeWidth={2.4} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Temperature History */}
        <div className="kloudtech-chart-card">
          <div className="kloudtech-chart-title">Temperature History</div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={POPOLON_AWS_HISTORY} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" ticks={TIME_TICKS} tick={axisTickStyle} />
                <YAxis domain={[0, 38]} ticks={[0, 9, 18, 27, 38]} tick={axisTickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => [`${val} °C`, "Temperature"]} />
                <Area type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2.4} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Humidity History */}
        <div className="kloudtech-chart-card">
          <div className="kloudtech-chart-title">Humidity History</div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={POPOLON_AWS_HISTORY} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" ticks={TIME_TICKS} tick={axisTickStyle} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => [`${val} %`, "Humidity"]} />
                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} fill="#1d4ed8" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Pressure History */}
        <div className="kloudtech-chart-card">
          <div className="kloudtech-chart-title">Pressure History</div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={POPOLON_AWS_HISTORY} margin={{ top: 12, right: 12, left: -6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" ticks={TIME_TICKS} tick={axisTickStyle} />
                <YAxis domain={[984, 1029]} ticks={[984, 999, 1014, 1029]} tick={axisTickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => [`${val} hPa`, "Pressure"]} />
                <Area type="monotone" dataKey="pressure" stroke="#7c3aed" strokeWidth={2} fill="#6d28d9" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Wind History */}
        <div className="kloudtech-chart-card">
          <div className="kloudtech-chart-title">Wind History</div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={POPOLON_AWS_HISTORY} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" ticks={TIME_TICKS} tick={axisTickStyle} />
                <YAxis domain={[0, 3]} ticks={[0, 0.75, 1.5, 2.25, 3]} tick={axisTickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => [`${val} kph`, "Wind Speed"]} />
                <Bar dataKey="wind" fill="#22c55e" maxBarSize={14} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 6: UV Index History */}
        <div className="kloudtech-chart-card">
          <div className="kloudtech-chart-title">UV Index History</div>
          <div className="kloudtech-chart-body">
            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={POPOLON_AWS_HISTORY} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" ticks={TIME_TICKS} tick={axisTickStyle} />
                <YAxis domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} tick={axisTickStyle} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => [`${val}`, "UV Index"]} />
                <Bar dataKey="uv" fill="#a855f7" maxBarSize={14} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
