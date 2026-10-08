import { useState } from "react";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { CATEGORY_GROUPS, PALAYAN_BARANGAYS } from "./reportConstants";
import { motion } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";

import { LocationCard } from "./LocationCard";
import { PhotoCard } from "./PhotoCard";
import { DescriptionCard } from "./DescriptionCard";
import { GuestInfoCard } from "./GuestInfoCard";

// ── Step 2  ───────────────────────────────────────────────────────────────────
export default function Step2DetailsForm({
  selectedCategory,
  coords,
  locStatus,
  location,
  errors,
  addressLine1,
  addressLine2,
  description,
  guestName,
  guestContact,
  session,
  photoPreviews,
  fileRef,
  onBack,
  onOpenMap,
  onAddressLine1Change,
  onAddressLine2Change,
  onDescriptionChange,
  onGuestNameChange,
  onGuestContactChange,
  onPhotoChange,
  onPhotoRemove,
  onSubmit,
  isSubmitting,
  setErrors,
}) {
  const { isDark } = useTheme();
  const [barangayOpen, setBarangayOpen] = useState(false);

  const barangayMatches =
    addressLine2.trim().length > 0
      ? PALAYAN_BARANGAYS.filter((b) =>
          b.toLowerCase().includes(addressLine2.toLowerCase()),
        )
      : [];

  const CategoryIcon =
    CATEGORY_GROUPS.find((g) => g.items.includes(selectedCategory))?.icon ||
    ClipboardList;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "absolute",
        inset: 0,
        background: isDark ? "#000000" : "var(--bg-app)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
          background: isDark ? "#000000" : "var(--bg-app)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--border-subtle)",
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--text-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} color="var(--text-primary)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 2,
            }}
          >
            Report Details
          </div>
          <h1
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CategoryIcon
              size={16}
              color="var(--text-primary)"
              style={{ marginRight: 6, flexShrink: 0 }}
            />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedCategory}
            </span>
          </h1>
        </div>
        <div
          style={{
            background: "var(--border-subtle)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: 20,
            letterSpacing: 0.3,
            flexShrink: 0,
          }}
        >
          Step 2
        </div>
      </div>

      {/* Scrollable body */}
      <div
        className="hide-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "12px 16px 0",
          paddingBottom: 100,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {!session && (
          <GuestInfoCard
            guestName={guestName}
            guestContact={guestContact}
            errors={errors}
            onNameChange={(val) => {
              onGuestNameChange(val);
              if (val.trim())
                setErrors((e) => ({ ...e, guestName: undefined }));
            }}
            onContactChange={(val) => {
              onGuestContactChange(val);
              if (val.trim())
                setErrors((e) => ({ ...e, guestContact: undefined }));
            }}
          />
        )}

        <LocationCard
          coords={coords}
          locStatus={locStatus}
          location={location}
          errors={errors}
          addressLine1={addressLine1}
          addressLine2={addressLine2}
          barangayOpen={barangayOpen}
          barangayMatches={barangayMatches}
          onOpenMap={onOpenMap}
          onAddressLine1Change={onAddressLine1Change}
          onAddressLine2Change={(val) => {
            onAddressLine2Change(val);
            setBarangayOpen(true);
            if (val.trim())
              setErrors((e) => ({ ...e, addressLine2: undefined }));
          }}
          onBarangayFocus={() => setBarangayOpen(true)}
          onBarangayBlur={() => setTimeout(() => setBarangayOpen(false), 160)}
          onBarangaySelect={(b) => {
            onAddressLine2Change(b);
            setBarangayOpen(false);
            setErrors((e) => ({ ...e, addressLine2: undefined }));
          }}
        />

        <PhotoCard
          fileRef={fileRef}
          photoPreviews={photoPreviews}
          onRemove={onPhotoRemove}
          onChange={onPhotoChange}
        />

        <DescriptionCard
          description={description}
          errors={errors}
          onChange={(val) => {
            onDescriptionChange(val);
            if (val.trim())
              setErrors((e) => ({ ...e, description: undefined }));
          }}
        />
      </div>

      {/* Fixed Submit Button */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 20px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          background: isDark
            ? "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.95) 30%)"
            : "linear-gradient(180deg, rgba(248,249,250,0) 0%, rgba(248,249,250,0.98) 30%)",
        }}
      >
        <motion.button
          onClick={onSubmit}
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "15px 16px",
            borderRadius: 30,
            background: isSubmitting
              ? "var(--border-subtle)"
              : "var(--btn-primary-bg)",
            color: isSubmitting
              ? "var(--text-muted)"
              : "var(--btn-primary-text)",
            border: "none",
            fontSize: 15,
            fontWeight: 800,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: isSubmitting
              ? "none"
              : "0 4px 20px rgba(0, 0, 0, 0.15)",
            letterSpacing: 0.3,
            transition: "all 0.2s",
          }}
        >
          {isSubmitting ? "Submitting…" : "Submit Report"}
        </motion.button>
      </div>
    </motion.div>
  );
}
