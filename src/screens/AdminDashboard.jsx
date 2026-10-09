import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  BarChart3, FileText, Users, LogOut, Map as MapIcon, RefreshCw,
  Plus, Trash2, Building, CheckCircle, Clock, TrendingUp, Search, X, Edit2, Check, Download,
  MapPin, Calendar, Phone, AlertCircle, ChevronRight, ChevronDown, Navigation,
  ShieldAlert, Activity, Megaphone, HeartPulse, Tent, Truck, Flame, Droplet, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/ui/CustomSelect";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const mainRef = useRef(null);

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
            <HospitalsTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} isSuperadmin={isSuperadmin} adminDepartment={adminDepartment} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "operations" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <OperationsTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} isSuperadmin={isSuperadmin} adminDepartment={adminDepartment} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "bfp" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <BfpOperationsTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} isSuperadmin={isSuperadmin} adminDepartment={adminDepartment} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "water" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <WaterUtilityTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} isSuperadmin={isSuperadmin} adminDepartment={adminDepartment} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "power" ? "active" : "inactive"}
            style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
          >
            <PowerUtilityTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} isSuperadmin={isSuperadmin} adminDepartment={adminDepartment} />
          </motion.div>

          {isSuperadmin && (
            <>
              <motion.div
                variants={tabVariants}
                initial="inactive"
                animate={activeTab === "users" ? "active" : "inactive"}
                style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
              >
                <UsersTab categories={categories} departments={departments} S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} />
              </motion.div>

              <motion.div
                variants={tabVariants}
                initial="inactive"
                animate={activeTab === "settings" ? "active" : "inactive"}
                style={{ width: "100%", padding: 32, boxSizing: "border-box" }}
              >
                <SettingsTab departments={departments} categories={categories} onUpdate={() => fetchData(true)} S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} btnPrimary={btnPrimary} btnDanger={btnDanger} />
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
    </div>
  );
}

/* ── Overview ── */
function OverviewTab({ reports, S, cardStyle, onViewReport }) {
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    inprogress: reports.filter(r => r.status === "inprogress").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };
  const cards = [
    { label: "Total Reports", val: stats.total, icon: <FileText size={22} />, color: S.accent, bg: "rgba(55,61,32,0.06)" },
    { label: "Pending", val: stats.pending, icon: <Clock size={22} />, color: S.red, bg: S.redBg },
    { label: "In Progress", val: stats.inprogress, icon: <TrendingUp size={22} />, color: S.blue, bg: S.blueBg },
    { label: "Resolved", val: stats.resolved, icon: <CheckCircle size={22} />, color: S.green, bg: S.greenBg },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.val}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 900 }}>Recent Reports</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reports.slice(0, 8).map(r => <ReportRow key={r.id} report={r} S={S} onClick={() => onViewReport(r)} />)}
          {reports.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>No reports found.</p>}
        </div>
      </div>
    </div>
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
  );
}

