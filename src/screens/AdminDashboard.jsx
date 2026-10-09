import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  BarChart3, FileText, Users, LogOut, Map as MapIcon, RefreshCw,
  Plus, Trash2, Building, CheckCircle, CheckCircle2, Clock, TrendingUp, Search, X, Edit2, Check, Download,
  MapPin, Calendar, Phone, AlertCircle, AlertTriangle, ChevronRight, ChevronDown, ChevronUp, Navigation,
  ShieldAlert, Activity, Megaphone, HeartPulse, Tent, Truck, Flame, Droplet, Zap, Sprout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/ui/CustomSelect";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

/* ── Dynamic Theme from Accent Color ── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function buildTheme(accent, name = "") {
  const { r, g, b } = hexToRgb(accent);
  return {
    accent,
    bg: `rgba(${r},${g},${b},0.04)`,
    border: `rgba(${r},${g},${b},0.18)`,
    text: `rgb(${Math.round(r * 0.3)},${Math.round(g * 0.3)},${Math.round(b * 0.3)})`,
    muted: `rgba(${Math.round(r * 0.4)},${Math.round(g * 0.4)},${Math.round(b * 0.4)},0.55)`,
    card: "#fff",
    title: name ? `${name} Dashboard` : "Admin Console",
    subtitle: name || "CLIMA Portal",
    accentBg: `rgba(${r},${g},${b},0.08)`,
  };
}

/* Fallback colors for known offices (used if no accent_color saved in DB) */
const DEPT_DEFAULTS = {
  CDRRMO: "#dc2626", ENRO: "#16a34a", "CITY TRAFFIC": "#2563eb",
  "CITY VET OFFICE": "#d97706", ENGINEERING: "#7c3aed", "GENERAL SERVICES": "#0891b2",
};

const DEFAULT_THEME = {
  accent: "#373D20", bg: "#f4f6f1", border: "#e8ebe4", text: "#1a2612", muted: "rgba(55,61,32,0.5)", card: "#ffffff",
  title: "Admin Console", subtitle: "CLIMA Portal", accentBg: "rgba(55,61,32,0.06)",
};

function getTheme(dept) {
  if (!dept) return DEFAULT_THEME;
  const name = typeof dept === "string" ? dept : dept.name;
  const accent = (typeof dept === "object" && dept.accent_color) || DEPT_DEFAULTS[name] || "#373D20";
  return buildTheme(accent, name);
}

const makeStyles = (T) => ({
  font: "'Nunito', sans-serif",
  ...T,
  green: "#4BB450", red: "#E74C3C", blue: "#3498DB",
  greenBg: "rgba(75,180,80,0.08)", redBg: "rgba(231,76,60,0.08)", blueBg: "rgba(52,152,219,0.08)",
});

const tabVariants = {
  active: { 
    opacity: 1, 
    y: 0, 
    display: "block",
    position: "relative",
    top: 0,
    left: 0,
    transition: { duration: 0.22, ease: "easeOut" } 
  },
  inactive: { 
    opacity: 0, 
    y: 8, 
    position: "absolute",
    top: 0,
    left: 0,
    transitionEnd: { display: "none" }, 
    transition: { duration: 0.14, ease: "easeIn" } 
  }
};

