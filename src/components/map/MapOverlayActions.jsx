import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, ChevronDown, Radio } from "lucide-react";
import SearchBar from "./SearchBar";
import { LayerControls } from "./LayerControls";
import { useTheme } from "../../context/ThemeContext";

export function MapOverlayActions({
  isMapFullView,
  onOpenModal,
  activeFilters,
  setActiveFilters,
  filterOpen,
  setFilterOpen,
  setSearchPin,
  userLocation,
  mapRef,
  activeLayers,
  onToggleLayer,
}) {
  const { isDark } = useTheme();
  const [layersOpen, setLayersOpen] = useState(false);
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
          key="search-mode"
          initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Left Side: Search Bar */}
          <div style={{ flex: 1, minWidth: 160 }}>
              <SearchBar
                mapRef={mapRef}
                onSearchSelect={setSearchPin}
                userLocation={userLocation}
                isPill={true}
              />
            </div>

            {/* Right Side: Status Filter Pill */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => {
                  setFilterOpen((v) => !v);
                  setLayersOpen(false);
                }}
                style={{
                  height: 56,
                  background: isDark
                    ? "rgba(18, 18, 20, 0.94)"
                    : "rgba(255, 255, 255, 0.96)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  borderRadius: 40,
                  padding: "0 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.12)"
                    : "1px solid rgba(0, 0, 0, 0.08)",
                  boxShadow: isDark
                    ? "0 6px 20px rgba(0,0,0,0.5)"
                    : "0 6px 20px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Filter Facilities"
              >
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  {activeFilters.includes("water") && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#0284c7",
                      }}
                    />
                  )}
                  {activeFilters.includes("recreation") && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#16a34a",
                      }}
                    />
                  )}
                  {activeFilters.includes("health") && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#dc2626",
                      }}
                    />
                  )}
                </div>
                <ChevronDown
                  size={14}
                  color={isDark ? "white" : "#09090b"}
                  style={{
                    flexShrink: 0,
                    opacity: 0.7,
                    transform: filterOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      minWidth: 235,
                      width: "max-content",
                      background: isDark ? "#121214" : "#ffffff",
                      border: isDark
                        ? "1px solid rgba(255, 255, 255, 0.12)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: 18,
                      padding: 8,
                      boxShadow: isDark
                        ? "0 12px 30px rgba(0,0,0,0.6)"
                        : "0 12px 30px rgba(0,0,0,0.12)",
                      zIndex: 100,
                    }}
                  >
                    {[
                      {
                        id: "water",
                        label: "Rivers & Water Areas",
                        bg: "#0284c7",
                      },
                      {
                        id: "recreation",
                        label: "Resorts & Recreation Areas",
                        bg: "#16a34a",
                      },
                      {
                        id: "health",
                        label: "Health & Emergency Facilities",
                        bg: "#dc2626",
                      },
                    ].map((item) => {
                      const isActive = activeFilters.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveFilters((prev) =>
                              isActive
                                ? prev.filter((f) => f !== item.id)
                                : [...prev, item.id],
                            );
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: isActive
                              ? isDark
                                ? "rgba(255, 255, 255, 0.1)"
                                : "rgba(0, 0, 0, 0.05)"
                              : "transparent",
                            border: "none",
                            cursor: "pointer",
                            marginBottom: 4,
                            transition: "background 0.2s",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 5,
                              background: isActive
                                ? item.bg
                                : isDark
                                  ? "#27272a"
                                  : "#e4e4e7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "background 0.2s",
                            }}
                          >
                            {isActive && (
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "#ffffff",
                                }}
                              />
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: isActive
                                ? isDark
                                  ? "#ffffff"
                                  : "#09090b"
                                : isDark
                                  ? "#a1a1aa"
                                  : "#71717a",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Side: Layer Controls Pill */}
            {activeLayers && onToggleLayer && (
              <div style={{ position: "relative", flexShrink: 0 }}>
                <LayerControls
                  activeLayers={activeLayers}
                  onToggleLayer={onToggleLayer}
                  isMapFullView={isMapFullView}
                  isEmbedded={true}
                  isOpen={layersOpen}
                  onToggleOpen={(open) => {
                    setLayersOpen(open);
                    if (open) setFilterOpen(false);
                  }}
                />
              </div>
            )}
        </motion.div>
        </motion.div>
    )}
  </AnimatePresence>
  );
}
