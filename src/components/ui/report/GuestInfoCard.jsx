import { User, AlertTriangle } from "lucide-react";
import { CardHeader } from "./CardHeader";

export function GuestInfoCard({
  guestName,
  guestContact,
  onNameChange,
  onContactChange,
  errors,
}) {
  const inputStyle = (error) => ({
    width: "100%",
    borderRadius: 14,
    border: error ? "1px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.12)",
    padding: "12px 14px",
    fontSize: 13,
    color: "#ffffff",
    outline: "none",
    fontFamily: "inherit",
    background: "#18181b",
    boxSizing: "border-box",
    marginBottom: error ? 4 : 12,
  });

  const errorRender = (error) => (
    <div
      style={{
        color: "#ffffff",
        fontSize: 11,
        fontWeight: 700,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
      }}
    >
      <AlertTriangle size={12} color="#ffffff" style={{ marginRight: 4 }} />
      {error}
    </div>
  );

  return (
    <div
      style={{
        background: "#121214",
        borderRadius: 22,
        padding: "16px 18px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        flexShrink: 0,
      }}
    >
      <CardHeader
        icon={<User size={14} color="#ffffff" />}
        label="Your Information"
        badge="Required"
      />

      <div style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="Full Name (e.g., Juan Dela Cruz)"
          value={guestName}
          onChange={(e) => onNameChange(e.target.value)}
          style={inputStyle(errors.guestName)}
        />
        {errors.guestName && errorRender(errors.guestName)}

        <input
          type="tel"
          placeholder="Contact Number (e.g., 09123456789)"
          value={guestContact}
          onChange={(e) => onContactChange(e.target.value)}
          style={{
            ...inputStyle(errors.guestContact),
            marginBottom: errors.guestContact ? 4 : 0,
          }}
        />
        {errors.guestContact && (
          <div style={{ marginBottom: 0 }}>
            {errorRender(errors.guestContact)}
          </div>
        )}
      </div>
    </div>
  );
}
