import { Pencil, AlertTriangle } from "lucide-react";
import { CardHeader } from "./CardHeader";

export function DescriptionCard({ description, errors, onChange }) {
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
        icon={<Pencil size={14} color="#3F6F23" />}
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
          borderRadius: 12,
          border: errors.description
            ? "1.5px solid #e8604c"
            : "1.5px solid #EAEBDE",
          padding: "12px 14px",
          fontSize: 13,
          color: "#2E2A27",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          background: "#F9FDF7",
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
          <div style={{ color: "#e8604c", fontSize: 11, fontWeight: 700 }}>
            <AlertTriangle
              size={12}
              color="#e8604c"
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
            color: description.length > 20 ? "#7B936B" : "#A2B099",
            fontWeight: 600,
          }}
        >
          {description.length} chars
        </div>
      </div>
    </div>
  );
}
