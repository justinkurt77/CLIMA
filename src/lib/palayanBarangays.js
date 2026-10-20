/**
 * Official Palayan City Barangays & Geographic Helpers
 * Centralized registry of all 19 barangays of Palayan City, Nueva Ecija
 */

export const PALAYAN_CITY_BARANGAYS = [
  "Atate",
  "Aulo",
  "Bagong Buhay",
  "Bo. Militar",
  "Caballero",
  "Caimito",
  "Doña Josefa",
  "Ganaderia",
  "Imelda Valley",
  "Langka",
  "Malate",
  "Maligaya",
  "Manacnac",
  "Mapait",
  "Marcos Village",
  "Popolon Pagas",
  "Santolan",
  "Sapang Buho",
  "Singalat",
];

/**
 * Verified approximate centroids for each barangay in Palayan City
 * (lng, lat) for Mapbox markers and bounds fitting
 */
export const PALAYAN_BARANGAY_CENTROIDS = {
  "Singalat": { lng: 121.0949, lat: 15.5717 },
  "Atate": { lng: 121.1121, lat: 15.5581 },
  "Caimito": { lng: 121.0875, lat: 15.5490 },
  "Ganaderia": { lng: 121.0903, lat: 15.5394 },
  "Caballero": { lng: 121.1066, lat: 15.5354 },
  "Santolan": { lng: 121.0894, lat: 15.5340 },
  "Manacnac": { lng: 121.0689, lat: 15.5286 },
  "Malate": { lng: 121.0776, lat: 15.5450 },
  "Aulo": { lng: 121.0939, lat: 15.5087 },
  "Mapait": { lng: 121.1108, lat: 15.5143 },
  "Marcos Village": { lng: 121.1096, lat: 15.5906 },
  "Imelda Valley": { lng: 121.1230, lat: 15.5742 },
  "Sapang Buho": { lng: 121.1283, lat: 15.5875 },
  "Popolon Pagas": { lng: 121.0471, lat: 15.5413 },
  "Maligaya": { lng: 121.1040, lat: 15.4753 },
  "Bagong Buhay": { lng: 121.1232, lat: 15.4590 },
  "Doña Josefa": { lng: 121.1081, lat: 15.4494 },
  "Bo. Militar": { lng: 121.1008, lat: 15.4237 },
  "Langka": { lng: 121.1521, lat: 15.4277 },
};

/**
 * Normalizes a barangay name for resilient matching.
 * e.g., "Brgy. Dona Josefa" -> "donajosefa", "Doña Josefa" -> "donajosefa"
 */
export function normalizeBarangayName(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics (ñ -> n)
    .replace(/^brgy\.?\s+/i, "")
    .replace(/^barangay\s+/i, "")
    .replace(/^bgy\.?\s+/i, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Checks if two barangay names match.
 */
export function matchesBarangay(a, b) {
  const normA = normalizeBarangayName(a);
  const normB = normalizeBarangayName(b);
  if (!normA || !normB) return false;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
}

/**
 * Parses a comma-separated string or array into an array of official Palayan City barangays.
 */
export function parseBarangayList(raw) {
  if (!raw) return [];
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
    ? raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const matched = new Set();
  items.forEach((item) => {
    const found = PALAYAN_CITY_BARANGAYS.find((bgy) => matchesBarangay(bgy, item));
    if (found) {
      matched.add(found);
    } else if (item && item.trim()) {
      matched.add(item.trim());
    }
  });

  return Array.from(matched);
}

/**
 * Searches an arbitrary text string (e.g. advisory headline, description)
 * for mentions of any of the 19 Palayan City barangays.
 */
export function extractBarangaysFromText(text) {
  if (!text || typeof text !== "string") return [];
  const found = new Set();
  const lower = text.toLowerCase();

  PALAYAN_CITY_BARANGAYS.forEach((bgy) => {
    const bgyLower = bgy.toLowerCase();
    const norm = normalizeBarangayName(bgy);
    if (
      lower.includes(bgyLower) ||
      (norm && lower.includes(norm)) ||
      (bgy === "Doña Josefa" && lower.includes("dona josefa")) ||
      (bgy === "Bo. Militar" && (lower.includes("barrio militar") || lower.includes("bo militar")))
    ) {
      found.add(bgy);
    }
  });

  return Array.from(found);
}
