const fs = require("fs");

try {
  const file = "src/screens/MapScreen.jsx";
  let content = fs.readFileSync(file, "utf8");

  const lines = content.split("\n");

  const newImports = `import SearchBar from "../components/map/SearchBar";
import { PinMarker, SearchPin } from "../components/map/MapPins";`;

  // Use string replace instead of splice to be safer
  // Find "function useDebounce" and "// ─── The core Map GL canvas"
  const startPattern = "function useDebounce";
  const endPattern = "// ─── The core Map GL canvas";

  const startIndex = lines.findIndex((l) => l.includes(startPattern));
  const endIndex = lines.findIndex((l) => l.includes(endPattern));

  if (startIndex !== -1 && endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex, newImports);
  }

  let newContent = lines.join("\n");

  newContent = newContent.replace(
    /userLocation=\{userLocation\}/,
    "userLocation={userLocation}\n            mapboxToken={MAPBOX_TOKEN}",
  );

  fs.writeFileSync(file, newContent);
  console.log("Successfully refactored MapScreen.jsx!");
} catch (e) {
  console.error(e);
}
