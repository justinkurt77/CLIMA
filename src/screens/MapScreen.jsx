import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  GeolocateControl,
  Layer,
  Source,
} from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Search,
  Plus,
  X,
  MapPin,
  LocateFixed,
  Navigation,
  Image,
  FileText,
  Calendar,
  MapPinned,
  Landmark,
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
  ChevronDown,
  Globe,
  Moon,
  Sun,
  Map as MapIcon,
  HeartPulse,
} from "lucide-react";

const ICON_MAP = {
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

const STATUS_COLORS = {
  pending: "#ffffff",
  inprogress: "#e4e4e7",
  resolved: "#a1a1aa",
  water: "#38bdf8",
  recreation: "#22c55e",
  health: "#ef4444",
  utility: "#f59e0b",
  government: "#a1a1aa",
};
const STATUS_BG = {
  pending: "rgba(255, 255, 255, 0.2)",
  inprogress: "rgba(255, 255, 255, 0.12)",
  resolved: "rgba(255, 255, 255, 0.08)",
  water: "rgba(56, 189, 248, 0.18)",
  recreation: "rgba(34, 197, 94, 0.18)",
  health: "rgba(239, 68, 68, 0.18)",
  utility: "rgba(245, 158, 11, 0.18)",
  government: "rgba(161, 161, 170, 0.18)",
};

const CLIMA_COMMUNITY_FACILITIES = [
  // Water Places
  { id: "wp1", name: "Aulo Dam", lat: 15.517876609612005, lng: 121.1165842455089, icon: "Droplet", pinColor: "#3B82F6", filterType: "water", contact: "09208125946", desc: "Tourist attraction" },
  { id: "wp2", name: "The Nest Resort & Campground", lat: 15.489973584331299, lng: 121.10963951359219, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "09171364116", desc: "Resort hotel" },
  { id: "wp3", name: "Fort Magsaysay Reservoir", lat: 15.413111, lng: 121.109845, icon: "Droplet", pinColor: "#3B82F6", filterType: "water", contact: "N/A", desc: "Reservoir" },
  { id: "wp4", name: "Villa Esmeralda Bryan's Resort Hotel and Restaurant", lat: 15.586414689864885, lng: 121.11623903883321, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Hotel" },
  { id: "wp5", name: "Carl Matthew's Resort", lat: 15.574579510490553, lng: 121.09566459318246, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "09688505624", desc: "Resort hotel" },
  { id: "wp6", name: "Nature Escape Farm and Resort", lat: 15.57867695647252, lng: 121.1255242506916, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "09284009629", desc: "Hotel" },
  { id: "wp7", name: "Binhi Nature Farm", lat: 15.584092161875324, lng: 121.13578154478633, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "09559220120", desc: "Farmstay" },
  { id: "wp8", name: "SUMMER VILLE FARM AND RESORT", lat: 15.592286705457264, lng: 121.12781604765748, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Hotel" },
  { id: "wp9", name: "Damian's Farm and Pool", lat: 15.590737, lng: 121.128343, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Resort hotel" },
  { id: "wp10", name: "Doña Josefa Bridge and River Park", lat: 15.428691067045309, lng: 121.14962575277522, icon: "Droplet", pinColor: "#3B82F6", filterType: "water", contact: "N/A", desc: "Tourist attraction" },
  { id: "wp11", name: "Fishing Spot", lat: 15.567804894232617, lng: 121.08898899761066, icon: "Droplet", pinColor: "#3B82F6", filterType: "water", contact: "N/A", desc: "Tourist attraction" },
  { id: "wp12", name: "R&S Abeleda's Private Resort", lat: 15.541400639670405, lng: 121.05464063799428, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "09230847749", desc: "Swimming pool" },
  { id: "wp13", name: "Rustic River Resort", lat: 15.578890432686926, lng: 121.09222089890493, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Villa" },
  { id: "wp14", name: "Villa Mikaella Private Resort", lat: 15.576062475813234, lng: 121.12068749754528, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "09171472741", desc: "Villa" },
  { id: "wp15", name: "Chloe Summer Resort", lat: 15.551626642367127, lng: 121.11347977096071, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Villa" },
  { id: "wp16", name: "Aves Resort", lat: 15.413869109977222, lng: 121.08296888922769, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Tourist attraction" },
  { id: "wp17", name: "Gato's Crib - The Lake House", lat: 15.569618776309095, lng: 121.09399552658115, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "0444638460", desc: "Resort hotel" },
  { id: "wp18", name: "Blue Sky Private Resort", lat: 15.530054707422712, lng: 121.05818567083095, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Ski resort" },
  { id: "wp19", name: "VELA Private Pool", lat: 14.362079864132907, lng: 121.3370099705361, icon: "Palmtree", pinColor: "#16a34a", filterType: "recreation", contact: "N/A", desc: "Homestay" },
  
  // Utility Services
  { id: "us1", name: "NEECO II Area 2 Palayan City Branch Office", lat: 15.54354600100982, lng: 121.08609465767155, icon: "Zap", pinColor: "#f59e0b", filterType: "utility", contact: "N/A", desc: "Electric utility company branch office" },
  { id: "us2", name: "Palayan City Water District", lat: 15.543611484504744, lng: 121.08411454397788, icon: "Zap", pinColor: "#f59e0b", filterType: "utility", contact: "09188074263", desc: "Water utility company" },
  { id: "us3", name: "Balibago Waterworks", lat: 15.563667717107219, lng: 121.10125996097958, icon: "Zap", pinColor: "#f59e0b", filterType: "utility", contact: "N/A", desc: "Water utility facility" },
  
  // Public Services & Government Offices
  { id: "ps1", name: "CDRRMO", lat: 15.559702386051606, lng: 121.09986385339798, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "09669109674", desc: "City Disaster Risk Reduction and Management Office" },
  { id: "ps2", name: "PCH", lat: 15.546288564337402, lng: 121.08874087581593, icon: "HeartPulse", pinColor: "#dc2626", filterType: "health", contact: "N/A", desc: "Palayan City Hospital" },
  { id: "ps3", name: "BFP", lat: 15.559549289187666, lng: 121.09959214158702, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Bureau of Fire Protection" },
  
  // Landmarks (gray dots, always visible - not filterable)
  { id: "lm1", name: "Bulwagan ng mga Katutubo, Bacao Reforestation", lat: 15.445006790219457, lng: 121.12659487316665, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Catholic church" },
  { id: "lm2", name: "Palayan City Mini-Park", lat: 15.540634807647502, lng: 121.07980971763624, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Park" },
  { id: "lm3", name: "Palayan City Plaza Conception", lat: 15.542007621587873, lng: 121.08566821450574, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Park" },
  { id: "lm4", name: "Palayan City Park", lat: 15.559201854690505, lng: 121.09869796044576, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Park" },
  { id: "lm5", name: "Provincial Government of Nueva Ecija", lat: 15.556540176741274, lng: 121.09516861659826, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Local government office" },
  { id: "lm6", name: "Central Business Hub", lat: 15.565424067232565, lng: 121.09771234275384, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Land planning authority" },
  { id: "lm7", name: "Nueva Ecija Convention Center", lat: 15.558247241224999, lng: 121.0979418073124, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "09633680185", desc: "Convention center" },
  { id: "lm8", name: "Sta. Cecilia Parish Church", lat: 15.542201550931459, lng: 121.08456810805654, icon: "Landmark", pinColor: "#71717a", filterType: "government", contact: "N/A", desc: "Catholic church" },
];

const buildingsLayer = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 14,
  paint: {
    "fill-extrusion-color": "#ffffff",
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["get", "min_height"],
    "fill-extrusion-opacity": 0.95,
    "fill-extrusion-ambient-occlusion-intensity": 0.5,
    "fill-extrusion-ambient-occlusion-radius": 4,
  },
};

import SearchBar from "../components/map/SearchBar";
import { PinMarker, SearchPin } from "../components/map/MapPins";
import { reverseGeocode } from "../components/ui/report/reportConstants";
import { MapOverlayActions } from "../components/map/MapOverlayActions";
import { CategoryListPanel } from "../components/map/CategoryListPanel";
import { MapPopupContent } from "../components/map/MapPopupContent";
import { PhotoLightbox } from "../components/map/PhotoLightbox";
import { DescriptionModal } from "../components/map/DescriptionModal";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { PALAYAN_KLOUDTECH_STATIONS, fetchKloudtechDashboard } from "../services/kloudtechService";
import { KloudtrackStationMarker } from "../components/map/KloudtrackStationMarker";
import { KloudtrackStationPopup } from "../components/map/KloudtrackStationPopup";
import { IOT_METRIC_CONFIG } from "../components/map/KloudtrackMapControls";
import {
  PIN_CATEGORIES,
  getPinnedLocations,
  subscribePinnedLocations,
} from "../lib/pinnedLocationsStorage";

function createGeoJSONCircle(center, radiusInKm, points = 64) {
  const [lng, lat] = center;
  const coords = { latitude: lat, longitude: lng };
  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [ret],
    },
    properties: {},
  };
}

function MapScreen({
  onOpenModal,
  userReports = [],
  showMapUI = true,
  userLocation,
  onMapDoubleClick,
  onPinClick,
  isMapFullView,
  isAdmin = false,
  activeScreen,
  isNavMinimized,
  refreshTrigger = 0,
}) {
  const { theme, isDark } = useTheme();
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchPin, setSearchPin] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [categoryListOpen, setCategoryListOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [popupGeo, setPopupGeo] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState([
    "water",
    "recreation",
    "health",
    "utility",
  ]);
  const [mapStyleId, setMapStyleId] = useState(isDark ? "dark-v11" : "streets-v12");
  const [isExiting, setIsExiting] = useState(false);
  const [barangayMarkers, setBarangayMarkers] = useState([]);
  const [selectedKloudtrackStation, setSelectedKloudtrackStation] = useState(null);
  const [activeMetric, setActiveMetric] = useState("heatIndex");
  const [weatherStations, setWeatherStations] = useState(PALAYAN_KLOUDTECH_STATIONS);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);
  const popupContentRef = useRef(null);
  const mapRef = useRef(null);
  const hasJumped = useRef(false);

  const [customPins, setCustomPins] = useState(() => getPinnedLocations());
  useEffect(() => {
    return subscribePinnedLocations((pins) => {
      setCustomPins(pins);
    });
  }, []);

  const mappedCustomFacilities = useMemo(() => {
    return customPins.map((p) => {
      const cat = PIN_CATEGORIES[p.category] || PIN_CATEGORIES.water;
      return {
        id: p.id,
        title: p.name,
        category: cat.label,
        filterType: p.category === "water" ? "water" : p.category === "hospital" || p.category === "fire" ? "health" : "recreation",
        status: p.status,
        statusLabel: `${cat.label} · ${p.subType || "Facility"}`,
        description: p.description || `${p.name} - Brgy. ${p.barangay}`,
        lat: Number(p.lat),
        lng: Number(p.lng),
        icon: cat.icon || "MapPin",
        pinColor: cat.color,
      };
    });
  }, [customPins]);

  // Layer Management States
  const [activeLayers, setActiveLayers] = useState({
    kloudtrackStations: true,
    stationCoverage: true,
    heatIndexCoverage: true,
    barangays: true,
    heatmap: false,
    reports: true,
    hospitals: false,
    fireStations: false,
    evacuationCenters: false,
    waterFacilities: false,
    powerFeeders: false,
    hotels: false,
    restaurants: false,
    attractions: false,
    waterPlaces: false,
    utilityServices: false,
    publicServices: false,
    landmarks: false,
  });

  // Coverage GeoJSON for all deployed KloudTech stations (Popolon, Sapang Buho, etc.)
  const stationCoverageGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: (weatherStations || [])
        .filter((s) => s.station?.location && Array.isArray(s.station.location))
        .map((s) => createGeoJSONCircle(s.station.location, 3.2)),
    };
  }, [weatherStations]);

  const heatIndexCoverageGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: (weatherStations || [])
        .filter((s) => s.station?.location && Array.isArray(s.station.location))
        .map((s) => createGeoJSONCircle(s.station.location, 1.8)),
    };
  }, [weatherStations]);

  // Data States for Dynamic Layers
  const [hospitals, setHospitals] = useState([]);
  const [tourismData, setTourismData] = useState({
    hotels: [],
    restaurants: [],
    attractions: [],
    waterPlaces: [],
    utilityServices: [],
    publicServices: [],
    landmarks: [],
  });

  useEffect(() => {
    setMapStyleId(isDark ? "dark-v11" : "streets-v12");
  }, [isDark]);

  const toggleLayer = (layerId) => {
    setActiveLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  // Fetch live weather data from KloudTech API
  const refreshWeatherData = useCallback(async () => {
    setIsLoadingWeather(true);
    try {
      const result = await fetchKloudtechDashboard();
      if (result.success && result.data) {
        setWeatherStations(result.data);
        setLastWeatherUpdate(new Date());
        logger.log(`✅ Weather data ${result.isLive ? 'LIVE' : 'FALLBACK'} updated:`, result.data);
      }
    } catch (error) {
      logger.error('Failed to refresh weather data:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // Auto-refresh weather data every 5 minutes AND on manual refresh trigger
  useEffect(() => {
    // Initial fetch or manual refresh triggered
    refreshWeatherData();

    // Set up auto-refresh interval (5 minutes = 300000ms)
    const refreshInterval = setInterval(() => {
      refreshWeatherData();
    }, 300000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [refreshWeatherData, refreshTrigger]);

  // Load Hospitals from Supabase
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const { data, error } = await supabase
          .from("hospitals")
          .select("*")
          .not("lat", "is", null)
          .not("lng", "is", null);
        
        if (error) throw error;
        setHospitals(data || []);
      } catch (err) {
        logger.error("Failed to load hospitals:", err);
      }
    };

    fetchHospitals();
  }, []);

  // Load Tourism Data
  useEffect(() => {
    const loadTourismData = async () => {
      try {
        const [
          hotelsRes,
          restaurantsRes,
          attractionsRes,
          waterPlacesRes,
          utilityServicesRes,
          publicServicesRes,
          landmarksRes
        ] = await Promise.all([
          fetch("/tourism-data/Hotels_14.json").then(r => r.json()).catch(() => ({ features: [] })),
          fetch("/tourism-data/Resto_8.json").then(r => r.json()).catch(() => ({ features: [] })),
          fetch("/tourism-data/Attraction_12.json").then(r => r.json()).catch(() => ({ features: [] })),
          fetch("/tourism-data/WaterPlaces_15.json").then(r => r.json()).catch(() => ({ features: [] })),
          fetch("/tourism-data/UtilityServices_16.json").then(r => r.json()).catch(() => ({ features: [] })),
          fetch("/tourism-data/PublicServices_17.json").then(r => r.json()).catch(() => ({ features: [] })),
          fetch("/tourism-data/Landmarks_18.json").then(r => r.json()).catch(() => ({ features: [] })),
        ]);

        setTourismData({
          hotels: hotelsRes.features || [],
          restaurants: restaurantsRes.features || [],
          attractions: attractionsRes.features || [],
          waterPlaces: waterPlacesRes.features || [],
          utilityServices: utilityServicesRes.features || [],
          publicServices: publicServicesRes.features || [],
          landmarks: landmarksRes.features || [],
        });
      } catch (err) {
        logger.error("Failed to load tourism data:", err);
      }
    };

    loadTourismData();
  }, []);

  const closePopup = () => {
    setIsExiting(true);
    
    // Also try to attach it manually in case React hasn't flushed to DOM yet
    const el = popupContentRef.current;
    if (el) {
      const popupWrapper = el.closest(".mapboxgl-popup");
      if (popupWrapper) popupWrapper.classList.add("popup-exiting");
      el.classList.add("popup-exiting");
    }

    setTimeout(() => {
      setSelectedReport(null);
      setPhotoModalOpen(false);
      setDescModalOpen(false);
      setDescExpanded(false);
      setIsExiting(false);
    }, 360);
  };

  const onMapLoad = useCallback((e) => {
    const map = e.target;

    // Update theme-color to match the map's land background so the Android
    // status bar blends seamlessly with the map.
    const statusBarColor = isDark ? "#121214" : "#f5f3f0";
    const themeColorMeta = document.querySelector(
      'meta[name="theme-color"]:not([media])',
    );
    if (themeColorMeta) themeColorMeta.content = statusBarColor;

    // Only apply custom pastel road & building colors on the light streets-v12 style
    if (mapStyleId === "streets-v12") {
      const roadColor = "#c8d4e0";
      const roadCasing = "#dce6ef";
      [
        "road-local",
        "road-minor",
        "road-street",
        "road-secondary-tertiary",
        "road-primary",
        "road-motorway-trunk",
      ].forEach((id) => {
        if (map.getLayer(id)) map.setPaintProperty(id, "line-color", roadColor);
      });
      [
        "road-local-case",
        "road-minor-case",
        "road-street-case",
        "road-secondary-tertiary-case",
        "road-primary-case",
        "road-motorway-trunk-case",
      ].forEach((id) => {
        if (map.getLayer(id)) map.setPaintProperty(id, "line-color", roadCasing);
      });
      if (map.getLayer("building")) {
        map.setPaintProperty("building", "fill-color", "#f5f3f0");
        map.setPaintProperty("building", "fill-outline-color", "#e8e4e0");
      }
    }
  }, [isDark, mapStyleId]);

  useEffect(() => {
    if (userLocation && mapRef.current && !hasJumped.current && !isAdmin) {
      mapRef.current.jumpTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 18.5,
      });
      hasJumped.current = true;
    }
  }, [userLocation, isAdmin]);

  useEffect(() => {
    fetch("/palayan-barangays.geojson")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.features) {
          const markers = data.features.map((f) => {
            // Calculate a simple bounding box center for the polygon
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const processCoords = (coords) => {
              for (const pt of coords) {
                if (typeof pt[0] === "number") {
                  minX = Math.min(minX, pt[0]);
                  maxX = Math.max(maxX, pt[0]);
                  minY = Math.min(minY, pt[1]);
                  maxY = Math.max(maxY, pt[1]);
                } else {
                  processCoords(pt);
                }
              }
            };
            processCoords(f.geometry.coordinates);
            
            return {
              id: f.properties.adm4_psgc,
              name: f.properties.adm4_en,
              lng: (minX + maxX) / 2,
              lat: (minY + maxY) / 2,
            };
          });
          setBarangayMarkers(markers);
        }
      })
      .catch((err) => logger.error("Failed to load barangay map:", err));
  }, []);

  // Overview View: Auto-fit bounds for Admin or Map Screen
  useEffect(() => {
    if (mapRef.current && (isAdmin || activeScreen === "maps")) {
      const pins = userReports.filter((r) => r.lat && r.lng);

      if (pins.length > 0) {
        const bounds = pins.reduce(
          (b, r) => b.extend([r.lng, r.lat]),
          new mapboxgl.LngLatBounds(),
        );

        mapRef.current.fitBounds(bounds, {
          padding: { top: 120, bottom: 60, left: 60, right: 60 },
          duration: 2500,
          maxZoom: 15,
          essential: true
        });
      } else {
        // Fallback to city center if no reports exist
        mapRef.current.flyTo({
          center: [121.0827, 15.5398],
          zoom: 12.5,
          pitch: 0,
          bearing: 0,
          duration: 2500,
          essential: true,
        });
      }
    }
  }, [isAdmin, activeScreen, userLocation, userReports]);

  const getReportFilterType = (r) => {
    const text = `${r.title || ""} ${r.category || ""} ${r.description || ""}`.toLowerCase();
    if (
      text.includes("water") ||
      text.includes("river") ||
      text.includes("creek") ||
      text.includes("drainage") ||
      text.includes("flood") ||
      text.includes("canal") ||
      text.includes("pump")
    ) {
      return "water";
    }
    if (
      text.includes("resort") ||
      text.includes("park") ||
      text.includes("tree") ||
      text.includes("plaza") ||
      text.includes("plant") ||
      text.includes("recreation")
    ) {
      return "recreation";
    }
    return "health";
  };

  const visibleFacilities = useMemo(() => {
    const combined = [...CLIMA_COMMUNITY_FACILITIES, ...mappedCustomFacilities];
    // Show government facilities always (not filterable), filter the rest
    return combined.filter((f) => f.filterType === "government" || activeFilters.includes(f.filterType));
  }, [mappedCustomFacilities, activeFilters]);

  const allReports = userReports.filter((r) => {
    const hasCoords = r.lat && r.lng;
    if (!hasCoords) return false;
    if (isAdmin) return true;
    const fType = getReportFilterType(r);
    return activeFilters.includes(fType);
  });

  // Generate heatmap GeoJSON from reports
  const heatmapGeoJSON = {
    type: "FeatureCollection",
    features: allReports.map((report) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [report.lng, report.lat],
      },
      properties: {
        weight: report.status === "pending" ? 3 : report.status === "inprogress" ? 2 : 1,
      },
    })),
  };

  // Reverse geocode and zoom whenever a pin is selected
  useEffect(() => {
    if (!selectedReport?.lat || !selectedReport?.lng) {
      setPopupGeo(null);
      return;
    }

    // Zoom in smoothly to the selected pin
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedReport.lng, selectedReport.lat],
        zoom: 18.2,
        pitch: 45,
        duration: 1200,
        essential: true,
      });
    }

    setPopupGeo(null);
    setDescExpanded(false); // collapse on new pin
    reverseGeocode(selectedReport.lat, selectedReport.lng)
      .then(({ barangay, road }) => setPopupGeo({ barangay, road }))
      .catch(() => setPopupGeo({}));
  }, [selectedReport?.id]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {showMapUI && (
          <div className="map-header">
            <div className="map-title">Report Map</div>
            <div className="map-search">
              <Search size={14} color="var(--gray)" />
              <span>Search for a place...</span>
            </div>
          </div>
        )}
        <div className="map-container">
          <div className="map-loading">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                color: "#ef4444",
              }}
            >
              <MapPin size={26} strokeWidth={2.2} />
            </div>
            <div className="map-loading-text">Mapbox Token Required</div>
            <div
              style={{
                fontSize: 12,
                color: "var(--gray)",
                textAlign: "center",
                maxWidth: 270,
                padding: "0 20px",
                lineHeight: 1.7,
              }}
            >
              Get a free token at{" "}
              <a
                href="https://account.mapbox.com/auth/signup/"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#2d8119", fontWeight: 700 }}
              >
                mapbox.com
              </a>{" "}
              and put it in <strong>VITE_MAPBOX_TOKEN</strong> in .env
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MapOverlayActions
        isMapFullView={isMapFullView}
        onOpenModal={onOpenModal}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        setSearchPin={setSearchPin}
        userLocation={userLocation}
        mapRef={mapRef}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        activeMetric={activeMetric}
        onSelectMetric={setActiveMetric}
        weatherStations={weatherStations}
        selectedStation={selectedKloudtrackStation}
        onSelectStation={(st) => {
          closePopup();
          setSelectedKloudtrackStation(st);
          if (st?.station?.location && Array.isArray(st.station.location) && mapRef.current) {
            mapRef.current.flyTo({
              center: [st.station.location[0], st.station.location[1]],
              zoom: 16.5,
              pitch: 45,
              duration: 1200,
            });
          }
        }}
        onCategoryClick={(categoryId) => {
          // Set only this category as active
          setActiveFilters([categoryId]);
          setSelectedCategory(categoryId);
          setCategoryListOpen(true);
        }}
      />

      {/* Category List Panel */}
      <CategoryListPanel
        isOpen={categoryListOpen}
        onClose={() => {
          setCategoryListOpen(false);
          setSelectedCategory(null);
          // Restore all filters when closing
          setActiveFilters(["water", "recreation", "health", "utility"]);
        }}
        category={selectedCategory}
        facilities={CLIMA_COMMUNITY_FACILITIES.filter(
          (f) => f.filterType === selectedCategory
        )}
        onSelectFacility={(facility) => {
          // Transform and show popup
          const categoryLabels = {
            water: "Water Place",
            recreation: "Recreation",
            health: "Health",
            government: "Government Office",
            utility: "Utility Service",
          };
          const facilityAsReport = {
            ...facility,
            title: facility.name,
            status: facility.filterType,
            statusLabel: categoryLabels[facility.filterType] || facility.filterType,
            description: null,
            isFacility: true,
            facilityDesc: facility.desc,
            facilityContact: facility.contact !== "N/A" ? facility.contact : null,
          };
          setSelectedReport(facilityAsReport);
          setIsExiting(false);
          // Fly to facility
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [facility.lng, facility.lat],
              zoom: 18.2,
              pitch: 45,
              duration: 1200,
              essential: true,
            });
          }
        }}
        selectedFacilityId={selectedReport?.id}
      />

      <div className="map-container" style={{ position: "absolute", inset: 0 }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: userLocation?.lng || 121.085,
            latitude: userLocation?.lat || 15.545,
            zoom: userLocation ? 16.5 : 13.8,
            pitch: userLocation ? 45 : 25,
            bearing: -10,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={`mapbox://styles/mapbox/${mapStyleId}`}
          onLoad={onMapLoad}
          attributionControl={false}
          antialias={false}
          fadeDuration={0}
          trackResize={true}
          onDblClick={(e) => {
            e.originalEvent.preventDefault();
            if (onMapDoubleClick) onMapDoubleClick();
            closePopup();
            if (mapRef.current) {
              const zoom = mapRef.current.getZoom();
              mapRef.current.flyTo({
                zoom: zoom >= 18 ? 16 : 18.5,
                duration: 800,
              });
            }
          }}
          doubleClickZoom={false}
        >
          {showMapUI && (
            <>
              {/* Removed Mapbox default controls to prefer custom mobile UI */}
            </>
          )}
          {mapStyleId === "streets-v12" && <Layer {...buildingsLayer} />}

          {/* Barangay Boundaries */}
          {activeLayers.barangays && (
            <Source
              id="palayan-barangays"
              type="geojson"
              data="/palayan-barangays.geojson"
            >
              <Layer
                id="barangay-outlines"
                type="line"
                paint={{
                  "line-color": mapStyleId === "dark-v11" ? "#ffffff" : mapStyleId === "streets-v12" ? "#000000" : "#4ADE80",
                  "line-width": 1.5,
                  "line-opacity": mapStyleId === "dark-v11" ? 0.6 : 0.75,
                  "line-dasharray": [3, 2],
                }}
              />
            </Source>
          )}

          {/* KloudTrack Station Coverage (3.2km IoT range) */}
          {activeLayers.stationCoverage && (
            <Source id="kloudtrack-station-coverage" type="geojson" data={stationCoverageGeoJSON}>
              <Layer
                id="station-coverage-fill"
                type="fill"
                paint={{
                  "fill-color": IOT_METRIC_CONFIG[activeMetric]?.fillColor || "#3B82F6",
                  "fill-opacity": 0.08,
                }}
              />
              <Layer
                id="station-coverage-stroke"
                type="line"
                paint={{
                  "line-color": IOT_METRIC_CONFIG[activeMetric]?.color || "#3B82F6",
                  "line-width": 1.5,
                  "line-opacity": 0.45,
                  "line-dasharray": [4, 3],
                }}
              />
            </Source>
          )}

          {/* KloudTrack Active Metric Severity Zone (1.8km radius) */}
          {activeLayers.heatIndexCoverage && (
            <Source id="kloudtrack-heat-coverage" type="geojson" data={heatIndexCoverageGeoJSON}>
              <Layer
                id="heat-coverage-fill"
                type="fill"
                paint={{
                  "fill-color": IOT_METRIC_CONFIG[activeMetric]?.fillColor || "#EF4444",
                  "fill-opacity": 0.14,
                }}
              />
              <Layer
                id="heat-coverage-stroke"
                type="line"
                paint={{
                  "line-color": IOT_METRIC_CONFIG[activeMetric]?.color || "#EF4444",
                  "line-width": 2,
                  "line-opacity": 0.75,
                  "line-dasharray": [2, 2],
                }}
              />
            </Source>
          )}

          {/* Incident Heatmap Layer */}
          {activeLayers.heatmap && allReports.length > 0 && (
            <Source
              id="incident-heatmap"
              type="geojson"
              data={heatmapGeoJSON}
            >
              <Layer
                id="heatmap-layer"
                type="heatmap"
                paint={{
                  // Increase weight as diameter breast height increases
                  "heatmap-weight": ["get", "weight"],
                  // Increase intensity as zoom level increases
                  "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 1,
                    15, 3
                  ],
                  // Color ramp for heatmap
                  "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0, "rgba(236, 222, 239, 0)",
                    0.2, "rgb(208, 209, 230)",
                    0.4, "rgb(166, 189, 219)",
                    0.6, "rgb(103, 169, 207)",
                    0.8, "rgb(28, 144, 153)",
                    1, "rgb(1, 108, 89)"
                  ],
                  // Radius of each heatmap point
                  "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 2,
                    15, 20
                  ],
                  // Transition from heatmap to circle layer
                  "heatmap-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    7, 1,
                    15, 0.8
                  ]
                }}
              />
            </Source>
          )}

          {/* Tourism: Hotels Layer */}
          {activeLayers.hotels && tourismData.hotels.length > 0 && (
            <Source
              id="tourism-hotels"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: tourismData.hotels,
              }}
            >
              <Layer
                id="hotels-layer"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#8B5CF6",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {/* Tourism: Restaurants Layer */}
          {activeLayers.restaurants && tourismData.restaurants.length > 0 && (
            <Source
              id="tourism-restaurants"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: tourismData.restaurants,
              }}
            >
              <Layer
                id="restaurants-layer"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#EC4899",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {/* Tourism: Attractions Layer */}
          {activeLayers.attractions && tourismData.attractions.length > 0 && (
            <Source
              id="tourism-attractions"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: tourismData.attractions,
              }}
            >
              <Layer
                id="attractions-layer"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#10B981",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {/* Tourism: Water Places Layer */}
          {activeLayers.waterPlaces && tourismData.waterPlaces.length > 0 && (
            <Source
              id="tourism-water-places"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: tourismData.waterPlaces,
              }}
            >
              <Layer
                id="water-places-layer"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#3B82F6",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {/* Tourism: Utility Services Layer */}
          {activeLayers.utilityServices && tourismData.utilityServices.length > 0 && (
            <Source
              id="tourism-utility-services"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: tourismData.utilityServices,
              }}
            >
              <Layer
                id="utility-services-layer"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#F59E0B",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {/* Tourism: Public Services Layer */}
          {activeLayers.publicServices && tourismData.publicServices.length > 0 && (
            <Source
              id="tourism-public-services"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: tourismData.publicServices,
              }}
            >
              <Layer
                id="public-services-layer"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#EF4444",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {/* Tourism: Landmarks Layer */}
          {activeLayers.landmarks && tourismData.landmarks.length > 0 && (
            <Source
              id="tourism-landmarks"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: tourismData.landmarks,
              }}
            >
              <Layer
                id="landmarks-layer"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color": "#A855F7",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                  "circle-opacity": 0.8,
                }}
              />
            </Source>
          )}

          {userLocation && (
            <Marker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
              anchor="center"
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  background: "#ffffff",
                  border: "3px solid #000000",
                  borderRadius: "50%",
                  boxShadow: "0 0 12px rgba(255,255,255,0.8)",
                }}
              />
            </Marker>
          )}

          {/* CLIMA Curated Facilities (Rivers & Water, Resorts & Recreation, Health & Emergency) */}
          {visibleFacilities.map((fac) => (
            <Marker
              key={fac.id}
              longitude={fac.lng}
              latitude={fac.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (selectedReport?.id === fac.id) {
                  closePopup();
                } else {
                  // Transform facility data to match report structure for popup display
                  const categoryLabels = {
                    water: "Water Place",
                    recreation: "Recreation",
                    health: "Health",
                    government: "Government Office",
                    utility: "Utility Service",
                  };
                  const facilityAsReport = {
                    ...fac,
                    title: fac.name,
                    status: fac.filterType,
                    statusLabel: categoryLabels[fac.filterType] || fac.filterType,
                    // Don't use description field - facilities will show details differently
                    description: null,
                    // Add facility-specific fields
                    isFacility: true,
                    facilityDesc: fac.desc,
                    facilityContact: fac.contact !== "N/A" ? fac.contact : null,
                  };
                  setSelectedReport(facilityAsReport);
                  setIsExiting(false);
                  if (onPinClick) onPinClick();
                }
              }}
            >
              <PinMarker
                color={fac.pinColor}
                icon={fac.icon}
              />
            </Marker>
          ))}

          {/* Report Pins - Only show if reports layer is active */}
          {activeLayers.reports && allReports.map((report) => (
            <Marker
              key={report.id}
              longitude={report.lng}
              latitude={report.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (selectedReport?.id === report.id) {
                  closePopup();
                } else {
                  setSelectedReport(report);
                  setIsExiting(false);
                  if (onPinClick) onPinClick();
                }
              }}
            >
              <PinMarker
                color={STATUS_COLORS[report.status] || STATUS_COLORS[getReportFilterType(report)] || "#ffffff"}
                icon={report.icon}
              />
            </Marker>
          ))}

          {/* Hospital Markers */}
          {activeLayers.hospitals && hospitals.map((hospital) => (
            <Marker
              key={`hospital-${hospital.id}`}
              longitude={hospital.lng}
              latitude={hospital.lat}
              anchor="bottom"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                title={hospital.name}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "#EF4444",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid #ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                >
                  <HeartPulse size={16} color="#ffffff" strokeWidth={2.4} />
                </div>
                <div
                  style={{
                    marginTop: 4,
                    padding: "2px 6px",
                    background: "rgba(239, 68, 68, 0.9)",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {hospital.name}
                </div>
              </div>
            </Marker>
          ))}

          {/* Barangay Name Markers */}
          {barangayMarkers.map((bgy) => (
            <Marker
              key={`bgy-${bgy.id}`}
              longitude={bgy.lng}
              latitude={bgy.lat}
              anchor="center"
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  color: mapStyleId === "dark-v11" ? "#ffffff" : mapStyleId === "satellite-streets-v12" ? "#ffffff" : "#1a1a1a",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  textShadow: mapStyleId === "streets-v12"
                    ? "0px 0px 4px white, 0px 0px 4px white"
                    : "0px 0px 6px rgba(0,0,0,1), 0px 0px 6px rgba(0,0,0,1), 0px 0px 3px rgba(0,0,0,0.8)",
                  letterSpacing: "0.4px",
                  whiteSpace: "nowrap",
                  opacity: 0.9,
                }}
              >
                {bgy.name}
              </div>
            </Marker>
          ))}

          {searchPin && (
            <Marker
              longitude={searchPin.lng}
              latitude={searchPin.lat}
              anchor="bottom"
            >
              <SearchPin />
            </Marker>
          )}

          {/* KloudTrack IoT Weather Stations */}
          {activeLayers.kloudtrackStations && weatherStations.map((station) => (
            <Marker
              key={station.station.id}
              longitude={station.station.location[0]}
              latitude={station.station.location[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                closePopup();
                setSelectedKloudtrackStation(station);
              }}
            >
              <KloudtrackStationMarker
                station={station}
                isSelected={selectedKloudtrackStation?.station?.id === station.station.id}
                onClick={(st) => {
                  closePopup();
                  setSelectedKloudtrackStation(st);
                }}
                isDark={isDark}
                activeMetric={activeMetric}
              />
            </Marker>
          ))}

          {/* KloudTrack Station Telemetry Popup */}
          {selectedKloudtrackStation && (
            <Popup
              longitude={selectedKloudtrackStation.station.location[0]}
              latitude={selectedKloudtrackStation.station.location[1]}
              anchor="top"
              offset={16}
              closeButton={false}
              closeOnClick={false}
              onClose={() => setSelectedKloudtrackStation(null)}
              maxWidth="360px"
              style={{ zIndex: 100, fontFamily: "Nunito, sans-serif" }}
            >
              <KloudtrackStationPopup
                station={selectedKloudtrackStation}
                onClose={() => setSelectedKloudtrackStation(null)}
                onFocusStation={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [
                        selectedKloudtrackStation.station.location[0],
                        selectedKloudtrackStation.station.location[1],
                      ],
                      zoom: 17.5,
                      pitch: 55,
                      bearing: -20,
                      duration: 1500,
                    });
                  }
                }}
                isDark={isDark}
                activeMetric={activeMetric}
                onSelectMetric={setActiveMetric}
              />
            </Popup>
          )}

          {selectedReport && (
            <Popup
              longitude={selectedReport.lng}
              latitude={selectedReport.lat}
              anchor="bottom"
              offset={46}
              closeButton={false}
              closeOnClick={false}
              onClose={closePopup}
              className={isExiting ? "popup-exiting" : ""}
              style={{ fontFamily: "Nunito, sans-serif" }}
              maxWidth="280px"
            >
              <MapPopupContent
                selectedReport={selectedReport}
                popupGeo={popupGeo}
                closePopup={closePopup}
                STATUS_BG={STATUS_BG}
                STATUS_COLORS={STATUS_COLORS}
                descExpanded={descExpanded}
                setDescExpanded={setDescExpanded}
                setPhotoModalOpen={setPhotoModalOpen}
                popupContentRef={popupContentRef}
              />
            </Popup>
          )}
        </Map>

        {/* Map Styles & Legend UI - Only visible in full map view */}
        {showMapUI && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(16px + env(safe-area-inset-bottom, 0px) + 58px + 10px + 64px + 10px)",
              right: 16,
              width: 64,
              zIndex: 9,
              opacity: isMapFullView ? 1 : 0,
              pointerEvents: isMapFullView ? "auto" : "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              transform: isMapFullView
                ? "scale(1) translateX(0)"
                : "scale(0.8) translateX(20px)",
              transition: "all 0.7s cubic-bezier(0.32, 0.72, 0, 1)",
              alignItems: "center",
            }}
          >
            {/* Map Styles Pill */}
            <div
              style={{
                background: isDark
                  ? "rgba(18, 18, 20, 0.94)"
                  : "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.12)"
                  : "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 40,
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: isDark
                  ? "0 10px 28px rgba(0,0,0,0.6)"
                  : "0 10px 28px rgba(0,0,0,0.12)",
                alignItems: "center",
                width: "100%",
              }}
            >
              {[
                { id: "dark-v11", Icon: Moon, title: "Dark Mode" },
                { id: "streets-v12", Icon: Sun, title: "Light Mode" },
                { id: "satellite-streets-v12", Icon: Globe, title: "Satellite View" },
              ].map((layer) => {
                const isActive = mapStyleId === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setMapStyleId(layer.id)}
                    title={layer.title}
                    aria-label={layer.title}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: isActive
                        ? "var(--accent-orange)"
                        : "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "0 4px 14px var(--accent-glow)"
                        : "none",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <layer.Icon
                      size={20}
                      color={
                        isActive
                          ? "#ffffff"
                          : isDark
                            ? "rgba(255,255,255,0.6)"
                            : "rgba(0,0,0,0.5)"
                      }
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FAB - only on Maps tab */}
        {showMapUI && (
          <>
            <button
              onClick={() => {
                if (userLocation && mapRef.current) {
                  mapRef.current.flyTo({
                    center: [userLocation.lng, userLocation.lat],
                    zoom: 17,
                    duration: 1200,
                  });
                }
              }}
              style={{
                position: "absolute",
                bottom:
                  "calc(16px + env(safe-area-inset-bottom, 0px) + 58px + 10px)",
                right: 16,
                width: 64,
                height: 64,
                background: isDark ? "#18181b" : "#ffffff",
                borderRadius: 28,
                boxShadow: isDark
                  ? "0 8px 24px rgba(0,0,0,0.5)"
                  : "0 8px 24px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.16)"
                  : "1px solid rgba(0,0,0,0.08)",
                zIndex: 10,
                opacity: isMapFullView ? 1 : 0,
                pointerEvents: isMapFullView ? "auto" : "none",
                transform: isMapFullView
                  ? "scale(1) translateX(0)"
                  : "scale(0.8) translateX(20px)",
                transition: "all 0.7s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
              aria-label="Back to my location"
            >
              <LocateFixed size={24} color={isDark ? "#ffffff" : "#09090b"} />
            </button>
          </>
        )}
      </div>

      <PhotoLightbox
        photoModalOpen={photoModalOpen}
        setPhotoModalOpen={setPhotoModalOpen}
        selectedReport={selectedReport}
      />

      <DescriptionModal
        descModalOpen={descModalOpen}
        setDescModalOpen={setDescModalOpen}
        selectedReport={selectedReport}
      />

    </div>
  );
}

export default MapScreen;
