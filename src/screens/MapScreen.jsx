import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  GeolocateControl,
  Layer,
  Source,
} from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Search,
  Plus,
  X,
  MapPin,
  LocateFixed,
  Navigation,
  Image,
  FileText,
  Calendar,
  MapPinned,
  Landmark,
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  ChevronDown,
  Globe,
  Moon,
  Map as MapIcon,
} from "lucide-react";

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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const STATUS_COLORS = {
  pending: "#ffffff",
  inprogress: "#e4e4e7",
  resolved: "#a1a1aa",
  water: "#0284c7",
  recreation: "#16a34a",
  health: "#dc2626",
};
const STATUS_BG = {
  pending: "rgba(255, 255, 255, 0.2)",
  inprogress: "rgba(255, 255, 255, 0.12)",
  resolved: "rgba(255, 255, 255, 0.08)",
  water: "rgba(2, 132, 199, 0.18)",
  recreation: "rgba(22, 163, 74, 0.18)",
  health: "rgba(220, 38, 38, 0.18)",
};

const CLIMA_COMMUNITY_FACILITIES = [
  // ── Rivers & Water Areas ──
  {
    id: "fac-water-1",
    title: "Peñaranda River Monitoring Point",
    category: "Rivers & Water Areas",
    filterType: "water",
    status: "water",
    statusLabel: "Rivers & Water Areas",
    description: "Key river basin observation point. Monitored for water levels, flow rate, and seasonal flood mitigation.",
    lat: 15.5280,
    lng: 121.0740,
    icon: "TreePine",
    pinColor: "#0284c7",
  },
  {
    id: "fac-water-2",
    title: "Aulo Dam & Reservoir Basin",
    category: "Rivers & Water Areas",
    filterType: "water",
    status: "water",
    statusLabel: "Rivers & Water Areas",
    description: "Major irrigation dam and water reservoir supplying Palayan agricultural fields.",
    lat: 15.5760,
    lng: 121.1120,
    icon: "TreePine",
    pinColor: "#0284c7",
  },
  {
    id: "fac-water-3",
    title: "Bacao River & Irrigation Canal",
    category: "Rivers & Water Areas",
    filterType: "water",
    status: "water",
    statusLabel: "Rivers & Water Areas",
    description: "Agricultural waterway canal regulating freshwater flow across western Palayan barangays.",
    lat: 15.5480,
    lng: 121.0620,
    icon: "TreePine",
    pinColor: "#0284c7",
  },
  {
    id: "fac-water-4",
    title: "Caimito Creek & Waterways",
    category: "Rivers & Water Areas",
    filterType: "water",
    status: "water",
    statusLabel: "Rivers & Water Areas",
    description: "Natural stream catchment and tributary connecting to regional drainage basin.",
    lat: 15.5390,
    lng: 121.0920,
    icon: "TreePine",
    pinColor: "#0284c7",
  },
  {
    id: "fac-water-5",
    title: "Singalat River Observation Post",
    category: "Rivers & Water Areas",
    filterType: "water",
    status: "water",
    statusLabel: "Rivers & Water Areas",
    description: "Community river level station for early rainfall warnings and irrigation management.",
    lat: 15.5210,
    lng: 121.0850,
    icon: "TreePine",
    pinColor: "#0284c7",
  },

  // ── Resorts & Recreation Areas ──
  {
    id: "fac-rec-1",
    title: "Palayan City Plaza & Sports Complex",
    category: "Resorts & Recreation Areas",
    filterType: "recreation",
    status: "recreation",
    statusLabel: "Resorts & Recreation Areas",
    description: "Central civic plaza, athletic track, basketball complex, and community event grounds.",
    lat: 15.5410,
    lng: 121.0845,
    icon: "Landmark",
    pinColor: "#16a34a",
  },
  {
    id: "fac-rec-2",
    title: "Aulo Eco-Park & Lakeside Recreation",
    category: "Resorts & Recreation Areas",
    filterType: "recreation",
    status: "recreation",
    statusLabel: "Resorts & Recreation Areas",
    description: "Scenic lakeside eco-park with picnic areas, hiking paths, and sunset viewpoints.",
    lat: 15.5740,
    lng: 121.1150,
    icon: "TreePine",
    pinColor: "#16a34a",
  },
  {
    id: "fac-rec-3",
    title: "Singalat Nature Resort & Spring",
    category: "Resorts & Recreation Areas",
    filterType: "recreation",
    status: "recreation",
    statusLabel: "Resorts & Recreation Areas",
    description: "Popular recreation resort featuring freshwater spring pools and open cottages.",
    lat: 15.5180,
    lng: 121.0890,
    icon: "Landmark",
    pinColor: "#16a34a",
  },
  {
    id: "fac-rec-4",
    title: "Freedom Park & City Greens",
    category: "Resorts & Recreation Areas",
    filterType: "recreation",
    status: "recreation",
    statusLabel: "Resorts & Recreation Areas",
    description: "Open garden park, walking promenades, and cultural recreation facilities at the capitol complex.",
    lat: 15.5630,
    lng: 121.1005,
    icon: "Landmark",
    pinColor: "#16a34a",
  },
  {
    id: "fac-rec-5",
    title: "Fort Magsaysay Mountain & Eco-Camp",
    category: "Resorts & Recreation Areas",
    filterType: "recreation",
    status: "recreation",
    statusLabel: "Resorts & Recreation Areas",
    description: "Expansive pine-lined mountain trails, camping grounds, and outdoor adventure park.",
    lat: 15.5020,
    lng: 121.0650,
    icon: "TreePine",
    pinColor: "#16a34a",
  },

  // ── Health & Emergency Facilities ──
  {
    id: "fac-health-1",
    title: "Palayan City District Hospital",
    category: "Health & Emergency Facilities",
    filterType: "health",
    status: "health",
    statusLabel: "Health & Emergency Facilities",
    description: "24/7 Government hospital, emergency medicine, inpatient care, and surgical ward.",
    lat: 15.5435,
    lng: 121.0830,
    icon: "ShieldAlert",
    pinColor: "#dc2626",
  },
  {
    id: "fac-health-2",
    title: "CDRRMO Palayan Disaster Operations Center",
    category: "Health & Emergency Facilities",
    filterType: "health",
    status: "health",
    statusLabel: "Health & Emergency Facilities",
    description: "City Disaster Risk Reduction Management Office & 911 Emergency Command Center.",
    lat: 15.5628,
    lng: 121.1010,
    icon: "ShieldAlert",
    pinColor: "#dc2626",
  },
  {
    id: "fac-health-3",
    title: "Palayan City Rural Health Unit (RHU)",
    category: "Health & Emergency Facilities",
    filterType: "health",
    status: "health",
    statusLabel: "Health & Emergency Facilities",
    description: "Comprehensive public health center offering triage, vaccination, and maternal care.",
    lat: 15.5402,
    lng: 121.0860,
    icon: "ShieldAlert",
    pinColor: "#dc2626",
  },
  {
    id: "fac-health-4",
    title: "BFP Palayan City Central Fire & Rescue",
    category: "Health & Emergency Facilities",
    filterType: "health",
    status: "health",
    statusLabel: "Health & Emergency Facilities",
    description: "Bureau of Fire Protection station equipped with emergency rescue trucks and ambulances.",
    lat: 15.5615,
    lng: 121.0995,
    icon: "ShieldAlert",
    pinColor: "#dc2626",
  },
  {
    id: "fac-health-5",
    title: "Singalat Barangay Health & Emergency Station",
    category: "Health & Emergency Facilities",
    filterType: "health",
    status: "health",
    statusLabel: "Health & Emergency Facilities",
    description: "Local community first-responder outpost and primary health clinic.",
    lat: 15.5225,
    lng: 121.0835,
    icon: "ShieldAlert",
    pinColor: "#dc2626",
  },
];

