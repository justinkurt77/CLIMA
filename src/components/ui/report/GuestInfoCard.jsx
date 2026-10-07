import { User, AlignLeft, AlertTriangle } from "lucide-react";
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
    borderRadius: 12,
    border: error ? "1.5px solid #e8604c" : "1.5px solid #EAEBDE",
    padding: "12px 14px",
    fontSize: 13,
    color: "#2E2A27",
    outline: "none",
    fontFamily: "inherit",
    background: "#F9FDF7",
    boxSizing: "border-box",
    marginBottom: error ? 4 : 12,
  });

  const errorRender = (error) => (
    <div
      style={{
        color: "#e8604c",
        fontSize: 11,
        fontWeight: 700,
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
      }}
    >
      <AlertTriangle size={12} color="#e8604c" style={{ marginRight: 4 }} />
      {error}
    </div>
  );

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: "14px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #E8EBE5",
        flexShrink: 0,
      }}
    >
      <CardHeader
        icon={<User size={14} color="#3F6F23" />}
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
