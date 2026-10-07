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
        background: "white",
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #E8EBE5",
        marginBottom: 10,
        flexShrink: 0,
      }}
    >
      {/* Section label */}
      <div
        style={{
          padding: "12px 14px 0",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#F2F7EF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPin size={13} color="#3F6F23" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2E2A27" }}>
          Choose Location
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "#7B936B",
            fontWeight: 600,
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
          background: "#E8EBE5",
          margin: "10px 14px",
          borderRadius: 12,
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
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
              color="#3F6F23"
              style={{ animation: "spin 0.8s linear infinite" }}
            />
            <span style={{ fontSize: 12, color: "#7B936B", fontWeight: 600 }}>
              Getting location…
            </span>
          </div>
        ) : (
          <>
            {coords ? (
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ea4335(${coords.lng},${coords.lat})/${coords.lng},${coords.lat},17,0/600x320?access_token=${MAPBOX_TOKEN}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="Map preview"
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, #f5ece8 0%, #ede4df 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <MapPin size={28} color="#d4b5ac" strokeWidth={1.5} />
                <span
                  style={{ fontSize: 13, color: "#7B936B", fontWeight: 600 }}
                >
                  Tap to pin location
                </span>
              </div>
            )}

            {/* Blue dot */}
            {coords && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(59,130,246,0.2)",
                    border: "1.5px solid rgba(59,130,246,0.4)",
                  }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    border: "2.5px solid white",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            )}

            {/* Change / Set Pin badge */}
            <div style={{ position: "absolute", bottom: 8, right: 8 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(8px)",
                  padding: "6px 12px",
                  borderRadius: 30,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#2E2A27",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                }}
              >
                <MapPin size={12} color="#3F6F23" />
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
            margin: "0 14px 10px",
            padding: "8px 10px",
            background: "#F9FDF7",
            borderRadius: 8,
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <Crosshair
            size={13}
            color="#7B936B"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <span
            style={{
              fontSize: 11,
              color: "#6b6560",
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
            margin: "0 14px 10px",
            color: "#3F6F23",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <AlertTriangle
            size={12}
            color="#3F6F23"
            style={{ marginRight: 4, marginBottom: -2 }}
          />
          {errors.location}
        </div>
      )}

      {/* Street & Barangay inputs */}
      <div
        style={{
          padding: "0 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <input
          type="text"
          placeholder="Street / Landmark (optional)"
          value={addressLine1}
          onChange={(e) => onAddressLine1Change(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1.5px solid #EAEBDE",
            fontSize: 13,
            outline: "none",
            color: "#2E2A27",
            fontFamily: "inherit",
            background: "#F9FDF7",
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
              padding: "10px 12px",
              borderRadius:
                barangayOpen && barangayMatches.length > 0
                  ? "10px 10px 0 0"
                  : 10,
              border: errors.addressLine2
                ? "1.5px solid #e8604c"
                : "1.5px solid #EAEBDE",
              fontSize: 13,
              outline: "none",
              color: "#2E2A27",
              fontFamily: "inherit",
              background: "#F9FDF7",
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
                background: "white",
                border: "1.5px solid #EAEBDE",
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                maxHeight: 160,
                overflowY: "auto",
                zIndex: 200,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              }}
            >
              {barangayMatches.map((b) => (
                <div
                  key={b}
                  onMouseDown={() => onBarangaySelect(b)}
                  style={{
                    padding: "9px 12px",
                    fontSize: 13,
                    color: "#2E2A27",
                    cursor: "pointer",
                    fontWeight:
                      addressLine2.toLowerCase() === b.toLowerCase()
                        ? 700
                        : 500,
                    background:
                      addressLine2.toLowerCase() === b.toLowerCase()
                        ? "#F2F7EF"
                        : "white",
                    borderBottom: "1px solid #f5f0ed",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F9FDF7")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      addressLine2.toLowerCase() === b.toLowerCase()
                        ? "#F2F7EF"
                        : "white")
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
                color: "#3F6F23",
                fontSize: 11,
                marginTop: 4,
                fontWeight: 700,
              }}
            >
              <AlertTriangle
                size={12}
                color="#3F6F23"
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
