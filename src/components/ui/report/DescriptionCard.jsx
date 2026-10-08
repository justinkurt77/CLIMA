import { Pencil, AlertTriangle } from "lucide-react";
import { CardHeader } from "./CardHeader";

export function DescriptionCard({ description, errors, onChange }) {
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
        icon={<Pencil size={14} color="var(--text-primary)" />}
        label="What Happened?"
        badge="Required"
      />
      <textarea
        placeholder="Describe the incident clearly — include key details like time, what you observed, and how it affects the community."
        value={description}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 130,
          borderRadius: 14,
          border: errors.description
            ? "1px solid #ef4444"
            : "1px solid var(--border-subtle)",
          padding: "12px 14px",
          fontSize: 13,
          color: "var(--text-primary)",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          background: "var(--bg-app)",
          boxSizing: "border-box",
          lineHeight: 1.6,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          alignItems: "center",
        }}
      >
        {errors.description ? (
          <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 700 }}>
            <AlertTriangle
              size={12}
              color="#ef4444"
              style={{ marginRight: 4, marginBottom: -2 }}
            />
            {errors.description}
          </div>
        ) : (
          <div />
        )}
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          {description.length} chars
        </div>
      </div>
    </div>
  );
}
