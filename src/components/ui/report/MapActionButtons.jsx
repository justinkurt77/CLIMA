import { ChevronLeft, Crosshair } from "lucide-react";

export function BackButton({ onClick }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(20px + env(safe-area-inset-top, 0px))",
        left: 16,
      }}
    >
      <button
        onClick={onClick}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "white",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
          cursor: "pointer",
        }}
      >
        <ChevronLeft size={24} color="#000" />
      </button>
    </div>
  );
}

export function RecenterButton({ onClick }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(20px + env(safe-area-inset-top, 0px))",
        right: 16,
      }}
    >
      <button
        onClick={onClick}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "white",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
          cursor: "pointer",
        }}
      >
        <Crosshair size={24} color="#1a1108" />
      </button>
    </div>
  );
}
