import { useState, useRef, useCallback, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ArrowLeft,
  MapPin,
  Search,
  X,
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  Globe,
  Moon,
  Map as MapIcon,
  LocateFixed,
  Navigation,
  RefreshCw,
  Calendar,
  User,
  LogOut,
  Phone,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PinMarker } from "../components/map/MapPins";
import { reverseGeocode } from "../components/ui/report/reportConstants";
import CustomSelect from "../components/ui/CustomSelect";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
const SC = { pending: "#ef4444", inprogress: "#3b82f6", resolved: "#22c55e" };
const SBG = { pending: "#fef2f2", inprogress: "#eff6ff", resolved: "#f0fdf4" };
const SL = {
  pending: "Pending",
  inprogress: "In Progress",
  resolved: "Resolved",
};
const ICON_MAP = {
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
};

const buildingsLayer = {
  id: "3d-buildings-admin",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 14,
  paint: {
    "fill-extrusion-color": "#fff",
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["get", "min_height"],
    "fill-extrusion-opacity": 0.9,
  },
};

// Shared style tokens (shadcn zinc palette)
const Z = {
  950: "#ffffff",
  900: "#e5dca7", // yellowish/gold text
  800: "#d3d3d3",
  700: "#a0a0a0",
  600: "#8ca885", // muted green
  500: "#606060",
  400: "#52604d", 
  300: "#344530", // borders
  200: "#202d1d", // card backgrounds
  100: "#182416", // sidebar background
  50: "#111c10",  // darkest background
};

