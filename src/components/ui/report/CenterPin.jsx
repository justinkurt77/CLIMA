import { MapPin } from "lucide-react";

export function CenterPin() {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -100%)",
        pointerEvents: "none",
        filter: "drop-shadow(0px 6px 8px rgba(0,0,0,0.35))",
      }}
    >
      <MapPin size={48} color="#3F6F23" fill="#FFFFFF" strokeWidth={1.5} />
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#3498DB",
          border: "2px solid white",
          position: "absolute",
          bottom: -6,
          left: 18,
        }}
      />
    </div>
  );
}
