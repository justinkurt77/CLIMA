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
  Plus,
  Crosshair,
  Edit3,
  Trash2,
  Building2,
  Phone,
  Layers,
  Filter,
  CheckCircle2,
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sprout,
  Landmark,
  AlertTriangle,
  Droplet,
  RefreshCw,
} from "lucide-react";
import { PinMarker } from "../map/MapPins";
import { useLiveOpsData, getHeatRisk } from "../../hooks/useLiveOpsData";
import {
  PIN_CATEGORIES,
  PIN_STATUSES,
  getPinnedLocations,
  savePinnedLocation,
  deletePinnedLocation,
  subscribePinnedLocations,
} from "../../lib/pinnedLocationsStorage";
import PinLocationModal from "../map/PinLocationModal";
import CustomPinMarker from "../map/CustomPinMarker";
import SecurityConfirmModal from "../ui/SecurityConfirmModal";
import { usePowerInterruptionAdvisories } from "../../hooks/usePowerInterruptionAdvisories";
import { useWaterInterruptionAdvisories } from "../../hooks/useWaterInterruptionAdvisories";

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
  leftInset = 98,
  toggleTheme,
  fetchData,
  loading = false,
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
  const {
    powerOutageGeoJSON,
    affectedBarangayOutages,
    displayOutageMarkers,
    isWholeCity,
    hasActiveAdvisories,
  } = usePowerInterruptionAdvisories();
  const {
    waterInterruptionGeoJSON,
    affectedBarangayOutages: affectedWaterOutages,
    displayWaterMarkers,
    isWholeCity: isWholeCityWater,
    hasActiveWaterAdvisories,
  } = useWaterInterruptionAdvisories();

  // Custom Pinned Locations State (Water facilities, hospitals, fire stations, etc.)
  const [pinnedLocations, setPinnedLocations] = useState(() => getPinnedLocations());
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [tempPinCoords, setTempPinCoords] = useState(null);
  const [draftPinData, setDraftPinData] = useState(null);
  const [pinCategoryFilter, setPinCategoryFilter] = useState("all");
  const [inspectorSection, setInspectorSection] = useState("reports"); // "reports" | "pins"

  useEffect(() => {
    const unsub = subscribePinnedLocations((pins) => {
      setPinnedLocations(pins);
    });
    return unsub;
  }, []);

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
      try {
        map.resize();
        setTimeout(() => {
          try {
            map.resize();
          } catch (_) {}
        }, 300);
      } catch (_) {}

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

  // Keep Mapbox canvas sized to 100% of the screen container and track layout shifts
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    window.addEventListener("resize", handleResize);
    const t1 = setTimeout(handleResize, 150);
    const t2 = setTimeout(handleResize, 500);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isInspectorOpen]);

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
        risk: getHeatRisk(liveStation.heatIndex, isDark),
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
          risk: getHeatRisk(cur.apparent_temperature, isDark),
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
    setSelectedPin(null);
    setSelectedReport(r);
    if (hasCoords(r) && mapRef.current) {
      mapRef.current.flyTo({ center: [Number(r.lng), Number(r.lat)], zoom: 16.5, duration: 1000 });
    }
  };

  const selectPin = useCallback((pin) => {
    setSelectedReport(null);
    setInfoPopup(null);
    setSelectedPin(pin);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [Number(pin.lng), Number(pin.lat)], zoom: 16.2, duration: 800 });
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedReport(null);
    setSelectedPin(null);
    setInfoPopup(null);
  }, []);

  const handleMapClick = useCallback(
    (e) => {
      if (isPinningMode) {
        if (e.lngLat) {
          const newCoords = [e.lngLat.lng, e.lngLat.lat];
          setTempPinCoords(newCoords);
          if (draftPinData) {
            setDraftPinData((prev) => ({
              ...prev,
              lng: String(Number(e.lngLat.lng).toFixed(6)),
              lat: String(Number(e.lngLat.lat).toFixed(6)),
            }));
          }
          setShowPinModal(true);
          setIsPinningMode(false);
        }
        return;
      }
      clearSelection();
    },
    [isPinningMode, clearSelection, draftPinData],
  );

  const handleSavePin = useCallback((pinData) => {
    const updated = savePinnedLocation(pinData);
    setPinnedLocations(updated);
    setDraftPinData(null);
    setEditingPin(null);
    setTempPinCoords(null);
    const target =
      updated.find(
        (p) =>
          p.name === pinData.name &&
          Math.abs(Number(p.lat) - Number(pinData.lat)) < 0.0001 &&
          Math.abs(Number(p.lng) - Number(pinData.lng)) < 0.0001,
      ) || updated[0];
    if (target) {
      setSelectedPin(target);
      setSelectedReport(null);
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [Number(target.lng), Number(target.lat)], zoom: 16, duration: 800 });
      }
    }
  }, []);

  const [securityModalConfig, setSecurityModalConfig] = useState({
    isOpen: false,
    title: "Delete Pinned Facility",
    message: "",
    itemName: "",
    confirmText: "Verify & Delete",
    onConfirmed: null,
  });

  const handleDeletePin = useCallback(
    (pinId) => {
      const updated = deletePinnedLocation(pinId);
      setPinnedLocations(updated);
      if (selectedPin?.id === pinId) {
        setSelectedPin(null);
      }
    },
    [selectedPin],
  );

  const requestDeletePin = useCallback(
    (pinId, pinName = "") => {
      const pin = pinnedLocations.find((p) => p.id === pinId);
      const name = pinName || pin?.name || "Facility Pin";
      setSecurityModalConfig({
        isOpen: true,
        title: "Delete Pinned Facility",
        message: `Are you sure you want to delete "${name}"? This action permanently removes the pin from the operational map. Please enter your admin password to authenticate.`,
        itemName: name,
        confirmText: "Verify & Delete",
        onConfirmed: () => {
          handleDeletePin(pinId);
        },
      });
    },
    [handleDeletePin, pinnedLocations],
  );

  const filteredPins = useMemo(() => {
    if (pinCategoryFilter === "all") return pinnedLocations;
    return pinnedLocations.filter((p) => p.category === pinCategoryFilter);
  }, [pinnedLocations, pinCategoryFilter]);

  const categoryCounts = useMemo(() => {
    const c = { all: pinnedLocations.length };
    Object.keys(PIN_CATEGORIES).forEach((key) => {
      c[key] = 0;
    });
    pinnedLocations.forEach((p) => {
      if (c[p.category] !== undefined) {
        c[p.category] += 1;
      }
    });
    return c;
  }, [pinnedLocations]);

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
        fontFamily: "'Nohemi', sans-serif",
      }}
    >
      <style>{`
        @keyframes climaLivePulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes climaPinPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0.2; }
          100% { transform: scale(2.0); opacity: 0; }
        }
      `}</style>

      {/* ═══ MAP CANVAS ═══ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          cursor: isPinningMode ? "crosshair" : "default",
        }}
      >
        {MAPBOX_TOKEN ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: 121.0827, latitude: 15.5398, zoom: 12.2, pitch: 0 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={`mapbox://styles/mapbox/${mapStyleId}`}
            attributionControl={false}
            antialias={false}
            trackResize={true}
            fadeDuration={0}
            onLoad={handleMapLoad}
            onClick={handleMapClick}
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

            {/* Highlighted Barangays with Active Power Interruption Advisory */}
            {hasActiveAdvisories && powerOutageGeoJSON?.features?.length > 0 && (
              <Source id="admin-power-outage-source" type="geojson" data={powerOutageGeoJSON}>
                <Layer
                  id="admin-power-outage-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#f59e0b",
                    "fill-opacity": isDark ? 0.32 : 0.24,
                  }}
                />
                <Layer
                  id="admin-power-outage-stroke"
                  type="line"
                  paint={{
                    "line-color": "#fbbf24",
                    "line-width": 2.8,
                    "line-opacity": 0.95,
                    "line-dasharray": [4, 2],
                  }}
                />
              </Source>
            )}

            {/* Power Interruption Outage Markers for Affected Barangays */}
            {hasActiveAdvisories &&
              displayOutageMarkers.map((outage) => (
                <Marker
                  key={outage.isWholeCity ? "admin-power-outage-whole-city" : `admin-power-outage-${outage.name}`}
                  longitude={outage.lng}
                  latitude={outage.lat}
                  anchor="bottom"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(null);
                      setInfoPopup({
                        lng: outage.lng,
                        lat: outage.lat,
                        title: outage.isWholeCity ? "Palayan City" : `Brgy. ${outage.name}`,
                        subtitle: outage.isWholeCity ? "City-wide NEECO Power Interruption" : "NEECO Power Interruption Advisory",
                        color: outage.status === "ongoing" ? "#ef4444" : "#f59e0b",
                        lines: [
                          `Status: ${(outage.status || "ongoing").toUpperCase()}`,
                          outage.isWholeCity && "Scope: All 19 Barangays of Palayan City",
                          outage.date && `Date: ${outage.date}`,
                          outage.peakTime && `Peak Time: ${outage.peakTime.slice(0, 5)}`,
                          outage.cause && `Cause: ${outage.cause}`,
                          outage.households && `Affected Households: ${Number(outage.households).toLocaleString()}`,
                          outage.duration && `Duration: ${outage.duration} mins`,
                          outage.description,
                        ].filter(Boolean),
                      });
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 80,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: outage.isWholeCity ? 6 : 5,
                        padding: outage.isWholeCity ? "5px 12px" : "4px 8px",
                        borderRadius: outage.isWholeCity ? 18 : 14,
                        background: isDark ? "rgba(24, 24, 27, 0.94)" : "#ffffff",
                        border: "2px solid #f59e0b",
                        boxShadow: outage.isWholeCity
                          ? "0 4px 18px rgba(245, 158, 11, 0.65), 0 0 16px rgba(245, 158, 11, 0.3)"
                          : "0 4px 14px rgba(245, 158, 11, 0.5)",
                        fontSize: outage.isWholeCity ? 11.5 : 11,
                        fontWeight: 800,
                        color: isDark ? "#ffffff" : "#18181b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Zap size={outage.isWholeCity ? 13 : 12} color="#f59e0b" fill="#f59e0b" />
                      <span>{outage.isWholeCity ? "Palayan City" : `Brgy. ${outage.name}`}</span>
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          background: outage.status === "ongoing" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                          color: outage.status === "ongoing" ? "#ef4444" : "#f59e0b",
                        }}
                      >
                        {outage.isWholeCity ? "City-wide" : (outage.status || "Outage")}
                      </span>
                    </div>
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: outage.isWholeCity ? "5px solid transparent" : "4px solid transparent",
                        borderRight: outage.isWholeCity ? "5px solid transparent" : "4px solid transparent",
                        borderTop: outage.isWholeCity ? "5px solid #f59e0b" : "4px solid #f59e0b",
                      }}
                    />
                  </div>
                </Marker>
              ))}

            {/* Highlighted Barangays with Active Water Interruption Advisory (Blue) */}
            {hasActiveWaterAdvisories && waterInterruptionGeoJSON?.features?.length > 0 && (
              <Source id="admin-water-outage-source" type="geojson" data={waterInterruptionGeoJSON}>
                <Layer
                  id="admin-water-outage-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#0284c7",
                    "fill-opacity": isDark ? 0.32 : 0.24,
                  }}
                />
                <Layer
                  id="admin-water-outage-stroke"
                  type="line"
                  paint={{
                    "line-color": "#38bdf8",
                    "line-width": 2.8,
                    "line-opacity": 0.95,
                    "line-dasharray": [4, 2],
                  }}
                />
              </Source>
            )}

            {/* Water Interruption Outage Markers for Affected Barangays (Blue) */}
            {hasActiveWaterAdvisories &&
              displayWaterMarkers.map((outage) => (
                <Marker
                  key={outage.isWholeCity ? "admin-water-outage-whole-city" : `admin-water-outage-${outage.name}`}
                  longitude={outage.lng}
                  latitude={outage.lat}
                  anchor="bottom"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(null);
                      setInfoPopup({
                        lng: outage.lng,
                        lat: outage.lat,
                        title: outage.isWholeCity ? "Palayan City" : `Brgy. ${outage.name}`,
                        subtitle: outage.isWholeCity ? "City-wide Water Interruption" : `${outage.provider || "Water Utility"} Advisory`,
                        color: outage.status === "ongoing" ? "#0284c7" : "#10b981",
                        lines: [
                          `Status: ${(outage.status || "ongoing").toUpperCase()}`,
                          outage.isWholeCity && "Scope: All 19 Barangays of Palayan City",
                          outage.provider && `Provider: ${outage.provider}`,
                          outage.date && `Date: ${outage.date}`,
                          outage.startTime && `Start Time: ${outage.startTime.slice(0, 5)}`,
                          outage.durationHours && `Duration: ${outage.durationHours} hrs`,
                          outage.cause && `Cause: ${(outage.cause || "").replace(/_/g, " ")}`,
                          outage.households && `Affected Households: ${Number(outage.households).toLocaleString()}`,
                          outage.description,
                        ].filter(Boolean),
                      });
                    }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 80,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: outage.isWholeCity ? 6 : 5,
                        padding: outage.isWholeCity ? "5px 12px" : "4px 8px",
                        borderRadius: outage.isWholeCity ? 18 : 14,
                        background: isDark ? "rgba(24, 24, 27, 0.94)" : "#ffffff",
                        border: "2px solid #0284c7",
                        boxShadow: outage.isWholeCity
                          ? "0 4px 18px rgba(2, 132, 199, 0.65), 0 0 16px rgba(2, 132, 199, 0.3)"
                          : "0 4px 14px rgba(2, 132, 199, 0.5)",
                        fontSize: outage.isWholeCity ? 11.5 : 11,
                        fontWeight: 800,
                        color: isDark ? "#ffffff" : "#18181b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Droplet size={outage.isWholeCity ? 13 : 12} color="#0284c7" fill="#0284c7" />
                      <span>{outage.isWholeCity ? "Palayan City" : `Brgy. ${outage.name}`}</span>
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          background: outage.status === "ongoing" ? "rgba(2, 132, 199, 0.2)" : "rgba(34, 197, 94, 0.2)",
                          color: outage.status === "ongoing" ? "#38bdf8" : "#22c55e",
                        }}
                      >
                        {outage.isWholeCity ? "City-wide" : (outage.status || "Interruption")}
                      </span>
                    </div>
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: outage.isWholeCity ? "5px solid transparent" : "4px solid transparent",
                        borderRight: outage.isWholeCity ? "5px solid transparent" : "4px solid transparent",
                        borderTop: outage.isWholeCity ? "5px solid #0284c7" : "5px solid #0284c7",
                      }}
                    />
                  </div>
                </Marker>
              ))}

            {/* KloudTech IoT Weather Stations */}
            {stationLabelPositions.map((s) => {
              const risk = getHeatRisk(stations.isLive ? s.heatIndex : null, isDark);
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
                  setSelectedPin(null);
                  setSelectedReport(r);
                }}
              >
                <PinMarker color={SC[r.status] || SC.pending} icon={r.icon} />
              </Marker>
            ))}

            {/* Custom Admin & Superadmin Pinned Locations (Water facilities, hospitals, fire stations, etc.) */}
            {filteredPins.map((pin) => (
              <Marker
                key={pin.id}
                longitude={Number(pin.lng)}
                latitude={Number(pin.lat)}
                anchor="bottom"
              >
                <CustomPinMarker
                  pin={pin}
                  isSelected={selectedPin?.id === pin.id}
                  onClick={() => selectPin(pin)}
                />
              </Marker>
            ))}

            {/* Selected Pinned Location map popup */}
            {selectedPin && (
              <Popup
                longitude={Number(selectedPin.lng)}
                latitude={Number(selectedPin.lat)}
                anchor="bottom"
                offset={44}
                closeButton={false}
                closeOnClick={false}
                maxWidth="280px"
              >
                <div style={{ fontFamily: "'Nohemi', sans-serif", color: "#09090b", minWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: 8,
                        background: PIN_CATEGORIES[selectedPin.category]?.bg || "rgba(2, 132, 199, 0.15)",
                        color: PIN_CATEGORIES[selectedPin.category]?.color || "#0284c7",
                      }}
                    >
                      {PIN_CATEGORIES[selectedPin.category]?.label || selectedPin.category}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 6,
                          background: PIN_STATUSES[selectedPin.status]?.bg || "rgba(34, 197, 94, 0.15)",
                          color: PIN_STATUSES[selectedPin.status]?.color || "#22c55e",
                        }}
                      >
                        {PIN_STATUSES[selectedPin.status]?.label || selectedPin.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPin(null);
                        }}
                        title="Close popup"
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          padding: 2,
                          color: "#71717a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: "6px 0 2px", fontSize: 13, fontWeight: 900, color: "#09090b" }}>
                    {selectedPin.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "#52525b", fontWeight: 700 }}>
                    {selectedPin.subType} · Brgy. {selectedPin.barangay}
                  </p>
                  {selectedPin.description && (
                    <p style={{ margin: "6px 0 0", fontSize: 10, color: "#3f3f46", fontWeight: 600, lineHeight: 1.3 }}>
                      {selectedPin.description}
                    </p>
                  )}
                  {selectedPin.contact && (
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: "#2563eb", fontWeight: 700 }}>
                      📞 {selectedPin.contact}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 6, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPin(selectedPin);
                        setShowPinModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: "5px 8px",
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "#ffffff",
                        color: "#09090b",
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Edit3 size={11} /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeletePin(selectedPin.id, selectedPin.name);
                      }}
                      style={{
                        padding: "5px 8px",
                        borderRadius: 8,
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        background: "rgba(239, 68, 68, 0.08)",
                        color: "#ef4444",
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 3,
                      }}
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </Popup>
            )}

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
                <div style={{ fontFamily: "'Nohemi', sans-serif", color: "#09090b", minWidth: 180 }}>
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
                <div style={{ fontFamily: "'Nohemi', sans-serif", color: "#09090b", minWidth: 170 }}>
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

      {/* ═══ PIN MODE FLOATING BANNER ═══ */}
      <AnimatePresence>
        {isPinningMode && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{
              position: "absolute",
              top: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 45,
              background: isDark ? "rgba(18, 18, 22, 0.96)" : "rgba(255, 255, 255, 0.98)",
              border: "1.5px solid #f59e0b",
              borderRadius: 9999,
              padding: "8px 18px 8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 10px 30px rgba(245, 158, 11, 0.45)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#f59e0b",
                animation: "climaLivePulse 1.2s infinite",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 900, color: Z[950] }}>
              {draftPinData?.name
                ? `Click anywhere on the map to set location for "${draftPinData.name}"`
                : "Click anywhere on the map to set pin location"}
            </span>
            <button
              onClick={() => {
                setIsPinningMode(false);
                setShowPinModal(true);
              }}
              style={{
                padding: "4px 12px",
                borderRadius: 9999,
                border: "none",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Back to Form
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* Add Pin Button - Pops up modal directly without selecting location on map */}
        <button
          onClick={() => {
            const center = mapRef.current ? mapRef.current.getCenter() : null;
            const lng = center ? Number(center.lng.toFixed(6)) : 121.0827;
            const lat = center ? Number(center.lat.toFixed(6)) : 15.5398;
            setTempPinCoords([lng, lat]);
            setEditingPin(null);
            setDraftPinData(null);
            setShowPinModal(true);
            setIsPinningMode(false);
            setSelectedReport(null);
            setSelectedPin(null);
          }}
          title="Add Pin / Pin Location on Map"
          aria-label="Add Pin on Map"
          style={{
            width: 50,
            height: 50,
            borderRadius: 24,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
            background: isDark
              ? "rgba(18, 18, 20, 0.94)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: isDark
              ? "0 8px 24px rgba(0,0,0,0.5)"
              : "0 8px 24px rgba(0,0,0,0.12)",
            color: "#f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <MapPin size={22} strokeWidth={2.4} />
        </button>

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
                  background: isDark ? "rgba(18, 18, 20, 0.94)" : "rgba(255, 255, 255, 0.94)",
                  border: `1px solid ${conditions.risk?.border || (isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.10)")}`,
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  flexShrink: 0,
                }}
              >
                <Flame size={15} color={conditions.risk?.color || "#ef4444"} />
                <span style={{ fontSize: 11, fontWeight: 700, color: Z[700] }}>Heat Index</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: conditions.risk?.color || "#ef4444",
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
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 9999,
                      background: conditions.risk.bg || "rgba(245, 158, 11, 0.15)",
                      color: conditions.risk.color,
                      border: `1px solid ${conditions.risk.border || "rgba(245, 158, 11, 0.3)"}`,
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
                  {selectedPin ? selectedPin.name : selectedReport ? `Incident #${String(selectedReport.id).slice(-4)}` : "Palayan City"}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: Z[700], fontWeight: 700 }}>
                  {selectedPin
                    ? `${PIN_CATEGORIES[selectedPin.category]?.label || selectedPin.category} · ${selectedPin.subType}`
                    : selectedReport
                    ? selectedReport.category || "Uncategorized"
                    : `Nueva Ecija · ${isSuperadmin ? "Central Command" : adminDepartment?.name || "Operations"}`}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {!selectedReport && !selectedPin && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px 2px 4px",
                      borderRadius: 9999,
                      background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                      border: `1px solid ${Z[300]}`,
                      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Refresh Telemetry Button */}
                    {fetchData && (
                      <button
                        onClick={fetchData}
                        title="Refresh Telemetry"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: "none",
                          background: "transparent",
                          color: Z[700],
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          transition: "color 0.15s ease",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "#f59e0b"}
                        onMouseLeave={e => e.currentTarget.style.color = Z[700]}
                      >
                        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                      </button>
                    )}

                    {/* Darkmode Toggle Button */}
                    {toggleTheme && (
                      <button
                        onClick={toggleTheme}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: "none",
                          background: "transparent",
                          color: isDark ? "#f59e0b" : "#d97706",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          transition: "color 0.15s ease",
                        }}
                      >
                        {isDark ? <Sun size={11} /> : <Moon size={11} />}
                      </button>
                    )}

                    {/* Subtle Divider */}
                    {(fetchData || toggleTheme) && (
                      <div style={{ width: 1, height: 14, background: Z[300], margin: "0 2px" }} />
                    )}

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

                {(selectedReport || selectedPin) && (
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
              {/* Selected pinned location card */}
              {selectedPin && (
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: 8,
                        background: PIN_CATEGORIES[selectedPin.category]?.bg || "rgba(2, 132, 199, 0.15)",
                        color: PIN_CATEGORIES[selectedPin.category]?.color || "#0284c7",
                      }}
                    >
                      {PIN_CATEGORIES[selectedPin.category]?.label || selectedPin.category}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 8,
                        background: PIN_STATUSES[selectedPin.status]?.bg || "rgba(34, 197, 94, 0.15)",
                        color: PIN_STATUSES[selectedPin.status]?.color || "#22c55e",
                      }}
                    >
                      {PIN_STATUSES[selectedPin.status]?.label || selectedPin.status}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 2px", fontSize: 14, fontWeight: 900 }}>{selectedPin.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: Z[700], fontWeight: 700 }}>
                    {selectedPin.subType} · Brgy. {selectedPin.barangay}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 10, color: Z[600], fontWeight: 600 }}>
                    GPS: {Number(selectedPin.lat).toFixed(4)}° N, {Number(selectedPin.lng).toFixed(4)}° E
                  </p>
                  {selectedPin.contact && (
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                      <Phone size={12} />
                      <a href={`tel:${selectedPin.contact}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {selectedPin.contact}
                      </a>
                    </p>
                  )}
                  {selectedPin.description && (
                    <p style={{ margin: "8px 0 0", fontSize: 11, color: Z[800], fontWeight: 600, lineHeight: 1.4 }}>
                      {selectedPin.description}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${Z[300]}` }}>
                    <button
                      onClick={() => {
                        setEditingPin(selectedPin);
                        setShowPinModal(true);
                      }}
                      style={{
                        flex: 1,
                        padding: "7px 12px",
                        borderRadius: 10,
                        border: `1px solid ${Z[300]}`,
                        background: Z[200],
                        color: Z[950],
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                      }}
                    >
                      <Edit3 size={13} /> Edit Pin
                    </button>
                    <button
                      onClick={() => requestDeletePin(selectedPin.id, selectedPin.name)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              )}
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
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 9999,
                            background: conditions.risk.bg || `${conditions.risk.color}1e`,
                            color: conditions.risk.color,
                            border: `1px solid ${conditions.risk.border || `${conditions.risk.color}40`}`,
                            letterSpacing: "0.2px",
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
                    {pinnedLocations.length > 0 ? pinnedLocations.length : (facilities.items?.length ?? 0)}
                  </div>
                  <div style={{ fontSize: 9, color: Z[600], fontWeight: 600 }}>Hospitals & Services</div>
                </div>
              </div>

              {/* ═══ SECTION SELECTOR: CITIZEN REPORTS vs PINNED FACILITIES ═══ */}
              <div style={{ marginTop: 2 }}>
                <div
                  role="tablist"
                  style={{
                    display: "flex",
                    background: Z[50],
                    borderRadius: 12,
                    padding: 3,
                    border: `1.5px solid ${Z[300]}`,
                    marginBottom: 10,
                  }}
                >
                  <button
                    role="tab"
                    aria-selected={inspectorSection === "reports"}
                    onClick={() => setInspectorSection("reports")}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 9,
                      border: "none",
                      background: inspectorSection === "reports" ? Z[200] : "transparent",
                      color: inspectorSection === "reports" ? Z[950] : Z[600],
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.15s ease",
                      boxShadow: inspectorSection === "reports" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    <span>Reports</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "1px 6px",
                        borderRadius: 9999,
                        background: inspectorSection === "reports" ? "rgba(245, 158, 11, 0.2)" : Z[100],
                        color: inspectorSection === "reports" ? "#f59e0b" : Z[700],
                      }}
                    >
                      {reports.length}
                    </span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={inspectorSection === "pins"}
                    onClick={() => setInspectorSection("pins")}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 9,
                      border: "none",
                      background: inspectorSection === "pins" ? Z[200] : "transparent",
                      color: inspectorSection === "pins" ? Z[950] : Z[600],
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.15s ease",
                      boxShadow: inspectorSection === "pins" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    <MapPin size={12} color={inspectorSection === "pins" ? "#f59e0b" : Z[600]} />
                    <span>Pinned Facilities</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        padding: "1px 6px",
                        borderRadius: 9999,
                        background: inspectorSection === "pins" ? "rgba(245, 158, 11, 0.2)" : Z[100],
                        color: inspectorSection === "pins" ? "#f59e0b" : Z[700],
                      }}
                    >
                      {pinnedLocations.length}
                    </span>
                  </button>
                </div>

                {/* ── SECTION 1: CITIZEN REPORTS ── */}
                {inspectorSection === "reports" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: Z[700], fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Incident Feeds
                      </span>
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
                )}

                {/* ── SECTION 2: PINNED FACILITIES (WATER, HOSPITALS, FIRE STATIONS, ETC.) ── */}
                {inspectorSection === "pins" && (
                  <div>
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <button
                        onClick={() => {
                          const center = mapRef.current ? mapRef.current.getCenter() : null;
                          const lng = center ? Number(center.lng.toFixed(6)) : 121.0827;
                          const lat = center ? Number(center.lat.toFixed(6)) : 15.5398;
                          setTempPinCoords([lng, lat]);
                          setEditingPin(null);
                          setDraftPinData(null);
                          setShowPinModal(true);
                          setIsPinningMode(false);
                          clearSelection();
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "none",
                          background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: "0 2px 10px rgba(245, 158, 11, 0.35)",
                        }}
                      >
                        <MapPin size={14} strokeWidth={2.5} />
                        <span>Add Pin</span>
                      </button>
                    </div>

                    {/* Category Filter Chips */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        paddingBottom: 6,
                        marginBottom: 10,
                      }}
                    >
                      <button
                        onClick={() => setPinCategoryFilter("all")}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 9999,
                          border: pinCategoryFilter === "all" ? "1.5px solid #f59e0b" : `1px solid ${Z[300]}`,
                          background: pinCategoryFilter === "all" ? "rgba(245, 158, 11, 0.15)" : Z[50],
                          color: pinCategoryFilter === "all" ? "#f59e0b" : Z[700],
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        All ({categoryCounts.all})
                      </button>

                      {Object.values(PIN_CATEGORIES).map((cat) => {
                        const count = categoryCounts[cat.id] || 0;
                        const isSel = pinCategoryFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setPinCategoryFilter(cat.id)}
                            style={{
                              padding: "4px 9px",
                              borderRadius: 9999,
                              border: isSel ? `1.5px solid ${cat.color}` : `1px solid ${Z[300]}`,
                              background: isSel ? cat.bg : Z[50],
                              color: isSel ? cat.color : Z[700],
                              fontSize: 10,
                              fontWeight: 800,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>{cat.label}</span>
                            <span style={{ fontSize: 9, opacity: 0.85 }}>({count})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Pinned Locations List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredPins.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "24px 16px",
                            color: Z[600],
                            fontSize: 11,
                            background: Z[50],
                            borderRadius: 12,
                            border: `1px dashed ${Z[300]}`,
                          }}
                        >
                          <MapPin size={24} color={Z[500]} style={{ margin: "0 auto 6px", display: "block" }} />
                          <p style={{ margin: 0, fontWeight: 700 }}>No facilities pinned in this category.</p>
                          <p style={{ margin: "4px 0 0", fontSize: 10 }}>
                            Click "Drop Pin on Map" to pin one now!
                          </p>
                        </div>
                      ) : (
                        filteredPins.map((pin) => {
                          const cat = PIN_CATEGORIES[pin.category] || PIN_CATEGORIES.water;
                          const st = PIN_STATUSES[pin.status] || PIN_STATUSES.operational;
                          const isSel = selectedPin?.id === pin.id;
                          return (
                            <div
                              key={pin.id}
                              onClick={() => selectPin(pin)}
                              style={{
                                background: Z[50],
                                border: `1px solid ${isSel ? cat.color : Z[300]}`,
                                borderRadius: 12,
                                padding: "10px 12px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: isSel ? `0 4px 14px ${cat.color}25` : "none",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(2px)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 900,
                                    color: Z[950],
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {pin.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    background: st.bg,
                                    color: st.color,
                                    flexShrink: 0,
                                  }}
                                >
                                  {st.label}
                                </span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 900,
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    background: cat.bg,
                                    color: cat.color,
                                  }}
                                >
                                  {cat.label}
                                </span>
                                <span style={{ fontSize: 9, color: Z[700], fontWeight: 700 }}>
                                  {pin.subType} · Brgy. {pin.barangay}
                                </span>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: `1px solid ${Z[300]}` }}>
                                <span style={{ fontSize: 9, color: Z[600], fontWeight: 600 }}>
                                  {Number(pin.lat).toFixed(4)}°N, {Number(pin.lng).toFixed(4)}°E
                                </span>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPin(pin);
                                      setShowPinModal(true);
                                    }}
                                    title="Edit Pin"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: Z[700],
                                      cursor: "pointer",
                                      padding: 2,
                                    }}
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestDeletePin(pin.id, pin.name);
                                    }}
                                    title="Delete Pin"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#ef4444",
                                      cursor: "pointer",
                                      padding: 2,
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
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

      {/* ═══ PIN LOCATION MODAL ═══ */}
      <PinLocationModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setEditingPin(null);
          setDraftPinData(null);
          setTempPinCoords(null);
          setIsPinningMode(false);
        }}
        onSave={handleSavePin}
        onDelete={(pinId) => requestDeletePin(pinId, editingPin?.name)}
        onPickOnMap={(draft) => {
          setDraftPinData(draft);
          if (draft?.id) {
            setEditingPin(draft);
          }
          setShowPinModal(false);
          setIsPinningMode(true);
        }}
        initialCoordinates={tempPinCoords}
        draftData={draftPinData}
        editingPin={editingPin}
        isDark={isDark}
        currentUser={currentUser}
      />

      {/* Security Confirmation Modal for Deleting Pins */}
      <SecurityConfirmModal
        isOpen={securityModalConfig.isOpen}
        onClose={() => setSecurityModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirmed={securityModalConfig.onConfirmed}
        title={securityModalConfig.title}
        message={securityModalConfig.message}
        itemName={securityModalConfig.itemName}
        confirmText={securityModalConfig.confirmText}
        isDark={isDark}
        currentUserEmail={currentUser?.email}
      />
    </div>
  );
}
