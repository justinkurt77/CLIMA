import { Moon, Sun, Globe } from "lucide-react";

export const SATELLITE_STYLE = "satellite-streets-v12";

export const MAP_STYLES = [
  { id: "dark-v11", label: "Dark Mode", Icon: Moon },
  { id: "streets-v12", label: "Light Mode", Icon: Sun },
  { id: SATELLITE_STYLE, label: "Satellite View", Icon: Globe },
];

/** Default basemap follows the app theme (same behaviour as the citizen-side map). */
export const themeMapStyle = (isDark) => (isDark ? "dark-v11" : "streets-v12");
