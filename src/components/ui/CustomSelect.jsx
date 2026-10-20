import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * CustomSelect - A fully styled dropdown replacement for <select>
 * with automatic light/dark mode adaptation and collision-aware positioning.
 *
 * Props:
 *   value       – current value
 *   onChange     – (newValue) => void
 *   options      – [{ value, label, color?, icon? }]
 *   placeholder  – placeholder text
 *   disabled     – disable the dropdown
 *   compact      – smaller size for inline usage
 *   accent       – accent color for active/hover states
 *   isDark       – optional boolean override for dark mode
 *   style        – extra styles on the container
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  disabled = false,
  compact = false,
  accent = "#18181b",
  isDark: propIsDark,
  style: extraStyle = {},
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);

  // Automatic theme detection
  let contextIsDark = false;
  try {
    const themeCtx = useTheme();
    if (themeCtx && typeof themeCtx.isDark === "boolean") {
      contextIsDark = themeCtx.isDark;
    }
  } catch {
    if (typeof document !== "undefined") {
      contextIsDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
    }
  }
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  // Selected item
  const selected = options.find((o) => o.value === value);

  // Fallback accent if in dark mode and default was dark zinc (#18181b)
  const effectiveAccent =
    isDark && (accent === "#18181b" || accent === "#09090b" || !accent)
      ? "#f59e0b"
      : accent;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Check collision with bottom of viewport when opening
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 250 && rect.top > 250) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [open]);

  // Scroll to selected item when opening
  useEffect(() => {
    if (open && listRef.current && selected) {
      const idx = options.findIndex((o) => o.value === value);
      const item = listRef.current.children[idx];
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [open]);

  const pad = compact ? "6px 28px 6px 10px" : "10px 36px 10px 14px";
  const fontSize = compact ? 12 : 14;
  const chevSize = compact ? 13 : 15;

  // Theme-tailored color values
  const bg = disabled
    ? isDark ? "#141416" : "#f9f9f9"
    : isDark ? "#18181b" : "#ffffff";

  const borderColor = open
    ? effectiveAccent
    : isDark ? "rgba(255, 255, 255, 0.15)" : "#e4e4e7";

  const textColor = selected
    ? isDark ? "#ffffff" : "#18181b"
    : isDark ? "#71717a" : "#a1a1aa";

  const shadow = open
    ? isDark
      ? `0 0 0 3px ${effectiveAccent}33, 0 2px 6px rgba(0,0,0,0.5)`
      : `0 0 0 3px ${effectiveAccent}18, 0 1px 3px rgba(0,0,0,0.06)`
    : isDark
      ? "0 1px 3px rgba(0,0,0,0.3)"
      : "0 1px 2px rgba(0,0,0,0.04)";

  const menuBg = isDark ? "#18181b" : "#ffffff";
  const menuBorder = isDark ? "rgba(255, 255, 255, 0.15)" : "#e4e4e7";
  const menuShadow = isDark
    ? "0 20px 45px rgba(0, 0, 0, 0.8), 0 6px 18px rgba(0, 0, 0, 0.6)"
    : "0 14px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)";

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: extraStyle.width || extraStyle.minWidth ? "inline-block" : "block",
        width: extraStyle.width || (extraStyle.minWidth ? "auto" : "100%"),
        zIndex: open ? 70 : "auto",
        ...extraStyle,
      }}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: pad,
          background: bg,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 10,
          fontSize,
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif",
          color: textColor,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
          boxShadow: shadow,
          opacity: disabled ? 0.5 : 1,
          boxSizing: "border-box",
          textAlign: "left",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minHeight: compact ? 32 : 42,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {selected?.color && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: selected.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${selected.color}44`,
              }}
            />
          )}
          {selected?.label || placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            color: isDark ? "#a1a1aa" : "#71717a",
          }}
        >
          <ChevronDown size={chevSize} strokeWidth={2.5} />
        </motion.span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: "absolute",
              top: openUpward ? "auto" : "calc(100% + 6px)",
              bottom: openUpward ? "calc(100% + 6px)" : "auto",
              left: 0,
              right: 0,
              minWidth: 160,
              zIndex: 99999,
              background: menuBg,
              border: `1px solid ${menuBorder}`,
              borderRadius: 12,
              padding: 5,
              boxShadow: menuShadow,
              maxHeight: 250,
              overflowY: "auto",
              overflowX: "hidden",
              colorScheme: isDark ? "dark" : "light",
            }}
          >
            {options.map((opt) => {
              const isActive = opt.value === value;
              const itemActiveBg = isDark ? `${effectiveAccent}26` : `${effectiveAccent}12`;
              const itemHoverBg = isDark ? "rgba(255, 255, 255, 0.08)" : "#f4f4f5";
              const itemTextColor = isActive
                ? effectiveAccent
                : isDark ? "#f4f4f5" : "#27272a";

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = itemHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: compact ? "7px 10px" : "9px 12px",
                    border: "none",
                    borderRadius: 8,
                    background: isActive ? itemActiveBg : "transparent",
                    color: itemTextColor,
                    fontSize: compact ? 12 : 13,
                    fontWeight: isActive ? 800 : 600,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    textAlign: "left",
                    boxSizing: "border-box",
                  }}
                >
                  {opt.color && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: opt.color,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${opt.color}44`,
                      }}
                    />
                  )}
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {isActive && (
                    <Check
                      size={14}
                      color={effectiveAccent}
                      strokeWidth={3}
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