/* ── Users Tab ── */
function UsersTab({ categories, departments, S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger }) {
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

  const revoke = async (id) => { if (!confirm("Revoke admin access?")) return; await supabase.rpc("set_user_role", { target_user_id: id, new_role: null }); fetchUsers(); };
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
function SettingsTab({ departments, categories, onUpdate, S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger }) {
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

  const delDept = async (id) => { if (!confirm("Delete this office?")) return; await supabase.from("departments").delete().eq("id", id); onUpdate(); };
  const delCat = async (id) => { if (!confirm("Delete category?")) return; await supabase.from("categories").delete().eq("id", id); onUpdate(); };

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

/* ── Advisories Tab (Phase 3) ── */
function AdvisoriesTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment }) {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAdvisory, setNewAdvisory] = useState({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" });
  const [submitting, setSubmitting] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAdvisory.title || !newAdvisory.content) return;
    setSubmitting(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        title: newAdvisory.title,
        content: newAdvisory.content,
        category: newAdvisory.category,
        status: isSuperadmin ? "Published" : "Pending", // Superadmins auto-publish, others pending approval
        author_id: userData?.user?.id,
      };

      if (!isSuperadmin && adminDepartment?.id) {
        insertData.department_id = adminDepartment.id;
      }
      if (isSuperadmin) insertData.published_at = new Date().toISOString();
      if (newAdvisory.scheduled_for) insertData.scheduled_for = new Date(newAdvisory.scheduled_for).toISOString();

      const { data, error } = await supabase.from("advisories").insert(insertData);
      
      if (error) {
        console.error("Insert error:", error);
        alert(`Failed to submit advisory: ${error.message}`);
        return;
      }
      
      console.log("Advisory submitted successfully:", data);
      
      setNewAdvisory({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" });
      setShowForm(false);
      
      // Set filter to show pending items if admin submitted for approval
      if (!isSuperadmin) {
        setFilterStatus("Pending");
      }
      
      fetchAdvisories();
      
      // Show success message
      alert(isSuperadmin ? "Advisory published successfully!" : "Advisory submitted for approval!");
    } catch (err) {
      console.error("Submit error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    const payload = { status };
    if (status === "Published") {
      const { data: userData } = await supabase.auth.getUser();
      payload.approved_by = userData?.user?.id;
      payload.published_at = new Date().toISOString();
    }
    await supabase.from("advisories").update(payload).eq("id", id);
    fetchAdvisories();
  };

  const deleteAdvisory = async (id) => {
    if (confirm("Are you sure you want to delete this advisory?")) {
      await supabase.from("advisories").delete().eq("id", id);
      fetchAdvisories();
    }
  };

  const filteredAdvisories = advisories.filter(a => filterStatus === "All" || a.status === filterStatus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showForm ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Create Advisory</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
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
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: S.font }}>Cancel</button>
              <button type="submit" disabled={submitting} style={btnPrimary}>
                <Check size={16} /> {submitting ? "Submitting..." : (isSuperadmin ? "Publish Now" : "Submit for Approval")}
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
                const author = usersMap[adv.author_id] || "Unknown User";
                
                return (
                  <div key={adv.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: "#fafcf9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 20, background: S.accentBg, color: S.accent, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{adv.category}</span>
                          {adv.departments?.name && <span style={{ fontSize: 10, color: S.muted, fontWeight: 700 }}>• {adv.departments.name}</span>}
                          {adv.scheduled_for && <span style={{ fontSize: 10, color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> Scheduled: {new Date(adv.scheduled_for).toLocaleString()}</span>}
                        </div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#18181b" }}>{adv.title}</h4>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, 
                          background: isPublished ? "#ecfdf5" : isPending ? "#fffbeb" : "#f4f4f5", 
                          color: isPublished ? "#10b981" : isPending ? "#d97706" : "#71717a" }}>
                          {adv.status}
                        </span>
                        
                        {(isSuperadmin || isPending) && (
                          <CustomSelect
                            value={adv.status}
                            onChange={(s) => updateStatus(adv.id, s)}
                            options={[{value: "Pending", label: "Pending"}, {value: "Published", label: "Publish"}, {value: "Archived", label: "Archive"}]}
                            compact accent={S.accent} style={{ minWidth: 110 }}
                          />
                        )}
                        <button onClick={() => deleteAdvisory(adv.id)} style={btnDanger}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#3f3f46", lineHeight: 1.5 }}>{adv.content}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: S.muted, fontWeight: 600 }}>
                      <span>Author: {author}</span>
                      <span>Created: {new Date(adv.created_at).toLocaleString()}</span>
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

/* ── Hospitals Tab (Phase 5) ── */
function HospitalsTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", total_beds: 0, available_beds: 0, heat_stroke_cases: 0, heat_exhaustion_cases: 0, dehydration_cases: 0 });

  useEffect(() => {
    fetchHospitals();
  }, [adminDepartment, isSuperadmin]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      let query = supabase.from("hospitals").select("*").order("name");
      const { data } = await query;
      setHospitals(data || []);
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
      location: formData.location,
      total_beds: parseInt(formData.total_beds) || 0,
      available_beds: parseInt(formData.available_beds) || 0,
      heat_stroke_cases: parseInt(formData.heat_stroke_cases) || 0,
      heat_exhaustion_cases: parseInt(formData.heat_exhaustion_cases) || 0,
      dehydration_cases: parseInt(formData.dehydration_cases) || 0,
      last_updated: new Date().toISOString()
    };

    if (editId) {
      await supabase.from("hospitals").update(payload).eq("id", editId);
    } else {
      if (adminDepartment?.id) payload.department_id = adminDepartment.id;
      await supabase.from("hospitals").insert(payload);
    }
    
    setShowForm(false);
    setEditId(null);
    fetchHospitals();
  };

  const editHospital = (h) => {
    setFormData({ name: h.name, location: h.location || "", total_beds: h.total_beds, available_beds: h.available_beds, heat_stroke_cases: h.heat_stroke_cases, heat_exhaustion_cases: h.heat_exhaustion_cases, dehydration_cases: h.dehydration_cases });
    setEditId(h.id);
    setShowForm(true);
  };

  const deleteHospital = async (id) => {
    if (confirm("Delete this hospital record?")) {
      await supabase.from("hospitals").delete().eq("id", id);
      fetchHospitals();
    }
  };

  const totalHeatStroke = hospitals.reduce((sum, h) => sum + (h.heat_stroke_cases || 0), 0);
  const totalExhaustion = hospitals.reduce((sum, h) => sum + (h.heat_exhaustion_cases || 0), 0);
  const totalDehydration = hospitals.reduce((sum, h) => sum + (h.dehydration_cases || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, background: "#fff1f2", borderColor: "#fecdd3" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e11d48", textTransform: "uppercase" }}>Heat Stroke</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#9f1239" }}>{totalHeatStroke}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fff7ed", borderColor: "#fed7aa" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>Heat Exhaustion</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#9a3412" }}>{totalExhaustion}</p>
        </div>
        <div style={{ ...cardStyle, background: "#f0f9ff", borderColor: "#bae6fd" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#0284c7", textTransform: "uppercase" }}>Dehydration</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#075985" }}>{totalDehydration}</p>
        </div>
      </div>

      {showForm ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{editId ? "Update Hospital" : "Add Hospital"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Hospital Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Location</label>
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Total Beds</label>
                <input type="number" min="0" value={formData.total_beds} onChange={e => setFormData({...formData, total_beds: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Available Beds</label>
                <input type="number" min="0" value={formData.available_beds} onChange={e => setFormData({...formData, available_beds: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Heat Stroke Cases</label>
                <input type="number" min="0" value={formData.heat_stroke_cases} onChange={e => setFormData({...formData, heat_stroke_cases: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Heat Exhaustion Cases</label>
                <input type="number" min="0" value={formData.heat_exhaustion_cases} onChange={e => setFormData({...formData, heat_exhaustion_cases: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Dehydration Cases</label>
                <input type="number" min="0" value={formData.dehydration_cases} onChange={e => setFormData({...formData, dehydration_cases: e.target.value})} style={inputStyle} />
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Hospitals & Capacity</h3>
              <p style={{ margin: 0, fontSize: 13, color: S.muted }}>Manage hospital availability and track health analytics.</p>
            </div>
            <button onClick={() => { setFormData({ name: "", location: "", total_beds: 0, available_beds: 0, heat_stroke_cases: 0, heat_exhaustion_cases: 0, dehydration_cases: 0 }); setShowForm(true); }} style={btnPrimary}>
              <Plus size={16} /> Add Hospital
            </button>
          </div>
          
          {loading ? <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {hospitals.map(h => {
                const capacityPercent = h.total_beds > 0 ? ((h.total_beds - h.available_beds) / h.total_beds) * 100 : 0;
                const capacityColor = capacityPercent > 90 ? "#ef4444" : capacityPercent > 70 ? "#d97706" : "#22c55e";
                return (
                  <div key={h.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: "#fafcf9", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#18181b", display: "flex", alignItems: "center", gap: 6 }}>
                          <HeartPulse size={16} color="#ef4444" /> {h.name}
                        </h4>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted, fontWeight: 600 }}><MapPin size={12} /> {h.location}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => editHospital(h)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: S.text }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteHospital(h.id)} style={btnDanger}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 150 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, fontWeight: 800 }}>
                          <span style={{ color: S.muted }}>Bed Capacity</span>
                          <span style={{ color: capacityColor }}>{h.available_beds} / {h.total_beds} available</span>
                        </div>
                        <div style={{ height: 8, background: "#e4e4e7", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${capacityPercent}%`, background: capacityColor, borderRadius: 4 }} />
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase" }}>Heat Stroke</p>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#e11d48" }}>{h.heat_stroke_cases}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase" }}>Exhaustion</p>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#ea580c" }}>{h.heat_exhaustion_cases}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {hospitals.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No hospitals found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Operations Tab (Phase 6) ── */
function OperationsTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment }) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", max_capacity: 0, current_occupants: 0, status: "Standby", manager_name: "", contact_number: "" });

  useEffect(() => {
    fetchCenters();
  }, [adminDepartment, isSuperadmin]);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      let query = supabase.from("evacuation_centers").select("*").order("name");
      const { data } = await query;
      setCenters(data || []);
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
      location: formData.location,
      max_capacity: parseInt(formData.max_capacity) || 0,
      current_occupants: parseInt(formData.current_occupants) || 0,
      status: formData.status,
      manager_name: formData.manager_name,
      contact_number: formData.contact_number,
      last_updated: new Date().toISOString()
    };

    if (editId) {
      await supabase.from("evacuation_centers").update(payload).eq("id", editId);
    } else {
      if (adminDepartment?.id) payload.department_id = adminDepartment.id;
      await supabase.from("evacuation_centers").insert(payload);
    }
    
    setShowForm(false);
    setEditId(null);
    fetchCenters();
  };

  const editCenter = (c) => {
    setFormData({ name: c.name, location: c.location, max_capacity: c.max_capacity, current_occupants: c.current_occupants, status: c.status, manager_name: c.manager_name || "", contact_number: c.contact_number || "" });
    setEditId(c.id);
    setShowForm(true);
  };

  const deleteCenter = async (id) => {
    if (confirm("Delete this evacuation center?")) {
      await supabase.from("evacuation_centers").delete().eq("id", id);
      fetchCenters();
    }
  };

  const totalCapacity = centers.reduce((sum, c) => sum + (c.max_capacity || 0), 0);
  const totalOccupants = centers.reduce((sum, c) => sum + (c.current_occupants || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Overview Analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, background: "#fef2f2", borderColor: "#fca5a5" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#dc2626", textTransform: "uppercase" }}>Total Evacuees</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#991b1b" }}>{totalOccupants}</p>
        </div>
        <div style={{ ...cardStyle, background: "#ecfdf5", borderColor: "#6ee7b7" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>Total Capacity</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#065f46" }}>{totalCapacity}</p>
        </div>
        <div style={{ ...cardStyle, background: "#f0f9ff", borderColor: "#bae6fd" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#0284c7", textTransform: "uppercase" }}>Active Centers</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#075985" }}>{centers.filter(c => c.status === "Active").length}</p>
        </div>
      </div>

      {showForm ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{editId ? "Update Center" : "Add Evacuation Center"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Center Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Location</label>
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Max Capacity (Individuals)</label>
                <input type="number" min="0" value={formData.max_capacity} onChange={e => setFormData({...formData, max_capacity: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Current Occupants</label>
                <input type="number" min="0" value={formData.current_occupants} onChange={e => setFormData({...formData, current_occupants: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Manager / Focal Person</label>
                <input value={formData.manager_name} onChange={e => setFormData({...formData, manager_name: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Contact Number</label>
                <input value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Status</label>
                <CustomSelect
                  value={formData.status}
                  onChange={v => setFormData({...formData, status: v})}
                  options={[{value: "Standby", label: "Standby"}, {value: "Active", label: "Active"}, {value: "Full", label: "Full"}, {value: "Closed", label: "Closed"}]}
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Evacuation Centers</h3>
              <p style={{ margin: 0, fontSize: 13, color: S.muted }}>Manage disaster shelters, relief goods, and responder dispatches.</p>
            </div>
            <button onClick={() => { setFormData({ name: "", location: "", max_capacity: 0, current_occupants: 0, status: "Standby", manager_name: "", contact_number: "" }); setShowForm(true); }} style={btnPrimary}>
              <Plus size={16} /> Add Center
            </button>
          </div>
          
          {loading ? <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {centers.map(c => {
                const capacityPercent = c.max_capacity > 0 ? (c.current_occupants / c.max_capacity) * 100 : 0;
                const capacityColor = capacityPercent > 90 ? "#ef4444" : capacityPercent > 50 ? "#d97706" : "#22c55e";
                
                return (
                  <div key={c.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: "#fafcf9", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#18181b", display: "flex", alignItems: "center", gap: 6 }}>
                          <Tent size={16} color="#0ea5e9" /> {c.name}
                        </h4>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted, fontWeight: 600 }}><MapPin size={12} /> {c.location}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: c.status === "Active" ? "#ecfdf5" : c.status === "Full" ? "#fef2f2" : "#f4f4f5", color: c.status === "Active" ? "#10b981" : c.status === "Full" ? "#ef4444" : "#71717a" }}>
                          {c.status}
                        </span>
                        <button onClick={() => editCenter(c)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: S.text }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteCenter(c.id)} style={btnDanger}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, fontWeight: 800 }}>
                          <span style={{ color: S.muted }}>Occupancy</span>
                          <span style={{ color: capacityColor }}>{c.current_occupants} / {c.max_capacity} individuals</span>
                        </div>
                        <div style={{ height: 8, background: "#e4e4e7", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(capacityPercent, 100)}%`, background: capacityColor, borderRadius: 4 }} />
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {c.manager_name && <span style={{ fontSize: 11, color: S.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Users size={12}/> {c.manager_name}</span>}
                        {c.contact_number && <span style={{ fontSize: 11, color: S.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Phone size={12}/> {c.contact_number}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {centers.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No evacuation centers found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── BFP Operations Tab (Phase 7) ── */
function BfpOperationsTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", fire_trucks: 0, active_personnel: 0, contact_number: "" });

  useEffect(() => {
    fetchStations();
  }, [adminDepartment, isSuperadmin]);

  const fetchStations = async () => {
    setLoading(true);
    try {
      let query = supabase.from("fire_stations").select("*").order("name");
      const { data } = await query;
      setStations(data || []);
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
      location: formData.location,
      fire_trucks: parseInt(formData.fire_trucks) || 0,
      active_personnel: parseInt(formData.active_personnel) || 0,
      contact_number: formData.contact_number,
      last_updated: new Date().toISOString()
    };

    if (editId) {
      await supabase.from("fire_stations").update(payload).eq("id", editId);
    } else {
      if (adminDepartment?.id) payload.department_id = adminDepartment.id;
      await supabase.from("fire_stations").insert(payload);
    }
    
    setShowForm(false);
    setEditId(null);
    fetchStations();
  };

  const editStation = (s) => {
    setFormData({ name: s.name, location: s.location, fire_trucks: s.fire_trucks, active_personnel: s.active_personnel, contact_number: s.contact_number || "" });
    setEditId(s.id);
    setShowForm(true);
  };

  const deleteStation = async (id) => {
    if (confirm("Delete this fire station?")) {
      await supabase.from("fire_stations").delete().eq("id", id);
      fetchStations();
    }
  };

  const totalTrucks = stations.reduce((sum, s) => sum + (s.fire_trucks || 0), 0);
  const totalPersonnel = stations.reduce((sum, s) => sum + (s.active_personnel || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Overview Analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ ...cardStyle, background: "#fef2f2", borderColor: "#fca5a5" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#dc2626", textTransform: "uppercase" }}>Total Stations</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#991b1b" }}>{stations.length}</p>
        </div>
        <div style={{ ...cardStyle, background: "#fff7ed", borderColor: "#fed7aa" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>Active Fire Trucks</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#9a3412" }}>{totalTrucks}</p>
        </div>
        <div style={{ ...cardStyle, background: "#f0fdf4", borderColor: "#86efac" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>Ready Personnel</p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#14532d" }}>{totalPersonnel}</p>
        </div>
      </div>

      {showForm ? (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{editId ? "Update Station" : "Add Fire Station"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Station Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Location</label>
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Fire Trucks</label>
                <input type="number" min="0" value={formData.fire_trucks} onChange={e => setFormData({...formData, fire_trucks: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Active Personnel</label>
                <input type="number" min="0" value={formData.active_personnel} onChange={e => setFormData({...formData, active_personnel: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Contact Number</label>
                <input value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} style={inputStyle} />
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>BFP Operations</h3>
              <p style={{ margin: 0, fontSize: 13, color: S.muted }}>Manage fire stations and track firefighting resources.</p>
            </div>
            <button onClick={() => { setFormData({ name: "", location: "", fire_trucks: 0, active_personnel: 0, contact_number: "" }); setShowForm(true); }} style={btnPrimary}>
              <Plus size={16} /> Add Station
            </button>
          </div>
          
          {loading ? <p style={{ color: S.muted, textAlign: "center", padding: 20 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stations.map(s => {
                return (
                  <div key={s.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: "#fafcf9", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#18181b", display: "flex", alignItems: "center", gap: 6 }}>
                          <Flame size={16} color="#dc2626" /> {s.name}
                        </h4>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted, fontWeight: 600 }}><MapPin size={12} /> {s.location}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => editStation(s)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: S.text }}><Edit2 size={14} /></button>
                        <button onClick={() => deleteStation(s.id)} style={btnDanger}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase" }}>Fire Trucks</p>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#dc2626" }}>{s.fire_trucks}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase" }}>Personnel</p>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#16a34a" }}>{s.active_personnel}</p>
                        </div>
                      </div>
                      {s.contact_number && (
                        <div style={{ marginLeft: "auto" }}>
                          <span style={{ fontSize: 12, color: S.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Phone size={14}/> {s.contact_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {stations.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 20 }}>No fire stations found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Water Utility Tab (Phase 8) ── */
function WaterUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment }) {
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
    if (confirm("Delete this water facility?")) {
      await supabase.from("water_facilities").delete().eq("id", id);
      fetchFacilities();
    }
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
function PowerUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment }) {
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
    if (confirm("Delete this power feeder?")) {
      await supabase.from("power_feeders").delete().eq("id", id);
      fetchFeeders();
    }
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
