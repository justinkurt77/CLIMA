import { logger } from "./logger";

export const PIN_CATEGORIES = {
  water: {
    id: "water",
    label: "Water Facilities",
    icon: "Droplets",
    color: "#0284c7",
    bg: "rgba(2, 132, 199, 0.15)",
    badgeColor: "#38bdf8",
    subTypes: [
      "Water Pumping Station",
      "Deep Well & Filtration",
      "Water Treatment Facility",
      "Water Storage Tank / Reservoir",
      "Irrigation Canal & Sluice Gate",
      "Flood Water Level Sensor",
    ],
  },
  hospital: {
    id: "hospital",
    label: "Hospitals & Medical",
    icon: "HeartPulse",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
    badgeColor: "#f87171",
    subTypes: [
      "District Hospital",
      "Rural Health Unit (RHU)",
      "Barangay Health Station",
      "Emergency & Trauma Clinic",
      "Maternity & Birthing Clinic",
      "Mobile Medical Triage",
    ],
  },
  fire: {
    id: "fire",
    label: "Fire Stations & Hydrants",
    icon: "Flame",
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.15)",
    badgeColor: "#fb923c",
    subTypes: [
      "BFP Central Fire Station",
      "BFP Substation",
      "High-Pressure Fire Hydrant",
      "Emergency Water Refill Point",
      "Volunteer Fire Brigade Post",
    ],
  },
  evacuation: {
    id: "evacuation",
    label: "Evacuation Centers",
    icon: "ShieldAlert",
    color: "#eab308",
    bg: "rgba(234, 179, 8, 0.15)",
    badgeColor: "#facc15",
    subTypes: [
      "City Evacuation Center",
      "Barangay Multi-Purpose Gym",
      "Designated Public School Shelter",
      "Covered Court Refuge",
      "Emergency Relief Distribution Hub",
    ],
  },
  police: {
    id: "police",
    label: "Police & Public Safety",
    icon: "ShieldCheck",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.15)",
    badgeColor: "#818cf8",
    subTypes: [
      "PNP City Police Station",
      "Police Community Precinct (PCP)",
      "Security & Border Checkpoint",
      "CDRRMO Disaster Command Base",
      "Public Safety Outpost",
    ],
  },
  power: {
    id: "power",
    label: "Power & Utilities",
    icon: "Zap",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.15)",
    badgeColor: "#a78bfa",
    subTypes: [
      "NEECO II Electric Substation",
      "Primary Distribution Transformer",
      "Solar Power Generation Hub",
      "Telecom Tower & Cell Site",
    ],
  },
  agriculture: {
    id: "agriculture",
    label: "Agriculture & Food Security",
    icon: "Sprout",
    color: "#16a34a",
    bg: "rgba(22, 163, 74, 0.15)",
    badgeColor: "#4ade80",
    subTypes: [
      "NIA Irrigation Engineering Office",
      "NFA Grain Warehouse & Silo",
      "Farmers Training Center",
      "City Abattoir / Slaughterhouse",
      "Agricultural Trading Depot",
    ],
  },
  government: {
    id: "government",
    label: "Government & Civic Centers",
    icon: "Landmark",
    color: "#0d9488",
    bg: "rgba(13, 148, 136, 0.15)",
    badgeColor: "#2dd4bf",
    subTypes: [
      "Palayan City Hall Complex",
      "Barangay Hall & Session Hall",
      "Provincial Capitol Center",
      "City Convention & Civic Center",
    ],
  },
  hazard: {
    id: "hazard",
    label: "Critical Hazard / Risk Zones",
    icon: "AlertTriangle",
    color: "#dc2626",
    bg: "rgba(220, 38, 38, 0.15)",
    badgeColor: "#f87171",
    subTypes: [
      "Flash Flood Danger Point",
      "Riverbank Soil Erosion Zone",
      "Extreme Heat Exposure Area",
      "High-Risk Road Junction",
    ],
  },
  other: {
    id: "other",
    label: "Other Facilities",
    icon: "MapPin",
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.15)",
    badgeColor: "#94a3b8",
    subTypes: [
      "Public Market",
      "Integrated Transport Terminal",
      "Community Cemetery",
      "General Infrastructure",
    ],
  },
};

