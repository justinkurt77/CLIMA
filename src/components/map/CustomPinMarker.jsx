import { useState } from "react";
import {
  Droplets,
  HeartPulse,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sprout,
  Landmark,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { PIN_CATEGORIES, PIN_STATUSES } from "../../lib/pinnedLocationsStorage";

const ICONS = {
  Droplets,
  HeartPulse,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sprout,
  Landmark,
  AlertTriangle,
  MapPin,
};

export default function CustomPinMarker({
  pin,
  isSelected = false,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const cat = PIN_CATEGORIES[pin.category] || PIN_CATEGORIES.water;
  const statusDef = PIN_STATUSES[pin.status] || PIN_STATUSES.operational;
  const IconComponent = ICONS[cat.icon] || MapPin;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(pin);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: isSelected || isHovered ? "scale(1.15) translateY(-4px)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: isSelected ? 40 : isHovered ? 35 : 20,
      }}
    >
      {/* Active Pulse Ring */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: 2,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: cat.color,
            opacity: 0.4,
            animation: "climaPinPulse 1.8s infinite ease-out",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Main Teardrop Marker */}
      <div
        style={{
          position: "relative",
          width: 38,
          height: 38,
          borderRadius: "50% 50% 50% 0",
          transform: "rotate(-45deg)",
          background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`,
          border: "2px solid #ffffff",
          boxShadow: `0 4px 16px ${cat.color}66, 0 2px 6px rgba(0,0,0,0.35)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Icon (counter-rotated so it stands upright) */}
        <div
          style={{
            transform: "rotate(45deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
          }}
        >
          <IconComponent size={17} strokeWidth={2.4} />
        </div>

        {/* Small Status Indicator Dot on top-right of pin */}
        <div
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: statusDef.color,
            border: "1.5px solid #ffffff",
            boxShadow: `0 0 6px ${statusDef.color}`,
          }}
        />
      </div>

      {/* Floating Pill Label on Hover or when Selected */}
      {(isHovered || isSelected) && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            marginBottom: 6,
            background: "rgba(10, 10, 14, 0.94)",
            border: `1px solid ${cat.color}66`,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 8,
            padding: "4px 8px",
            color: "#ffffff",
            boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "-0.01em" }}>
            {pin.name}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: cat.badgeColor }}>
            {cat.label} · {pin.subType || "Facility"}
          </span>
        </div>
      )}
    </div>
  );
}
