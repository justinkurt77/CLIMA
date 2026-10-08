import { useState } from "react";
import {
  Home,
  MapPin,
  AlertTriangle,
  User,
  BarChart2,
  Settings,
  RotateCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const MOBILE_NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "emergency", label: "Alerts", icon: AlertTriangle },
  { id: "profile", label: "Profile", icon: User },
];

const DESKTOP_NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "emergency", label: "Alerts", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "profile", label: "Settings", icon: Settings },
];

export default function CitizenNav({
  activeScreen,
  setActiveScreen,
  session,
  onOpenModal,
}) {
  const { isDark } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const firstName = session?.user?.user_metadata?.first_name || "Palayano";
  const userInitial = firstName.charAt(0).toUpperCase();

  return (
    <>
      {/* ── DESKTOP DOCKED SIDEBAR (>= 1024px) ── */}
      <aside className="citizen-desktop-sidebar">
        {/* Top: Avatar */}
        <div className="desktop-sidebar-top">
          <div
            className="desktop-avatar"
            onClick={() => setActiveScreen("profile")}
            title={`${firstName}'s Profile`}
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="desktop-avatar-img" />
            ) : (
              <div className="desktop-avatar-fallback">
                <span>{userInitial}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation icons */}
        <div className="desktop-sidebar-menu">
          {DESKTOP_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeScreen === id;

            return (
              <button
                key={id}
                className={`desktop-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveScreen(id)}
                title={label}
                aria-label={label}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className="desktop-nav-icon"
                />
              </button>
            );
          })}
        </div>

        {/* Bottom: Refresh & Last updated label */}
        <div className="desktop-sidebar-bottom">
          <button
            className={`desktop-refresh-btn ${isRefreshing ? "spin" : ""}`}
            onClick={handleRefresh}
            title="Refresh data"
            aria-label="Refresh"
          >
            <RotateCw size={17} strokeWidth={2.2} />
          </button>
          <div className="desktop-updated-tag">
            <span>Updated</span>
            <span className="desktop-updated-sub">Just now</span>
          </div>
        </div>
      </aside>

      {/* ── MOBILE FLOATING BOTTOM NAV (< 1024px) ── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="citizen-bottom-nav"
      >
        {MOBILE_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeScreen === id;
          const iconColor = isActive
            ? isDark
              ? "#ffffff"
              : "#09090b"
            : isDark
            ? "#71717a"
            : "#71717a";

          return (
            <button
              key={id}
              onClick={() => setActiveScreen(id)}
              className="mobile-nav-btn"
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
                  border: isActive
                    ? "1px solid var(--nav-active-border)"
                    : "1px solid transparent",
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
    </>
  );
}