export default function AdminMapScreen({
  onLogout,
  onBackToDashboard,
  isSuperadmin,
  adminCategories,
  adminDepartment,
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [popupGeo, setPopupGeo] = useState(null);
  const [activeFilters, setActiveFilters] = useState([
    "pending",
    "inprogress",
    "resolved",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen] = useState(true);
  const [mapStyleId, setMapStyleId] = useState("satellite-streets-v12");
  const [refreshing, setRefreshing] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [detailReport, setDetailReport] = useState(null);
  const mapRef = useRef(null);

  
  const graphData = [
    { name: 'Apr', pending: 12, resolved: 10 },
    { name: 'May', pending: 15, resolved: 22 },
    { name: 'Jun', pending: 8,  resolved: 30 },
    { name: 'Jul', pending: 20, resolved: 18 },
    { name: 'Aug', pending: 10, resolved: 35 },
    { name: 'Sep', pending: 5,  resolved: 40 },
    { name: 'Oct', pending: 18, resolved: 25 },
  ];

  const fetchReports = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        let query = supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false });
        if (
          !isSuperadmin &&
          adminCategories &&
          !adminCategories.includes("All Categories")
        ) {
          query = query.in("category", adminCategories);
        }
        const { data, error } = await query;
        if (error) throw error;
        setReports(
          (data || []).map((r) => ({
            ...r,
            createdAt: r.created_at,
            statusLabel: SL[r.status] || r.status,
            photoPreview: r.photo_url
              ? r.photo_url.includes(",")
                ? r.photo_url.split(",")[0]
                : r.photo_url
              : null,
          })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isSuperadmin, adminCategories],
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (!mapRef.current || loading) return;
    const pins = reports.filter((r) => r.lat && r.lng);
    if (pins.length > 0) {
      const bounds = pins.reduce(
        (b, r) => b.extend([r.lng, r.lat]),
        new mapboxgl.LngLatBounds(),
      );
      mapRef.current.fitBounds(bounds, {
        padding: {
          top: 100,
          bottom: 80,
          left: sidebarOpen ? 360 : 80,
          right: 80,
        },
        duration: 2000,
        maxZoom: 14,
      });
    } else
      mapRef.current.flyTo({
        center: [121.0827, 15.5398],
        zoom: 12,
        duration: 1500,
      });
  }, [loading]);

  useEffect(() => {
    if (!selectedReport?.lat) {
      setPopupGeo(null);
      return;
    }
    mapRef.current?.flyTo({
      center: [selectedReport.lng, selectedReport.lat],
      zoom: 17.5,
      pitch: 50,
      duration: 1400,
      essential: true,
    });
    setPopupGeo(null);
    reverseGeocode(selectedReport.lat, selectedReport.lng)
      .then((g) => setPopupGeo(g))
      .catch(() => setPopupGeo({}));
  }, [selectedReport?.id]);

  const onMapLoad = useCallback((e) => {
    const m = e.target;
    [
      "road-local",
      "road-minor",
      "road-street",
      "road-secondary-tertiary",
      "road-primary",
      "road-motorway-trunk",
    ].forEach((id) => {
      if (m.getLayer(id)) m.setPaintProperty(id, "line-color", "#c8d4e0");
    });
    [
      "road-local-case",
      "road-minor-case",
      "road-street-case",
      "road-secondary-tertiary-case",
      "road-primary-case",
      "road-motorway-trunk-case",
    ].forEach((id) => {
      if (m.getLayer(id)) m.setPaintProperty(id, "line-color", "#dce6ef");
    });
    if (m.getLayer("building")) {
      m.setPaintProperty("building", "fill-color", "#f5f3f0");
      m.setPaintProperty("building", "fill-outline-color", "#e8e4e0");
    }
  }, []);

  const fitAllPins = useCallback(() => {
    if (!mapRef.current) return;
    const pins = reports.filter((r) => r.lat && r.lng);
    if (pins.length > 0) {
      const bounds = pins.reduce(
        (b, r) => b.extend([r.lng, r.lat]),
        new mapboxgl.LngLatBounds(),
      );
      mapRef.current.fitBounds(bounds, {
        padding: {
          top: 100,
          bottom: 80,
          left: sidebarOpen ? 360 : 80,
          right: 80,
        },
        duration: 1800,
        maxZoom: 14,
      });
    }
  }, [reports, sidebarOpen]);

  const closePopup = () => {
    setSelectedReport(null);
    fitAllPins();
  };
  const toggleFilter = (s) =>
    setActiveFilters((p) =>
      p.includes(s) ? p.filter((f) => f !== s) : [...p, s],
    );
  const visibleReports = reports.filter(
    (r) => r.lat && r.lng && activeFilters.includes(r.status),
  );
  const filteredSidebar = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      activeFilters.includes(r.status) &&
      (!q ||
        r.title?.toLowerCase().includes(q) ||
        r.full_name?.toLowerCase().includes(q))
    );
  });
  const stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    inprogress: reports.filter((r) => r.status === "inprogress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: Z[50],
          flexDirection: "column",
          gap: 12,
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: 36,
            height: 36,
            border: `3px solid ${Z[200]}`,
            borderTopColor: Z[900],
            borderRadius: "50%",
          }}
        />
        <p style={{ color: Z[700], fontWeight: 700, fontSize: 13 }}>
          Loading map data…
        </p>
      </div>
    );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        fontFamily: "'Nunito', sans-serif",
        background: Z[900],
      }}
    >
      {/* MAP */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {MAPBOX_TOKEN ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: 121.0827,
              latitude: 15.5398,
              zoom: 12,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={`mapbox://styles/mapbox/${mapStyleId}`}
            onLoad={onMapLoad}
            attributionControl={false}
            antialias={false}
            fadeDuration={0}
            onClick={() => setSelectedReport(null)}
          >
            {mapStyleId === "streets-v12" && <Layer {...buildingsLayer} />}
            <Source
              id="palayan-barangays-admin"
              type="geojson"
              data="/palayan-barangays.geojson"
            >
              <Layer
                id="barangay-outlines-admin"
                type="line"
                paint={{
                  "line-color": "#2d8119",
                  "line-width": 2,
                  "line-opacity": 0.4,
                  "line-dasharray": [2, 2],
                }}
              />
            </Source>
            {visibleReports.map((r) => (
              <Marker
                key={r.id}
                longitude={r.lng}
                latitude={r.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedReport(selectedReport?.id === r.id ? null : r);
                }}
              >
                <PinMarker color={SC[r.status]} icon={r.icon} />
              </Marker>
            ))}
            {selectedReport && (
              <Popup
                longitude={selectedReport.lng}
                latitude={selectedReport.lat}
                anchor="bottom"
                offset={46}
                closeButton={false}
                closeOnClick={false}
                onClose={closePopup}
                maxWidth="300px"
              >
                <PopupCard
                  report={selectedReport}
                  geo={popupGeo}
                  onClose={closePopup}
                  onViewDetail={() => {
                    setDetailReport(selectedReport);
                    setSelectedReport(null);
                  }}
                />
              </Popup>
            )}
          </Map>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: Z[950],
              color: "white",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <MapIcon size={48} color={Z[600]} />
            <p style={{ color: Z[500], fontWeight: 700 }}>
              Mapbox token required
            </p>
          </div>
        )}
      </div>

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sb"
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "absolute",
              top: 12,
              bottom: 12,
              left: 12,
              width: 320,
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: Z[100],
              borderRadius: 20,
              border: `1px solid ${Z[200]}`,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 18px 16px",
                borderBottom: `1px solid ${Z[100]}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: Z[900],
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3 size={20} color="#fff" />
                </div>
                <div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 900,
                      color: Z[950],
                    }}
                  >
                    {adminDepartment?.name
                      ? `${adminDepartment.name} Map`
                      : "Map Console"}
                  </h1>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: Z[700],
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    CLIMA Portal
                  </p>
                </div>
              </div>
              <button
                onClick={onBackToDashboard}
                onMouseEnter={(e) => (e.currentTarget.style.background = Z[50])}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px",
                  borderRadius: 10,
                  border: `1px solid ${Z[200]}`,
                  background: "transparent",
                  color: Z[600],
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            </div>

            {/* Search */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${Z[100]}`,
              }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  color={Z[400]}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reports…"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "9px 32px 9px 32px",
                    background: Z[50],
                    border: `1px solid ${Z[200]}`,
                    borderRadius: 10,
                    color: Z[950],
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                    }}
                  >
                    <X size={13} color={Z[400]} />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "10px 14px",
                borderBottom: `1px solid ${Z[100]}`,
              }}
            >
              {Object.entries(SL).map(([k, label]) => {
                const on = activeFilters.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleFilter(k)}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      borderRadius: 8,
                      border: on
                        ? `1.5px solid ${SC[k]}`
                        : `1px solid ${Z[200]}`,
                      background: on ? SBG[k] : "transparent",
                      color: on ? SC[k] : Z[400],
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: SC[k],
                      }}
                    />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "10px 14px",
                borderBottom: `1px solid ${Z[100]}`,
              }}
            >
              {[
                { l: "Pending", v: stats.pending, c: SC.pending },
                { l: "Active", v: stats.inprogress, c: SC.inprogress },
                { l: "Resolved", v: stats.resolved, c: SC.resolved },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 0",
                    background: Z[50],
                    borderRadius: 10,
                    border: `1px solid ${Z[100]}`,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 900,
                      color: s.c,
                      lineHeight: 1,
                    }}
                  >
                    {s.v}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 10,
                      color: Z[700],
                      fontWeight: 700,
                    }}
                  >
                    {s.l}
                  </p>
                </div>
              ))}
            </div>

            {/* Report List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
              {filteredSidebar.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: Z[700],
                  }}
                >
                  <MapPin
                    size={28}
                    style={{ margin: "0 auto 8px", opacity: 0.4 }}
                  />
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>
                    No reports match your filters.
                  </p>
                </div>
              )}
              {filteredSidebar.map((report) => {
                const isSel = selectedReport?.id === report.id;
                const DynIcon =
                  (report.icon && ICON_MAP[report.icon]) || AlertCircle;
                const hasC = report.lat && report.lng;
                const isHov = hovered === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      if (hasC) setSelectedReport(isSel ? null : report);
                    }}
                    onMouseEnter={() => setHovered(report.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      padding: "10px 10px",
                      borderRadius: 12,
                      cursor: hasC ? "pointer" : "default",
                      marginBottom: 2,
                      background: isSel
                        ? "#f0fdf4"
                        : isHov
                          ? Z[50]
                          : "transparent",
                      border: isSel
                        ? "1px solid #bbf7d0"
                        : "1px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s",
                      opacity: hasC ? 1 : 0.5,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: SBG[report.status],
                        border: `1px solid ${SC[report.status]}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DynIcon size={16} color={SC[report.status]} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 800,
                          color: Z[950],
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.2,
                        }}
                      >
                        {report.title}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 10,
                          color: Z[700],
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <User size={9} /> {report.full_name || "Anon"}{" "}
                        <span style={{ opacity: 0.4 }}>·</span>{" "}
                        {new Date(report.created_at).toLocaleDateString(
                          "en-PH",
                          { month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 20,
                        flexShrink: 0,
                        background: SBG[report.status],
                        color: SC[report.status],
                        fontSize: 9,
                        fontWeight: 800,
                        border: `1px solid ${SC[report.status]}33`,
                      }}
                    >
                      {SL[report.status]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailReport(report);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = Z[100])
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "none")
                      }
                    >
                      <ChevronRight size={14} color={Z[400]} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "12px 14px",
                borderTop: `1px solid ${Z[200]}`,
                display: "flex",
                gap: 8,
              }}
            >
              <button
                onClick={() => fetchReports(true)}
                disabled={refreshing}
                onMouseEnter={(e) => (e.currentTarget.style.background = Z[50])}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  border: `1px solid ${Z[200]}`,
                  background: "transparent",
                  color: Z[500],
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : {}}
                  transition={
                    refreshing
                      ? { duration: 1, repeat: Infinity, ease: "linear" }
                      : {}
                  }
                >
                  <RefreshCw size={16} />
                </motion.div>
              </button>
              <button
                onClick={onLogout}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#dc2626")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#ef4444")
                }
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      {/* BOTTOM PANEL - GRAPH */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              bottom: 16,
              left: 344, // Beside the sidebar
              right: 16,
              height: 160,
              zIndex: 15,
              background: "rgba(24, 36, 22, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: 20,
              border: `1px solid ${Z[300]}`,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column"
            }}
            className="bottom-panel"
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: Z[950], fontSize: 14, fontWeight: 700 }}>Reports Over Time</h3>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: Z[700], fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{width: 8, height: 8, borderRadius: 2, background: "#ef4444"}}/> Pending</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{width: 8, height: 8, borderRadius: 2, background: "#22c55e"}}/> Resolved</span>
              </div>
            </div>
            <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fill: Z[600], fontSize: 11}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: Z[600], fontSize: 11}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: Z[200], border: 'none', borderRadius: 8, color: '#fff' }} itemStyle={{color: '#fff'}} />
                  <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      
      </AnimatePresence>

      {/* MAP CONTROLS (floating above bottom panel) */}
      <div
        className="map-controls"
        style={{
          position: "absolute",
          bottom: 192,
          right: 16,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(24, 36, 22, 0.92)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${Z[300]}`,
            borderRadius: 28,
            padding: 5,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          {[
            { id: "streets-v12", Icon: MapIcon, label: "Streets" },
            { id: "satellite-streets-v12", Icon: Globe, label: "Satellite" },
            { id: "dark-v11", Icon: Moon, label: "Dark" },
          ].map(({ id, Icon, label }) => {
            const active = mapStyleId === id;
            return (
              <button
                key={id}
                onClick={() => setMapStyleId(id)}
                title={label}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: active ? Z[900] : "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: active ? "#182416" : Z[600],
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </button>
            );
          })}
        </div>
        <button
          onClick={fitAllPins}
          title="Fit all pins"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(24, 36, 22, 0.92)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${Z[300]}`,
            color: Z[600],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            transition: "background 0.2s",
          }}
        >
          <LocateFixed size={18} />
        </button>
      </div>

      {/* STATUS LEGEND (top-right) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 20,
          background: "rgba(24, 36, 22, 0.92)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${Z[300]}`,
          borderRadius: 14,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {Object.entries(SL).map(([k, label]) => (
          <div
            key={k}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: SC[k],
                boxShadow: `0 0 6px ${SC[k]}88`,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: Z[500] }}>
              {label}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: Z[950],
                marginLeft: "auto",
                paddingLeft: 16,
              }}
            >
              {reports.filter((r) => r.status === k).length}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Full Report Detail Modal */}
      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onStatusChange={(newStatus) => {
            setReports((prev) =>
              prev.map((r) =>
                r.id === detailReport.id
                  ? { ...r, status: newStatus, statusLabel: SL[newStatus] }
                  : r,
              ),
            );
          }}
        />
      )}
    </div>
  );
}

