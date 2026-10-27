const fs = require("fs");
let code = fs.readFileSync("./src/components/ui/ReportModal.jsx", "utf8");

if (!code.includes("import { Image as ImageIcon,")) {
  code = code.replace(
    /Camera, Loader, X, ChevronLeft } from "lucide-react"/,
    'Camera, Loader, X, ChevronLeft, Image as ImageIcon } from "lucide-react"',
  );
}

const newStep2 = `{step === 2 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 16px",
              paddingTop: "calc(20px + env(safe-area-inset-top, 0px))",
              display: "flex",
              alignItems: "center",
              position: "sticky",
              top: 0,
              background: "white",
              zIndex: 10,
            }}
          >
            <button
              onClick={() => setStep(1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <ChevronLeft size={24} strokeWidth={2} color="#000" />
            </button>
            <h1 style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#1a1108',
              margin: 0,
              flex: 1,
              textAlign: 'center',
              paddingRight: 28 
            }}>
              {selectedCategory}
            </h1>
          </div>

          <div className="hide-scroll" style={{ padding: "0 24px", paddingBottom: 110, flex: 1, overflowY: "auto" }}>
            
            {/* LOKASYON / Choose location */}
            <div style={{ marginBottom: 32 }}>
               <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2E2A27', marginBottom: 16 }}>Choose location</h2>
               
               <div 
                 onClick={locStatus !== 'loading' ? handleUseLocation : undefined}
                 style={{ 
                   height: 140, 
                   background: '#f0f0f0', 
                   borderRadius: 16, 
                   position: 'relative', 
                   overflow: 'hidden',
                   marginBottom: 16,
                   cursor: 'pointer'
                 }}
               >
                 {locStatus === 'loading' ? (
                   <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                     <Loader size={24} color="var(--red)" style={{ animation: "spin 0.8s linear infinite" }} />
                   </div>
                 ) : (
                   <>
                     <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#1a1108 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
                     
                     <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'center' }}>
                        <div style={{ background: 'white', padding: '12px 24px', borderRadius: 30, fontSize: 14, fontWeight: 700, color: '#2E2A27', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                          Change Pin <MapPin size={16} />
                        </div>
                     </div>
                   </>
                 )}
               </div>
               
               <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <MapPin size={22} color="#6b6560" style={{flexShrink: 0, marginTop: -2}} />
                  <div style={{ fontSize: 13, color: '#4A4A4A', lineHeight: 1.4, fontWeight: 600 }}>
                    {locStatus === 'idle' ? "Click 'Change Pin' to set location" : (locStatus === 'loading' ? 'Kinukuha ang lokasyon...' : location)}
                  </div>
               </div>
               {errors.location && <div style={{ color: "var(--orange)", fontSize: 11, marginTop: 4, fontWeight: 700 }}>⚠️ {errors.location}</div>}
            </div>

            {/* LARAWAN / Attach photo */}
            <div style={{ marginBottom: 32 }}>
               <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2E2A27', marginBottom: 16 }}>Attach your photo or video</h2>
               
               <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhotoChange} />
               {photoPreview ? (
                  <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", width: 140, height: 140 }}>
                    <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={14} color="white" />
                    </button>
                  </div>
               ) : (
                  <div 
                    onClick={() => fileRef.current?.click()}
                    style={{ 
                      width: 140, 
                      height: 140, 
                      border: '1.5px dashed #FA8E83', 
                      borderRadius: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      background: '#fffcfb'
                    }}
                  >
                     <ImageIcon size={32} color="#FA8E83" strokeWidth={1.5} />
                     <div style={{ fontSize: 12, color: '#FA8E83', textAlign: 'center', fontWeight: 600, padding: '0 16px', lineHeight: 1.2 }}>Add photo<br/>or video</div>
                  </div>
               )}
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: 32 }}>
               <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2E2A27', marginBottom: 16 }}>Tell us what happened</h2>
               <textarea
                  placeholder="Describe the incident in detail"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (e.target.value.trim()) setErrors((err) => ({ ...err, description: undefined }));
                  }}
                  style={{
                    width: '100%',
                    height: 120,
                    borderRadius: 16,
                    border: errors.description ? '1.5px solid var(--orange)' : '1px solid #EAEAEA',
                    padding: '16px',
                    fontSize: 14,
                    color: '#2E2A27',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                  }}
               />
               {errors.description && <div style={{ color: "var(--orange)", fontSize: 11, marginTop: 4, fontWeight: 700 }}>⚠️ {errors.description}</div>}
            </div>
          </div>

          {/* Bottom Fixed Area */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "16px 20px",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
              background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 20%)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "14px 16px",
                borderRadius: 30,
                background: "#fabdb4",
                color: "#ffffff",
                border: "none",
                fontSize: 16,
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "background 0.3s",
              }}
            >
              {isSubmitting ? "Sinisave..." : "Submit"}
            </button>
          </div>
        </div>
      )}`;

const startIndex = code.indexOf("{step === 2 && (");
const endIndex = code.lastIndexOf("</>");

if (startIndex !== -1 && endIndex !== -1) {
  const startCode = code.slice(0, startIndex);
  const endCode = code.slice(endIndex);
  code = startCode + newStep2 + "\n    " + endCode;
  fs.writeFileSync("./src/components/ui/ReportModal.jsx", code);
  console.log("Successfully replaced step 2.");
} else {
  console.log("Could not properly splice the text.");
}