export default function AdminDashboard({ onLogout, onMapOverview, isSuperadmin, adminCategories, adminDepartment }) {
  const S = makeStyles(getTheme(isSuperadmin ? null : adminDepartment));

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "10px 14px",
    background: "#fff", border: `1.5px solid ${S.border}`, borderRadius: 10,
    fontSize: 14, fontWeight: 600, outline: "none", fontFamily: S.font,
    color: S.text, transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };
  const selectStyle = {
    ...inputStyle,
    appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
    paddingRight: 36, cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
  };
  const btnPrimary = {
    padding: "10px 20px", borderRadius: 10, border: "none",
    background: S.accent, color: "#fff", fontWeight: 800, fontSize: 14,
    cursor: "pointer", fontFamily: S.font, display: "flex", alignItems: "center", gap: 6,
    boxShadow: `0 2px 8px ${S.accent}33`, transition: "opacity 0.15s, transform 0.15s",
  };
  const btnDanger = {
    background: "none", border: "none", color: S.red, cursor: "pointer",
    padding: 6, borderRadius: 8, display: "flex", alignItems: "center",
  };
  const cardStyle = {
    background: S.card, border: `1px solid ${S.border}`, borderRadius: 16,
    padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailReport, setDetailReport] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState("all");

  // Global modal state for all tabs
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: "success", title: "", message: "", onConfirm: null, confirmText: "OK", cancelText: "Cancel" });

  const mainRef = useRef(null);

  // Global modal helper functions
  const showSuccessModal = (title, message) => {
    setModalConfig({ type: "success", title, message, onConfirm: () => setShowModal(false), confirmText: "OK" });
    setShowModal(true);
  };

  const showErrorModal = (title, message) => {
    setModalConfig({ type: "error", title, message, onConfirm: () => setShowModal(false), confirmText: "OK" });
    setShowModal(true);
  };

  const showConfirmModal = (title, message, onConfirm, confirmText = "Confirm", cancelText = "Cancel") => {
    setModalConfig({
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        setShowModal(false);
        onConfirm();
      },
      confirmText,
      cancelText
    });
    setShowModal(true);
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => { 
    const isFirstLoad = departments.length === 0;
    fetchData(!isFirstLoad); 
  }, [selectedDeptId]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [deptRes, catRes] = await Promise.all([
        supabase.from("departments").select("*").order("name"),
        supabase.from("categories").select("*, departments(name)").order("name")
      ]);
      const depts = deptRes.data || [];
      const cats = catRes.data || [];
      setDepartments(depts);
      setCategories(cats);

      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (!isSuperadmin && adminCategories && !adminCategories.includes("All Categories")) {
        query = query.in("category", adminCategories);
      } else if (selectedDeptId !== "all") {
        const deptCats = cats.filter(c => c.department_id === selectedDeptId).map(c => c.name);
        query = deptCats.length > 0 ? query.in("category", deptCats) : query.in("category", ["__NONE__"]);
      }
      const { data: repData } = await query;
      setReports(repData || []);
    } catch (err) { console.error(err); }
    finally { if (!silent) setLoading(false); }
  };

  const tabs = [
    { id: "overview", label: "Dashboard", icon: <BarChart3 size={18} /> },
    { id: "reports", label: "Citizen Reports", icon: <FileText size={18} /> },
    { id: "advisories", label: "Official Advisories", icon: <Megaphone size={18} /> },
    { id: "hospitals", label: "Hospital Monitoring", icon: <HeartPulse size={18} /> },
    { id: "operations", label: "CDRRMO Operations", icon: <Tent size={18} /> },
    { id: "bfp", label: "BFP Operations", icon: <Flame size={18} /> },
    { id: "agriculture", label: "Agricultural Damages", icon: <Sprout size={18} /> },
    { id: "water", label: "Water Utility", icon: <Droplet size={18} /> },
    { id: "power", label: "Power Utility", icon: <Zap size={18} /> },
    ...(isSuperadmin ? [
      { id: "users", label: "Users", icon: <Users size={18} /> },
      { id: "settings", label: "Offices & Categories", icon: <Building size={18} /> },
      { id: "logs", label: "Activity Logs", icon: <Activity size={18} /> },
    ] : []),
  ];

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: S.bg, flexDirection: "column", gap: 12 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 40, height: 40, border: `4px solid ${S.border}`, borderTopColor: S.accent, borderRadius: "50%" }} />
      <p style={{ color: S.muted, fontFamily: S.font, fontWeight: 700, fontSize: 14 }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", background: S.bg, fontFamily: S.font, color: S.text, overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: S.card, borderRight: `1px solid ${S.border}`, display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 10 }}>
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: S.accent, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{S.title}</h1>
            <p style={{ margin: 0, fontSize: 10, color: S.muted, fontWeight: 700 }}>{S.subtitle}</p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "none",
                background: active ? S.accentBg : "transparent", color: active ? S.accent : S.muted,
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: S.font, textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = S.accentBg; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
          <div style={{ height: 1, background: S.border, margin: "12px 0" }} />
          {onMapOverview && (
            <button onClick={onMapOverview} style={{
              ...btnPrimary, background: S.greenBg, color: S.green, border: `1px solid rgba(75,180,80,0.2)`, justifyContent: "center",
            }}>
              <MapIcon size={16} /> Map View
            </button>
          )}
        </div>

        <div style={{ padding: "16px 12px", borderTop: `1px solid ${S.border}` }}>
          <button onClick={onLogout} style={{
            ...btnPrimary, background: S.redBg, color: S.red, width: "100%", justifyContent: "center",
          }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <header style={{ height: 60, background: S.card, borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "reports" && "Citizen Reports"}
              {activeTab === "advisories" && "Official Advisories"}
              {activeTab === "hospitals" && "Hospital Capacity & Health Analytics"}
              {activeTab === "operations" && "CDRRMO Operations & Evacuations"}
              {activeTab === "bfp" && "BFP Operations & Fire Risk"}
              {activeTab === "agriculture" && "Agricultural Damage Reports"}
              {activeTab === "water" && "Water Utility & Interruptions"}
              {activeTab === "power" && "Power Utility & Outages"}
              {activeTab === "users" && "User Management"}
              {activeTab === "settings" && "Offices & Categories"}
              {activeTab === "logs" && "System Activity Logs"}
            </h2>
            {!isSuperadmin && adminDepartment?.name && activeTab === "overview" && (
              <p style={{ margin: 0, fontSize: 11, color: S.muted, fontWeight: 700 }}>Showing reports for {adminDepartment.name}</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isSuperadmin && activeTab === "overview" && (
              <CustomSelect
                value={selectedDeptId}
                onChange={setSelectedDeptId}
                options={[{ value: "all", label: "All Departments" }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                compact
                accent={S.accent}
                style={{ minWidth: 180 }}
              />
            )}
            <button onClick={() => fetchData()} style={{ ...btnPrimary, padding: 10 }}>
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main ref={mainRef} style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "overview" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <OverviewTab reports={reports} S={S} cardStyle={cardStyle} onViewReport={setDetailReport} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "reports" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <ReportsTab reports={reports} onUpdate={() => fetchData(true)} S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} onViewReport={setDetailReport} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "advisories" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <AdvisoriesTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} isSuperadmin={isSuperadmin} adminDepartment={adminDepartment} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "hospitals" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <HospitalsTab 
              S={S} 
              cardStyle={cardStyle} 
              inputStyle={inputStyle} 
              selectStyle={selectStyle} 
              btnPrimary={btnPrimary} 
              btnDanger={btnDanger} 
              isSuperadmin={isSuperadmin} 
              adminDepartment={adminDepartment}
              showSuccessModal={showSuccessModal}
              showErrorModal={showErrorModal}
              showConfirmModal={showConfirmModal}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "operations" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <OperationsTab 
              S={S} 
              cardStyle={cardStyle} 
              inputStyle={inputStyle} 
              selectStyle={selectStyle} 
              btnPrimary={btnPrimary} 
              btnDanger={btnDanger} 
              isSuperadmin={isSuperadmin} 
              adminDepartment={adminDepartment}
              showSuccessModal={showSuccessModal}
              showErrorModal={showErrorModal}
              showConfirmModal={showConfirmModal}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "bfp" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <BfpOperationsTab 
              S={S} 
              cardStyle={cardStyle} 
              inputStyle={inputStyle} 
              selectStyle={selectStyle} 
              btnPrimary={btnPrimary} 
              btnDanger={btnDanger} 
              isSuperadmin={isSuperadmin} 
              adminDepartment={adminDepartment}
              showSuccessModal={showSuccessModal}
              showErrorModal={showErrorModal}
              showConfirmModal={showConfirmModal}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "agriculture" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <AgricultureDamagesTab 
              S={S} 
              cardStyle={cardStyle} 
              inputStyle={inputStyle} 
              selectStyle={selectStyle} 
              btnPrimary={btnPrimary} 
              btnDanger={btnDanger} 
              isSuperadmin={isSuperadmin} 
              adminDepartment={adminDepartment}
              showSuccessModal={showSuccessModal}
              showErrorModal={showErrorModal}
              showConfirmModal={showConfirmModal}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "water" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <WaterUtilityTab 
              S={S} 
              cardStyle={cardStyle} 
              inputStyle={inputStyle} 
              selectStyle={selectStyle} 
              btnPrimary={btnPrimary} 
              btnDanger={btnDanger} 
              isSuperadmin={isSuperadmin} 
              adminDepartment={adminDepartment}
              showSuccessModal={showSuccessModal}
              showErrorModal={showErrorModal}
              showConfirmModal={showConfirmModal}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "power" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <PowerUtilityTab 
              S={S} 
              cardStyle={cardStyle} 
              inputStyle={inputStyle} 
              selectStyle={selectStyle} 
              btnPrimary={btnPrimary} 
              btnDanger={btnDanger} 
              isSuperadmin={isSuperadmin} 
              adminDepartment={adminDepartment}
              showSuccessModal={showSuccessModal}
              showErrorModal={showErrorModal}
              showConfirmModal={showConfirmModal}
            />
          </motion.div>

          {isSuperadmin && (
            <>
              <motion.div
                variants={tabVariants}
                initial="inactive"
                animate={activeTab === "users" ? "active" : "inactive"}
                style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
              >
                <UsersTab 
                  categories={categories} 
                  departments={departments} 
                  S={S} 
                  cardStyle={cardStyle} 
                  inputStyle={inputStyle} 
                  selectStyle={selectStyle} 
                  btnPrimary={btnPrimary} 
                  btnDanger={btnDanger}
                  showSuccessModal={showSuccessModal}
                  showErrorModal={showErrorModal}
                  showConfirmModal={showConfirmModal}
                />
              </motion.div>

              <motion.div
                variants={tabVariants}
                initial="inactive"
                animate={activeTab === "settings" ? "active" : "inactive"}
                style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
              >
                <SettingsTab 
                  departments={departments} 
                  categories={categories} 
                  onUpdate={() => fetchData(true)} 
                  S={S} 
                  cardStyle={cardStyle} 
                  inputStyle={inputStyle} 
                  selectStyle={selectStyle} 
                  btnPrimary={btnPrimary} 
                  btnDanger={btnDanger}
                  showSuccessModal={showSuccessModal}
                  showErrorModal={showErrorModal}
                  showConfirmModal={showConfirmModal}
                />
              </motion.div>

              <motion.div
                variants={tabVariants}
                initial="inactive"
                animate={activeTab === "logs" ? "active" : "inactive"}
                style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
              >
                <ActivityLogsTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} />
              </motion.div>
            </>
          )}
        </main>
      </div>

      {/* Report Detail Modal */}
      {detailReport && (
        <DashboardReportModal
          report={detailReport}
          S={S}
          onClose={() => setDetailReport(null)}
          onStatusChange={(newStatus) => {
            setReports(prev => prev.map(r => r.id === detailReport.id ? { ...r, status: newStatus } : r));
          }}
        />
      )}

      {/* Global Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999
            }}
            onClick={() => modalConfig.type !== "confirm" && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                maxWidth: 420,
                width: "90%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, color: modalConfig.type === "error" ? "#dc2626" : S.accent }}>
                {modalConfig.title}
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#52525b", lineHeight: 1.6 }}>
                {modalConfig.message}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                {modalConfig.type === "confirm" && (
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      border: "1px solid #d4d4d8",
                      background: "#fff",
                      color: "#52525b",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {modalConfig.cancelText}
                  </button>
                )}
                <button
                  onClick={modalConfig.onConfirm}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: modalConfig.type === "error" ? "#dc2626" : S.accent,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {modalConfig.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Utility Helpers for Analytics ── */
function formatTrend(current, previous) {
  if (previous === 0) {
    return { arrow: "→", pct: 0, color: "#71717a", label: "No change" };
  }
  const change = ((current - previous) / previous) * 100;
  if (change > 0) {
    return { 
      arrow: "↑", 
      pct: Math.abs(change).toFixed(1), 
      color: "#ef4444", 
      label: `+${Math.abs(change).toFixed(1)}%` 
    };
  } else if (change < 0) {
    return { 
      arrow: "↓", 
      pct: Math.abs(change).toFixed(1), 
      color: "#16a34a", 
      label: `-${Math.abs(change).toFixed(1)}%` 
    };
  }
  return { arrow: "→", pct: 0, color: "#71717a", label: "No change" };
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/* ── Overview Tab - Analytics Dashboard ── */
function OverviewTab({ reports, S, cardStyle, onViewReport }) {
  const [analyticsData, setAnalyticsData] = useState({
    hospitalRecords: [],
    cdrrmoRecords: [],
    bfpRecords: [],
    advisories: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const startDate = getDateDaysAgo(dateRange);
      
      const [hospitalRes, cdrrmoRes, bfpRes, advisoriesRes] = await Promise.all([
        supabase
          .from("hospital_daily_records")
          .select("*")
          .gte("record_date", startDate)
          .order("record_date", { ascending: true }),
        supabase
          .from("cdrrmo_daily_operations")
          .select("*")
          .gte("operation_date", startDate)
          .order("operation_date", { ascending: true }),
        supabase
          .from("bfp_daily_operations")
          .select("*")
          .gte("operation_date", startDate)
          .order("operation_date", { ascending: true }),
        supabase
          .from("advisories")
          .select("*")
          .eq("status", "Published")
      ]);

      setAnalyticsData({
        hospitalRecords: hospitalRes.data || [],
        cdrrmoRecords: cdrrmoRes.data || [],
        bfpRecords: bfpRes.data || [],
        advisories: advisoriesRes.data || []
      });
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ ...cardStyle, height: 120, background: "#f9fafb", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }

  // Calculate summary metrics
  const last7Days = getDateDaysAgo(7);
  const prior7Days = getDateDaysAgo(14);
  
  const reportsLast7 = reports.filter(r => r.created_at >= last7Days).length;
  const reportsPrior7 = reports.filter(r => r.created_at >= prior7Days && r.created_at < last7Days).length;
  const reportsTrend = formatTrend(reportsLast7, reportsPrior7);

  const hospitalAdmissionsLast7 = analyticsData.hospitalRecords
    .filter(r => r.record_date >= last7Days)
    .reduce((sum, r) => sum + (r.total_admissions || 0), 0);

  const cdrrmoOpsLast7 = analyticsData.cdrrmoRecords
    .filter(r => r.operation_date >= last7Days)
    .reduce((sum, r) => sum + (r.relief_operations || 0) + (r.evacuations_conducted || 0), 0);

  const bfpIncidentsLast7 = analyticsData.bfpRecords
    .filter(r => r.operation_date >= last7Days)
    .reduce((sum, r) => sum + (r.fire_incidents || 0), 0);

  const ambulanceDispatchesLast7 = analyticsData.cdrrmoRecords
    .filter(r => r.operation_date >= last7Days)
    .reduce((sum, r) => sum + (r.ambulance_dispatches || 0), 0);

  const emergencyOpsLast7 = cdrrmoOpsLast7 + bfpIncidentsLast7 + ambulanceDispatchesLast7;

  // Prepare chart data
  const reportsTimelineData = prepareReportsTimeline(reports, dateRange);
  const reportsByCategoryData = prepareReportsByCategory(reports);
  const healthOpsData = prepareHealthOpsTimeline(analyticsData.hospitalRecords);
  const emergencyOpsData = prepareEmergencyOpsTimeline(analyticsData.cdrrmoRecords, analyticsData.bfpRecords);
  const statusDistributionData = prepareStatusDistribution(reports);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Date Range Selector */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "#f9fafb", borderRadius: 12, border: `1px solid ${S.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: S.muted, marginRight: 8 }}>TIME RANGE:</span>
        {[7, 30, 90].map(days => (
          <button
            key={days}
            onClick={() => setDateRange(days)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: dateRange === days ? `2px solid ${S.accent}` : `1px solid ${S.border}`,
              background: dateRange === days ? S.accentBg : "#fff",
              color: dateRange === days ? S.accent : S.muted,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: S.font,
              transition: "all 0.15s"
            }}
          >
            {days} Days
          </button>
        ))}
      </div>

      {/* Summary Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <SummaryCard
          label="Citizen Reports"
          value={reportsLast7}
          subtitle="Last 7 days"
          trend={reportsTrend}
          icon={<FileText size={22} />}
          color={S.accent}
          bg={S.accentBg}
          S={S}
        />
        <SummaryCard
          label="Active Advisories"
          value={analyticsData.advisories.length}
          subtitle="Published"
          icon={<Megaphone size={22} />}
          color="#3b82f6"
          bg="rgba(59,130,246,0.08)"
          S={S}
        />
        <SummaryCard
          label="Hospital Admissions"
          value={hospitalAdmissionsLast7}
          subtitle="Last 7 days"
          icon={<HeartPulse size={22} />}
          color="#d97706"
          bg="rgba(217,119,6,0.08)"
          S={S}
        />
        <SummaryCard
          label="CDRRMO Operations"
          value={cdrrmoOpsLast7}
          subtitle="Last 7 days"
          icon={<Tent size={22} />}
          color="#10b981"
          bg="rgba(16,185,129,0.08)"
          S={S}
        />
        <SummaryCard
          label="Fire Incidents"
          value={bfpIncidentsLast7}
          subtitle="Last 7 days"
          icon={<Flame size={22} />}
          color="#ef4444"
          bg="rgba(239,68,68,0.08)"
          S={S}
        />
        <SummaryCard
          label="Ambulance Dispatches"
          value={ambulanceDispatchesLast7}
          subtitle="Last 7 days"
          icon={<Truck size={22} />}
          color="#8b5cf6"
          bg="rgba(139,92,246,0.08)"
          S={S}
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Citizen Reports Trend */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Citizen Reports Trend
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={reportsTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
              <XAxis dataKey="date" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12, fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Line type="monotone" dataKey="reports" stroke={S.accent} strokeWidth={2} dot={{ fill: S.accent, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reports by Category */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Top Report Categories
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reportsByCategoryData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
              <XAxis type="number" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis type="category" dataKey="category" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} width={120} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12, fontWeight: 700 }} />
              <Bar dataKey="count" fill={S.accent} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Operations Trend */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Health Operations (14 Days)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthOpsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
              <XAxis dataKey="date" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12, fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Line type="monotone" dataKey="admissions" stroke="#d97706" strokeWidth={2} name="Total Admissions" />
              <Line type="monotone" dataKey="elNinoCases" stroke="#ef4444" strokeWidth={2} name="El Niño Cases" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Emergency Operations */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Emergency Operations (14 Days)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={emergencyOpsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
              <XAxis dataKey="date" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12, fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Line type="monotone" dataKey="cdrrmo" stroke="#10b981" strokeWidth={2} name="CDRRMO" />
              <Line type="monotone" dataKey="bfp" stroke="#ef4444" strokeWidth={2} name="BFP" />
              <Line type="monotone" dataKey="ambulance" stroke="#8b5cf6" strokeWidth={2} name="Ambulance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Status Distribution */}
      <div style={cardStyle}>
        <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
          Report Status Distribution
        </h4>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderPieLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 12, fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ── Summary Card Component ── */
function SummaryCard({ label, value, subtitle, trend, icon, color, bg, S }) {
  return (
    <div style={{
      background: S.card,
      border: `1px solid ${S.border}`,
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>
            {value}
          </p>
          {trend && (
            <span style={{ fontSize: 11, fontWeight: 800, color: trend.color }}>
              {trend.arrow} {trend.pct}%
            </span>
          )}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 700, color: S.muted }}>
          {subtitle}
        </p>
      </div>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color
      }}>
        {icon}
      </div>
    </div>
  );
}

/* ── Chart Data Preparation Functions ── */
function prepareReportsTimeline(reports, days) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = reports.filter(r => r.created_at.startsWith(dateStr)).length;
    data.push({
      date: formatDateShort(dateStr),
      reports: count
    });
  }
  return data;
}

function prepareReportsByCategory(reports) {
  const categories = {};
  reports.forEach(r => {
    const cat = r.category || "Uncategorized";
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  return Object.entries(categories)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function prepareHealthOpsTimeline(hospitalRecords) {
  const data = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const record = hospitalRecords.find(r => r.record_date === dateStr);
    
    const elNinoCases = record 
      ? (record.heat_stroke_cases || 0) + (record.heat_exhaustion_cases || 0) + 
        (record.dehydration_cases || 0) + (record.respiratory_cases || 0)
      : 0;
    
    data.push({
      date: formatDateShort(dateStr),
      admissions: record?.total_admissions || 0,
      elNinoCases
    });
  }
  return data;
}

function prepareEmergencyOpsTimeline(cdrrmoRecords, bfpRecords) {
  const data = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const cdrrmoRecord = cdrrmoRecords.find(r => r.operation_date === dateStr);
    const bfpRecord = bfpRecords.find(r => r.operation_date === dateStr);
    
    data.push({
      date: formatDateShort(dateStr),
      cdrrmo: (cdrrmoRecord?.relief_operations || 0) + (cdrrmoRecord?.evacuations_conducted || 0) + (cdrrmoRecord?.emergency_responses || 0),
      bfp: (bfpRecord?.fire_incidents || 0) + (bfpRecord?.rescue_operations || 0),
      ambulance: cdrrmoRecord?.ambulance_dispatches || 0
    });
  }
  return data;
}

function prepareStatusDistribution(reports) {
  const pending = reports.filter(r => r.status === "pending").length;
  const inprogress = reports.filter(r => r.status === "inprogress").length;
  const resolved = reports.filter(r => r.status === "resolved").length;
  
  return [
    { name: "Pending", value: pending, color: "#ef4444" },
    { name: "In Progress", value: inprogress, color: "#3b82f6" },
    { name: "Resolved", value: resolved, color: "#22c55e" }
  ].filter(item => item.value > 0);
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      style={{ fontSize: 12, fontWeight: 800 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ── Report Row ── */
function ReportRow({ report, showActions, onUpdateStatus, S, inputStyle, selectStyle, onClick }) {
  const statusMap = { pending: { color: S.red, bg: S.redBg, label: "Pending" }, inprogress: { color: S.blue, bg: S.blueBg, label: "In Progress" }, resolved: { color: S.green, bg: S.greenBg, label: "Resolved" } };
  const st = statusMap[report.status] || statusMap.pending;
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: `1px solid ${S.border}`, background: "#fafcf9", gap: 12, cursor: onClick ? "pointer" : "default", transition: "all 0.15s" }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = S.accentBg || "#f5f5f4"; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = "#fafcf9"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: st.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {report.photo_url ? <img src={report.photo_url.split(",")[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FileText size={18} color="#fff" />}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.title}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: S.muted, fontWeight: 600 }}>{report.category || "Uncategorized"} • {report.location} • {new Date(report.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ padding: "4px 12px", borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 800 }}>{st.label}</span>
        {showActions && (
          <div onClick={e => e.stopPropagation()}>
            <CustomSelect
              value={report.status}
              onChange={onUpdateStatus}
              options={[
                { value: "pending", label: "Pending", color: "#ef4444" },
                { value: "inprogress", label: "In Progress", color: "#3b82f6" },
                { value: "resolved", label: "Resolved", color: "#22c55e" },
              ]}
              compact
              accent={S.accent}
              style={{ minWidth: 130 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Reports Tab ── */
function ReportsTab({ reports, onUpdate, S, cardStyle, inputStyle, selectStyle, onViewReport }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const uniqueCategories = [...new Set(reports.map(r => r.category).filter(Boolean))];

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
    const matchStatus = filter === "all" || r.status === filter;
    const matchCategory = categoryFilter === "all" || r.category === categoryFilter;
    
    let matchDate = true;
    if (startDate || endDate) {
      const rDate = new Date(r.created_at);
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0,0,0,0);
        if (rDate < s) matchDate = false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23,59,59,999);
        if (rDate > e) matchDate = false;
      }
    }
    
    return matchSearch && matchStatus && matchCategory && matchDate;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Category", "Title", "Location", "Status"];
    const tableRows = [];

    filtered.forEach(r => {
      const rowData = [
        new Date(r.created_at).toLocaleDateString(),
        r.category || "Uncategorized",
        r.title || "No Title",
        r.location || "No Location",
        r.status.toUpperCase()
      ];
      tableRows.push(rowData);
    });

    doc.setFontSize(18);
    doc.setTextColor(S.accent || "#000000");
    doc.text("CLIMA Citizen Reports", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Reports: ${filtered.length}`, 14, 36);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: S.accent || "#333333" },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 50 },
        4: { cellWidth: 25 }
      }
    });

    doc.save(`CLIMA_Reports_${new Date().getTime()}.pdf`);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("reports").update({ status, status_label: status }).eq("id", id);
    onUpdate();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ 
          ...cardStyle, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: 20
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Total Reports
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: S.accent, lineHeight: 1 }}>
              {filtered.length}
            </p>
          </div>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: S.accentBg, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: S.accent 
          }}>
            <FileText size={22} />
          </div>
        </div>

        <div style={{ 
          ...cardStyle, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: 20
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Pending
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: S.red, lineHeight: 1 }}>
              {filtered.filter(r => r.status === "pending").length}
            </p>
          </div>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: S.redBg, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: S.red 
          }}>
            <Clock size={22} />
          </div>
        </div>

        <div style={{ 
          ...cardStyle, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: 20
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              In Progress
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: S.blue, lineHeight: 1 }}>
              {filtered.filter(r => r.status === "inprogress").length}
            </p>
          </div>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: S.blueBg, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: S.blue 
          }}>
            <TrendingUp size={22} />
          </div>
        </div>

        <div style={{ 
          ...cardStyle, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: 20
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Resolved
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: S.green, lineHeight: 1 }}>
              {filtered.filter(r => r.status === "resolved").length}
            </p>
          </div>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: S.greenBg, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: S.green 
          }}>
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Existing Reports List Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Citizen Reports</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted, fontWeight: 700 }}>{filtered.length} results found</p>
          </div>
          <button onClick={exportToPDF} style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${S.border}`, background: "#fff", color: S.text, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: S.font, display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#fafafa"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <Download size={16} color={S.accent} /> Export PDF
          </button>
        </div>
      
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap", background: "#f8fafc", padding: 12, borderRadius: 12, border: `1px solid ${S.border}` }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} color={S.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or description…"
            style={{ ...inputStyle, paddingLeft: 34, height: 38 }} />
        </div>
        
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: S.muted, textTransform: "uppercase" }}>From</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, width: 130, height: 38 }} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: S.muted, textTransform: "uppercase" }}>To</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, width: 130, height: 38 }} />
        </div>

        <CustomSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[{ value: "all", label: "All Categories" }, ...uniqueCategories.map(c => ({ value: c, label: c }))]}
          compact
          accent={S.accent}
          style={{ minWidth: 160, height: 38 }}
        />
        <CustomSelect
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "pending", label: "Pending", color: "#ef4444" },
            { value: "inprogress", label: "In Progress", color: "#3b82f6" },
            { value: "resolved", label: "Resolved", color: "#22c55e" },
          ]}
          compact
          accent={S.accent}
          style={{ minWidth: 140, height: 38 }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(r => <ReportRow key={r.id} report={r} showActions onUpdateStatus={s => updateStatus(r.id, s)} S={S} inputStyle={inputStyle} selectStyle={selectStyle} onClick={() => onViewReport(r)} />)}
        {filtered.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>No results.</p>}
      </div>
      </div>
    </div>
  );
}

/* ── Users Tab ── */
function UsersTab({ categories, departments, S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetting, setResetting] = useState(false);
  // Create new admin
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDept, setNewDept] = useState("All Departments");
  const [creating, setCreating] = useState(false);
  // Assign existing
  const [assignEmail, setAssignEmail] = useState("");
  const [assignDept, setAssignDept] = useState("All Departments");
  const [msg, setMsg] = useState(null);

  const sha256 = async (str) => {
    const buf = new TextEncoder().encode(str.toLowerCase().trim());
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => { 
    setLoading(true); 
    const { data } = await supabase.rpc("get_auth_users"); 
    if (data) {
      const superadminsHashes = [
        '980f32df69a604ee31a4ca3a18cfea910de69ef3c496124dc8e19f76c4fa5686',
        'd9d660ee4195a6ac7e0b6a4a4aecbbbf9132683fa17e54383899a07b8671e484'
      ];
      const mapped = await Promise.all(data.map(async (u) => {
        const hash = await sha256(u.email || "");
        if (superadminsHashes.includes(hash)) {
          return { ...u, role: "superadmin" };
        }
        return u;
      }));
      setUsers(mapped);
    } else {
      setUsers([]);
    }
    setLoading(false); 
  };

  const getCatsForDept = (deptId) => {
    if (deptId === "All Departments") return ["All Categories"];
    const cats = categories.filter(c => c.department_id === deptId).map(c => c.name);
    return cats.length > 0 ? cats : ["__NONE__"];
  };

  const getDeptLabel = (deptId) => {
    if (deptId === "All Departments") return "All Departments";
    const d = departments.find(dep => dep.id === deptId);
    return d ? d.name : "Unknown";
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPassword) return;
    if (newPassword.length < 6) { setMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }
    setCreating(true);
    setMsg(null);
    try {
      // 1. Sign up the new user (won't affect current session since we use a separate call)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: { full_name: newName, role: "admin", force_password_reset: true }
        }
      });
      if (signUpError) throw signUpError;
      const newUserId = signUpData?.user?.id;
      if (!newUserId) throw new Error("Failed to create user.");

      // 2. Auto-confirm email
      await supabase.rpc("confirm_user_email", { target_user_id: newUserId });

      // 3. Set admin role and assigned categories + department
      const cats = getCatsForDept(newDept);
      const deptLabel = getDeptLabel(newDept);
      await supabase.rpc("set_user_role", { target_user_id: newUserId, new_role: "admin", assigned_categories: cats, assigned_department: deptLabel });

      setMsg({ type: "success", text: `Admin "${newName}" created! They can log in with the password you set.` });
      setNewEmail(""); setNewName(""); setNewPassword(""); setNewDept("All Departments");
      fetchUsers();
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to create admin." });
    } finally {
      setCreating(false);
    }
  };

  const handleAssignExisting = async (e) => {
    e.preventDefault();
    if (!assignEmail) return;
    const existing = users.find(u => u.email === assignEmail);
    if (!existing) { setMsg({ type: "error", text: "User must register in the app first." }); return; }
    const cats = getCatsForDept(assignDept);
    const deptLabel = getDeptLabel(assignDept);
    await supabase.rpc("set_user_role", { target_user_id: existing.id, new_role: "admin", assigned_categories: cats, assigned_department: deptLabel });
    setMsg({ type: "success", text: `"${existing.full_name || assignEmail}" promoted to admin.` });
    setAssignEmail(""); setAssignDept("All Departments");
    fetchUsers();
  };

  const revoke = async (id) => { 
    showConfirmModal(
      "Revoke Admin Access",
      "Are you sure you want to revoke admin access for this user?",
      async () => {
        try {
          await supabase.rpc("set_user_role", { target_user_id: id, new_role: null }); 
          await fetchUsers();
          showSuccessModal("Success", "Admin access revoked successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to revoke admin access");
        }
      },
      "Revoke"
    );
  };
  const admins = users.filter(u => u.role === "admin" || u.role === "superadmin");

  const confirmReset = async () => {
    if (!selectedUser) return;
    setResetting(true);
    setMsg(null);
    try {
      const { error } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: selectedUser.id,
        new_password: 'CLIMA123!'
      });
      if (error) throw error;
      setMsg({ type: "success", text: `Password for "${selectedUser.full_name || selectedUser.email}" has been reset to CLIMA123!` });
      setResetOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to reset password." });
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>Loading users…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Status Message */}
      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center",
          background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: msg.type === "success" ? "#16a34a" : "#dc2626",
          border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}><X size={14} color={msg.type === "success" ? "#16a34a" : "#dc2626"} /></button>
        </div>
      )}

      {/* Create New Admin */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900 }}>Create New Admin</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: S.muted }}>Create a brand new admin account. They'll log in with the credentials you set.</p>
        <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Juan Dela Cruz" required style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="admin@palayan.gov.ph" required type="email" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Temporary Password</label>
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required type="password" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Assign to Office</label>
              <CustomSelect
                value={newDept}
                onChange={setNewDept}
                options={[{ value: "All Departments", label: "All Departments (Superadmin)" }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                accent={S.accent}
              />
            </div>
            <button type="submit" disabled={creating} style={{ ...btnPrimary, height: 42, opacity: creating ? 0.6 : 1 }}>
              <Plus size={16} /> {creating ? "Creating…" : "Create Admin"}
            </button>
          </div>
        </form>
      </div>

      {/* Assign Existing User */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900 }}>Promote Existing User</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: S.muted }}>Promote a citizen who already registered in the app to admin.</p>
        <form onSubmit={handleAssignExisting} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</label>
            <input value={assignEmail} onChange={e => setAssignEmail(e.target.value)} placeholder="user@email.com" required style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Office</label>
            <CustomSelect
              value={assignDept}
              onChange={setAssignDept}
              options={[{ value: "All Departments", label: "All Departments" }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
              accent={S.accent}
            />
          </div>
          <button type="submit" style={btnPrimary}>Promote</button>
        </form>
      </div>

      {/* Current Admins */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900 }}>Current Admins</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: S.muted }}>{admins.length} admin{admins.length !== 1 ? "s" : ""} configured</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {admins.map(u => {
            const deptLabel = u.assigned_department || "All Departments";
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: `1px solid ${S.border}`, background: "#fafcf9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: S.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={18} color={S.accent} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>{u.full_name || "Admin"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: S.muted }}>{u.email}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 800, border: "1px solid #bbf7d0" }}>{deptLabel}</span>
                  <span style={{ padding: "3px 10px", borderRadius: 20, background: S.accentBg, color: S.accent, fontSize: 10, fontWeight: 800 }}>{u.role}</span>
                  {u.role !== "superadmin" && (
                    <>
                      <button onClick={() => { setSelectedUser(u); setResetOpen(true); }} style={{ ...btnDanger, color: "#d97706" }} title="Reset Password"><ShieldAlert size={16} /></button>
                      <button onClick={() => revoke(u.id)} style={btnDanger} title="Revoke Access"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {admins.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No admins yet.</p>}
        </div>
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setResetOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 425, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", fontFamily: S.font }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#d97706", marginBottom: 12 }}>
                <ShieldAlert size={24} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#d97706" }}>Reset User Password</h3>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: S.text }}>
                Are you sure you want to reset the password for <strong style={{ fontWeight: 800 }}>{selectedUser.full_name || selectedUser.email}</strong>?
              </p>
              <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: "#92400e" }}>
                Their password will be set to: <strong style={{ background: "#fef3c7", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 14 }}>CLIMA123!</strong>
                <br /><br />
                They will be locked out of their account until they log in with this temporary password and choose a new one.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setResetOpen(false)} disabled={resetting} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${S.border}`, background: "#fff", fontWeight: 800, cursor: "pointer", color: S.muted }}>Cancel</button>
                <button onClick={confirmReset} disabled={resetting} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#d97706", color: "#fff", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {resetting ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Dept Row Component for Smooth Color Picker ── */
