import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Dynamically update theme-color to match the Mapbox map's land background
// so the Android status bar blends seamlessly with the map.
function updateThemeColor() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const color = isDark ? "#1a1f2e" : "#f5f3f0";
  let meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}
updateThemeColor();
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", updateThemeColor);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
