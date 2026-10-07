import { useState, useEffect, lazy, Suspense } from "react";
import CitizenNav from "./components/layout/CitizenNav";
import HomeScreen from "./screens/HomeScreen";
import MyReportsScreen from "./screens/MyReportsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EmergencyScreen from "./screens/EmergencyScreen";
import ReportModal from "./components/ui/ReportModal";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

// Lazy-load the map — only initialises Mapbox GL when user first taps "Maps"
const MapScreen = lazy(() => import("./screens/MapScreen"));
const AdminDashboard = lazy(() => import("./screens/AdminDashboard"));
const AdminMapScreen = lazy(() => import("./screens/AdminMapScreen"));
const AdminLogin = lazy(() => import("./screens/AdminLogin"));

import { supabase } from "./lib/supabase";

const GREEN = "#2d8119";
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{message}</div>;
}

import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [activeScreen, setActiveScreen] = useState(
    window.location.pathname === "/admin" ? "admin" : "home",
  );
  const isAdminView = activeScreen === "admin" || activeScreen === "admin-map";

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [mapVisited, setMapVisited] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isMapFullView, setIsMapFullView] = useState(false);
  const [isNavMinimized, setIsNavMinimized] = useState(false);
  const [session, setSession] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  // Capturing original pushState outside of effect to avoid double overrides
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const handleUrlChange = () => {
      const isAdmin = window.location.pathname === "/admin";
      if (isAdmin) setActiveScreen("admin");
      else if (window.location.pathname === "/") setActiveScreen("home");
    };

    window.addEventListener("popstate", handleUrlChange);

    window.history.pushState = function () {
      originalPushState.apply(this, arguments);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Restore admin session on reload
  useEffect(() => {
    if (isAdminAuthenticated || !isAdminView) return;

    const restoreAdmin = async () => {
      try {
        const { data: { session: current } } = await supabase.auth.getSession();
        if (!current?.user) return;

        const user = current.user;
        const sha256 = async (str) => {
          const buf = new TextEncoder().encode(str.toLowerCase().trim());
          const hash = await crypto.subtle.digest("SHA-256", buf);
          return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        };
        const userEmailHash = await sha256(user.email || "");
        const superadminsHashes = [
          '980f32df69a604ee31a4ca3a18cfea910de69ef3c496124dc8e19f76c4fa5686',
          'd9d660ee4195a6ac7e0b6a4a4aecbbbf9132683fa17e54383899a07b8671e484'
        ];
        const isSuper = superadminsHashes.includes(userEmailHash);
        let isAdmin = user.user_metadata?.role === 'admin';
        let assignedCategories = user.user_metadata?.assigned_categories || ["All Categories"];

        if (!isSuper && !isAdmin) return; // not an admin, don't restore

        let adminDepartment = null;
        if (!isSuper && assignedCategories && !assignedCategories.includes("All Categories")) {
          try {
            const { data: cats } = await supabase
              .from("categories")
              .select("department_id, departments(id, name, accent_color)")
              .in("name", assignedCategories)
              .limit(1);
            if (cats?.length > 0 && cats[0].departments) {
              adminDepartment = cats[0].departments;
            }
          } catch (e) { console.error("Dept lookup failed", e); }
        }

        setIsAdminAuthenticated(true);
        setAdminUser({ isSuperadmin: isSuper, adminCategories: assignedCategories, adminDepartment });
      } catch (e) {
        console.error("Admin session restore failed", e);
      }
    };

    restoreAdmin();
  }, [isAdminView]);

  // Fetch reports from Supabase when session changes
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoadingReports(true);
      try {
        let query = supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false });

        // Fetch all reports for the community map and dashboard

        const { data, error } = await query;

        if (error) throw error;

        const formatted = data.map((r) => {
          const rawUrl = r.photo_url;
          let photoPreviewsArray = null;
          let firstPreview = null;

          if (rawUrl) {
            if (typeof rawUrl === "string" && rawUrl.includes(",")) {
              photoPreviewsArray = rawUrl.split(",");
              firstPreview = photoPreviewsArray[0];
            } else {
              photoPreviewsArray = [rawUrl];
              firstPreview = rawUrl;
            }
          }

          return {
            ...r,
            id: r.id,
            createdAt: r.created_at,
            statusLabel: r.status_label,
            photoPreview: firstPreview,
            photoPreviews: photoPreviewsArray,
          };
        });
        setUserReports(formatted);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setIsLoadingReports(false);
      }
    };

    fetchReports();
  }, [session, isAdminView]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.log("Location error:", err);
          setUserLocation({ lat: 15.5398, lng: 121.0827 }); // Fallback to Palayan City
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 },
      );
      navigator.geolocation.watchPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 },
      );
    }
  }, []);

  useEffect(() => {
    if (activeScreen === "home" && !mapVisited) setMapVisited(true);
    // Reset map full view when switching screens to avoid disappearing UI
    if (activeScreen !== "home") {
      setIsMapFullView(false);
    }
  }, [activeScreen, mapVisited]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleSubmit = (newReport) => {
    setUserReports((prev) => [newReport, ...prev]);
  };

  const screenVariants = {
    initial: { opacity: 0, x: 20, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -20, scale: 0.98 },
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
  };

  return (
    <div
      className="app-shell"
      style={{
        maxWidth: isAdminView ? "none" : "480px",
        margin: isAdminView ? "0" : "0 auto",
        background: isAdminView ? "transparent" : "#111318",
      }}
    >
      {/* ADMIN LAYER (Handled as a screen now) */}

      {/* SCREENS LAYER */}
      <AnimatePresence mode="wait">
        {!isAdminView && activeScreen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              overflowY: "auto",
            }}
          >
            <HomeScreen
              onOpenModal={openModal}
              userReports={userReports}
              session={session}
              userLocation={userLocation}
              setActiveScreen={setActiveScreen}
            />
          </motion.div>
        )}

        {activeScreen === "emergency" && (
          <motion.div
            key="emergency"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenVariants.transition}
            className="screen active"
            style={{ zIndex: 10, background: "transparent", position: "absolute", inset: 0 }}
          >
            <EmergencyScreen />
          </motion.div>
        )}

        {activeScreen === "maps" && (
          <motion.div
            key="maps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
            }}
          >
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="map-loading" style={{ position: "relative", flex: 1 }}>
                    <div style={{ fontSize: 34, marginBottom: 6 }}>🗺️</div>
                    <div className="map-loading-text">Loading map...</div>
                  </div>
                }
              >
                <MapScreen
                  onOpenModal={openModal}
                  userReports={userReports}
                  showMapUI={true}
                  userLocation={userLocation}
                  isMapFullView={true}
                  onMapDoubleClick={() => {}}
                  onPinClick={() => {}}
                  isNavMinimized={false}
                  isAdmin={false}
                  activeScreen={activeScreen}
                />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}

        {activeScreen === "profile" && (
          <motion.div
            key="profile"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenVariants.transition}
            className="screen active"
            style={{
              zIndex: 10,
              background: "transparent",
            }}
          >
            <ProfileScreen
              onOpenModal={openModal}
              userReports={userReports}
              session={session}
              setActiveScreen={setActiveScreen}
            />
          </motion.div>
        )}

        {activeScreen === "admin" && (
          <motion.div
            key="admin"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenVariants.transition}
            className="screen active"
            style={{
              zIndex: 10,
              background: "transparent",
              overflowY: "auto",
              position: "fixed",
              inset: 0,
            }}
          >
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div
                    style={{ padding: 40, color: "#4B6043", fontWeight: 800 }}
                  >
                    Loading Console...
                  </div>
                }
              >
                {!isAdminAuthenticated ? (
                  <AdminLogin onLogin={(data) => {
                    setIsAdminAuthenticated(true);
                    setAdminUser(data);
                  }} />
                ) : (
                  <AdminDashboard
                    onLogout={() => {
                      setIsAdminAuthenticated(false);
                      setAdminUser(null);
                      supabase.auth.signOut();
                    }}
                    onMapOverview={() => setActiveScreen("admin-map")}
                    isSuperadmin={adminUser?.isSuperadmin}
                    adminCategories={adminUser?.adminCategories}
                    adminDepartment={adminUser?.adminDepartment}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}

        {activeScreen === "admin-map" && (
          <motion.div
            key="admin-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              zIndex: 10,
              position: "fixed",
              inset: 0,
            }}
          >
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div
                    style={{
                      height: "100vh",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#1a2612",
                      color: "white",
                      fontWeight: 800,
                    }}
                  >
                    Loading Map...
                  </div>
                }
              >
                {!isAdminAuthenticated ? (
                  <AdminLogin onLogin={(data) => {
                    setIsAdminAuthenticated(true);
                    setAdminUser(data);
                  }} />
                ) : (
                  <AdminMapScreen
                    onBackToDashboard={() => setActiveScreen("admin")}
                    onLogout={() => {
                      setIsAdminAuthenticated(false);
                      setAdminUser(null);
                      supabase.auth.signOut();
                    }}
                    isSuperadmin={adminUser?.isSuperadmin}
                    adminCategories={adminUser?.adminCategories}
                    adminDepartment={adminUser?.adminDepartment}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP — Background layer: only visible on admin views */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          opacity: isAdminView ? 1 : 0,
          pointerEvents: isAdminView ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      >
        <ErrorBoundary>
          <Suspense
            fallback={
              <div
                className="map-loading"
                style={{ position: "relative", flex: 1 }}
              >
                <div style={{ fontSize: 34, marginBottom: 6 }}>🗺️</div>
                <div className="map-loading-text">Loading map...</div>
              </div>
            }
          >
            <AnimatePresence mode="wait">
              {!userLocation ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f0ece8",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 80,
                      height: 80,
                      marginBottom: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 3],
                          opacity: [0.4, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: i * 0.6,
                        }}
                        style={{
                          position: "absolute",
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "#4B6043",
                        }}
                      />
                    ))}
                    {/* Core GPS Dot */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        position: "absolute",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#2d8119",
                        boxShadow: "0 0 12px rgba(45, 129, 25, 0.6)",
                        zIndex: 10,
                      }}
                    />
                  </div>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                    style={{
                      color: "#4B6043",
                      fontSize: 15,
                      fontWeight: 800,
                      fontFamily: "Nunito, sans-serif",
                      letterSpacing: 0.5,
                    }}
                  >
                    Locating you...
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <MapScreen
                    onOpenModal={openModal}
                    userReports={userReports}
                    showMapUI={activeScreen === "home" || activeScreen === "maps"}
                    userLocation={userLocation}
                    isMapFullView={isMapFullView || activeScreen === "maps"}
                    onMapDoubleClick={() => setIsMapFullView((prev) => !prev)}
                    onPinClick={() => setIsMapFullView(true)}
                    isNavMinimized={isNavMinimized}
                    isAdmin={isAdminView}
                    activeScreen={activeScreen}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Global Blur Overlay for non-Home Screens (Excluding Maps) */}
      <AnimatePresence>
        {activeScreen !== "home" &&
          activeScreen !== "maps" &&
          activeScreen !== "admin" &&
          activeScreen !== "admin-map" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.15)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 2, // Above map (1), below screens (10)
                pointerEvents: "none",
              }}
            />
          )}
      </AnimatePresence>

      {!isAdminView && (
        <CitizenNav
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
        />
      )}

      {/* MODAL */}
      <ReportModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        session={session}
      />

      {/* TOAST */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

export default App;
