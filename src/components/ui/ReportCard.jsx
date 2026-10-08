import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";

const ICON_MAP = {
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
};

export function getStatusMeta(status, isDark) {
  switch (status) {
    case "resolved":
      return {
        color: isDark ? "#000000" : "#ffffff",
        bg: isDark ? "#ffffff" : "#09090b",
        border: "none",
        label: "Resolved",
        Icon: CheckCircle2,
      };
    case "inprogress":
      return {
        color: isDark ? "#ffffff" : "#09090b",
        bg: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.08)",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.22)" : "1px solid rgba(0, 0, 0, 0.12)",
        label: "In Progress",
        Icon: Clock,
      };
    default:
      return {
        color: isDark ? "#a1a1aa" : "#71717a",
        bg: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
        label: "Pending",
        Icon: AlertTriangle,
      };
  }
}

export default function ReportCard({ report }) {
  const { isDark } = useTheme();
  const meta = getStatusMeta(report.status, isDark);
  const { Icon } = meta;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 22,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "var(--shadow-card)",
        transition: "all 0.2s ease",
      }}
    >
      {report.photoPreview ? (
        <img
          src={report.photoPreview}
          alt="report"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            objectFit: "cover",
            flexShrink: 0,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            flexShrink: 0,
            background: "var(--bg-card-subtle)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: "var(--text-primary)",
          }}
        >
          {ICON_MAP[report.icon]
            ? (() => {
                const DynamicIcon = ICON_MAP[report.icon];
                return <DynamicIcon size={20} color={isDark ? "#ffffff" : "#09090b"} />;
              })()
            : report.icon || "📝"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
          }}
        >
          {report.title || report.category || "Reported Issue"}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <MapPin size={11} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span>{report.location || "Palayan City"}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: meta.bg,
          border: meta.border,
          color: meta.color,
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          padding: "5px 10px",
          borderRadius: 12,
          flexShrink: 0,
          letterSpacing: 0.3,
        }}
      >
        <Icon size={12} strokeWidth={2.5} />
        <span>{meta.label}</span>
      </div>
    </div>
  );
}
