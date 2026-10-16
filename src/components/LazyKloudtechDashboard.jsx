import React, { lazy, Suspense } from "react";
import { useInView } from "react-intersection-observer";

const KloudtechStationView = lazy(() => import("./KloudtechStationView"));

function DashboardSkeleton({ isDark = true }) {
  const bgCard = isDark ? "rgba(18, 20, 26, 0.65)" : "rgba(255, 255, 255, 0.7)";
  const borderCard = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const pulseColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

  return (
    <div
      style={{
        marginTop: 24,
        background: bgCard,
        border: `1px solid ${borderCard}`,
        borderRadius: 24,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 22,
        minHeight: 480,
        boxSizing: "border-box",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      aria-busy="true"
      aria-label="Loading meteorological dashboard"
    >
      {/* Top Banner Skeleton */}
      <div style={{ borderBottom: `1px solid ${borderCard}`, paddingBottom: 16 }}>
        <div
          style={{
            width: 160,
            height: 28,
            borderRadius: 8,
            background: pulseColor,
            marginBottom: 8,
            animation: "skeleton-pulse 1.6s infinite ease-in-out",
          }}
        />
        <div
          style={{
            width: 320,
            maxWidth: "90%",
            height: 14,
            borderRadius: 6,
            background: pulseColor,
            animation: "skeleton-pulse 1.6s infinite ease-in-out",
          }}
        />
      </div>

      {/* Station Title Skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div
            style={{
              width: 220,
              height: 22,
              borderRadius: 6,
              background: pulseColor,
              marginBottom: 6,
              animation: "skeleton-pulse 1.6s infinite ease-in-out",
            }}
          />
          <div
            style={{
              width: 360,
              maxWidth: "85%",
              height: 13,
              borderRadius: 4,
              background: pulseColor,
              animation: "skeleton-pulse 1.6s infinite ease-in-out",
            }}
          />
        </div>
        <div
          style={{
            width: 140,
            height: 18,
            borderRadius: 6,
            background: pulseColor,
            animation: "skeleton-pulse 1.6s infinite ease-in-out",
          }}
        />
      </div>

      {/* Metrics Row Skeleton (8 cards) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 12,
        }}
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              height: 104,
              borderRadius: 16,
              background: pulseColor,
              border: `1px solid ${borderCard}`,
              animation: `skeleton-pulse 1.6s infinite ease-in-out ${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Charts Grid Skeleton (2 cards) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          marginTop: 10,
        }}
      >
        <div
          style={{
            height: 240,
            borderRadius: 18,
            background: pulseColor,
            border: `1px solid ${borderCard}`,
            animation: "skeleton-pulse 1.6s infinite ease-in-out",
          }}
        />
        <div
          style={{
            height: 240,
            borderRadius: 18,
            background: pulseColor,
            border: `1px solid ${borderCard}`,
            animation: "skeleton-pulse 1.6s infinite ease-in-out 0.15s",
          }}
        />
      </div>
    </div>
  );
}

function LazyKloudtechDashboardComponent({ isDark = true, liveData = null }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "300px 0px", // Preload when within 300px of scrolling into view
  });

  return (
    <div ref={ref} style={{ width: "100%", minHeight: inView ? "auto" : 480 }}>
      {inView ? (
        <Suspense fallback={<DashboardSkeleton isDark={isDark} />}>
          <KloudtechStationView isDark={isDark} liveData={liveData} />
        </Suspense>
      ) : (
        <DashboardSkeleton isDark={isDark} />
      )}
    </div>
  );
}

export default React.memo(LazyKloudtechDashboardComponent);
