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
  Droplet,
  Palmtree,
  HeartPulse,
  Zap,
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
  Droplet,
  Palmtree,
  HeartPulse,
  Zap,
  water: Droplet,
  recreation: Palmtree,
  health: HeartPulse,
  utility: Zap,
  government: Landmark,
  "💧": Droplet,
  "🏖️": Palmtree,
  "🏥": HeartPulse,
  "⚡": Zap,
  "🏛️": Landmark,
  "⚫": Landmark,
};

export function PinMarker({ color, icon }) {
  // Check if icon is an emoji (not in ICON_MAP) or a component name
  const isEmoji = icon && typeof icon === 'string' && !ICON_MAP[icon];
  const IssueIcon = (icon && ICON_MAP[icon]) || (!isEmoji ? AlertCircle : null);
  
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

      {/* Icon inside the bulb - either emoji or lucide icon */}
      <div
        style={{
          position: "absolute",
          top: isEmoji ? 6 : 9,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isEmoji ? (
          // All emojis with white circle background
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
          </div>
        ) : (
          <IssueIcon size={14} color="white" strokeWidth={2.5} />
        )}
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
