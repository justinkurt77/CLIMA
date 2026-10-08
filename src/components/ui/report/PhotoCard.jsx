import { Image as ImageIcon, X } from "lucide-react";
import { CardHeader } from "./CardHeader";

export function PhotoCard({ fileRef, photoPreviews = [], onRemove, onChange }) {
  const safePreviews = Array.isArray(photoPreviews) ? photoPreviews : [];

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 22,
        padding: "16px 18px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        border: "1px solid var(--border-subtle)",
        flexShrink: 0,
      }}
    >
      <CardHeader
        icon={<ImageIcon size={14} color="var(--text-primary)" />}
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
                border: "1px solid var(--border-subtle)",
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
                    "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)",
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
                  background: "rgba(0,0,0,0.75)",
                  border: "1px solid rgba(255,255,255,0.2)",
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
                border: "1.5px dashed var(--border-subtle)",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                background: "var(--bg-app)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ImageIcon size={14} color="var(--text-primary)" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 700 }}>
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
            border: "1.5px dashed var(--border-subtle)",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
            background: "var(--bg-app)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon size={20} color="var(--text-primary)" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 700 }}>
            Tap to add photos
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            Up to 4 JPG, PNG or HEIC
          </div>
        </div>
      )}
    </div>
  );
}
