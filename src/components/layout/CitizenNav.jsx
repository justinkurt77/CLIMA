import { useState } from "react";
import {
  Home,
  MapPin,
  Info,
  User,
  RotateCw,
  Activity,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { logger } from "../../lib/logger";
import { getUserProfile } from "../../lib/authHelpers";

const MOBILE_NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "elnino", label: "El Niño", icon: Activity },
  { id: "about", label: "About", icon: Info },
  { id: "profile", label: "Profile", icon: User },
];

const DESKTOP_NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "elnino", label: "El Niño", icon: Activity },
  { id: "about", label: "About", icon: Info },
  { id: "profile", label: "Profile", icon: User },
];

export default function CitizenNav({
  activeScreen,
  setActiveScreen,
  session,
  isAdmin = false,
  isSuperadmin = false,
  adminUser = null,
  onOpenModal,
  onRefresh,
}) {
  const { isDark, toggleTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isUserAdmin = Boolean(
    isAdmin ||
    isSuperadmin ||
    adminUser?.isAdmin ||
    session?.user?.user_metadata?.role?.includes("admin") ||
    session?.user?.user_metadata?.role === "superadmin"
  );
  const isUserSuperadmin = Boolean(
    isSuperadmin ||
    adminUser?.isSuperadmin ||
    session?.user?.user_metadata?.role === "superadmin"
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (err) {
        logger.warn("Refresh error:", err);
      }
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const userProfile = getUserProfile(session?.user);
  const userAvatar = userProfile?.avatarUrl;
  const firstName = userProfile?.firstName || "Palayano";
  const userInitial = firstName.charAt(0).toUpperCase();

  const mobileNavItems = isUserAdmin
    ? [
        ...MOBILE_NAV_ITEMS,
        {
          id: "admin",
          label: isUserSuperadmin ? "Superadmin" : "Admin",
          icon: Shield,
          isAdminItem: true,
        },
      ]
    : MOBILE_NAV_ITEMS;

  return (
    <>
      {/* ── DESKTOP DOCKED SIDEBAR (>= 1024px) ── */}
      <aside className="citizen-desktop-sidebar">
        {/* Top: Brand Logo & Avatar */}
        <div className="desktop-sidebar-top" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => setActiveScreen("home")}
            title="CLIMA Home"
            style={{
              width: 46,
              height: 46,
              padding: 2,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
            }}
          >
            <img
              src="/logo.webp"
              alt="CLIMA Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: isDark
                  ? "drop-shadow(0 0 1px rgba(255, 255, 255, 0.85)) drop-shadow(0 2px 10px rgba(249, 115, 22, 0.4))"
                  : "drop-shadow(0 2px 8px rgba(249, 115, 22, 0.25))",
              }}
            />
          </button>

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

          {/* Admin / Superadmin Console Link */}
          {isUserAdmin && (
            <>
              <div
                style={{
                  width: 24,
                  height: 1,
                  background: "var(--border-subtle)",
                  margin: "4px 0",
                  opacity: 0.8,
                }}
              />
              <button
                id="desktop-admin-console-btn"
                className={`desktop-nav-btn desktop-admin-btn ${activeScreen === "admin" ? "active" : ""}`}
                onClick={() => setActiveScreen("admin")}
                title={isUserSuperadmin ? "Superadmin Console" : "Admin Console"}
                aria-label={isUserSuperadmin ? "Superadmin Console" : "Admin Console"}
                style={{
                  position: "relative",
                  background: activeScreen === "admin"
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "rgba(245, 158, 11, 0.14)",
                  color: activeScreen === "admin" ? "#ffffff" : "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.38)",
                  boxShadow: activeScreen === "admin"
                    ? "0 4px 14px rgba(245, 158, 11, 0.5)"
                    : "0 2px 8px rgba(245, 158, 11, 0.18)",
                  transition: "all 0.2s ease",
                }}
              >
                <Shield size={20} strokeWidth={2.4} />
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#f59e0b",
                    boxShadow: "0 0 8px #f59e0b",
                  }}
                />
              </button>
            </>
          )}
        </div>

        {/* Bottom: Dark Mode Toggle, Refresh & Last updated label */}
        <div className="desktop-sidebar-bottom">
          <button
            className="desktop-refresh-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle dark mode"
            style={{ marginBottom: 8 }}
          >
            {isDark ? <Sun size={17} strokeWidth={2.2} /> : <Moon size={17} strokeWidth={2.2} />}
          </button>
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
        {mobileNavItems.map(({ id, label, icon: Icon, isAdminItem }) => {
          const isActive = activeScreen === id;
          const iconColor = isActive
            ? "#ffffff"
            : isAdminItem
            ? "#f59e0b"
            : isDark
            ? "#71717a"
            : "#71717a";

          return (
            <button
              key={id}
              onClick={() => setActiveScreen(id)}
              className={`mobile-nav-btn ${isAdminItem ? "mobile-nav-btn-admin" : ""}`}
              id={isAdminItem ? "mobile-admin-console-btn" : undefined}
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
                  background: isActive
                    ? isAdminItem
                      ? "linear-gradient(135deg, #f59e0b, #d97706)"
                      : "var(--accent-orange)"
                    : isAdminItem
                    ? "rgba(245, 158, 11, 0.14)"
                    : "transparent",
                  border: isActive
                    ? isAdminItem
                      ? "1px solid #f59e0b"
                      : "1px solid var(--accent-orange)"
                    : isAdminItem
                    ? "1px solid rgba(245, 158, 11, 0.35)"
                    : "1px solid transparent",
                  boxShadow: isActive
                    ? isAdminItem
                      ? "0 4px 14px rgba(245, 158, 11, 0.45)"
                      : "0 4px 14px var(--accent-glow)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2.0}
                  color={iconColor}
                />
                {isAdminItem && !isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#f59e0b",
                    }}
                  />
                )}
              </motion.div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive || isAdminItem ? 800 : 600,
                  color: isActive
                    ? "var(--nav-active-text)"
                    : isAdminItem
                    ? "#f59e0b"
                    : "var(--text-muted)",
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