function DeptRow({ d, onColorChange, onNameChange, onDelete, S, btnDanger }) {
  const initialColor = d.accent_color || DEPT_DEFAULTS[d.name] || "#373D20";
  const [color, setColor] = useState(initialColor);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(d.name);

  useEffect(() => {
    setColor(initialColor);
    setEditName(d.name);
  }, [initialColor, d.name]);

  const handleChange = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    onColorChange(d.id, newColor);
  };

  const handleSaveName = () => {
    if (editName.trim() && editName !== d.name) {
      onNameChange(d.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${S.border}`, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <input type="color" value={color} 
        onChange={handleChange}
        title="Change Office Color"
        className="dept-color-picker"
        style={{ width: 24, height: 24, border: "none", padding: 0, cursor: "pointer", background: "none" }} />
      
      {isEditing ? (
        <input 
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
          style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "#18181b", border: `1px solid ${S.border}`, borderRadius: 4, padding: "2px 6px", outline: "none" }}
        />
      ) : (
        <span style={{ fontWeight: 800, fontSize: 13, color: "#18181b", flex: 1 }}>{d.name}</span>
      )}

      {isEditing ? (
        <button onClick={handleSaveName} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center" }} title="Save Name">
          <Check size={14} />
        </button>
      ) : (
        <button onClick={() => setIsEditing(true)} style={{ background: "none", border: "none", color: S.muted, cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center" }} title="Edit Name">
          <Edit2 size={14} />
        </button>
      )}

      <button onClick={() => onDelete(d.id)} style={{ ...btnDanger, padding: "6px 8px" }} title="Delete Office"><Trash2 size={14} /></button>
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab({ departments, categories, onUpdate, S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [deptName, setDeptName] = useState("");
  const [catName, setCatName] = useState("");
  const [catGroup, setCatGroup] = useState("");
  const [catDept, setCatDept] = useState("");
  const [deptColor, setDeptColor] = useState("#373D20");
  const [newGroupName, setNewGroupName] = useState("");

  // Simple debounce helper
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedUpdateColor = useRef(
    debounce(async (id, color) => {
      await supabase.from("departments").update({ accent_color: color }).eq("id", id);
      onUpdate();
    }, 400)
  ).current;

  const handleColorChange = (id, color) => {
    debouncedUpdateColor(id, color);
  };

  const handleNameChange = async (id, newName) => {
    await supabase.from("departments").update({ name: newName }).eq("id", id);
    onUpdate();
  };

  const addDept = async (e) => { 
    e.preventDefault(); 
    if (!deptName) return; 
    await supabase.from("departments").insert({ name: deptName, accent_color: deptColor }); 
    setDeptName(""); 
    setDeptColor("#373D20");
    onUpdate(); 
  };

  const addCat = async (e) => {
    e.preventDefault();
    const resolvedGroup = catGroup === "__NEW__" ? newGroupName : catGroup;
    if (!catName || !resolvedGroup) return;
    const insert = { name: catName, group_name: resolvedGroup };
    if (catDept) insert.department_id = catDept;
    await supabase.from("categories").insert(insert);
    setCatName(""); setCatGroup(""); setNewGroupName(""); onUpdate();
  };

  const delDept = async (id) => { 
    showConfirmModal(
      "Delete Office",
      "Are you sure you want to delete this office? This action cannot be undone.",
      async () => {
        try {
          await supabase.from("departments").delete().eq("id", id); 
          onUpdate();
          showSuccessModal("Deleted", "Office deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete office");
        }
      },
      "Delete"
    );
  };

  const delCat = async (id) => { 
    showConfirmModal(
      "Delete Category",
      "Are you sure you want to delete this category? This action cannot be undone.",
      async () => {
        try {
          await supabase.from("categories").delete().eq("id", id); 
          onUpdate();
          showSuccessModal("Deleted", "Category deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete category");
        }
      },
      "Delete"
    );
  };

  // Get unique group names for suggestions
  const existingGroups = [...new Set(categories.map(c => c.group_name).filter(Boolean))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Offices Section */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900 }}>Offices</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: S.muted }}>Manage offices that handle citizen reports. Categories get routed to these offices.</p>
        <form onSubmit={addDept} style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Office Name</label>
            <input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="E.g. CDRRMO" required style={inputStyle} />
          </div>
          <div style={{ width: 80 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Theme</label>
            <input type="color" value={deptColor} onChange={e => setDeptColor(e.target.value)} 
              className="custom-color-picker"
              style={{ ...inputStyle, padding: 0, height: 42, cursor: "pointer", border: "none" }} />
          </div>
          <button type="submit" style={{ ...btnPrimary, height: 42 }}><Plus size={16} /> Add</button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {departments.map(d => (
            <DeptRow key={d.id} d={d} onColorChange={handleColorChange} onNameChange={handleNameChange} onDelete={delDept} S={S} btnDanger={btnDanger} />
          ))}
          {departments.length === 0 && <p style={{ color: S.muted, fontSize: 13, padding: 12 }}>No offices added yet.</p>}
        </div>
      </div>

      {/* Categories Section */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900 }}>Issue Categories</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: S.muted }}>
          Categories are what citizens select when filing reports. Each category belongs to a <strong>group</strong> (shown in the app) and is <strong>linked to an office</strong> (for routing).
        </p>
        <form onSubmit={addCat} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Category Name</label>
              <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="E.g. Obstructed Sidewalks" required style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Group (shown in app)</label>
              {catGroup === "__NEW__" ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    autoFocus
                    value={newGroupName || ""}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Type new group name…"
                    required
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => { setCatGroup(""); setNewGroupName(""); }}
                    style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${S.border}`, background: "#fff", cursor: "pointer", fontFamily: S.font, fontWeight: 700, fontSize: 12, color: S.muted }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <CustomSelect
                  value={catGroup}
                  onChange={v => { if (v === "__NEW__") { setCatGroup("__NEW__"); setNewGroupName(""); } else setCatGroup(v); }}
                  options={[
                    ...existingGroups.map(g => ({ value: g, label: g })),
                    { value: "__NEW__", label: "+ Create New Group" },
                  ]}
                  placeholder="Select or create group…"
                  accent={S.accent}
                />
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Linked Office (for routing)</label>
              <CustomSelect
                value={catDept}
                onChange={setCatDept}
                options={[{ value: "", label: "No office linked" }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                accent={S.accent}
              />
            </div>
            <button type="submit" style={{ ...btnPrimary, height: 42 }}><Plus size={16} /> Add Category</button>
          </div>
        </form>

        {/* Categories grouped by group_name — collapsible */}
        <CategoryGroupList categories={categories} S={S} btnDanger={btnDanger} delCat={delCat} />
      </div>
    </div>
  );
}

/* ── Collapsible Category Group List ── */
function CategoryGroupList({ categories, S, btnDanger, delCat }) {
  const [openGroups, setOpenGroups] = useState({});

  const grouped = {};
  categories.forEach(c => {
    const g = c.group_name || "General";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(c);
  });

  const toggleGroup = (name) => setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  const isOpen = (name) => openGroups[name] === undefined ? true : openGroups[name];

  if (categories.length === 0) {
    return <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No categories added yet. Add categories above for citizens to use.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(grouped).map(([groupName, cats]) => {
        const open = isOpen(groupName);
        return (
          <div key={groupName} style={{ borderRadius: 14, border: `1px solid ${S.border}`, overflow: "hidden", background: "#fff" }}>
            <button type="button" onClick={() => toggleGroup(groupName)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "none", background: open ? (S.accentBg || "#fafafa") : "#fafafa", cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = S.accentBg || "#f5f5f4"}
              onMouseLeave={e => e.currentTarget.style.background = open ? (S.accentBg || "#fafafa") : "#fafafa"}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }} style={{ display: "flex", alignItems: "center", color: S.accent }}>
                  <ChevronDown size={16} strokeWidth={2.5} />
                </motion.span>
                <span style={{ fontSize: 13, fontWeight: 900, color: S.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>{groupName}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: S.accent, color: "#fff", minWidth: 20, textAlign: "center" }}>{cats.length}</span>
              </div>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }} style={{ overflow: "hidden" }}>
                  <div style={{ padding: "4px 8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
                    {cats.map(c => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, transition: "background 0.12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, opacity: 0.4, flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#18181b" }}>{c.name}</span>
                          {c.departments?.name && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>→ {c.departments.name}</span>
                          )}
                        </div>
                        <button onClick={() => delCat(c.id)} style={btnDanger}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Full Report Detail Modal ── */
function DashboardReportModal({ report, S, onClose, onStatusChange }) {
  const [status, setStatus] = useState(report.status);
  const [updating, setUpdating] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const photos = report.photo_url ? report.photo_url.split(",").filter(Boolean) : [];

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await supabase.from("reports").update({ status: newStatus, status_label: newStatus }).eq("id", report.id);
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  // Parse guest contact from description
  const guestMatch = report.description?.match(/^\[GUEST:.*?-\s*Contact:\s*(.+?)\]/);
  const contactNumber = guestMatch ? guestMatch[1].trim() : null;
  const desc = report.description?.replace(/^\[GUEST:.*?\]\n\n/s, "") || "No description provided.";

  const statusMap = {
    pending: { color: "#ef4444", bg: "#fef2f2", label: "Pending" },
    inprogress: { color: "#3b82f6", bg: "#eff6ff", label: "In Progress" },
    resolved: { color: "#22c55e", bg: "#f0fdf4", label: "Resolved" },
  };
  const st = statusMap[status] || statusMap.pending;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", padding: 20 }}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={e => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>

          {/* Header */}
          <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {report.photo_url
                ? <img src={report.photo_url.split(",")[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} />
                : <FileText size={24} color={st.color} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#18181b", lineHeight: 1.2 }}>{report.title}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#a1a1aa", fontWeight: 600 }}>{report.category || "Uncategorized"}</p>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: "#f4f4f5", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#e4e4e7"}
              onMouseLeave={e => e.currentTarget.style.background = "#f4f4f5"}>
              <X size={16} color="#71717a" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 28px" }}>
            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "12px 16px", background: st.bg, borderRadius: 14, border: `1px solid ${st.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.color, boxShadow: `0 0 8px ${st.color}66` }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: st.color }}>{st.label}</span>
              </div>
              <CustomSelect
                value={status}
                onChange={handleStatusChange}
                disabled={updating}
                options={[
                  { value: "pending", label: "Pending", color: "#ef4444" },
                  { value: "inprogress", label: "In Progress", color: "#3b82f6" },
                  { value: "resolved", label: "Resolved", color: "#22c55e" },
                ]}
                compact
                accent={S.accent}
                style={{ minWidth: 140 }}
              />
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { icon: <Users size={14} color="#a1a1aa" />, label: "Reported by", value: report.full_name || "Anonymous" },
                { icon: <Calendar size={14} color="#a1a1aa" />, label: "Date Filed", value: new Date(report.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) },
                ...(contactNumber ? [{ icon: <Phone size={14} color="#a1a1aa" />, label: "Contact Number", value: contactNumber }] : []),
                ...(report.is_guest ? [{ icon: <AlertCircle size={14} color="#d97706" />, label: "Reporter Type", value: "Guest (Unregistered)" }] : []),
                { icon: <MapPin size={14} color="#16a34a" />, label: "Location", value: report.location || "—", span: true },
              ].map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "#fafafa", borderRadius: 12, border: "1px solid #f4f4f5", gridColumn: item.span ? "1 / -1" : "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>{item.icon}<span style={{ fontSize: 10, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</span></div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#27272a" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5 }}>Description</p>
              <div style={{ padding: "14px 16px", background: "#fafafa", borderRadius: 12, border: "1px solid #f4f4f5" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#3f3f46", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{desc}</p>
              </div>
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.5 }}>Evidence Photos ({photos.length})</p>
                <div style={{ display: "grid", gridTemplateColumns: photos.length === 1 ? "1fr" : "1fr 1fr", gap: 8 }}>
                  {photos.map((url, i) => (
                    <div key={i} onClick={() => setLightboxImg(url)}
                      style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", border: "1px solid #e4e4e7", aspectRatio: photos.length === 1 ? "16/10" : "1/1" }}>
                      <img src={url.trim()} alt={`Evidence ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Directions */}
            {report.lat && report.lng && (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: S.accent || "#18181b", color: "white", borderRadius: 14, padding: "14px", textDecoration: "none", fontSize: 14, fontWeight: 800, marginTop: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "opacity 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                <Navigation size={18} /> Get Directions
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox */}
      {lightboxImg && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setLightboxImg(null)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 20 }}>
          <img src={lightboxImg} alt="Full view" style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 12, objectFit: "contain", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setLightboxImg(null)} style={{ position: "absolute", top: 24, right: 24, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={20} color="white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Activity Logs Tab ── */
function ActivityLogsTab({ S, cardStyle, inputStyle, selectStyle }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch logs
      const { data: logsData } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch users to map actor_id to name
      const { data: usersData } = await supabase.rpc("get_auth_users");
      const uMap = {};
      if (usersData) {
        usersData.forEach(u => {
          uMap[u.id] = u.full_name || u.email;
        });
      }

      setLogs(logsData || []);
      setUsersMap(uMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>Loading logs…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900 }}>Audit Logs</h3>
            <p style={{ margin: 0, fontSize: 13, color: S.muted }}>Tracking system modifications for accountability and compliance.</p>
          </div>
          <button onClick={fetchLogs} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${S.border}`, background: "#fff", cursor: "pointer", fontFamily: S.font, fontWeight: 700, fontSize: 13, color: S.text, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map(log => {
            const actorName = log.actor_id ? (usersMap[log.actor_id] || "Unknown User") : "System / Guest";
            const actionColor = log.action === "DELETE" ? "#ef4444" : log.action === "INSERT" ? "#10b981" : "#3b82f6";
            const actionBg = log.action === "DELETE" ? "#fef2f2" : log.action === "INSERT" ? "#ecfdf5" : "#eff6ff";
            
            return (
              <div key={log.id} style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${S.border}`, background: "#fafcf9", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, background: actionBg, color: actionColor, fontSize: 11, fontWeight: 900 }}>{log.action}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#18181b" }}>{log.table_name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: S.muted, fontWeight: 700 }}>
                    {new Date(log.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: S.muted, fontWeight: 600 }}>
                  <Users size={14} /> {actorName} 
                  <span style={{ color: "#d4d4d8" }}>|</span> 
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>ID: {log.record_id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No audit logs recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Advisories Tab (Phase 3) - REDESIGNED WITH BETTER WORKFLOW ── */
function AdvisoriesTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment }) {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdvisory, setEditingAdvisory] = useState(null);
  const [newAdvisory, setNewAdvisory] = useState({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" });
  const [submitting, setSubmitting] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: "", message: "", onConfirm: null, confirmText: "Confirm", type: "info" });

  useEffect(() => {
    fetchAdvisories();
  }, [adminDepartment, isSuperadmin]);

  const fetchAdvisories = async () => {
    setLoading(true);
    try {
      let query = supabase.from("advisories").select("*, departments(name)").order("created_at", { ascending: false });
      
      const { data } = await query;
      setAdvisories(data || []);

      const { data: usersData } = await supabase.rpc("get_auth_users");
      const uMap = {};
      if (usersData) {
        usersData.forEach(u => { uMap[u.id] = u.full_name || u.email; });
      }
      setUsersMap(uMap);
    } catch (e) {
      console.error("Advisories fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessModal = (message) => {
    setModalConfig({
      title: "Success",
      message,
      onConfirm: () => setShowModal(false),
      confirmText: "OK",
      type: "success"
    });
    setShowModal(true);
  };

  const showErrorModal = (message) => {
    setModalConfig({
      title: "Error",
      message,
      onConfirm: () => setShowModal(false),
      confirmText: "OK",
      type: "error"
    });
    setShowModal(true);
  };

  const showConfirmModal = (title, message, onConfirm, confirmText = "Confirm") => {
    setModalConfig({
      title,
      message,
      onConfirm: () => {
        setShowModal(false);
        onConfirm();
      },
      confirmText,
      type: "warning"
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAdvisory.title || !newAdvisory.content) return;
    setSubmitting(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (editingAdvisory) {
        // UPDATE existing advisory
        const updateData = {
          title: newAdvisory.title,
          content: newAdvisory.content,
          category: newAdvisory.category,
        };
        if (newAdvisory.scheduled_for) updateData.scheduled_for = new Date(newAdvisory.scheduled_for).toISOString();

        const { error } = await supabase.from("advisories").update(updateData).eq("id", editingAdvisory.id);
        
        if (error) throw error;
        
        showSuccessModal("Advisory updated successfully!");
        setEditingAdvisory(null);
      } else {
        // CREATE new advisory
        const insertData = {
          title: newAdvisory.title,
          content: newAdvisory.content,
          category: newAdvisory.category,
          status: isSuperadmin ? "Published" : "Pending",
          author_id: userData?.user?.id,
        };

        if (!isSuperadmin && adminDepartment?.id) {
          insertData.department_id = adminDepartment.id;
        }
        if (isSuperadmin) insertData.published_at = new Date().toISOString();
        if (newAdvisory.scheduled_for) insertData.scheduled_for = new Date(newAdvisory.scheduled_for).toISOString();

        const { error } = await supabase.from("advisories").insert(insertData);
        
        if (error) throw error;
        
        showSuccessModal(isSuperadmin ? "Advisory published successfully!" : "Advisory submitted for approval!");
        
        if (!isSuperadmin) {
          setFilterStatus("Pending");
        }
      }
      
      setNewAdvisory({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" });
      setShowForm(false);
      fetchAdvisories();
    } catch (err) {
      console.error("Submit error:", err);
      showErrorModal(`Failed to save advisory: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = (id) => {
    showConfirmModal(
      "Publish Advisory",
      "This will make the advisory visible to all citizens. Continue?",
      async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const { error } = await supabase.from("advisories").update({
            status: "Published",
            approved_by: userData?.user?.id,
            published_at: new Date().toISOString()
          }).eq("id", id);
          
          if (error) throw error;
          showSuccessModal("Advisory published successfully!");
          fetchAdvisories();
        } catch (err) {
          showErrorModal(`Failed to publish: ${err.message}`);
        }
      },
      "Publish"
    );
  };

  const handleUnpublish = (id) => {
    showConfirmModal(
      "Unpublish Advisory",
      "This will hide the advisory from citizens but keep it in the system. Continue?",
      async () => {
        try {
          const { error } = await supabase.from("advisories").update({
            status: "Draft",
            published_at: null
          }).eq("id", id);
          
          if (error) throw error;
          showSuccessModal("Advisory unpublished successfully!");
          fetchAdvisories();
        } catch (err) {
          showErrorModal(`Failed to unpublish: ${err.message}`);
        }
      },
      "Unpublish"
    );
  };

  const handleArchive = (id) => {
    showConfirmModal(
      "Archive Advisory",
      "This will move the advisory to archive. You can restore it later if needed.",
      async () => {
        try {
          const { error } = await supabase.from("advisories").update({
            status: "Archived"
          }).eq("id", id);
          
          if (error) throw error;
          showSuccessModal("Advisory archived successfully!");
          fetchAdvisories();
        } catch (err) {
          showErrorModal(`Failed to archive: ${err.message}`);
        }
      },
      "Archive"
    );
  };

  const handleRestore = (id) => {
    showConfirmModal(
      "Restore Advisory",
      "Restore this advisory to draft status?",
      async () => {
        try {
          const { error } = await supabase.from("advisories").update({
            status: "Draft"
          }).eq("id", id);
          
          if (error) throw error;
          showSuccessModal("Advisory restored successfully!");
          fetchAdvisories();
        } catch (err) {
          showErrorModal(`Failed to restore: ${err.message}`);
        }
      },
      "Restore"
    );
  };

  const handleDelete = (id, title) => {
    showConfirmModal(
      "Delete Advisory",
      `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`,
      async () => {
        try {
          const { error } = await supabase.from("advisories").delete().eq("id", id);
          
          if (error) throw error;
          showSuccessModal("Advisory deleted successfully!");
          fetchAdvisories();
        } catch (err) {
          showErrorModal(`Failed to delete: ${err.message}`);
        }
      },
      "Delete Permanently"
    );
  };

  const handleEdit = (advisory) => {
    setEditingAdvisory(advisory);
    setNewAdvisory({
      title: advisory.title,
      content: advisory.content,
      category: advisory.category,
      scheduled_for: advisory.scheduled_for ? new Date(advisory.scheduled_for).toISOString().slice(0, 16) : ""
    });
    setShowForm(true);
  };

  const filteredAdvisories = advisories.filter(a => filterStatus === "All" || a.status === filterStatus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.5)",
                zIndex: 9998,
                backdropFilter: "blur(4px)"
              }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                maxWidth: 440,
                width: "90%",
                zIndex: 9999,
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#18181b", display: "flex", alignItems: "center", gap: 8 }}>
                  {modalConfig.type === "success" && <CheckCircle2 size={22} color="#10b981" />}
                  {modalConfig.type === "error" && <AlertTriangle size={22} color="#ef4444" />}
                  {modalConfig.type === "warning" && <AlertTriangle size={22} color="#f59e0b" />}
                  {modalConfig.title}
                </h3>
              </div>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "#52525b", lineHeight: 1.6 }}>
                {modalConfig.message}
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                {modalConfig.type !== "success" && modalConfig.type !== "error" && (
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: `1px solid ${S.border}`,
                      background: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: S.font,
                      fontSize: 14
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={modalConfig.onConfirm}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: modalConfig.type === "error" ? "#ef4444" : modalConfig.type === "warning" ? "#f59e0b" : S.accent,
                    color: "#ffffff",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: S.font,
                    fontSize: 14
                  }}
                >
                  {modalConfig.confirmText}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showForm ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{editingAdvisory ? "Edit Advisory" : "Create Advisory"}</h3>
            <button onClick={() => { setShowForm(false); setEditingAdvisory(null); setNewAdvisory({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" }); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Headline</label>
              <input value={newAdvisory.title} onChange={e => setNewAdvisory({...newAdvisory, title: e.target.value})} placeholder="E.g. Heavy Rainfall Warning" required style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Category</label>
                <CustomSelect
                  value={newAdvisory.category}
                  onChange={v => setNewAdvisory({...newAdvisory, category: v})}
                  options={[{value: "Weather", label: "Weather"}, {value: "Water", label: "Water Interruption"}, {value: "Power", label: "Power Outage"}, {value: "Health", label: "Health / Safety"}, {value: "General", label: "General"}]}
                  accent={S.accent}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Schedule (Optional)</label>
                <input type="datetime-local" value={newAdvisory.scheduled_for} onChange={e => setNewAdvisory({...newAdvisory, scheduled_for: e.target.value})} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Content</label>
              <textarea value={newAdvisory.content} onChange={e => setNewAdvisory({...newAdvisory, content: e.target.value})} placeholder="Advisory details..." required style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => { setShowForm(false); setEditingAdvisory(null); setNewAdvisory({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: S.font }}>Cancel</button>
              <button type="submit" disabled={submitting} style={btnPrimary}>
                <Check size={16} /> {submitting ? "Saving..." : editingAdvisory ? "Update Advisory" : (isSuperadmin ? "Publish Now" : "Submit for Approval")}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...cardStyle, padding: "16px 24px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Official Advisories</h3>
            <p style={{ margin: 0, fontSize: 13, color: S.muted }}>Manage public announcements and warnings.</p>
          </div>
          <button onClick={() => setShowForm(true)} style={btnPrimary}><Plus size={16} /> New Advisory</button>
        </div>
      )}

      {!showForm && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>{filteredAdvisories.length} Advisories</h3>
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[{value: "All", label: "All Statuses"}, {value: "Published", label: "Published"}, {value: "Pending", label: "Pending Approval"}, {value: "Draft", label: "Drafts"}, {value: "Archived", label: "Archived"}]}
              compact accent={S.accent} style={{ minWidth: 150 }}
            />
          </div>
          
          {loading ? <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredAdvisories.map(adv => {
                const isPublished = adv.status === "Published";
                const isPending = adv.status === "Pending";
                const isArchived = adv.status === "Archived";
                const isDraft = adv.status === "Draft";
                const author = usersMap[adv.author_id] || "Unknown User";
                
                return (
                  <div key={adv.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: "#fafcf9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 20, background: S.accentBg, color: S.accent, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{adv.category}</span>
                          {adv.departments?.name && <span style={{ fontSize: 10, color: S.muted, fontWeight: 700 }}>• {adv.departments.name}</span>}
                          {adv.scheduled_for && <span style={{ fontSize: 10, color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> Scheduled: {new Date(adv.scheduled_for).toLocaleString()}</span>}
                        </div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#18181b" }}>{adv.title}</h4>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, 
                        background: isPublished ? "#ecfdf5" : isPending ? "#fffbeb" : isArchived ? "#f4f4f5" : "#eff6ff", 
                        color: isPublished ? "#10b981" : isPending ? "#d97706" : isArchived ? "#71717a" : "#3b82f6" }}>
                        {adv.status}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#3f3f46", lineHeight: 1.5 }}>{adv.content}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: S.muted, fontWeight: 600 }}>
                      <span>Author: {author} • Created: {new Date(adv.created_at).toLocaleDateString()}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {/* Edit button for drafts and pending */}
                        {(isDraft || isPending) && (
                          <button
                            onClick={() => handleEdit(adv)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: `1px solid ${S.border}`,
                              background: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        )}
                        
                        {/* Pending: Can approve (superadmin only) */}
                        {isPending && isSuperadmin && (
                          <button onClick={() => handlePublish(adv.id)} style={{ ...btnPrimary, fontSize: 12, padding: "6px 12px" }}>
                            <Check size={12} /> Approve & Publish
                          </button>
                        )}
                        
                        {/* Published: Can unpublish or archive */}
                        {isPublished && isSuperadmin && (
                          <>
                            <button
                              onClick={() => handleUnpublish(adv.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "1px solid #d97706",
                                background: "#fff",
                                color: "#d97706",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Unpublish
                            </button>
                            <button
                              onClick={() => handleArchive(adv.id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "1px solid #71717a",
                                background: "#fff",
                                color: "#71717a",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Archive
                            </button>
                          </>
                        )}
                        
                        {/* Draft: Can publish or delete */}
                        {isDraft && (
                          <>
                            {isSuperadmin && (
                              <button onClick={() => handlePublish(adv.id)} style={{ ...btnPrimary, fontSize: 12, padding: "6px 12px" }}>
                                <Check size={12} /> Publish
                              </button>
                            )}
                          </>
                        )}
                        
                        {/* Archived: Can restore or delete */}
                        {isArchived && (
                          <button
                            onClick={() => handleRestore(adv.id)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: `1px solid ${S.accent}`,
                              background: "#fff",
                              color: S.accent,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Restore
                          </button>
                        )}
                        
                        {/* Delete button (always available for admins) */}
                        <button onClick={() => handleDelete(adv.id, adv.title)} style={{ ...btnDanger, fontSize: 12, padding: "6px 12px" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredAdvisories.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No advisories found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Hospital Monitoring Tab (Phase 5) - Palayan City Hospital Only ── */
function HospitalsTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("add"); // 'add' or 'view'
  const [isExpanded, setIsExpanded] = useState(true); // Control expand/collapse
  const [formData, setFormData] = useState({ 
    record_date: new Date().toISOString().split('T')[0],
    heat_stroke_cases: 0, 
    heat_exhaustion_cases: 0, 
    dehydration_cases: 0,
    respiratory_cases: 0,
    total_admissions: 0,
    remarks: ""
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("hospital_daily_records")
        .select("*")
        .order("record_date", { ascending: false })
        .limit(30); // Last 30 days
      setRecords(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      // Prevent future dates
      const selectedDate = new Date(formData.record_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (!editId && selectedDate > today) {
        showErrorModal(
          "Invalid Date",
          "Cannot add records for future dates. Please select today or a past date."
        );
        return;
      }

      // Calculate El Niño related cases
      const elNinoCases = 
        (parseInt(formData.heat_stroke_cases) || 0) +
        (parseInt(formData.heat_exhaustion_cases) || 0) +
        (parseInt(formData.dehydration_cases) || 0) +
        (parseInt(formData.respiratory_cases) || 0);
      
      const totalAdmissions = parseInt(formData.total_admissions) || 0;

      // Validation: Total admissions must be >= El Niño cases
      if (totalAdmissions < elNinoCases) {
        showErrorModal(
          "Invalid Data",
          `Total admissions (${totalAdmissions}) cannot be less than the sum of El Niño-related cases (${elNinoCases}). Please check your numbers.`
        );
        return;
      }

      const payload = {
        hospital_name: "Palayan City Hospital",
        record_date: formData.record_date,
        heat_stroke_cases: parseInt(formData.heat_stroke_cases) || 0,
        heat_exhaustion_cases: parseInt(formData.heat_exhaustion_cases) || 0,
        dehydration_cases: parseInt(formData.dehydration_cases) || 0,
        respiratory_cases: parseInt(formData.respiratory_cases) || 0,
        total_admissions: totalAdmissions,
        remarks: formData.remarks || null
      };

      if (editId) {
        const { error } = await supabase
          .from("hospital_daily_records")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        showSuccessModal("Record Updated", "Hospital record updated successfully");
      } else {
        // Check if record already exists for this date
        const { data: existingRecord } = await supabase
          .from("hospital_daily_records")
          .select("*")
          .eq("record_date", formData.record_date)
          .single();

        if (existingRecord) {
          // Record exists - show friendly message with update option
          showConfirmModal(
            "Record Already Exists",
            `A record for ${new Date(formData.record_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} already exists. Would you like to update it with the new data?`,
            () => editRecord(existingRecord),
            "Update Record",
            "Cancel"
          );
          return;
        }

        const { error } = await supabase
          .from("hospital_daily_records")
          .insert(payload);
        if (error) throw error;
        showSuccessModal("Record Added", "Daily hospital record added successfully");
      }
      
      setShowForm(false);
      setEditId(null);
      setFormData({ 
        record_date: new Date().toISOString().split('T')[0],
        heat_stroke_cases: 0, 
        heat_exhaustion_cases: 0, 
        dehydration_cases: 0,
        respiratory_cases: 0,
        total_admissions: 0,
        remarks: ""
      });
      fetchRecords();
      setActiveSubTab("view"); // Switch to view after adding
    } catch (error) {
      showErrorModal("Error", error.message || "Failed to save record");
    }
  };

  const editRecord = (record) => {
    setFormData({ 
      record_date: record.record_date,
      heat_stroke_cases: record.heat_stroke_cases,
      heat_exhaustion_cases: record.heat_exhaustion_cases,
      dehydration_cases: record.dehydration_cases,
      respiratory_cases: record.respiratory_cases,
      total_admissions: record.total_admissions,
      remarks: record.remarks || ""
    });
    setEditId(record.id);
    setActiveSubTab("add"); // Switch to form tab
    setShowForm(true);
  };

  const deleteRecord = async (id, date) => {
    showConfirmModal(
      "Delete Record",
      `Are you sure you want to delete the record for ${new Date(date).toLocaleDateString()}? This action cannot be undone.`,
      async () => {
        try {
          const { error } = await supabase
            .from("hospital_daily_records")
            .delete()
            .eq("id", id);
          if (error) throw error;
          await fetchRecords();
          showSuccessModal("Deleted", "Hospital record deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete hospital record");
        }
      },
      "Delete"
    );
  };

  // Calculate statistics for last 7 days
  const last7Days = records.slice(0, 7);
  const totalHeatStroke = last7Days.reduce((sum, r) => sum + (r.heat_stroke_cases || 0), 0);
  const totalExhaustion = last7Days.reduce((sum, r) => sum + (r.heat_exhaustion_cases || 0), 0);
  const totalDehydration = last7Days.reduce((sum, r) => sum + (r.dehydration_cases || 0), 0);
  const totalRespiratory = last7Days.reduce((sum, r) => sum + (r.respiratory_cases || 0), 0);
  const totalAdmissions = last7Days.reduce((sum, r) => sum + (r.total_admissions || 0), 0);
  const totalElNinoCases = totalHeatStroke + totalExhaustion + totalDehydration + totalRespiratory;
  const elNinoPercentage = totalAdmissions > 0 ? Math.round((totalElNinoCases / totalAdmissions) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hospital Header */}
      <div style={{ ...cardStyle, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, background: "rgba(255,255,255,0.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartPulse size={32} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Palayan City Hospital</h2>
            <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.9 }}>El Niño Health Impact Monitoring</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 16, backdropFilter: "blur(10px)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: "uppercase" }}>Total Records</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900 }}>{records.length}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 16, backdropFilter: "blur(10px)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: "uppercase" }}>El Niño Impact</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900 }}>{elNinoPercentage}%</p>
            <p style={{ margin: "4px 0 0", fontSize: 10, opacity: 0.8 }}>of total admissions</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Last 7 Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, background: "#fff1f2", borderColor: "#fecdd3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={18} color="#e11d48" />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#e11d48", textTransform: "uppercase" }}>Heat Stroke</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#9f1239" }}>{totalHeatStroke}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#be123c" }}>Last 7 days</p>
        </div>
        <div style={{ ...cardStyle, background: "#fff7ed", borderColor: "#fed7aa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertCircle size={18} color="#ea580c" />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>Heat Exhaustion</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#9a3412" }}>{totalExhaustion}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#c2410c" }}>Last 7 days</p>
        </div>
        <div style={{ ...cardStyle, background: "#f0f9ff", borderColor: "#bae6fd" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Droplet size={18} color="#0284c7" />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#0284c7", textTransform: "uppercase" }}>Dehydration</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#075985" }}>{totalDehydration}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#0369a1" }}>Last 7 days</p>
        </div>
        <div style={{ ...cardStyle, background: "#faf5ff", borderColor: "#e9d5ff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Activity size={18} color="#9333ea" />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#9333ea", textTransform: "uppercase" }}>Respiratory</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#6b21a8" }}>{totalRespiratory}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#7e22ce" }}>Last 7 days</p>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div style={cardStyle}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          paddingBottom: 16,
          borderBottom: `2px solid ${S.border}`
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: activeSubTab === "add" ? S.accent : "transparent",
                color: activeSubTab === "add" ? "#fff" : S.text,
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Plus size={16} /> Add Record
            </button>
            <button
              onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: activeSubTab === "view" ? S.accent : "transparent",
                color: activeSubTab === "view" ? "#fff" : S.text,
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <FileText size={16} /> View Records
            </button>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: S.muted,
              padding: 8,
              borderRadius: 8,
              display: "flex",
              alignItems: "center"
            }}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              {/* Add Record Tab */}
              {activeSubTab === "add" && (
                <div style={{ padding: "24px 0" }}>
                  <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                          Record Date {editId && <span style={{ color: S.accent, fontSize: 10 }}>(Cannot be changed when editing)</span>}
                        </label>
                        <input 
                          type="date" 
                          value={formData.record_date} 
                          onChange={e => setFormData({...formData, record_date: e.target.value})} 
                          max={new Date().toISOString().split('T')[0]}
                          required 
                          readOnly={editId !== null}
                          disabled={editId !== null}
                          style={{
                            ...inputStyle,
                            backgroundColor: editId ? S.cardBg : "#fff",
                            cursor: editId ? "not-allowed" : "text",
                            opacity: editId ? 0.7 : 1
                          }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Heat Stroke Cases</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={formData.heat_stroke_cases} 
                          onChange={e => setFormData({...formData, heat_stroke_cases: e.target.value})} 
                          style={inputStyle} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Heat Exhaustion Cases</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={formData.heat_exhaustion_cases} 
                          onChange={e => setFormData({...formData, heat_exhaustion_cases: e.target.value})} 
                          style={inputStyle} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Dehydration Cases</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={formData.dehydration_cases} 
                          onChange={e => setFormData({...formData, dehydration_cases: e.target.value})} 
                          style={inputStyle} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Respiratory Cases</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={formData.respiratory_cases} 
                          onChange={e => setFormData({...formData, respiratory_cases: e.target.value})} 
                          style={inputStyle} 
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Total Admissions Today</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={formData.total_admissions} 
                          onChange={e => setFormData({...formData, total_admissions: e.target.value})} 
                          style={inputStyle} 
                          placeholder="Include all hospital admissions for the day"
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4, textTransform: "uppercase" }}>Remarks (Optional)</label>
                        <textarea 
                          value={formData.remarks} 
                          onChange={e => setFormData({...formData, remarks: e.target.value})} 
                          placeholder="Any notable observations or incidents..."
                          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} 
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "16px 0", borderTop: `1px solid ${S.border}` }}>
                      <p style={{ margin: 0, fontSize: 12, color: S.muted }}>
                        {editId ? "Updating existing record" : "Adding new daily record"}
                      </p>
                      <div style={{ display: "flex", gap: 10 }}>
                        {editId && (
                          <button 
                            type="button"
                            onClick={() => {
                              setEditId(null);
                              setFormData({ 
                                record_date: new Date().toISOString().split('T')[0],
                                heat_stroke_cases: 0, 
                                heat_exhaustion_cases: 0, 
                                dehydration_cases: 0,
                                respiratory_cases: 0,
                                total_admissions: 0,
                                remarks: ""
                              });
                            }}
                            style={{
                              padding: "10px 20px",
                              borderRadius: 10,
                              border: `1px solid ${S.border}`,
                              background: "#fff",
                              color: S.text,
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Cancel Edit
                          </button>
                        )}
                        <button type="submit" style={btnPrimary}>
                          <Check size={16} /> {editId ? "Update Record" : "Save Record"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* View Records Tab */}
              {activeSubTab === "view" && (
                <div style={{ padding: "24px 0" }}>
                  {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                      <p style={{ color: S.muted }}>Loading records...</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {records.map(record => {
                        const totalHeat = (record.heat_stroke_cases || 0) + (record.heat_exhaustion_cases || 0) + (record.dehydration_cases || 0);
                        const elNinoCases = totalHeat + (record.respiratory_cases || 0);
                        const elNinoPercent = record.total_admissions > 0 ? Math.round((elNinoCases / record.total_admissions) * 100) : 0;
                        const criticalLevel = record.heat_stroke_cases > 5 ? "critical" : totalHeat > 10 ? "warning" : "normal";
                
                        return (
                          <div 
                            key={record.id} 
                            style={{ 
                              padding: "20px 24px", 
                              borderRadius: 16, 
                              border: `2px solid ${criticalLevel === "critical" ? "#fecdd3" : criticalLevel === "warning" ? "#fed7aa" : S.border}`, 
                              background: criticalLevel === "critical" ? "#fff1f2" : criticalLevel === "warning" ? "#fff7ed" : "#fafafa",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start"
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <div style={{ 
                                  width: 48, 
                                  height: 48, 
                                  borderRadius: 12, 
                                  background: criticalLevel === "critical" ? "#e11d48" : criticalLevel === "warning" ? "#ea580c" : S.accent,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}>
                                  <Calendar size={24} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#18181b" }}>
                                    {new Date(record.record_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </h4>
                                  <p style={{ margin: "2px 0 0", fontSize: 12, color: S.muted, fontWeight: 700 }}>
                                    {record.total_admissions || 0} total admissions • 
                                    <span style={{ color: elNinoPercent > 50 ? "#dc2626" : elNinoPercent > 30 ? "#ea580c" : "#10b981", fontWeight: 900, marginLeft: 6 }}>
                                      {elNinoPercent}% El Niño related
                                    </span>
                                  </p>
                                </div>
                                {criticalLevel === "critical" && (
                                  <span style={{ 
                                    padding: "4px 12px", 
                                    borderRadius: 20, 
                                    background: "#e11d48", 
                                    color: "#fff", 
                                    fontSize: 11, 
                                    fontWeight: 900,
                                    textTransform: "uppercase",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                  }}>
                                    <AlertTriangle size={12} /> Critical
                                  </span>
                                )}
                                {criticalLevel === "warning" && (
                                  <span style={{ 
                                    padding: "4px 12px", 
                                    borderRadius: 20, 
                                    background: "#ea580c", 
                                    color: "#fff", 
                                    fontSize: 11, 
                                    fontWeight: 900,
                                    textTransform: "uppercase",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                  }}>
                                    <AlertCircle size={12} /> Warning
                                  </span>
                                )}
                              </div>
                      
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16, marginBottom: 12 }}>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#e11d48", textTransform: "uppercase" }}>Heat Stroke</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "#9f1239" }}>{record.heat_stroke_cases || 0}</p>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>Heat Exhaustion</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "#9a3412" }}>{record.heat_exhaustion_cases || 0}</p>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#0284c7", textTransform: "uppercase" }}>Dehydration</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "#075985" }}>{record.dehydration_cases || 0}</p>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9333ea", textTransform: "uppercase" }}>Respiratory</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "#6b21a8" }}>{record.respiratory_cases || 0}</p>
                                </div>
                              </div>

                              {record.remarks && (
                                <div style={{ 
                                  padding: "12px 16px", 
                                  borderRadius: 10, 
                                  background: "rgba(0,0,0,0.03)", 
                                  marginTop: 12,
                                  border: "1px solid rgba(0,0,0,0.06)"
                                }}>
                                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: S.muted, textTransform: "uppercase", marginBottom: 4 }}>Remarks</p>
                                  <p style={{ margin: 0, fontSize: 13, color: "#3f3f46", lineHeight: 1.5 }}>{record.remarks}</p>
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                              <button 
                                onClick={() => editRecord(record)} 
                                style={{ 
                                  background: "none", 
                                  border: `1px solid ${S.border}`, 
                                  borderRadius: 10, 
                                  padding: "8px 12px", 
                                  cursor: "pointer", 
                                  color: S.text,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  fontWeight: 700,
                                  fontSize: 13
                                }}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button 
                                onClick={() => deleteRecord(record.id, record.record_date)} 
                                style={btnDanger}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {records.length === 0 && (
                        <div style={{ padding: 60, textAlign: "center" }}>
                          <HeartPulse size={48} color={S.muted} style={{ opacity: 0.3, marginBottom: 16 }} />
                          <p style={{ margin: 0, color: S.muted, fontSize: 15, fontWeight: 700 }}>No health records yet</p>
                          <p style={{ margin: "8px 0 0", color: S.muted, fontSize: 13 }}>Switch to "Add Record" tab to start tracking daily health data</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── CDRRMO Operations Tab (Phase 6) - Per-Operation Records ── */
function OperationsTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("view");
  const [isExpanded, setIsExpanded] = useState(true);
  const [editId, setEditId] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [formData, setFormData] = useState({
    operation_date: new Date().toISOString().split('T')[0],
    operation_time: "",
    operation_type: "evacuation",
    description: "",
    location: "",
    personnel_deployed: 0,
    beneficiaries: 0
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("cdrrmo_operations")
        .select("*")
        .order("operation_date", { ascending: false })
        .order("operation_time", { ascending: false });
      setRecords(data || []);
      
      // Auto-expand first day only
      if (data && data.length > 0) {
        const firstDate = data[0].operation_date;
        setExpandedDays({ [firstDate]: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const selectedDate = new Date(formData.operation_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        showErrorModal("Invalid Date", "Cannot add records for future dates. Please select today or a past date.");
        return;
      }

      const payload = {
        operation_date: formData.operation_date,
        operation_time: formData.operation_time,
        operation_type: formData.operation_type,
        description: formData.description || null,
        location: formData.location,
        personnel_deployed: parseInt(formData.personnel_deployed) || 0,
        beneficiaries: parseInt(formData.beneficiaries) || 0
      };

      if (editId) {
        const { error } = await supabase.from("cdrrmo_operations").update(payload).eq("id", editId);
        if (error) throw error;
        showSuccessModal("Record Updated", "Operation record updated successfully");
      } else {
        const { error } = await supabase.from("cdrrmo_operations").insert(payload);
        if (error) throw error;
        showSuccessModal("Record Added", "Operation record added successfully");
      }
      
      setEditId(null);
      setFormData({
        operation_date: new Date().toISOString().split('T')[0],
        operation_time: "",
        operation_type: "evacuation",
        description: "",
        location: "",
        personnel_deployed: 0,
        beneficiaries: 0
      });
      fetchRecords();
      setActiveSubTab("view");
    } catch (error) {
      showErrorModal("Error", error.message || "Failed to save record");
    }
  };

  const editRecord = (record) => {
    setFormData({
      operation_date: record.operation_date,
      operation_time: record.operation_time,
      operation_type: record.operation_type,
      description: record.description || "",
      location: record.location,
      personnel_deployed: record.personnel_deployed,
      beneficiaries: record.beneficiaries
    });
    setEditId(record.id);
    setActiveSubTab("add");
  };

  const deleteRecord = async (id) => {
    showConfirmModal(
      "Delete Operation",
      "Are you sure you want to delete this operation record? This action cannot be undone.",
      async () => {
        try {
          const { error } = await supabase.from("cdrrmo_operations").delete().eq("id", id);
          if (error) throw error;
          fetchRecords();
          showSuccessModal("Deleted", "Operation record deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete record");
        }
      },
      "Delete"
    );
  };

  // Analytics - last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7DaysRecords = records.filter(r => new Date(r.operation_date) >= sevenDaysAgo);
  
  const evacuations = last7DaysRecords.filter(r => r.operation_type === "evacuation").length;
  const rescues = last7DaysRecords.filter(r => r.operation_type === "rescue").length;
  const reliefDist = last7DaysRecords.filter(r => r.operation_type === "relief_distribution").length;
  const damageAssess = last7DaysRecords.filter(r => r.operation_type === "damage_assessment").length;
  const ambulances = last7DaysRecords.filter(r => r.operation_type === "ambulance_dispatch").length;
  const emergencies = last7DaysRecords.filter(r => r.operation_type === "emergency_response").length;

  // Group records by date
  const groupedByDate = records.reduce((acc, record) => {
    if (!acc[record.operation_date]) {
      acc[record.operation_date] = [];
    }
    acc[record.operation_date].push(record);
    return acc;
  }, {});

  const operationTypeLabels = {
    evacuation: "Evacuation",
    rescue: "Rescue",
    relief_distribution: "Relief Distribution",
    damage_assessment: "Damage Assessment",
    ambulance_dispatch: "Ambulance Dispatch",
    emergency_response: "Emergency Response"
  };

  const operationTypeBadge = (type) => {
    const colors = {
      evacuation: { bg: "#dbeafe", color: "#1e40af" },
      rescue: { bg: "#fef3c7", color: "#92400e" },
      relief_distribution: { bg: "#dcfce7", color: "#166534" },
      damage_assessment: { bg: "#f3e8ff", color: "#6b21a8" },
      ambulance_dispatch: { bg: "#fef08a", color: "#854d0e" },
      emergency_response: { bg: "#fce7f3", color: "#9f1239" }
    };
    const style = colors[type] || { bg: "#f3f4f6", color: "#6b7280" };
    return (
      <span style={{
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 800,
        background: style.bg,
        color: style.color,
        textTransform: "uppercase"
      }}>
        {operationTypeLabels[type]}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Palayan City CDRRMO Operations</h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>Track individual operations for Super El Niño response</p>
      </div>

      {/* Analytics Cards - Last 7 Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div style={{ ...cardStyle, background: "#dbeafe", borderColor: "#93c5fd", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#1e40af", textTransform: "uppercase" }}>Evacuations</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#1e3a8a" }}>{evacuations}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fef3c7", borderColor: "#fcd34d", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase" }}>Rescues</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#78350f" }}>{rescues}</p>
        </div>
        <div style={{ ...cardStyle, background: "#dcfce7", borderColor: "#86efac", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>Relief Dist.</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#14532d" }}>{reliefDist}</p>
        </div>
        <div style={{ ...cardStyle, background: "#f3e8ff", borderColor: "#d8b4fe", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#6b21a8", textTransform: "uppercase" }}>Assessments</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#581c87" }}>{damageAssess}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fef08a", borderColor: "#fde047", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#854d0e", textTransform: "uppercase" }}>Ambulances</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#713f12" }}>{ambulances}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fce7f3", borderColor: "#f9a8d4", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9f1239", textTransform: "uppercase" }}>Emergencies</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#831843" }}>{emergencies}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 12, paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid ${S.border}` }}>
          <button onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }} style={{ ...btnPrimary, background: activeSubTab === "add" ? S.accent : "transparent", color: activeSubTab === "add" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
            <Plus size={14} /> Add Record
          </button>
          <button onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }} style={{ ...btnPrimary, background: activeSubTab === "view" ? S.accent : "transparent", color: activeSubTab === "view" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
            <FileText size={14} /> View Records
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} style={{ marginLeft: "auto", background: "none", border: `1px solid ${S.border}`, padding: "8px", borderRadius: 8, cursor: "pointer", color: S.text, display: "flex", alignItems: "center" }}>
            <ChevronDown size={16} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
              {activeSubTab === "add" && (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Operation Date</label>
                      <input type="date" value={formData.operation_date} onChange={e => setFormData({ ...formData, operation_date: e.target.value })} max={new Date().toISOString().split('T')[0]} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Operation Time</label>
                      <input type="time" value={formData.operation_time} onChange={e => setFormData({ ...formData, operation_time: e.target.value })} required style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Operation Type</label>
                      <select value={formData.operation_type} onChange={e => setFormData({ ...formData, operation_type: e.target.value })} required style={selectStyle}>
                        <option value="evacuation">Evacuation</option>
                        <option value="rescue">Rescue</option>
                        <option value="relief_distribution">Relief Distribution</option>
                        <option value="damage_assessment">Damage Assessment</option>
                        <option value="ambulance_dispatch">Ambulance Dispatch</option>
                        <option value="emergency_response">Emergency Response</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Location</label>
                      <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required placeholder="e.g., Brgy. Singalat" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the operation..." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Personnel Deployed</label>
                      <input type="number" min="0" value={formData.personnel_deployed} onChange={e => setFormData({ ...formData, personnel_deployed: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Beneficiaries</label>
                      <input type="number" min="0" value={formData.beneficiaries} onChange={e => setFormData({ ...formData, beneficiaries: e.target.value })} required style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${S.border}` }}>
                    {editId && (
                      <button type="button" onClick={() => { setEditId(null); setFormData({ operation_date: new Date().toISOString().split('T')[0], operation_time: "", operation_type: "evacuation", description: "", location: "", personnel_deployed: 0, beneficiaries: 0 }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: "#fff", color: S.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" style={btnPrimary}>
                      <Check size={16} /> {editId ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {activeSubTab === "view" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loading ? (
                    <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading records...</p>
                  ) : Object.keys(groupedByDate).length === 0 ? (
                    <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>No operation records found. Add your first operation above.</p>
                  ) : (
                    Object.keys(groupedByDate).map(date => {
                      const dayRecords = groupedByDate[date];
                      const isExpanded = expandedDays[date];
                      return (
                        <div key={date} style={{ border: `1px solid ${S.border}`, borderRadius: 12, overflow: "hidden" }}>
                          <button onClick={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))} style={{ width: "100%", padding: 16, border: "none", background: S.accentBg, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 800, color: S.text }}>
                            <span>📅 {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {dayRecords.length} operation{dayRecords.length > 1 ? 's' : ''}</span>
                            <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden", background: "#fff" }}>
                                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                  {dayRecords.map(record => (
                                    <div key={record.id} style={{ padding: 12, border: `1px solid ${S.border}`, borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                                          <span style={{ fontSize: 13, fontWeight: 800, color: S.text }}>{record.operation_time || "N/A"}</span>
                                          {operationTypeBadge(record.operation_type)}
                                          <span style={{ fontSize: 12, color: S.muted }}>📍 {record.location}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <button onClick={() => editRecord(record)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${S.border}`, background: "#fff", color: S.text, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                            <Edit2 size={12} /> Edit
                                          </button>
                                          <button onClick={() => deleteRecord(record.id)} style={{ ...btnDanger, fontSize: 11, padding: "4px 8px" }}>
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      {record.description && (
                                        <p style={{ margin: 0, fontSize: 12, color: S.text, lineHeight: 1.5 }}>{record.description}</p>
                                      )}
                                      <div style={{ display: "flex", gap: 16, fontSize: 11, color: S.muted }}>
                                        <span>👷 {record.personnel_deployed} personnel</span>
                                        <span>👥 {record.beneficiaries} beneficiaries</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── BFP Operations Tab (Phase 7) - Per-Operation Records ── */
function BfpOperationsTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("view");
  const [isExpanded, setIsExpanded] = useState(true);
  const [editId, setEditId] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [formData, setFormData] = useState({
    operation_date: new Date().toISOString().split('T')[0],
    operation_time: "",
    operation_type: "fire_incident",
    description: "",
    location: "",
    personnel_deployed: 0,
    fire_trucks_dispatched: 0,
    casualties: 0,
    property_damage_estimate: 0
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("bfp_operations")
        .select("*")
        .order("operation_date", { ascending: false })
        .order("operation_time", { ascending: false });
      setRecords(data || []);
      
      // Auto-expand first day only
      if (data && data.length > 0) {
        const firstDate = data[0].operation_date;
        setExpandedDays({ [firstDate]: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const selectedDate = new Date(formData.operation_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        showErrorModal("Invalid Date", "Cannot add records for future dates. Please select today or a past date.");
        return;
      }

      const payload = {
        operation_date: formData.operation_date,
        operation_time: formData.operation_time,
        operation_type: formData.operation_type,
        description: formData.description || null,
        location: formData.location,
        personnel_deployed: parseInt(formData.personnel_deployed) || 0,
        fire_trucks_dispatched: parseInt(formData.fire_trucks_dispatched) || 0,
        casualties: parseInt(formData.casualties) || 0,
        property_damage_estimate: parseFloat(formData.property_damage_estimate) || 0
      };

      if (editId) {
        const { error } = await supabase.from("bfp_operations").update(payload).eq("id", editId);
        if (error) throw error;
        showSuccessModal("Record Updated", "Operation record updated successfully");
      } else {
        const { error } = await supabase.from("bfp_operations").insert(payload);
        if (error) throw error;
        showSuccessModal("Record Added", "Operation record added successfully");
      }
      
      setEditId(null);
      setFormData({
        operation_date: new Date().toISOString().split('T')[0],
        operation_time: "",
        operation_type: "fire_incident",
        description: "",
        location: "",
        personnel_deployed: 0,
        fire_trucks_dispatched: 0,
        casualties: 0,
        property_damage_estimate: 0
      });
      fetchRecords();
      setActiveSubTab("view");
    } catch (error) {
      showErrorModal("Error", error.message || "Failed to save record");
    }
  };

  const editRecord = (record) => {
    setFormData({
      operation_date: record.operation_date,
      operation_time: record.operation_time,
      operation_type: record.operation_type,
      description: record.description || "",
      location: record.location,
      personnel_deployed: record.personnel_deployed,
      fire_trucks_dispatched: record.fire_trucks_dispatched,
      casualties: record.casualties,
      property_damage_estimate: record.property_damage_estimate
    });
    setEditId(record.id);
    setActiveSubTab("add");
  };

  const deleteRecord = async (id) => {
    showConfirmModal(
      "Delete Operation",
      "Are you sure you want to delete this operation record? This action cannot be undone.",
      async () => {
        try {
          const { error } = await supabase.from("bfp_operations").delete().eq("id", id);
          if (error) throw error;
          fetchRecords();
          showSuccessModal("Deleted", "Operation record deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete record");
        }
      },
      "Delete"
    );
  };

  // Analytics - last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7DaysRecords = records.filter(r => new Date(r.operation_date) >= sevenDaysAgo);
  
  const fireIncidents = last7DaysRecords.filter(r => r.operation_type === "fire_incident").length;
  const inspections = last7DaysRecords.filter(r => r.operation_type === "fire_prevention_inspection").length;
  const seminars = last7DaysRecords.filter(r => r.operation_type === "fire_safety_seminar").length;
  const rescues = last7DaysRecords.filter(r => r.operation_type === "rescue_operation").length;
  const medicalAssists = last7DaysRecords.filter(r => r.operation_type === "medical_assist").length;
  const emergencies = last7DaysRecords.filter(r => r.operation_type === "emergency_response").length;
  const totalCasualties = last7DaysRecords.reduce((sum, r) => sum + (r.casualties || 0), 0);
  const totalTrucks = last7DaysRecords.reduce((sum, r) => sum + (r.fire_trucks_dispatched || 0), 0);

  // Group records by date
  const groupedByDate = records.reduce((acc, record) => {
    if (!acc[record.operation_date]) {
      acc[record.operation_date] = [];
    }
    acc[record.operation_date].push(record);
    return acc;
  }, {});

  const operationTypeLabels = {
    fire_incident: "Fire Incident",
    fire_prevention_inspection: "Fire Prevention Inspection",
    fire_safety_seminar: "Fire Safety Seminar",
    rescue_operation: "Rescue Operation",
    medical_assist: "Medical Assist",
    emergency_response: "Emergency Response"
  };

  const operationTypeBadge = (type) => {
    const colors = {
      fire_incident: { bg: "#fef2f2", color: "#991b1b" },
      fire_prevention_inspection: { bg: "#fff7ed", color: "#9a3412" },
      fire_safety_seminar: { bg: "#fef3c7", color: "#92400e" },
      rescue_operation: { bg: "#eff6ff", color: "#1e3a8a" },
      medical_assist: { bg: "#f0fdf4", color: "#14532d" },
      emergency_response: { bg: "#faf5ff", color: "#581c87" }
    };
    const style = colors[type] || { bg: "#f3f4f6", color: "#6b7280" };
    return (
      <span style={{
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 800,
        background: style.bg,
        color: style.color,
        textTransform: "uppercase"
      }}>
        {operationTypeLabels[type]}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Palayan City BFP Operations</h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>Track individual fire and emergency response operations</p>
      </div>

      {/* Analytics Cards - Last 7 Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        <div style={{ ...cardStyle, background: "#fef2f2", borderColor: "#fca5a5", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>Fire Incidents</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#7f1d1d" }}>{fireIncidents}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fff7ed", borderColor: "#fed7aa", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Inspections</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#7c2d12" }}>{inspections}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fef3c7", borderColor: "#fcd34d", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase" }}>Seminars</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#78350f" }}>{seminars}</p>
        </div>
        <div style={{ ...cardStyle, background: "#eff6ff", borderColor: "#93c5fd", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase" }}>Rescues</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#1e40af" }}>{rescues}</p>
        </div>
        <div style={{ ...cardStyle, background: "#f0fdf4", borderColor: "#86efac", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#14532d", textTransform: "uppercase" }}>Medical</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#166534" }}>{medicalAssists}</p>
        </div>
        <div style={{ ...cardStyle, background: "#faf5ff", borderColor: "#d8b4fe", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#581c87", textTransform: "uppercase" }}>Emergencies</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#6b21a8" }}>{emergencies}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fce7f3", borderColor: "#f9a8d4", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9f1239", textTransform: "uppercase" }}>Casualties</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#881337" }}>{totalCasualties}</p>
        </div>
        <div style={{ ...cardStyle, background: "#e0f2fe", borderColor: "#7dd3fc", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#0c4a6e", textTransform: "uppercase" }}>Trucks Dispatched</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#075985" }}>{totalTrucks}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 12, paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid ${S.border}` }}>
          <button onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }} style={{ ...btnPrimary, background: activeSubTab === "add" ? S.accent : "transparent", color: activeSubTab === "add" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
            <Plus size={14} /> Add Record
          </button>
          <button onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }} style={{ ...btnPrimary, background: activeSubTab === "view" ? S.accent : "transparent", color: activeSubTab === "view" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
            <FileText size={14} /> View Records
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} style={{ marginLeft: "auto", background: "none", border: `1px solid ${S.border}`, padding: "8px", borderRadius: 8, cursor: "pointer", color: S.text, display: "flex", alignItems: "center" }}>
            <ChevronDown size={16} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
              {activeSubTab === "add" && (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Operation Date</label>
                      <input type="date" value={formData.operation_date} onChange={e => setFormData({ ...formData, operation_date: e.target.value })} max={new Date().toISOString().split('T')[0]} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Operation Time</label>
                      <input type="time" value={formData.operation_time} onChange={e => setFormData({ ...formData, operation_time: e.target.value })} required style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Operation Type</label>
                      <select value={formData.operation_type} onChange={e => setFormData({ ...formData, operation_type: e.target.value })} required style={selectStyle}>
                        <option value="fire_incident">Fire Incident</option>
                        <option value="fire_prevention_inspection">Fire Prevention Inspection</option>
                        <option value="fire_safety_seminar">Fire Safety Seminar</option>
                        <option value="rescue_operation">Rescue Operation</option>
                        <option value="medical_assist">Medical Assist</option>
                        <option value="emergency_response">Emergency Response</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Location</label>
                      <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required placeholder="e.g., Brgy. Atate" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the operation..." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Personnel Deployed</label>
                      <input type="number" min="0" value={formData.personnel_deployed} onChange={e => setFormData({ ...formData, personnel_deployed: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Fire Trucks Dispatched</label>
                      <input type="number" min="0" value={formData.fire_trucks_dispatched} onChange={e => setFormData({ ...formData, fire_trucks_dispatched: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Casualties</label>
                      <input type="number" min="0" value={formData.casualties} onChange={e => setFormData({ ...formData, casualties: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>₱ Property Damage Estimate</label>
                      <input type="number" min="0" step="0.01" value={formData.property_damage_estimate} onChange={e => setFormData({ ...formData, property_damage_estimate: e.target.value })} required style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${S.border}` }}>
                    {editId && (
                      <button type="button" onClick={() => { setEditId(null); setFormData({ operation_date: new Date().toISOString().split('T')[0], operation_time: "", operation_type: "fire_incident", description: "", location: "", personnel_deployed: 0, fire_trucks_dispatched: 0, casualties: 0, property_damage_estimate: 0 }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: "#fff", color: S.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" style={btnPrimary}>
                      <Check size={16} /> {editId ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {activeSubTab === "view" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loading ? (
                    <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading records...</p>
                  ) : Object.keys(groupedByDate).length === 0 ? (
                    <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>No operation records found. Add your first operation above.</p>
                  ) : (
                    Object.keys(groupedByDate).map(date => {
                      const dayRecords = groupedByDate[date];
                      const isExpanded = expandedDays[date];
                      return (
                        <div key={date} style={{ border: `1px solid ${S.border}`, borderRadius: 12, overflow: "hidden" }}>
                          <button onClick={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))} style={{ width: "100%", padding: 16, border: "none", background: S.accentBg, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 800, color: S.text }}>
                            <span>📅 {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {dayRecords.length} operation{dayRecords.length > 1 ? 's' : ''}</span>
                            <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden", background: "#fff" }}>
                                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                  {dayRecords.map(record => (
                                    <div key={record.id} style={{ padding: 12, border: `1px solid ${S.border}`, borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                                          <span style={{ fontSize: 13, fontWeight: 800, color: S.text }}>{record.operation_time || "N/A"}</span>
                                          {operationTypeBadge(record.operation_type)}
                                          <span style={{ fontSize: 12, color: S.muted }}>📍 {record.location}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <button onClick={() => editRecord(record)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${S.border}`, background: "#fff", color: S.text, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                            <Edit2 size={12} /> Edit
                                          </button>
                                          <button onClick={() => deleteRecord(record.id)} style={{ ...btnDanger, fontSize: 11, padding: "4px 8px" }}>
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      {record.description && (
                                        <p style={{ margin: 0, fontSize: 12, color: S.text, lineHeight: 1.5 }}>{record.description}</p>
                                      )}
                                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: S.muted }}>
                                        <span>👷 {record.personnel_deployed} personnel</span>
                                        <span>🚒 {record.fire_trucks_dispatched} trucks</span>
                                        {record.casualties > 0 && <span style={{ color: "#dc2626", fontWeight: 700 }}>⚠️ {record.casualties} casualties</span>}
                                        {record.property_damage_estimate > 0 && <span>💰 ₱{record.property_damage_estimate.toLocaleString()}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Agricultural Damages Tab ── */
function AgricultureDamagesTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("view");
  const [isExpanded, setIsExpanded] = useState(true);
  const [editId, setEditId] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [formData, setFormData] = useState({
    category: "farm", // farm or livestock
    report_date: new Date().toISOString().split('T')[0],
    report_time: "",
    farmer_name: "",
    barangay: "",
    crop_type: "rice",
    area_affected_hectares: 0,
    damage_percentage: 0,
    estimated_loss_value: 0,
    cause: "drought",
    description: "",
    assistance_needed: "",
    status: "pending",
    assessed_by: ""
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("agriculture_damage_reports")
        .select("*")
        .order("report_date", { ascending: false })
        .order("report_time", { ascending: false });
      setRecords(data || []);
      
      // Auto-expand first day only
      if (data && data.length > 0) {
        const firstDate = data[0].report_date;
        setExpandedDays({ [firstDate]: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const selectedDate = new Date(formData.report_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        showErrorModal("Invalid Date", "Cannot add records for future dates. Please select today or a past date.");
        return;
      }

      // Validate damage percentage
      const damagePercent = parseInt(formData.damage_percentage);
      if (damagePercent < 0 || damagePercent > 100) {
        showErrorModal("Invalid Damage Percentage", "Damage percentage must be between 0 and 100.");
        return;
      }

      const payload = {
        category: formData.category,
        report_date: formData.report_date,
        report_time: formData.report_time,
        farmer_name: formData.farmer_name,
        barangay: formData.barangay,
        crop_type: formData.crop_type,
        area_affected_hectares: parseFloat(formData.area_affected_hectares) || 0,
        damage_percentage: damagePercent,
        estimated_loss_value: parseFloat(formData.estimated_loss_value) || 0,
        cause: formData.cause,
        description: formData.description || null,
        assistance_needed: formData.assistance_needed || null,
        status: formData.status,
        assessed_by: formData.assessed_by || null
      };

      if (editId) {
        const { error } = await supabase.from("agriculture_damage_reports").update(payload).eq("id", editId);
        if (error) throw error;
        showSuccessModal("Record Updated", "Agricultural damage report updated successfully");
      } else {
        const { error } = await supabase.from("agriculture_damage_reports").insert(payload);
        if (error) throw error;
        showSuccessModal("Record Added", "Agricultural damage report added successfully");
      }
      
      setEditId(null);
      setFormData({
        category: "farm",
        report_date: new Date().toISOString().split('T')[0],
        report_time: "",
        farmer_name: "",
        barangay: "",
        crop_type: "rice",
        area_affected_hectares: 0,
        damage_percentage: 0,
        estimated_loss_value: 0,
        cause: "drought",
        description: "",
        assistance_needed: "",
        status: "pending",
        assessed_by: ""
      });
      fetchRecords();
      setActiveSubTab("view");
    } catch (error) {
      showErrorModal("Error", error.message || "Failed to save record");
    }
  };

  const editRecord = (record) => {
    setFormData({
      category: record.category || "farm",
      report_date: record.report_date,
      report_time: record.report_time || "",
      farmer_name: record.farmer_name,
      barangay: record.barangay,
      crop_type: record.crop_type,
      area_affected_hectares: record.area_affected_hectares,
      damage_percentage: record.damage_percentage,
      estimated_loss_value: record.estimated_loss_value,
      cause: record.cause || "drought",
      description: record.description || "",
      assistance_needed: record.assistance_needed || "",
      status: record.status,
      assessed_by: record.assessed_by || ""
    });
    setEditId(record.id);
    setActiveSubTab("add");
  };

  const deleteRecord = async (id) => {
    showConfirmModal(
      "Delete Report",
      "Are you sure you want to delete this agricultural damage report? This action cannot be undone.",
      async () => {
        try {
          const { error } = await supabase.from("agriculture_damage_reports").delete().eq("id", id);
          if (error) throw error;
          fetchRecords();
          showSuccessModal("Deleted", "Agricultural damage report deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete record");
        }
      },
      "Delete"
    );
  };

  // Analytics - last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30DaysRecords = records.filter(r => new Date(r.report_date) >= thirtyDaysAgo);
  
  const totalReports = last30DaysRecords.length;
  const totalHectares = last30DaysRecords.reduce((sum, r) => sum + (parseFloat(r.area_affected_hectares) || 0), 0);
  const totalLoss = last30DaysRecords.reduce((sum, r) => sum + (parseFloat(r.estimated_loss_value) || 0), 0);
  const avgDamagePercent = totalReports > 0 
    ? Math.round(last30DaysRecords.reduce((sum, r) => sum + (r.damage_percentage || 0), 0) / totalReports)
    : 0;
  
  // Most affected crop
  const cropCounts = last30DaysRecords.reduce((acc, r) => {
    acc[r.crop_type] = (acc[r.crop_type] || 0) + 1;
    return acc;
  }, {});
  const mostAffectedCrop = Object.keys(cropCounts).length > 0
    ? Object.keys(cropCounts).reduce((a, b) => cropCounts[a] > cropCounts[b] ? a : b)
    : "N/A";
  
  const pendingAssessments = last30DaysRecords.filter(r => r.status === "pending").length;

  // Group records by date
  const groupedByDate = records.reduce((acc, record) => {
    if (!acc[record.report_date]) {
      acc[record.report_date] = [];
    }
    acc[record.report_date].push(record);
    return acc;
  }, {});

  const cropTypeLabels = {
    rice: "Rice",
    corn: "Corn",
    vegetables: "Vegetables",
    fruits: "Fruits",
    livestock: "Livestock",
    fishery: "Fishery",
    other: "Other"
  };

  const causeLabels = {
    drought: "Drought",
    pest_infestation: "Pest Infestation",
    crop_failure: "Crop Failure",
    water_shortage: "Water Shortage",
    heat_stress: "Heat Stress",
    other: "Other"
  };

  const statusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#92400e" },
      assessed: { bg: "#dbeafe", color: "#1e40af" },
      assistance_provided: { bg: "#f0fdf4", color: "#14532d" }
    };
    const style = colors[status] || { bg: "#f3f4f6", color: "#6b7280" };
    const statusLabels = {
      pending: "Pending",
      assessed: "Assessed",
      assistance_provided: "Assistance Provided"
    };
    return (
      <span style={{
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 800,
        background: style.bg,
        color: style.color,
        textTransform: "uppercase"
      }}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const barangays = [
    "Atate", "Bagong Buhay I", "Bagong Buhay II", "Bagong Buhay III", "Bundagul",
    "Caalibangbangan", "Caanawan", "Calibutbut", "Camanacsacan", "Cuyapo",
    "Gabaldon Road", "Imelda", "Langka", "Lawang Bato", "Maligaya",
    "Mangino", "Mataas na Parang", "Maunlad", "Pinagpanaan", "Poblacion East",
    "Poblacion West", "Putlod", "Santo Niño", "Signal Village", "Singalat",
    "Sta. Cruz", "Sto. Tomas", "Tabuating", "Tagumpay", "Talipapa"
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Palayan City Agricultural Damage Reports</h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>Track agricultural damages and crop losses from Super El Niño</p>
      </div>

      {/* Analytics Cards - Last 30 Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div style={{ ...cardStyle, background: "#f0fdf4", borderColor: "#86efac", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#14532d", textTransform: "uppercase" }}>Total Reports</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#166534" }}>{totalReports}</p>
        </div>
        <div style={{ ...cardStyle, background: "#f0fdf4", borderColor: "#86efac", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#14532d", textTransform: "uppercase" }}>Total Hectares</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#166534" }}>{totalHectares.toFixed(2)}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fef3c7", borderColor: "#fcd34d", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase" }}>Total Loss (PHP)</p>
          <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#78350f" }}>₱{totalLoss.toLocaleString()}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fff7ed", borderColor: "#fed7aa", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Avg Damage %</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#7c2d12" }}>{avgDamagePercent}%</p>
        </div>
        <div style={{ ...cardStyle, background: "#fef3c7", borderColor: "#fcd34d", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#92400e", textTransform: "uppercase" }}>Most Affected</p>
          <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 900, color: "#78350f" }}>{cropTypeLabels[mostAffectedCrop] || mostAffectedCrop}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fef2f2", borderColor: "#fca5a5", padding: 16 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>Pending</p>
          <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900, color: "#7f1d1d" }}>{pendingAssessments}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 12, paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid ${S.border}` }}>
          <button onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }} style={{ ...btnPrimary, background: activeSubTab === "add" ? S.accent : "transparent", color: activeSubTab === "add" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
            <Plus size={14} /> Add Record
          </button>
          <button onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }} style={{ ...btnPrimary, background: activeSubTab === "view" ? S.accent : "transparent", color: activeSubTab === "view" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
            <FileText size={14} /> View Records
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} style={{ marginLeft: "auto", background: "none", border: `1px solid ${S.border}`, padding: "8px", borderRadius: 8, cursor: "pointer", color: S.text, display: "flex", alignItems: "center" }}>
            <ChevronDown size={16} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}>
              {activeSubTab === "add" && (
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 13, fontWeight: 900, color: S.text, display: "block", marginBottom: 8 }}>Category *</label>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, category: "farm", crop_type: "rice" })}
                          style={{
                            flex: 1,
                            padding: "16px 24px",
                            borderRadius: 12,
                            border: formData.category === "farm" ? `2px solid ${S.accent}` : `2px solid ${S.border}`,
                            background: formData.category === "farm" ? S.accentBg : "#fff",
                            color: formData.category === "farm" ? S.accent : S.text,
                            fontWeight: 800,
                            fontSize: 14,
                            cursor: "pointer",
                            fontFamily: S.font,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.2s"
                          }}
                        >
                          <span style={{ fontSize: 28 }}>🌾</span>
                          <span>Farm</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: S.muted }}>Crops & Plants</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, category: "livestock", crop_type: "livestock" })}
                          style={{
                            flex: 1,
                            padding: "16px 24px",
                            borderRadius: 12,
                            border: formData.category === "livestock" ? `2px solid ${S.accent}` : `2px solid ${S.border}`,
                            background: formData.category === "livestock" ? S.accentBg : "#fff",
                            color: formData.category === "livestock" ? S.accent : S.text,
                            fontWeight: 800,
                            fontSize: 14,
                            cursor: "pointer",
                            fontFamily: S.font,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.2s"
                          }}
                        >
                          <span style={{ fontSize: 28 }}>🐄</span>
                          <span>Livestock</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: S.muted }}>Animals & Poultry</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Report Date</label>
                      <input type="date" value={formData.report_date} onChange={e => setFormData({ ...formData, report_date: e.target.value })} max={new Date().toISOString().split('T')[0]} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Report Time</label>
                      <input type="time" value={formData.report_time} onChange={e => setFormData({ ...formData, report_time: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Farmer Name</label>
                      <input type="text" value={formData.farmer_name} onChange={e => setFormData({ ...formData, farmer_name: e.target.value })} required placeholder="Name of farmer" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Barangay</label>
                      <select value={formData.barangay} onChange={e => setFormData({ ...formData, barangay: e.target.value })} required style={selectStyle}>
                        <option value="">Select Barangay</option>
                        {barangays.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Crop Type</label>
                      <select value={formData.crop_type} onChange={e => setFormData({ ...formData, crop_type: e.target.value })} required style={selectStyle}>
                        <option value="rice">Rice</option>
                        <option value="corn">Corn</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="livestock">Livestock</option>
                        <option value="fishery">Fishery</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Area Affected (hectares)</label>
                      <input type="number" min="0" step="0.01" value={formData.area_affected_hectares} onChange={e => setFormData({ ...formData, area_affected_hectares: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Damage Percentage (0-100%)</label>
                      <input type="number" min="0" max="100" value={formData.damage_percentage} onChange={e => setFormData({ ...formData, damage_percentage: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>₱ Estimated Loss Value</label>
                      <input type="number" min="0" step="0.01" value={formData.estimated_loss_value} onChange={e => setFormData({ ...formData, estimated_loss_value: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Cause</label>
                      <select value={formData.cause} onChange={e => setFormData({ ...formData, cause: e.target.value })} required style={selectStyle}>
                        <option value="drought">Drought</option>
                        <option value="pest_infestation">Pest Infestation</option>
                        <option value="crop_failure">Crop Failure</option>
                        <option value="water_shortage">Water Shortage</option>
                        <option value="heat_stress">Heat Stress</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Assistance Needed</label>
                      <select value={formData.assistance_needed} onChange={e => setFormData({ ...formData, assistance_needed: e.target.value })} style={selectStyle}>
                        <option value="">Select assistance type</option>
                        <option value="seeds">Seeds</option>
                        <option value="fertilizer">Fertilizer</option>
                        <option value="irrigation">Irrigation</option>
                        <option value="financial">Financial</option>
                        <option value="equipment">Equipment</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Details of agricultural damage..." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Status</label>
                      <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} required style={selectStyle}>
                        <option value="pending">Pending</option>
                        <option value="assessed">Assessed</option>
                        <option value="assistance_provided">Assistance Provided</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Assessed By</label>
                      <input type="text" value={formData.assessed_by} onChange={e => setFormData({ ...formData, assessed_by: e.target.value })} placeholder="Name of assessor" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${S.border}` }}>
                    {editId && (
                      <button type="button" onClick={() => { setEditId(null); setFormData({ category: "farm", report_date: new Date().toISOString().split('T')[0], report_time: "", farmer_name: "", barangay: "", crop_type: "rice", area_affected_hectares: 0, damage_percentage: 0, estimated_loss_value: 0, cause: "drought", description: "", assistance_needed: "", status: "pending", assessed_by: "" }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: "#fff", color: S.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" style={btnPrimary}>
                      <Check size={16} /> {editId ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              )}

              {activeSubTab === "view" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loading ? (
                    <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading records...</p>
                  ) : Object.keys(groupedByDate).length === 0 ? (
                    <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>No agricultural damage reports found. Add your first report above.</p>
                  ) : (
                    Object.keys(groupedByDate).map(date => {
                      const dayRecords = groupedByDate[date];
                      const isExpanded = expandedDays[date];
                      const dayTotalLoss = dayRecords.reduce((sum, r) => sum + (parseFloat(r.estimated_loss_value) || 0), 0);
                      return (
                        <div key={date} style={{ border: `1px solid ${S.border}`, borderRadius: 12, overflow: "hidden" }}>
                          <button onClick={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))} style={{ width: "100%", padding: 16, border: "none", background: S.accentBg, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 800, color: S.text }}>
                            <span>📅 {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {dayRecords.length} report{dayRecords.length > 1 ? 's' : ''} · ₱{dayTotalLoss.toLocaleString()}</span>
                            <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden", background: "#fff" }}>
                                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                  {dayRecords.map(record => (
                                    <div key={record.id} style={{ padding: 12, border: `1px solid ${S.border}`, borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                                          {record.report_time && <span style={{ fontSize: 13, fontWeight: 800, color: S.text }}>{record.report_time}</span>}
                                          <span style={{ fontSize: 13, fontWeight: 800, color: S.text }}>{record.farmer_name}</span>
                                          <span style={{ fontSize: 12, color: S.muted }}>📍 {record.barangay}</span>
                                          <span style={{ fontSize: 11, color: S.muted, background: "#f0fdf4", padding: "2px 8px", borderRadius: 4 }}>{cropTypeLabels[record.crop_type]}</span>
                                          {statusBadge(record.status)}
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <button onClick={() => editRecord(record)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${S.border}`, background: "#fff", color: S.text, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                            <Edit2 size={12} /> Edit
                                          </button>
                                          <button onClick={() => deleteRecord(record.id)} style={{ ...btnDanger, fontSize: 11, padding: "4px 8px" }}>
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      {record.description && (
                                        <p style={{ margin: 0, fontSize: 12, color: S.text, lineHeight: 1.5 }}>{record.description}</p>
                                      )}
                                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: S.muted }}>
                                        <span>🌾 {parseFloat(record.area_affected_hectares).toFixed(2)} ha</span>
                                        <span style={{ color: "#dc2626", fontWeight: 700 }}>📉 {record.damage_percentage}% damage</span>
                                        <span>💰 ₱{parseFloat(record.estimated_loss_value).toLocaleString()}</span>
                                        <span>⚠️ {causeLabels[record.cause]}</span>
                                        {record.assistance_needed && <span>🤝 {record.assistance_needed}</span>}
                                        {record.assessed_by && <span>✓ Assessed by {record.assessed_by}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Water Utility Tab (Phase 8) ── */
function WaterUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: "", facility_type: "Pumping Station", location: "", status: "Operational" });

  useEffect(() => {
    fetchFacilities();
  }, [adminDepartment, isSuperadmin]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      let query = supabase.from("water_facilities").select("*").order("name");
      const { data } = await query;
      setFacilities(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      facility_type: formData.facility_type,
      location: formData.location,
      status: formData.status,
      last_updated: new Date().toISOString()
    };

    if (editId) {
      await supabase.from("water_facilities").update(payload).eq("id", editId);
    } else {
      if (adminDepartment?.id) payload.department_id = adminDepartment.id;
      await supabase.from("water_facilities").insert(payload);
    }
    
    setShowForm(false);
    setEditId(null);
    fetchFacilities();
  };

  const editFacility = (f) => {
    setFormData({ name: f.name, facility_type: f.facility_type, location: f.location, status: f.status });
    setEditId(f.id);
    setShowForm(true);
  };

  const deleteFacility = async (id) => {
    showConfirmModal(
      "Delete Water Facility",
      "Are you sure you want to delete this water facility? This action cannot be undone.",
      async () => {
        try {
          await supabase.from("water_facilities").delete().eq("id", id);
          await fetchFacilities();
          showSuccessModal("Deleted", "Water facility deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete water facility");
        }
      },
      "Delete"
    );
  };

  const operationalCount = facilities.filter(f => f.status === "Operational").length;
  const maintenanceCount = facilities.filter(f => f.status === "Maintenance" || f.status === "Offline").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, background: "#f0f9ff", borderColor: "#bae6fd" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#0284c7", textTransform: "uppercase" }}>Total Facilities</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#075985" }}>{facilities.length}</p>
        </div>
        <div style={{ ...cardStyle, background: "#ecfdf5", borderColor: "#6ee7b7" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>Operational</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#065f46" }}>{operationalCount}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fff7ed", borderColor: "#fed7aa" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>Maintenance / Offline</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#9a3412" }}>{maintenanceCount}</p>
        </div>
      </div>

      {showForm ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{editId ? "Update Facility" : "Add Water Facility"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Facility Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Facility Type</label>
                <CustomSelect
                  value={formData.facility_type}
                  onChange={v => setFormData({...formData, facility_type: v})}
                  options={[{value: "Pumping Station", label: "Pumping Station"}, {value: "Reservoir", label: "Reservoir"}, {value: "Treatment Plant", label: "Treatment Plant"}]}
                  accent={S.accent}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Status</label>
                <CustomSelect
                  value={formData.status}
                  onChange={v => setFormData({...formData, status: v})}
                  options={[{value: "Operational", label: "Operational"}, {value: "Maintenance", label: "Maintenance"}, {value: "Offline", label: "Offline"}]}
                  accent={S.accent}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Location</label>
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button type="submit" style={btnPrimary}><Check size={16} /> Save</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Water Facilities</h3>
              <p style={{ margin: 0, fontSize: 13, color: S.muted }}>Manage pumping stations and track operational status.</p>
            </div>
            <button onClick={() => { setFormData({ name: "", facility_type: "Pumping Station", location: "", status: "Operational" }); setShowForm(true); }} style={btnPrimary}>
              <Plus size={16} /> Add Facility
            </button>
          </div>
          
          {loading ? <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {facilities.map(f => {
                return (
                  <div key={f.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: "#fafcf9", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#18181b", display: "flex", alignItems: "center", gap: 6 }}>
                          <Droplet size={16} color="#0284c7" /> {f.name}
                        </h4>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted, fontWeight: 600 }}><MapPin size={12} /> {f.location}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: f.status === "Operational" ? "#ecfdf5" : "#fff7ed", color: f.status === "Operational" ? "#10b981" : "#ea580c" }}>
                          {f.status}
                        </span>
                        <button onClick={() => editFacility(f)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: S.text }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteFacility(f.id)} style={btnDanger}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {facilities.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No water facilities found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Power Utility Tab (Phase 9) ── */
function PowerUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [feeders, setFeeders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: "", substation: "", location: "", status: "Energized" });

  useEffect(() => {
    fetchFeeders();
  }, [adminDepartment, isSuperadmin]);

  const fetchFeeders = async () => {
    setLoading(true);
    try {
      let query = supabase.from("power_feeders").select("*").order("name");
      const { data } = await query;
      setFeeders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      substation: formData.substation,
      status: formData.status,
      last_updated: new Date().toISOString()
    };

    if (editId) {
      await supabase.from("power_feeders").update(payload).eq("id", editId);
    } else {
      if (adminDepartment?.id) payload.department_id = adminDepartment.id;
      await supabase.from("power_feeders").insert(payload);
    }
    
    setShowForm(false);
    setEditId(null);
    fetchFeeders();
  };

  const editFeeder = (f) => {
    setFormData({ name: f.name, substation: f.substation, status: f.status });
    setEditId(f.id);
    setShowForm(true);
  };

  const deleteFeeder = async (id) => {
    showConfirmModal(
      "Delete Power Feeder",
      "Are you sure you want to delete this power feeder? This action cannot be undone.",
      async () => {
        try {
          await supabase.from("power_feeders").delete().eq("id", id);
          await fetchFeeders();
          showSuccessModal("Deleted", "Power feeder deleted successfully");
        } catch (error) {
          showErrorModal("Error", "Failed to delete power feeder");
        }
      },
      "Delete"
    );
  };

  const energizedCount = feeders.filter(f => f.status === "Energized").length;
  const deenergizedCount = feeders.filter(f => f.status === "De-energized" || f.status === "Tripped/Fault").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, background: "#fefce8", borderColor: "#fef08a" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#a16207", textTransform: "uppercase" }}>Total Feeders</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#854d0e" }}>{feeders.length}</p>
        </div>
        <div style={{ ...cardStyle, background: "#ecfdf5", borderColor: "#6ee7b7" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>Energized</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#065f46" }}>{energizedCount}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fef2f2", borderColor: "#fca5a5" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#dc2626", textTransform: "uppercase" }}>De-energized / Tripped</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#991b1b" }}>{deenergizedCount}</p>
        </div>
      </div>

      {showForm ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{editId ? "Update Feeder" : "Add Power Feeder"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Feeder Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Substation</label>
                <input value={formData.substation} onChange={e => setFormData({...formData, substation: e.target.value})} required style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Status</label>
                <CustomSelect
                  value={formData.status}
                  onChange={v => setFormData({...formData, status: v})}
                  options={[{value: "Energized", label: "Energized"}, {value: "De-energized", label: "De-energized"}, {value: "Tripped/Fault", label: "Tripped/Fault"}]}
                  accent={S.accent}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button type="submit" style={btnPrimary}><Check size={16} /> Save</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Power Feeders</h3>
              <p style={{ margin: 0, fontSize: 13, color: S.muted }}>Manage power lines and track energization status.</p>
            </div>
            <button onClick={() => { setFormData({ name: "", substation: "", status: "Energized" }); setShowForm(true); }} style={btnPrimary}>
              <Plus size={16} /> Add Feeder
            </button>
          </div>
          
          {loading ? <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {feeders.map(f => {
                return (
                  <div key={f.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: "#fafcf9", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#18181b", display: "flex", alignItems: "center", gap: 6 }}>
                          <Zap size={16} color="#eab308" /> {f.name}
                        </h4>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted, fontWeight: 600 }}>{f.substation}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: f.status === "Energized" ? "#ecfdf5" : "#fef2f2", color: f.status === "Energized" ? "#10b981" : "#ef4444" }}>
                          {f.status}
                        </span>
                        <button onClick={() => editFeeder(f)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: S.text }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteFeeder(f.id)} style={btnDanger}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {feeders.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No power feeders found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
