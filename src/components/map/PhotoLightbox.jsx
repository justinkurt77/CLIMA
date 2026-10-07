import { X, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PhotoLightbox({
  photoModalOpen,
  setPhotoModalOpen,
  selectedReport,
}) {
  const [enlargedIdx, setEnlargedIdx] = useState(null);

  if (!photoModalOpen || !selectedReport) {
    if (enlargedIdx !== null) setEnlargedIdx(null);
    return null;
  }

  const rawPhotos = selectedReport.photoPreviews || selectedReport.photoPreview;
  const photoArray = Array.isArray(rawPhotos)
    ? rawPhotos
    : rawPhotos
      ? [rawPhotos]
      : [];

  const handleClose = () => {
    if (enlargedIdx !== null) {
      setEnlargedIdx(null);
    } else {
      setPhotoModalOpen(false);
    }
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {photoArray.length > 0 ? (
        <AnimatePresence mode="wait">
          {enlargedIdx !== null ? (
            <motion.img
              key="enlarged"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={photoArray[enlargedIdx]}
              alt="Enlarged Report Photo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                maxHeight: "85vh",
              }}
            />
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 400 }}
            >
              <div
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {selectedReport.title}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  width: "100%",
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => {
                  const src = photoArray[i];
                  if (src) {
                    return (
                      <div
                        key={i}
                        onClick={() => setEnlargedIdx(i)}
                        style={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "100%",
                          borderRadius: 16,
                          overflow: "hidden",
                          cursor: "zoom-in",
                          background: "rgba(255,255,255,0.1)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                      >
                        <img
                          src={src}
                          alt={`Photo ${i + 1}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s",
                          }}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={i}
                        style={{
                          width: "100%",
                          paddingTop: "100%",
                          position: "relative",
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.03)",
                          border: "1.5px dashed rgba(255,255,255,0.15)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ImageIcon size={28} color="rgba(255,255,255,0.15)" />
                          <span
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.25)",
                              marginTop: 8,
                              fontWeight: 700,
                            }}
                          >
                            Empty Slot
                          </span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
          No attached photo
        </div>
      )}
    </div>
  );
}
