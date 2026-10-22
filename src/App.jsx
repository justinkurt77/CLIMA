import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import CitizenNav from "./components/layout/CitizenNav";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AboutScreen from "./screens/AboutScreen";
import ReportModal from "./components/ui/ReportModal";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import ElNinoMonitoringDashboard from "./components/dashboard/ElNinoMonitoringDashboard";
import { logger } from "./lib/logger";
import { useTheme } from "./context/ThemeContext";
import TabSkeleton, {
  HomeTabSkeleton,
  MapTabSkeleton,
  ElNinoTabSkeleton,
  AboutTabSkeleton,
  ProfileTabSkeleton,
  LegalTabSkeleton,
} from "./components/ui/TabSkeletons";

// New production components
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import ScrollToTopButton from "./components/ui/ScrollToTopButton";
import FloatingContactButton from "./components/ui/FloatingContactButton";
import CookieModal from "./components/ui/CookieModal";
// Lazy-load the map - only initialises Mapbox GL when user first taps "Maps"
const MapScreen = lazy(() => import("./screens/MapScreen"));
const AdminDashboard = lazy(() => import("./screens/AdminDashboard"));
const AdminMapScreen = lazy(() => import("./screens/AdminMapScreen"));
const AdminLogin = lazy(() => import("./screens/AdminLogin"));
const LegalScreen = lazy(() => import("./screens/LegalScreen"));
const NotFoundScreen = lazy(() => import("./screens/NotFoundScreen"));

