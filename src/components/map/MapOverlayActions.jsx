import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "./SearchBar";
import { LayerControls } from "./LayerControls";
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
            flexDirection: "column",
            gap: 8,
            alignItems: "stretch",
            width: "100%",
          }}
        >
          {/* Top Row: Search Bar and Controls */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Left Side: Compact Search Bar */}
            <div style={{ flex: 1, minWidth: 160, maxWidth: 400 }}>
              <SearchBar
                mapRef={mapRef}
                onSearchSelect={setSearchPin}
                userLocation={userLocation}
                isPill={false}
              />
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
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom Row: Category Shortcuts */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
            {[
              { id: "water", label: "Water", color: "#3B82F6", emoji: "💧" },
              { id: "recreation", label: "Recreation", color: "#16a34a", emoji: "🏖️" },
              { id: "health", label: "Health", color: "#dc2626", emoji: "🏥" },
              { id: "utility", label: "Utilities", color: "#f59e0b", emoji: "⚡" },
            ].map((cat) => {
              const isActive = activeFilters.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    // When clicked, open the category list panel
                    if (onCategoryClick) {
                      onCategoryClick(cat.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 16,
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
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{cat.emoji}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isDark ? "#ffffff" : "#09090b",
                    }}
                  >
                    {cat.label}
                  </span>
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
