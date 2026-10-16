import { AnimatePresence, motion } from "framer-motion";
import { X, Phone, Navigation } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function CategoryListPanel({
  isOpen,
  onClose,
  category,
  facilities,
  onSelectFacility,
  selectedFacilityId,
}) {
  const { isDark } = useTheme();

  if (!category) return null;

  const categoryConfig = {
    water: { emoji: "💧", label: "Water Places", color: "#3B82F6" },
    recreation: { emoji: "🏖️", label: "Recreation", color: "#16a34a" },
    health: { emoji: "🏥", label: "Health", color: "#dc2626" },
    utility: { emoji: "⚡", label: "Utilities", color: "#f59e0b" },
  };

  const config = categoryConfig[category] || {};

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          style={{
            position: "absolute",
            top: "calc(8px + env(safe-area-inset-top, 0px) + 50px)",
            left: 8,
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px) + 68px)",
            width: 360,
            maxWidth: "calc(100vw - 16px)",
            background: isDark ? "rgba(18, 18, 20, 0.98)" : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 16,
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.12)"
              : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.6)"
              : "0 8px 32px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 15,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: isDark
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(0, 0, 0, 0.06)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{config.emoji}</span>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : "#09090b",
                }}
              >
                {config.label}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: isDark ? "#a1a1aa" : "#71717a",
                  marginTop: 2,
                }}
              >
                {facilities.length} {facilities.length === 1 ? "place" : "places"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={16} color={isDark ? "#ffffff" : "#09090b"} />
            </button>
          </div>

          {/* List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px",
            }}
          >
            {facilities.map((facility) => {
              const isSelected = selectedFacilityId === facility.id;
              return (
                <button
                  key={facility.id}
                  onClick={() => onSelectFacility(facility)}
                  style={{
                    width: "100%",
                    background: isSelected
                      ? isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.04)"
                      : "transparent",
                    border: isDark
                      ? `1px solid ${isSelected ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)"}`
                      : `1px solid ${isSelected ? "rgba(0, 0, 0, 0.12)" : "rgba(0, 0, 0, 0.06)"}`,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isDark
                        ? "rgba(255, 255, 255, 0.04)"
                        : "rgba(0, 0, 0, 0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {/* Name */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isDark ? "#ffffff" : "#09090b",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1, marginTop: -2 }}>
                      {facility.icon}
                    </span>
                    <span style={{ flex: 1, lineHeight: 1.3 }}>
                      {facility.name}
                    </span>
                  </div>

                  {/* Description */}
                  {facility.desc && (
                    <div
                      style={{
                        fontSize: 11,
                        color: isDark ? "#a1a1aa" : "#71717a",
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {facility.desc}
                    </div>
                  )}

                  {/* Contact */}
                  {facility.contact && facility.contact !== "N/A" && (
                    <div
                      style={{
                        fontSize: 11,
                        color: config.color,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      <Phone size={10} />
                      {facility.contact}
                    </div>
                  )}

                  {/* Quick action - Get Directions */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: isDark
                        ? "1px solid rgba(255, 255, 255, 0.06)"
                        : "1px solid rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: config.color,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Navigation size={10} />
                      Directions
                    </a>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
