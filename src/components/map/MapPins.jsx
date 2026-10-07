import {
  MapPin as MapPinIcon,
  AlertCircle,
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  Landmark,
} from "lucide-react";

const ICON_MAP = {
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  Landmark,
};

export function PinMarker({ color, icon }) {
  const IssueIcon = (icon && ICON_MAP[icon]) || AlertCircle;
  return (
    <div
      style={{
        position: "relative",
        width: 38,
        height: 38,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: `drop-shadow(0px 4px 6px rgba(0,0,0,0.3))`,
      }}
    >
      {/* Colored outer pin */}
      <MapPinIcon size={38} fill={color} color={color} />

      {/* White issue icon inside the bulb */}
      <div
        style={{
          position: "absolute",
          top: 9,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IssueIcon size={14} color="white" strokeWidth={2.5} />
      </div>
    </div>
  );
}

export function SearchPin() {
  return (
    <div
      style={{
        position: "relative",
        width: 38,
        height: 38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "drop-shadow(0px 4px 6px rgba(124,58,237,0.4))",
      }}
    >
      <MapPinIcon size={38} fill="#7c3aed" color="#7c3aed" />
      <div
        style={{
          position: "absolute",
          top: 5,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ClipboardList size={14} color="white" strokeWidth={2.5} />
      </div>
    </div>
  );
}
