const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'screens', 'AdminMapScreen.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Replace the Z palette to match the dark farming UI theme
const newZ = `const Z = {
  950: "#ffffff",
  900: "#e5dca7", // yellowish/gold text
  800: "#d3d3d3",
  700: "#a0a0a0",
  600: "#8ca885", // muted green
  500: "#606060",
  400: "#52604d", 
  300: "#344530", // borders
  200: "#202d1d", // card backgrounds
  100: "#182416", // sidebar background
  50: "#111c10",  // darkest background
};`;
content = content.replace(/const Z = {[\s\S]*?};/, newZ);

// 2. Change map style to satellite by default
content = content.replace(/useState\("streets-v12"\)/g, 'useState("satellite-streets-v12")');

// 3. Make sidebar dark
content = content.replace(/background: "white"/g, 'background: Z[100]');
content = content.replace(/color: Z\[900\]/g, 'color: Z[950]'); // Text that was black is now white
content = content.replace(/color: Z\[400\]/g, 'color: Z[700]'); // Text that was gray is now lighter gray

// 4. Inject Recharts import
if (!content.includes('recharts')) {
  content = content.replace(
    /import \{ supabase \} from "\.\.\/lib\/supabase";/,
    `import { supabase } from "../lib/supabase";\nimport { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";`
  );
}

// 5. Inject a bottom panel with graph inside the main div, right before closing </AnimatePresence> tag
const graphDataMock = `
  const graphData = [
    { name: 'Apr', pending: 12, resolved: 10 },
    { name: 'May', pending: 15, resolved: 22 },
    { name: 'Jun', pending: 8,  resolved: 30 },
    { name: 'Jul', pending: 20, resolved: 18 },
    { name: 'Aug', pending: 10, resolved: 35 },
    { name: 'Sep', pending: 5,  resolved: 40 },
    { name: 'Oct', pending: 18, resolved: 25 },
  ];
`;

if (!content.includes('graphData')) {
  content = content.replace(
    /const fetchReports = useCallback/,
    `${graphDataMock}\n  const fetchReports = useCallback`
  );
}

const bottomPanelCode = `
      {/* BOTTOM PANEL - GRAPH */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              bottom: 12,
              left: 344, // Beside the sidebar
              right: 12,
              height: 180,
              zIndex: 15,
              background: "rgba(24, 36, 22, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: 20,
              border: \`1px solid \${Z[300]}\`,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column"
            }}
            className="bottom-panel"
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: Z[950], fontSize: 14, fontWeight: 700 }}>Reports Over Time</h3>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: Z[700], fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{width: 8, height: 8, borderRadius: 2, background: "#ef4444"}}/> Pending</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{width: 8, height: 8, borderRadius: 2, background: "#22c55e"}}/> Resolved</span>
              </div>
            </div>
            <div style={{ flex: 1, width: "100%", minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fill: Z[600], fontSize: 11}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: Z[600], fontSize: 11}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: Z[200], border: 'none', borderRadius: 8, color: '#fff' }} itemStyle={{color: '#fff'}} />
                  <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;

if (!content.includes('BOTTOM PANEL - GRAPH')) {
  // Find where to inject. The end of the file is just before the last AnimatePresence and Lightbox.
  // Actually, inserting it before {/* Lightbox */} is safe.
  content = content.replace(
    /\{\/\* Lightbox \*\/\}/,
    `${bottomPanelCode}\n\n      {/* Lightbox */}`
  );
}

// Make it mobile responsive via CSS injection
const cssFix = `
  const responsiveStyle = document.createElement('style');
  responsiveStyle.innerHTML = \`
    @media (max-width: 768px) {
      .bottom-panel {
        left: 12px !important;
        bottom: 12px !important;
        height: 140px !important;
      }
      .sidebar {
        width: calc(100% - 24px) !important;
        height: 40vh !important;
        bottom: 160px !important;
        top: auto !important;
      }
      .mapboxgl-popup-content {
        background: \${Z[100]} !important;
        color: \${Z[950]} !important;
      }
    }
  \`;
  document.head.appendChild(responsiveStyle);
`;

if (!content.includes('responsiveStyle')) {
  content = content.replace(
    /useEffect\(\(\) => \{[\s\S]*?fetchReports\(\);\n  \}, \[fetchReports\]\);/,
    `useEffect(() => {\n    fetchReports();\n    ${cssFix}\n  }, [fetchReports]);`
  );
}

// We need to inject the "sidebar" class into the sidebar motion.div
content = content.replace(
  /boxShadow: "0 25px 50px -12px rgba\(0,0,0,0\.25\)",\n\s*\}\}/,
  `boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",\n            }}\n            className="sidebar"`
);

// We need to make the close button on the sidebar visible on mobile, or just let them collapse it using a gesture. 
// For now, styling will make it look great.

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully applied dark theme and bottom panel to AdminMapScreen.jsx');
