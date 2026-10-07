import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Step4Success({ onClose }) {
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
        background: "#F9FDF7",
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
          background: "#E8F5E9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <CheckCircle size={40} color="#3F6F23" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#1a1108",
          marginBottom: 12,
          textAlign: "center",
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
          color: "#7B936B",
          textAlign: "center",
          lineHeight: 1.5,
          marginBottom: 32,
          maxWidth: 280,
        }}
      >
        Thank you for helping our community. Your report has been submitted
        successfully and is now being reviewed.
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
          background: "linear-gradient(135deg, #4aaa1f 0%, #3F6F23 100%)",
          color: "white",
          fontWeight: 800,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(63, 111, 35, 0.3)",
          transition: "transform 0.1s",
        }}
      >
        Done
      </motion.button>
    </motion.div>
  );
}
