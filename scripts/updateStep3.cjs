const fs = require("fs");
let code = fs.readFileSync("./src/components/ui/ReportModal.jsx", "utf8");

// 1. Add new state for the detailed address
if (!code.includes('const [addressLine1, setAddressLine1] = useState("");')) {
  code = code.replace(
    /const \[step, setStep\] = useState\(1\);/,
    'const [step, setStep] = useState(1);\n  const [addressLine1, setAddressLine1] = useState("");\n  const [addressLine2, setAddressLine2] = useState("");\n  const [tempCoords, setTempCoords] = useState(null);\n  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";',
  );
}

// 2. Map import
if (!code.includes("import Map,")) {
  code = code.replace(
    /import \{ MapPin, Camera, Loader, X, ChevronLeft, Image as ImageIcon \} from "lucide-react";/,
    'import { MapPin, Camera, Loader, X, ChevronLeft, Image as ImageIcon, MapPinned, Crosshair } from "lucide-react";\nimport Map, { Marker } from "react-map-gl/mapbox";\nimport "mapbox-gl/dist/mapbox-gl.css";',
  );
}

// 3. Fix the Next button in Step 1 to fetch location automatically
if (!code.includes('if (locStatus === "idle") {')) {
  code = code.replace(
    /onClick=\{\(\) => setStep\(2\)\}/,
    'onClick={() => {\n                setStep(2);\n                if (locStatus === "idle") {\n                  handleUseLocation();\n                }\n              }}',
  );
}

// 4. Update the "Change Pin" pill in Step 2 to open Step 3, and fix styling slightly
code = code.replace(
  /<div\s+onClick=\{locStatus !== 'loading' \? handleUseLocation : undefined\}/,
  "<div \n                 onClick={() => { if (coords) { setTempCoords(coords); setStep(3); } else { handleUseLocation(); } }}",
);

// 5. Append step 3 block right before </>
const step3Block = `      {step === 3 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10001, background: "white", display: "flex", flexDirection: "column" }}>
          
          {/* Map Layer */}
          <div style={{ flex: 1, position: "relative" }}>
            <Map
              initialViewState={{
                longitude: tempCoords?.lng || coords?.lng || 121.0509,
                latitude: tempCoords?.lat || coords?.lat || 15.5415,
                zoom: 16.5
              }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              onMove={(e) => {
                setTempCoords({ lng: e.viewState.longitude, lat: e.viewState.latitude });
              }}
            />
            
            {/* Center Crosshair (Fixed Pin) */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', pointerEvents: 'none', filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.3))' }}>
              <MapPin size={46} color="#E74C3C" fill="#FFFFFF" strokeWidth={1.5} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3498DB', border: '2px solid white', position: 'absolute', bottom: -6, left: 17 }} />
            </div>
            
            {/* Top Left Back Button */}
            <div style={{ position: 'absolute', top: 20, top: 'calc(20px + env(safe-area-inset-top, 0px))', left: 16 }}>
               <button onClick={() => setStep(2)} style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', cursor: 'pointer' }}>
                 <ChevronLeft size={24} color="#000" />
               </button>
            </div>
            
            {/* Find my location float button */}
            <div style={{ position: 'absolute', bottom: 32, right: 16 }}>
               <button onClick={() => handleUseLocation()} style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', cursor: 'pointer' }}>
                 <Crosshair size={22} color="#1a1108" />
               </button>
            </div>
          </div>
          
          {/* Bottom Card */}
          <div style={{ background: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -10px 30px rgba(0,0,0,0.08)', position: 'relative', marginTop: -20, zIndex: 1, display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: 13, fontWeight: 800, textAlign: 'center', color: '#1a1108', marginBottom: 20 }}>Adjust your location</h3>
             
             <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={16} color="#4A4A4A" />
                </div>
                <div style={{ fontSize: 12, color: '#4A4A4A', lineHeight: 1.5, fontWeight: 600 }}>
                  <div style={{fontSize: 10, fontWeight: 800, color: 'var(--gray)', marginBottom: 2}}>NEAREST ADDRESS</div>
                  {location || "Drag map to select location"}
                </div>
             </div>
             
             <h4 style={{ fontSize: 13, fontWeight: 800, color: '#2E2A27', marginBottom: 12, textAlign: 'center' }}>Additional Address Details</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <input type="text" placeholder="Street / Road" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #EAEAEA', fontSize: 13, outline: 'none', color: '#2E2A27', fontFamily: 'inherit' }} />
                <input type="text" placeholder="Barangay / Village" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #EAEAEA', fontSize: 13, outline: 'none', color: '#2E2A27', fontFamily: 'inherit' }} />
             </div>
             
             <button onClick={() => {
                if (tempCoords) setCoords(tempCoords);
                const additions = [addressLine1, addressLine2].filter(Boolean).join(", ");
                if (additions) setLocation(prev => additions + ", " + prev);
                setStep(2);
             }} style={{ width: '100%', padding: '16px', borderRadius: 30, background: '#F25238', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 15px rgba(242, 82, 56, 0.3)' }}>
               Confirm Location
             </button>
          </div>
        </div>
      )}
    </>
`;

const endIndex = code.lastIndexOf("</>");
if (endIndex !== -1 && !code.includes("step === 3")) {
  code =
    code.substring(0, endIndex) + step3Block + code.substring(endIndex + 4);
  fs.writeFileSync("./src/components/ui/ReportModal.jsx", code);
  console.log("Appended step 3 successfully.");
} else {
  console.log("Error finding end or step 3 already exists.");
}
