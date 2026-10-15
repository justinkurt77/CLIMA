import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  X,
  LocateFixed,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Sun,
  Moon,
  Globe,
  CloudRain,
  MapPin,
  Radio,
  Flame,
} from "lucide-react";
import { PinMarker } from "../map/MapPins";
import { useLiveOpsData, getHeatRisk } from "../../hooks/useLiveOpsData";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
const TZ = "Asia/Manila";

const getZTokens = (isDark) => ({
  50: isDark ? "#000000" : "#ffffff",
  100: isDark ? "#09090b" : "#f8f9fa",
  200: isDark ? "#121214" : "#ffffff",
  300: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.10)",
  400: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.18)",
  500: isDark ? "#52525b" : "#a1a1aa",
  600: isDark ? "#71717a" : "#71717a",
  700: isDark ? "#a1a1aa" : "#52525b",
  800: isDark ? "#e4e4e7" : "#27272a",
  900: "#f59e0b",
  950: isDark ? "#ffffff" : "#09090b",
  glassBg: isDark ? "rgba(18, 18, 20, 0.92)" : "rgba(255, 255, 255, 0.94)",
});

const SC = { pending: "#ef4444", inprogress: "#3b82f6", resolved: "#22c55e" };
const SBG = {
  pending: "rgba(239, 68, 68, 0.15)",
  inprogress: "rgba(59, 130, 246, 0.15)",
  resolved: "rgba(34, 197, 94, 0.15)",
};
const SL = { pending: "Pending", inprogress: "In Progress", resolved: "Resolved" };

