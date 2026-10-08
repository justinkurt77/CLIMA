import { useState } from "react";
import { Layers, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const LAYER_CATEGORIES = [
  {
    id: "boundaries",
    name: "Boundaries",
    layers: [
      { id: "barangays", name: "Barangay Boundaries", color: "#4ADE80" },
    ],
  },
  {
    id: "incidents",
    name: "Incident Data",
    layers: [
      { id: "heatmap", name: "Incident Heatmap", color: "#F59E0B" },
      { id: "reports", name: "Report Pins", color: "#ffffff" },
    ],
  },
  {
    id: "facilities",
    name: "Public Facilities",
    layers: [
      { id: "hospitals", name: "Hospitals", color: "#EF4444" },
      { id: "fireStations", name: "Fire Stations", color: "#DC2626" },
      { id: "evacuationCenters", name: "Evacuation Centers", color: "#3B82F6" },
    ],
  },
  {
    id: "utilities",
    name: "Utilities",
    layers: [
      { id: "waterFacilities", name: "Water Facilities", color: "#06B6D4" },
      { id: "powerFeeders", name: "Power Feeders", color: "#FBBF24" },
    ],
  },
  {
    id: "tourism",
    name: "Tourism & Places",
    layers: [
      { id: "hotels", name: "Hotels & Resorts", color: "#8B5CF6" },
      { id: "restaurants", name: "Restaurants", color: "#EC4899" },
      { id: "attractions", name: "Attractions", color: "#10B981" },
    ],
  },
];

export function LayerControls({ activeLayers, onToggleLayer, isMapFullView }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(["boundaries", "incidents"]);
  const { isDark } = useTheme();

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const visibleLayersCount = Object.values(activeLayers).filter(Boolean).length;

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 14,
        zIndex: 9,
        opacity: isMapFullView ? 1 : 0,
        pointerEvents: isMapFullView ? "auto" : "none",
        transform: isMapFullView ? "scale(1)" : "scale(0.95) translateY(-10px)",
        transition: "all 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isDark
            ? "rgba(18, 18, 20, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.12)"
            : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: 24,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.5)"
            : "0 8px 24px rgba(0,0,0,0.12)",
          color: isDark ? "#ffffff" : "#09090b",
          fontWeight: 600,
          fontSize: 14,
          fontFamily: "Nunito, sans-serif",
        }}
      >
        <Layers size={18} />
        <span>Layers ({visibleLayersCount})</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Layer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: 8,
              background: isDark
                ? "rgba(18, 18, 20, 0.96)"
                : "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.12)"
                : "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: 16,
              padding: 12,
              boxShadow: isDark
                ? "0 16px 40px rgba(0,0,0,0.6)"
                : "0 16px 40px rgba(0,0,0,0.15)",
              width: 280,
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
            }}
          >
            {LAYER_CATEGORIES.map((category) => (
              <div key={category.id} style={{ marginBottom: 12 }}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "8px 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    color: isDark ? "#a1a1aa" : "#71717a",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <span>{category.name}</span>
                  {expandedCategories.includes(category.id) ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>

                {/* Category Layers */}
                <AnimatePresence>
                  {expandedCategories.includes(category.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      {category.layers.map((layer) => (
                        <button
                          key={layer.id}
                          onClick={() => onToggleLayer(layer.id)}
                          style={{
                            width: "100%",
                            background: activeLayers[layer.id]
                              ? isDark
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(0, 0, 0, 0.04)"
                              : "transparent",
                            border: "none",
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            cursor: "pointer",
                            borderRadius: 8,
                            marginBottom: 4,
                            transition: "all 0.2s ease",
                            color: isDark ? "#ffffff" : "#09090b",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.06)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = activeLayers[
                              layer.id
                            ]
                              ? isDark
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(0, 0, 0, 0.04)"
                              : "transparent";
                          }}
                        >
                          {/* Color Indicator */}
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: layer.color,
                              flexShrink: 0,
                              opacity: activeLayers[layer.id] ? 1 : 0.3,
                              transition: "opacity 0.2s ease",
                            }}
                          />

                          {/* Layer Name */}
                          <span
                            style={{
                              flex: 1,
                              fontSize: 14,
                              fontWeight: 500,
                              textAlign: "left",
                              opacity: activeLayers[layer.id] ? 1 : 0.6,
                              transition: "opacity 0.2s ease",
                            }}
                          >
                            {layer.name}
                          </span>

                          {/* Eye Icon */}
                          {activeLayers[layer.id] ? (
                            <Eye size={16} opacity={0.7} />
                          ) : (
                            <EyeOff size={16} opacity={0.4} />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
