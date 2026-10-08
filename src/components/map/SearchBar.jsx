import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import {
  loadBarangayGeoJSON,
  PSA_NAME_MAP,
  BARANGAY_CENTROIDS,
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
  isPill,
}) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const dq = useDebounce(query, 350);

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
        // Search against both standard mapped name and raw DB name natively from GeoJSON
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
    // dynamically calculate bounding box from GeoJSON feature
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;

    // Support generic ring extraction
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
        { padding: 80, duration: 1500, essential: true, pitch: 0, bearing: 0 },
      );
    } else {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
    }

    onSearchSelect({ lng, lat, name, place: "Palayan City" });
    setQuery(name);
    setResults([]);
    setFocused(false);
    inputRef.current?.blur();
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
    <div style={{ position: "relative" }}>
      <div
        className="map-search"
        style={{
          borderRadius: showDropdown
            ? isPill
              ? "24px 24px 0 0"
              : "12px 12px 0 0"
            : isPill
              ? 40
              : 12,
          background: isDark ? "rgba(18, 18, 20, 0.94)" : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isDark
            ? `1px solid ${focused ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)"}`
            : `1px solid ${focused ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.08)"}`,
          boxShadow: isDark
            ? "0 6px 20px rgba(0,0,0,0.5)"
            : "0 6px 20px rgba(0,0,0,0.08)",
          transition: "border-color 0.2s",
          padding: isPill ? "8px 12px" : "10px 14px",
          height: isPill ? 56 : "auto",
        }}
      >
        {loading ? (
          <div
            style={{
              width: isPill ? 40 : 14,
              height: isPill ? 40 : 14,
              border: isDark
                ? "2px solid rgba(255,255,255,0.2)"
                : "2px solid rgba(0,0,0,0.15)",
              borderTopColor: isDark ? "white" : "#09090b",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              flexShrink: 0,
            }}
          />
        ) : isPill ? (
          <div
            style={{
              width: 40,
              height: 40,
              background: isDark ? "white" : "#09090b",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Search size={18} color={isDark ? "#000000" : "#ffffff"} />
          </div>
        ) : (
          <Search
            size={14}
            color={
              focused
                ? isDark
                  ? "white"
                  : "#09090b"
                : isDark
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(0,0,0,0.5)"
            }
          />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          placeholder="Search for a place..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "Nunito, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: isDark ? "white" : "#09090b",
            marginLeft: isPill ? 4 : 0,
          }}
        />
        {query && (
          <button
            onMouseDown={handleClear}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              lineHeight: 0,
            }}
          >
            <X
              size={16}
              color={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"}
            />
          </button>
        )}
      </div>
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: isDark ? "#121214" : "#ffffff",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.12)"
              : "1px solid rgba(0, 0, 0, 0.1)",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            boxShadow: isDark
              ? "0 12px 30px rgba(0,0,0,0.6)"
              : "0 12px 30px rgba(0,0,0,0.12)",
            overflow: "hidden",
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
              }}
            >
              Naghahanap…
            </div>
          )}
          {results.map((feat) => (
            <button
              key={feat.name}
              onMouseDown={() => handleSelect(feat)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderTop: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(0,0,0,0.06)",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = isDark
                  ? "#1c1c1f"
                  : "#f4f4f5")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <MapPin
                size={13}
                color={isDark ? "#ffffff" : "#09090b"}
                style={{ marginTop: 3, flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isDark ? "#ffffff" : "#09090b",
                  }}
                >
                  {feat.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: isDark ? "#a1a1aa" : "#71717a",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  Palayan City, Nueva Ecija
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
