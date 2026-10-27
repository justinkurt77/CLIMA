import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Lock, Eye, EyeOff, AlertCircle, X, Loader2, Trash2 } from "lucide-react";
import { verifyAdminPassword } from "../../lib/adminAuthVerify";

/**
 * Security Confirmation Modal
 * Prompts the admin to enter their password before deleting logs or records.
 * Only proceeds if password verification succeeds.
 */
export default function SecurityConfirmModal({
  isOpen,
  onClose,
  onConfirmed,
  title = "Security Confirmation",
  message = "Deleting this item is a sensitive and permanent action. Please enter your admin password to authenticate and proceed.",
  itemName = "",
  confirmText = "Verify & Delete",
  isDark = true,
  currentUserEmail = null,
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef(null);
  const openTimeRef = useRef(0);
  const mouseDownTargetRef = useRef(null);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      setPassword("");
      setShowPassword(false);
      setErrorMessage("");
      setIsVerifying(false);
      // Auto-focus the password input
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isVerifying) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isVerifying, onClose]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setErrorMessage("Please enter your admin password to proceed.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await verifyAdminPassword(password, currentUserEmail);
      if (!res.success) {
        setErrorMessage(res.error || "Incorrect admin password. Deletion rejected.");
        setIsVerifying(false);
        return;
      }

      // Password verified successfully: execute confirmed action while maintaining verifying state
      if (onConfirmed) {
        await onConfirmed();
      }
      setIsVerifying(false);
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || "Failed to verify admin password.");
      setIsVerifying(false);
    }
  };

  const bgModal = isDark ? "#121214" : "#ffffff";
  const borderModal = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
  const textColor = isDark ? "#ffffff" : "#09090b";
  const textMuted = isDark ? "#a1a1aa" : "#52525b";
  const inputBg = isDark ? "#18181b" : "#f4f4f6";
  const inputBorder = errorMessage ? "#ef4444" : isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.16)";

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="security-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            fontFamily: "'Nohemi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          onMouseDown={(e) => {
            mouseDownTargetRef.current = e.target;
          }}
          onClick={(e) => {
            // Guard 1: Ignore clicks within 400ms of opening to eliminate event bubbling / trigger tap-through
            if (Date.now() - openTimeRef.current < 400) return;
            // Guard 2: Mouse down must have explicitly started on the backdrop, not on the modal card
            if (
              mouseDownTargetRef.current === e.currentTarget &&
              e.target === e.currentTarget &&
              !isVerifying
            ) {
              onClose();
            }
          }}
        >
          <motion.div
            key="security-modal-container"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 440,
              background: bgModal,
              border: `1px solid ${borderModal}`,
              borderRadius: 22,
              boxShadow: isDark ? "0 25px 60px rgba(0, 0, 0, 0.85)" : "0 20px 50px rgba(0, 0, 0, 0.15)",
              overflow: "hidden",
              color: textColor,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header Bar with Alert Icon */}
          <div
            style={{
              padding: "20px 24px 16px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 14,
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isDark ? "rgba(248, 113, 113, 0.16)" : "rgba(254, 226, 226, 0.9)",
                  border: isDark ? "1px solid rgba(248, 113, 113, 0.35)" : "1px solid rgba(252, 165, 165, 0.75)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDark ? "#fca5a5" : "#e05260",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: "-0.01em" }}>
                  {title}
                </h3>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: isDark ? "#fca5a5" : "#e05260",
                    marginTop: 2,
                  }}
                >
                  Admin Verification Required
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isVerifying}
              title="Cancel"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                border: "none",
                color: textMuted,
                cursor: isVerifying ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 13,
                color: textMuted,
                lineHeight: 1.55,
                fontWeight: 500,
              }}
            >
              {message}
            </p>

            {/* Target Item Name Pill (if provided) */}
            {itemName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  marginBottom: 16,
                  fontSize: 12,
                  color: isDark ? "#fca5a5" : "#dc2626",
                  fontWeight: 700,
                }}
              >
                <Trash2 size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {itemName}
                </span>
              </div>
            )}

            {/* Password Input Field */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: isDark ? "#e4e4e7" : "#27272a",
                  marginBottom: 6,
                }}
              >
                Admin Password
              </label>

              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: textMuted,
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Lock size={16} />
                </div>

                <input
                  ref={inputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Enter your admin password"
                  disabled={isVerifying}
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 42px 12px 38px",
                    borderRadius: 12,
                    background: inputBg,
                    border: `1.5px solid ${inputBorder}`,
                    color: textColor,
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    fontWeight: 600,
                    outline: "none",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: errorMessage
                      ? "0 0 0 3px rgba(239, 68, 68, 0.2)"
                      : "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: textMuted,
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isDark ? "rgba(248, 113, 113, 0.15)" : "rgba(254, 226, 226, 0.9)",
                  border: isDark ? "1px solid rgba(248, 113, 113, 0.35)" : "1px solid rgba(252, 165, 165, 0.75)",
                  color: isDark ? "#fca5a5" : "#e05260",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: `1px solid ${borderModal}`,
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  color: textColor,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isVerifying ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                style={{
                  padding: "10px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: isDark ? "linear-gradient(135deg, #f87171, #ef4444)" : "linear-gradient(135deg, #e05260, #be123c)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isVerifying || !password.trim() ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: isVerifying || !password.trim() ? 0.65 : 1,
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                  transition: "all 0.15s ease",
                }}
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={15} className="spin-animation" style={{ animation: "spin 1s linear infinite" }} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>{confirmText}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
