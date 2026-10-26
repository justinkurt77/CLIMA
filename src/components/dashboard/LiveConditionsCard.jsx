import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { useTheme } from "../../context/ThemeContext";
import {
  ChevronRight,
  CloudRain,
  Sun,
  Cloud,
  CloudSun,
  CloudLightning,
  Moon,
  Droplets,
  Compass,
  Gauge,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const SVG_WIDTH = 320;
const SVG_HEIGHT = 80;

function getWeatherIconComponent(iconName, size = 14) {
  switch (iconName) {
    case "Sun":
      return <Sun size={size} className="text-amber-400" />;
    case "CloudRain":
      return <CloudRain size={size} className="text-sky-400" />;
    case "CloudSun":
      return <CloudSun size={size} className="text-amber-300" />;
    case "CloudLightning":
      return <CloudLightning size={size} className="text-amber-500" />;
    case "Moon":
      return <Moon size={size} className="text-purple-300" />;
    case "Cloud":
    default:
      return <Cloud size={size} className="text-slate-400" />;
  }
}

function LiveConditionsCard({
  hourlyForecast = [],
  currentTemp = 28,
  currentHeatIndex,
  heatIndex = "Normal",
  rainChance = 0,
  humidity = 85,
  windSpeed = 1.2,
  pressure = "1008 hPa",
  onOpenModal,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const containerRef = useRef(null);
  const { isDark } = useTheme();

  const pastelBadgeStyle = useMemo(() => {
    switch (heatIndex) {
      case "Extreme Danger":
        return {
          background: isDark ? "rgba(153, 27, 27, 0.28)" : "rgba(254, 226, 226, 0.95)",
          color: isDark ? "#fda4af" : "#991b1b",
          border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.5)" : "rgba(153, 27, 27, 0.45)"}`,
        };
      case "Danger":
        return {
          background: isDark ? "rgba(239, 68, 68, 0.16)" : "rgba(254, 226, 226, 0.9)",
          color: isDark ? "#ef4444" : "#dc2626",
          border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(252, 165, 165, 0.75)"}`,
        };
      case "Extreme Caution":
        return {
          background: isDark ? "rgba(251, 146, 60, 0.16)" : "rgba(255, 237, 213, 0.9)",
          color: isDark ? "#fb923c" : "#ea580c",
          border: `1px solid ${isDark ? "rgba(251, 146, 60, 0.35)" : "rgba(253, 186, 116, 0.75)"}`,
        };
      case "Caution":
        return {
          background: isDark ? "rgba(250, 204, 21, 0.15)" : "rgba(254, 249, 195, 0.9)",
          color: isDark ? "#fde047" : "#ca8a04",
          border: `1px solid ${isDark ? "rgba(250, 204, 21, 0.32)" : "rgba(253, 224, 71, 0.75)"}`,
        };
      case "Normal":
      default:
        return {
          background: isDark ? "rgba(74, 222, 128, 0.15)" : "rgba(220, 252, 231, 0.9)",
          color: isDark ? "#86efac" : "#16a34a",
          border: `1px solid ${isDark ? "rgba(74, 222, 128, 0.32)" : "rgba(134, 239, 172, 0.75)"}`,
        };
    }
  }, [heatIndex, isDark]);

  // Clean numeric parsing for bottom sensor stats
  const numericHumidity = useMemo(() => {
    if (typeof humidity === "number") return Math.round(humidity);
    const parsed = parseFloat(humidity);
    return Number.isNaN(parsed) ? 85 : Math.round(parsed);
  }, [humidity]);

  const numericWind = useMemo(() => {
    if (typeof windSpeed === "number") return Math.round(windSpeed * 10) / 10;
    const parsed = parseFloat(windSpeed);
    return Number.isNaN(parsed) ? 0 : Math.round(parsed * 10) / 10;
  }, [windSpeed]);

  const numericPressure = useMemo(() => {
    if (typeof pressure === "number") return Math.round(pressure);
    const parsed = parseFloat(pressure);
    return Number.isNaN(parsed) ? 1008 : Math.round(parsed);
  }, [pressure]);

  // Compute smooth temperature wave curve matching hourly forecast
  // Uses monotonic horizontal-tangent cubic bezier for natural, organic crest
  const { points, pathD, areaD, peakPt, defaultPt } = useMemo(() => {
    const temps =
      hourlyForecast && hourlyForecast.length >= 2
        ? hourlyForecast.map((h) =>
            typeof h.temp === "number" && !Number.isNaN(h.temp) ? h.temp : currentTemp
          )
        : [currentTemp, currentTemp + 2, currentTemp + 3, currentTemp + 2, currentTemp + 1];

    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const range = max - min || 2;

    const pts = temps.map((t, i) => {
      const x = 14 + i * (292 / (temps.length - 1));
      // Generous 44px vertical amplitude from y=16 (crest) to y=60 (base)
      const y = 60 - ((t - min) / range) * 44;
      return {
        x: Math.round(x),
        y: Math.round(y),
        temp: t,
        time: hourlyForecast[i]?.time || (i === 0 ? "Now" : `+${i}h`),
        rain: hourlyForecast[i]?.rain || (rainChance ? `${rainChance}%` : "0%"),
        icon: hourlyForecast[i]?.icon,
        index: i,
      };
    });

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = Math.round(p0.x + (p1.x - p0.x) / 2);
      const cpY1 = p0.y;
      const cpX2 = Math.round(p0.x + (p1.x - p0.x) / 2);
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const lastPt = pts[pts.length - 1];
    const area = `${d} L ${lastPt.x} 76 L ${pts[0].x} 76 Z`;

    // Peak temperature point on the crest
    const peak = pts.reduce((prev, cur) => (cur.y < prev.y ? cur : prev), pts[0]);
    const nowPoint = pts.find((p) => p.time === "Now") || pts[0];

    return {
      points: pts,
      pathD: d,
      areaD: area,
      peakPt: peak,
      defaultPt: peak, // Rests at the top crest for stunning visual balance
    };
  }, [hourlyForecast, currentTemp, rainChance]);

  // Calculate average temperature
  const avgTemp = useMemo(() => {
    if (points.length === 0) return currentTemp;
    const sum = points.reduce((acc, p) => acc + p.temp, 0);
    return Math.round(sum / points.length);
  }, [points, currentTemp]);

  // Active state during scrubbing
  const isHovered = hoveredPoint !== null;
  const activePt = hoveredPoint || defaultPt;
  const displayTemp = activePt ? activePt.temp : currentTemp;
  const displayLabel = isHovered ? activePt.time : "Now";
  const displayRain = isHovered
    ? activePt.rain ? `${activePt.rain} Rain` : "0% Rain"
    : `${rainChance}% Rain`;

  // Compute trend delta relative to average
  const trendVal = Math.round(displayTemp - avgTemp);
  const trendPercent = avgTemp > 0 ? (((displayTemp - avgTemp) / avgTemp) * 100).toFixed(1) : 0;

  // Interactive mouse/touch scrub handler
  const handlePointerInteraction = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container || points.length === 0) return;

      const rect = container.getBoundingClientRect();
      const clientX =
        e.clientX !== undefined
          ? e.clientX
          : e.touches && e.touches[0]
          ? e.touches[0].clientX
          : undefined;

      if (clientX === undefined) return;

      const relX = ((clientX - rect.left) / rect.width) * SVG_WIDTH;

      // Find closest hourly point
      let closest = points[0];
      let minDiff = Math.abs(points[0].x - relX);
      for (let i = 1; i < points.length; i++) {
        const diff = Math.abs(points[i].x - relX);
        if (diff < minDiff) {
          minDiff = diff;
          closest = points[i];
        }
      }
      setHoveredPoint(closest);
    },
    [points]
  );

  const handlePointerEnd = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="desktop-card desktop-live-conditions-card"
    >
      {/* ── CARD HEADER ── */}
      <div className="desktop-card-header">
        <div
          className="desktop-card-title-row"
          onClick={onOpenModal}
          role="button"
          tabIndex={0}
        >
          <span className="desktop-card-title">Live Conditions</span>
          <ChevronRight size={17} className="desktop-chevron" />
        </div>

        {/* Dynamic Trend / Heat Index Badge */}
        <AnimatePresence mode="wait">
          {isHovered ? (
            <motion.div
              key="hover-trend"
              initial={{ opacity: 0, scale: 0.92, y: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 2 }}
              transition={{ duration: 0.18 }}
              className={`desktop-bklit-badge ${
                trendVal >= 0 ? "desktop-bklit-badge-pos" : "desktop-bklit-badge-neg"
              }`}
            >
              {trendVal >= 0 ? (
                <TrendingUp size={12} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={12} strokeWidth={2.5} />
              )}
              <span>
                {trendVal >= 0 ? `+${trendPercent}%` : `${trendPercent}%`}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="static-badge"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              className="desktop-danger-badge"
              style={pastelBadgeStyle}
            >
              {heatIndex}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SUB HEADER: NumberFlow Temperature & Rain Meta ── */}
      <div className="desktop-conditions-meta">
        <div className="desktop-rate-val" title="Live Temperature & Precipitation">
          <span className="desktop-live-temp-flow">
            <NumberFlow
              value={displayTemp}
              suffix="°"
              format={{ maximumFractionDigits: 0 }}
              isolate
              willChange
            />
          </span>
          <span className="desktop-live-temp-tag">{displayLabel}</span>
          <span className="desktop-meta-sep">•</span>
          {isHovered && activePt?.icon ? (
            getWeatherIconComponent(activePt.icon, 14)
          ) : (
            <CloudRain size={14} strokeWidth={2.4} />
          )}
          <span>{displayRain}</span>
        </div>
      </div>

      {/* ── SPARKLINE WITH BKLIT UI ENTRANCE REVEAL & EDGE FADE MASK ── */}
      <div
        className="desktop-wave-container"
        ref={containerRef}
        onPointerMove={handlePointerInteraction}
        onPointerDown={handlePointerInteraction}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onTouchMove={handlePointerInteraction}
        onTouchStart={handlePointerInteraction}
        onTouchEnd={handlePointerEnd}
        style={{ touchAction: "none" }}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="desktop-wave-svg"
        >
          <defs>
            {/* Smooth Vibrant Gradient across the temperature wave */}
            <linearGradient
              id="liveWaveGrad"
              x1="0"
              y1="0"
              x2={SVG_WIDTH}
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="42%" stopColor="#a855f7" />
              <stop offset="80%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            {/* Subtle Vertical Area Fill Gradient */}
            <linearGradient
              id="liveAreaGrad"
              x1="0"
              y1="0"
              x2="0"
              y2={SVG_HEIGHT}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing marker blur filter */}
            <filter
              id="glowFilter"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Bklit UI Edge Fade Mask: Fades gracefully to transparent at boundaries */}
            <mask id="bklitEdgeMask">
              <linearGradient
                id="edgeFadeGrad"
                x1="0"
                y1="0"
                x2={SVG_WIDTH}
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="6%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="94%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <rect
                x="0"
                y="0"
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                fill="url(#edgeFadeGrad)"
              />
            </mask>

            {/* Entrance Reveal Clip: Sweeps in from left to right on mount */}
            <clipPath id="chartRevealClip">
              <motion.rect
                x="0"
                y="0"
                height={SVG_HEIGHT}
                initial={{ width: 0 }}
                animate={{ width: SVG_WIDTH }}
                transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              />
            </clipPath>
          </defs>

          {/* Group masked by Edge Fade & Animated Clip Reveal */}
          <g mask="url(#bklitEdgeMask)">
            <g clipPath="url(#chartRevealClip)">
              {/* Gradient area under temperature curve */}
              {areaD && (
                <motion.path
                  d={areaD}
                  fill="url(#liveAreaGrad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.15 }}
                />
              )}

              {/* Flowing curve line with draw-in animation */}
              <motion.path
                d={pathD}
                stroke="url(#liveWaveGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Interactive Vertical Hairline Laser Beam on Hover */}
              <AnimatePresence>
                {isHovered && activePt && (
                  <motion.line
                    key={`guide-${activePt.x}`}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 0.38, scaleY: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    x1={activePt.x}
                    y1={activePt.y + 5}
                    x2={activePt.x}
                    y2={76}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeDasharray="2.5 3"
                    className="text-white/60"
                  />
                )}
              </AnimatePresence>
            </g>
          </g>

          {/* Full-coverage transparent capture rect for high-precision pointer tracking */}
          <rect
            x="0"
            y="0"
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            fill="transparent"
            style={{ cursor: "crosshair", pointerEvents: "all" }}
            onPointerMove={handlePointerInteraction}
            onPointerDown={handlePointerInteraction}
            onPointerLeave={handlePointerEnd}
          />

          {/* Ambient Radar Pulse Ring around the active point (perfect round circle) */}
          {activePt && (
            <motion.circle
              animate={{
                cx: activePt.x,
                cy: activePt.y,
                r: isHovered ? [6, 13, 6] : [5.5, 11.5, 5.5],
                opacity: isHovered ? [0.75, 0, 0.75] : [0.45, 0, 0.45],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut",
              }}
              fill="none"
              stroke="#f97316"
              strokeWidth="1.6"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Glowing Marker Dot Tracking the Curve with Spring Physics (perfect round circle) */}
          {activePt && (
            <motion.circle
              animate={{
                cx: activePt.x,
                cy: activePt.y,
                r: isHovered ? 6 : 5.5,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 26,
                mass: 0.6,
              }}
              fill="#ffffff"
              stroke="#1e1e24"
              strokeWidth="2.5"
              filter="url(#glowFilter)"
              style={{ pointerEvents: "none" }}
            />
          )}
        </svg>
      </div>

      {/* ── BOTTOM SENSOR STATS (HUMIDITY, WIND, PRESSURE) WITH NUMBERFLOW ── */}
      <div className="desktop-conditions-stats">
        <div className="desktop-stat-item">
          <div className="desktop-stat-label">
            <Droplets size={14} className="text-sky-400" />
            <span>
              <NumberFlow
                value={numericHumidity}
                suffix="%"
                format={{ maximumFractionDigits: 0 }}
                willChange
              />
            </span>
          </div>
          <div className="desktop-stat-sub">Humidity</div>
        </div>

        <div className="desktop-stat-item">
          <div className="desktop-stat-label">
            <Compass size={14} className="text-emerald-400" />
            <span>
              <NumberFlow
                value={numericWind}
                suffix=" km/h"
                format={{ minimumFractionDigits: 0, maximumFractionDigits: 1 }}
                willChange
              />
            </span>
          </div>
          <div className="desktop-stat-sub">Wind</div>
        </div>

        <div className="desktop-stat-item">
          <div className="desktop-stat-label">
            <Gauge size={14} className="text-indigo-400" />
            <span>
              <NumberFlow
                value={numericPressure}
                suffix=" hPa"
                format={{ maximumFractionDigits: 0 }}
                willChange
              />
            </span>
          </div>
          <div className="desktop-stat-sub">Pressure</div>
        </div>
      </div>
    </motion.div>
  );
}

const MemoizedLiveConditionsCard = React.memo(LiveConditionsCard);
export default MemoizedLiveConditionsCard;