const buildingsLayer = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 14,
  paint: {
    "fill-extrusion-color": "#ffffff",
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["get", "min_height"],
    "fill-extrusion-opacity": 0.95,
    "fill-extrusion-ambient-occlusion-intensity": 0.5,
    "fill-extrusion-ambient-occlusion-radius": 4,
  },
};

import SearchBar from "../components/map/SearchBar";
import { PinMarker, SearchPin } from "../components/map/MapPins";
import { reverseGeocode } from "../components/ui/report/reportConstants";
import { MapOverlayActions } from "../components/map/MapOverlayActions";
import { MapPopupContent } from "../components/map/MapPopupContent";
import { PhotoLightbox } from "../components/map/PhotoLightbox";
import { DescriptionModal } from "../components/map/DescriptionModal";
import { useTheme } from "../context/ThemeContext";

function MapScreen({
  onOpenModal,
  userReports = [],
  showMapUI = true,
  userLocation,
  onMapDoubleClick,
  onPinClick,
  isMapFullView,
  isAdmin = false,
  activeScreen,
  isNavMinimized,
}) {
  const { theme, isDark } = useTheme();
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchPin, setSearchPin] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [popupGeo, setPopupGeo] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState([
    "water",
    "recreation",
    "health",
  ]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapStyleId, setMapStyleId] = useState(isDark ? "dark-v11" : "streets-v12");
  const [isExiting, setIsExiting] = useState(false);
  const [barangayMarkers, setBarangayMarkers] = useState([]);
  const popupContentRef = useRef(null);
  const mapRef = useRef(null);
  const hasJumped = useRef(false);

  useEffect(() => {
    setMapStyleId(isDark ? "dark-v11" : "streets-v12");
  }, [isDark]);

  const closePopup = () => {
    setIsExiting(true);
    
    // Also try to attach it manually in case React hasn't flushed to DOM yet
    const el = popupContentRef.current;
    if (el) {
      const popupWrapper = el.closest(".mapboxgl-popup");
      if (popupWrapper) popupWrapper.classList.add("popup-exiting");
      el.classList.add("popup-exiting");
    }

    setTimeout(() => {
      setSelectedReport(null);
      setPhotoModalOpen(false);
      setDescModalOpen(false);
      setDescExpanded(false);
      setIsExiting(false);
    }, 360);
  };

  const onMapLoad = useCallback((e) => {
    const map = e.target;

    // Update theme-color to match the map's land background so the Android
    // status bar blends seamlessly with the map.
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const statusBarColor = isDark ? "#1a1f2e" : "#f5f3f0";
    const themeColorMeta = document.querySelector(
      'meta[name="theme-color"]:not([media])',
    );
    if (themeColorMeta) themeColorMeta.content = statusBarColor;

    // ... rest of the existing code
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
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current && !hasJumped.current && !isAdmin) {
      mapRef.current.jumpTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 18.5,
      });
      hasJumped.current = true;
    }
  }, [userLocation, isAdmin]);

  useEffect(() => {
    fetch("/palayan-barangays.geojson")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.features) {
          const markers = data.features.map((f) => {
            // Calculate a simple bounding box center for the polygon
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const processCoords = (coords) => {
              for (const pt of coords) {
                if (typeof pt[0] === "number") {
                  minX = Math.min(minX, pt[0]);
                  maxX = Math.max(maxX, pt[0]);
                  minY = Math.min(minY, pt[1]);
                  maxY = Math.max(maxY, pt[1]);
                } else {
                  processCoords(pt);
                }
              }
            };
            processCoords(f.geometry.coordinates);
            
            return {
              id: f.properties.adm4_psgc,
              name: f.properties.adm4_en,
              lng: (minX + maxX) / 2,
              lat: (minY + maxY) / 2,
            };
          });
          setBarangayMarkers(markers);
        }
      })
      .catch((err) => console.error("Failed to load barangay map:", err));
  }, []);

  // Overview View: Auto-fit bounds for Admin or Map Screen
  useEffect(() => {
    if (mapRef.current && (isAdmin || activeScreen === "maps")) {
      const pins = userReports.filter((r) => r.lat && r.lng);

      if (pins.length > 0) {
        const bounds = pins.reduce(
          (b, r) => b.extend([r.lng, r.lat]),
          new mapboxgl.LngLatBounds(),
        );

        mapRef.current.fitBounds(bounds, {
          padding: { top: 120, bottom: 60, left: 60, right: 60 },
          duration: 2500,
          maxZoom: 15,
          essential: true
        });
      } else {
        // Fallback to city center if no reports exist
        mapRef.current.flyTo({
          center: [121.0827, 15.5398],
          zoom: 12.5,
          pitch: 0,
          bearing: 0,
          duration: 2500,
          essential: true,
        });
      }
    }
  }, [isAdmin, activeScreen, userLocation, userReports]);

  const getReportFilterType = (r) => {
    const text = `${r.title || ""} ${r.category || ""} ${r.description || ""}`.toLowerCase();
    if (
      text.includes("water") ||
      text.includes("river") ||
      text.includes("creek") ||
      text.includes("drainage") ||
      text.includes("flood") ||
      text.includes("canal") ||
      text.includes("pump")
    ) {
      return "water";
    }
    if (
      text.includes("resort") ||
      text.includes("park") ||
      text.includes("tree") ||
      text.includes("plaza") ||
      text.includes("plant") ||
      text.includes("recreation")
    ) {
      return "recreation";
    }
    return "health";
  };

  const visibleFacilities = CLIMA_COMMUNITY_FACILITIES.filter((f) =>
    activeFilters.includes(f.filterType)
  );

  const allReports = userReports.filter((r) => {
    const hasCoords = r.lat && r.lng;
    if (!hasCoords) return false;
    if (isAdmin) return true;
    const fType = getReportFilterType(r);
    return activeFilters.includes(fType);
  });

  // Reverse geocode and zoom whenever a pin is selected
  useEffect(() => {
    if (!selectedReport?.lat || !selectedReport?.lng) {
      setPopupGeo(null);
      return;
    }

    // Zoom in smoothly to the selected pin
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedReport.lng, selectedReport.lat],
        zoom: 18.2,
        pitch: 45,
        duration: 1200,
        essential: true,
      });
    }

    setPopupGeo(null);
    setDescExpanded(false); // collapse on new pin
    reverseGeocode(selectedReport.lat, selectedReport.lng)
      .then(({ barangay, road }) => setPopupGeo({ barangay, road }))
      .catch(() => setPopupGeo({}));
  }, [selectedReport?.id]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {showMapUI && (
          <div className="map-header">
            <div className="map-title">Report Map 🗺️</div>
            <div className="map-search">
              <Search size={14} color="var(--gray)" />
              <span>Search for a place...</span>
            </div>
          </div>
        )}
        <div className="map-container">
          <div className="map-loading">
            <div style={{ fontSize: 48, marginBottom: 8 }}>🗺️</div>
            <div className="map-loading-text">Mapbox Token Required</div>
            <div
              style={{
                fontSize: 12,
                color: "var(--gray)",
                textAlign: "center",
                maxWidth: 270,
                padding: "0 20px",
                lineHeight: 1.7,
              }}
            >
              Get a free token at{" "}
              <a
                href="https://account.mapbox.com/auth/signup/"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#2d8119", fontWeight: 700 }}
              >
                mapbox.com
              </a>{" "}
              and put it in <strong>VITE_MAPBOX_TOKEN</strong> in .env
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MapOverlayActions
        isMapFullView={isMapFullView}
        onOpenModal={onOpenModal}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        setSearchPin={setSearchPin}
        userLocation={userLocation}
        mapRef={mapRef}
      />

      <div className="map-container" style={{ position: "absolute", inset: 0 }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: userLocation?.lng || 121.0827,
            latitude: userLocation?.lat || 15.5398,
            zoom: 17,
            pitch: 52,
            bearing: -15,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={`mapbox://styles/mapbox/${mapStyleId}`}
          onLoad={onMapLoad}
          attributionControl={false}
          antialias={false}
          fadeDuration={0}
          trackResize={true}
          onDblClick={(e) => {
            e.originalEvent.preventDefault();
            if (onMapDoubleClick) onMapDoubleClick();
            closePopup();
            if (mapRef.current) {
              const zoom = mapRef.current.getZoom();
              mapRef.current.flyTo({
                zoom: zoom >= 18 ? 16 : 18.5,
                duration: 800,
              });
            }
          }}
          doubleClickZoom={false}
        >
          {showMapUI && (
            <>
              {/* Removed Mapbox default controls to prefer custom mobile UI */}
            </>
          )}
          {mapStyleId === "streets-v12" && <Layer {...buildingsLayer} />}

          <Source
            id="palayan-barangays"
            type="geojson"
            data="/palayan-barangays.geojson"
          >
            <Layer
              id="barangay-outlines"
              type="line"
              paint={{
                "line-color": mapStyleId === "dark-v11" ? "#ffffff" : mapStyleId === "streets-v12" ? "#000000" : "#4ADE80",
                "line-width": 1.5,
                "line-opacity": mapStyleId === "dark-v11" ? 0.6 : 0.75,
                "line-dasharray": [3, 2],
              }}
            />
          </Source>

          {userLocation && (
            <Marker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
              anchor="center"
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  background: "#ffffff",
                  border: "3px solid #000000",
                  borderRadius: "50%",
                  boxShadow: "0 0 12px rgba(255,255,255,0.8)",
                }}
              />
            </Marker>
          )}

          {/* CLIMA Curated Facilities (Rivers & Water, Resorts & Recreation, Health & Emergency) */}
          {visibleFacilities.map((fac) => (
            <Marker
              key={fac.id}
              longitude={fac.lng}
              latitude={fac.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (selectedReport?.id === fac.id) {
                  closePopup();
                } else {
                  setSelectedReport(fac);
                  setIsExiting(false);
                  if (onPinClick) onPinClick();
                }
              }}
            >
              <PinMarker
                color={fac.pinColor}
                icon={fac.icon}
              />
            </Marker>
          ))}

          {allReports.map((report) => (
            <Marker
              key={report.id}
              longitude={report.lng}
              latitude={report.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (selectedReport?.id === report.id) {
                  closePopup();
                } else {
                  setSelectedReport(report);
                  setIsExiting(false);
                  if (onPinClick) onPinClick();
                }
              }}
            >
              <PinMarker
                color={STATUS_COLORS[report.status] || STATUS_COLORS[getReportFilterType(report)] || "#ffffff"}
                icon={report.icon}
              />
            </Marker>
          ))}

          {/* Barangay Name Markers */}
          {barangayMarkers.map((bgy) => (
            <Marker
              key={`bgy-${bgy.id}`}
              longitude={bgy.lng}
              latitude={bgy.lat}
              anchor="center"
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  color: mapStyleId === "dark-v11" ? "#ffffff" : mapStyleId === "satellite-streets-v12" ? "#ffffff" : "#1a1a1a",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  textShadow: mapStyleId === "streets-v12"
                    ? "0px 0px 4px white, 0px 0px 4px white"
                    : "0px 0px 6px rgba(0,0,0,1), 0px 0px 6px rgba(0,0,0,1), 0px 0px 3px rgba(0,0,0,0.8)",
                  letterSpacing: "0.4px",
                  whiteSpace: "nowrap",
                  opacity: 0.9,
                }}
              >
                {bgy.name}
              </div>
            </Marker>
          ))}

          {searchPin && (
            <Marker
              longitude={searchPin.lng}
              latitude={searchPin.lat}
              anchor="bottom"
            >
              <SearchPin />
            </Marker>
          )}

          {selectedReport && (
            <Popup
              longitude={selectedReport.lng}
              latitude={selectedReport.lat}
              anchor="bottom"
              offset={46}
              closeButton={false}
              closeOnClick={false}
              onClose={closePopup}
              className={isExiting ? "popup-exiting" : ""}
              style={{ fontFamily: "Nunito, sans-serif" }}
              maxWidth="280px"
            >
              <MapPopupContent
                selectedReport={selectedReport}
                popupGeo={popupGeo}
                closePopup={closePopup}
                STATUS_BG={STATUS_BG}
                STATUS_COLORS={STATUS_COLORS}
                descExpanded={descExpanded}
                setDescExpanded={setDescExpanded}
                setPhotoModalOpen={setPhotoModalOpen}
                popupContentRef={popupContentRef}
              />
            </Popup>
          )}
        </Map>

        {/* Map Styles & Legend UI - Only visible in full map view */}
        {showMapUI && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(16px + env(safe-area-inset-bottom, 0px) + 64px + 6px + 64px + 6px)",
              right: 14,
              width: 64,
              zIndex: 9,
              opacity: isMapFullView ? 1 : 0,
              pointerEvents: isMapFullView ? "auto" : "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              transform: isMapFullView
                ? "scale(1) translateX(0)"
                : "scale(0.8) translateX(20px)",
              transition: "all 0.7s cubic-bezier(0.32, 0.72, 0, 1)",
              alignItems: "center",
            }}
          >
            {/* Map Styles Pill */}
            <div
              style={{
                background: isDark
                  ? "rgba(18, 18, 20, 0.94)"
                  : "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.12)"
                  : "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 40,
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: isDark
                  ? "0 10px 28px rgba(0,0,0,0.6)"
                  : "0 10px 28px rgba(0,0,0,0.12)",
                alignItems: "center",
                width: "100%",
              }}
            >
              {[
                { id: "dark-v11", Icon: Moon },
                { id: "streets-v12", Icon: MapIcon },
                { id: "satellite-streets-v12", Icon: Globe },
              ].map((layer) => {
                const isActive = mapStyleId === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setMapStyleId(layer.id)}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: isActive
                        ? "var(--accent-orange)"
                        : "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "0 4px 14px var(--accent-glow)"
                        : "none",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <layer.Icon
                      size={20}
                      color={
                        isActive
                          ? "#ffffff"
                          : isDark
                            ? "rgba(255,255,255,0.6)"
                            : "rgba(0,0,0,0.5)"
                      }
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FAB — only on Maps tab */}
        {showMapUI && (
          <>
            <button
              onClick={() => {
                if (userLocation && mapRef.current) {
                  mapRef.current.flyTo({
                    center: [userLocation.lng, userLocation.lat],
                    zoom: 17,
                    duration: 1200,
                  });
                }
              }}
              style={{
                position: "absolute",
                bottom:
                  "calc(16px + env(safe-area-inset-bottom, 0px) + 64px + 6px)",
                right: 14,
                width: 64,
                height: 64,
                background: isDark ? "#18181b" : "#ffffff",
                borderRadius: 28,
                boxShadow: isDark
                  ? "0 8px 24px rgba(0,0,0,0.5)"
                  : "0 8px 24px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.16)"
                  : "1px solid rgba(0,0,0,0.08)",
                zIndex: 10,
                opacity: isMapFullView ? 1 : 0,
                pointerEvents: isMapFullView ? "auto" : "none",
                transform: isMapFullView
                  ? "scale(1) translateX(0)"
                  : "scale(0.8) translateX(20px)",
                transition: "all 0.7s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
              aria-label="Back to my location"
            >
              <LocateFixed size={24} color={isDark ? "#ffffff" : "#09090b"} />
            </button>
          </>
        )}
      </div>

      <PhotoLightbox
        photoModalOpen={photoModalOpen}
        setPhotoModalOpen={setPhotoModalOpen}
        selectedReport={selectedReport}
      />

      <DescriptionModal
        descModalOpen={descModalOpen}
        setDescModalOpen={setDescModalOpen}
        selectedReport={selectedReport}
      />
    </div>
  );
}

export default MapScreen;
