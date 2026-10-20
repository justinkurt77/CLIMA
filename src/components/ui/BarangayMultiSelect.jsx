import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X, Search, MapPin, CheckSquare, Square } from "lucide-react";
import { PALAYAN_CITY_BARANGAYS } from "../../lib/palayanBarangays";

/**
 * BarangayMultiSelect - Modern, searchable multi-select checkbox dropdown
 * for selecting Palayan City barangays.
 *
 * Props:
 *   selected: string[] - array of selected barangay names
 *   onChange: (selected: string[]) => void
 *   isDark: boolean
 *   accent: string
 *   disabled: boolean
 *   placeholder: string
 */
export default function BarangayMultiSelect({
  selected = [],
  onChange,
  isDark = true,
  accent = "#f97316",
  disabled = false,
  error = false,
  placeholder = "Select affected Palayan barangays...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredBarangays = useMemo(() => {
    if (!searchQuery.trim()) return PALAYAN_CITY_BARANGAYS;
    const q = searchQuery.toLowerCase();
    return PALAYAN_CITY_BARANGAYS.filter((b) => b.toLowerCase().includes(q));
  }, [searchQuery]);

  const toggleBarangay = (name) => {
    if (disabled) return;
    if (selected.includes(name)) {
      onChange(selected.filter((item) => item !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([...PALAYAN_CITY_BARANGAYS]);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const removeSingle = (e, name) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selected.filter((item) => item !== name));
  };

  // Color tokens
  const colors = {
    bg: isDark ? "#18181b" : "#ffffff",
    border: isDark ? "rgba(255, 255, 255, 0.15)" : "#e4e4e7",
    text: isDark ? "#f4f4f5" : "#18181b",
    muted: isDark ? "#a1a1aa" : "#71717a",
    dropdownBg: isDark ? "#202024" : "#ffffff",
    itemHover: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
    itemActive: isDark ? "rgba(249, 115, 22, 0.18)" : "rgba(249, 115, 22, 0.12)",
    pillBg: isDark ? "rgba(249, 115, 22, 0.2)" : "rgba(249, 115, 22, 0.12)",
    pillBorder: isDark ? "rgba(249, 115, 22, 0.4)" : "rgba(249, 115, 22, 0.3)",
    pillText: isDark ? "#fb923c" : "#ea580c",
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", userSelect: "none" }}>
      {/* Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          minHeight: 46,
          padding: "8px 12px",
          borderRadius: 10,
          background: colors.bg,
          border: error ? "1.5px solid #ef4444" : `1.5px solid ${isOpen ? accent : colors.border}`,
          boxShadow: error ? "0 0 0 3px rgba(239, 68, 68, 0.25)" : isOpen ? `0 0 0 3px ${accent}22` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "all 0.2s ease",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", flex: 1 }}>
          {selected.length === 0 ? (
            <span style={{ color: colors.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color={colors.muted} />
              {placeholder}
            </span>
          ) : (
            <>
              {selected.slice(0, 4).map((name) => (
                <span
                  key={name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: colors.pillBg,
                    border: `1px solid ${colors.pillBorder}`,
                    color: colors.pillText,
                  }}
                >
                  {name}
                  <button
                    type="button"
                    onClick={(e) => removeSingle(e, name)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "inherit",
                    }}
                  >
                    <X size={12} strokeWidth={2.4} />
                  </button>
                </span>
              ))}
              {selected.length > 4 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 800,
                    background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                    color: colors.text,
                  }}
                >
                  +{selected.length - 4} more
                </span>
              )}
            </>
          )}
        </div>

        {/* Right Action Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {selected.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              title="Clear selection"
              style={{
                background: "none",
                border: "none",
                color: colors.muted,
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                borderRadius: 4,
              }}
            >
              <X size={14} />
            </button>
          )}
          <span
            style={{
              padding: "2px 7px",
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
              background: selected.length > 0 ? accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              color: selected.length > 0 ? "#ffffff" : colors.muted,
            }}
          >
            {selected.length} / {PALAYAN_CITY_BARANGAYS.length}
          </span>
          <ChevronDown
            size={16}
            color={colors.muted}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>
      </div>

      {/* Dropdown Menu Modal / Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: colors.dropdownBg,
              border: `1.5px solid ${colors.border}`,
              borderRadius: 12,
              boxShadow: isDark
                ? "0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)"
                : "0 12px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              zIndex: 9999,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search
                size={14}
                color={colors.muted}
                style={{ position: "absolute", left: 10, pointerEvents: "none" }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Palayan barangay..."
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 32px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: isDark ? "rgba(0, 0, 0, 0.25)" : "#f8f9fa",
                  color: colors.text,
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    background: "none",
                    border: "none",
                    color: colors.muted,
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Actions (Select All / Clear All) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 2px",
                borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                fontSize: 11.5,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={selectAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: accent,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  Select All ({PALAYAN_CITY_BARANGAYS.length})
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.muted,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  Deselect All
                </button>
              </div>
              <span style={{ color: colors.muted, fontWeight: 600 }}>
                {selected.length} selected
              </span>
            </div>

            {/* Checkbox List */}
            <div
              style={{
                maxHeight: 220,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                paddingRight: 2,
              }}
            >
              {filteredBarangays.length === 0 ? (
                <div
                  style={{
                    padding: "16px 10px",
                    textAlign: "center",
                    color: colors.muted,
                    fontSize: 12.5,
                  }}
                >
                  No barangay matching "{searchQuery}"
                </div>
              ) : (
                filteredBarangays.map((name) => {
                  const isChecked = selected.includes(name);
                  return (
                    <div
                      key={name}
                      onClick={() => toggleBarangay(name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 10px",
                        borderRadius: 8,
                        background: isChecked ? colors.itemActive : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isChecked) e.currentTarget.style.background = colors.itemHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!isChecked) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          border: `1.5px solid ${isChecked ? accent : colors.border}`,
                          background: isChecked ? accent : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          transition: "all 0.15s ease",
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? (isDark ? "#ffffff" : "#18181b") : colors.text,
                          flex: 1,
                        }}
                      >
                        {name}
                      </span>
                      {isChecked && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: accent,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Done button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 6,
                borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
              }}
            >
              <span style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>
                💡 Selected barangays will be highlighted on the live map
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: accent,
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
