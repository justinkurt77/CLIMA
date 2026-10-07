import { Home, AlertTriangle, ClipboardList, User, Plus, Map as MapIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { id: "home", Icon: Home, label: "Home" },
  { id: "emergency", Icon: AlertTriangle, label: "Emergency" },
  { id: "profile", Icon: User, label: "Profile" },
];

export default function BottomNav({
  activeScreen,
  setActiveScreen,
  isHidden,
  isMinimized,
  setIsMinimized,
  onFabClick,
}) {
  const activeItem =
    NAV_ITEMS.find((item) => item.id === activeScreen) || NAV_ITEMS[0];
  const ActiveIcon = activeItem.Icon;

  return (
    <motion.nav
      initial={false}
      animate={{
        y: 0,
        scale: 1,
        width: isHidden ? 64 : isMinimized ? 64 : "calc(100% - 28px)",
        borderRadius: 28, // Consistent squircle shape for both modes
      }}
      transition={{
        duration: 0.7,
        ease: [0.32, 0.72, 0, 1],
      }}
      onClick={() => {
        if (isHidden && onFabClick) {
          onFabClick();
        }
      }}
      style={{
        position: "absolute",
        bottom: 0,
        right: 14,
        zIndex: 1000,
        marginBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        height: 64,

        // Appearance
        background: "rgba(74, 94, 54, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: isHidden
          ? "0 4px 20px rgba(74, 94, 54, 0.5)"
          : "0 4px 24px rgba(0, 0, 0, 0.15)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        pointerEvents: "auto",
        cursor: isHidden ? "pointer" : "default",
      }}
    >
      {/* FAB PLUS ICON CONTENT */}
      <AnimatePresence>
        {isHidden && (
          <motion.div
            key="fab-content"
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{
              opacity: 0,
              scale: 0.8,
              rotate: 15,
              transition: { duration: 0.15, delay: 0 },
            }}
            transition={{ duration: 0.3, delay: 0.35 }}
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Plus size={26} strokeWidth={2.5} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Icon Button */}
      {!isHidden && (
        <div
          onClick={() => setIsMinimized(false)}
          style={{
            position: "absolute",
            right: 0,
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isMinimized ? 1 : 0,
            pointerEvents: isMinimized ? "auto" : "none",
            transition: "opacity 0.3s ease",
            transitionDelay: isMinimized ? "0.2s" : "0s",
            cursor: "pointer",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: 2.6,
              paddingBottom: 1.5,
            }}
          >
            <ActiveIcon size={24} strokeWidth={2.2} />
          </div>
        </div>
      )}

      {/* Expanded Nav Items */}
      {!isHidden && (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            opacity: isMinimized ? 0 : 1,
            pointerEvents: isMinimized ? "none" : "auto",
            transition: "opacity 0.2s ease",
            transitionDelay: isMinimized ? "0s" : "0.2s",
            position: "absolute",
            right: 0,
          }}
        >
          {NAV_ITEMS.map(({ id, Icon, label }) => {
            const isActive = activeScreen === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveScreen(id);
                  setIsMinimized(true);
                }}
                aria-label={label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  padding: "8px 4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 28,
                  transition: "opacity 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                >
                  <Icon
                    size={22}
                    color={isActive ? "#ffffff" : "rgba(255,255,255,0.7)"}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: isActive ? 800 : 700,
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
                    fontFamily: "Nunito, sans-serif",
                    letterSpacing: 0.2,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </motion.nav>
  );
}