function PopupCard({ report, geo, onClose, onViewDetail }) {
  const DynIcon = (report.icon && ICON_MAP[report.icon]) || AlertCircle;
  return (
    <div
      style={{
        width: 270,
        padding: "4px 0 2px",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: SBG[report.status],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <DynIcon size={18} color={SC[report.status]} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 800,
              color: Z[950],
              lineHeight: 1.2,
            }}
          >
            {report.title}
          </p>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 20,
              background: SBG[report.status],
              color: SC[report.status],
              display: "inline-block",
              marginTop: 4,
            }}
          >
            {SL[report.status]}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: Z[100],
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={12} color={Z[500]} />
        </button>
      </div>
      <div
        style={{
          background: Z[50],
          borderRadius: 10,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          marginBottom: 10,
          border: `1px solid ${Z[100]}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <User size={10} color={Z[400]} />
          <span style={{ fontSize: 11, color: Z[600], fontWeight: 600 }}>
            {report.full_name || "Anonymous"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={10} color="#16a34a" />
          <span style={{ fontSize: 10, color: Z[500] }}>
            {geo ? geo.barangay || geo.road || "—" : "Loading…"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={10} color={Z[400]} />
          <span style={{ fontSize: 10, color: Z[700] }}>
            {new Date(report.created_at).toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onViewDetail}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: Z[100],
            color: Z[700],
            borderRadius: 32,
            padding: "10px 12px",
            border: `1px solid ${Z[200]}`,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = Z[200])}
          onMouseLeave={(e) => (e.currentTarget.style.background = Z[100])}
        >
          <ClipboardList size={14} /> View Details
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: Z[900],
            color: "white",
            borderRadius: 32,
            padding: "10px 12px",
            textDecoration: "none",
            fontSize: 11,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Navigation size={14} /> Directions
        </a>
      </div>
    </div>
  );
}

/* ── Full Report Detail Modal ── */
function ReportDetailModal({ report, onClose, onStatusChange }) {
  const [status, setStatus] = useState(report.status);
  const [updating, setUpdating] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const DynIcon = (report.icon && ICON_MAP[report.icon]) || AlertCircle;
  const photos = report.photo_url
    ? report.photo_url.split(",").filter(Boolean)
    : [];

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await supabase
        .from("reports")
        .update({ status: newStatus, status_label: SL[newStatus] || newStatus })
        .eq("id", report.id);
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  // Parse guest contact from description prefix: [GUEST: Name - Contact: Number]
  const guestMatch = report.description?.match(
    /^\[GUEST:.*?-\s*Contact:\s*(.+?)\]/,
  );
  const contactNumber = guestMatch ? guestMatch[1].trim() : null;
  // Clean description (strip guest info prefix)
  const desc =
    report.description?.replace(/^\[GUEST:.*?\]\n\n/s, "") ||
    "No description provided.";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Nunito', sans-serif",
          padding: 20,
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 24,
            width: "100%",
            maxWidth: 560,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "24px 28px 20px",
              borderBottom: `1px solid ${Z[100]}`,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: SBG[status],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DynIcon size={24} color={SC[status]} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 900,
                  color: Z[950],
                  lineHeight: 1.2,
                }}
              >
                {report.title}
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: Z[700],
                  fontWeight: 600,
                }}
              >
                {report.category || "Uncategorized"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: Z[100],
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = Z[200])}
              onMouseLeave={(e) => (e.currentTarget.style.background = Z[100])}
            >
              <X size={16} color={Z[500]} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "20px 28px 28px" }}
          >
            {/* Status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                padding: "12px 16px",
                background: SBG[status],
                borderRadius: 14,
                border: `1px solid ${SC[status]}22`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: SC[status],
                    boxShadow: `0 0 8px ${SC[status]}66`,
                  }}
                />
                <span
                  style={{ fontSize: 13, fontWeight: 800, color: SC[status] }}
                >
                  {SL[status]}
                </span>
              </div>
              <CustomSelect
                value={status}
                onChange={handleStatusChange}
                disabled={updating}
                options={[
                  { value: "pending", label: "Pending", color: "#ef4444" },
                  {
                    value: "inprogress",
                    label: "In Progress",
                    color: "#3b82f6",
                  },
                  { value: "resolved", label: "Resolved", color: "#22c55e" },
                ]}
                compact
                accent={Z[900]}
                style={{ minWidth: 140 }}
              />
            </div>

            {/* Info Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                {
                  icon: <User size={14} color={Z[400]} />,
                  label: "Reported by",
                  value: report.full_name || "Anonymous",
                },
                {
                  icon: <Calendar size={14} color={Z[400]} />,
                  label: "Date Filed",
                  value: new Date(report.created_at).toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                },
                ...(contactNumber
                  ? [
                      {
                        icon: <Phone size={14} color={Z[400]} />,
                        label: "Contact Number",
                        value: contactNumber,
                      },
                    ]
                  : []),
                ...(report.is_guest
                  ? [
                      {
                        icon: <AlertCircle size={14} color="#d97706" />,
                        label: "Reporter Type",
                        value: "Guest (Unregistered)",
                      },
                    ]
                  : []),
                {
                  icon: <MapPin size={14} color="#16a34a" />,
                  label: "Location",
                  value: report.location || "—",
                  span: true,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    background: Z[50],
                    borderRadius: 12,
                    border: `1px solid ${Z[100]}`,
                    gridColumn: item.span ? "1 / -1" : "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    {item.icon}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: Z[700],
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: Z[800],
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: Z[700],
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Description
              </p>
              <div
                style={{
                  padding: "14px 16px",
                  background: Z[50],
                  borderRadius: 12,
                  border: `1px solid ${Z[100]}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: Z[700],
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {desc}
                </p>
              </div>
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: Z[700],
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Evidence Photos ({photos.length})
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      photos.length === 1 ? "1fr" : "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {photos.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImg(url)}
                      style={{
                        position: "relative",
                        borderRadius: 14,
                        overflow: "hidden",
                        cursor: "pointer",
                        border: `1px solid ${Z[200]}`,
                        aspectRatio: photos.length === 1 ? "16/10" : "1/1",
                      }}
                    >
                      <img
                        src={url.trim()}
                        alt={`Evidence ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          transition: "transform 0.3s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Directions */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: Z[900],
                color: "white",
                borderRadius: 14,
                padding: "14px",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 800,
                marginTop: 20,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = Z[800])}
              onMouseLeave={(e) => (e.currentTarget.style.background = Z[900])}
            >
              <Navigation size={18} /> Get Directions
            </a>
          </div>
        </motion.div>
      </motion.div>

      
      {/* Lightbox */}
      {lightboxImg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: 20,
          }}
        >
          <img
            src={lightboxImg}
            alt="Full view"
            style={{
              maxWidth: "95%",
              maxHeight: "95vh",
              borderRadius: 12,
              objectFit: "contain",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          />
          <button
            onClick={() => setLightboxImg(null)}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={20} color="white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
