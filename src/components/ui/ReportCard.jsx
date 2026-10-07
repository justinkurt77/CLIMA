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

const ICON_MAP = {
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
};

export const STATUS_META = {
  pending: {
    color: "#a1a1aa",
    bg: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    label: "Pending",
    Icon: AlertTriangle,
  },
  inprogress: {
    color: "#ffffff",
    bg: "rgba(255, 255, 255, 0.12)",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    label: "In Progress",
    Icon: Clock,
  },
  resolved: {
    color: "#000000",
    bg: "#ffffff",
    border: "none",
    label: "Resolved",
    Icon: CheckCircle2,
  },
};

export default function ReportCard({ report }) {
  const meta = STATUS_META[report.status] || STATUS_META.pending;
  const { Icon } = meta;
  return (
    <div
      style={{
        background: "#141416",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 22,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
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
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: "#ffffff",
          }}
        >
          {ICON_MAP[report.icon]
            ? (() => {
                const DynamicIcon = ICON_MAP[report.icon];
                return <DynamicIcon size={20} color="#ffffff" />;
              })()
            : report.icon || "📝"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 13,
            color: "#ffffff",
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
            color: "#a1a1aa",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <MapPin size={11} color="#71717a" style={{ flexShrink: 0 }} />
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
