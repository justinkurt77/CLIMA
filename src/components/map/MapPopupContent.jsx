import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Landmark,
  MapPinned,
  Calendar,
  FileText,
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
  return (
    <div ref={popupContentRef} style={{ width: 260, padding: "4px 0 2px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#e8f4e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {(() => {
            const DynIcon = ICON_MAP[selectedReport.icon];
            return DynIcon ? (
              <DynIcon size={18} color="#2d8119" />
            ) : (
              <ClipboardList size={18} color="#2d8119" />
            );
          })()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 13,
              color: "#1a1108",
              lineHeight: 1.2,
              marginBottom: 3,
            }}
          >
            {selectedReport.title}
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              background: STATUS_BG[selectedReport.status],
              color: STATUS_COLORS[selectedReport.status],
            }}
          >
            {selectedReport.statusLabel}
          </span>
        </div>
        {/* Custom close button */}
        <button
          onClick={closePopup}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#f0f0f0",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            alignSelf: "flex-start",
            marginTop: -10,
          }}
        >
          <X size={13} color="#555" />
        </button>
      </div>

      {/* Details */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          marginBottom: 10,
          background: "#f8f8f6",
          borderRadius: 10,
          padding: "8px 10px",
        }}
      >
        {/* Landmark / Road row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
          <Landmark
            size={11}
            color="#f59e0b"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <span style={{ fontSize: 10, color: "#555", lineHeight: 1.4 }}>
            {popupGeo ? popupGeo.road || "—" : "Loading…"}
          </span>
        </div>
        {/* Barangay row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
          <MapPinned
            size={11}
            color="#2d8119"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <span style={{ fontSize: 10, color: "#555", lineHeight: 1.4 }}>
            {popupGeo ? popupGeo.barangay || "—" : "Loading…"}
          </span>
        </div>
        {selectedReport.createdAt && (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calendar size={11} color="#888" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#888" }}>
              {new Date(selectedReport.createdAt).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        )}
        {/* Description expandable row */}
        {selectedReport.description && (
          <div>
            <button
              onClick={() => setDescExpanded((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                width: "100%",
              }}
            >
              <FileText size={11} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(74, 94, 54, 0.95)",
                  fontWeight: 700,
                  flex: 1,
                  textAlign: "left",
                }}
              >
                What Happened?
              </span>
              <ChevronDown
                size={11}
                color="#aaa"
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
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#444",
                      lineHeight: 1.6,
                      paddingTop: 5,
                      paddingLeft: 16,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {selectedReport.description}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
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
            background: "rgba(74, 94, 54, 0.95)",
            color: "white",
            borderRadius: 32,
            padding: "10px 12px",
            textDecoration: "none",
            fontSize: 11,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <Navigation size={14} />
          Directions
        </a>

        {/* View Photos */}
        <button
          onClick={() => setPhotoModalOpen(true)}
          disabled={
            !selectedReport.photoPreviews && !selectedReport.photoPreview
          }
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background:
              selectedReport.photoPreviews || selectedReport.photoPreview
                ? "rgba(59, 130, 246, 0.9)"
                : "#e5e7eb",
            color:
              selectedReport.photoPreviews || selectedReport.photoPreview
                ? "white"
                : "#999",
            border: "none",
            borderRadius: 32,
            padding: "10px 12px",
            fontSize: 11,
            fontWeight: 700,
            cursor:
              selectedReport.photoPreviews || selectedReport.photoPreview
                ? "pointer"
                : "default",
            boxShadow:
              selectedReport.photoPreviews || selectedReport.photoPreview
                ? "0 4px 12px rgba(0,0,0,0.2)"
                : "none",
          }}
        >
          <Image size={14} />
          Photos
        </button>
      </div>
    </div>
  );
}
