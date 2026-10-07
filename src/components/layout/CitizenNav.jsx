import { Home, MapPin, AlertTriangle, User } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "emergency", label: "Alerts", icon: AlertTriangle },
  { id: "profile", label: "Profile", icon: User },
];

export default function CitizenNav({ activeScreen, setActiveScreen }) {
  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        marginBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        marginLeft: 14,
        marginRight: 14,
        borderRadius: 26,
        background: "rgba(12, 12, 14, 0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 1000,
        padding: "0 8px",
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeScreen === id;
        return (
          <button
            key={id}
            onClick={() => setActiveScreen(id)}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <motion.div
              animate={{
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
              style={{
                width: 42,
                height: 34,
                borderRadius: 14,
                background: isActive ? "rgba(255, 255, 255, 0.14)" : "transparent",
                border: isActive ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 1.8}
                color={isActive ? "#ffffff" : "#71717a"}
              />
            </motion.div>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? "#ffffff" : "#71717a",
                letterSpacing: 0.2,
                transition: "color 0.2s ease",
              }}
            >
              {label}
            </span>

            {/* Active dot indicator */}
            {isActive && (
              <motion.div
                layoutId="citizen-nav-dot"
                style={{
                  position: "absolute",
                  top: 6,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.9)",
                }}
              />
            )}
          </button>
        );
      })}
    </motion.nav>
  );
}
