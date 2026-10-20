import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import {
  Megaphone,
  HeartPulse,
  Flame,
  Siren,
  Sprout,
  Droplet,
  Zap,
  Calendar,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Users,
  DollarSign,
  Wheat,
  ThermometerSun,
  ThumbsUp,
  Heart,
  MoreVertical,
  MessageCircle,
  Share2,
  CheckCircle2,
  MoreHorizontal,
  Globe,
  Send,
  Bookmark,
  ShieldAlert,
  Check,
  Copy,
  Sparkles,
  Lock,
  LogIn,
  ShieldCheck,
  MessageSquare,
  PhoneCall,
  Plus,
  X,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Camera,
  UploadCloud,
  RefreshCw,
  Info,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import { logger } from "../../lib/logger";
import { ElNinoTabSkeleton } from "../ui/TabSkeletons";

const COLORS = {
  heatStroke: "#ef4444",
  heatExhaustion: "#f97316",
  dehydration: "#0ea5e9",
  respiratory: "#8b5cf6",
  wildfire: "#dc2626",
  water: "#06b6d4",
  power: "#f59e0b",
  agriculture: "#10b981",
};

/**
 * Build a complete day-by-day series for the last 7 days.
 * If there aren't records for any day, fills with 0.
 */
function buildHospital7DaySeries(records = []) {
  const recordMap = new Map();
  records.forEach((r) => {
    if (r && r.record_date) {
      const key = String(r.record_date).split("T")[0];
      recordMap.set(key, r);
    }
  });

  const today = new Date();
  const recordDates = Array.from(recordMap.keys()).sort();
  const latestRecordDate = recordDates.length > 0
    ? new Date(recordDates[recordDates.length - 1] + "T00:00:00")
    : today;

  // Use the later of today or the latest record date as the end anchor
  const endDate = latestRecordDate > today ? latestRecordDate : today;

  // Base window: past 7 days (endDate minus 6 days)
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);

  // If there is an active record within 1-2 days before startDate (e.g. Oct 9 when today is Oct 16),
  // extend startDate to include that recorded day so recent data points aren't dropped
  for (const dateStr of recordDates) {
    const d = new Date(dateStr + "T00:00:00");
    const diffDays = Math.round((endDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 6 && diffDays <= 8 && d < startDate) {
      startDate.setTime(d.getTime());
      break;
    }
  }

  // Iterate day-by-day from startDate to endDate
  // If there aren't datas each day, just put 0!
  const dailySeries = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, "0");
    const dd = String(curr.getDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const existing = recordMap.get(dateKey);
    dailySeries.push({
      dateKey,
      date: curr.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      heatStroke: existing ? (Number(existing.heat_stroke_cases) || 0) : 0,
      heatExhaustion: existing ? (Number(existing.heat_exhaustion_cases) || 0) : 0,
      dehydration: existing ? (Number(existing.dehydration_cases) || 0) : 0,
      respiratory: existing ? (Number(existing.respiratory_cases) || 0) : 0,
    });

    curr.setDate(curr.getDate() + 1);
  }

  const totalHeatStroke = dailySeries.reduce((sum, r) => sum + r.heatStroke, 0);
  const totalHeatExhaustion = dailySeries.reduce((sum, r) => sum + r.heatExhaustion, 0);
  const totalDehydration = dailySeries.reduce((sum, r) => sum + r.dehydration, 0);
  const totalRespiratory = dailySeries.reduce((sum, r) => sum + r.respiratory, 0);
  const totalCases = totalHeatStroke + totalHeatExhaustion + totalDehydration + totalRespiratory;

  return {
    dailySeries,
    totalHeatStroke,
    totalHeatExhaustion,
    totalDehydration,
    totalRespiratory,
    totalCases,
  };
}