export const PALAYAN_BARANGAYS = [
  "Aulo",
  "Bagong Buhay",
  "Bo. Militar",
  "Caimito",
  "Caballero",
  "Ganaderia",
  "Imelda Valley",
  "Langka",
  "Malate",
  "Manacnac",
  "Mapalad",
  "Marcos Village",
  "Militar",
  "Pag-asahan",
  "Palayan",
  "Popolon",
  "Santor",
  "Sapang Buho",
  "Singalat",
];

export const PIN_STATUSES = {
  operational: {
    id: "operational",
    label: "Operational",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.15)",
  },
  maintenance: {
    id: "maintenance",
    label: "Under Maintenance",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
  },
  offline: {
    id: "offline",
    label: "Offline / Critical",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
  },
  standby: {
    id: "standby",
    label: "Standby / Reserve",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
  },
};

const STORAGE_KEY = "clima_custom_pinned_locations_v2";

/**
 * Initial community facility pins - cleared to empty array for manual accurate placement
 */
const DEFAULT_SEED_PINS = [];

/**
 * Retrieve all pinned locations from localStorage.
 */
export function getPinnedLocations() {
  if (typeof window === "undefined") return [];
  try {
    // Clear legacy v1 seed cache if present so old mock pins are wiped
    if (localStorage.getItem("clima_custom_pinned_locations_v1")) {
      localStorage.removeItem("clima_custom_pinned_locations_v1");
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return parsed;
  } catch (err) {
    logger.warn("Failed to load pinned locations from storage:", err);
    return [];
  }
}

/**
 * Save or update a pinned location.
 */
export function savePinnedLocation(pinData) {
  if (typeof window === "undefined") return pinData;
  try {
    const current = getPinnedLocations();
    const now = new Date().toISOString();
    let updated;

    if (pinData.id) {
      // Update existing
      updated = current.map((p) =>
        p.id === pinData.id
          ? {
              ...p,
              ...pinData,
              updatedAt: now,
            }
          : p,
      );
    } else {
      // Insert new
      const newPin = {
        ...pinData,
        id: `pin-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      updated = [newPin, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dispatchPinnedLocationsChanged(updated);
    return updated;
  } catch (err) {
    logger.error("Failed to save pinned location:", err);
    throw err;
  }
}

/**
 * Update an existing pin by ID
 */
export function updatePinnedLocation(id, updates) {
  if (typeof window === "undefined") return [];
  try {
    const current = getPinnedLocations();
    const now = new Date().toISOString();
    const updated = current.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: now } : p,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dispatchPinnedLocationsChanged(updated);
    return updated;
  } catch (err) {
    logger.error("Failed to update pinned location:", err);
    throw err;
  }
}

/**
 * Delete a pinned location by ID
 */
export function deletePinnedLocation(id) {
  if (typeof window === "undefined") return [];
  try {
    const current = getPinnedLocations();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dispatchPinnedLocationsChanged(updated);
    return updated;
  } catch (err) {
    logger.error("Failed to delete pinned location:", err);
    throw err;
  }
}

/**
 * Reset pins back to default seeds
 */
export function resetPinnedLocations() {
  if (typeof window === "undefined") return DEFAULT_SEED_PINS;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED_PINS));
    dispatchPinnedLocationsChanged(DEFAULT_SEED_PINS);
    return DEFAULT_SEED_PINS;
  } catch (err) {
    logger.error("Failed to reset pinned locations:", err);
    return DEFAULT_SEED_PINS;
  }
}

/**
 * Custom event dispatcher so all components across screens update in real-time
 */
function dispatchPinnedLocationsChanged(pins) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("clima_pinned_locations_changed", { detail: pins }),
    );
  }
}

/**
 * React hook helper or subscriber
 */
export function subscribePinnedLocations(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = (event) => {
    callback(event.detail || getPinnedLocations());
  };
  window.addEventListener("clima_pinned_locations_changed", handler);
  // Also handle changes across browser tabs
  const storageHandler = (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getPinnedLocations());
    }
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener("clima_pinned_locations_changed", handler);
    window.removeEventListener("storage", storageHandler);
  };
}
