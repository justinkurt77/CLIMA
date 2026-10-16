import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
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

function ElNinoMonitoringDashboard() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
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
    const advisoriesChannel = supabase
      .channel('public:advisories')
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
      advisoriesChannel.unsubscribe();
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
        .limit(5);
      
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
      
      const { data: operations } = await supabase
        .from('bfp_operations')
        .select('*')
        .or('operation_type.eq.wildfire,incident_type.eq.wildfire')
        .gte('operation_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('operation_date', { ascending: false });
      
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
      <div className="desktop-view-container" style={{ paddingTop: 18, paddingBottom: 40 }}>
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
        <main className="desktop-main-grid">
          {/* Left Column - Dedicated Newsfeed Tab */}
          <div className="desktop-left-column">
            {/* Official Advisories (Live Newsfeed) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <AdvisoriesSection
                advisories={data.advisories}
                expanded={expandedSections.advisories}
                onToggle={() => toggleSection('advisories')}
                isDark={isDark}
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
              style={{ padding: '20px 22px' }}
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
        display: isMobile ? 'block' : 'none',
        padding: 'max(20px, env(safe-area-inset-top, 20px)) 16px 96px',
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
          expanded={expandedSections.advisories}
          onToggle={() => toggleSection('advisories')}
          isDark={isDark}
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
    </>
  );
}

// Section Components
function AdvisoriesSection({ advisories, expanded, onToggle, isDark }) {
  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1877f2 0%, #0d65d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(24, 119, 242, 0.35)',
          }}>
            <Megaphone size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{
                fontSize: 18,
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
                color: '#1877f2',
                background: isDark ? 'rgba(24, 119, 242, 0.18)' : 'rgba(24, 119, 242, 0.1)',
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid rgba(24, 119, 242, 0.3)',
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
              margin: '3px 0 0',
            }}>
              Official LGU announcements, heat alerts, and community response updates
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <FacebookAdvisoriesFeed rawAdvisories={advisories} isDark={isDark} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const OFFICIAL_COMMUNITY_ADVISORIES = [
  {
    id: "official-heat-alert-47",
    isOfficialSeed: true,
    agency: "Palayan City CDRRMO",
    agencyRole: "Disaster Risk Reduction Office",
    agencyIcon: "shield",
    category: "Extreme Heat",
    urgency: "critical",
    published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    title: "CRITICAL HEAT INDEX ALERT (46.8°C) — Outdoor Activity Restriction & Air-Conditioned Cooling Shelters Activated",
    content: "The City Disaster Risk Reduction & Management Office (CDRRMO) issues a DANGER LEVEL Heat Index Warning across all 19 Barangays in Palayan City.\n\n⚠️ Public Safety Advisories:\n1. Limit outdoor activities between 10:00 AM and 4:00 PM when solar radiation and ambient heat peak.\n2. Hydrate frequently with clean water; avoid caffeinated or high-sugar drinks.\n3. Public Air-Conditioned Cooling Shelters are OPEN 24/7 at the City Hall Civic Gym and designated Barangay multi-purpose shelters.\n4. Ensure children, pregnant women, and senior citizens stay in shaded, well-ventilated areas.\n\n🚨 For heat exhaustion or heat stroke emergencies, dial 911 or call CDRRMO Palayan Hotline: (044) 958-8888 immediately.",
    hotlines: ["(044) 958-8888", "911 CDRRMO"],
    likes: 84,
    shares: 32,
    initialComments: [
      { id: "c1", user: "Maria Santos", role: "Brgy. Singalat Resident", time: "1 hr ago", text: "Are the clean water refill stations open today at the Civic Center?", likes: 4 },
      { id: "c2", user: "CDRRMO Palayan", isOfficial: true, role: "Official Response", time: "42 min ago", text: "Yes Ma'am Maria, all 4 public water refill hubs at the Civic Center and Singalat Health Post are operating 24/7 with filtered potable water.", likes: 11 },
      { id: "c3", user: "Ramon Villanueva", role: "Brgy. Caballero", time: "25 min ago", text: "Thank you for the early warning! We have paused all outdoor construction work until 4 PM.", likes: 6 },
    ],
  },
  {
    id: "official-water-protocol",
    isOfficialSeed: true,
    agency: "Palayan City Water District (PCWD)",
    agencyRole: "Municipal Water Utility",
    agencyIcon: "water",
    category: "Water",
    urgency: "warning",
    published_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    title: "WATER CONSERVATION NOTICE: Rotational Supply & Mobile Tanker Dispatch for Western Barangays",
    content: "Due to sustained high heat and declining reservoir levels at the Aulo Dam basin and Peñaranda River intake, the Palayan City Water District (PCWD) is implementing rotational pressure regulation.\n\n📍 Sectors Under Pressure Regulation: Singalat, Caballero, Popolon, and Atate.\n🕒 Peak Pressure Window: 5:00 AM – 9:00 AM & 5:00 PM – 9:00 PM daily.\n\n💡 Critical Citizen Action:\n• Please store sufficient domestic water during morning high-pressure hours.\n• Refrain from hose-washing vehicles or filling decorative pools.\n• Mobile Water Tanker Rover #2 is en route to elevated puroks today.\n\n📞 Water Tanker Dispatch Requests: (044) 958-1122 or PCWD Hotline 0919-PCWD-PLYN.",
    hotlines: ["(044) 958-1122", "PCWD Helpdesk"],
    likes: 65,
    shares: 21,
    initialComments: [
      { id: "c4", user: "Elena Mercado", role: "Brgy. Popolon Resident", time: "3 hrs ago", text: "What time will Tanker Rover #2 arrive in Purok 3?", likes: 3 },
      { id: "c5", user: "PCWD Dispatch", isOfficial: true, role: "Official Response", time: "2 hrs ago", text: "Rover #2 is scheduled for Popolon Purok 3 between 2:00 PM and 4:00 PM today. Please have clean containers ready.", likes: 8 },
    ],
  },
  {
    id: "official-health-ors",
    isOfficialSeed: true,
    agency: "Palayan City Health Office (CHO)",
    agencyRole: "Public Health Command",
    agencyIcon: "health",
    category: "Health",
    urgency: "urgent",
    published_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    title: "PUBLIC HEALTH ALERT: Free Oral Rehydration Salt (ORS) Distribution & Heat Stroke First-Aid",
    content: "The City Health Office (CHO) and Palayan Rural Health Unit (RHU) announce free Oral Rehydration Salts (ORS) and electrolyte packets available at all 19 Barangay Health Stations starting today.\n\n🩺 How to Recognize Heat Illnesses:\n• Heat Cramps: Involuntary muscle spasms, intense thirst.\n• Heat Exhaustion: Heavy sweating, rapid weak pulse, nausea, dizziness.\n• Heat Stroke: Red dry/damp skin, confusion, body temp above 40°C — A MEDICAL EMERGENCY!\n\nIf someone collapses, move them to shade immediately, apply cold damp cloths to neck and armpits, and summon our ambulance crew.",
    hotlines: ["(044) 958-2000", "Palayan District Hospital"],
    likes: 112,
    shares: 49,
    initialComments: [
      { id: "c6", user: "Dr. Aris Ramos", isOfficial: true, role: "RHU Medical Officer", time: "7 hrs ago", text: "Please look out for vulnerable elderly neighbors living alone. Stay well hydrated, Palayanos!", likes: 24 },
    ],
  },
  {
    id: "official-bfp-kaingin-ban",
    isOfficialSeed: true,
    agency: "Bureau of Fire Protection (BFP)",
    agencyRole: "Palayan Central Fire Station",
    agencyIcon: "fire",
    category: "Fire Safety",
    urgency: "critical",
    published_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    title: "TOTAL BAN ON AGRICULTURAL OPEN BURNING (KAINGIN) & GRASSLAND BURNING",
    content: "Under Republic Act 9003 and the Fire Code of the Philippines, the Bureau of Fire Protection (BFP) strictly prohibits any open burning of agricultural waste, rice hay, or dried foliage across all agricultural sectors of Palayan City.\n\n🔥 Why This is Strictly Enforced:\n• With heat index exceeding 46°C and gusty winds, small fires spread into uncontrollable brush fires within minutes.\n• Violators will be held criminally liable under environmental and fire safety laws.\n\n🚨 Report smoke or brush fires immediately: 958-FIRE (3473) or dial 911.",
    hotlines: ["958-FIRE (3473)", "BFP Palayan"],
    likes: 98,
    shares: 63,
    initialComments: [
      { id: "c7", user: "Brgy. Langka Peace & Order", role: "Barangay Volunteer", time: "12 hrs ago", text: "Our barangay roving patrols are strictly monitoring farm borders daily.", likes: 16 },
    ],
  },
];

function FacebookAdvisoriesFeed({ rawAdvisories = [], isDark }) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState(null);

  // Combine live Supabase advisories with official Palayan community baseline posts
  const allPosts = useMemo(() => {
    const liveMapped = rawAdvisories.map((advisory) => {
      const cat = advisory.category || "General";
      let agency = "Palayan City CDRRMO";
      let agencyRole = "Official City Advisory";
      let agencyIcon = "shield";
      let urgency = "normal";

      const catLower = cat.toLowerCase();
      if (catLower.includes("water")) {
        agency = "Palayan City Water District";
        agencyRole = "Municipal Water Utility";
        agencyIcon = "water";
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
        content: advisory.content,
        image_url: advisory.image_url,
        hotlines: ["(044) 958-8888", "911"],
        likes: 38,
        shares: 14,
        initialComments: [
          {
            id: `c-live-${advisory.id}-1`,
            user: "CDRRMO Information Desk",
            isOfficial: true,
            role: "Verified Desk",
            time: "Recently",
            text: "Official public advisory published for Palayan City citizens. Please share with your barangay group chats.",
            likes: 5,
          },
        ],
      };
    });

    // Merge live DB posts first, then official baseline community posts
    return [...liveMapped, ...OFFICIAL_COMMUNITY_ADVISORIES];
  }, [rawAdvisories]);

  // Filter posts based on selected category pill
  const filteredPosts = useMemo(() => {
    if (selectedFilter === "all") return allPosts;
    return allPosts.filter((p) => {
      const cat = p.category?.toLowerCase() || "";
      if (selectedFilter === "heat") return cat.includes("heat") || cat.includes("weather");
      if (selectedFilter === "water") return cat.includes("water");
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
    { id: "all", label: `All Posts (${allPosts.length})` },
    { id: "heat", label: "Extreme Heat" },
    { id: "water", label: "Water Supply" },
    { id: "health", label: "Public Health" },
    { id: "fire", label: "Fire Safety" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              background: "#1877f2",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              boxShadow: "0 8px 24px rgba(24, 119, 242, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            <Check size={14} strokeWidth={3} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter Chips (Facebook Feed style) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          scrollbarWidth: "none",
          paddingBottom: 4,
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
                  ? "1.5px solid #1877f2"
                  : `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
                background: isSel
                  ? isDark ? "rgba(24, 119, 242, 0.22)" : "rgba(24, 119, 242, 0.12)"
                  : isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
                color: isSel ? "#1877f2" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: isSel ? 800 : 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Facebook Feed Container */}
      <div
        className="facebook-feed-scroll"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {filteredPosts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "var(--text-muted)",
              background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 16,
              border: `1px dashed ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"}`,
            }}
          >
            <Megaphone size={40} style={{ opacity: 0.35, margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>No advisories in this category</p>
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "var(--text-secondary)" }}>
              Switch to "All Posts" to see other active advisories.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <FacebookAdvisoryCard
              key={post.id}
              post={post}
              isDark={isDark}
              onShareToast={() => showToast("Advisory link copied to clipboard!")}
            />
          ))
        )}

        <div
          style={{
            textAlign: "center",
            padding: "16px 12px 6px",
            color: "var(--text-muted)",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Sparkles size={13} color="#1877f2" />
          <span>You're all caught up with official Palayan City advisories</span>
        </div>
      </div>
    </div>
  );
}