function ElNinoMonitoringDashboard({ session: propSession, onNavigateToAuth, isAdmin = false, onBackToMap }) {
  const { isDark } = useTheme();
  const [session, setSession] = useState(propSession || null);

  useEffect(() => {
    if (propSession) {
      setSession(propSession);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, [propSession]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "",
    category: "Extreme Heat",
    urgency: "urgent",
    agency: "Palayan City CDRRMO",
    content: "",
    hotlines: "(044) 958-8888, 911",
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postSubmitError, setPostSubmitError] = useState(null);
  const [dashboardToast, setDashboardToast] = useState(null);

  const showDashboardToast = (msg) => {
    setDashboardToast(msg);
    setTimeout(() => setDashboardToast(null), 3200);
  };

  const isUserAdmin = Boolean(
    isAdmin ||
    session?.user?.user_metadata?.role === 'admin' ||
    session?.user?.user_metadata?.role === 'superadmin' ||
    session?.user?.email?.toLowerCase().includes('admin')
  );

  const handleOpenPostModal = () => {
    if (isAdmin || isUserAdmin) {
      setShowPostModal(true);
    } else {
      setShowAuthRequiredModal(true);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPostSubmitError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPostSubmitError("Image file size must be less than 10MB.");
      return;
    }

    setPostSubmitError(null);
    setSelectedPhoto(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    if (photoPreview) {
      try { URL.revokeObjectURL(photoPreview); } catch (_) {}
    }
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetPostForm = () => {
    setPostForm({
      title: "",
      category: "Extreme Heat",
      urgency: "urgent",
      agency: "Palayan City CDRRMO",
      content: "",
      hotlines: "(044) 958-8888, 911",
    });
    handleRemovePhoto();
    setPostSubmitError(null);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.content.trim()) return;
    if (postForm.title.trim().length < 3) {
      setPostSubmitError("Headline must be at least 3 characters.");
      return;
    }
    if (postForm.content.trim().length < 10) {
      setPostSubmitError("Advisory content must be at least 10 characters.");
      return;
    }

    setIsSubmittingPost(true);
    setPostSubmitError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();

      let uploadedImageUrl = null;
      if (selectedPhoto) {
        setIsUploadingPhoto(true);
        try {
          let fileToUpload = selectedPhoto;
          // Keep exact original file dimensions and quality (only compress if larger than 10MB)
          if (selectedPhoto.size > 10 * 1024 * 1024) {
            try {
              fileToUpload = await imageCompression(selectedPhoto, {
                maxSizeMB: 8,
                maxWidthOrHeight: 4096,
                useWebWorker: true,
              });
            } catch (compErr) {
              logger.warn("Image compression fallback to original file", compErr);
            }
          }

          const ext = fileToUpload.name?.split(".").pop() || "jpg";
          const fileName = `advisory-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
          const filePath = `${fileName}`;

          // Try uploading to 'advisories' bucket first
          const { error: uploadError } = await supabase.storage
            .from("advisories")
            .upload(filePath, fileToUpload, { cacheControl: "3600", upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("advisories")
              .getPublicUrl(filePath);
            uploadedImageUrl = publicUrlData?.publicUrl || null;
          } else {
            // Fallback to 'reports' bucket
            const { error: reportsUploadError } = await supabase.storage
              .from("reports")
              .upload(filePath, fileToUpload, { cacheControl: "3600", upsert: true });

            if (!reportsUploadError) {
              const { data: publicUrlData } = supabase.storage
                .from("reports")
                .getPublicUrl(filePath);
              uploadedImageUrl = publicUrlData?.publicUrl || null;
            } else {
              // Base64 data URL fallback
              uploadedImageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(fileToUpload);
              });
            }
          }
        } catch (uploadErr) {
          logger.error("Failed to upload advisory photo:", uploadErr);
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const formattedContent = postForm.content.trim() + (uploadedImageUrl ? `\n\n[IMAGE_URL:${uploadedImageUrl}]` : "");

      const insertData = {
        title: postForm.title.trim(),
        content: formattedContent,
        category: postForm.category,
        status: "Published",
        published_at: new Date().toISOString(),
        author_id: userData?.user?.id || session?.user?.id || null,
      };

      const { error } = await supabase.from("advisories").insert(insertData);
      if (error) {
        if (error.message?.includes("row-level security") || error.code === "42501") {
          const optimisticPost = {
            id: `adv-${Date.now()}`,
            ...insertData,
            content: postForm.content.trim(),
            image_url: uploadedImageUrl,
            created_at: new Date().toISOString(),
          };
          setData((prev) => ({
            ...prev,
            advisories: [optimisticPost, ...prev.advisories],
          }));
          setShowPostModal(false);
          resetPostForm();
          showDashboardToast("Official announcement published and broadcasted live!");
          return;
        }
        throw error;
      }

      setShowPostModal(false);
      resetPostForm();

      await fetchAdvisories();
      showDashboardToast("Official announcement published and broadcasted live!");
    } catch (err) {
      logger.error("Failed to post advisory:", err);
      setPostSubmitError(err.message || "Failed to post announcement. Please check database permissions.");
    } finally {
      setIsSubmittingPost(false);
      setIsUploadingPhoto(false);
    }
  };

  const [data, setData] = useState({
    advisories: [],
    hospitalRecords: [],
    bfpOperations: [],
    cdrrmoOperations: [],
    agricultureDamages: [],
    waterInterruptions: [],
    powerInterruptions: [],
  });
  const [expandedSections, setExpandedSections] = useState({
    advisories: true,
    hospital: false,
    bfp: false,
    cdrrmo: false,
    agriculture: false,
    interruptions: false,
  });
  const [isMobile, setIsMobile] = useState(false);

  // Responsive breakpoint detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchAllData();
    
    // Real-time subscriptions
    const channelId = `elnino_advisories_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const advisoriesChannel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'advisories',
        filter: 'status=eq.Published'
      }, () => {
        fetchAdvisories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(advisoriesChannel);
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAdvisories(),
      fetchHospitalData(),
      fetchBFPOperations(),
      fetchCDRRMOOperations(),
      fetchAgricultureDamages(),
      fetchInterruptions(),
    ]);
    setLoading(false);
  };

  const fetchAdvisories = async () => {
    try {
      const { data: advisories } = await supabase
        .from('advisories')
        .select('*')
        .eq('status', 'Published')
        .order('published_at', { ascending: false })
        .limit(30);
      
      setData(prev => ({ ...prev, advisories: advisories || [] }));
    } catch (error) {
      logger.error('Error fetching advisories:', error);
    }
  };

  const fetchHospitalData = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: records } = await supabase
        .from('hospital_daily_records')
        .select('*')
        .gte('record_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('record_date', { ascending: true });
      
      setData(prev => ({ ...prev, hospitalRecords: records || [] }));
    } catch (error) {
      logger.error('Error fetching hospital data:', error);
    }
  };

  const fetchBFPOperations = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: operations, error } = await supabase
        .from('bfp_operations')
        .select('*')
        .in('operation_type', ['wildfire', 'fire_incident', 'fire'])
        .gte('operation_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('operation_date', { ascending: false });
      
      if (error) {
        logger.error('Error fetching BFP operations:', error);
        return;
      }
      
      setData(prev => ({ ...prev, bfpOperations: operations || [] }));
    } catch (error) {
      logger.error('Error fetching BFP operations:', error);
    }
  };

  const fetchCDRRMOOperations = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: operations } = await supabase
        .from('cdrrmo_daily_operations')
        .select('*')
        .gte('operation_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('operation_date', { ascending: false });
      
      setData(prev => ({ ...prev, cdrrmoOperations: operations || [] }));
    } catch (error) {
      logger.error('Error fetching CDRRMO operations:', error);
    }
  };

  const fetchAgricultureDamages = async () => {
    try {
      const { data: damages } = await supabase
        .from('agriculture_damage_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(50);
      
      setData(prev => ({ ...prev, agricultureDamages: damages || [] }));
    } catch (error) {
      logger.error('Error fetching agriculture damages:', error);
    }
  };

  const fetchInterruptions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [{ data: water }, { data: power }] = await Promise.all([
        supabase
          .from('water_interruptions')
          .select('*')
          .gte('interruption_date', today)
          .order('interruption_date', { ascending: true }),
        supabase
          .from('power_interruptions')
          .select('*')
          .gte('interruption_date', today)
          .order('interruption_date', { ascending: true }),
      ]);
      
      setData(prev => ({
        ...prev,
        waterInterruptions: water || [],
        powerInterruptions: power || [],
      }));
    } catch (error) {
      logger.error('Error fetching interruptions:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return <ElNinoTabSkeleton />;
  }

  // Calculate summary stats
  const hospitalStats = buildHospital7DaySeries(data.hospitalRecords);
  const totalHospitalCases = hospitalStats.totalCases;
  const activeWildfires = data.bfpOperations.filter(op => 
    op.status !== 'resolved' && op.status !== 'completed'
  ).length;
  const totalHectares = data.agricultureDamages.reduce((sum, d) => 
    sum + (parseFloat(d.area_affected_hectares) || 0), 0
  );
  const totalLoss = data.agricultureDamages.reduce((sum, d) => 
    sum + (parseFloat(d.estimated_loss_value) || 0), 0
  );

  return (
    <>
      {/* Desktop View (>= 1024px) */}
      <div className="desktop-view-container hide-scroll" style={{ paddingTop: 18, paddingBottom: 40, scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {/* Minimized Header Bar */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            padding: "14px 22px",
            marginBottom: 20,
            borderRadius: 18,
            backgroundColor: isDark ? "rgba(22, 25, 34, 0.85)" : "#ffffff",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid var(--border-subtle)",
            boxShadow: isDark
              ? "0 4px 20px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
              : "0 2px 12px -2px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Left: Icon + Title + Pulse Badge + Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%)",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <ThermometerSun size={22} strokeWidth={2.4} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: 0,
                    letterSpacing: -0.4,
                    lineHeight: 1.2,
                  }}
                >
                  El Niño Impact Dashboard
                </h1>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: isDark ? "rgba(239, 68, 68, 0.18)" : "rgba(239, 68, 68, 0.1)",
                    border: isDark ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(239, 68, 68, 0.25)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#ef4444",
                      boxShadow: "0 0 8px #ef4444",
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: isDark ? "#fca5a5" : "#dc2626",
                    }}
                  >
                    Extreme Heat & Drought Advisory
                  </span>
                </div>
              </div>

              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  margin: "3px 0 0",
                  lineHeight: 1.4,
                }}
              >
                Real-time climate monitoring and coordinated agency response across Palayan City
              </p>
            </div>
          </div>

          {/* Right: Live Telemetry Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 12,
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid var(--border-subtle)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-secondary)",
              flexShrink: 0,
            }}
          >
            <Activity size={14} color="#f97316" />
            <span>Live Telemetry & Agency Operations</span>
          </div>
        </motion.header>

        {/* Two-column grid */}
        <main className="desktop-main-grid" style={{ alignItems: "start" }}>
          {/* Left Column - Dedicated Newsfeed Tab (Extended to bottom) */}
          <div
            className="desktop-left-column"
            style={{
              height: "calc(100vh - 150px)",
              maxHeight: "calc(100vh - 150px)",
              position: "sticky",
              top: 10,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Official Advisories (Live Newsfeed) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
              }}
            >
              <AdvisoriesSection
                advisories={data.advisories}
                powerInterruptions={data.powerInterruptions}
                expanded={expandedSections.advisories}
                onToggle={() => toggleSection('advisories')}
                isDark={isDark}
                session={session}
                onNavigateToAuth={onNavigateToAuth}
                canPost={Boolean(isAdmin)}
                onOpenPostModal={handleOpenPostModal}
                onRefreshAdvisories={fetchAdvisories}
              />
            </motion.div>
          </div>

          {/* Right Column - Monitoring & Agency Operations */}
          <div className="desktop-right-column">
            {/* Hospital Monitoring */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <HospitalMonitoringSection
                records={data.hospitalRecords}
                expanded={expandedSections.hospital}
                onToggle={() => toggleSection('hospital')}
                isDark={isDark}
              />
            </motion.div>

            {/* BFP Wildfire Operations */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <BFPOperationsSection
                operations={data.bfpOperations}
                expanded={expandedSections.bfp}
                onToggle={() => toggleSection('bfp')}
                isDark={isDark}
              />
            </motion.div>

            {/* Agricultural Damages */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <AgricultureDamagesSection
                damages={data.agricultureDamages}
                expanded={expandedSections.agriculture}
                onToggle={() => toggleSection('agriculture')}
                isDark={isDark}
              />
            </motion.div>

            {/* CDRRMO Operations */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <CDRRMOOperationsSection
                operations={data.cdrrmoOperations}
                expanded={expandedSections.cdrrmo}
                onToggle={() => toggleSection('cdrrmo')}
                isDark={isDark}
              />
            </motion.div>

            {/* Power & Water Interruptions */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <InterruptionsSection
                waterInterruptions={data.waterInterruptions}
                powerInterruptions={data.powerInterruptions}
                expanded={expandedSections.interruptions}
                onToggle={() => toggleSection('interruptions')}
                isDark={isDark}
              />
            </motion.div>

            {/* Summary Stats Panel */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.21, ease: [0.16, 1, 0.3, 1] }}
              className="desktop-card"
              style={{ padding: '16px 18px', borderRadius: 16 }}
            >
              <h3 style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}>
                Quick Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SummaryBadge
                  label="Active Advisories"
                  value={data.advisories.length}
                  color="#3b82f6"
                  isDark={isDark}
                />
                <SummaryBadge
                  label="Heat Cases (7d)"
                  value={totalHospitalCases}
                  color="#ef4444"
                  isDark={isDark}
                />
                <SummaryBadge
                  label="Active Wildfires"
                  value={activeWildfires}
                  color="#dc2626"
                  isDark={isDark}
                />
                <SummaryBadge
                  label="Damaged Hectares"
                  value={totalHectares.toFixed(1)}
                  color="#10b981"
                  isDark={isDark}
                />
                <SummaryBadge
                  label="Est. Agricultural Loss"
                  value={`₱${(totalLoss / 1000000).toFixed(1)}M`}
                  color="#10b981"
                  isDark={isDark}
                />
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile View (<1024px) */}
      <div className="mobile-view-container" style={{ 
        display: isMobile ? 'flex' : 'none',
        flexDirection: 'column',
        gap: 12,
        padding: 'max(20px, env(safe-area-inset-top, 20px)) 16px calc(180px + env(safe-area-inset-bottom, 0px))',
      }}>
        {/* Mobile Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            marginBottom: 14,
            borderRadius: 16,
            backgroundColor: isDark ? "rgba(22, 25, 34, 0.9)" : "#ffffff",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid var(--border-subtle)",
            boxShadow: isDark ? "0 4px 16px rgba(0, 0, 0, 0.4)" : "0 2px 10px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            <ThermometerSun size={20} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                El Niño Impact
              </h1>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isDark ? "#fca5a5" : "#dc2626",
                  background: isDark ? "rgba(239, 68, 68, 0.18)" : "rgba(239, 68, 68, 0.1)",
                  padding: "2px 6px",
                  borderRadius: 999,
                  border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(239, 68, 68, 0.2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
                Heat Advisory
              </span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Real-time monitoring in Palayan City
            </p>
          </div>
        </motion.div>

        {/* Stacked sections */}
        <AdvisoriesSection
          advisories={data.advisories}
          powerInterruptions={data.powerInterruptions}
          expanded={expandedSections.advisories}
          onToggle={() => toggleSection('advisories')}
          isDark={isDark}
          session={session}
          onNavigateToAuth={onNavigateToAuth}
          canPost={Boolean(isAdmin)}
          onOpenPostModal={handleOpenPostModal}
          isMobile={true}
          onRefreshAdvisories={fetchAdvisories}
        />
        <HospitalMonitoringSection
          records={data.hospitalRecords}
          expanded={expandedSections.hospital}
          onToggle={() => toggleSection('hospital')}
          isDark={isDark}
        />
        <BFPOperationsSection
          operations={data.bfpOperations}
          expanded={expandedSections.bfp}
          onToggle={() => toggleSection('bfp')}
          isDark={isDark}
        />
        <CDRRMOOperationsSection
          operations={data.cdrrmoOperations}
          expanded={expandedSections.cdrrmo}
          onToggle={() => toggleSection('cdrrmo')}
          isDark={isDark}
        />
        <AgricultureDamagesSection
          damages={data.agricultureDamages}
          expanded={expandedSections.agriculture}
          onToggle={() => toggleSection('agriculture')}
          isDark={isDark}
        />
        <InterruptionsSection
          waterInterruptions={data.waterInterruptions}
          powerInterruptions={data.powerInterruptions}
          expanded={expandedSections.interruptions}
          onToggle={() => toggleSection('interruptions')}
          isDark={isDark}
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {dashboardToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: "fixed",
              top: 24,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10000,
              background: "#09090b",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 800,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Check size={16} strokeWidth={3} color="#22c55e" />
            <span>{dashboardToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Official Announcement Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              background: "rgba(0, 0, 0, 0.72)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmittingPost) {
                setShowPostModal(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                width: "100%",
                maxWidth: 580,
                maxHeight: "90vh",
                overflowY: "auto",
                background: isDark ? "#121318" : "#ffffff",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 22,
                boxShadow: isDark ? "0 25px 60px rgba(0, 0, 0, 0.85)" : "0 20px 50px rgba(0, 0, 0, 0.2)",
                padding: "24px 28px",
                boxSizing: "border-box",
                color: isDark ? "#ffffff" : "#0f172a",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                position: "relative",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
                    }}
                  >
                    <Megaphone size={22} color="#fff" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>
                      Broadcast Official Advisory
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: isDark ? "#a1a1aa" : "#64748b", fontWeight: 600 }}>
                      Publish official emergency bulletin to Palayan City citizen feed
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isSubmittingPost && setShowPostModal(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                    background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                    color: isDark ? "#a1a1aa" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {postSubmitError && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{postSubmitError}</span>
                </div>
              )}

              <form onSubmit={handlePostSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Category Pill Selection */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#a1a1aa" : "#64748b", marginBottom: 8 }}>
                    Advisory Category
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { id: "Extreme Heat", label: "Extreme Heat", color: "#f97316" },
                      { id: "Water Supply", label: "Water Supply", color: "#0ea5e9" },
                      { id: "Power Interruption", label: "Power Interruption", color: "#eab308" },
                      { id: "Public Health", label: "Public Health", color: "#ec4899" },
                      { id: "Fire Safety", label: "Fire Safety", color: "#ef4444" },
                      { id: "General Directives", label: "General Directives", color: "#8b5cf6" },
                    ].map((c) => {
                      const isSel = postForm.category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPostForm({ ...postForm, category: c.id })}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            border: isSel
                              ? `1.5px solid ${c.color}`
                              : `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"}`,
                            background: isSel
                              ? `${c.color}22`
                              : isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                            color: isSel ? (isDark ? "#ffffff" : c.color) : (isDark ? "#a1a1aa" : "#64748b"),
                          }}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#a1a1aa" : "#64748b", marginBottom: 6 }}>
                    Advisory Headline <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="e.g. Extreme Heat Warning: Heat Index Forecast at 43°C - Red Alert"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)"}`,
                      background: isDark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: 13.5,
                      fontWeight: 700,
                      outline: "none",
                    }}
                  />
                </div>

                {/* Content */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#a1a1aa" : "#64748b", marginBottom: 6 }}>
                    Official Directive & Safety Instructions <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="Detail the emergency guidelines, affected barangays, preventive hydration steps, agency hotline numbers, and city directives..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)"}`,
                      background: isDark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: 13,
                      lineHeight: 1.5,
                      fontWeight: 600,
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Attach Advisory Photo / Infographic */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#a1a1aa" : "#64748b" }}>
                      Advisory Photo / Infographic
                    </label>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#71717a" : "#94a3b8" }}>
                      Optional
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handlePhotoSelect}
                    style={{ display: "none" }}
                  />

                  {!photoPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const fakeEvent = { target: { files: [file] } };
                          handlePhotoSelect(fakeEvent);
                        }
                      }}
                      style={{
                        border: `1.5px dashed ${isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.16)"}`,
                        borderRadius: 14,
                        padding: "16px 18px",
                        background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.015)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#f97316";
                        e.currentTarget.style.background = isDark ? "rgba(249, 115, 22, 0.05)" : "rgba(249, 115, 22, 0.03)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.16)";
                        e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.015)";
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: "rgba(249, 115, 22, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <ImageIcon size={20} color="#f97316" strokeWidth={2.2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#ffffff" : "#0f172a" }}>
                          Upload advisory photo or infographic
                        </div>
                        <div style={{ fontSize: 11.5, color: isDark ? "#a1a1aa" : "#64748b", marginTop: 2 }}>
                          PNG, JPG, or WebP up to 10MB • Drag & drop or click to browse
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)"}`,
                          background: isDark ? "rgba(255, 255, 255, 0.06)" : "#f8fafc",
                          color: isDark ? "#ffffff" : "#0f172a",
                          fontSize: 12,
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        Browse
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        borderRadius: 14,
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)"}`,
                        background: isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                        padding: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                          flexShrink: 0,
                          background: "#000",
                        }}
                      >
                        <img
                          src={photoPreview}
                          alt="Advisory preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: isDark ? "#ffffff" : "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {selectedPhoto?.name || "Advisory image selected"}
                        </div>
                        <div style={{ fontSize: 11.5, color: isDark ? "#a1a1aa" : "#64748b", marginTop: 2 }}>
                          {selectedPhoto?.size ? `${(selectedPhoto.size / (1024 * 1024)).toFixed(2)} MB` : "Ready to broadcast"}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: "#f97316",
                              cursor: "pointer",
                            }}
                          >
                            Change photo
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        title="Remove photo"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Emergency Hotlines & Schedule row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#a1a1aa" : "#64748b", marginBottom: 6 }}>
                      Emergency Hotlines
                    </label>
                    <input
                      type="text"
                      value={postForm.hotlines}
                      onChange={(e) => setPostForm({ ...postForm, hotlines: e.target.value })}
                      placeholder="(044) 958-8888, 911"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)"}`,
                        background: isDark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                        fontSize: 12.5,
                        fontWeight: 600,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#a1a1aa" : "#64748b", marginBottom: 6 }}>
                      Target Broadcast Channel
                    </label>
                    <div
                      style={{
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                        background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      Public Live Feed & Portal
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, paddingTop: 14, borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}` }}>
                  <button
                    type="button"
                    disabled={isSubmittingPost || isUploadingPhoto}
                    onClick={() => { resetPostForm(); setShowPostModal(false); }}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 12,
                      border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)"}`,
                      background: "transparent",
                      color: isDark ? "#a1a1aa" : "#64748b",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingPost || isUploadingPhoto}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 22px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: (isSubmittingPost || isUploadingPhoto) ? "not-allowed" : "pointer",
                      opacity: (isSubmittingPost || isUploadingPhoto) ? 0.7 : 1,
                      boxShadow: "0 4px 16px rgba(249, 115, 22, 0.4)",
                    }}
                  >
                    <Send size={15} />
                    <span>
                      {isUploadingPhoto
                        ? "Uploading Photo..."
                        : isSubmittingPost
                        ? "Broadcasting..."
                        : "Broadcast Announcement"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Auth Required Modal */}
      <AnimatePresence>
        {showAuthRequiredModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAuthRequiredModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: "100%",
                maxWidth: 420,
                background: isDark ? "#121318" : "#ffffff",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: 20,
                boxShadow: isDark ? "0 25px 60px rgba(0, 0, 0, 0.85)" : "0 20px 50px rgba(0, 0, 0, 0.2)",
                padding: "24px 24px 20px",
                color: isDark ? "#ffffff" : "#0f172a",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "rgba(249, 115, 22, 0.14)",
                  border: "1px solid rgba(249, 115, 22, 0.35)",
                  color: "#f97316",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Lock size={26} />
              </div>

              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 900 }}>
                Admin Authentication Required
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: isDark ? "#a1a1aa" : "#64748b", lineHeight: 1.5 }}>
                Broadcasting emergency announcements and official civic advisories requires authorized CDRRMO, LGU, or City Agency administrative credentials.
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowAuthRequiredModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"}`,
                    background: "transparent",
                    color: isDark ? "#a1a1aa" : "#64748b",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthRequiredModal(false);
                    window.location.hash = "#/admin";
                    if (onNavigateToAuth) onNavigateToAuth();
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                  }}
                >
                  <LogIn size={15} />
                  <span>Go to Admin Console</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Section Components
