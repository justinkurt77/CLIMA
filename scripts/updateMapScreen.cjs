const fs = require("fs");
let code = fs.readFileSync("./src/screens/MapScreen.jsx", "utf8");

code = code.replace(
  /function MapScreen\(\{([\s\S]*?)\}\) \{/,
  "function MapScreen({\n  onOpenModal,\n  userReports = [],\n  showMapUI = true,\n  userLocation,\n  onMapDoubleClick,\n}) {",
);

code = code.replace(
  /<Map\s+([^>]*?)onLoad=\{onMapLoad\}([\s\S]*?)>/,
  "<Map\n          $1onLoad={onMapLoad}$2\n          onDblClick={(e) => { if (onMapDoubleClick) onMapDoubleClick(); }}>",
);

fs.writeFileSync("./src/screens/MapScreen.jsx", code);
console.log("Updated MapScreen");
