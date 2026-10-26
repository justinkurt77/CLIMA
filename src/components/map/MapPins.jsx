import {
  MapPin as MapPinIcon,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  Landmark,
  Droplet,
  Droplets,
  Palmtree,
  HeartPulse,
  Flame,
  Zap,
  Sprout,
  Truck,
  AlertTriangle,
  Building2,
  Activity,
  Layers,
  Phone,
  FileText,
  Navigation,
  Check,
  Folder,
} from "lucide-react";

export const ICON_MAP = {
  // Lucide Component Names
  ShieldAlert,
  ShieldCheck,
  Shield,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  Landmark,
  Droplet,
  Droplets,
  Palmtree,
  HeartPulse,
  Flame,
  Zap,
  Sprout,
  Truck,
  AlertTriangle,
  Building2,
  Activity,
  Layers,
  Phone,
  FileText,
  Navigation,
  Check,
  Folder,
  MapPin: MapPinIcon,

  // Lowercase & Aliases
  flame: Flame,
  fire: Flame,
  shieldcheck: ShieldCheck,
  police: ShieldCheck,
  shield: Shield,
  shieldalert: ShieldAlert,
  evacuation: ShieldAlert,
  droplets: Droplets,
  droplet: Droplet,
  water: Droplets,
  heartpulse: HeartPulse,
  hospital: HeartPulse,
  medical: HeartPulse,
  health: HeartPulse,
  zap: Zap,
  power: Zap,
  utility: Zap,
  utilities: Zap,
  sprout: Sprout,
  agriculture: Sprout,
  farming: Sprout,
  landmark: Landmark,
  government: Landmark,
  wrench: Wrench,
  repair: Wrench,
  trash2: Trash2,
  trash: Trash2,
  garbage: Trash2,
  dog: Dog,
  animal: Dog,
  construction: Construction,
  treepine: TreePine,
  tree: TreePine,
  carfront: CarFront,
  car: CarFront,
  truck: Truck,
  clipboardlist: ClipboardList,
  palmtree: Palmtree,
  recreation: Palmtree,
  alerttriangle: AlertTriangle,
  building2: Building2,
  building: Building2,
  activity: Activity,
  phone: Phone,
  mappin: MapPinIcon,

  // Direct Emojis
  "💧": Droplets,
  "🏖️": Palmtree,
  "🏥": HeartPulse,
  "⚡": Zap,
  "🏛️": Landmark,
  "⚫": Landmark,
  "🔥": Flame,
  "🚨": ShieldAlert,
  "🚓": ShieldCheck,
  "🚒": Flame,
  "🌾": Sprout,
  "🌱": Sprout,
  "🐕": Dog,
  "🚚": Truck,
  "🔧": Wrench,
  "🗑️": Trash2,
};

/**
 * Resolve an icon prop into either an SVG component or an actual Unicode emoji
 */
export function resolveMapIcon(icon) {
  if (!icon) return { Component: AlertCircle, isEmoji: false, emojiText: null };

  // 1. If already a React component / function
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null && icon.$$typeof)) {
    return { Component: icon, isEmoji: false, emojiText: null };
  }

  // 2. If it is a string
  if (typeof icon === "string") {
    const trimmed = icon.trim();
    if (!trimmed) return { Component: AlertCircle, isEmoji: false, emojiText: null };

    // Exact key in ICON_MAP
    if (ICON_MAP[trimmed]) {
      return { Component: ICON_MAP[trimmed], isEmoji: false, emojiText: null };
    }

    // Normalized match (lowercase, letters and numbers only)
    const normalized = trimmed.toLowerCase().replace(/[-_\s]/g, "");
    if (ICON_MAP[normalized]) {
      return { Component: ICON_MAP[normalized], isEmoji: false, emojiText: null };
    }

    // Check if it is a genuine Unicode emoji character (e.g. 💧, 🔥, 🏖️)
    if (/\p{Extended_Pictographic}/u.test(trimmed)) {
      return { Component: null, isEmoji: true, emojiText: trimmed };
    }

    // Unrecognized text string -> Clean fallback icon (never render text into the pin)
    return { Component: AlertCircle, isEmoji: false, emojiText: null };
  }

  return { Component: AlertCircle, isEmoji: false, emojiText: null };
}

export function PinMarker({ color, icon }) {
  const { Component: IssueIcon, isEmoji, emojiText } = resolveMapIcon(icon);
  
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
          // Emojis with white circle background
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
            <span style={{ fontSize: 13, lineHeight: 1 }}>{emojiText}</span>
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
