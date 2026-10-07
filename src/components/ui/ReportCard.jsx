import {
  MapPin,
  Clock,
  CheckCircle,
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
    color: "#e67e22",
    bg: "#fff3e0",
    label: "Pending",
    Icon: Clock,
  },
  inprogress: {
    color: "#3498db",
    bg: "#ebf5fb",
    label: "In Progress",
    Icon: AlertTriangle,
  },
  resolved: {
    color: "#2ecc71",
    bg: "#e8f8f0",
    label: "Resolved",
    Icon: CheckCircle,
  },
};

export default function ReportCard({ report }) {
  const meta = STATUS_META[report.status] || STATUS_META.pending;
  const { Icon } = meta;
  return (
    <div
      style={{
        background: "white",
        borderRadius: 24,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      }}
    >
      {report.photoPreview ? (
        <img
          src={report.photoPreview}
          alt="report"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            flexShrink: 0,
            background: "#e8f4e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          {ICON_MAP[report.icon]
            ? (() => {
                const DynamicIcon = ICON_MAP[report.icon];
                return <DynamicIcon size={20} color="#2d8119" />;
              })()
            : report.icon || "📝"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            color: "#1a1108",
            marginBottom: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {report.title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#888",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <MapPin size={10} color="#888" />
          {report.location}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: meta.bg,
            borderRadius: 20,
            padding: "2px 6px",
          }}
        >
          <Icon size={10} color={meta.color} />
          <span style={{ fontSize: 9, fontWeight: 700, color: meta.color }}>
            {meta.label}
          </span>
        </div>
      </div>
      <div
        style={{ fontSize: 9, color: "#aaa", flexShrink: 0, fontWeight: 600 }}
      >
        {report.time}
      </div>
    </div>
  );
}
