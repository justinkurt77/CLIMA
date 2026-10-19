import { AnimatePresence, motion } from "framer-motion";
import { X, Phone, Navigation, Droplet, Palmtree, HeartPulse, Zap, Landmark } from "lucide-react";
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
    water: { icon: Droplet, label: "Water Places", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.16)" },
    recreation: { icon: Palmtree, label: "Recreation", color: "#22c55e", bg: "rgba(34, 197, 94, 0.16)" },
    health: { icon: HeartPulse, label: "Health", color: "#ef4444", bg: "rgba(239, 68, 68, 0.16)" },
    utility: { icon: Zap, label: "Utilities", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.16)" },
  };

  const config = categoryConfig[category] || { icon: Droplet, label: "Places", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.16)" };
  const HeaderIcon = config.icon;

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
            top: "calc(126px + env(safe-area-inset-top, 0px))",
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
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: config.bg,
                border: `1.5px solid ${config.color}35`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 2px 10px ${config.color}25`,
              }}
            >
              <HeaderIcon size={20} color={config.color} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : "#09090b",
                  letterSpacing: -0.3,
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
                  fontWeight: 600,
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
              const FacilityItemIcon =
                category === "water" || facility.filterType === "water"
                  ? Droplet
                  : category === "recreation" || facility.filterType === "recreation"
                  ? Palmtree
                  : category === "health" || facility.filterType === "health"
                  ? HeartPulse
                  : category === "utility" || facility.filterType === "utility"
                  ? Zap
                  : Landmark;

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
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        background: config.bg,
                        border: `1px solid ${config.color}35`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <FacilityItemIcon size={14} color={config.color} strokeWidth={2.4} />
                    </div>
                    <span style={{ flex: 1, lineHeight: 1.3, marginTop: 3 }}>
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