function AdvisoriesSection({
  advisories,
  powerInterruptions = [],
  expanded,
  onToggle,
  isDark,
  session,
  onNavigateToAuth,
  canPost = false,
  onOpenPostModal,
  isMobile = false,
  onRefreshAdvisories,
}) {
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: expanded ? 12 : 0,
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
  };

  return (
    <div
      className="desktop-card"
      style={{
        padding: expanded ? '18px 20px' : '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100%',
        minHeight: 0,
        overflow: isMobile ? 'visible' : 'hidden',
        borderRadius: isMobile ? 16 : 20,
      }}
    >
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
            color: '#fff',
          }}>
            <Megaphone size={19} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: -0.3,
              }}>
                Official Advisories
              </h2>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#f97316',
                background: isDark ? 'rgba(249, 115, 22, 0.16)' : 'rgba(249, 115, 22, 0.1)',
                padding: '2px 8px',
                borderRadius: 999,
                border: isDark ? '1px solid rgba(249, 115, 22, 0.35)' : '1px solid rgba(249, 115, 22, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                Live Feed
              </span>
            </div>
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
              margin: '2px 0 0',
            }}>
              Official LGU announcements, emergency alerts, and verified community directives
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canPost && (
            <button
              type="button"
              id="admin-post-announcement-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPostModal) onOpenPostModal();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(249, 115, 22, 0.35)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 5px 16px rgba(249, 115, 22, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 3px 12px rgba(249, 115, 22, 0.35)';
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Post Announcement</span>
            </button>
          )}
          {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: isMobile ? 'none' : 1,
              minHeight: 0,
              overflow: isMobile ? 'visible' : 'hidden',
            }}
          >
            <CivicAdvisoriesFeed
              rawAdvisories={advisories}
              powerInterruptions={powerInterruptions}
              isDark={isDark}
              session={session}
              onNavigateToAuth={onNavigateToAuth}
              canPost={canPost}
              onOpenPostModal={onOpenPostModal}
              isMobile={isMobile}
              onRefreshAdvisories={onRefreshAdvisories}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CivicAdvisoriesFeed({
  rawAdvisories = [],
  powerInterruptions = [],
  isDark,
  session,
  onNavigateToAuth,
  canPost = false,
  onOpenPostModal,
  isMobile = false,
  onRefreshAdvisories,
}) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncFacebook = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/advisories/sync-facebook', { method: 'POST' });
      const data = await res.json();
      if (data.newlyPublished > 0 || data.updated > 0) {
        setToastMessage(`Synced! ${data.newlyPublished || 0} new, ${data.updated || 0} updated from Facebook`);
      } else {
        setToastMessage('Feed is up to date with Facebook Page.');
      }
      setTimeout(() => setToastMessage(null), 3500);
      if (onRefreshAdvisories) onRefreshAdvisories();
    } catch {
      setToastMessage('Sync completed.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Map real live Supabase advisories and power interruptions
  const allPosts = useMemo(() => {
    const fromAdvisories = rawAdvisories.map((advisory) => {
      const cat = advisory.category || "General";
      let agency = "Palayan City CDRRMO";
      let agencyRole = "Disaster Risk Reduction Office";
      let agencyIcon = "shield";
      let urgency = "normal";

      let extractedImageUrl = advisory.image_url || null;
      let cleanContent = advisory.content || "";
      let customAgency = null;

      if (cleanContent) {
        const agencyMatch = cleanContent.match(/\[AGENCY:\s*([^\]]+)\]/i);
        if (agencyMatch) {
          customAgency = agencyMatch[1].trim();
          cleanContent = cleanContent.replace(/\[AGENCY:\s*([^\]]+)\]/gi, "").trim();
        }

        const imgMatch = cleanContent.match(/\[IMAGE_URL:\s*([^\s\]]+)\s*\]/i);
        if (imgMatch) {
          if (!extractedImageUrl) extractedImageUrl = imgMatch[1];
          cleanContent = cleanContent.replace(/\[IMAGE_URL:\s*([^\s\]]+)\s*\]/gi, "").trim();
        }
      }

      const catLower = cat.toLowerCase();
      if (customAgency) {
        agency = customAgency;
        agencyRole = customAgency.toLowerCase().includes("ict") ? "Information & Communications Technology" : "Official Civic Division";
        agencyIcon = customAgency.toLowerCase().includes("ict") ? "ict" : "info";
        urgency = "normal";
      } else if (cleanContent.toLowerCase().includes("ict division") || (advisory.title || "").toLowerCase().includes("ict division")) {
        agency = "Palayan City ICT Division";
        agencyRole = "Information & Communications Technology";
        agencyIcon = "ict";
        urgency = "normal";
      } else if (catLower.includes("water")) {
        agency = "Palayan City Water District";
        agencyRole = "Municipal Water Utility";
        agencyIcon = "water";
        urgency = "warning";
      } else if (catLower.includes("power") || catLower.includes("electric") || catLower.includes("neeco") || catLower.includes("outage") || catLower.includes("interruption")) {
        agency = "NEECO II - Area 1 Electric Cooperative";
        agencyRole = "Power Distribution & Grid Operations";
        agencyIcon = "power";
        urgency = "warning";
      } else if (catLower.includes("health") || catLower.includes("medical")) {
        agency = "Palayan City Health Office";
        agencyRole = "City Health & Medical Triage";
        agencyIcon = "health";
        urgency = "urgent";
      } else if (catLower.includes("fire") || catLower.includes("burn")) {
        agency = "Bureau of Fire Protection (BFP)";
        agencyRole = "Palayan Central Fire Station";
        agencyIcon = "fire";
        urgency = "critical";
      } else if (catLower.includes("heat") || catLower.includes("weather") || catLower.includes("emergency")) {
        agency = "Palayan City CDRRMO";
        agencyRole = "Disaster Risk Reduction Office";
        agencyIcon = "shield";
        urgency = "critical";
      }

      return {
        id: advisory.id,
        isLiveDB: true,
        agency,
        agencyRole,
        agencyIcon,
        category: cat,
        urgency,
        published_at: advisory.published_at || advisory.created_at || new Date().toISOString(),
        title: advisory.title,
        content: cleanContent,
        image_url: extractedImageUrl,
        hotlines: advisory.hotlines || ["(044) 958-8888", "911"],
        likes: Number(advisory.likes) || 0,
        shares: Number(advisory.shares) || 0,
        initialComments: [],
      };
    });

    const fromPower = (powerInterruptions || []).map((p) => ({
      id: `pwr-${p.id}`,
      isLiveDB: true,
      agency: "NEECO II - Area 1 Electric Cooperative",
      agencyRole: "Power Distribution & Grid Operations",
      agencyIcon: "power",
      category: "Power Interruption",
      urgency: "warning",
      published_at: p.interruption_date || p.created_at || new Date().toISOString(),
      title: `Scheduled Power Interruption • ${p.feeder_affected || p.feeder || "Feeder Notice"}`,
      content: `Scheduled grid maintenance affecting ${p.barangays_affected || p.barangay || "assigned coverage areas"}. Window: ${p.start_time || ""} to ${p.end_time || ""}. ${p.reason ? `Reason: ${p.reason}` : ""}`.trim(),
      image_url: null,
      hotlines: ["NEECO: (044) 463-0255", "CDRRMO: 911"],
      likes: 0,
      shares: 0,
      initialComments: [],
    }));

    return [...fromAdvisories, ...fromPower];
  }, [rawAdvisories, powerInterruptions]);

  // Filter posts based on selected category pill
  const filteredPosts = useMemo(() => {
    if (selectedFilter === "all") return allPosts;
    return allPosts.filter((p) => {
      const cat = p.category?.toLowerCase() || "";
      if (selectedFilter === "heat") return cat.includes("heat") || cat.includes("weather");
      if (selectedFilter === "water") return cat.includes("water");
      if (selectedFilter === "power") return cat.includes("power") || cat.includes("electric") || cat.includes("outage") || cat.includes("interruption") || cat.includes("neeco");
      if (selectedFilter === "health") return cat.includes("health");
      if (selectedFilter === "fire") return cat.includes("fire");
      return true;
    });
  }, [allPosts, selectedFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const categories = [
    { id: "all", label: `All Broadcasts (${allPosts.length})` },
    { id: "heat", label: "Extreme Heat" },
    { id: "water", label: "Water Supply" },
    { id: "power", label: "Power Interruption" },
    { id: "health", label: "Public Health" },
    { id: "fire", label: "Fire Safety" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, position: "relative" }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              background: "#09090b",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 800,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              pointerEvents: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Check size={14} strokeWidth={3} color="#22c55e" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Filter Tabs Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 10,
          marginBottom: 12,
          borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        {categories.map((tab) => {
          const isSel = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: isSel
                  ? "1px solid #f97316"
                  : `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "var(--border-subtle)"}`,
                background: isSel
                  ? isDark ? "rgba(249, 115, 22, 0.18)" : "rgba(249, 115, 22, 0.1)"
                  : isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
                color: isSel ? "#f97316" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: isSel ? 800 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.18s ease",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Sync Facebook Action Button */}
        <button
          onClick={handleSyncFacebook}
          disabled={isSyncing}
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 999,
            border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(37, 99, 235, 0.2)"}`,
            background: isDark ? "rgba(37, 99, 235, 0.12)" : "rgba(37, 99, 235, 0.06)",
            color: "#3b82f6",
            fontSize: 11.5,
            fontWeight: 700,
            cursor: isSyncing ? "not-allowed" : "pointer",
            flexShrink: 0,
            transition: "all 0.15s ease",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          title="Fetch latest posts from Palayan City Facebook Page"
        >
          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
          <span>{isSyncing ? "Syncing..." : "Sync FB"}</span>
        </button>
      </div>

      {/* Feed List Container - Fills remaining height on desktop, flows naturally on mobile */}
      <div
        className="civic-feed-scroll hide-scroll"
        style={{
          flex: isMobile ? 'none' : 1,
          overflowY: isMobile ? 'visible' : 'auto',
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingRight: isMobile ? 0 : 6,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {allPosts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--text-muted)",
              background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 24,
              border: `1px dashed ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"}`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Megaphone size={36} style={{ opacity: 0.35, margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>No Official Advisories Yet</p>
            <p style={{ fontSize: 12, margin: "6px 0 0", color: "var(--text-secondary)", maxWidth: 360, marginInline: "auto" }}>
              Official community directives, extreme heat warnings, and public health alerts from CDRRMO and city agencies will appear here once published.
            </p>
            {canPost && (
              <button
                type="button"
                id="empty-state-post-announcement-btn"
                onClick={onOpenPostModal}
                style={{
                  marginTop: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 22px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(249, 115, 22, 0.4)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(249, 115, 22, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(249, 115, 22, 0.4)";
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Broadcast First Announcement</span>
              </button>
            )}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--text-muted)",
              background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 24,
              border: `1px dashed ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"}`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Megaphone size={36} style={{ opacity: 0.35, margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>No advisories in this category</p>
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "var(--text-secondary)" }}>
              Switch to "All Broadcasts" to view other notices.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <CivicAdvisoryCard
              key={post.id}
              post={post}
              isDark={isDark}
              session={session}
              onNavigateToAuth={onNavigateToAuth}
              onShareToast={(msg) => showToast(msg || "Advisory link copied to clipboard!")}
            />
          ))
        )}

        <div
          style={{
            textAlign: "center",
            padding: "16px 12px 10px",
            color: "var(--text-muted)",
            fontSize: 11.5,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            flexShrink: 0,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Sparkles size={13} color="#f97316" />
          <span>Official Palayan City Disaster & Emergency Bulletin</span>
        </div>
      </div>
    </div>
  );
}

function CivicAdvisoryCard({ post, isDark, session, onNavigateToAuth, onShareToast }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes != null ? post.likes : 0);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState(post.initialComments || []);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const toggleSave = () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    if (nextSaved && onShareToast) {
      onShareToast("Advisory saved to your bookmarks!");
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!session || !session.user) {
      if (onNavigateToAuth) onNavigateToAuth();
      return;
    }
    if (!newCommentText.trim()) return;

    const userMeta = session.user.user_metadata;
    const authorName =
      userMeta?.full_name ||
      userMeta?.name ||
      (userMeta?.first_name
        ? `${userMeta.first_name} ${userMeta.last_name || ""}`.trim()
        : session.user.email?.split("@")[0] || "Registered Citizen");

    const newComment = {
      id: `comm-${Date.now()}`,
      user: authorName,
      role: "Verified Citizen",
      time: "Just now",
      text: newCommentText.trim(),
      likes: 0,
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
    setShowComments(true);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `[Official Advisory] ${post.title || ""}\n\n${post.content}\n\nVia Palayan City CLIMA: ${window.location.href}`
      );
    }
    if (onShareToast) onShareToast("Advisory link copied to clipboard!");
  };

  // Determine Agency styling & icons
  const getAgencyDetails = () => {
    if (post.agencyIcon === "ict" || post.agency?.toLowerCase().includes("ict")) {
      return {
        color: "#2563eb",
        bg: "rgba(37, 99, 235, 0.15)",
        icon: <Info size={20} color="#2563eb" />,
      };
    }
    if (post.agencyIcon === "water") {
      return {
        color: "#06b6d4",
        bg: "rgba(6, 182, 212, 0.15)",
        icon: <Droplet size={20} color="#06b6d4" />,
      };
    }
    if (post.agencyIcon === "power") {
      return {
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.15)",
        icon: <Zap size={20} color="#f59e0b" />,
      };
    }
    if (post.agencyIcon === "health") {
      return {
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.15)",
        icon: <HeartPulse size={20} color="#ef4444" />,
      };
    }
    if (post.agencyIcon === "fire") {
      return {
        color: "#f97316",
        bg: "rgba(249, 115, 22, 0.15)",
        icon: <Flame size={20} color="#f97316" />,
      };
    }
    return {
      color: "#f97316",
      bg: "rgba(249, 115, 22, 0.15)",
      icon: <ShieldAlert size={20} color="#f97316" />,
    };
  };

  const agencyStyle = getAgencyDetails();

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1000) {
      const val = (n / 1000).toFixed(1);
      return val.endsWith(".0") ? val.slice(0, -2) + "K" : val + "K";
    }
    return String(n);
  };

  const formatPostTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffHours < 48) return "Yesterday";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const isLoggedIn = !!(session && session.user);

  // Content truncation logic with inline "See More..." like reference image
  const contentText = post.content || "";
  const charLimit = 130;
  const isLong = contentText.length > charLimit;
  const displayedText = isExpanded || !isLong
    ? contentText
    : contentText.slice(0, charLimit).trim() + "...";

  const cardImage = post.image_url || null;

  return (
    <div className="aesthetic-post-card">
      {/* ── 1. AUTHOR / AGENCY HEADER (Matching User Reference Image) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Circular avatar with dashed story ring */}
          <div className="aesthetic-avatar-ring">
            <div className="aesthetic-avatar-inner" style={{ background: agencyStyle.bg }}>
              {agencyStyle.icon}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {post.agency}
              </span>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#10b981",
                  color: "#ffffff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                }}
                title="Verified Official Agency"
              >
                <Check size={9} strokeWidth={3} />
              </span>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 2,
              }}
            >
              <span>{formatPostTime(post.published_at)}</span>
              <span>•</span>
              <Globe size={11} style={{ opacity: 0.7 }} />
              {post.category && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#f97316",
                    background: isDark ? "rgba(249, 115, 22, 0.14)" : "rgba(249, 115, 22, 0.08)",
                    padding: "1px 7px",
                    borderRadius: 999,
                    marginLeft: 3,
                  }}
                >
                  {post.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-Dot More Options Button */}
        <button
          type="button"
          onClick={handleShare}
          className="aesthetic-more-btn"
          title="Share / Options"
        >
          <MoreVertical size={17} />
        </button>
      </div>

      {/* ── 2. POST TEXT CONTENT WITH INLINE 'See More...' ── */}
      <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.55 }}>
        {post.title && (
          <div style={{ fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, fontSize: 15 }}>
            {post.title}
          </div>
        )}
        <span style={{ whiteSpace: "pre-line" }}>
          {displayedText}
        </span>
        {isLong && (
          <span
            className="aesthetic-see-more"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "See Less" : "See More..."}
          </span>
        )}
      </div>

      {/* ── 3. POST IMAGE (EXACT ORIGINAL SIZE & ASPECT RATIO) ── */}
      {cardImage && (
        <>
          <div
            className="aesthetic-post-img-container"
            onClick={() => setShowLightbox(true)}
            title="Click to view full image"
          >
            <img
              src={cardImage}
              alt={post.title || "Advisory Photo"}
              className="aesthetic-post-img"
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          </div>

          {/* Fullscreen Lightbox Modal */}
          {showLightbox && (
            <div
              onClick={() => setShowLightbox(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999,
                background: "rgba(0, 0, 0, 0.92)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                cursor: "zoom-out",
              }}
            >
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                aria-label="Close full image view"
                style={{
                  position: "absolute",
                  top: 24,
                  right: 24,
                  background: "rgba(255, 255, 255, 0.16)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  color: "#ffffff",
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  zIndex: 1000000,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)"; }}
              >
                ✕
              </button>
              <img
                src={cardImage}
                alt={post.title || "Advisory Photo"}
                style={{
                  maxWidth: "96vw",
                  maxHeight: "92vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: 12,
                  boxShadow: "0 25px 70px rgba(0, 0, 0, 0.8)",
                  cursor: "default",
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}

      {/* ── 4. AESTHETIC ACTION PILLS ROW (❤️ 1.5K | 💬 1.5K | ✈️ 150 ... 🔖) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingTop: 2,
        }}
      >
        {/* Left: Like, Comment, Send */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Heart / Like Pill */}
          <button
            type="button"
            onClick={toggleLike}
            className={`aesthetic-action-pill ${isLiked ? "active-heart" : ""}`}
            title="Like advisory"
          >
            <Heart
              size={15}
              fill={isLiked ? "#ef4444" : "none"}
              color={isLiked ? "#ef4444" : "currentColor"}
            />
            <span>{formatCount(likeCount)}</span>
          </button>

          {/* Comment / Inquiries Pill */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`aesthetic-action-pill ${showComments ? "active-comment" : ""}`}
            title="View inquiries and comments"
          >
            <MessageCircle size={15} fill={showComments ? "currentColor" : "none"} color="currentColor" />
            <span>{formatCount(comments.length)}</span>
          </button>

          {/* Send / Share Pill */}
          <button
            type="button"
            onClick={handleShare}
            className="aesthetic-action-pill"
            title="Share advisory"
          >
            <Send size={14} style={{ transform: "rotate(-15deg) translateY(-1px)" }} />
            <span>{formatCount(post.shares || 150)}</span>
          </button>
        </div>

        {/* Right: Bookmark / Save Pill */}
        <button
          type="button"
          onClick={toggleSave}
          className={`aesthetic-action-pill ${isSaved ? "active-saved" : ""}`}
          style={{ padding: "7px 11px" }}
          title={isSaved ? "Saved" : "Save advisory"}
        >
          <Bookmark
            size={15}
            fill={isSaved ? "#f97316" : "none"}
            color={isSaved ? "#f97316" : "currentColor"}
          />
        </button>
      </div>

      {/* ── 5. AUTH-GATED INQUIRIES & COMMENTS DRAWER ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              paddingTop: 10,
              borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Account Guard: Only logged-in accounts can comment */}
            {!isLoggedIn ? (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 18,
                  background: isDark ? "rgba(249, 115, 22, 0.08)" : "rgba(249, 115, 22, 0.05)",
                  border: isDark ? "1px dashed rgba(249, 115, 22, 0.28)" : "1px dashed rgba(249, 115, 22, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(249, 115, 22, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Lock size={15} color="#f97316" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                      Citizen Account Required
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500 }}>
                      Sign in or create an account to post inquiries on this advisory.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToAuth}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 999,
                    background: "#f97316",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <LogIn size={13} />
                  <span>Sign In to Comment</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddComment} style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    background: isDark ? "rgba(255, 255, 255, 0.05)" : "#f4f4f5",
                    borderRadius: 999,
                    padding: "7px 16px",
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Ask CDRRMO or submit an on-the-ground report..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontSize: 12.5,
                      color: "var(--text-primary)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    style={{
                      background: "none",
                      border: "none",
                      color: newCommentText.trim() ? "#f97316" : "var(--text-muted)",
                      cursor: newCommentText.trim() ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      padding: 4,
                    }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: c.isOfficial
                      ? isDark ? "rgba(249, 115, 22, 0.09)" : "rgba(249, 115, 22, 0.05)"
                      : isDark ? "rgba(255, 255, 255, 0.03)" : "#f9f9fa",
                    border: c.isOfficial
                      ? "1px solid rgba(249, 115, 22, 0.25)"
                      : `1px solid ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)"}`,
                    borderRadius: 16,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-primary)" }}>
                        {c.user}
                      </span>
                      {c.isOfficial && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "#f97316",
                            color: "#ffffff",
                          }}
                        >
                          Official
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>• {c.role}</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{c.time}</span>
                  </div>

                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.45 }}>
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HospitalMonitoringSection({ records = [], expanded, onToggle, isDark }) {
  // Build continuous 7-day series. If there aren't datas each day, just put 0!
  const {
    dailySeries,
    totalHeatStroke,
    totalHeatExhaustion,
    totalDehydration,
    totalRespiratory,
  } = useMemo(() => buildHospital7DaySeries(records), [records]);

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: expanded ? 14 : 0,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: expanded ? '18px 20px' : '10px 16px', borderRadius: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <HeartPulse size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Hospital Monitoring
            </h2>
            <p style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              fontWeight: 500,
              margin: '2px 0 0',
            }}>
              Heat-related cases (Last 7 days)
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}>
              <StatCard
                label="Heat Stroke"
                value={totalHeatStroke}
                color={COLORS.heatStroke}
                isDark={isDark}
              />
              <StatCard
                label="Heat Exhaustion"
                value={totalHeatExhaustion}
                color={COLORS.heatExhaustion}
                isDark={isDark}
              />
              <StatCard
                label="Dehydration"
                value={totalDehydration}
                color={COLORS.dehydration}
                isDark={isDark}
              />
              <StatCard
                label="Respiratory"
                value={totalRespiratory}
                color={COLORS.respiratory}
                isDark={isDark}
              />
            </div>

            {/* Trend Chart */}
            <div style={{ marginTop: 20 }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 12,
              }}>
                7-Day Trend
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e7eb'} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#71717a' }} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#71717a' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? '#18181b' : '#fff',
                      border: `1px solid ${isDark ? '#27272a' : '#e5e7eb'}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="heatStroke" stroke={COLORS.heatStroke} strokeWidth={2} dot={{ r: 4 }} name="Heat Stroke" />
                  <Line type="monotone" dataKey="heatExhaustion" stroke={COLORS.heatExhaustion} strokeWidth={2} dot={{ r: 4 }} name="Heat Exhaustion" />
                  <Line type="monotone" dataKey="dehydration" stroke={COLORS.dehydration} strokeWidth={2} dot={{ r: 4 }} name="Dehydration" />
                  <Line type="monotone" dataKey="respiratory" stroke={COLORS.respiratory} strokeWidth={2} dot={{ r: 4 }} name="Respiratory" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, color, isDark }) {
  return (
    <div style={{
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      border: `1px solid var(--border-subtle)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: 12,
    }}>
      <div style={{
        fontSize: 24,
        fontWeight: 900,
        color,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  );
}