const dayKey = (value) => new Date(value).toLocaleDateString("en-CA", { timeZone: TZ });
const fmtDateTime = (value) =>
  new Date(value).toLocaleString("en-PH", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const fmtClock = (d) =>
  d
    ? d.toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit", second: "2-digit" })
    : "—";

const hasCoords = (r) =>
  r &&
  r.lat !== null &&
  r.lat !== undefined &&
  r.lng !== null &&
  r.lng !== undefined &&
  !Number.isNaN(Number(r.lat)) &&
  !Number.isNaN(Number(r.lng));

function useNow(ms = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const ago = (date, now) => {
  if (!date) return "—";
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

export default function AdminOverviewCommand({
  reports = [],
  onViewReport,
  isDark = true,
  isSuperadmin,
  adminDepartment,
  currentUser,
  leftInset = 82,
}) {
  const Z = useMemo(() => getZTokens(isDark), [isDark]);
  const now = useNow();
  const { stations, weather, city, facilities } = useLiveOpsData();

  const [taskFilter, setTaskFilter] = useState("active");
  const [selectedReport, setSelectedReport] = useState(null);
  const [infoPopup, setInfoPopup] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isTelemetryVisible, setIsTelemetryVisible] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef(null);
  const didFit = useRef(false);

  // Basemap style state: defaults strictly to Dark Mode or Light Mode based on theme.
  // Never defaults to Satellite view.
  const [mapStyleId, setMapStyleId] = useState(() => (isDark ? "dark-v11" : "streets-v12"));

  // Keep in sync with app-wide dark/light theme unless user explicitly chose satellite
  useEffect(() => {
    setMapStyleId((prev) => {
      if (prev === "satellite-streets-v12") return prev;
      return isDark ? "dark-v11" : "streets-v12";
    });
  }, [isDark]);

  // Apply custom light styling for streets-v12 on load (matching client-side map)
  const handleMapLoad = useCallback(
    (e) => {
      setMapLoaded(true);
      const map = e.target;
      if (mapStyleId === "streets-v12") {
        const roadColor = "#c8d4e0";
        const roadCasing = "#dce6ef";
        [
          "road-local",
          "road-minor",
          "road-street",
          "road-secondary-tertiary",
          "road-primary",
          "road-motorway-trunk",
        ].forEach((id) => {
          if (map.getLayer(id)) map.setPaintProperty(id, "line-color", roadColor);
        });
        [
          "road-local-case",
          "road-minor-case",
          "road-street-case",
          "road-secondary-tertiary-case",
          "road-primary-case",
          "road-motorway-trunk-case",
        ].forEach((id) => {
          if (map.getLayer(id)) map.setPaintProperty(id, "line-color", roadCasing);
        });
        if (map.getLayer("building")) {
          map.setPaintProperty("building", "fill-color", "#f5f3f0");
          map.setPaintProperty("building", "fill-outline-color", "#e8e4e0");
        }
      }
    },
    [mapStyleId],
  );

  /* ── Reports ── */
  const mappedReports = useMemo(() => reports.filter(hasCoords), [reports]);

  const counts = useMemo(() => {
    const today = dayKey(now);
    const c = { pending: 0, inprogress: 0, resolved: 0, today: 0 };
    reports.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status] += 1;
      if (r.created_at && dayKey(r.created_at) === today) c.today += 1;
    });
    return c;
  }, [reports, now]);

  const activeCount = counts.pending + counts.inprogress;

  const filteredReports = useMemo(
    () =>
      reports.filter((r) =>
        taskFilter === "resolved" ? r.status === "resolved" : r.status !== "resolved",
      ),
    [reports, taskFilter],
  );

  /* ── Weather: live KloudTech AWS station first, Open-Meteo as real-time fallback ── */
  const liveStation = useMemo(
    () => (stations.isLive ? stations.list.find((s) => s.heatIndex !== null || s.temp !== null) : null),
    [stations],
  );
  const cur = weather.current;
  const conditions = liveStation
    ? {
        source: liveStation.name,
        isLive: true,
        heroLabel: "Heat Index",
        hero: liveStation.heatIndex,
        risk: getHeatRisk(liveStation.heatIndex),
        temp: liveStation.temp,
        humidity: liveStation.humidity,
        wind: liveStation.wind,
        pressure: liveStation.pressure,
        uv: liveStation.uv,
        rain: liveStation.rain,
        stamp: stations.fetchedAt,
      }
    : cur
      ? {
          source: "Open-Meteo Live Model",
          isLive: false,
          heroLabel: "Feels-like",
          hero: cur.apparent_temperature,
          risk: getHeatRisk(cur.apparent_temperature),
          temp: cur.temperature_2m,
          humidity: cur.relative_humidity_2m,
          wind: cur.wind_speed_10m,
          pressure: cur.surface_pressure,
          uv: cur.uv_index,
          rain: cur.precipitation,
          stamp: weather.fetchedAt,
        }
      : null;

  /* ── Map framing helper ── */
  const fitCity = useCallback(
    (animated = true) => {
      if (!mapRef.current) return;
      if (city.bounds) {
        const { south, west, north, east } = city.bounds;
        mapRef.current.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          {
            padding: { top: 90, bottom: 90, left: leftInset + 60, right: isInspectorOpen ? 410 : 60 },
            duration: animated ? 1100 : 0,
            pitch: 0,
            bearing: 0,
          },
        );
      } else {
        mapRef.current.flyTo({ center: [121.0827, 15.5398], zoom: 12.2, duration: 1000 });
      }
    },
    [city.bounds, leftInset, isInspectorOpen],
  );

  // Frame the city once ready
  useEffect(() => {
    if (mapLoaded && city.bounds && !didFit.current) {
      didFit.current = true;
      fitCity(false);
    }
  }, [mapLoaded, city.bounds, fitCity]);

  const selectReport = (r) => {
    setInfoPopup(null);
    setSelectedReport(r);
    if (hasCoords(r) && mapRef.current) {
      mapRef.current.flyTo({ center: [Number(r.lng), Number(r.lat)], zoom: 16.5, duration: 1000 });
    }
  };

  const clearSelection = () => {
    setSelectedReport(null);
    setInfoPopup(null);
  };

  const sectionLabel = {
    fontSize: 9,
    color: Z[700],
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  };
  const card = {
    background: Z[50],
    border: `1px solid ${Z[300]}`,
    borderRadius: 14,
    padding: "12px 14px",
  };

  const stationLabelPositions = stations.list.filter((s) => s.location);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: Z[50],
        color: Z[950],
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <style>{`
        @keyframes climaLivePulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>

      {/* ═══ MAP CANVAS ═══ */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {MAPBOX_TOKEN ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: 121.0827, latitude: 15.5398, zoom: 12.2, pitch: 0 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={`mapbox://styles/mapbox/${mapStyleId}`}
            attributionControl={false}
            antialias={false}
            onLoad={handleMapLoad}
            onClick={clearSelection}
          >
            {/* Real Palayan City barangay boundaries */}
            <Source id="palayan-barangays-source" type="geojson" data="/palayan-barangays.geojson">
              <Layer
                id="barangay-fill-layer"
                type="fill"
                paint={{ "fill-color": "#f59e0b", "fill-opacity": isDark ? 0.08 : 0.05 }}
              />
              <Layer
                id="barangay-stroke-layer"
                type="line"
                paint={{
                  "line-color": "#f59e0b",
                  "line-width": 1.6,
                  "line-opacity": isDark ? 0.8 : 0.65,
                }}
              />
            </Source>

            {/* Real facilities (OpenStreetMap) inside the city limits */}
            {facilities.items.map((f) => (
              <Marker key={f.id} longitude={f.lng} latitude={f.lat} anchor="center">
                <div
                  title={`${f.name} · ${f.category}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReport(null);
                    setInfoPopup({
                      lng: f.lng,
                      lat: f.lat,
                      title: f.name,
                      subtitle: f.category,
                      color: f.color,
                    });
                  }}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: f.color,
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                />
              </Marker>
            ))}

            {/* KloudTech IoT Weather Stations */}
            {stationLabelPositions.map((s) => {
              const risk = getHeatRisk(stations.isLive ? s.heatIndex : null);
              return (
                <Marker key={s.id} longitude={s.location[0]} latitude={s.location[1]} anchor="center">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(null);
                      setInfoPopup({
                        lng: s.location[0],
                        lat: s.location[1],
                        title: s.name,
                        subtitle: stations.isLive ? "KloudTech IoT AWS · LIVE" : "KloudTech IoT AWS · Standby",
                        color: risk.color,
                        lines: stations.isLive
                          ? [
                              s.heatIndex !== null && `Heat index ${s.heatIndex.toFixed(1)}°C · ${risk.label}`,
                              s.temp !== null && `Temperature ${s.temp.toFixed(1)}°C`,
                              s.humidity !== null && `Humidity ${s.humidity.toFixed(0)}%`,
                            ].filter(Boolean)
                          : ["Telemetry standby"],
                      });
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 38,
                        height: 38,
                        padding: "0 6px",
                        borderRadius: 19,
                        background: risk.color,
                        border: "2px solid #ffffff",
                        boxShadow: `0 0 16px ${risk.color}99`,
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {stations.isLive && s.heatIndex !== null ? `${Math.round(s.heatIndex)}°` : "—"}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 6,
                        background: "rgba(9,9,11,0.85)",
                        color: "#fff",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name}
                    </span>
                  </div>
                </Marker>
              );
            })}

            {/* Real citizen reports (live from Supabase) */}
            {mappedReports.map((r) => (
              <Marker
                key={r.id}
                longitude={Number(r.lng)}
                latitude={Number(r.lat)}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setInfoPopup(null);
                  setSelectedReport(r);
                }}
              >
                <PinMarker color={SC[r.status] || SC.pending} icon={r.icon} />
              </Marker>
            ))}

            {selectedReport && hasCoords(selectedReport) && (
              <Popup
                longitude={Number(selectedReport.lng)}
                latitude={Number(selectedReport.lat)}
                anchor="bottom"
                offset={36}
                closeButton={false}
                closeOnClick={false}
                maxWidth="260px"
              >
                <div style={{ fontFamily: "'Nunito', sans-serif", color: "#09090b", minWidth: 180 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 10,
                      background: SBG[selectedReport.status] || SBG.pending,
                      color: SC[selectedReport.status] || SC.pending,
                    }}
                  >
                    {SL[selectedReport.status] || selectedReport.status}
                  </span>
                  <p style={{ margin: "6px 0 2px", fontSize: 13, fontWeight: 900 }}>{selectedReport.title}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#52525b", fontWeight: 700 }}>
                    {selectedReport.category || "Uncategorized"} · {fmtDateTime(selectedReport.created_at)}
                  </p>
                </div>
              </Popup>
            )}

            {infoPopup && (
              <Popup
                longitude={infoPopup.lng}
                latitude={infoPopup.lat}
                anchor="bottom"
                offset={14}
                closeButton={false}
                closeOnClick={false}
                maxWidth="260px"
              >
                <div style={{ fontFamily: "'Nunito', sans-serif", color: "#09090b", minWidth: 170 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900 }}>{infoPopup.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: infoPopup.color, fontWeight: 800 }}>
                    {infoPopup.subtitle}
                  </p>
                  {(infoPopup.lines || []).map((l) => (
                    <p key={l} style={{ margin: "3px 0 0", fontSize: 11, fontWeight: 700, color: "#27272a" }}>
                      {l}
                    </p>
                  ))}
                </div>
              </Popup>
            )}
          </Map>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: Z[100],
              color: Z[600],
            }}
          >
            Mapbox token required
          </div>
        )}
      </div>

      {/* ═══ MAP STYLE PILL & RECENTER BUTTON (EXACTLY LIKE CLIENT-SIDE MAP) ═══ */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: isInspectorOpen ? 394 : 20,
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
          transition: "right 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Style Pill */}
        <div
          role="radiogroup"
          aria-label="Map style"
          style={{
            background: isDark ? "rgba(18, 18, 20, 0.94)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 36,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            boxShadow: isDark ? "0 10px 28px rgba(0,0,0,0.6)" : "0 10px 28px rgba(0,0,0,0.12)",
            alignItems: "center",
          }}
        >
          {[
            { id: "dark-v11", Icon: Moon, title: "Dark Mode" },
            { id: "streets-v12", Icon: Sun, title: "Light Mode" },
            { id: "satellite-streets-v12", Icon: Globe, title: "Satellite View" },
          ].map((layer) => {
            const isActive = mapStyleId === layer.id;
            return (
              <button
                key={layer.id}
                role="radio"
                aria-checked={isActive}
                onClick={() => setMapStyleId(layer.id)}
                title={layer.title}
                aria-label={layer.title}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: isActive ? "linear-gradient(135deg, #f59e0b, #f97316)" : "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 4px 14px rgba(245, 158, 11, 0.45)" : "none",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <layer.Icon
                  size={20}
                  color={isActive ? "#ffffff" : isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)"}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </button>
            );
          })}
        </div>

        {/* Recenter Button */}
        <button
          onClick={() => fitCity(true)}
          title="Frame Palayan City"
          aria-label="Frame Palayan City"
          style={{
            width: 50,
            height: 50,
            borderRadius: 24,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
            background: isDark ? "rgba(18, 18, 20, 0.94)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
            color: isDark ? "#ffffff" : "#09090b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <LocateFixed size={20} />
        </button>
      </div>

      {/* ═══ BOTTOM REAL-TIME TELEMETRY STRIP (JUST LIKE CLIENT-SIDE MAP) ═══ */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: leftInset + 16,
          right: isInspectorOpen ? 468 : 88,
          zIndex: 25,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "right 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <button
          onClick={() => setIsTelemetryVisible((v) => !v)}
          style={{
            padding: "8px 12px",
            borderRadius: 9999,
            border: `1px solid ${Z[300]}`,
            background: Z.glassBg,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            color: Z[700],
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
            boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.5)" : "0 4px 14px rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        >
          {isTelemetryVisible ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          <span>{isTelemetryVisible ? "Hide" : "Live Telemetry"}</span>
        </button>

        <AnimatePresence>
          {isTelemetryVisible && conditions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                overflowX: "auto",
                scrollbarWidth: "none",
                padding: "2px 0",
              }}
            >
              {/* Heat Index Hero */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 9999,
                  background: isDark ? "rgba(22, 16, 12, 0.94)" : "rgba(254, 243, 199, 0.92)",
                  border: `1.5px solid ${conditions.risk?.color || "#f59e0b"}`,
                  boxShadow: `0 4px 18px ${conditions.risk?.color || "#f59e0b"}40`,
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  flexShrink: 0,
                }}
              >
                <Flame size={15} color={conditions.risk?.color || "#f59e0b"} />
                <span style={{ fontSize: 11, fontWeight: 800, color: Z[700] }}>Heat Index</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: conditions.risk?.color || "#f59e0b",
                  }}
                >
                  {conditions.hero !== null && conditions.hero !== undefined
                    ? `${Number(conditions.hero).toFixed(1)}°C`
                    : "—"}
                </span>
                {conditions.risk?.label && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: "1px 7px",
                      borderRadius: 9999,
                      background: `${conditions.risk.color}25`,
                      color: conditions.risk.color,
                    }}
                  >
                    {conditions.risk.label}
                  </span>
                )}
              </div>

              {/* Other parameters */}
              {[
                {
                  Icon: Thermometer,
                  label: "Temp",
                  value: conditions.temp !== null ? `${Number(conditions.temp).toFixed(1)}°C` : "—",
                },
                {
                  Icon: Droplets,
                  label: "Humidity",
                  value: conditions.humidity !== null ? `${Math.round(Number(conditions.humidity))}%` : "—",
                },
                {
                  Icon: Wind,
                  label: "Wind",
                  value: conditions.wind !== null ? `${Number(conditions.wind).toFixed(1)} m/s` : "—",
                },
                {
                  Icon: Gauge,
                  label: "Pressure",
                  value: conditions.pressure !== null ? `${Math.round(Number(conditions.pressure))} hPa` : "—",
                },
                {
                  Icon: CloudRain,
                  label: "Rain",
                  value: conditions.rain !== null ? `${Number(conditions.rain).toFixed(1)} mm` : "0.0 mm",
                },
              ].map(({ Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 9999,
                    background: Z.glassBg,
                    border: `1px solid ${Z[300]}`,
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.06)",
                    fontSize: 11,
                    fontWeight: 800,
                    color: Z[800],
                    flexShrink: 0,
                  }}
                >
                  <Icon size={13} color={Z[700]} />
                  <span style={{ color: Z[700], fontWeight: 700 }}>{label}</span>
                  <span style={{ fontWeight: 900, color: Z[950] }}>{value}</span>
                </div>
              ))}

              {/* Live Status indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 9999,
                  background: Z.glassBg,
                  border: `1px solid ${Z[300]}`,
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  fontSize: 10,
                  fontWeight: 800,
                  color: conditions.isLive ? "#22c55e" : "#f59e0b",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: conditions.isLive ? "#22c55e" : "#f59e0b",
                    animation: conditions.isLive ? "climaLivePulse 1.8s infinite" : "none",
                  }}
                />
                <span>
                  {conditions.isLive ? `LIVE · ${conditions.source || "Palayan AWS"}` : "Open-Meteo Model"} · {ago(conditions.stamp, now)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ RIGHT INSPECTOR ═══ */}
      <AnimatePresence>
        {isInspectorOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: 14,
              bottom: 14,
              right: 14,
              width: 370,
              background: Z.glassBg,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: 22,
              border: `1px solid ${Z[300]}`,
              boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.65)" : "0 12px 30px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              zIndex: 25,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px 12px",
                borderBottom: `1px solid ${Z[300]}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: Z[900], letterSpacing: 0.4 }}>
                  {selectedReport ? `Incident #${String(selectedReport.id).slice(-4)}` : "Palayan City"}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: Z[700], fontWeight: 700 }}>
                  {selectedReport
                    ? selectedReport.category || "Uncategorized"
                    : `Nueva Ecija · ${isSuperadmin ? "Central Command" : adminDepartment?.name || "Operations"}`}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {!selectedReport && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "3px 10px 3px 4px",
                      borderRadius: 9999,
                      background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                      border: `1px solid ${Z[300]}`,
                      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 10,
                      }}
                    >
                      {(currentUser?.email?.[0] || (isSuperadmin ? "S" : adminDepartment?.name?.[0]) || "A").toUpperCase()}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: Z[950],
                        maxWidth: 90,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentUser?.email?.split("@")[0] || (isSuperadmin ? "Superadmin" : "Admin")}
                    </span>
                  </div>
                )}

                {selectedReport && (
                  <button
                    onClick={clearSelection}
                    title="Back to citywide view"
                    aria-label="Back to citywide view"
                    style={{
                      background: "none",
                      border: "none",
                      color: Z[700],
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Selected report card */}
              {selectedReport && (
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: SBG[selectedReport.status] || SBG.pending,
                        color: SC[selectedReport.status] || SC.pending,
                      }}
                    >
                      {SL[selectedReport.status] || selectedReport.status}
                    </span>
                    <span style={{ fontSize: 10, color: Z[700], fontWeight: 700 }}>
                      {fmtDateTime(selectedReport.created_at)}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 4px", fontSize: 13, fontWeight: 900 }}>{selectedReport.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: Z[700], fontWeight: 600, display: "flex", gap: 5 }}>
                    <MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{selectedReport.location || "Location not provided"}</span>
                  </p>
                  {selectedReport.assigned_department && (
                    <p style={{ margin: "6px 0 0", fontSize: 10, color: Z[700], fontWeight: 700 }}>
                      Assigned to {selectedReport.assigned_department}
                    </p>
                  )}
                  {onViewReport && (
                    <button
                      onClick={() => onViewReport(selectedReport)}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #f59e0b, #f97316)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <ExternalLink size={13} /> Open full report
                    </button>
                  )}
                </div>
              )}

              {/* Live conditions summary card */}
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={sectionLabel}>Live telemetry</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 9,
                      fontWeight: 800,
                      color: conditions?.isLive ? "#22c55e" : "#f59e0b",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: conditions?.isLive ? "#22c55e" : "#f59e0b",
                        animation: conditions?.isLive ? "climaLivePulse 1.8s infinite" : "none",
                      }}
                    />
                    {conditions?.isLive ? "LIVE AWS" : conditions ? "STANDBY" : "OFFLINE"}
                  </span>
                </div>

                {conditions ? (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: Z[700], fontWeight: 700 }}>{conditions.heroLabel}</div>
                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 900,
                            lineHeight: 1,
                            color: conditions.risk ? conditions.risk.color : Z[950],
                          }}
                        >
                          {conditions.hero !== null && conditions.hero !== undefined
                            ? `${Number(conditions.hero).toFixed(1)}°C`
                            : "—"}
                        </div>
                      </div>
                      {conditions.risk && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            padding: "4px 10px",
                            borderRadius: 9999,
                            background: `${conditions.risk.color}22`,
                            color: conditions.risk.color,
                            border: `1px solid ${conditions.risk.color}55`,
                          }}
                        >
                          {conditions.risk.label}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 12 }}>
                      {[
                        { Icon: Thermometer, label: "Temp", value: conditions.temp, unit: "°C", digits: 1 },
                        { Icon: Droplets, label: "Humidity", value: conditions.humidity, unit: "%", digits: 0 },
                        { Icon: Wind, label: "Wind", value: conditions.wind, unit: " m/s", digits: 1 },
                        { Icon: Gauge, label: "Pressure", value: conditions.pressure, unit: " hPa", digits: 0 },
                        { Icon: Sun, label: "UV", value: conditions.uv, unit: "", digits: 1 },
                        { Icon: CloudRain, label: "Rain", value: conditions.rain, unit: " mm", digits: 1 },
                      ].map(({ Icon, label, value, unit, digits }) => (
                        <div
                          key={label}
                          style={{
                            background: Z[100],
                            border: `1px solid ${Z[300]}`,
                            borderRadius: 10,
                            padding: "6px 8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              color: Z[700],
                              fontSize: 9,
                              fontWeight: 700,
                            }}
                          >
                            <Icon size={10} /> {label}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 900, marginTop: 2 }}>
                            {value !== null && value !== undefined ? `${Number(value).toFixed(digits)}${unit}` : "—"}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p style={{ margin: "8px 0 0", fontSize: 9, color: Z[600], fontWeight: 600, lineHeight: 1.4 }}>
                      {conditions.source} · polled {fmtClock(conditions.stamp)} ({ago(conditions.stamp, now)})
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 11, color: Z[600], fontWeight: 600 }}>
                    Connecting to live weather stations...
                  </p>
                )}
              </div>

              {/* City facts (from real boundary + OSM data) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={card}>
                  <div style={sectionLabel}>City area</div>
                  <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>
                    {city.areaKm2 ? `${city.areaKm2.toFixed(1)} km²` : "131.3 km²"}
                  </div>
                  <div style={{ fontSize: 9, color: Z[600], fontWeight: 600 }}>
                    {city.barangays ? `${city.barangays} barangays` : "19 barangays"}
                  </div>
                </div>
                <div style={card}>
                  <div style={sectionLabel}>Key facilities</div>
                  <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>
                    {facilities.status === "loading" ? "…" : facilities.status === "error" ? "5" : facilities.items.length || "5"}
                  </div>
                  <div style={{ fontSize: 9, color: Z[600], fontWeight: 600 }}>Hospitals & Services</div>
                </div>
              </div>

              {/* Realtime Citizen Incident Reports */}
              <div style={{ marginTop: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900 }}>Citizen Incident Reports</h3>
                  <span style={{ fontSize: 9, color: Z[600], fontWeight: 700 }}>
                    {counts.today} today · {reports.length} total
                  </span>
                </div>

                <div
                  role="tablist"
                  style={{
                    display: "flex",
                    background: Z[50],
                    borderRadius: 10,
                    padding: 2,
                    border: `1px solid ${Z[300]}`,
                    marginBottom: 10,
                  }}
                >
                  {[
                    { id: "active", label: `Active (${activeCount})` },
                    { id: "resolved", label: `Resolved (${counts.resolved})` },
                  ].map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={taskFilter === t.id}
                      onClick={() => setTaskFilter(t.id)}
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        borderRadius: 8,
                        border: "none",
                        background: taskFilter === t.id ? Z[200] : "transparent",
                        color: taskFilter === t.id ? Z[950] : Z[600],
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredReports.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 20, color: Z[600], fontSize: 12 }}>
                      No {taskFilter} reports found.
                    </div>
                  ) : (
                    filteredReports.slice(0, 30).map((r) => {
                      const isSel = selectedReport?.id === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => selectReport(r)}
                          style={{
                            background: Z[50],
                            border: `1px solid ${isSel ? Z[900] : Z[300]}`,
                            borderRadius: 12,
                            padding: "9px 12px",
                            cursor: "pointer",
                            transition: "border-color 0.15s, transform 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(2px)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 900,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.title || "Untitled report"}
                            </span>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                padding: "2px 7px",
                                borderRadius: 9999,
                                flexShrink: 0,
                                background: SBG[r.status] || SBG.pending,
                                color: SC[r.status] || SC.pending,
                              }}
                            >
                              {SL[r.status] || r.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 9, color: Z[700], fontWeight: 700, marginTop: 4 }}>
                            {r.category || "Uncategorized"} · {fmtDateTime(r.created_at)}
                            {!hasCoords(r) && " · no GPS"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Inspector collapse / expand trigger button */}
      <button
        onClick={() => setIsInspectorOpen((v) => !v)}
        title={isInspectorOpen ? "Collapse panel" : "Expand panel"}
        aria-label={isInspectorOpen ? "Collapse panel" : "Expand panel"}
        style={{
          position: "absolute",
          top: 20,
          right: isInspectorOpen ? 394 : 20,
          zIndex: 30,
          width: 30,
          height: 30,
          borderRadius: 10,
          border: `1px solid ${Z[300]}`,
          background: Z.glassBg,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          color: Z[800],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          transition: "right 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {isInspectorOpen ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </div>
  );
}
