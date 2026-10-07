import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect — A fully styled dropdown replacement for <select>.
 *
 * Props:
 *   value       – current value
 *   onChange     – (newValue) => void
 *   options      – [{ value, label, color?, icon? }]
 *   placeholder  – placeholder text
 *   disabled     – disable the dropdown
 *   compact      – smaller size for inline usage
 *   accent       – accent color for active/hover states
 *   style        – extra styles on the trigger button
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  disabled = false,
  compact = false,
  accent = "#18181b",
  style: extraStyle = {},
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", ...extraStyle }}>
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
          background: disabled ? "#f9f9f9" : "#fff",
          border: `1.5px solid ${open ? accent : "#e4e4e7"}`,
          borderRadius: 10,
          fontSize,
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif",
          color: selected ? "#18181b" : "#a1a1aa",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: open
            ? `0 0 0 3px ${accent}18, 0 1px 3px rgba(0,0,0,0.06)`
            : "0 1px 2px rgba(0,0,0,0.04)",
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
            color: "#a1a1aa",
          }}
        >
          <ChevronDown size={chevSize} strokeWidth={2.5} />
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              minWidth: 160,
              zIndex: 9999,
              background: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: 12,
              padding: 4,
              boxShadow:
                "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
              maxHeight: 240,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "#f4f4f5";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: compact ? "7px 10px" : "9px 12px",
                    border: "none",
                    borderRadius: 8,
                    background: isActive ? `${accent}10` : "transparent",
                    color: isActive ? accent : "#27272a",
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
                      color={accent}
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
