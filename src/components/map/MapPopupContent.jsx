import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DOMPurify from "dompurify";
import {
  X,
  MapPin,
  Building2,
  Calendar,
  Info,
  ChevronDown,
  Navigation,
  Image,
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  Phone,
  Droplet,
  Palmtree,
  HeartPulse,
  Zap,
  Landmark,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { ICON_MAP, resolveMapIcon } from "./MapPins";

export function MapPopupContent({
  selectedReport,
  popupGeo,
  closePopup,
  STATUS_BG,
  STATUS_COLORS,
  descExpanded,
  setDescExpanded,
  setPhotoModalOpen,
  popupContentRef,
}) {
  const { isDark } = useTheme();

  const categoryColor = useMemo(() => {
    const fType = selectedReport.filterType || selectedReport.status;
    const isWater =
      fType === "water" ||
      selectedReport.icon === "Droplet" ||
      selectedReport.icon === "💧" ||
      selectedReport.title?.toLowerCase().includes("water district") ||
      selectedReport.title?.toLowerCase().includes("waterworks");
    if (isWater) {
      return {
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.16)",
        border: "rgba(56, 189, 248, 0.35)",
        gradient: "linear-gradient(135deg, #0284c7, #38bdf8)",
      };
    }
    if (fType === "recreation" || selectedReport.icon === "Palmtree" || selectedReport.icon === "🏖️") {
      return {
        color: "#22c55e",
        bg: "rgba(34, 197, 94, 0.16)",
        border: "rgba(34, 197, 94, 0.35)",
        gradient: "linear-gradient(135deg, #16a34a, #22c55e)",
      };
    }
    if (fType === "health" || selectedReport.icon === "HeartPulse" || selectedReport.icon === "🏥") {
      return {
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.16)",
        border: "rgba(239, 68, 68, 0.35)",
        gradient: "linear-gradient(135deg, #dc2626, #ef4444)",
      };
    }
    if (fType === "utility" || selectedReport.icon === "Zap" || selectedReport.icon === "⚡") {
      return {
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.16)",
        border: "rgba(245, 158, 11, 0.35)",
        gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
      };
    }
    if (
      fType === "government" ||
      selectedReport.icon === "Landmark" ||
      selectedReport.icon === "🏛️" ||
      selectedReport.icon === "⚫"
    ) {
      return {
        color: isDark ? "#d4d4d8" : "#71717a",
        bg: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
        border: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.12)",
        gradient: isDark
          ? "linear-gradient(135deg, #3f3f46, #52525b)"
          : "linear-gradient(135deg, #71717a, #a1a1aa)",
      };
    }
    const color = (STATUS_COLORS && STATUS_COLORS[selectedReport.status]) || "#38bdf8";
    const bg = (STATUS_BG && STATUS_BG[selectedReport.status]) || "rgba(56, 189, 248, 0.16)";
    return {
      color,
      bg,
      border: `${color}40`,
      gradient: `linear-gradient(135deg, ${color}, ${color}dd)`,
    };
  }, [selectedReport, STATUS_COLORS, STATUS_BG, isDark]);

  const HeaderIcon = useMemo(() => {
    if (
      selectedReport.icon === "Droplet" ||
      selectedReport.title?.toLowerCase().includes("water district") ||
      selectedReport.title?.toLowerCase().includes("waterworks")
    ) {
      return Droplet;
    }
    const resolved = resolveMapIcon(
      selectedReport.icon || selectedReport.filterType || selectedReport.status
    );
    return resolved.Component || ClipboardList;
  }, [selectedReport]);

  const hasPhotos = !!(selectedReport.photoPreviews || selectedReport.photoPreview);

  return (
    <div
      ref={popupContentRef}
      style={{
        width: "100%",
        minWidth: 260,
        maxWidth: 292,
        boxSizing: "border-box",
        padding: "2px 0 0",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: categoryColor.bg,
            border: `1.5px solid ${categoryColor.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 2px 10px ${categoryColor.color}25`,
          }}
        >
          <HeaderIcon size={20} color={categoryColor.color} strokeWidth={2.4} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 13.5,
              color: isDark ? "#ffffff" : "#09090b",
              lineHeight: 1.25,
              marginBottom: 4,
              letterSpacing: -0.2,
            }}
          >
            {selectedReport.title}
          </div>
          <span
            style={{
              display: "inline-block",
              fontSize: 9.5,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              background: categoryColor.bg,
              color: categoryColor.color,
              border: `1px solid ${categoryColor.color}35`,
              letterSpacing: 0.2,
            }}
          >
            {selectedReport.statusLabel || selectedReport.filterType || "Facility"}
          </span>
        </div>

        {/* Custom close button */}
        <button
          onClick={closePopup}
          aria-label="Close popup"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: -2,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255, 255, 255, 0.18)"
              : "rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)";
          }}
        >
          <X size={13} color={isDark ? "#a1a1aa" : "#71717a"} strokeWidth={2.4} />
        </button>
      </div>

      {/* Details Box */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          marginBottom: 12,
          background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.025)",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
          borderRadius: 12,
          padding: "9px 11px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Road / Location row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
          <MapPin
            size={13}
            color={isDark ? "#a1a1aa" : "#71717a"}
            style={{ flexShrink: 0, marginTop: 1.5 }}
            strokeWidth={2}
          />
          <span style={{ fontSize: 11, color: isDark ? "#e4e4e7" : "#3f3f46", lineHeight: 1.4, fontWeight: 500 }}>
            {popupGeo ? popupGeo.road || "N/A" : "Loading location…"}
          </span>
        </div>

        {/* Barangay row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
          <Building2
            size={13}
            color={isDark ? "#a1a1aa" : "#71717a"}
            style={{ flexShrink: 0, marginTop: 1.5 }}
            strokeWidth={2}
          />
          <span style={{ fontSize: 11, color: isDark ? "#e4e4e7" : "#3f3f46", lineHeight: 1.4, fontWeight: 500 }}>
            {popupGeo ? popupGeo.barangay || "N/A" : "Loading barangay…"}
          </span>
        </div>

        {/* Facility description */}
        {selectedReport.isFacility && selectedReport.facilityDesc && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <Info
              size={13}
              color={isDark ? "#a1a1aa" : "#71717a"}
              style={{ flexShrink: 0, marginTop: 1.5 }}
              strokeWidth={2}
            />
            <span style={{ fontSize: 11, color: isDark ? "#e4e4e7" : "#3f3f46", lineHeight: 1.4, fontWeight: 500 }}>
              {selectedReport.facilityDesc}
            </span>
          </div>
        )}

        {/* Facility contact */}
        {selectedReport.isFacility && selectedReport.facilityContact && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <Phone
              size={13}
              color={categoryColor.color}
              style={{ flexShrink: 0, marginTop: 1.5 }}
              strokeWidth={2.2}
            />
            <span style={{ fontSize: 11, color: categoryColor.color, lineHeight: 1.4, fontWeight: 700 }}>
              {selectedReport.facilityContact}
            </span>
          </div>
        )}

        {/* Created At for citizen reports */}
        {selectedReport.createdAt && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Calendar size={13} color={isDark ? "#71717a" : "#a1a1aa"} style={{ flexShrink: 0 }} strokeWidth={2} />
            <span style={{ fontSize: 10.5, color: isDark ? "#a1a1aa" : "#71717a", fontWeight: 500 }}>
              {new Date(selectedReport.createdAt).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        )}

        {/* Description expandable row - only for reports */}
        {!selectedReport.isFacility && selectedReport.description && (
          <div
            style={{
              marginTop: 2,
              paddingTop: 6,
              borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <button
              onClick={() => setDescExpanded((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                width: "100%",
              }}
            >
              <Info size={13} color={categoryColor.color} style={{ flexShrink: 0 }} strokeWidth={2} />
              <span
                style={{
                  fontSize: 11,
                  color: categoryColor.color,
                  fontWeight: 700,
                  flex: 1,
                  textAlign: "left",
                }}
              >
                What Happened?
              </span>
              <ChevronDown
                size={13}
                color={isDark ? "#a1a1aa" : "#71717a"}
                style={{
                  transform: descExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            <AnimatePresence>
              {descExpanded && (
                <motion.div
                  key="desc"
                  initial={{ height: 0, opacity: 0, y: -4 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: isDark ? "#d4d4d8" : "#4b5563",
                      lineHeight: 1.55,
                      paddingTop: 6,
                      paddingLeft: 20,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {DOMPurify.sanitize(selectedReport.description)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8, width: "100%", boxSizing: "border-box" }}>
        {/* Get Directions */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedReport.lat},${selectedReport.lng}`}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: categoryColor.gradient || categoryColor.color,
            color: "#ffffff",
            borderRadius: 12,
            padding: "9px 12px",
            textDecoration: "none",
            fontSize: 11.5,
            fontWeight: 700,
            boxShadow: `0 3px 12px ${categoryColor.color}40`,
            transition: "all 0.2s ease",
            boxSizing: "border-box",
            minWidth: 0,
            whiteSpace: "nowrap",
          }}
        >
          <Navigation size={13} strokeWidth={2.4} />
          Directions
        </a>

        {/* View Photos */}
        <button
          onClick={() => setPhotoModalOpen(true)}
          disabled={!hasPhotos}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: hasPhotos
              ? isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.06)"
              : isDark
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.03)",
            color: hasPhotos
              ? isDark
                ? "#ffffff"
                : "#09090b"
              : isDark
                ? "#52525b"
                : "#a1a1aa",
            border: isDark
              ? `1px solid ${hasPhotos ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.06)"}`
              : `1px solid ${hasPhotos ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.05)"}`,
            borderRadius: 12,
            padding: "9px 12px",
            fontSize: 11.5,
            fontWeight: 700,
            cursor: hasPhotos ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            boxSizing: "border-box",
            minWidth: 0,
            whiteSpace: "nowrap",
          }}
        >
          <Image size={13} strokeWidth={2.2} />
          Photos
        </button>
      </div>
    </div>
  );
}
