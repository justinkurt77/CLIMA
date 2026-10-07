export function DescriptionModal({
  descModalOpen,
  setDescModalOpen,
  selectedReport,
}) {
  if (!descModalOpen || !selectedReport) return null;

  return (
    <div
      onClick={() => setDescModalOpen(false)}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        padding: 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          padding: "24px 20px 40px",
          maxHeight: "65vh",
          overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: "#e0e0e0",
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 22 }}>{selectedReport.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1108" }}>
              {selectedReport.title}
            </div>
            <div style={{ fontSize: 10, color: "#888" }}>
              {selectedReport.createdAt &&
                new Date(selectedReport.createdAt).toLocaleString("en-PH", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: "#f0f0f0", margin: "12px 0" }} />

        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#2d8119",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Location
          </div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
            {selectedReport.location || "—"}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#f59e0b",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Description
          </div>
          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>
            {selectedReport.description || "No description provided."}
          </div>
        </div>

        <button
          onClick={() => setDescModalOpen(false)}
          style={{
            marginTop: 24,
            width: "100%",
            padding: "12px",
            background: "#2d8119",
            color: "white",
            border: "none",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Isara
        </button>
      </div>
    </div>
  );
}
