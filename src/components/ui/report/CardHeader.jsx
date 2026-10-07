export function CardHeader({ icon, label, badge }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
        {label}
      </span>
      {badge && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "#ffffff",
            fontWeight: 800,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "2px 8px",
            borderRadius: 10,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