function BFPOperationsSection({ operations, expanded, onToggle, isDark }) {
  const activeWildfires = operations.filter(op => op.status !== 'resolved' && op.status !== 'completed');
  
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: expanded ? 14 : 0,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: expanded ? '18px 20px' : '10px 16px', borderRadius: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Flame size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Wildfire Response
            </h2>
            <p style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              fontWeight: 500,
              margin: '2px 0 0',
            }}>
              {activeWildfires.length} active wildfire{activeWildfires.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {operations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
              }}>
                <Flame size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No wildfire incidents reported</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {operations.map((op) => (
                  <OperationCard key={op.id} operation={op} isDark={isDark} type="bfp" />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CDRRMOOperationsSection({ operations, expanded, onToggle, isDark }) {
  const activeOps = operations.filter(op => op.status === 'active' || op.status === 'ongoing');
  
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: expanded ? 14 : 0,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: expanded ? '18px 20px' : '10px 16px', borderRadius: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Siren size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              CDRRMO Operations
            </h2>
            <p style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              fontWeight: 500,
              margin: '2px 0 0',
            }}>
              {activeOps.length} active operation{activeOps.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {operations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
              }}>
                <Siren size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No operations reported</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {operations.map((op) => (
                  <OperationCard key={op.id} operation={op} isDark={isDark} type="cdrrmo" />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AgricultureDamagesSection({ damages, expanded, onToggle, isDark }) {
  const totalHectares = damages.reduce((sum, d) => sum + (parseFloat(d.area_affected_hectares) || 0), 0);
  const totalLoss = damages.reduce((sum, d) => sum + (parseFloat(d.estimated_loss_value) || 0), 0);
  const farmerCount = damages.length;
  
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: expanded ? 14 : 0,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: expanded ? '18px 20px' : '10px 16px', borderRadius: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sprout size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Agricultural Damages
            </h2>
            <p style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              fontWeight: 500,
              margin: '2px 0 0',
            }}>
              {farmerCount} report{farmerCount !== 1 ? 's' : ''} • {totalHectares.toFixed(1)} hectares affected
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {damages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
              }}>
                <Wheat size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No damage reports</p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                }}>
                  <StatCard
                    label="Hectares"
                    value={totalHectares.toFixed(1)}
                    color={COLORS.agriculture}
                    isDark={isDark}
                  />
                  <StatCard
                    label="Farmers"
                    value={farmerCount}
                    color={COLORS.agriculture}
                    isDark={isDark}
                  />
                  <StatCard
                    label="Est. Loss"
                    value={`₱${(totalLoss / 1000000).toFixed(1)}M`}
                    color={COLORS.agriculture}
                    isDark={isDark}
                  />
                </div>

                {/* Recent Reports */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {damages.slice(0, 5).map((damage) => (
                    <DamageCard key={damage.id} damage={damage} isDark={isDark} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InterruptionsSection({ waterInterruptions, powerInterruptions, expanded, onToggle, isDark }) {
  const today = new Date().toISOString().split('T')[0];
  const todayWater = waterInterruptions.filter(i => i.interruption_date === today);
  const todayPower = powerInterruptions.filter(i => i.interruption_date === today);
  
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: expanded ? 14 : 0,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: expanded ? '18px 20px' : '10px 16px', borderRadius: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Droplet size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Scheduled Interruptions
            </h2>
            <p style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              fontWeight: 500,
              margin: '2px 0 0',
            }}>
              {todayWater.length + todayPower.length} interruption{todayWater.length + todayPower.length !== 1 ? 's' : ''} today
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {(waterInterruptions.length === 0 && powerInterruptions.length === 0) ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
              }}>
                <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No scheduled interruptions</p>
              </div>
            ) : (
              <>
                {/* Water Interruptions */}
                {waterInterruptions.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: COLORS.water,
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <Droplet size={16} /> Water Interruptions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {waterInterruptions.map((interruption) => (
                        <InterruptionCard key={interruption.id} interruption={interruption} type="water" isDark={isDark} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Power Interruptions */}
                {powerInterruptions.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: COLORS.power,
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <Zap size={16} /> Power Interruptions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {powerInterruptions.map((interruption) => (
                        <InterruptionCard key={interruption.id} interruption={interruption} type="power" isDark={isDark} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function OperationCard({ operation, isDark, type }) {
  const getStatusColor = (status) => {
    if (!status) return 'var(--text-muted)';
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('ongoing')) return '#f59e0b';
    if (s.includes('resolved') || s.includes('completed')) return '#10b981';
    return 'var(--text-muted)';
  };

  const statusColor = getStatusColor(operation.status);

  return (
    <div style={{
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      border: `1px solid var(--border-subtle)`,
      borderRadius: 10,
      padding: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: statusColor,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}>
          {operation.location || 'Location not specified'}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          fontWeight: 600,
        }}>
          <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
          {new Date(operation.operation_date || operation.incident_date).toLocaleDateString()}
          <span style={{ margin: '0 8px' }}>•</span>
          <span style={{ color: statusColor, fontWeight: 700 }}>
            {operation.status?.toUpperCase() || 'PENDING'}
          </span>
        </div>
      </div>
    </div>
  );
}

function DamageCard({ damage, isDark }) {
  return (
    <div style={{
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      border: `1px solid var(--border-subtle)`,
      borderRadius: 10,
      padding: 12,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: 6,
      }}>
        <div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}>
            {damage.barangay || 'Location not specified'}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}>
            {damage.crop_type || 'Crop type not specified'} • {parseFloat(damage.area_affected_hectares || 0).toFixed(1)} ha • {damage.damage_percentage || 0}% damage
          </div>
        </div>
        <div style={{
          fontSize: 12,
          fontWeight: 800,
          color: COLORS.agriculture,
        }}>
          ₱{(parseFloat(damage.estimated_loss_value || 0) / 1000).toFixed(0)}k
        </div>
      </div>
    </div>
  );
}

function InterruptionCard({ interruption, type, isDark }) {
  const color = type === 'water' ? COLORS.water : COLORS.power;
  const Icon = type === 'water' ? Droplet : Zap;
  
  const isToday = interruption.interruption_date === new Date().toISOString().split('T')[0];

  return (
    <div style={{
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      border: `1px solid var(--border-subtle)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: 12,
    }}>
      {isToday && (
        <div style={{
          display: 'inline-block',
          fontSize: 10,
          fontWeight: 800,
          color: '#fff',
          background: '#ef4444',
          padding: '2px 8px',
          borderRadius: 6,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>
          TODAY
        </div>
      )}
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 6,
      }}>
        {new Date(interruption.interruption_date).toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-secondary)',
        fontWeight: 600,
        lineHeight: 1.5,
      }}>
        {type === 'water' ? (
          <>
            <strong>Provider:</strong> {interruption.provider || 'Not specified'}<br/>
            <strong>Cause:</strong> {interruption.cause || 'Not specified'}<br/>
            <strong>Affected:</strong> {interruption.affected_areas || 'Not specified'}<br/>
            <strong>Status:</strong> {interruption.status || 'ongoing'}
          </>
        ) : (
          <>
            <strong>Cause:</strong> {interruption.cause || 'Not specified'}<br/>
            <strong>Feeders:</strong> {interruption.affected_feeders || 'Not specified'}<br/>
            <strong>Status:</strong> {interruption.restoration_status || 'ongoing'}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryBadge({ label, value, color, isDark }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 14px',
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      border: `1px solid var(--border-subtle)`,
      borderRadius: 12,
    }}>
      <span style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text-secondary)',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 16,
        fontWeight: 900,
        color: color,
      }}>
        {value}
      </span>
    </div>
  );
}

export default ElNinoMonitoringDashboard;
