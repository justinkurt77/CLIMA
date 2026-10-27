import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  loadBarangayGeoJSON,
  PSA_NAME_MAP,
} from "../ui/report/reportConstants";
import { useTheme } from "../../context/ThemeContext";

export function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

export default function SearchBar({
  mapRef,
  onSearchSelect,
  userLocation,
  isOpen: externalIsOpen,
  onToggleOpen: externalOnToggleOpen,
}) {
  const inputRef = useRef(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onToggleOpen = externalOnToggleOpen || setInternalIsOpen;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const dq = useDebounce(query, 350);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!dq.trim() || dq.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    loadBarangayGeoJSON().then((geojson) => {
      const q = dq.toLowerCase();
      const matched = [];
      for (const feature of geojson.features) {
        const rawName = feature.properties.adm4_en;
        const name = PSA_NAME_MAP[rawName] || rawName;
        if (
          name.toLowerCase().includes(q) ||
          rawName.toLowerCase().includes(q)
        ) {
          matched.push({ feature, name });
        }
      }
      setResults(matched);
      setLoading(false);
    });
  }, [dq]);

  const handleSelect = ({ feature, name }) => {
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;

    const extractRings = (geom) => {
      if (geom.type === "Polygon") return geom.coordinates;
      if (geom.type === "MultiPolygon") return geom.coordinates.flat(1);
      return [];
    };

    const rings = extractRings(feature.geometry);
    for (const ring of rings) {
      for (const [x, y] of ring) {
        minLng = Math.min(minLng, x);
        maxLng = Math.max(maxLng, x);
        minLat = Math.min(minLat, y);
        maxLat = Math.max(maxLat, y);
      }
    }

    const lng = (minLng + maxLng) / 2;
    const lat = (minLat + maxLat) / 2;

    if (minLng !== Infinity) {
      mapRef.current?.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, duration: 1500, essential: true, pitch: 0, bearing: 0 }
      );
    } else {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
    }

    onSearchSelect({ lng, lat, name, place: "Palayan City" });
    setQuery(name);
    setResults([]);
    setFocused(false);
    onToggleOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    onSearchSelect(null);
    inputRef.current?.focus();
  };

  const { isDark } = useTheme();
  const showDropdown = focused && (loading || results.length > 0);

  return (
    <>
      {/* 1. Minimized Icon Button */}
      <button
        type="button"
        onClick={() => {
          onToggleOpen(true);
          setTimeout(() => {
            inputRef.current?.focus();
            setFocused(true);
          }, 80);
        }}
        className="map-search-icon-btn"
        style={{
          width: isMobile ? 42 : 56,
          height: isMobile ? 42 : 56,
          borderRadius: 40,
          background: isDark
            ? "rgba(18, 18, 20, 0.94)"
            : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isDark
            ? query
              ? "1.5px solid var(--accent-orange)"
              : "1px solid rgba(255, 255, 255, 0.12)"
            : query
              ? "1.5px solid var(--accent-orange)"
              : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDark
            ? query
              ? "0 4px 16px var(--accent-glow)"
              : "0 6px 20px rgba(0,0,0,0.5)"
            : query
              ? "0 4px 16px var(--accent-glow)"
              : "0 6px 20px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          flexShrink: 0,
          color: query ? "var(--accent-orange)" : isDark ? "#ffffff" : "#09090b",
          transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          padding: 0,
        }}
        title={query ? `Searched: ${query} (click to change)` : "Search barangay or place"}
        aria-label="Search barangay"
      >
        <Search size={isMobile ? 18 : 20} strokeWidth={query ? 2.5 : 2} />
        {query && (
          <span
            style={{
              position: "absolute",
              top: isMobile ? 6 : 8,
              right: isMobile ? 6 : 8,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent-orange)",
              boxShadow: "0 0 6px var(--accent-orange)",
            }}
          />
        )}
      </button>

      {/* 2. Full-Width Search Overlay Bar when Open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
            }}
          >
            <div
              className="map-search-expanded"
              style={{
                borderRadius: showDropdown
                  ? isMobile
                    ? "20px 20px 0 0"
                    : "24px 24px 0 0"
                  : 40,
                background: isDark
                  ? "rgba(18, 18, 20, 0.98)"
                  : "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.22)"
                  : "1px solid rgba(0, 0, 0, 0.14)",
                boxShadow: isDark
                  ? "0 12px 36px rgba(0,0,0,0.7)"
                  : "0 12px 36px rgba(0,0,0,0.15)",
                height: isMobile ? 42 : 56,
                display: "flex",
                alignItems: "center",
                padding: isMobile ? "0 8px 0 10px" : "0 14px 0 16px",
                gap: isMobile ? 8 : 10,
              }}
            >
              {/* Back / Close button */}
              <button
                type="button"
                onClick={() => onToggleOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
                  borderRadius: "50%",
                  transition: "all 0.15s ease",
                  lineHeight: 0,
                }}
                title="Close search"
                aria-label="Close search"
              >
                <ArrowLeft size={isMobile ? 18 : 20} strokeWidth={2.4} />
              </button>

              {/* Input field */}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onToggleOpen(false);
                  } else if (e.key === "Enter" && results.length > 0) {
                    handleSelect(results[0]);
                  }
                }}
                placeholder="Search barangay in Palayan..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "'Nohemi', sans-serif",
                  fontSize: isMobile ? 13.5 : 14.5,
                  fontWeight: 700,
                  color: isDark ? "#ffffff" : "#09090b",
                  minWidth: 0,
                }}
                autoFocus
              />

              {/* Loading Spinner */}
              {loading && (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: isDark
                      ? "2px solid rgba(255,255,255,0.2)"
                      : "2px solid rgba(0,0,0,0.15)",
                    borderTopColor: "var(--accent-orange)",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    flexShrink: 0,
                  }}
                />
              )}

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.06)",
                    border: "none",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                    color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                  title="Clear text"
                >
                  <X size={14} strokeWidth={2.4} />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: isDark
                    ? "rgba(18, 18, 20, 0.98)"
                    : "rgba(255, 255, 255, 0.99)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.18)"
                    : "1px solid rgba(0, 0, 0, 0.12)",
                  borderTop: "none",
                  borderRadius: isMobile ? "0 0 18px 18px" : "0 0 22px 22px",
                  boxShadow: isDark
                    ? "0 16px 40px rgba(0,0,0,0.7)"
                    : "0 16px 40px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  maxHeight: 280,
                  overflowY: "auto",
                  zIndex: 9999,
                }}
              >
                {loading && results.length === 0 && (
                  <div
                    style={{
                      padding: "12px 16px",
                      fontSize: 12,
                      color: isDark ? "#a1a1aa" : "#71717a",
                      fontWeight: 600,
                      fontFamily: "'Nohemi', sans-serif",
                    }}
                  >
                    Naghahanap ng barangay…
                  </div>
                )}
                {results.map((feat) => (
                  <button
                    key={feat.name}
                    type="button"
                    onMouseDown={() => handleSelect(feat)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: isMobile ? "10px 14px" : "12px 18px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      borderTop: isDark
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.05)",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "rgba(249, 115, 22, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MapPin
                        size={15}
                        color="var(--accent-orange)"
                        strokeWidth={2.4}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: isDark ? "#ffffff" : "#09090b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontFamily: "'Nohemi', sans-serif",
                        }}
                      >
                        {feat.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: isDark ? "#a1a1aa" : "#71717a",
                          marginTop: 1,
                          fontFamily: "'Nohemi', sans-serif",
                        }}
                      >
                        Palayan City, Nueva Ecija
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
