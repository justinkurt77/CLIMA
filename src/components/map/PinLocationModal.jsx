import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Droplets,
  HeartPulse,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sprout,
  Landmark,
  AlertTriangle,
  Check,
  Trash2,
  Navigation,
  Phone,
  FileText,
  Building2,
  Activity,
  Layers,
} from "lucide-react";
import {
  PIN_CATEGORIES,
  PALAYAN_BARANGAYS,
  PIN_STATUSES,
} from "../../lib/pinnedLocationsStorage";

const ICON_COMPONENTS = {
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

export default function PinLocationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onPickOnMap,
  initialCoordinates = null,
  draftData = null,
  editingPin = null,
  isDark = true,
  currentUser = null,
}) {
  const isEditing = !!editingPin;

  // Form states
  const [category, setCategory] = useState("water");
  const [name, setName] = useState("");
  const [subType, setSubType] = useState("");
  const [barangay, setBarangay] = useState("Palayan");
  const [status, setStatus] = useState("operational");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state when editing, resuming draft, or opening with new coords
  useEffect(() => {
    if (!isOpen) return;

    if (draftData) {
      setCategory(draftData.category || "water");
      setName(draftData.name || "");
      setSubType(draftData.subType || "");
      setBarangay(draftData.barangay || "Palayan");
      setStatus(draftData.status || "operational");
      setContact(draftData.contact || "");
      setDescription(draftData.description || "");
      if (initialCoordinates) {
        setLng(String(Number(initialCoordinates[0]).toFixed(6)));
        setLat(String(Number(initialCoordinates[1]).toFixed(6)));
      } else {
        setLng(draftData.lng !== undefined && draftData.lng !== "" ? String(draftData.lng) : "121.082700");
        setLat(draftData.lat !== undefined && draftData.lat !== "" ? String(draftData.lat) : "15.539800");
      }
    } else if (editingPin) {
      setCategory(editingPin.category || "water");
      setName(editingPin.name || "");
      setSubType(editingPin.subType || "");
      setBarangay(editingPin.barangay || "Palayan");
      setStatus(editingPin.status || "operational");
      setContact(editingPin.contact || "");
      setDescription(editingPin.description || "");
      if (initialCoordinates) {
        setLng(String(Number(initialCoordinates[0]).toFixed(6)));
        setLat(String(Number(initialCoordinates[1]).toFixed(6)));
      } else {
        setLat(editingPin.lat !== undefined ? String(editingPin.lat) : "");
        setLng(editingPin.lng !== undefined ? String(editingPin.lng) : "");
      }
    } else if (initialCoordinates) {
      setCategory("water");
      setName("");
      setSubType(PIN_CATEGORIES.water.subTypes[0] || "");
      setBarangay("Palayan");
      setStatus("operational");
      setContact("");
      setDescription("");
      setLng(String(Number(initialCoordinates[0]).toFixed(6)));
      setLat(String(Number(initialCoordinates[1]).toFixed(6)));
    } else {
      setCategory("water");
      setName("");
      setSubType(PIN_CATEGORIES.water.subTypes[0] || "");
      setBarangay("Palayan");
      setStatus("operational");
      setContact("");
      setDescription("");
      setLat("15.539800");
      setLng("121.082700");
    }
    setError("");
    setShowDeleteConfirm(false);
  }, [editingPin, draftData, initialCoordinates, isOpen]);

  // When category changes, default the subType to the first suggestion if empty or not in new category
  const handleCategorySelect = (catKey) => {
    setCategory(catKey);
    const cat = PIN_CATEGORIES[catKey];
    if (cat && cat.subTypes && cat.subTypes.length > 0) {
      setSubType(cat.subTypes[0]);
    }
  };

  const selectedCategoryDef = useMemo(
    () => PIN_CATEGORIES[category] || PIN_CATEGORIES.water,
    [category],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name or title for this location pin.");
      return;
    }
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
      setError("Please provide valid latitude and longitude coordinates.");
      return;
    }

    setIsSubmitting(true);
    try {
      const pinPayload = {
        ...(editingPin?.id ? { id: editingPin.id } : {}),
        name: name.trim(),
        category,
        subType: subType.trim() || selectedCategoryDef.label,
        barangay,
        lat: numLat,
        lng: numLng,
        status,
        contact: contact.trim(),
        description: description.trim(),
        createdBy: currentUser?.email || "Admin User",
      };

      onSave(pinPayload);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save pinned location.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (editingPin?.id && onDelete) {
      onDelete(editingPin.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  const bgModal = isDark ? "rgba(18, 18, 22, 0.98)" : "rgba(255, 255, 255, 0.99)";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.10)";
  const textColor = isDark ? "#ffffff" : "#09090b";
  const subTextColor = isDark ? "#a1a1aa" : "#52525b";
  const inputBg = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          fontFamily: "'Nunito', sans-serif",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 620,
            maxHeight: "92vh",
            background: bgModal,
            border: `1px solid ${borderColor}`,
            borderRadius: 24,
            boxShadow: isDark
              ? "0 25px 60px rgba(0, 0, 0, 0.85)"
              : "0 20px 50px rgba(0, 0, 0, 0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${borderColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.01)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${selectedCategoryDef.color}, ${selectedCategoryDef.color}dd)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: `0 4px 14px ${selectedCategoryDef.color}44`,
                }}
              >
                {(() => {
                  const CatIcon = ICON_COMPONENTS[selectedCategoryDef.icon] || MapPin;
                  return <CatIcon size={20} strokeWidth={2.4} />;
                })()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: textColor }}>
                  {isEditing ? "Edit Pinned Location" : "Pin Location on Map"}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: subTextColor, fontWeight: 700 }}>
                  Categorize infrastructure, facilities, and critical services
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Close"
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                border: "none",
                color: subTextColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "18px 20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 800,
                  color: subTextColor,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Select Category *
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: 8,
                }}
              >
                {Object.values(PIN_CATEGORIES).map((cat) => {
                  const isSelected = category === cat.id;
                  const CatIcon = ICON_COMPONENTS[cat.icon] || MapPin;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: isSelected
                          ? `1.5px solid ${cat.color}`
                          : `1px solid ${borderColor}`,
                        background: isSelected
                          ? isDark
                            ? `${cat.color}20`
                            : `${cat.color}15`
                          : inputBg,
                        color: isSelected ? (isDark ? "#ffffff" : cat.color) : textColor,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 800,
                        textAlign: "left",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? `0 2px 10px ${cat.color}30` : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          background: isSelected ? cat.color : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                          color: isSelected ? "#ffffff" : cat.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CatIcon size={13} strokeWidth={2.4} />
                      </div>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Facility Name & SubType */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    color: subTextColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Facility / Pin Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    category === "water"
                      ? "e.g., Peñaranda Pumping Station"
                      : category === "hospital"
                        ? "e.g., Palayan District Hospital"
                        : category === "fire"
                          ? "e.g., BFP Central Substation #1"
                          : "e.g., CDRRMO Command Post"
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: inputBg,
                    color: textColor,
                    fontSize: 12,
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    color: subTextColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Specific Facility Type
                </label>
                <input
                  type="text"
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  list="category-subtypes"
                  placeholder="Select or type subtype..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: inputBg,
                    color: textColor,
                    fontSize: 12,
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <datalist id="category-subtypes">
                  {selectedCategoryDef.subTypes.map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Barangay & Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    color: subTextColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Barangay
                </label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: inputBg,
                    color: textColor,
                    fontSize: 12,
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                >
                  {PALAYAN_BARANGAYS.map((b) => (
                    <option
                      key={b}
                      value={b}
                      style={{ background: isDark ? "#18181b" : "#ffffff", color: textColor }}
                    >
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    color: subTextColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Operational Status
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.values(PIN_STATUSES).map((st) => {
                    const isSel = status === st.id;
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => setStatus(st.id)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: 10,
                          border: isSel ? `1.5px solid ${st.color}` : `1px solid ${borderColor}`,
                          background: isSel ? st.bg : inputBg,
                          color: isSel ? st.color : subTextColor,
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: st.color,
                          }}
                        />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {st.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Coordinates Display */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: subTextColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  GPS Coordinates (Lng / Lat) *
                </label>
                <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>
                  {initialCoordinates ? "📍 Coordinates loaded" : "📍 Enter or pick on map"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 10,
                      fontWeight: 800,
                      color: subTextColor,
                    }}
                  >
                    LNG:
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 42px",
                      borderRadius: 12,
                      border: `1px solid ${borderColor}`,
                      background: inputBg,
                      color: textColor,
                      fontSize: 12,
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 10,
                      fontWeight: 800,
                      color: subTextColor,
                    }}
                  >
                    LAT:
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 40px",
                      borderRadius: 12,
                      border: `1px solid ${borderColor}`,
                      background: inputBg,
                      color: textColor,
                      fontSize: 12,
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Pin on Map Button Option under GPS Coordinates */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onPickOnMap) {
                      onPickOnMap({
                        id: editingPin?.id,
                        category,
                        name,
                        subType,
                        barangay,
                        status,
                        contact,
                        description,
                        lat,
                        lng,
                      });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 14px",
                    borderRadius: 12,
                    border: "1.5px solid rgba(245, 158, 11, 0.45)",
                    background: isDark
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(234, 88, 12, 0.12) 100%)"
                      : "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)",
                    color: "#f59e0b",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 2px 10px rgba(245, 158, 11, 0.18)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(245, 158, 11, 0.32)";
                    e.currentTarget.style.borderColor = "#f59e0b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 10px rgba(245, 158, 11, 0.18)";
                    e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.45)";
                  }}
                >
                  <MapPin size={15} strokeWidth={2.4} />
                  <span>Pin on Map</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setLng(String(Number(pos.coords.longitude).toFixed(6)));
                          setLat(String(Number(pos.coords.latitude).toFixed(6)));
                        },
                        () => {
                          setError("Could not access GPS device location.");
                        },
                        { enableHighAccuracy: true, timeout: 8000 }
                      );
                    } else {
                      setError("Geolocation is not supported by your browser.");
                    }
                  }}
                  title="Use current device GPS location"
                  style={{
                    padding: "9px 14px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: inputBg,
                    color: subTextColor,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Navigation size={13} strokeWidth={2.2} />
                  <span>Current GPS</span>
                </button>
              </div>
            </div>

            {/* Contact & Phone */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 800,
                  color: subTextColor,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Contact Number / Officer in Charge (Optional)
              </label>
              <div style={{ position: "relative" }}>
                <Phone
                  size={14}
                  color={subTextColor}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g., (044) 958-1234 or 0917-123-4567"
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 34px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: inputBg,
                    color: textColor,
                    fontSize: 12,
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Description & Operational Notes */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 800,
                  color: subTextColor,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Facility Description & Notes (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe equipment capacity, servicing barangays, generator status, or emergency access..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                  background: inputBg,
                  color: textColor,
                  fontSize: 12,
                  fontWeight: 700,
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isEditing ? "space-between" : "flex-end",
                gap: 12,
                marginTop: 6,
                paddingTop: 12,
                borderTop: `1px solid ${borderColor}`,
              }}
            >
              {isEditing && (
                <div>
                  {showDeleteConfirm ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        onClick={handleDelete}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "none",
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: `1px solid ${borderColor}`,
                          background: inputBg,
                          color: subTextColor,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete Pin</span>
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 12,
                    border: `1px solid ${borderColor}`,
                    background: inputBg,
                    color: subTextColor,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 4px 14px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  <Check size={15} strokeWidth={3} />
                  <span>{isEditing ? "Update Pin" : "Save Pin to Map"}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
