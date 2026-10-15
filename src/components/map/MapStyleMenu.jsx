import { MAP_STYLES } from "./mapStyles";

/**
 * Always-visible Dark / Light / Satellite switcher.
 * Same look-and-feel as the citizen-side map's style pill, sized for the admin toolbar.
 */
export default function MapStyleMenu({ mapStyleId, onSelectStyle, isDark = true, buttonSize = 32 }) {
  return (
    <div
      role="radiogroup"
      aria-label="Map style"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
    >
      {MAP_STYLES.map(({ id, label, Icon }) => {
        const isActive = mapStyleId === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => onSelectStyle(id)}
            style={{
              width: buttonSize,
              height: buttonSize,
              borderRadius: "50%",
              border: "none",
              background: isActive ? "linear-gradient(135deg, #f59e0b, #f97316)" : "transparent",
              boxShadow: isActive ? "0 4px 14px rgba(245, 158, 11, 0.45)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon
              size={Math.round(buttonSize * 0.5)}
              strokeWidth={isActive ? 2.5 : 2}
              color={isActive ? "#ffffff" : isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)"}
            />
          </button>
        );
      })}
    </div>
  );
}
