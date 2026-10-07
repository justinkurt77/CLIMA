export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

import {
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
} from "lucide-react";

export const CATEGORY_GROUPS = [
  {
    name: "Public Safety",
    icon: ShieldAlert,
    iconName: "ShieldAlert",
    items: ["Obstructed Sidewalks", "Public Safety Concerns"],
  },
  {
    name: "General Services",
    icon: Wrench,
    iconName: "Wrench",
    items: [
      "New Streetlights Installation",
      "Streetlights for Repair",
      "Posters for Removal",
    ],
  },
  {
    name: "Solid Waste Management",
    icon: Trash2,
    iconName: "Trash2",
    items: [
      "Uncollected Garbage",
      "Hauling of Cut Tree or Trimmings",
      "Drainage Declogging",
      "Animal Road Kill",
    ],
  },
  {
    name: "Veterinary",
    icon: Dog,
    iconName: "Dog",
    items: [
      "Animal cruelty",
      "Stray animals",
      "Backyard slaughtering",
      "Sale of spoiled raw meat",
    ],
  },
  {
    name: "Engineering",
    icon: Construction,
    iconName: "Construction",
    items: [
      "Damaged pavement or potholes",
      "Damaged manhole",
      "Dangling wires",
    ],
  },
  {
    name: "Environment & Natural Resources",
    icon: TreePine,
    iconName: "TreePine",
    items: [
      "Overgrown Trees and Plants",
      "Illegal Cutting of Trees",
      "Wildlife for Rescue",
      "Air Polluting Vehicles & Industries",
      "Open Burning of Waste",
      "Clogged Natural Waterways",
      "Water Polluting Activities",
      "Disruptive Noisy Activities",
      "Odor from Agriculture & Industry",
      "Fly Problem from Piggery & Poultry",
    ],
  },
  {
    name: "Traffic Violations",
    icon: CarFront,
    iconName: "CarFront",
    items: [
      "Tricycle - Arrogant Behavior / Excessive Fare",
      "Tricycle - Overloading",
      "Tricycle - Unregistered",
      "Jeep - Arrogant Behavior / Excessive Fare / Refusal",
      "Jeep - Overloading",
      "Jeep - Plying Outside Specific Route",
      "Habal-habal",
      "Colorum/using Private Vehicle For Hire",
      "Truck Ban",
      "Obstructed",
      "Unregistered Vehicle",
      "Abandoning Vehicle",
      "Illegal Parking",
      "Reckless Driving",
      "Driving Against One Way",
      "Failure to Give Signal",
      "Non-compliance To Traffic Sign/Signal",
    ],
  },
];

export const PALAYAN_BARANGAYS = [
  "Atate",
  "Aulo",
  "Bagong Buhay",
  "Bo. Militar (Fort Magsaysay)",
  "Caballero (Poblacion)",
  "Caimito (Poblacion)",
  "Doña Josefa",
  "Ganaderia (Poblacion)",
  "Imelda Valley I",
  "Imelda Valley II",
  "Langka",
  "Malate (Poblacion)",
  "Maligaya",
  "Manacnac",
  "Mapaet/Mapait",
  "Marcos Village",
  "Popolon (Pagas)",
  "Santolan (Poblacion)",
  "Sapang Buho",
  "Singalat",
];

export const BARANGAY_CENTROIDS = [
  { name: "Atate", lat: 15.5541, lng: 121.1026 },
  { name: "Aulo", lat: 15.52, lng: 121.09 },
  { name: "Bagong Buhay", lat: 15.463, lng: 121.115 },
  { name: "Bo. Militar (Fort Magsaysay)", lat: 15.4152, lng: 121.0924 },
  { name: "Caballero (Poblacion)", lat: 15.56, lng: 121.095 },
  { name: "Caimito (Poblacion)", lat: 15.557, lng: 121.088 },
  { name: "Doña Josefa", lat: 15.434, lng: 121.136 },
  { name: "Ganaderia (Poblacion)", lat: 15.561, lng: 121.092 },
  { name: "Imelda Valley I", lat: 15.556, lng: 121.108 },
  { name: "Imelda Valley II", lat: 15.552, lng: 121.113 },
  { name: "Langka", lat: 15.4351, lng: 121.1611 },
  { name: "Malate (Poblacion)", lat: 15.568, lng: 121.108 },
  { name: "Maligaya", lat: 15.462, lng: 121.1 },
  { name: "Manacnac", lat: 15.528, lng: 121.063 },
  { name: "Mapaet/Mapait", lat: 15.51, lng: 121.103 },
  { name: "Marcos Village", lat: 15.586, lng: 121.118 },
  { name: "Popolon (Pagas)", lat: 15.558, lng: 121.096 },
  { name: "Santolan (Poblacion)", lat: 15.571, lng: 121.103 },
  { name: "Sapang Buho", lat: 15.575, lng: 121.107 },
  { name: "Singalat", lat: 15.5637, lng: 121.1003 },
];

export function nearestBarangay(lat, lng) {
  let best = null,
    bestDist = Infinity;
  for (const b of BARANGAY_CENTROIDS) {
    const d = (lat - b.lat) ** 2 + (lng - b.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = b.name;
    }
  }
  return best;
}

export let _barangayGeoJSON = null;
export async function loadBarangayGeoJSON() {
  if (_barangayGeoJSON) return _barangayGeoJSON;
  const res = await fetch("/palayan-barangays.geojson");
  _barangayGeoJSON = await res.json();
  return _barangayGeoJSON;
}

function pointInPolygon(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}

export const PSA_NAME_MAP = {
  "Bo. Militar": "Bo. Militar (Fort Magsaysay)",
  Ganaderia: "Ganaderia (Poblacion)",
  Malate: "Malate (Poblacion)",
  Caballero: "Caballero (Poblacion)",
  Caimito: "Caimito (Poblacion)",
  Santolan: "Santolan (Poblacion)",
  "Popolon Pagas": "Popolon (Pagas)",
  "Imelda Valley": "Imelda Valley I",
  Mapait: "Mapaet/Mapait",
};

function getBarangayFromGeoJSON(lat, lng, geojson) {
  for (const feature of geojson.features) {
    const ring = feature.geometry.coordinates[0];
    if (pointInPolygon(lng, lat, ring)) {
      const raw = feature.properties.adm4_en;
      return PSA_NAME_MAP[raw] || raw;
    }
  }
  return null;
}

export async function reverseGeocode(lat, lng) {
  let barangay = null;
  try {
    const geojson = await loadBarangayGeoJSON();
    barangay = getBarangayFromGeoJSON(lat, lng, geojson);
  } catch {
    /* user picks manually */
  }

  let road = "";
  let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  if (MAPBOX_TOKEN) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        road = feature.text || "";

        let city = "Palayan City";
        let province = "Nueva Ecija";
        if (feature.context) {
          for (const ctx of feature.context) {
            if (ctx.id.startsWith("place") || ctx.id.startsWith("locality")) {
              city = ctx.text;
            } else if (ctx.id.startsWith("region")) {
              province = ctx.text;
            }
          }
        }
        address = [road, barangay, city, province].filter(Boolean).join(", ");
      }
    } catch (err) {
      console.error("Mapbox geocoding error:", err);
    }
  }

  return { address, barangay, road };
}
