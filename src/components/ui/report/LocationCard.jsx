import { MapPin, Loader, Crosshair, AlertTriangle } from "lucide-react";
import { MAPBOX_TOKEN } from "./reportConstants";

export function LocationCard({
  coords,
  locStatus,
  location,
  errors,
  addressLine1,
  addressLine2,
  barangayOpen,
  barangayMatches,
  onOpenMap,
  onAddressLine1Change,
  onAddressLine2Change,
  onBarangayFocus,
  onBarangayBlur,
  onBarangaySelect,
}) {
  return (
    <div
      style={{
        background: "#121214",
        borderRadius: 22,
        padding: "16px 18px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        marginBottom: 10,
        flexShrink: 0,
      }}
    >
      {/* Section label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPin size={14} color="#ffffff" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
          Choose Location
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "#ffffff",
            fontWeight: 800,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "2px 8px",
            borderRadius: 10,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          Required
        </span>
      </div>

      {/* Map thumbnail */}
      <div
        onClick={onOpenMap}
        style={{
          height: 150,
          background: "#18181b",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 14,
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        {locStatus === "loading" ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Loader
              size={24}
              color="#ffffff"
              style={{ animation: "spin 0.8s linear infinite" }}
            />
            <span style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 600 }}>
              Getting location…
            </span>
          </div>
        ) : (
          <>
            {coords ? (
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+ffffff(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},17,0/600x320?access_token=${MAPBOX_TOKEN}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="Map preview"
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#18181b",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MapPin size={26} color="#ffffff" strokeWidth={1.8} />
                <span
                  style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 600 }}
                >
                  Tap to pin location on map
                </span>
              </div>
            )}

            {/* Inverted Set Pin badge */}
            <div style={{ position: "absolute", bottom: 8, right: 8 }}>
              <div
                style={{
                  background: "rgba(0,0,0,0.85)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  padding: "6px 12px",
                  borderRadius: 30,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                <MapPin size={12} color="#ffffff" />
                {coords ? "Change Pin" : "Set Pin"}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detected address */}
      {(locStatus === "done" || location) && (
        <div
          style={{
            marginBottom: 12,
            padding: "9px 12px",
            background: "#18181b",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Crosshair
            size={14}
            color="#ffffff"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <span
            style={{
              fontSize: 11,
              color: "#a1a1aa",
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {location}
          </span>
        </div>
      )}
      {errors.location && (
        <div
          style={{
            marginBottom: 10,
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <AlertTriangle
            size={12}
            color="#ffffff"
            style={{ marginRight: 4, marginBottom: -2 }}
          />
          {errors.location}
        </div>
      )}

      {/* Street & Barangay inputs */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <input
          type="text"
          placeholder="Street / Landmark (optional)"
          value={addressLine1}
          onChange={(e) => onAddressLine1Change(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: 13,
            outline: "none",
            color: "#ffffff",
            fontFamily: "inherit",
            background: "#18181b",
            boxSizing: "border-box",
          }}
        />

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Barangay *"
            value={addressLine2}
            onChange={(e) => onAddressLine2Change(e.target.value)}
            onFocus={onBarangayFocus}
            onBlur={onBarangayBlur}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius:
                barangayOpen && barangayMatches.length > 0
                  ? "12px 12px 0 0"
                  : 12,
              border: errors.addressLine2
                ? "1px solid #ffffff"
                : "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 13,
              outline: "none",
              color: "#ffffff",
              fontFamily: "inherit",
              background: "#18181b",
              boxSizing: "border-box",
            }}
          />
          {barangayOpen && barangayMatches.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#18181b",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                maxHeight: 160,
                overflowY: "auto",
                zIndex: 200,
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}
            >
              {barangayMatches.map((b) => (
                <div
                  key={b}
                  onMouseDown={() => onBarangaySelect(b)}
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight:
                      addressLine2.toLowerCase() === b.toLowerCase()
                        ? 800
                        : 500,
                    background:
                      addressLine2.toLowerCase() === b.toLowerCase()
                        ? "rgba(255,255,255,0.12)"
                        : "#18181b",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      addressLine2.toLowerCase() === b.toLowerCase()
                        ? "rgba(255,255,255,0.12)"
                        : "#18181b")
                  }
                >
                  {b}
                </div>
              ))}
            </div>
          )}
          {errors.addressLine2 && (
            <div
              style={{
                color: "#ffffff",
                fontSize: 11,
                marginTop: 4,
                fontWeight: 700,
              }}
            >
              <AlertTriangle
                size={12}
                color="#ffffff"
                style={{ marginRight: 4, marginBottom: -2 }}
              />
              {errors.addressLine2}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
