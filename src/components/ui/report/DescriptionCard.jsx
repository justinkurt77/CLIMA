import { Pencil, AlertTriangle } from "lucide-react";
import { CardHeader } from "./CardHeader";

export function DescriptionCard({ description, errors, onChange }) {
  return (
    <div
      style={{
        background: "#121214",
        borderRadius: 22,
        padding: "16px 18px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        flexShrink: 0,
      }}
    >
      <CardHeader
        icon={<Pencil size={14} color="#ffffff" />}
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
            ? "1px solid #ffffff"
            : "1px solid rgba(255, 255, 255, 0.12)",
          padding: "12px 14px",
          fontSize: 13,
          color: "#ffffff",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          background: "#18181b",
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
          <div style={{ color: "#ffffff", fontSize: 11, fontWeight: 700 }}>
            <AlertTriangle
              size={12}
              color="#ffffff"
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
            color: "#71717a",
            fontWeight: 600,
          }}
        >
          {description.length} chars
        </div>
      </div>
    </div>
  );
}
