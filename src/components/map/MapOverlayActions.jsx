import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplet, Palmtree, HeartPulse, Zap } from "lucide-react";
import SearchBar from "./SearchBar";
import { LayerControls } from "./LayerControls";
import { KloudtrackMapControls } from "./KloudtrackMapControls";
import { useTheme } from "../../context/ThemeContext";

export function MapOverlayActions({
  isMapFullView,
  onOpenModal,
  activeFilters,
  setActiveFilters,
  setSearchPin,
  userLocation,
  mapRef,
  activeLayers,
  onToggleLayer,
  onCategoryClick,
  activeMetric,
  onSelectMetric,
  weatherStations,
  selectedStation,
  onSelectStation,
}) {
  const { isDark } = useTheme();
  // Coordinated dropdown state: null (all minimized by default) | "metric" | "scale" | "layers"
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);

  // Mobile detection for compact controls & icon-only category pills (< 1024px matches CLIMA mobile view)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdowns on outside click or touch
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  return (
    <AnimatePresence>
      {isMapFullView && (
        <motion.div
          layoutId="header-search-morph"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.7,
            ease: [0.32, 0.72, 0, 1],
          }}
          style={{
            position: "absolute",
            top: "calc(8px + env(safe-area-inset-top, 0px))",
            left: 8,
            right: 8,
            zIndex: 10,
            pointerEvents: "auto",
            width: "calc(100% - 16px)",
            maxWidth: "100%",
          }}
        >
          <motion.div
            ref={containerRef}
            key="search-mode"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "stretch",
              width: "100%",
            }}
          >
            {/* Top Row: Search Bar and Controls */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%", position: "relative" }}>
              {/* 1. Left Side: Search Bar Icon / Overlay */}
              <SearchBar
                mapRef={mapRef}
                onSearchSelect={setSearchPin}
                userLocation={userLocation}
                isOpen={openDropdown === "search"}
                onToggleOpen={(open) => setOpenDropdown(open ? "search" : null)}
              />

              {/* 2. Beside Search Bar: IoT Weather Metric & Scale Legend Pills */}
              {activeLayers?.kloudtrackStations && (
                <KloudtrackMapControls
                  activeMetric={activeMetric}
                  onSelectMetric={onSelectMetric}
                  isMapFullView={isMapFullView}
                  stations={weatherStations}
                  selectedStation={selectedStation}
                  onSelectStation={onSelectStation}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              )}

              {/* 3. Right Side: Layer Controls Pill */}
              {activeLayers && onToggleLayer && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <LayerControls
                    activeLayers={activeLayers}
                    onToggleLayer={onToggleLayer}
                    isMapFullView={isMapFullView}
                    isEmbedded={true}
                    isOpen={openDropdown === "layers"}
                    onToggleOpen={(open) => setOpenDropdown(open ? "layers" : null)}
                  />
                </div>
              )}
            </div>

            {/* Bottom Row: Category Shortcuts */}
            <div style={{ 
              display: "flex", 
              gap: 6, 
              alignItems: "center", 
              flexWrap: "nowrap", 
              overflowX: "auto", 
              overflowY: "visible",
              paddingBottom: 2, 
              paddingTop: 4,
              width: "100%",
              WebkitOverflowScrolling: "touch",
              marginTop: 4,
            }}>
              {[
                { id: "water", label: "Water", color: "#38bdf8", icon: Droplet },
                { id: "recreation", label: "Recreation", color: "#22c55e", icon: Palmtree },
                { id: "health", label: "Health", color: "#ef4444", icon: HeartPulse },
                { id: "utility", label: "Utilities", color: "#f59e0b", icon: Zap },
              ].map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeFilters.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    className="map-category-shortcut-btn"
                    title={cat.label}
                    aria-label={cat.label}
                    onClick={() => {
                      // When clicked, open the category list panel
                      if (onCategoryClick) {
                        onCategoryClick(cat.id);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isMobile ? "center" : "flex-start",
                      gap: isMobile ? 0 : 7,
                      padding: isMobile ? "0" : "8px 14px",
                      width: isMobile ? 38 : "auto",
                      height: isMobile ? 38 : "auto",
                      minWidth: isMobile ? 38 : "auto",
                      borderRadius: isMobile ? 12 : 16,
                      background: isActive
                        ? isDark
                          ? "rgba(255, 255, 255, 0.15)"
                          : "rgba(0, 0, 0, 0.08)"
                        : isDark
                          ? "rgba(18, 18, 20, 0.94)"
                          : "rgba(255, 255, 255, 0.96)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: isDark
                        ? `1px solid ${isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.12)"}`
                        : `1px solid ${isActive ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.08)"}`,
                      boxShadow: isDark
                        ? "0 2px 8px rgba(0,0,0,0.3)"
                        : "0 2px 8px rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={isMobile ? 18 : 14} color={cat.color} strokeWidth={2.4} />
                    {!isMobile && (
                      <span
                        className="map-category-shortcut-label"
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: isDark ? "#ffffff" : "#09090b",
                        }}
                      >
                        {cat.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
