import { Home, MapPin, AlertTriangle, User } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "emergency", label: "Alerts", icon: AlertTriangle },
  { id: "profile", label: "Profile", icon: User },
];

export default function CitizenNav({ activeScreen, setActiveScreen }) {
  const { isDark } = useTheme();

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
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid var(--nav-border)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 1000,
        padding: "0 8px",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeScreen === id;
        const iconColor = isActive 
          ? (isDark ? "#ffffff" : "#09090b") 
          : (isDark ? "#71717a" : "#71717a");

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
                background: isActive ? "var(--nav-active-bg)" : "transparent",
                border: isActive ? "1px solid var(--nav-active-border)" : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 1.8}
                color={iconColor}
              />
            </motion.div>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                letterSpacing: 0.2,
                transition: "color 0.2s ease",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}
