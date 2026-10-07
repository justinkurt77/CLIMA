import { Image as ImageIcon, X } from "lucide-react";
import { CardHeader } from "./CardHeader";

export function PhotoCard({ fileRef, photoPreviews = [], onRemove, onChange }) {
  const safePreviews = Array.isArray(photoPreviews) ? photoPreviews : [];

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: "14px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #E8EBE5",
        flexShrink: 0,
      }}
    >
      <CardHeader
        icon={<ImageIcon size={14} color="#3F6F23" />}
        label="Attach Photo"
        badge="Optional"
      />

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={onChange}
      />

      {safePreviews.length > 0 ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {safePreviews.map((preview, idx) => (
            <div
              key={idx}
              style={{
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                width: "100%",
                height: 120,
              }}
            >
              <img
                src={preview}
                alt="preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)",
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(idx);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.55)",
                  border: "none",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={14} color="white" />
              </button>
            </div>
          ))}

          {safePreviews.length < 4 && (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                height: 120,
                border: "1.5px dashed #C7D6BE",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                background: "linear-gradient(135deg, #F9FDF7 0%, #F2F7EF 100%)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <ImageIcon size={14} color="#3F6F23" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 11, color: "#3F6F23", fontWeight: 700 }}>
                Add more
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: "100%",
            height: 120,
            border: "1.5px dashed #C7D6BE",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            background: "linear-gradient(135deg, #F9FDF7 0%, #F2F7EF 100%)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#F2F7EF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon size={20} color="#3F6F23" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 13, color: "#3F6F23", fontWeight: 700 }}>
            Tap to add photos
          </div>
          <div style={{ fontSize: 11, color: "#8CA17D", fontWeight: 500 }}>
            Up to 4 JPG, PNG or HEIC
          </div>
        </div>
      )}
    </div>
  );
}