import { supabase } from "./lib/supabase";
import { syncGoogleUserProfile, getUserProfile, checkUserAdminRole } from "./lib/authHelpers";

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
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const forcedSkeleton = urlParams?.get("skeleton");

  const [activeScreen, setActiveScreen] = useState(() => {
    const savedReturnTab =
      typeof window !== "undefined"
        ? sessionStorage.getItem("clima_auth_return_tab")
        : null;
    if (
      savedReturnTab &&
      ["home", "about", "maps", "profile", "elnino"].includes(savedReturnTab)
    ) {
      sessionStorage.removeItem("clima_auth_return_tab");
      return savedReturnTab;
    }
    if (forcedSkeleton && ["home", "about", "maps", "profile", "elnino"].includes(forcedSkeleton)) {
      return forcedSkeleton;
    }
    const tabParam = urlParams?.get("tab");
    if (tabParam && ["home", "about", "maps", "profile", "elnino", "legal", "admin"].includes(tabParam)) {
      return tabParam;
    }
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("admin")) return "admin";
    if (urlParams?.get("demo_admin") === "1" || urlParams?.get("admin") === "1") return "admin";
    return window.location.pathname === "/admin" ? "admin" : "home";
  });
  const isAdminView = activeScreen === "admin" || activeScreen === "admin-map";

  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { isDark } = useTheme();
  const [userReports, setUserReports] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [session, setSession] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);
  const [loadingTab, setLoadingTab] = useState(null);

  const handleTabChange = useCallback((newScreen) => {
    if (newScreen === activeScreen && !tabLoading) return;
    setLoadingTab(newScreen);
    setTabLoading(true);
    setActiveScreen(newScreen);

    // Micro-transition window showing the matching tab skeleton
    const timer = setTimeout(() => {
      setTabLoading(false);
      setLoadingTab(null);
    }, 420);
    return () => clearTimeout(timer);
  }, [activeScreen, tabLoading]);

  // Capturing original pushState outside of effect to avoid double overrides
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const handleUrlChange = () => {
      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      const isAdmin = window.location.pathname === "/admin" || hash.includes("admin") || search.get("tab") === "admin" || search.get("demo_admin") === "1";
      if (isAdmin) setActiveScreen("admin");
      else if (window.location.pathname === "/") setActiveScreen("home");
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    window.history.pushState = function () {
      originalPushState.apply(this, arguments);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const syncedSession = await syncGoogleUserProfile(supabase, session);
        setSession(syncedSession);
        const p = getUserProfile(syncedSession.user);
        if (!p?.isComplete && !syncedSession.user.user_metadata?.role?.includes('admin')) {
          setActiveScreen('profile');
        }
      } else {
        setSession(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const syncedSession = await syncGoogleUserProfile(supabase, session);
        setSession(syncedSession);
        const p = getUserProfile(syncedSession.user);
        if (!p?.isComplete && !syncedSession.user.user_metadata?.role?.includes('admin')) {
          setActiveScreen('profile');
        }
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Synchronize admin authentication & permissions across both citizen and admin views
  useEffect(() => {
    let isCancelled = false;

    const evaluateAdmin = async (user) => {
      try {
        const adminCheck = await checkUserAdminRole(user, supabase);
        if (isCancelled) return;
        if (adminCheck.isAdmin) {
          setIsAdminAuthenticated(true);
          setAdminUser(adminCheck);
        } else {
          setIsAdminAuthenticated(false);
          setAdminUser(null);
        }
      } catch (e) {
        logger.error("Admin role evaluation failed", e);
      }
    };

    if (session?.user) {
      evaluateAdmin(session.user);
    } else {
      supabase.auth.getSession().then(({ data: { session: current } }) => {
        if (isCancelled) return;
        if (current?.user) {
          evaluateAdmin(current.user);
        } else {
          evaluateAdmin(null);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [session, isAdminView]);

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
        logger.error("Error fetching reports:", err);
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
          logger.info("Location error:", err);
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


  const openModal = () => {
    // Check if user is authenticated before opening modal
    const profile = getUserProfile(session?.user);
    if (!session || !profile?.isComplete) {
      // User not logged in or profile incomplete -> redirect to profile/auth
      handleTabChange('profile');
      return;
    }
    setModalOpen(true);
  };
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
      className={`app-shell ${isAdminView ? "admin-mode" : "citizen-mode"}`}
    >
      {/* Scroll progress indicator */}
      {!isAdminView && <ScrollProgressBar />}
      
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
            className="citizen-screen-view home-screen-view hide-scroll"
            style={{
              zIndex: 10,
            }}
            id="main-content"
          >
            {(tabLoading && (loadingTab === "home" || !loadingTab)) || forcedSkeleton === "home" ? (
              <HomeTabSkeleton />
            ) : (
              <HomeScreen
                onOpenModal={openModal}
                userReports={userReports}
                session={session}
                userLocation={userLocation}
                setActiveScreen={handleTabChange}
                refreshTrigger={refreshTrigger}
                isAdmin={isAdminAuthenticated}
                isSuperadmin={adminUser?.isSuperadmin}
                adminUser={adminUser}
              />
            )}
          </motion.div>
        )}

        {activeScreen === "about" && (
          <motion.div
            key="about"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenVariants.transition}
            className="screen active citizen-screen-view hide-scroll"
            style={{ zIndex: 10, background: "transparent" }}
          >
            {(tabLoading && loadingTab === "about") || forcedSkeleton === "about" ? (
              <AboutTabSkeleton />
            ) : (
              <AboutScreen />
            )}
          </motion.div>
        )}

        {activeScreen === "maps" && (
          <motion.div
            key="maps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="citizen-screen-view hide-scroll"
            style={{
              zIndex: 10,
            }}
          >
            <ErrorBoundary>
              <Suspense fallback={<MapTabSkeleton />}>
                {(tabLoading && loadingTab === "maps") || forcedSkeleton === "maps" ? (
                  <MapTabSkeleton />
                ) : (
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
                    refreshTrigger={refreshTrigger}
                  />
                )}
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
            className="screen active citizen-screen-view hide-scroll"
            style={{
              zIndex: 10,
              background: "transparent",
            }}
          >
            {(tabLoading && loadingTab === "profile") || forcedSkeleton === "profile" ? (
              <ProfileTabSkeleton />
            ) : (
              <ProfileScreen
                onOpenModal={openModal}
                userReports={userReports}
                session={session}
                setActiveScreen={handleTabChange}
                isLoadingReports={isLoadingReports}
                isAdmin={isAdminAuthenticated}
                isSuperadmin={adminUser?.isSuperadmin}
                adminUser={adminUser}
              />
            )}
          </motion.div>
        )}

        {activeScreen === "elnino" && (
          <motion.div
            key="elnino"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenVariants.transition}
            className="screen active citizen-screen-view hide-scroll"
            style={{
              zIndex: 10,
              background: "transparent",
            }}
          >
            {(tabLoading && loadingTab === "elnino") || forcedSkeleton === "elnino" ? (
              <ElNinoTabSkeleton />
            ) : (
              <ElNinoMonitoringDashboard
                session={session}
                onNavigateToAuth={() => handleTabChange("profile")}
              />
            )}
          </motion.div>
        )}

        {activeScreen === "legal" && (
          <motion.div
            key="legal"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenVariants.transition}
            className="screen active citizen-screen-view hide-scroll"
            style={{
              zIndex: 10,
              background: "transparent",
            }}
          >
            <Suspense fallback={<LegalTabSkeleton />}>
              <LegalScreen />
            </Suspense>
          </motion.div>
        )}

        {/* 404 Not Found - Catch-all for invalid routes */}
        {!['home', 'about', 'maps', 'profile', 'elnino', 'legal', 'admin', 'admin-map'].includes(activeScreen) && (
          <motion.div
            key="notfound"
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={screenVariants.transition}
            className="screen active citizen-screen-view hide-scroll"
            style={{
              zIndex: 10,
              background: "transparent",
            }}
          >
            <Suspense fallback={<div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '100vh',
              fontSize: '1.2rem',
              color: '#666'
            }}>Loading...</div>}>
              <NotFoundScreen onNavigate={handleTabChange} />
            </Suspense>
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
              background: isDark ? "#000000" : "#ffffff",
              overflow: "hidden",
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: "inherit",
            }}
          >
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div
                    style={{
                      height: "100%",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDark ? "#000000" : "#ffffff",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 40,
                        height: 40,
                        border: isDark ? "4px solid rgba(255, 255, 255, 0.12)" : "4px solid rgba(0, 0, 0, 0.12)",
                        borderTopColor: "#f59e0b",
                        borderRadius: "50%",
                      }}
                    />
                    <p style={{ color: "#71717a", fontFamily: "var(--font-sans, 'Nohemi', sans-serif)", fontWeight: 700, fontSize: 14 }}>
                      Loading Console…
                    </p>
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
                    onViewCitizenApp={() => handleTabChange("home")}
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
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: "inherit",
              background: isDark ? "#000000" : "#ffffff",
              overflow: "hidden",
            }}
          >
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div
                    style={{
                      height: "100%",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDark ? "#000000" : "#ffffff",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 40,
                        height: 40,
                        border: isDark ? "4px solid rgba(255, 255, 255, 0.12)" : "4px solid rgba(0, 0, 0, 0.12)",
                        borderTopColor: "#f59e0b",
                        borderRadius: "50%",
                      }}
                    />
                    <p style={{ color: "#71717a", fontFamily: "var(--font-sans, 'Nohemi', sans-serif)", fontWeight: 700, fontSize: 14 }}>
                      Loading Map…
                    </p>
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
                    onViewCitizenApp={() => handleTabChange("home")}
                    onLogout={() => {
                      setIsAdminAuthenticated(false);
                      setAdminUser(null);
                      supabase.auth.signOut();
                    }}
                    isSuperadmin={adminUser?.isSuperadmin}
                    adminCategories={adminUser?.adminCategories}
                    adminDepartment={adminUser?.adminDepartment}
                    currentUser={adminUser}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>


      {!isAdminView && (
        <CitizenNav
          activeScreen={activeScreen}
          setActiveScreen={handleTabChange}
          session={session}
          isAdmin={isAdminAuthenticated}
          isSuperadmin={adminUser?.isSuperadmin}
          adminUser={adminUser}
          onOpenModal={openModal}
          onRefresh={() => {
            setLoadingTab(activeScreen);
            setTabLoading(true);
            setRefreshTrigger((prev) => prev + 1);
            setTimeout(() => {
              setTabLoading(false);
              setLoadingTab(null);
            }, 550);
          }}
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
      
      {/* Scroll to top button - citizen view only */}
      {!isAdminView && <ScrollToTopButton />}
      
      {/* Floating emergency contact button - citizen view only */}
      {!isAdminView && <FloatingContactButton />}
      
      {/* Cookie consent banner */}
      {!isAdminView && <CookieModal />}
    </div>
  );
}

export default App;




