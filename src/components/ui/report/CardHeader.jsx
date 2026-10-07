export function CardHeader({ icon, label, badge }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#F2F7EF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#2E2A27" }}>
        {label}
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 11,
          color: "#7B936B",
          fontWeight: 600,
        }}
      >
        {badge}
      </span>
    </div>
  );
}
