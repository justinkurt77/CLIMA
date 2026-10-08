import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";

export default function Step4Success({ onClose }) {
  const { isDark } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: "absolute",
        inset: 0,
        background: isDark ? "#000000" : "var(--bg-app)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--border-subtle)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: isDark
            ? "0 0 30px rgba(255, 255, 255, 0.15)"
            : "0 0 30px rgba(0, 0, 0, 0.08)",
        }}
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <CheckCircle size={40} color="var(--text-primary)" strokeWidth={2.2} />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: "var(--text-primary)",
          marginBottom: 10,
          textAlign: "center",
          letterSpacing: -0.5,
        }}
      >
        Report Submitted!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          textAlign: "center",
          lineHeight: 1.5,
          marginBottom: 32,
          maxWidth: 280,
        }}
      >
        Thank you for helping our community. Your report has been submitted
        successfully and is now under review.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        style={{
          width: "100%",
          maxWidth: 300,
          padding: "16px",
          borderRadius: 30,
          background: "var(--btn-primary-bg)",
          color: "var(--btn-primary-text)",
          fontWeight: 800,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          transition: "transform 0.1s",
        }}
      >
        Done
      </motion.button>
    </motion.div>
  );
}
