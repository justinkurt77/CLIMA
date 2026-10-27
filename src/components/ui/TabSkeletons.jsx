import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import "./TabSkeletons.css";

// ─────────────────────────────────────────────────────────────
// 1. HOME TAB SKELETON
// ─────────────────────────────────────────────────────────────
export function HomeTabSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="tab-skeleton-wrapper hide-scroll" aria-label="Loading Home...">
      <div className="home-skeleton-container">
        {/* Top Header: Barangay Selector & Status Pill */}
        <div className="home-skeleton-header">
          <div
            className="clima-shimmer"
            style={{ width: 190, height: 40, borderRadius: 24 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <div
              className="clima-shimmer"
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            <div
              className="clima-shimmer"
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          </div>
        </div>

        {/* Hero Weather Card */}
        <div className="tab-skeleton-card home-skeleton-hero">
          {/* Tag row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              className="clima-shimmer"
              style={{ width: 140, height: 22, borderRadius: 14 }}
            />
            <div
              className="clima-shimmer"
              style={{ width: 80, height: 22, borderRadius: 14 }}
            />
          </div>

          {/* Big Temp & Condition Row */}
          <div className="home-skeleton-hero-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                className="clima-shimmer"
                style={{ width: 120, height: 64, borderRadius: 18 }}
              />
              <div
                className="clima-shimmer"
                style={{ width: 170, height: 22, borderRadius: 10 }}
              />
              <div
                className="clima-shimmer"
                style={{ width: 130, height: 16, borderRadius: 8 }}
              />
            </div>
            {/* Round illustration shimmer */}
            <div
              className="clima-shimmer"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: isDark
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.1))"
                  : "linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(234, 88, 12, 0.15))",
              }}
            />
          </div>

          {/* Heat Index Advisory Banner */}
          <div
            className="clima-shimmer"
            style={{ width: "100%", height: 44, borderRadius: 16 }}
          />
        </div>

        {/* Hourly Forecast Carousel Skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="clima-shimmer" style={{ width: 130, height: 18, borderRadius: 8 }} />
            <div className="clima-shimmer" style={{ width: 60, height: 14, borderRadius: 6 }} />
          </div>

          <div className="home-skeleton-hourly-strip hide-scroll">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="tab-skeleton-card home-skeleton-hourly-pill">
                <div className="clima-shimmer" style={{ width: 34, height: 12, borderRadius: 6 }} />
                <div className="clima-shimmer" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                <div className="clima-shimmer" style={{ width: 28, height: 16, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        </div>

        {/* 2x2 Telemetry Grid (Humidity, Wind, Pressure, UV) */}
        <div className="home-skeleton-telemetry-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="tab-skeleton-card home-skeleton-telemetry-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="clima-shimmer" style={{ width: 75, height: 14, borderRadius: 6 }} />
                <div className="clima-shimmer" style={{ width: 24, height: 24, borderRadius: 8 }} />
              </div>
              <div className="clima-shimmer" style={{ width: 90, height: 32, borderRadius: 10 }} />
              <div className="clima-shimmer" style={{ width: "100%", height: 8, borderRadius: 6 }} />
            </div>
          ))}
        </div>

        {/* Emergency Alert Card Skeleton */}
        <div
          className="tab-skeleton-card"
          style={{
            padding: 18,
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div className="clima-shimmer" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div className="clima-shimmer" style={{ width: "60%", height: 16, borderRadius: 6 }} />
            <div className="clima-shimmer" style={{ width: "90%", height: 12, borderRadius: 6 }} />
          </div>
        </div>

        {/* 7-Day Forecast Card Skeleton */}
        <div className="tab-skeleton-card" style={{ padding: 20, borderRadius: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="clima-shimmer" style={{ width: 140, height: 18, borderRadius: 8 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="clima-shimmer" style={{ width: 45, height: 14, borderRadius: 6 }} />
              <div className="clima-shimmer" style={{ width: 24, height: 24, borderRadius: "50%" }} />
              <div className="clima-shimmer" style={{ flex: 1, height: 10, borderRadius: 5, maxWidth: 160 }} />
              <div className="clima-shimmer" style={{ width: 50, height: 14, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. MAP TAB SKELETON
// ─────────────────────────────────────────────────────────────
export function MapTabSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="map-skeleton-viewport" aria-label="Loading Map...">
      {/* Central Radar Pulse */}
      <div className="map-skeleton-radar-center">
        <div className="map-skeleton-radar-pulse-1" />
        <div className="map-skeleton-radar-pulse-2" />
        <div
          className="clima-shimmer"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#f59e0b",
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.8)",
          }}
        />
      </div>

      {/* Top Search Bar & Geocoder */}
      <div className="map-skeleton-topbar">
        <div
          className="tab-skeleton-card clima-shimmer"
          style={{
            width: "100%",
            height: 48,
            borderRadius: 30,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
          }}
        />

        {/* Filter Chips Pill Row */}
        <div className="map-skeleton-chips-row">
          {[80, 95, 75, 110, 85].map((w, i) => (
            <div
              key={i}
              className="tab-skeleton-card clima-shimmer"
              style={{ width: w, height: 34, borderRadius: 20 }}
            />
          ))}
        </div>
      </div>

      {/* Right Floating Controls */}
      <div className="map-skeleton-controls">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="tab-skeleton-card clima-shimmer map-skeleton-btn"
          />
        ))}
      </div>

      {/* Bottom Floating Incident / Facilities Drawer */}
      <div className="tab-skeleton-card map-skeleton-bottom-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="clima-shimmer" style={{ width: 36, height: 36, borderRadius: "50%" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="clima-shimmer" style={{ width: 140, height: 16, borderRadius: 6 }} />
            <div className="clima-shimmer" style={{ width: 190, height: 12, borderRadius: 6 }} />
          </div>
        </div>
        <div className="clima-shimmer" style={{ width: 84, height: 34, borderRadius: 18 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. EL NIÑO TAB SKELETON
// ─────────────────────────────────────────────────────────────
export function ElNinoTabSkeleton() {
  return (
    <div className="tab-skeleton-wrapper hide-scroll" aria-label="Loading El Niño Dashboard...">
      <div className="elnino-skeleton-container">
        {/* Header with Title & Date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="clima-shimmer" style={{ width: 240, height: 32, borderRadius: 10 }} />
            <div className="clima-shimmer" style={{ width: 320, height: 16, borderRadius: 6 }} />
          </div>
          <div className="clima-shimmer" style={{ width: 130, height: 36, borderRadius: 20 }} />
        </div>

        {/* 4 KPI Metrics */}
        <div className="elnino-skeleton-kpi-grid">
          {[
            { color: "#ef4444" },
            { color: "#f97316" },
            { color: "#06b6d4" },
            { color: "#10b981" },
          ].map((item, i) => (
            <div key={i} className="tab-skeleton-card elnino-skeleton-kpi-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="clima-shimmer" style={{ width: 90, height: 14, borderRadius: 6 }} />
                <div
                  className="clima-shimmer"
                  style={{ width: 28, height: 28, borderRadius: 8, background: `${item.color}30` }}
                />
              </div>
              <div className="clima-shimmer" style={{ width: 110, height: 32, borderRadius: 10 }} />
              <div className="clima-shimmer" style={{ width: 140, height: 12, borderRadius: 6 }} />
            </div>
          ))}
        </div>

        {/* Dual Chart Placeholders */}
        <div className="elnino-skeleton-charts-grid">
          {[1, 2].map((i) => (
            <div key={i} className="tab-skeleton-card elnino-skeleton-chart-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="clima-shimmer" style={{ width: 160, height: 20, borderRadius: 8 }} />
                <div className="clima-shimmer" style={{ width: 80, height: 24, borderRadius: 12 }} />
              </div>

              {/* Chart Mock Lines */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 14,
                  padding: "10px 4px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                {[40, 65, 50, 85, 60, 95, 70, 80].map((h, idx) => (
                  <div
                    key={idx}
                    className="clima-shimmer"
                    style={{ flex: 1, height: `${h}%`, borderRadius: "6px 6px 0 0" }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section Accordions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="tab-skeleton-card"
              style={{
                padding: "16px 20px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="clima-shimmer" style={{ width: 38, height: 38, borderRadius: 12 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="clima-shimmer" style={{ width: 180, height: 16, borderRadius: 6 }} />
                  <div className="clima-shimmer" style={{ width: 120, height: 12, borderRadius: 6 }} />
                </div>
              </div>
              <div className="clima-shimmer" style={{ width: 28, height: 28, borderRadius: "50%" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. ABOUT TAB SKELETON
// ─────────────────────────────────────────────────────────────
export function AboutTabSkeleton() {
  const { isDark } = useTheme();

  return (
    <div
      className="tab-skeleton-wrapper hide-scroll"
      style={{ background: isDark ? "#000000" : "#ffffff" }}
      aria-label="Loading About..."
    >
      <div className="about-skeleton-container">
        {/* Connected Logos Badge Shimmer */}
        <div
          className="clima-shimmer"
          style={{ width: 220, height: 60, borderRadius: 40 }}
        />

        {/* Giant Title Shimmer */}
        <div
          className="clima-shimmer"
          style={{ width: "min(460px, 80vw)", height: 72, borderRadius: 16 }}
        />

        {/* Subtitle Line */}
        <div
          className="clima-shimmer"
          style={{ width: "min(340px, 70vw)", height: 18, borderRadius: 8 }}
        />

        {/* Glassmorphic Overview Card */}
        <div
          className="tab-skeleton-card about-skeleton-glass-card"
          style={{
            background: isDark ? "rgba(18, 18, 18, 0.85)" : "rgba(255, 255, 255, 0.95)",
          }}
        >
          <div className="clima-shimmer" style={{ width: 44, height: 44, borderRadius: 14 }} />
          <div className="clima-shimmer" style={{ width: 220, height: 22, borderRadius: 8 }} />
          <div className="clima-shimmer" style={{ width: "85%", height: 14, borderRadius: 6 }} />
          <div className="clima-shimmer" style={{ width: "70%", height: 14, borderRadius: 6 }} />

          {/* 3 Stat Highlights */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              width: "100%",
              marginTop: 10,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="clima-shimmer"
                style={{ height: 64, borderRadius: 16 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. PROFILE TAB SKELETON
// ─────────────────────────────────────────────────────────────
export function ProfileTabSkeleton() {
  return (
    <div className="tab-skeleton-wrapper hide-scroll" aria-label="Loading Profile...">
      <div className="profile-skeleton-container">
        {/* Profile Header Card */}
        <div className="tab-skeleton-card profile-skeleton-header-card">
          <div
            className="clima-shimmer"
            style={{ width: 88, height: 88, borderRadius: "50%" }}
          />
          <div className="clima-shimmer" style={{ width: 160, height: 22, borderRadius: 8 }} />
          <div className="clima-shimmer" style={{ width: 120, height: 16, borderRadius: 14 }} />

          {/* Stats Row */}
          <div className="profile-skeleton-stats-row">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="clima-shimmer"
                style={{ height: 56, borderRadius: 16 }}
              />
            ))}
          </div>
        </div>

        {/* Action Menu Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="tab-skeleton-card profile-skeleton-menu-item">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="clima-shimmer" style={{ width: 38, height: 38, borderRadius: 12 }} />
                <div className="clima-shimmer" style={{ width: 130, height: 16, borderRadius: 6 }} />
              </div>
              <div className="clima-shimmer" style={{ width: 18, height: 18, borderRadius: 6 }} />
            </div>
          ))}
        </div>

        {/* Logout / Switch Account Shimmer */}
        <div
          className="tab-skeleton-card clima-shimmer"
          style={{ width: "100%", height: 48, borderRadius: 18 }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. MY REPORTS SUB-TAB SKELETON
// ─────────────────────────────────────────────────────────────
export function MyReportsTabSkeleton() {
  return (
    <div className="reports-skeleton-container" aria-label="Loading Reports...">
      {/* Header Card */}
      <div
        className="tab-skeleton-card"
        style={{
          padding: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="clima-shimmer" style={{ width: 130, height: 24, borderRadius: 8 }} />
          <div className="clima-shimmer" style={{ width: 190, height: 14, borderRadius: 6 }} />
        </div>
        <div className="clima-shimmer" style={{ width: 70, height: 30, borderRadius: 16 }} />
      </div>

      {/* Filter Tabs Row */}
      <div style={{ display: "flex", gap: 8, overflowX: "hidden" }}>
        {[70, 85, 100, 85].map((w, i) => (
          <div
            key={i}
            className="tab-skeleton-card clima-shimmer"
            style={{ width: w, height: 34, borderRadius: 20 }}
          />
        ))}
      </div>

      {/* Report Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="tab-skeleton-card reports-skeleton-card-item">
            <div
              className="clima-shimmer"
              style={{ width: 76, height: 76, borderRadius: 16, flexShrink: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="clima-shimmer" style={{ width: 75, height: 18, borderRadius: 10 }} />
                <div className="clima-shimmer" style={{ width: 60, height: 12, borderRadius: 6 }} />
              </div>
              <div className="clima-shimmer" style={{ width: "80%", height: 16, borderRadius: 6 }} />
              <div className="clima-shimmer" style={{ width: "50%", height: 12, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. LEGAL TAB SKELETON
// ─────────────────────────────────────────────────────────────
export function LegalTabSkeleton() {
  return (
    <div className="tab-skeleton-wrapper hide-scroll" aria-label="Loading Legal Documents...">
      <div className="legal-skeleton-container">
        {/* Header with Title and Tab Switchers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <div className="clima-shimmer" style={{ width: 220, height: 32, borderRadius: 10 }} />
          <div style={{ display: "flex", gap: 10 }}>
            {[100, 110, 120].map((w, i) => (
              <div key={i} className="clima-shimmer" style={{ width: w, height: 36, borderRadius: 20 }} />
            ))}
          </div>
        </div>

        {/* Content Document Card */}
        <div className="tab-skeleton-card" style={{ padding: 28, borderRadius: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="clima-shimmer" style={{ width: 180, height: 22, borderRadius: 8 }} />
          <div className="clima-shimmer" style={{ width: "95%", height: 14, borderRadius: 6 }} />
          <div className="clima-shimmer" style={{ width: "90%", height: 14, borderRadius: 6 }} />
          <div className="clima-shimmer" style={{ width: "80%", height: 14, borderRadius: 6 }} />
          <div className="clima-shimmer" style={{ width: "65%", height: 14, borderRadius: 6 }} />
          <div style={{ height: 10 }} />
          <div className="clima-shimmer" style={{ width: 160, height: 20, borderRadius: 8 }} />
          <div className="clima-shimmer" style={{ width: "92%", height: 14, borderRadius: 6 }} />
          <div className="clima-shimmer" style={{ width: "88%", height: 14, borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. UNIVERSAL TAB SKELETON ROUTER
// ─────────────────────────────────────────────────────────────
export default function TabSkeleton({ tab = "home" }) {
  switch (tab) {
    case "home":
      return <HomeTabSkeleton />;
    case "maps":
      return <MapTabSkeleton />;
    case "elnino":
      return <ElNinoTabSkeleton />;
    case "about":
      return <AboutTabSkeleton />;
    case "profile":
      return <ProfileTabSkeleton />;
    case "reports":
      return <MyReportsTabSkeleton />;
    case "legal":
      return <LegalTabSkeleton />;
    default:
      return <HomeTabSkeleton />;
  }
}
