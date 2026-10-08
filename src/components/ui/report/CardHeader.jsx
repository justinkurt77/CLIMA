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
          background: "var(--border-subtle)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary)",
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
        {label}
      </span>
      {badge && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "var(--text-secondary)",
            fontWeight: 800,
            background: "var(--border-subtle)",
            border: "1px solid var(--border-subtle)",
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
