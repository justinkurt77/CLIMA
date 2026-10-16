import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "./SearchBar";
import { LayerControls } from "./LayerControls";
import { KloudtrackMapControls } from "./KloudtrackMapControls";

export function MapOverlayActions({
  isMapFullView,
  onOpenModal,
  setSearchPin,
  userLocation,
  mapRef,
  activeLayers,
  onToggleLayer,
  activeMetric,
  onSelectMetric,
  weatherStations,
  selectedStation,
  onSelectStation,
}) {
  // Coordinated dropdown state: null (all minimized by default) | "metric" | "scale" | "layers"
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRef = useRef(null);

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
              gap: 8,
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* 1. Left Side: Search Bar */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <SearchBar
                mapRef={mapRef}
                onSearchSelect={setSearchPin}
                userLocation={userLocation}
                isPill={true}
              />
            </div>

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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

