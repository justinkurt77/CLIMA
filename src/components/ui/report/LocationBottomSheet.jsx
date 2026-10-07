import { MapPin } from "lucide-react";

export function LocationBottomSheet({
  isFetchingAddress,
  localAddress,
  onConfirm,
}) {
  return (
    <div
      style={{
        background: "white",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: "24px 20px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        boxShadow: "0 -10px 30px rgba(0,0,0,0.10)",
        zIndex: 1,
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 800,
          textAlign: "center",
          color: "#1a1108",
          marginBottom: 16,
        }}
      >
        Adjust your location
      </h3>

      {/* Nearest address */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#f5f0eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MapPin size={16} color="#4A4A4A" />
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#4A4A4A",
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {isFetchingAddress ? "Naghahanap ng address..." : localAddress}
        </div>
      </div>

      <button
        onClick={onConfirm}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 30,
          background: "#3F6F23",
          color: "white",
          fontWeight: 800,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s",
          boxShadow: "0 4px 15px rgba(63, 111, 35, 0.3)",
        }}
      >
        Confirm Location
      </button>
    </div>
  );
}
