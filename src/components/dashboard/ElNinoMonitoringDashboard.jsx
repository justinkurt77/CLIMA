import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

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
    hospital: true,
    bfp: true,
    cdrrmo: true,
    agriculture: true,
    interruptions: true,
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
      console.error('Error fetching advisories:', error);
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
      console.error('Error fetching hospital data:', error);
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
      console.error('Error fetching BFP operations:', error);
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
      console.error('Error fetching CDRRMO operations:', error);
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
      console.error('Error fetching agriculture damages:', error);
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
      console.error('Error fetching interruptions:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="desktop-view-container">
        <div className="desktop-main-grid">
          <div className="desktop-left-column">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="desktop-card"
                style={{
                  height: 200,
                  marginBottom: 20,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  background: isDark ? '#27272a' : '#f4f4f5',
                }}
              />
            ))}
          </div>
          <div className="desktop-right-column">
            {[1, 2].map(i => (
              <div
                key={i}
                className="desktop-card"
                style={{
                  height: 150,
                  marginBottom: 20,
                  animation: 'pulse 1.5s ease-in-out infinite',
                  background: isDark ? '#27272a' : '#f4f4f5',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const last7Days = data.hospitalRecords.slice(-7);
  const totalHospitalCases = last7Days.reduce((sum, r) => 
    sum + (r.heat_stroke_cases || 0) + (r.heat_exhaustion_cases || 0) + 
    (r.dehydration_cases || 0) + (r.respiratory_cases || 0), 0
  );
  const activeWildfires = data.bfpOperations.filter(op => 
    op.status !== 'resolved' && op.status !== 'completed'
  ).length;
  const totalHectares = data.agricultureDamages.reduce((sum, d) => 
    sum + (parseFloat(d.area_affected_hectares) || 0), 0
  );
  const totalLoss = data.agricultureDamages.reduce((sum, d) => 
    sum + (parseFloat(d.estimated_loss_value) || 0), 0
  );

  const heroBgUrl = isDark ? "/sunny_dark.jpg" : "/sunny.jpg";

  return (
    <>
      {/* Desktop View (>= 1024px) */}
      <div className="desktop-view-container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="desktop-hero-card"
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: isDark ? "#161922" : "#f8fafc",
            marginBottom: 22,
            borderRadius: 24,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isDark
              ? "0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)"
              : "0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Dynamic Animated Background Transition */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={heroBgUrl}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url('${heroBgUrl}')`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </AnimatePresence>
          </div>

          {/* Hero Content Left */}
          <div className="desktop-hero-info">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.45) 0%, rgba(249, 115, 22, 0.3) 100%)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.28)",
                  boxShadow: "0 10px 28px rgba(239, 68, 68, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <ThermometerSun size={28} strokeWidth={2.4} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }} />
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "rgba(15, 18, 24, 0.65)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ef4444",
                    boxShadow: "0 0 10px #ef4444",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#fca5a5",
                  }}
                >
                  Extreme Heat & Drought Advisory
                </span>
              </div>
            </div>
            <h1 className="desktop-hero-temp" style={{ fontSize: 48, letterSpacing: -1.5 }}>
              El Niño Impact Dashboard
            </h1>
            <p className="desktop-hero-condition" style={{ fontSize: 18 }}>
              Real-time monitoring of Super El Niño effects
            </p>
          </div>

          {/* Hero Glass Card Right */}
          <div className="desktop-hero-glass-card">
            <p>
              Real-time monitoring of Super El Niño effects across Palayan City with live sensor data and coordinated agency response tracking.
            </p>
          </div>
        </motion.div>

        {/* Two-column grid */}
        <main className="desktop-main-grid">
          {/* Left Column */}
          <div className="desktop-left-column">
            {/* Official Advisories */}
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

            {/* Hospital Monitoring */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
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
              transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
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
              transition={{ duration: 0.5, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <AgricultureDamagesSection
                damages={data.agricultureDamages}
                expanded={expandedSections.agriculture}
                onToggle={() => toggleSection('agriculture')}
                isDark={isDark}
              />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="desktop-right-column">
            {/* CDRRMO Operations */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
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
              transition={{ duration: 0.5, delay: 0.13, ease: [0.16, 1, 0.3, 1] }}
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
        {/* Mobile Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="desktop-hero-card"
          style={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: isDark ? "#161922" : "#f8fafc",
            minHeight: 220,
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 16,
            borderRadius: 22,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isDark
              ? "0 16px 36px -10px rgba(0, 0, 0, 0.7)"
              : "0 14px 30px -10px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Dynamic Animated Background Transition */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={heroBgUrl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url('${heroBgUrl}')`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </AnimatePresence>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.45) 0%, rgba(249, 115, 22, 0.3) 100%)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.28)",
                boxShadow: "0 8px 20px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <ThermometerSun size={24} strokeWidth={2.4} style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.4))" }} />
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(15, 18, 24, 0.65)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#ef4444",
                  boxShadow: "0 0 8px #ef4444",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#fca5a5",
                }}
              >
                Extreme Heat Advisory
              </span>
            </div>
          </div>
          <h1 className="desktop-hero-temp" style={{ fontSize: 32, letterSpacing: -1 }}>
            El Niño Impact
          </h1>
          <p className="desktop-hero-condition" style={{ fontSize: 14, marginTop: 8 }}>
            Real-time monitoring in Palayan City
          </p>
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
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Megaphone size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}>
              Official Advisories
            </h2>
            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              {advisories.length} active advisory{advisories.length !== 1 ? 'ies' : ''}
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
            {advisories.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
              }}>
                <Megaphone size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No active advisories</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {advisories.map((advisory) => (
                  <AdvisoryCard key={advisory.id} advisory={advisory} isDark={isDark} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdvisoryCard({ advisory, isDark }) {
  const [expanded, setExpanded] = useState(false);
  
  const getUrgencyColor = (category) => {
    if (category?.toLowerCase().includes('urgent') || category?.toLowerCase().includes('critical')) return '#ef4444';
    if (category?.toLowerCase().includes('warning')) return '#f59e0b';
    return '#3b82f6';
  };

  const urgencyColor = getUrgencyColor(advisory.category);

  return (
    <div style={{
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      border: `1px solid var(--border-subtle)`,
      borderLeft: `4px solid ${urgencyColor}`,
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: urgencyColor,
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              padding: '2px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
            }}>
              {advisory.category || 'General'}
            </span>
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
              {new Date(advisory.published_at).toLocaleDateString()}
            </span>
          </div>
          <h3 style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>
            {advisory.title}
          </h3>
          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            maxHeight: expanded ? 'none' : 60,
            overflow: 'hidden',
          }}>
            {advisory.content}
          </p>
        </div>
      </div>
      {advisory.content.length > 150 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: 700,
            color: urgencyColor,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

function HospitalMonitoringSection({ records, expanded, onToggle, isDark }) {
  // Calculate stats
  const last7Days = records.slice(-7);
  const totalHeatStroke = last7Days.reduce((sum, r) => sum + (r.heat_stroke_cases || 0), 0);
  const totalHeatExhaustion = last7Days.reduce((sum, r) => sum + (r.heat_exhaustion_cases || 0), 0);
  const totalDehydration = last7Days.reduce((sum, r) => sum + (r.dehydration_cases || 0), 0);
  const totalRespiratory = last7Days.reduce((sum, r) => sum + (r.respiratory_cases || 0), 0);

  // Prepare chart data
  const chartData = last7Days.map(r => ({
    date: new Date(r.record_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    heatStroke: r.heat_stroke_cases || 0,
    heatExhaustion: r.heat_exhaustion_cases || 0,
    dehydration: r.dehydration_cases || 0,
    respiratory: r.respiratory_cases || 0,
  }));

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
            {records.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
              }}>
                <Activity size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No hospital data available</p>
              </div>
            ) : (
              <>
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
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e7eb'} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#71717a' }} />
                      <YAxis tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#71717a' }} />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? '#18181b' : '#fff',
                          border: `1px solid ${isDark ? '#27272a' : '#e5e7eb'}`,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line type="monotone" dataKey="heatStroke" stroke={COLORS.heatStroke} strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="heatExhaustion" stroke={COLORS.heatExhaustion} strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="dehydration" stroke={COLORS.dehydration} strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="respiratory" stroke={COLORS.respiratory} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
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