function FacebookAdvisoryCard({ post, isDark, onShareToast }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 42);
  const [comments, setComments] = useState(post.initialComments || []);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      user: "Citizen (You)",
      role: "Palayan Resident",
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
        `[Official Advisory] ${post.title}\n\n${post.content}\n\nVia Palayan City CLIMA: ${window.location.href}`
      );
    }
    if (onShareToast) onShareToast();
  };

  // Determine Agency styling & icons
  const getAgencyDetails = () => {
    if (post.agencyIcon === "water") {
      return {
        bg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
        icon: <Droplet size={20} color="#fff" />,
        badgeColor: "#0284c7",
        badgeBg: isDark ? "rgba(2, 132, 199, 0.2)" : "rgba(2, 132, 199, 0.12)",
      };
    }
    if (post.agencyIcon === "health") {
      return {
        bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        icon: <HeartPulse size={20} color="#fff" />,
        badgeColor: "#ef4444",
        badgeBg: isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.12)",
      };
    }
    if (post.agencyIcon === "fire") {
      return {
        bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        icon: <Flame size={20} color="#fff" />,
        badgeColor: "#f97316",
        badgeBg: isDark ? "rgba(249, 115, 22, 0.2)" : "rgba(249, 115, 22, 0.12)",
      };
    }
    // Default CDRRMO / Shield
    return {
      bg: "linear-gradient(135deg, #1877f2 0%, #0d65d9 100%)",
      icon: <ShieldAlert size={20} color="#fff" />,
      badgeColor: "#1877f2",
      badgeBg: isDark ? "rgba(24, 119, 242, 0.2)" : "rgba(24, 119, 242, 0.12)",
    };
  };

  const agencyStyle = getAgencyDetails();

  // Urgency tag colors
  const getUrgencyBadge = () => {
    if (post.urgency === "critical") {
      return { label: "CRITICAL ALERT", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
    }
    if (post.urgency === "urgent") {
      return { label: "HEALTH WARNING", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" };
    }
    if (post.urgency === "warning") {
      return { label: "UTILITY ADVISORY", color: "#0284c7", bg: "rgba(2, 132, 199, 0.15)" };
    }
    return { label: "PUBLIC NOTICE", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
  };

  const urgencyBadge = getUrgencyBadge();

  // Format relative timestamp
  const formatPostTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <div
      style={{
        background: isDark ? "#18191a" : "#ffffff",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
        borderRadius: 18,
        padding: "16px 18px",
        boxShadow: isDark
          ? "0 4px 20px rgba(0, 0, 0, 0.4)"
          : "0 2px 14px rgba(0, 0, 0, 0.06)",
        position: "relative",
      }}
    >
      {/* ── 1. FACEBOOK POST HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Agency Avatar with Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: agencyStyle.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {agencyStyle.icon}
            <span
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#22c55e",
                border: `2px solid ${isDark ? "#18191a" : "#ffffff"}`,
              }}
            />
          </div>

          {/* Agency Name & Post Meta */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: -0.2,
                }}
              >
                {post.agency}
              </span>
              <CheckCircle2 size={15} color="#1877f2" fill="#1877f2" style={{ color: "#fff" }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: agencyStyle.badgeBg,
                  color: agencyStyle.badgeColor,
                }}
              >
                LGU Official
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                {formatPostTime(post.published_at)}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>•</span>
              <span
                title="Public Advisory"
                style={{ display: "inline-flex", alignItems: "center", color: "var(--text-muted)" }}
              >
                <Globe size={11} />
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>•</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: urgencyBadge.color,
                  background: urgencyBadge.bg,
                  padding: "1px 6px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                {urgencyBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Options / More Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: "none",
              border: "none",
              padding: "6px",
              borderRadius: "50%",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: 30,
                right: 0,
                background: isDark ? "#242526" : "#ffffff",
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"}`,
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                padding: "6px",
                width: 170,
                zIndex: 30,
              }}
            >
              <button
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "none",
                  border: "none",
                  borderRadius: 8,
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Copy size={13} />
                <span>Copy Advisory Link</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. FACEBOOK POST BODY ── */}
      <div style={{ marginBottom: 14 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1.4,
            margin: "0 0 8px",
          }}
        >
          {post.title}
        </h3>

        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            maxHeight: isExpanded ? "none" : 120,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {DOMPurify.sanitize(post.content)}
        </div>

        {post.content && post.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              marginTop: 6,
              fontSize: 12.5,
              fontWeight: 800,
              color: "#1877f2",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isExpanded ? "See less" : "See more..."}
          </button>
        )}

        {/* Facebook-style Hashtags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {["#PalayanCity", "#ElNinoAdvisory", "#LGUResponse", "#PublicSafety"].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#1877f2",
                cursor: "pointer",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. FACEBOOK-STYLE EMERGENCY INFOGRAPHIC NOTICE BANNER ── */}
      {post.image_url ? (
        <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
          <img
            src={post.image_url}
            alt={post.title}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      ) : (
        <div
          style={{
            borderRadius: 14,
            padding: "16px 18px",
            background: isDark
              ? "linear-gradient(135deg, rgba(24, 119, 242, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)"
              : "linear-gradient(135deg, rgba(24, 119, 242, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldAlert size={16} color={urgencyBadge.color} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: urgencyBadge.color,
                }}
              >
                OFFICIAL CITIZEN NOTICE
              </span>
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              CITY OF PALAYAN
            </span>
          </div>

          <div
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 10,
            }}
          >
            {post.title}
          </div>

          {/* Hotline Footer Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              paddingTop: 8,
              borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)" }}>
              Emergency Operations Center: <strong>(044) 958-8888</strong> · <strong>911</strong>
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#1877f2",
                background: isDark ? "rgba(24, 119, 242, 0.2)" : "rgba(24, 119, 242, 0.1)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              Verified LGU Release
            </span>
          </div>
        </div>
      )}

      {/* ── 4. SOCIAL COUNTS BAR (Facebook Style) ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 8,
          marginBottom: 6,
          fontSize: 12,
          color: "var(--text-muted)",
          fontWeight: 600,
        }}
      >
        {/* Stacked Facebook Reaction Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#1877f2",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                zIndex: 3,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              👍
            </span>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#ef4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                marginLeft: -5,
                zIndex: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              ❤️
            </span>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#f59e0b",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                marginLeft: -5,
                zIndex: 1,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              ⚠️
            </span>
          </div>
          <span>
            {isLiked ? `You and ${likesCount - 1} others acknowledged` : `${likesCount} citizens acknowledged`}
          </span>
        </div>

        {/* Comments and Shares count */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            onClick={() => setShowComments(!showComments)}
            style={{ cursor: "pointer" }}
          >
            {comments.length} comments
          </span>
          <span>•</span>
          <span>{post.shares} shares</span>
        </div>
      </div>

      {/* ── 5. FACEBOOK ACTION BUTTONS (Like, Comment, Share) ── */}
      <div
        style={{
          display: "flex",
          borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
          paddingTop: 4,
          marginBottom: showComments ? 12 : 0,
        }}
      >
        <button
          onClick={toggleLike}
          className={`fb-post-action-btn ${isLiked ? "active-liked" : ""}`}
        >
          <ThumbsUp
            size={16}
            color={isLiked ? "#1877f2" : "var(--text-secondary)"}
            fill={isLiked ? "#1877f2" : "none"}
          />
          <span>{isLiked ? "Acknowledged" : "Acknowledge"}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="fb-post-action-btn"
        >
          <MessageCircle size={16} color="var(--text-secondary)" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="fb-post-action-btn"
        >
          <Share2 size={16} color="var(--text-secondary)" />
          <span>Share</span>
        </button>
      </div>

      {/* ── 6. INLINE COMMENTS SECTION (Facebook style) ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
              paddingTop: 12,
            }}
          >
            {/* Comment Input */}
            <form onSubmit={handleAddComment} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#1877f2",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                C
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                  borderRadius: 20,
                  padding: "4px 12px",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                }}
              >
                <input
                  type="text"
                  placeholder="Write a comment or ask CDRRMO..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: 12,
                    color: "var(--text-primary)",
                    padding: "4px 0",
                  }}
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  style={{
                    background: "none",
                    border: "none",
                    color: newCommentText.trim() ? "#1877f2" : "var(--text-muted)",
                    cursor: newCommentText.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {comments.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c.isOfficial ? "#1877f2" : isDark ? "#3a3b3c" : "#e4e6eb",
                      color: c.isOfficial ? "#ffffff" : "var(--text-primary)",
                      fontSize: 10,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {c.isOfficial ? "🛡️" : c.user[0]}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        background: isDark ? "#242526" : "#f0f2f5",
                        borderRadius: 14,
                        padding: "8px 12px",
                        display: "inline-block",
                        maxWidth: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-primary)" }}>
                          {c.user}
                        </span>
                        {c.isOfficial && (
                          <CheckCircle2 size={11} color="#1877f2" fill="#1877f2" style={{ color: "#fff" }} />
                        )}
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>• {c.role}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                        {c.text}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginLeft: 10, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>
                        {c.time}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Like {c.likes > 0 && `(${c.likes})`}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Reply
                      </span>
                    </div>
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
    marginBottom: 16,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <HeartPulse size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}>
              Hospital Monitoring
            </h2>
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              Heat-related cases (Last 7 days)
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
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
    marginBottom: 16,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Flame size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}>
              Wildfire Response
            </h2>
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              {activeWildfires.length} active wildfire{activeWildfires.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
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
    marginBottom: 16,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Siren size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}>
              CDRRMO Operations
            </h2>
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              {activeOps.length} active operation{activeOps.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
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
    marginBottom: 16,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sprout size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}>
              Agricultural Damages
            </h2>
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              {farmerCount} report{farmerCount !== 1 ? 's' : ''} • {totalHectares.toFixed(1)} hectares affected
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
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
    marginBottom: 16,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <div className="desktop-card" style={{ padding: '20px 22px', marginBottom: 16 }}>
      <div style={sectionHeaderStyle} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Droplet size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}>
              Scheduled Interruptions
            </h2>
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              {todayWater.length + todayPower.length} interruption{todayWater.length + todayPower.length !== 1 ? 's' : ''} today
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
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
