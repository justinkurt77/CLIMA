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
  pending: "#E74C3C",
  inprogress: "#3498DB",
  resolved: "#2ECC71",
};
const STATUS_BG = {
  pending: "#FEE2E2",
  inprogress: "#EBF5FB",
  resolved: "#E8F8F0",
};

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
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchPin, setSearchPin] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [popupGeo, setPopupGeo] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState([
    "pending",
    "inprogress",
    "resolved",
  ]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapStyleId, setMapStyleId] = useState("streets-v12");
  const [isExiting, setIsExiting] = useState(false);
  const [barangayMarkers, setBarangayMarkers] = useState([]);
  const popupContentRef = useRef(null);
  const mapRef = useRef(null);
  const hasJumped = useRef(false);

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

  const allReports = userReports.filter((r) => {
    const hasCoords = r.lat && r.lng;
    if (!hasCoords) return false;
    // In Admin mode, show ALL pins regardless of user filters for the "overview"
    if (isAdmin) return true;
    return activeFilters.includes(r.status);
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
                  background: "#3b82f6",
                  border: "3px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                }}
              />
            </Marker>
          )}

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
                color={STATUS_COLORS[report.status]}
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
                background: "rgba(74, 94, 54, 0.95)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 40,
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
                alignItems: "center",
                width: "100%",
              }}
            >
              {[
                { id: "streets-v12", Icon: MapIcon },
                { id: "satellite-streets-v12", Icon: Globe },
                { id: "dark-v11", Icon: Moon },
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
                      background: isActive ? "#ffffff" : "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <layer.Icon
                      size={20}
                      color={isActive ? "#4A5E36" : "rgba(255,255,255,0.7)"}
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
                background: "white",
                borderRadius: 28,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
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
              <LocateFixed size={24} color="#2d8119" />
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
