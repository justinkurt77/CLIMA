import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useInView } from "react-intersection-observer";
import { supabase } from "../lib/supabase";
import DOMPurify from "dompurify";
import {
  BarChart3, FileText, Users, LogOut, Map as MapIcon, RefreshCw,
  Plus, Trash2, Building, CheckCircle, CheckCircle2, Clock, TrendingUp, Search, X, Edit2, Check, Download,
  MapPin, Calendar, Phone, AlertCircle, AlertTriangle, ChevronRight, ChevronDown, ChevronUp, Navigation,
  ShieldAlert, Activity, Megaphone, HeartPulse, Tent, Truck, Flame, Droplet, Zap, Sprout, Wifi,
  Sun, Moon, Bell, Menu, Layers, ThermometerSun, DollarSign, LifeBuoy,
  Home, Wrench, TrendingDown, ArrowLeft, Mail, UserCheck, UserPlus, Shield, ShieldCheck, User as UserIcon, Filter, Briefcase,
  Settings, Key, Tag, Folder, FolderPlus, Eye, SlidersHorizontal, CheckSquare, Square, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/ui/CustomSelect";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import UserCombobox from "../components/ui/UserCombobox";
import BarangayMultiSelect from "../components/ui/BarangayMultiSelect";
import { PALAYAN_CITY_BARANGAYS, parseBarangayList } from "../lib/palayanBarangays";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { fetchKloudtechDashboard, adaptKloudtechTelemetry } from "../services/kloudtechService";
import { logger } from "../lib/logger";
import { useTheme } from "../context/ThemeContext";
import { usePaginatedReports } from "../hooks/usePaginatedReports";
import { usePaginatedAdvisories } from "../hooks/usePaginatedAdvisories";
import { usePaginatedHospitalRecords } from "../hooks/usePaginatedHospitalRecords";
import { usePaginatedCDRRMOOps } from "../hooks/usePaginatedCDRRMOOps";
import { usePaginatedBFPOps } from "../hooks/usePaginatedBFPOps";
import AdminOverviewCommand from "../components/dashboard/AdminOverviewCommand";
import ElNinoMonitoringDashboard from "../components/dashboard/ElNinoMonitoringDashboard";
import SecurityConfirmModal from "../components/ui/SecurityConfirmModal";
import { getOutageEndTime, isPowerOutageActive } from "../hooks/usePowerInterruptionAdvisories";
import { getWaterInterruptionEndTime, isWaterInterruptionActive } from "../hooks/useWaterInterruptionAdvisories";

/* ── Dynamic Theme from Accent Color & Dark Mode ── */
function hexToRgb(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return { r: 245, g: 158, b: 11 };
  const clean = hex.slice(1);
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16) || 245;
  const g = parseInt(full.slice(2, 4), 16) || 158;
  const b = parseInt(full.slice(4, 6), 16) || 11;
  return { r, g, b };
}

function buildTheme(accent, name = "", isDark = true) {
  const isCustomAccent = accent && accent !== "#373D20";
  const effectiveAccent = isCustomAccent ? accent : "#f59e0b";
  const { r, g, b } = hexToRgb(effectiveAccent);

  if (isDark) {
    return {
      accent: effectiveAccent,
      accentHover: "#d97706",
      accentBg: `rgba(${r},${g},${b},0.16)`,
      accentBorder: `rgba(${r},${g},${b},0.35)`,
      bg: "#000000",
      surface: "#09090b",
      card: "#121214",
      cardSubtle: "#18181b",
      cardHeader: "rgba(255, 255, 255, 0.03)",
      border: "rgba(255, 255, 255, 0.09)",
      borderMedium: "rgba(255, 255, 255, 0.16)",
      text: "#ffffff",
      textSecondary: "#a1a1aa",
      muted: "#71717a",
      inputBg: "#161618",
      inputBorder: "rgba(255, 255, 255, 0.12)",
      shadowCard: "0 10px 30px rgba(0, 0, 0, 0.6)",
      title: name ? `${name} Dashboard` : "Admin Console",
      subtitle: name ? `${name} · CLIMA Portal` : "CLIMA Central Management",
    };
  }

  return {
    accent: effectiveAccent,
    accentHover: "#d97706",
    accentBg: `rgba(${r},${g},${b},0.1)`,
    accentBorder: `rgba(${r},${g},${b},0.25)`,
    bg: "#ffffff",
    surface: "#ffffff",
    card: "#ffffff",
    cardSubtle: "#f4f4f6",
    cardHeader: "rgba(0, 0, 0, 0.02)",
    border: "rgba(0, 0, 0, 0.08)",
    borderMedium: "rgba(0, 0, 0, 0.14)",
    text: "#09090b",
    textSecondary: "#52525b",
    muted: "#71717a",
    inputBg: "#ffffff",
    inputBorder: "rgba(0, 0, 0, 0.12)",
    shadowCard: "0 10px 30px rgba(0, 0, 0, 0.06)",
    title: name ? `${name} Dashboard` : "Admin Console",
    subtitle: name ? `${name} · CLIMA Portal` : "CLIMA Central Management",
  };
}

/* Fallback colors for known agencies (used if no accent_color saved in DB) */
const DEPT_DEFAULTS = {
  PCH: "#0891b2",
  CDRRMO: "#dc2626",
  BFP: "#ef4444",
  AGRI: "#16a34a",
  PCWD: "#2563eb",
  NEECO: "#f59e0b",
  ENRO: "#16a34a",
  "CITY TRAFFIC": "#2563eb",
  "CITY VET OFFICE": "#d97706",
  ENGINEERING: "#7c3aed",
  "GENERAL SERVICES": "#0891b2",
};

const ORDERED_AGENCIES = ["PCH", "CDRRMO", "BFP", "AGRI", "PCWD", "NEECO"];

function getTheme(dept, isDark) {
  const name = typeof dept === "string" ? dept : dept?.name;
  const accent = (typeof dept === "object" && dept?.accent_color) || (name && DEPT_DEFAULTS[name]) || "#f97316";
  return buildTheme(accent, name, isDark);
}

const makeStyles = (T, isDark) => ({
  font: "var(--font-sans, 'Nohemi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
  ...T,
  isDark,
  green: isDark ? "#22c55e" : "#16a34a",
  greenBg: isDark ? "rgba(34, 197, 94, 0.16)" : "rgba(22, 163, 74, 0.1)",
  red: isDark ? "#ef4444" : "#dc2626",
  redBg: isDark ? "rgba(239, 68, 68, 0.16)" : "rgba(220, 38, 38, 0.1)",
  blue: isDark ? "#3b82f6" : "#2563eb",
  blueBg: isDark ? "rgba(59, 130, 246, 0.16)" : "rgba(37, 99, 235, 0.1)",
  amber: isDark ? "#f59e0b" : "#d97706",
  amberBg: isDark ? "rgba(245, 158, 11, 0.16)" : "rgba(217, 119, 6, 0.1)",
  purple: isDark ? "#a855f7" : "#7c3aed",
  purpleBg: isDark ? "rgba(168, 85, 247, 0.16)" : "rgba(124, 58, 237, 0.1)",
});

const tabVariants = {
  active: { 
    opacity: 1, 
    y: 0, 
    display: "block",
    transition: { duration: 0.22, ease: "easeOut" } 
  },
  inactive: { 
    opacity: 0, 
    y: 8, 
    transitionEnd: { display: "none" }, 
    transition: { duration: 0.14, ease: "easeIn" } 
  }
};

export default function AdminDashboard({ onLogout, onMapOverview, isSuperadmin, adminCategories, adminDepartment, onViewCitizenApp }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const S = makeStyles(getTheme(isSuperadmin ? null : adminDepartment, isDark), isDark);

  const floatingTabStyle = {
    position: "absolute",
    top: 68,
    bottom: 14,
    left: 102,
    right: 14,
    borderRadius: 22,
    background: isDark ? "rgba(18, 18, 20, 0.94)" : "rgba(255, 255, 255, 0.94)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
    boxShadow: isDark ? "0 25px 60px rgba(0, 0, 0, 0.65)" : "0 20px 50px rgba(0, 0, 0, 0.08)",
    overflowY: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    padding: "24px 28px",
    boxSizing: "border-box",
    zIndex: 35,
    color: S.text,
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "11px 14px",
    background: S.inputBg, border: `1.5px solid ${S.inputBorder}`, borderRadius: 12,
    fontSize: 14, fontWeight: 600, outline: "none", fontFamily: S.font,
    color: S.text, transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.04)",
    colorScheme: isDark ? "dark" : "light",
  };
  const selectStyle = {
    ...inputStyle,
    appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
    paddingRight: 36, cursor: "pointer",
    background: S.inputBg,
    color: S.text,
    colorScheme: isDark ? "dark" : "light",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(isDark ? "#a1a1aa" : "#71717a")}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
  };
  const btnPrimary = {
    padding: "10px 22px", borderRadius: 9999, border: "none",
    background: S.accent, color: "#ffffff", fontWeight: 800, fontSize: 13.5,
    cursor: "pointer", fontFamily: S.font, display: "inline-flex", alignItems: "center", gap: 8,
    boxShadow: `0 4px 14px ${S.accent}55`, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  };
  const btnDanger = {
    background: "none", border: "none", color: S.red, cursor: "pointer",
    padding: 6, borderRadius: 8, display: "flex", alignItems: "center",
  };
  const cardStyle = {
    background: S.card, border: `1px solid ${S.border}`, borderRadius: 20,
    padding: 24, boxShadow: S.shadowCard,
    backdropFilter: isDark ? "blur(16px)" : "none",
    WebkitBackdropFilter: isDark ? "blur(16px)" : "none",
  };

  const [activeTab, setActiveTab] = useState("overview");

  const BackToMapButton = () => (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setActiveTab("overview")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 18px",
          borderRadius: 9999,
          background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
          color: "#ffffff",
          border: "none",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(234, 88, 12, 0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(234, 88, 12, 0.35)";
        }}
      >
        <ArrowLeft size={16} strokeWidth={2.4} />
        <span>Back to GIS Map</span>
      </button>
    </div>
  );
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailReport, setDetailReport] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Permission enforcement state
  const [myPermissions, setMyPermissions] = useState({});
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Global modal state for all tabs
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: "success", title: "", message: "", onConfirm: null, confirmText: "OK", cancelText: "Cancel" });

  // Global toast notification state
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toastOrMessage, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    let toastObj;
    if (typeof toastOrMessage === "string") {
      toastObj = {
        id,
        type,
        title: type === "success" ? "Success" : type === "error" ? "Error" : "Notice",
        message: toastOrMessage,
      };
    } else {
      toastObj = {
        id,
        type: toastOrMessage.type || type,
        title: toastOrMessage.title || (toastOrMessage.type === "error" ? "Error" : "Success"),
        message: toastOrMessage.message || toastOrMessage.text || "",
      };
    }
    setToasts((prev) => [...prev, toastObj]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const mainRef = useRef(null);

  // Global modal state for all tabs
  const [modalLoading, setModalLoading] = useState(false);
  const isExecutingConfirmAction = useRef(false);
  const modalOpenTimeRef = useRef(0);
  const modalMouseDownTargetRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      modalOpenTimeRef.current = Date.now();
    }
  }, [showModal]);

  // Global modal helper functions
  const showSuccessModal = (titleOrMessage, maybeMessage) => {
    const title = maybeMessage ? titleOrMessage : "Success";
    const message = maybeMessage !== undefined ? maybeMessage : titleOrMessage;

    // Trigger toast notification for sleek non-intrusive feedback across all modules
    showToast({ 
      type: "success", 
      title, 
      message: message || title 
    });

    // Close any modal cleanly so no blocking popup is shown across any module
    setShowModal(false);
  };

  const showErrorModal = (titleOrMessage, maybeMessage) => {
    const title = maybeMessage ? titleOrMessage : "Error";
    const message = maybeMessage !== undefined ? maybeMessage : titleOrMessage;

    showToast({ 
      type: "error", 
      title, 
      message: message || title 
    });

    if (isExecutingConfirmAction.current) {
      setShowModal(false);
      return;
    }

    setModalConfig({ 
      type: "error", 
      title, 
      message, 
      onConfirm: () => setShowModal(false), 
      confirmText: "OK" 
    });
    setShowModal(true);
  };

  const [securityModalConfig, setSecurityModalConfig] = useState({
    isOpen: false,
    title: "Security Confirmation",
    message: "",
    itemName: "",
    confirmText: "Verify & Delete",
    onConfirmed: null,
  });

  const showSecurityConfirmModal = useCallback(({
    title = "Security Confirmation",
    message = "Deleting this item is a sensitive, permanent action. Please enter your admin password to authenticate and proceed.",
    itemName = "",
    confirmText = "Verify & Delete",
    onConfirmed,
  }) => {
    setSecurityModalConfig({
      isOpen: true,
      title,
      message,
      itemName,
      confirmText,
      onConfirmed,
    });
  }, []);

  const showConfirmModal = (title, message, onConfirm, confirmText = "Confirm", cancelText = "Cancel", options = {}) => {
    const isDeletionAction =
      options.requiresPassword ||
      title.toLowerCase().includes("delete") ||
      title.toLowerCase().includes("revoke") ||
      title.toLowerCase().includes("clear") ||
      confirmText.toLowerCase().includes("delete");

    if (isDeletionAction) {
      showSecurityConfirmModal({
        title: title || "Security Confirmation",
        message: message || "Deleting this record requires admin password verification.",
        itemName: options.itemName || "",
        confirmText: confirmText === "Confirm" ? "Verify & Delete" : confirmText,
        onConfirmed: onConfirm,
      });
      return;
    }

    isExecutingConfirmAction.current = false;
    setModalConfig({
      type: "confirm",
      title,
      message,
      onConfirmAction: onConfirm,
      confirmText,
      cancelText
    });
    setShowModal(true);
  };

  const handleModalConfirm = async () => {
    if (modalLoading) return;
    if (modalConfig.type !== "confirm") {
      setShowModal(false);
      return;
    }

    if (!modalConfig.onConfirmAction) {
      setShowModal(false);
      return;
    }

    setModalLoading(true);
    isExecutingConfirmAction.current = true;
    try {
      await modalConfig.onConfirmAction();
      setShowModal(false);
    } catch (err) {
      setShowModal(false);
      showErrorModal("Action Failed", err?.message || "An unexpected error occurred.");
    } finally {
      isExecutingConfirmAction.current = false;
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);
  
  // Load user's module permissions on mount
  useEffect(() => {
    loadMyPermissions();
  }, []);

  const loadMyPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    } catch (e) {
      // ignore
    }

    if (isSuperadmin) {
      // Superadmins have all permissions
      setMyPermissions({});
      setPermissionsLoaded(true);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perms, error } = await supabase
        .from('admin_module_permissions')
        .select('module_name, can_view, can_create, can_edit, can_delete')
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error loading permissions:', error);
        return;
      }

      // Convert array to object for easy lookup
      const permMap = {};
      perms?.forEach(p => {
        permMap[p.module_name] = {
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete
        };
      });

      setMyPermissions(permMap);
      setPermissionsLoaded(true);
    } catch (err) {
      logger.error('Failed to load permissions:', err);
      setPermissionsLoaded(true);
    }
  };

  // Permission checker helper functions
  const hasPermission = (module, permType = 'view') => {
    if (isSuperadmin) return true;
    
    const perm = myPermissions[module];
    if (!perm) return false;

    switch (permType) {
      case 'view': return perm.can_view;
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      default: return false;
    }
  };

  const canViewModule = (module) => hasPermission(module, 'view');
  const canCreate = (module) => hasPermission(module, 'create');
  const canEdit = (module) => hasPermission(module, 'edit');
  const canDelete = (module) => hasPermission(module, 'delete');

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
      setLastSync(new Date());
    } catch (err) { logger.error(err); }
    finally { if (!silent) setLoading(false); }
  };

  // Live reports: refresh instantly on any change to the reports table, with a
  // periodic silent refresh as a safety net if the realtime channel is unavailable.
  useEffect(() => {
    const channelId = `admin_reports_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => fetchData(true))
      .subscribe();
    const poll = setInterval(() => {
      if (!document.hidden) fetchData(true);
    }, 30000);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [selectedDeptId, isSuperadmin, adminCategories]);

  const tabs = [
    { id: "overview", label: "Dashboard", icon: <BarChart3 size={18} />, module: "dashboard" },
    { id: "elnino", label: "El Niño Monitoring", icon: <ThermometerSun size={18} />, module: "dashboard" },
    { id: "reports", label: "Citizen Reports", icon: <FileText size={18} />, module: "reports" },
    { id: "advisories", label: "Official Advisories", icon: <Megaphone size={18} />, module: "advisories" },
    { id: "hospitals", label: "Hospital Monitoring", icon: <HeartPulse size={18} />, module: "hospital" },
    { id: "operations", label: "CDRRMO Operations", icon: <Tent size={18} />, module: "cdrrmo" },
    { id: "bfp", label: "BFP Operations", icon: <Flame size={18} />, module: "bfp" },
    { id: "agriculture", label: "Agricultural Damages", icon: <Sprout size={18} />, module: "agriculture" },
    { id: "water", label: "Water Utility", icon: <Droplet size={18} />, module: "water" },
    { id: "power", label: "Power Utility", icon: <Zap size={18} />, module: "power" },
    ...(isSuperadmin ? [
      { id: "users", label: "Users", icon: <Users size={18} />, module: "users" },
      { id: "settings", label: "Categories", icon: <Layers size={18} />, module: "settings" },
      { id: "logs", label: "Activity Logs", icon: <Activity size={18} />, module: "logs" },
    ] : []),
  ];

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter(tab => {
    // Dashboard and El Niño impact monitoring are always visible to all admins
    if (tab.id === 'overview' || tab.id === 'elnino') return true;
    
    if (isSuperadmin) return true;
    if (!permissionsLoaded) return false; // Don't show tabs until permissions are loaded
    return canViewModule(tab.module);
  });

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: S.bg, flexDirection: "column", gap: 12 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 40, height: 40, border: `4px solid ${S.border}`, borderTopColor: S.accent, borderRadius: "50%" }} />
      <p style={{ color: S.muted, fontFamily: S.font, fontWeight: 700, fontSize: 14 }}>Loading…</p>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: isDark ? "#000000" : "#ffffff",
        fontFamily: S.font,
        color: S.text,
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      {/* ── 1. Docked Slim Sidebar (Pixel-perfect match to desktop reference) ── */}
      <aside
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 86,
          background: isDark ? "rgba(10, 10, 12, 0.96)" : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 0 16px",
          zIndex: 50,
        }}
      >
        {/* Top: CLIMA Logo & User Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => setActiveTab("overview")}
            title="CLIMA GIS Command"
            style={{
              width: 48,
              height: 48,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
            }}
          >
            <img
              src="/logo.png"
              alt="CLIMA Logo"
              style={{
                width: 38,
                height: 38,
                objectFit: "contain",
                filter: "drop-shadow(0 2px 10px rgba(245, 158, 11, 0.5))",
              }}
            />
          </button>

          <div
            onClick={() => {
              if (isSuperadmin) setActiveTab("users");
            }}
            title={currentUser?.email || (isSuperadmin ? "Superadmin" : "Admin")}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
              border: "1.5px solid rgba(245, 158, 11, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isSuperadmin ? "pointer" : "default",
              color: "#f59e0b",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {(currentUser?.email?.[0] || (isSuperadmin ? "S" : adminDepartment?.name?.[0]) || "A").toUpperCase()}
          </div>
        </div>

        {/* Center: Module Navigation Icons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            overflowY: "auto",
            scrollbarWidth: "none",
            maxHeight: "calc(100vh - 280px)",
            padding: "4px 0",
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 15,
                  border: "none",
                  background: isActive ? "linear-gradient(135deg, #f59e0b, #f97316)" : "transparent",
                  color: isActive ? "#ffffff" : isDark ? "#a1a1aa" : "#71717a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isActive
                    ? "0 4px 14px rgba(245, 158, 11, 0.45)"
                    : "none",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
                    e.currentTarget.style.color = isDark ? "#ffffff" : "#09090b";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = isDark ? "#a1a1aa" : "#71717a";
                  }
                }}
              >
                {tab.icon}
              </button>
            );
          })}
        </div>

        {/* Bottom: Updated Status & Sign Out */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, textAlign: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Updated
            </span>
            <span style={{ fontSize: 8, color: isDark ? "#71717a" : "#a1a1aa", fontWeight: 700 }}>
              {lastSync ? lastSync.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }) : "—"}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(220, 38, 38, 0.3)"}`,
              background: isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(239, 68, 68, 0.08)",
              color: isDark ? "#ef4444" : "#dc2626",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── 2. Floating Top Capsule Island ── */}
      <header
        style={{
          position: "absolute",
          top: 14,
          left: 102,
          right: 14,
          height: 44,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        {/* Left: Brand / Live Telemetry Pill */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 9999,
            background: isDark ? "rgba(18, 18, 20, 0.92)" : "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
            boxShadow: isDark ? "0 10px 30px rgba(0, 0, 0, 0.5)" : "0 8px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 900, color: S.text, letterSpacing: "-0.01em" }}>
            Palayan Command
          </span>
          <span style={{ fontSize: 11, color: S.textSecondary, fontWeight: 700 }}>
            {isSuperadmin ? "Superadmin Portal" : (adminDepartment?.name || "Operations Lead")}
          </span>

          {onViewCitizenApp && (
            <button
              onClick={onViewCitizenApp}
              title="Return to Citizen Portal"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                marginLeft: 4,
                borderRadius: 9999,
                background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.1)"}`,
                color: S.text,
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
            >
              <Home size={12} strokeWidth={2.4} />
              <span>Citizen View</span>
            </button>
          )}
        </div>


        {/* Right: Theme Toggle, Reload & Profile Capsule Island */}
        {activeTab !== "overview" ? (
          <div
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: isDark ? "rgba(18, 18, 20, 0.92)" : "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: 9999,
              padding: "4px 8px 4px 6px",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
              boxShadow: isDark ? "0 10px 30px rgba(0, 0, 0, 0.5)" : "0 8px 24px rgba(0, 0, 0, 0.06)",
            }}
          >
            {/* Reload / Refresh Telemetry Button */}
            <button
              onClick={() => fetchData()}
              title="Refresh Telemetry"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                color: isDark ? "#a1a1aa" : "#71717a",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f59e0b";
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDark ? "#a1a1aa" : "#71717a";
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)";
              }}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                color: isDark ? "#f59e0b" : "#d97706",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)";
              }}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Subtle Divider */}
            <div style={{ width: 1, height: 16, background: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)", margin: "0 2px" }} />

            {/* Profile Avatar & Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "2px 8px 2px 2px",
                borderRadius: 9999,
                background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 11,
                  boxShadow: "0 2px 6px rgba(234, 88, 12, 0.35)",
                }}
              >
                {(currentUser?.email?.[0] || (isSuperadmin ? "S" : adminDepartment?.name?.[0]) || "A").toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : S.text,
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser?.email?.split("@")[0] || (isSuperadmin ? "Superadmin" : "Admin")}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ width: 10, pointerEvents: "none" }} />
        )}
      </header>

      {/* ── 3. Main Workspace Area ── */}
      <main ref={mainRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <motion.div
          variants={tabVariants}
          initial="inactive"
          animate={activeTab === "overview" ? "active" : "inactive"}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}
        >
            <OverviewTab
              reports={reports}
              S={S}
              cardStyle={cardStyle}
              onViewReport={setDetailReport}
              onNavigateTab={setActiveTab}
              onMapOverview={onMapOverview}
              isSuperadmin={isSuperadmin}
              adminDepartment={adminDepartment}
              currentUser={currentUser}
              toggleTheme={toggleTheme}
              fetchData={fetchData}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "elnino" ? "active" : "inactive"}
            style={floatingTabStyle}
          >
            <BackToMapButton />
            <ElNinoMonitoringDashboard
              session={currentUser}
              isAdmin={true}
              onBackToMap={() => setActiveTab("overview")}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "reports" ? "active" : "inactive"}
            style={floatingTabStyle}
          >
            <BackToMapButton />
            <ReportsTab reports={reports} onUpdate={() => fetchData(true)} S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} onViewReport={setDetailReport} />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "advisories" ? "active" : "inactive"}
            style={floatingTabStyle}
          >
            <BackToMapButton />
            <AdvisoriesTab 
              S={S} 
              cardStyle={cardStyle} 
              inputStyle={inputStyle} 
              selectStyle={selectStyle} 
              btnPrimary={btnPrimary} 
              btnDanger={btnDanger} 
              isSuperadmin={isSuperadmin} 
              adminDepartment={adminDepartment} 
              canCreate={canCreate} 
              canEdit={canEdit} 
              canDelete={canDelete} 
              showSecurityConfirmModal={showSecurityConfirmModal}
              showSuccessModal={showSuccessModal}
              showErrorModal={showErrorModal}
              showConfirmModal={showConfirmModal}
              showToast={showToast}
            />
          </motion.div>

          <motion.div
            variants={tabVariants}
            initial="inactive"
            animate={activeTab === "hospitals" ? "active" : "inactive"}
            style={floatingTabStyle}
          >
            <BackToMapButton />
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
            style={floatingTabStyle}
          >
            <BackToMapButton />
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
            style={floatingTabStyle}
          >
            <BackToMapButton />
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
            style={floatingTabStyle}
          >
            <BackToMapButton />
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
            style={floatingTabStyle}
          >
            <BackToMapButton />
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
            style={floatingTabStyle}
          >
            <BackToMapButton />
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
                style={floatingTabStyle}
              >
                <BackToMapButton />
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
                  showToast={showToast}
                />
              </motion.div>

              <motion.div
                variants={tabVariants}
                initial="inactive"
                animate={activeTab === "settings" ? "active" : "inactive"}
                style={floatingTabStyle}
              >
                <BackToMapButton />
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
                  showToast={showToast}
                  isSuperadmin={isSuperadmin}
                />
              </motion.div>

              <motion.div
                variants={tabVariants}
                initial="inactive"
                animate={activeTab === "logs" ? "active" : "inactive"}
                style={floatingTabStyle}
              >
                <BackToMapButton />
                <ActivityLogsTab S={S} cardStyle={cardStyle} inputStyle={inputStyle} selectStyle={selectStyle} isSuperadmin={isSuperadmin} showSecurityConfirmModal={showSecurityConfirmModal} />
              </motion.div>
            </>
          )}
        </main>

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
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999
              }}
              onMouseDown={(e) => {
                modalMouseDownTargetRef.current = e.target;
              }}
              onClick={(e) => {
                if (Date.now() - modalOpenTimeRef.current < 400) return;
                if (modalMouseDownTargetRef.current === e.currentTarget && e.target === e.currentTarget && modalConfig.type !== "confirm" && !modalLoading) {
                  setShowModal(false);
                }
              }}
            >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: S.card,
                border: `1px solid ${S.borderMedium}`,
                borderRadius: 20,
                padding: 24,
                maxWidth: 420,
                width: "90%",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.75)" : "0 20px 60px rgba(0,0,0,0.2)",
                fontFamily: S.font,
                color: S.text,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, color: modalConfig.type === "error" ? S.red : S.accent }}>
                {modalConfig.title}
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: S.textSecondary, lineHeight: 1.6 }}>
                {modalConfig.message}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
                {modalConfig.type === "confirm" && (
                  <button
                    type="button"
                    disabled={modalLoading}
                    onClick={() => {
                      if (!modalLoading) setShowModal(false);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 9999,
                      border: `1px solid ${S.border}`,
                      background: S.cardSubtle,
                      color: S.text,
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: modalLoading ? "not-allowed" : "pointer",
                      opacity: modalLoading ? 0.6 : 1,
                      fontFamily: S.font,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {modalConfig.cancelText || "Cancel"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={modalLoading}
                  onClick={modalConfig.type === "confirm" ? handleModalConfirm : (modalConfig.onConfirm || (() => setShowModal(false)))}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 9999,
                    border: "none",
                    background: modalConfig.type === "error" ? S.red : S.accent,
                    color: "#fff",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: modalLoading ? "not-allowed" : "pointer",
                    opacity: modalLoading ? 0.7 : 1,
                    fontFamily: S.font,
                    boxShadow: modalConfig.type === "error" ? `0 4px 14px ${S.red}55` : `0 4px 14px ${S.accent}55`,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {modalLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }}
                    />
                  )}
                  {modalLoading ? "Processing…" : (modalConfig.confirmText || "OK")}
                </button>
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Security Confirmation Modal for Deletions */}
      <SecurityConfirmModal
        isOpen={securityModalConfig.isOpen}
        onClose={() => setSecurityModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirmed={securityModalConfig.onConfirmed}
        title={securityModalConfig.title}
        message={securityModalConfig.message}
        itemName={securityModalConfig.itemName}
        confirmText={securityModalConfig.confirmText}
        isDark={S.isDark}
        currentUserEmail={currentUser?.email}
      />

      {/* Global Floating Toast Container (Minimalist Shadcn Style) */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 10001,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
          maxWidth: 380,
          width: "calc(100% - 40px)",
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isError = toast.type === "error";
            const isWarning = toast.type === "warning";

            // Minimalist icon accent colors
            const iconColor = isSuccess 
              ? (isDark ? "#4ade80" : "#16a34a") 
              : isError 
                ? (isDark ? "#f87171" : "#dc2626") 
                : isWarning 
                  ? (isDark ? "#fbbf24" : "#d97706")
                  : (isDark ? "#38bdf8" : "#0284c7");

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  pointerEvents: "auto",
                  background: isDark ? "rgba(24, 24, 27, 0.96)" : "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  boxShadow: isDark
                    ? "0 10px 30px -4px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04)"
                    : "0 10px 25px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontFamily: S.font,
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1.5, color: iconColor }}>
                  {isSuccess ? (
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                  ) : isError ? (
                    <AlertCircle size={16} strokeWidth={2.2} />
                  ) : isWarning ? (
                    <AlertTriangle size={16} strokeWidth={2.2} />
                  ) : (
                    <Info size={16} strokeWidth={2.2} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isDark ? "#f4f4f5" : "#09090b",
                      lineHeight: 1.35,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {toast.title}
                  </div>
                  {toast.message && (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: isDark ? "#a1a1aa" : "#71717a",
                        marginTop: 2,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      {toast.message}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Close notification"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: isDark ? "#71717a" : "#a1a1aa",
                    cursor: "pointer",
                    padding: 3,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "color 0.15s ease, background 0.15s ease",
                    marginTop: -1,
                    marginRight: -2,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = isDark ? "#f4f4f5" : "#18181b";
                    e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isDark ? "#71717a" : "#a1a1aa";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
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
function OverviewTab({
  reports,
  S,
  cardStyle,
  onViewReport,
  onNavigateTab,
  onMapOverview,
  isSuperadmin,
  adminDepartment,
  currentUser,
  toggleTheme,
  fetchData,
}) {
  const themeContext = useTheme();
  const activeToggleTheme = toggleTheme || themeContext?.toggleTheme;
  const [analyticsData, setAnalyticsData] = useState({
    hospitalRecords: [],
    cdrrmoRecords: [],
    bfpRecords: [],
    advisories: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [ktData, setKtData] = useState(null);
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
    fetchKloudtechData();
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
          .from("bfp_operations")
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
      logger.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKloudtechData = async () => {
    try {
      const result = await fetchKloudtechDashboard();
      if (result.success && result.data && result.data.length > 0) {
        const station = result.data[0];
        const adapted = adaptKloudtechTelemetry(station.telemetry || {}, true);
        setKtData({
          stationName: station.station?.stationName || "KloudTech Station",
          ...adapted,
          isLive: result.isLive || false
        });
      }
    } catch (error) {
      logger.error("KloudTech fetch error:", error);
    }
  };

  // The map is independent of the analytics queries, so it renders immediately
  // while the (collapsed) analytics data loads in the background.

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
    .filter(r => r.operation_date >= last7Days && r.operation_type === 'fire_incident')
    .length;

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
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }}>
      {/* ── 1. Modern Command Center Overview (Full-Bleed Floating Map) ── */}
      <AdminOverviewCommand
        reports={reports}
        isDark={S.isDark}
        onViewReport={onViewReport}
        isSuperadmin={isSuperadmin}
        adminDepartment={adminDepartment}
        currentUser={currentUser}
        leftInset={98}
        toggleTheme={activeToggleTheme}
        fetchData={fetchData}
        loading={loading}
      />

      {/* Floating Detailed Analytics Panel when opened */}
      <AnimatePresence>
        {showDetailedAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{
              position: "absolute",
              top: 68,
              bottom: 14,
              left: 102,
              right: 14,
              borderRadius: 22,
              background: "rgba(14, 23, 14, 0.94)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${S.border}`,
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.65)",
              overflowY: "auto",
              padding: "24px 28px",
              zIndex: 40,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: S.text }}>Detailed Operations Analytics</h3>
              <button
                onClick={() => setShowDetailedAnalytics(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  borderRadius: 9999,
                  background: S.accent,
                  color: "#ffffff",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: `0 4px 14px ${S.accent}55`,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 6px 20px ${S.accent}77`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 4px 14px ${S.accent}55`;
                }}
              >
                <X size={14} strokeWidth={2.4} />
                <span>Close Analytics</span>
              </button>
            </div>
          {/* Date Range Selector */}
          <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: S.cardSubtle, borderRadius: 12, border: `1px solid ${S.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: S.muted, marginRight: 8 }}>TIME RANGE:</span>
        {[7, 30, 90].map(days => (
          <button
            key={days}
            onClick={() => setDateRange(days)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: dateRange === days ? `2px solid ${S.accent}` : `1px solid ${S.border}`,
              background: dateRange === days ? S.accentBg : S.card,
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

      {/* KloudTech Live Sensor Card */}
      {ktData && (
        <div style={{
          ...cardStyle,
          background: `linear-gradient(135deg, ${S.accent}15 0%, ${S.accent}05 100%)`,
          borderLeft: `4px solid ${S.accent}`,
          padding: 20
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: S.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Wifi size={18} color="#fff" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: S.text }}>
                  {ktData.stationName}
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, color: S.muted }}>
                  KloudTech IoT Weather Station
                </p>
              </div>
            </div>
            {ktData.isLive && (
              <div style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: "#10b981",
                color: "#fff",
                fontSize: 10,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fff",
                  animation: "pulse 2s ease-in-out infinite"
                }} />
                LIVE
              </div>
            )}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {ktData.temp !== null && (
              <div style={{ padding: "12px 14px", background: S.cardSubtle, borderRadius: 10, border: `1px solid ${S.border}` }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Temperature
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: S.text }}>
                  {ktData.temp}°C
                </p>
              </div>
            )}
            {ktData.humidity !== null && (
              <div style={{ padding: "12px 14px", background: S.cardSubtle, borderRadius: 10, border: `1px solid ${S.border}` }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Humidity
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: S.text }}>
                  {ktData.humidity.toFixed(1)}%
                </p>
              </div>
            )}
            {ktData.heatIndex !== null && (
              <div style={{ padding: "12px 14px", background: S.cardSubtle, borderRadius: 10, border: `1px solid ${S.border}` }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Heat Index
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#ef4444" }}>
                  {ktData.heatIndex.toFixed(1)}°C
                </p>
              </div>
            )}
            {ktData.windSpeed !== undefined && (
              <div style={{ padding: "12px 14px", background: S.cardSubtle, borderRadius: 10, border: `1px solid ${S.border}` }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Wind Speed
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: S.text }}>
                  {ktData.windSpeed.toFixed(1)} m/s
                </p>
              </div>
            )}
            {ktData.rawPressure && (
              <div style={{ padding: "12px 14px", background: S.cardSubtle, borderRadius: 10, border: `1px solid ${S.border}` }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Pressure
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: S.text }}>
                  {ktData.rawPressure.toFixed(1)} hPa
                </p>
              </div>
            )}
            {ktData.uvIndex !== null && (
              <div style={{ padding: "12px 14px", background: S.cardSubtle, borderRadius: 10, border: `1px solid ${S.border}` }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  UV Index
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: S.text }}>
                  {ktData.uvIndex.toFixed(1)}
                </p>
              </div>
            )}
          </div>
          
          {ktData.recordedAt && (
            <p style={{ margin: "12px 0 0", fontSize: 11, fontWeight: 600, color: S.muted, textAlign: "right" }}>
              Last updated: {ktData.recordedAt}
            </p>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Citizen Reports Trend */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Citizen Reports Trend
          </h4>
          {reportsTimelineData.every(d => d.reports === 0) ? (
            <EmptyChartState 
              icon="📊" 
              message="No reports yet" 
              subtitle="Report trends will appear here once citizens start submitting reports"
              S={S}
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={reportsTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
                <XAxis dataKey="date" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip contentStyle={{ background: S.card, borderRadius: 10, border: `1px solid ${S.border}`, color: S.text, fontSize: 12, fontWeight: 700, boxShadow: S.shadowCard }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Line type="monotone" dataKey="reports" stroke={S.accent} strokeWidth={2.4} dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Reports by Category */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Top Report Categories
          </h4>
          {reportsByCategoryData.length === 0 ? (
            <EmptyChartState 
              icon="📁" 
              message="No categories yet" 
              subtitle="Report categories will be shown here once data is available"
              S={S}
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reportsByCategoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
                <XAxis type="number" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis type="category" dataKey="category" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} width={120} />
                <Tooltip contentStyle={{ background: S.card, borderRadius: 10, border: `1px solid ${S.border}`, color: S.text, fontSize: 12, fontWeight: 700, boxShadow: S.shadowCard }} />
                <Bar dataKey="count" fill={S.accent} radius={[0, 8, 8, 0]} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Health Operations Trend */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Health Operations (14 Days)
          </h4>
          {healthOpsData.every(d => d.admissions === 0 && d.elNinoCases === 0) ? (
            <EmptyChartState 
              icon="🏥" 
              message="No health data yet" 
              subtitle="Hospital admission and El Niño case trends will appear here"
              S={S}
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={healthOpsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
                <XAxis dataKey="date" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip contentStyle={{ background: S.card, borderRadius: 10, border: `1px solid ${S.border}`, color: S.text, fontSize: 12, fontWeight: 700, boxShadow: S.shadowCard }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Line type="monotone" dataKey="admissions" stroke="#d97706" strokeWidth={2.4} name="Total Admissions" dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                <Line type="monotone" dataKey="elNinoCases" stroke="#ef4444" strokeWidth={2.4} name="El Niño Cases" dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Emergency Operations */}
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
            Emergency Operations (14 Days)
          </h4>
          {emergencyOpsData.every(d => d.cdrrmo === 0 && d.bfp === 0 && d.ambulance === 0) ? (
            <EmptyChartState 
              icon="🚨" 
              message="No emergency operations yet" 
              subtitle="CDRRMO, BFP, and ambulance operation data will appear here"
              S={S}
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={emergencyOpsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
                <XAxis dataKey="date" stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis stroke={S.muted} style={{ fontSize: 11, fontWeight: 700 }} />
                <Tooltip contentStyle={{ background: S.card, borderRadius: 10, border: `1px solid ${S.border}`, color: S.text, fontSize: 12, fontWeight: 700, boxShadow: S.shadowCard }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Line type="monotone" dataKey="cdrrmo" stroke="#10b981" strokeWidth={2.4} name="CDRRMO" dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                <Line type="monotone" dataKey="bfp" stroke="#ef4444" strokeWidth={2.4} name="BFP" dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                <Line type="monotone" dataKey="ambulance" stroke="#8b5cf6" strokeWidth={2.4} name="Ambulance" dot={false} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Report Status Distribution */}
      <div style={cardStyle}>
        <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 900, color: S.text }}>
          Report Status Distribution
        </h4>
        {statusDistributionData.every(d => d.value === 0) ? (
          <EmptyChartState 
            icon="📈" 
            message="No status data yet" 
            subtitle="Report status breakdown will be visualized here"
            S={S}
            height={300}
          />
        ) : (
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
              <Tooltip contentStyle={{ background: S.card, borderRadius: 10, border: `1px solid ${S.border}`, color: S.text, fontSize: 12, fontWeight: 700, boxShadow: S.shadowCard }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

/* ── Empty Chart State Component ── */
function EmptyChartState({ icon, message, subtitle, S, height = 250 }) {
  return (
    <div style={{
      height,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px"
    }}>
      <div style={{
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.5
      }}>
        {icon}
      </div>
      <p style={{
        margin: 0,
        fontSize: 14,
        fontWeight: 800,
        color: S.text,
        marginBottom: 4
      }}>
        {message}
      </p>
      <p style={{
        margin: 0,
        fontSize: 12,
        fontWeight: 600,
        color: S.muted,
        textAlign: "center",
        maxWidth: 300
      }}>
        {subtitle}
      </p>
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
    
    // BFP operations are per-operation records, not daily aggregates
    // Count fire incidents and rescue operations for this date
    const bfpOpsForDate = bfpRecords.filter(r => r.operation_date === dateStr);
    const fireIncidents = bfpOpsForDate.filter(r => r.operation_type === 'fire_incident').length;
    const rescueOps = bfpOpsForDate.filter(r => r.operation_type === 'rescue_operation').length;
    
    data.push({
      date: formatDateShort(dateStr),
      cdrrmo: (cdrrmoRecord?.relief_operations || 0) + (cdrrmoRecord?.evacuations_conducted || 0) + (cdrrmoRecord?.emergency_responses || 0),
      bfp: fireIncidents + rescueOps,
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
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: `1px solid ${S.border}`, background: S.cardSubtle, gap: 12, cursor: onClick ? "pointer" : "default", transition: "all 0.15s" }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = S.cardHover || S.accentBg; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = S.cardSubtle; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: st.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {report.photo_url ? <img src={report.photo_url.split(",")[0]} alt="" loading="lazy" width="44" height="44" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FileText size={18} color="#fff" />}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: S.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{report.title}</p>
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

/* ── Reports Tab - WITH PAGINATION ── */
function ReportsTab({ reports, onUpdate, S, cardStyle, inputStyle, selectStyle, onViewReport }) {
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Use pagination hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = usePaginatedReports({
    status: filter !== "all" ? filter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined
  });
  
  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView();
  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Flatten paginated data
  const allReports = data?.pages.flatMap(page => page.data) || [];
  
  // Get unique categories for filter
  const uniqueCategories = [...new Set(allReports.map(r => r.category).filter(Boolean))];

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Category", "Title", "Location", "Status"];
    const tableRows = [];

    allReports.forEach(r => {
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
    doc.text(`Total Reports: ${allReports.length}`, 14, 36);

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
    refetch();
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: 40, height: 40, border: `4px solid ${S.border}`, borderTopColor: S.accent, borderRadius: "50%" }} />
      </div>
    );
  }

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
              {allReports.length}
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
              {allReports.filter(r => r.status === "pending").length}
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
              {allReports.filter(r => r.status === "inprogress").length}
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
              {allReports.filter(r => r.status === "resolved").length}
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

      {/* Reports List Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Citizen Reports</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted, fontWeight: 700 }}>{allReports.length} loaded (scroll for more)</p>
          </div>
          <button onClick={exportToPDF} style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${S.border}`, background: S.cardSubtle, color: S.text, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: S.font, display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = S.card} onMouseLeave={e => e.currentTarget.style.background = S.cardSubtle}>
            <Download size={16} color={S.accent} /> Export PDF
          </button>
        </div>
      
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap", background: S.cardSubtle, padding: 12, borderRadius: 12, border: `1px solid ${S.border}` }}>
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
          {allReports.map(r => <ReportRow key={r.id} report={r} showActions onUpdateStatus={s => updateStatus(r.id, s)} S={S} inputStyle={inputStyle} selectStyle={selectStyle} onClick={() => onViewReport(r)} />)}
          {allReports.length === 0 && <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>No results.</p>}
          
          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} style={{ padding: 20, textAlign: "center" }}>
              {isFetchingNextPage ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ width: 30, height: 30, border: `3px solid ${S.border}`, borderTopColor: S.accent, borderRadius: "50%", margin: "0 auto" }} />
              ) : (
                <p style={{ color: S.muted, fontSize: 12, fontWeight: 700 }}>Scroll for more...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Users Tab ── */
function UsersTab({ categories, departments, S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, showSuccessModal, showErrorModal, showConfirmModal, showToast }) {
  const isDark = S.isDark;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetting, setResetting] = useState(false);

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("admin");
  const [editDept, setEditDept] = useState("All Agencies");
  const [editSaving, setEditSaving] = useState(false);

  // Add Admin Modal state
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);

  // Fallback-resilient toast trigger
  const triggerToast = useCallback((toastOrMsg, type = "success") => {
    if (showToast) {
      showToast(toastOrMsg, type);
    } else {
      const text = typeof toastOrMsg === "string" ? toastOrMsg : (toastOrMsg.message || toastOrMsg.text);
      setMsg({ type: (typeof toastOrMsg === "object" && toastOrMsg.type) ? toastOrMsg.type : type, text });
    }
  }, [showToast]);

  // Open Edit User modal helper
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditRole(user.role === "admin" ? "admin" : (user.role === "superadmin" ? "superadmin" : "admin"));
    if (user.assigned_department && user.assigned_department !== "Not Assigned" && user.assigned_department !== "None") {
      const match = departments.find(d => d.name === user.assigned_department || d.id === user.assigned_department);
      if (match) setEditDept(match.id);
      else setEditDept(user.assigned_department);
    } else {
      setEditDept("All Agencies");
    }
  };

  // Lock background scrolling when any modal in UsersTab is open
  useEffect(() => {
    if (editingUser || addAdminModalOpen || resetOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [editingUser, addAdminModalOpen, resetOpen]);

  // Search & Filter for Directory
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState("all");

  // Orange gradient design tokens
  const ORANGE_GRADIENT = "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)";
  const ORANGE_SHADOW = "0 3px 12px rgba(234, 88, 12, 0.28)";

  // Segmented action hub tab: 'create' | 'promote'
  const [activeActionTab, setActiveActionTab] = useState("create");

  // Create new admin
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("All Agencies");
  const [creating, setCreating] = useState(false);

  // Assign existing
  const [assignEmail, setAssignEmail] = useState("");
  const [assignDept, setAssignDept] = useState("All Agencies");
  const [updatingUser, setUpdatingUser] = useState(false);
  const [msg, setMsg] = useState(null);

  const promoteCardRef = useRef(null);

  const agencyOptions = useMemo(() => {
    const list = departments && departments.length > 0 ? departments : [];
    const ordered = [];
    ORDERED_AGENCIES.forEach(name => {
      const match = list.find(d => d.name?.toUpperCase() === name);
      if (match) {
        ordered.push({ value: match.id, label: match.name });
      } else {
        ordered.push({ value: name, label: name });
      }
    });
    list.forEach(d => {
      if (!ORDERED_AGENCIES.includes(d.name?.toUpperCase())) {
        ordered.push({ value: d.id, label: d.name });
      }
    });
    return ordered;
  }, [departments]);

  const sha256 = async (str) => {
    const buf = new TextEncoder().encode(str.toLowerCase().trim());
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => { 
    if (users.length === 0) setLoading(true); 
    try {
      const superadminsHashes = [
        '980f32df69a604ee31a4ca3a18cfea910de69ef3c496124dc8e19f76c4fa5686',
        'd9d660ee4195a6ac7e0b6a4a4aecbbbf9132683fa17e54383899a07b8671e484',
        '7932b2e116b076a54f452848eaabd5857f61bd957fe8a218faf216f24c9885bb'
      ];
      
      // Load all profiles and admin permissions simultaneously
      const [profilesRes, authUsersRes, permsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.rpc("get_auth_users"),
        supabase.from('admin_module_permissions').select('user_id, module_name, can_view').eq('can_view', true)
      ]);

      const permissionsByUser = {};
      permsRes.data?.forEach(perm => {
        if (!permissionsByUser[perm.user_id]) permissionsByUser[perm.user_id] = [];
        permissionsByUser[perm.user_id].push(perm.module_name);
      });

      // Merge profiles and auth users to guarantee every registered user is shown
      const userMap = new Map();

      (profilesRes.data || []).forEach(p => {
        userMap.set(p.id, {
          id: p.id,
          email: p.email,
          full_name: p.full_name || p.email,
          role: p.role || 'user',
          assigned_department: p.assigned_department,
          created_at: p.created_at,
          updated_at: p.updated_at,
          is_admin: p.is_admin
        });
      });

      (authUsersRes.data || []).forEach(u => {
        if (userMap.has(u.id)) {
          const existing = userMap.get(u.id);
          userMap.set(u.id, {
            ...existing,
            full_name: u.full_name || existing.full_name,
            role: u.role || existing.role,
            assigned_department: u.assigned_department || existing.assigned_department
          });
        } else {
          userMap.set(u.id, {
            id: u.id,
            email: u.email,
            full_name: u.full_name || u.email,
            role: u.role || 'admin',
            assigned_department: u.assigned_department,
            created_at: u.created_at || new Date().toISOString()
          });
        }
      });

      const allUsers = Array.from(userMap.values());

      const mapped = await Promise.all(allUsers.map(async (u) => {
        const hash = await sha256(u.email || "");
        const isSuper = superadminsHashes.includes(hash) || u.role === "superadmin";
        return {
          ...u,
          role: isSuper ? "superadmin" : (u.role === "admin" ? "admin" : "user"),
          modulePermissions: permissionsByUser[u.id] || []
        };
      }));

      // Sort: Superadmin first, then Admin, then Citizen
      mapped.sort((a, b) => {
        const order = { superadmin: 0, admin: 1, user: 2 };
        const roleDiff = (order[a.role] ?? 2) - (order[b.role] ?? 2);
        if (roleDiff !== 0) return roleDiff;
        return (a.full_name || "").localeCompare(b.full_name || "");
      });

      setUsers(mapped);
    } catch (err) {
      logger.error("Failed to load users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getCatsForDept = (deptId) => {
    if (deptId === "All Agencies" || deptId === "All Departments") return ["All Categories"];
    const cats = categories.filter(c => c.department_id === deptId || c.departments?.name === deptId).map(c => c.name);
    return cats.length > 0 ? cats : ["__NONE__"];
  };

  const getDeptLabel = (deptId) => {
    if (deptId === "All Agencies" || deptId === "All Departments") return "All Agencies";
    const d = departments.find(dep => dep.id === deptId || dep.name === deptId);
    return d ? d.name : (deptId || "Unknown");
  };

  const handleCreateAdmin = async (e) => {
    if (e) e.preventDefault();
    if (!newEmail || !newName) return;
    
    const deptLabel = getDeptLabel(newDept);
    setCreating(true);
    setMsg(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          full_name: newName,
          assigned_categories: (newDept === "All Agencies" || newDept === "All Departments") ? ["All Categories"] : getCatsForDept(newDept),
          assigned_department: (newDept === "All Agencies" || newDept === "All Departments") ? null : deptLabel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create admin');
      }

      const successMsg = `Admin account created for "${newName}". A welcome email with login credentials has been sent to ${newEmail}.`;
      
      showSuccessModal("Admin Created!", successMsg);
      triggerToast({
        type: "success",
        title: "Admin Account Created",
        message: `Admin account created for "${newName}" (${newEmail}) assigned to ${deptLabel}.`
      });
      
      setNewEmail("");
      setNewName("");
      setNewDept("All Agencies");
      setAddAdminModalOpen(false);
      await fetchUsers();
    } catch (err) {
      showErrorModal(
        "Creation Failed",
        err.message || "Failed to create admin. Make sure the backend server is running."
      );
      triggerToast({
        type: "error",
        title: "Creation Failed",
        message: err.message || "Failed to create admin."
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAssignExisting = async (e) => {
    if (e) e.preventDefault();
    if (!assignEmail) {
      triggerToast({ type: "error", title: "Missing Email", message: "Please select or enter a user email first." });
      return;
    }
    const existing = users.find(u => u.email?.toLowerCase() === assignEmail.toLowerCase());
    if (!existing) { 
      triggerToast({ type: "error", title: "User Not Found", message: "User must be registered in the app first before being promoted." });
      return; 
    }
    
    const isAlreadyAdmin = existing.role === 'admin' || existing.role === 'superadmin';
    const cats = getCatsForDept(assignDept);
    const deptLabel = getDeptLabel(assignDept);
    const action = isAlreadyAdmin ? 'updated' : 'promoted to admin';
    const agencyText = (!deptLabel || deptLabel === 'All Agencies' || deptLabel === 'All Departments') ? '' : ` and assigned to ${deptLabel}`;

    const confirmTitle = isAlreadyAdmin ? "Confirm Agency Assignment" : "Confirm Admin Promotion";
    const confirmMessage = isAlreadyAdmin
      ? `Are you sure you want to update the agency assignment for "${existing.full_name || assignEmail}" to "${deptLabel || 'All Agencies'}"?`
      : `Are you sure you want to promote "${existing.full_name || assignEmail}" to Admin assigned to "${deptLabel || 'All Agencies'}"?`;
    const actionButtonText = isAlreadyAdmin ? "Update Agency" : "Promote to Admin";

    showConfirmModal(
      confirmTitle,
      confirmMessage,
      async () => {
        setUpdatingUser(true);

        try {
          await supabase.rpc("set_user_role", { 
            target_user_id: existing.id, 
            new_role: "admin", 
            assigned_categories: cats, 
            assigned_department: deptLabel 
          });
          
          await fetchUsers();
          
          const successMsg = `"${existing.full_name || assignEmail}" ${action}${agencyText}.`;
          
          triggerToast({
            type: "success",
            title: isAlreadyAdmin ? "Agency Assignment Updated" : "User Promoted to Admin",
            message: successMsg
          });
          
          setAssignEmail(""); 
          setAssignDept("All Agencies");
          setAddAdminModalOpen(false);
        } catch (error) {
          logger.error('Error updating user:', error);
          triggerToast({
            type: "error",
            title: "Update Failed",
            message: `Failed to update user: ${error.message}`
          });
        } finally {
          setUpdatingUser(false);
        }
      },
      actionButtonText,
      "Cancel"
    );
  };

  const handleSaveEditUser = async (e) => {
    if (e) e.preventDefault();
    if (!editingUser) return;
    
    setEditSaving(true);
    try {
      const isPromotingToAdmin = editRole === "admin";
      const cats = isPromotingToAdmin ? getCatsForDept(editDept) : null;
      const deptLabel = isPromotingToAdmin ? getDeptLabel(editDept) : null;
      const targetRole = editRole === "user" ? null : editRole;

      await supabase.rpc("set_user_role", {
        target_user_id: editingUser.id,
        new_role: targetRole,
        assigned_categories: cats,
        assigned_department: deptLabel
      });

      await fetchUsers();

      const agencyInfo = (!deptLabel || deptLabel === "All Agencies" || deptLabel === "All Departments") 
        ? "" 
        : ` and assigned to ${deptLabel}`;
      const actionText = editRole === "user" 
        ? "demoted to regular citizen" 
        : (editingUser.role === "admin" ? "updated" : "promoted to admin");

      const successText = `"${editingUser.full_name || editingUser.email}" has been ${actionText}${agencyInfo}.`;

      setEditingUser(null);

      showSuccessModal(
        editRole === "user" ? "Role Updated" : (editingUser.role === "admin" ? "Admin Assignment Updated" : "Admin Promoted"),
        successText
      );

      triggerToast({
        type: "success",
        title: editRole === "user" ? "User Role Updated" : (editingUser.role === "admin" ? "Agency Assignment Updated" : "Admin Promotion Successful"),
        message: successText
      });
    } catch (error) {
      logger.error("Error editing user:", error);
      showErrorModal("Update Failed", error.message || "Failed to update user privileges.");
      triggerToast({
        type: "error",
        title: "Update Failed",
        message: error.message || "Failed to update user."
      });
    } finally {
      setEditSaving(false);
    }
  };

  const selectForPromote = (user) => {
    setAssignEmail(user.email);
    if (user.assigned_department && user.assigned_department !== "Not Assigned") {
      const match = departments.find(d => d.name === user.assigned_department || d.id === user.assigned_department);
      if (match) setAssignDept(match.id);
      else setAssignDept(user.assigned_department);
    } else {
      setAssignDept("All Agencies");
    }
    if (promoteCardRef.current) {
      promoteCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const revoke = async (id) => { 
    const target = users.find(u => u.id === id);
    const name = target ? (target.full_name || target.email) : "this user";
    showConfirmModal(
      "Revoke Admin Access",
      `Are you sure you want to revoke admin access for "${name}"? They will return to regular citizen access.`,
      async () => {
        try {
          await supabase.rpc("set_user_role", { target_user_id: id, new_role: null }); 
          await fetchUsers();
          showSuccessModal("Success", `Admin access revoked for "${name}".`);
          triggerToast({
            type: "success",
            title: "Access Revoked",
            message: `Admin access revoked for "${name}".`
          });
        } catch (error) {
          showErrorModal("Error", "Failed to revoke admin access");
          triggerToast({
            type: "error",
            title: "Action Failed",
            message: error.message || "Failed to revoke admin access"
          });
        }
      },
      "Revoke"
    );
  };

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
      const userName = selectedUser.full_name || selectedUser.email;
      const msgText = `Password for "${userName}" has been reset to CLIMA123!`;
      setMsg({ type: "success", text: msgText });
      setResetOpen(false);
      setSelectedUser(null);
      showSuccessModal("Password Reset Successful", msgText);
      triggerToast({
        type: "success",
        title: "Password Reset",
        message: msgText
      });
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to reset password." });
      showErrorModal("Reset Failed", err.message || "Failed to reset password.");
      triggerToast({
        type: "error",
        title: "Reset Failed",
        message: err.message || "Failed to reset password."
      });
    } finally {
      setResetting(false);
    }
  };

  // Directory live filtering
  const filteredUsers = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return users.filter(u => {
      if (directoryRoleFilter === "citizens" && (u.role === "admin" || u.role === "superadmin")) return false;
      if (directoryRoleFilter === "admins" && u.role !== "admin") return false;
      if (directoryRoleFilter === "superadmins" && u.role !== "superadmin") return false;

      if (!q) return true;
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const agency = (u.assigned_department || "").toLowerCase();
      return name.includes(q) || email.includes(q) || agency.includes(q);
    });
  }, [users, directorySearch, directoryRoleFilter]);

  const citizenCount = useMemo(() => users.filter(u => u.role === "user").length, [users]);
  const adminCount = useMemo(() => users.filter(u => u.role === "admin").length, [users]);
  const superadminCount = useMemo(() => users.filter(u => u.role === "superadmin").length, [users]);

  const selectedPromoteUser = useMemo(() => {
    if (!assignEmail) return null;
    return users.find(u => u.email?.toLowerCase() === assignEmail.toLowerCase());
  }, [users, assignEmail]);

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 36, height: 36, border: `3px solid ${S.border}`, borderTopColor: S.accent, borderRadius: "50%", margin: "0 auto 16px" }} />
      <p style={{ color: S.muted, fontWeight: 700, fontSize: 14 }}>Loading registered users & permissions…</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>


      {/* ── 1. Minimalist Interactive KPI Metrics Strip (Unified Card matching Image 2) ── */}
      <div
        style={{
          ...cardStyle,
          borderRadius: 22,
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
          alignItems: "center",
          boxShadow: isDark
            ? "0 4px 20px rgba(0, 0, 0, 0.25)"
            : "0 4px 24px -2px rgba(0, 0, 0, 0.05)",
        }}
      >
        {[
          { id: "all", label: "Total Registered", count: users.length, icon: Users, active: directoryRoleFilter === "all" },
          { id: "citizens", label: "Citizens", count: citizenCount, icon: UserCheck, active: directoryRoleFilter === "citizens" },
          { id: "admins", label: "Agency Admins", count: adminCount, icon: Briefcase, active: directoryRoleFilter === "admins" },
          { id: "superadmins", label: "Superadmins", count: superadminCount, icon: ShieldCheck, active: directoryRoleFilter === "superadmins" },
        ].map((item) => {
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setDirectoryRoleFilter(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 14px",
                borderRadius: 16,
                background: item.active
                  ? (isDark ? "rgba(234, 88, 12, 0.12)" : "rgba(234, 88, 12, 0.05)")
                  : "transparent",
                border: item.active
                  ? "1px solid rgba(234, 88, 12, 0.3)"
                  : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: S.font,
                transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!item.active) {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              {/* Circular Icon Pill with Warm Copper/Amber Accent */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  borderRadius: "50%",
                  background: item.active
                    ? (isDark ? "rgba(234, 88, 12, 0.18)" : "#fff7ed")
                    : (isDark ? "rgba(255, 255, 255, 0.07)" : "#ffffff"),
                  border: item.active
                    ? "2px solid #ea580c"
                    : (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)"),
                  boxShadow: item.active
                    ? "0 2px 10px rgba(234, 88, 12, 0.25)"
                    : (isDark ? "0 2px 8px rgba(0,0,0,0.25)" : "0 2px 10px rgba(0, 0, 0, 0.06)"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <IconComp
                  size={20}
                  style={{
                    color: item.active
                      ? "#ea580c"
                      : (isDark ? "#fb923c" : "#b45309"),
                    transition: "color 0.2s ease",
                  }}
                />
              </div>

              {/* Title & Count Vertical Stack */}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: S.muted,
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: S.text,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {Number(item.count).toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 2. Registered Users Directory (Complete List) ── */}
      <div style={{ ...cardStyle, position: "relative", zIndex: 1, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: S.text }}>Registered Users Directory</h3>
              <Badge variant="secondary" style={{ padding: "3px 10px", fontSize: 11.5, fontWeight: 800 }}>
                {filteredUsers.length} of {users.length} users
              </Badge>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>
              Full directory of citizen accounts and administrative officers registered on CLIMA.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setActiveActionTab("create");
                setAddAdminModalOpen(true);
              }}
              style={{
                ...btnPrimary,
                background: ORANGE_GRADIENT,
                boxShadow: ORANGE_SHADOW,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 800,
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <UserPlus size={14} />
              <span>Create New Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveActionTab("promote");
                setAddAdminModalOpen(true);
              }}
              style={{
                padding: "8px 15px",
                borderRadius: 10,
                border: `1px solid ${S.border}`,
                background: S.cardSubtle,
                color: S.text,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <UserCheck size={14} />
              <span>Promote / Reassign</span>
            </button>

            <button
              type="button"
              onClick={fetchUsers}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${S.border}`,
                background: S.cardSubtle,
                color: S.muted,
                fontSize: 12.5,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
              title="Refresh Directory"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Search & Role Filter Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {/* Live Search Input */}
          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: S.muted }} />
            <input
              value={directorySearch}
              onChange={e => setDirectorySearch(e.target.value)}
              placeholder="Search directory by name, email, or agency…"
              style={{
                ...inputStyle,
                paddingLeft: 38,
                paddingRight: directorySearch ? 32 : 12,
                height: 40,
                fontSize: 13,
                borderRadius: 12,
              }}
            />
            {directorySearch && (
              <button
                type="button"
                onClick={() => setDirectorySearch("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: S.muted,
                  padding: 2,
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Minimalist Role Filter Tabs */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            padding: 3,
            borderRadius: 9999,
            background: S.cardSubtle,
            border: `1px solid ${S.border}`,
            gap: 2,
          }}>
            {[
              { id: "all", label: "All Users", count: users.length },
              { id: "citizens", label: "Citizens", count: citizenCount },
              { id: "admins", label: "Admins", count: adminCount },
              { id: "superadmins", label: "Superadmins", count: superadminCount },
            ].map(tab => {
              const active = directoryRoleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDirectoryRoleFilter(tab.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 9999,
                    border: "none",
                    background: active ? ORANGE_GRADIENT : "transparent",
                    color: active ? "#ffffff" : S.muted,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: active ? "0 2px 8px rgba(234, 88, 12, 0.25)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimalist Users Directory Table */}
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: S.cardSubtle, borderRadius: 14, border: `1px dashed ${S.border}` }}>
            <UserIcon size={36} style={{ margin: "0 auto 10px", color: S.muted, opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: S.text }}>No users found</p>
            <p style={{ margin: "4px 0 12px", fontSize: 12.5, color: S.muted }}>No user account matched your search criteria.</p>
            {directorySearch && (
              <button
                type="button"
                onClick={() => setDirectorySearch("")}
                style={{
                  ...btnPrimary,
                  background: ORANGE_GRADIENT,
                  boxShadow: ORANGE_SHADOW,
                  padding: "6px 16px",
                  fontSize: 12,
                }}
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              border: `1px solid ${S.border}`,
              borderRadius: 16,
              background: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 720 }}>
                {/* Minimalist Column Header Row (displayed once at top) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(340px, 2.6fr) minmax(170px, 1.3fr) minmax(130px, 1fr) minmax(110px, 0.8fr)",
                    padding: "10px 18px",
                    background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                    borderBottom: `1px solid ${S.border}`,
                    fontSize: 11,
                    fontWeight: 800,
                    color: S.muted,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    alignItems: "center",
                  }}
                >
                  <span>User</span>
                  <span>Assigned Agency</span>
                  <span>Modules Access</span>
                  <span style={{ textAlign: "right" }}>Actions</span>
                </div>

                {/* Directory Rows */}
                {filteredUsers.map((u, index) => {
                  const moduleCount = u.modulePermissions?.length || 0;
                  const moduleLabel = u.role === 'superadmin' 
                    ? 'All Modules' 
                    : moduleCount === 0 
                      ? 'No Access' 
                      : `${moduleCount} Module${moduleCount > 1 ? 's' : ''}`;
                  
                  const rawAgency = u.assigned_department;
                  const assignedAgency = (!rawAgency || rawAgency === 'All Departments' || rawAgency === 'All Agencies' || rawAgency === 'Not Assigned')
                    ? (u.role === 'superadmin' ? 'All Agencies (Superadmin)' : 'None')
                    : rawAgency;

                  const isCitizen = u.role === 'user';
                  const isAdmin = u.role === 'admin';
                  const isSuper = u.role === 'superadmin';

                  return (
                    <div
                      key={u.id || u.email}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(340px, 2.6fr) minmax(170px, 1.3fr) minmax(130px, 1fr) minmax(110px, 0.8fr)",
                        padding: "10px 18px",
                        alignItems: "center",
                        borderBottom: index < filteredUsers.length - 1 ? `1px solid ${S.border}` : "none",
                        background: "transparent",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Column 1: User Profile Info (All Inline & Minimalist) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                          paddingRight: 12,
                        }}
                        title={u.created_at ? `Joined ${formatDate(u.created_at)}` : undefined}
                      >
                        {/* Minimalist Avatar */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            minWidth: 32,
                            borderRadius: "50%",
                            background: isSuper
                              ? (isDark ? "rgba(234, 88, 12, 0.14)" : "#fff7ed")
                              : (isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9"),
                            border: isSuper
                              ? "1px solid rgba(234, 88, 12, 0.3)"
                              : `1px solid ${S.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 11.5,
                            color: isSuper ? "#ea580c" : S.text,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(u.full_name, u.email)}
                        </div>

                        {/* Name & Email Stack */}
                        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 13,
                                color: S.text,
                                letterSpacing: "-0.01em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {u.full_name || "Citizen User"}
                            </span>

                            {/* Minimalist Inline Role Pill */}
                            {isSuper ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3.5,
                                  padding: "1.5px 7px",
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: 750,
                                  background: "rgba(234, 88, 12, 0.08)",
                                  color: "#ea580c",
                                  border: "1px solid rgba(234, 88, 12, 0.22)",
                                  flexShrink: 0,
                                }}
                              >
                                <ShieldCheck size={10} />
                                <span>Superadmin</span>
                              </span>
                            ) : isAdmin ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3.5,
                                  padding: "1.5px 7px",
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: S.muted,
                                  background: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
                                  border: `1px solid ${S.border}`,
                                  flexShrink: 0,
                                }}
                              >
                                <Shield size={10} />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "1.5px 7px",
                                  borderRadius: 6,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: S.muted,
                                  background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
                                  flexShrink: 0,
                                }}
                              >
                                Citizen
                              </span>
                            )}
                          </div>

                          {/* Email under Name */}
                          <span
                            style={{
                              fontSize: 11.5,
                              color: S.muted,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              minWidth: 0,
                            }}
                            title={u.email}
                          >
                            {u.email}
                          </span>
                        </div>
                      </div>

                      {/* Column 2: Assigned Agency */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 10 }}>
                        <Building
                          size={13}
                          style={{
                            flexShrink: 0,
                            color: assignedAgency === 'None' ? S.muted : (isSuper ? "#ea580c" : S.muted),
                            opacity: assignedAgency === 'None' ? 0.4 : 0.8,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: assignedAgency === 'None' ? 500 : 700,
                            color: assignedAgency === 'None' ? S.muted : (isSuper ? "#ea580c" : S.text),
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {assignedAgency}
                        </span>
                      </div>

                      {/* Column 3: Modules Access */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {isSuper ? (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 750,
                              color: "#ea580c",
                              background: "rgba(234, 88, 12, 0.08)",
                              padding: "2.5px 8px",
                              borderRadius: 6,
                              border: "1px solid rgba(234, 88, 12, 0.2)",
                            }}
                          >
                            All Modules
                          </span>
                        ) : isAdmin ? (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 650,
                              color: moduleCount === 0 ? S.muted : S.text,
                              background: moduleCount === 0 ? "transparent" : (isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9"),
                              padding: moduleCount === 0 ? "0" : "2.5px 8px",
                              borderRadius: 6,
                              border: moduleCount === 0 ? "none" : `1px solid ${S.border}`,
                            }}
                          >
                            {moduleLabel}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: S.muted }}>—</span>
                        )}
                      </div>

                      {/* Column 4: Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        {isCitizen && (
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            style={{
                              ...btnPrimary,
                              background: ORANGE_GRADIENT,
                              boxShadow: "0 2px 8px rgba(234, 88, 12, 0.2)",
                              padding: "5px 12px",
                              fontSize: 11.5,
                              fontWeight: 700,
                              gap: 4,
                              height: 30,
                              borderRadius: 8,
                            }}
                            title="Promote citizen to admin"
                          >
                            <UserCheck size={12} />
                            <span>Promote</span>
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: `1px solid ${S.border}`,
                                background: "transparent",
                                color: S.text,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              title="Edit Admin Role & Agency Assignment"
                              onMouseEnter={e => {
                                e.currentTarget.style.color = "#ea580c";
                                e.currentTarget.style.borderColor = "rgba(234, 88, 12, 0.4)";
                                e.currentTarget.style.background = isDark ? "rgba(234, 88, 12, 0.1)" : "rgba(234, 88, 12, 0.05)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = S.text;
                                e.currentTarget.style.borderColor = S.border;
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSelectedUser(u); setResetOpen(true); }}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: `1px solid ${S.border}`,
                                background: "transparent",
                                color: S.muted,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              title="Reset Password"
                              onMouseEnter={e => {
                                e.currentTarget.style.color = "#d97706";
                                e.currentTarget.style.borderColor = "rgba(217, 119, 6, 0.4)";
                                e.currentTarget.style.background = isDark ? "rgba(217, 119, 6, 0.1)" : "rgba(217, 119, 6, 0.05)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = S.muted;
                                e.currentTarget.style.borderColor = S.border;
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <Key size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                revoke(u.id);
                              }}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                border: `1px solid ${S.border}`,
                                background: "transparent",
                                color: S.muted,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              title="Revoke Admin Access"
                              onMouseEnter={e => {
                                e.currentTarget.style.color = "#dc2626";
                                e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.4)";
                                e.currentTarget.style.background = isDark ? "rgba(220, 38, 38, 0.1)" : "rgba(220, 38, 38, 0.05)";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = S.muted;
                                e.currentTarget.style.borderColor = S.border;
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}

                        {isSuper && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: S.muted,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                            }}
                            title="Root account is protected"
                          >
                            <ShieldCheck size={11} style={{ opacity: 0.6 }} />
                            <span>Protected Root</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals for UsersTab rendered into document.body portal to guarantee full-screen overlay */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
        {/* Reset Password Modal */}
        {resetOpen && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setResetOpen(false);
            }}
            style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 99999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 16, width: "100%", maxWidth: 425, padding: 24, boxShadow: S.shadowCard, fontFamily: S.font }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#d97706", marginBottom: 12 }}>
                <ShieldAlert size={24} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#d97706" }}>Reset User Password</h3>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: S.text }}>
                Are you sure you want to reset the password for <strong style={{ fontWeight: 800 }}>{selectedUser.full_name || selectedUser.email}</strong>?
              </p>
              <div style={{ background: isDark ? "rgba(217, 119, 6, 0.12)" : "#fffbeb", border: isDark ? "1px solid rgba(217, 119, 6, 0.25)" : "1px solid #fef3c7", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: isDark ? "#fcd34d" : "#92400e" }}>
                Their password will be set to: <strong style={{ background: isDark ? "rgba(217, 119, 6, 0.25)" : "#fef3c7", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 14, color: isDark ? "#fde68a" : "#92400e" }}>CLIMA123!</strong>
                <br /><br />
                They will be locked out of their account until they log in with this temporary password and choose a new one.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setResetOpen(false)} disabled={resetting} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${S.border}`, background: S.cardSubtle, fontWeight: 800, cursor: "pointer", color: S.muted }}>Cancel</button>
                <button onClick={confirmReset} disabled={resetting} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#d97706", color: "#fff", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {resetting ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingUser(null)}
            style={{
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 99999,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: S.card,
                border: `1px solid ${S.borderMedium}`,
                borderRadius: 20,
                width: "100%",
                maxWidth: 480,
                padding: 24,
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.75)" : "0 20px 60px rgba(0,0,0,0.2)",
                fontFamily: S.font,
                color: S.text
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: editingUser.role === 'user' ? `${S.accent}20` : "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: editingUser.role === 'user' ? S.accent : "#f59e0b"
                  }}>
                    {editingUser.role === 'user' ? <UserCheck size={20} /> : <Edit2 size={18} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: S.text }}>
                      {editingUser.role === 'user' ? "Promote Citizen to Admin" : "Edit Admin Role & Agency"}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: S.muted }}>
                      Configure administrative privileges and agency assignment
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: S.muted,
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    borderRadius: 6,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* User preview card */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 12,
                background: S.cardSubtle,
                border: `1px solid ${S.border}`,
                marginBottom: 18
              }}>
                <Avatar className="h-11 w-11 text-xs font-black shrink-0">
                  <AvatarFallback>{getInitials(editingUser.full_name, editingUser.email)}</AvatarFallback>
                </Avatar>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: S.text }}>
                      {editingUser.full_name || "Citizen User"}
                    </span>
                    <Badge variant={editingUser.role === "admin" ? "warning" : "secondary"} className="text-[10px] font-black uppercase py-0.5">
                      {editingUser.role === "admin" ? "Admin" : "Citizen"}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 12, color: S.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <Mail size={12} /> {editingUser.email}
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Account Privilege Tier
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setEditRole("admin")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1.5px solid ${editRole === "admin" ? S.accent : S.border}`,
                        background: editRole === "admin" ? `${S.accent}12` : S.cardSubtle,
                        color: editRole === "admin" ? S.accent : S.text,
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Shield size={16} /> Admin Officer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole("user")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1.5px solid ${editRole === "user" ? S.accent : S.border}`,
                        background: editRole === "user" ? `${S.accent}12` : S.cardSubtle,
                        color: editRole === "user" ? S.accent : S.text,
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <UserIcon size={16} /> Regular Citizen
                    </button>
                  </div>
                </div>

                {editRole === "admin" && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Assigned Agency
                    </label>
                    <CustomSelect
                      value={editDept}
                      onChange={setEditDept}
                      options={[{ value: "All Agencies", label: "All Agencies (Superadmin)" }, ...agencyOptions]}
                      accent={S.accent}
                      isDark={S.isDark}
                    />
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: S.muted }}>
                      Admin will have operational authority for incident reports belonging to this agency.
                    </p>
                  </div>
                )}

                {editRole === "user" && (
                  <div style={{
                    padding: 12,
                    borderRadius: 10,
                    background: isDark ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
                    border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.25)" : "#fecaca"}`,
                    fontSize: 12,
                    color: isDark ? "#fca5a5" : "#dc2626",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Demoting this user to Regular Citizen will immediately revoke all administrative privileges, dashboard access, and agency assignments.</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editSaving}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: `1px solid ${S.border}`,
                    background: S.cardSubtle,
                    color: S.text,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditUser}
                  disabled={editSaving}
                  style={{
                    ...btnPrimary,
                    padding: "9px 20px",
                    fontSize: 13,
                    opacity: editSaving ? 0.6 : 1,
                  }}
                >
                  {editSaving ? "Saving Changes…" : (editingUser.role === 'user' && editRole === 'admin' ? "Promote to Admin" : "Save Changes")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Unified Admin Role & Agency Management Modal */}
        {addAdminModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setAddAdminModalOpen(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 99999,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: S.card,
                border: `1px solid ${S.borderMedium}`,
                borderRadius: 20,
                width: "100%",
                maxWidth: 520,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.75)" : "0 20px 60px rgba(0,0,0,0.2)",
                fontFamily: S.font,
                color: S.text
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(234, 88, 12, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ea580c"
                  }}>
                    {activeActionTab === "create" ? <UserPlus size={20} /> : <UserCheck size={20} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: S.text }}>
                      {activeActionTab === "create" ? "Create New Admin" : "Promote / Reassign User"}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: S.muted }}>
                      {activeActionTab === "create"
                        ? "Register a brand new administrator account on CLIMA"
                        : "Assign administrative privileges to a citizen or update agency assignment"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddAdminModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: S.muted,
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    borderRadius: 6,
                    outline: "none",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              {activeActionTab === "create" ? (
                <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Full Name
                      </label>
                      <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. Juan Dela Cruz"
                        required
                        style={{ ...inputStyle, height: 42 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Official Email
                      </label>
                      <input
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="admin@palayan.gov.ph"
                        required
                        type="email"
                        style={{ ...inputStyle, height: 42 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Assigned Agency
                      </label>
                      <CustomSelect
                        value={newDept}
                        onChange={setNewDept}
                        options={[{ value: "All Agencies", label: "All Agencies (Superadmin)" }, ...agencyOptions]}
                        accent={S.accent}
                        isDark={S.isDark}
                      />
                    </div>

                    <div style={{
                      padding: 12,
                      borderRadius: 10,
                      background: S.cardSubtle,
                      border: `1px solid ${S.border}`,
                      fontSize: 12,
                      color: S.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <Mail size={15} style={{ flexShrink: 0, color: "#ea580c" }} />
                      <span>A welcome email with automated temporary password will be sent automatically.</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4, paddingTop: 14, borderTop: `1px solid ${S.border}` }}>
                    <button
                      type="button"
                      onClick={() => setAddAdminModalOpen(false)}
                      disabled={creating}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 10,
                        border: `1px solid ${S.border}`,
                        background: S.cardSubtle,
                        color: S.text,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      style={{
                        ...btnPrimary,
                        background: ORANGE_GRADIENT,
                        boxShadow: ORANGE_SHADOW,
                        padding: "9px 22px",
                        fontSize: 13,
                        opacity: creating ? 0.7 : 1,
                        cursor: creating ? "not-allowed" : "pointer",
                        outline: "none",
                      }}
                    >
                      <Plus size={16} />
                      <span>{creating ? "Creating Admin…" : "Create Admin Account"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAssignExisting} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Select Registered Citizen or Admin
                      </label>
                      <UserCombobox
                        users={users}
                        value={assignEmail}
                        onChange={(email, user) => {
                          setAssignEmail(email);
                          if (user?.assigned_department && user.assigned_department !== "Not Assigned") {
                            const match = departments.find(d => d.name === user.assigned_department || d.id === user.assigned_department);
                            if (match) setAssignDept(match.id);
                            else setAssignDept(user.assigned_department);
                          }
                        }}
                        isDark={isDark}
                        accent={S.accent}
                        placeholder="Search registered citizen by name or email…"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Designated Agency Assignment
                      </label>
                      <CustomSelect
                        value={assignDept}
                        onChange={setAssignDept}
                        options={[{ value: "All Agencies", label: "All Agencies" }, ...agencyOptions]}
                        accent={S.accent}
                        isDark={S.isDark}
                      />
                    </div>

                    <div style={{
                      padding: 12,
                      borderRadius: 10,
                      background: S.cardSubtle,
                      border: `1px solid ${S.border}`,
                      fontSize: 12,
                      color: S.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <Shield size={15} style={{ flexShrink: 0, color: "#ea580c" }} />
                      <span>Promoting a citizen grants immediate agency admin dashboard access and module permissions.</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4, paddingTop: 14, borderTop: `1px solid ${S.border}` }}>
                    <button
                      type="button"
                      onClick={() => setAddAdminModalOpen(false)}
                      disabled={updatingUser}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 10,
                        border: `1px solid ${S.border}`,
                        background: S.cardSubtle,
                        color: S.text,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingUser}
                      style={{
                        ...btnPrimary,
                        background: ORANGE_GRADIENT,
                        boxShadow: ORANGE_SHADOW,
                        padding: "9px 22px",
                        fontSize: 13,
                        opacity: updatingUser ? 0.7 : 1,
                        cursor: updatingUser ? "not-allowed" : "pointer",
                        outline: "none",
                      }}
                    >
                      {updatingUser ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <UserCheck size={15} />
                      )}
                      <span>
                        {updatingUser
                          ? (selectedPromoteUser?.role === 'admin' ? "Updating Agency…" : "Promoting to Admin…")
                          : (selectedPromoteUser?.role === 'admin' ? "Update Agency Assignment" : "Promote to Admin")
                        }
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab({ departments, categories, onUpdate, S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, showSuccessModal, showErrorModal, showConfirmModal, showToast, isSuperadmin }) {
  const [catName, setCatName] = useState("");
  const [catGroup, setCatGroup] = useState("");
  const [catDept, setCatDept] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // Search & Filter state for categories
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState("ALL");

  // Module permissions state
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [userPermissions, setUserPermissions] = useState({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Orange gradient design tokens (matching UsersTab)
  const ORANGE_GRADIENT = "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)";
  const ORANGE_SHADOW = "0 3px 12px rgba(234, 88, 12, 0.28)";

  const agencyOptions = useMemo(() => {
    const list = departments && departments.length > 0 ? departments : [];
    const ordered = [];
    ORDERED_AGENCIES.forEach(name => {
      const match = list.find(d => d.name?.toUpperCase() === name);
      if (match) {
        ordered.push({ value: match.id, label: match.name, color: match.accent_color || DEPT_DEFAULTS[name] || "#f97316" });
      } else {
        ordered.push({ value: name, label: name, color: DEPT_DEFAULTS[name] || "#f97316" });
      }
    });
    list.forEach(d => {
      if (!ORDERED_AGENCIES.includes(d.name?.toUpperCase())) {
        ordered.push({ value: d.id, label: d.name, color: d.accent_color || "#f97316" });
      }
    });
    return ordered;
  }, [departments]);

  // Load admin users with their permissions (superadmin only)
  useEffect(() => {
    if (isSuperadmin) {
      loadAdminUsers();
    }
  }, [isSuperadmin]);

  const loadAdminUsers = async () => {
    try {
      // 1. Fetch admin profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, assigned_department, role")
        .eq("role", "admin")
        .order("full_name");

      if (profilesError) {
        logger.warn("Profiles fetch warning:", profilesError);
      }

      // 2. Also query get_auth_users RPC to ensure complete administrator discovery
      let rpcAdmins = [];
      try {
        const { data: rpcUsers } = await supabase.rpc("get_auth_users");
        if (rpcUsers && Array.isArray(rpcUsers)) {
          rpcAdmins = rpcUsers.filter(u => u.role === "admin");
        }
      } catch (e) {
        logger.warn("get_auth_users RPC fallback:", e);
      }

      // Merge by user id (preferring non-empty values)
      const adminMap = new Map();
      (rpcAdmins || []).forEach(u => adminMap.set(u.id, {
        id: u.id,
        full_name: u.full_name || u.email,
        email: u.email,
        assigned_department: u.assigned_department,
        role: "admin"
      }));

      (profiles || []).forEach(p => {
        const existing = adminMap.get(p.id) || {};
        adminMap.set(p.id, {
          id: p.id,
          full_name: p.full_name || existing.full_name || p.email,
          email: p.email || existing.email,
          assigned_department: p.assigned_department || existing.assigned_department,
          role: "admin"
        });
      });

      const adminsList = Array.from(adminMap.values());
      setAdminUsers(adminsList);

      // Fetch all permissions
      const { data: perms, error: permsError } = await supabase
        .from("admin_module_permissions")
        .select("*");

      if (permsError) {
        logger.warn("Permissions fetch warning:", permsError);
      }

      // Group permissions by user_id
      const permsByUser = {};
      (perms || []).forEach(p => {
        if (!permsByUser[p.user_id]) permsByUser[p.user_id] = {};
        permsByUser[p.user_id][p.module_name] = {
          can_view: !!p.can_view,
          can_create: !!p.can_create,
          can_edit: !!p.can_edit,
          can_delete: !!p.can_delete
        };
      });
      setUserPermissions(permsByUser);
    } catch (err) {
      logger.error("Error loading admin users:", err);
      showErrorModal("Error", "Failed to load admin users: " + (err?.message || "Unknown error"));
    }
  };

  const MODULES = useMemo(() => [
    { name: "reports", label: "Citizen Reports", desc: "Citizen incident filings, dispatches & triage", icon: FileText },
    { name: "advisories", label: "Advisory Broadcast", desc: "Public announcements & official warnings", icon: Megaphone },
    { name: "hospital", label: "Hospital Monitoring", desc: "El Niño health impacts & hospital telemetry", icon: HeartPulse },
    { name: "cdrrmo", label: "CDRRMO Operations", desc: "Disaster responses, relief & evacuations", icon: ShieldAlert },
    { name: "bfp", label: "BFP Operations", desc: "Fire response, incidents & hazard inspections", icon: Flame },
    { name: "agriculture", label: "Agriculture Damages", desc: "Farm damage assessments & drought monitoring", icon: Sprout },
    { name: "water", label: "Water Interruptions", desc: "PCWD service notices & water tanker routing", icon: Droplet },
    { name: "power", label: "Power Interruptions", desc: "NEECO grid blackouts & power restorations", icon: Zap },
    { name: "users", label: "User Management", desc: "Citizen accounts & admin role assignments", icon: Users },
    { name: "settings", label: "Settings & Categories", desc: "Issue categories, routing & system preferences", icon: Settings },
    { name: "logs", label: "Activity Logs", desc: "Security audit logs & system history", icon: Activity }
  ], []);

  const ROLE_TEMPLATES = useMemo(() => ({
    "Agriculture Admin": { modules: ["agriculture"], icon: Sprout, color: "#16a34a" },
    "CDRRMO Admin": { modules: ["cdrrmo"], icon: ShieldAlert, color: "#dc2626" },
    "BFP Admin": { modules: ["bfp"], icon: Flame, color: "#ef4444" },
    "Hospital Admin": { modules: ["hospital"], icon: HeartPulse, color: "#0891b2" },
    "Water Admin": { modules: ["water"], icon: Droplet, color: "#2563eb" },
    "Power Admin": { modules: ["power"], icon: Zap, color: "#f59e0b" },
    "Reports Manager": { modules: ["reports", "advisories"], icon: FileText, color: "#8b5cf6" },
    "Full Module Access": { modules: MODULES.map(m => m.name), icon: Shield, color: "#10b981" }
  }), [MODULES]);

  const applyTemplate = async (userId, templateName) => {
    if (!userId) return;
    const templateConfig = ROLE_TEMPLATES[templateName];
    const modules = templateConfig?.modules || templateConfig;
    if (!modules) return;

    setLoadingPermissions(true);
    try {
      await supabase
        .from("admin_module_permissions")
        .delete()
        .eq("user_id", userId);

      const newPerms = modules.map(module => ({
        user_id: userId,
        module_name: module,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true
      }));

      const { error } = await supabase
        .from("admin_module_permissions")
        .insert(newPerms);

      if (error) throw error;

      await loadAdminUsers();
      setIsPresetModalOpen(false);
      showSuccessModal("Template Applied", `Applied "${templateName}" access package successfully.`);
      showToast?.({
        type: "success",
        title: "Template Applied",
        message: `Applied "${templateName}" access package successfully.`
      });
    } catch (err) {
      logger.error("Error applying template:", err);
      showErrorModal("Error", "Failed to apply template");
      showToast?.({
        type: "error",
        title: "Template Error",
        message: "Failed to apply access template."
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const toggleModulePermission = async (userId, moduleName, permType) => {
    setLoadingPermissions(true);
    try {
      const currentPerms = userPermissions[userId]?.[moduleName] || {};
      const newValue = !currentPerms[permType];

      const { data: existing } = await supabase
        .from("admin_module_permissions")
        .select("id")
        .eq("user_id", userId)
        .eq("module_name", moduleName)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("admin_module_permissions")
          .update({ [permType]: newValue })
          .eq("user_id", userId)
          .eq("module_name", moduleName);
      } else {
        await supabase
          .from("admin_module_permissions")
          .insert({
            user_id: userId,
            module_name: moduleName,
            can_view: permType === "can_view" ? newValue : false,
            can_create: permType === "can_create" ? newValue : false,
            can_edit: permType === "can_edit" ? newValue : false,
            can_delete: permType === "can_delete" ? newValue : false
          });
      }

      await loadAdminUsers();
    } catch (err) {
      logger.error("Error toggling permission:", err);
      showErrorModal("Error", "Failed to update permission");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const toggleAllModuleCrud = async (userId, moduleName) => {
    setLoadingPermissions(true);
    try {
      const currentPerms = userPermissions[userId]?.[moduleName] || {};
      const allActive = currentPerms.can_view && currentPerms.can_create && currentPerms.can_edit && currentPerms.can_delete;
      const targetState = !allActive;

      const { data: existing } = await supabase
        .from("admin_module_permissions")
        .select("id")
        .eq("user_id", userId)
        .eq("module_name", moduleName)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("admin_module_permissions")
          .update({
            can_view: targetState,
            can_create: targetState,
            can_edit: targetState,
            can_delete: targetState
          })
          .eq("user_id", userId)
          .eq("module_name", moduleName);
      } else {
        await supabase
          .from("admin_module_permissions")
          .insert({
            user_id: userId,
            module_name: moduleName,
            can_view: targetState,
            can_create: targetState,
            can_edit: targetState,
            can_delete: targetState
          });
      }

      await loadAdminUsers();
    } catch (err) {
      logger.error("Error updating all permissions:", err);
      showErrorModal("Error", "Failed to update module permissions");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const grantAllPermissions = async (userId) => {
    await applyTemplate(userId, "Full Module Access");
  };

  const revokeAllPermissions = async (userId) => {
    showConfirmModal(
      "Revoke All Module Permissions",
      "Remove all operational module permissions for this admin officer? They will no longer be able to view, create, edit, or delete records in any module.",
      async () => {
        setLoadingPermissions(true);
        try {
          await supabase
            .from("admin_module_permissions")
            .delete()
            .eq("user_id", userId);
          
          await loadAdminUsers();
          showSuccessModal("Revoked", "All module permissions removed successfully.");
        } catch (err) {
          logger.error("Error revoking permissions:", err);
          showErrorModal("Error", "Failed to revoke permissions");
        } finally {
          setLoadingPermissions(false);
        }
      },
      "Revoke All"
    );
  };

  const addCat = async (e) => {
    e.preventDefault();
    const resolvedGroup = catGroup === "__NEW__" ? newGroupName.trim() : catGroup.trim();
    if (!catName.trim() || !resolvedGroup) return;

    setIsSubmittingCat(true);
    try {
      const insert = { name: catName.trim(), group_name: resolvedGroup };
      if (catDept) insert.department_id = catDept;
      const { error } = await supabase.from("categories").insert(insert);
      if (error) throw error;

      setCatName(""); 
      setCatGroup(""); 
      setNewGroupName(""); 
      setCatDept("");
      setIsAddCategoryModalOpen(false);
      onUpdate();
      showToast?.({
        type: "success",
        title: "Category Created",
        message: `Category "${insert.name}" created successfully.`
      });
    } catch (err) {
      logger.error("Failed to add category:", err);
      showErrorModal("Error", "Failed to add category: " + (err?.message || "Unknown error"));
      showToast?.({
        type: "error",
        title: "Category Error",
        message: err?.message || "Failed to add category."
      });
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const delCat = async (id, name) => { 
    showConfirmModal(
      "Delete Category",
      `Are you sure you want to delete the category "${name || 'this category'}"? This action cannot be undone and may affect active report filings.`,
      async () => {
        try {
          const { error } = await supabase.from("categories").delete().eq("id", id); 
          if (error) throw error;
          onUpdate();
          showToast?.({
            type: "success",
            title: "Category Deleted",
            message: `Category "${name || ''}" deleted successfully.`
          });
        } catch (error) {
          logger.error("Failed to delete category:", error);
          showErrorModal("Error", "Failed to delete category: " + (error?.message || "Unknown error"));
          showToast?.({
            type: "error",
            title: "Delete Failed",
            message: error?.message || "Failed to delete category."
          });
        }
      },
      "Delete",
      "Cancel",
      { itemName: name || "Category" }
    );
  };

  const [seedingCategories, setSeedingCategories] = useState(false);

  const seedDefaultCategories = async () => {
    setSeedingCategories(true);
    try {
      const getDeptId = (deptName) => {
        const found = (departments || []).find(d => d.name?.toUpperCase() === deptName.toUpperCase());
        return found ? found.id : null;
      };

      const defaultCats = [
        { name: "Obstructed Sidewalks", group_name: "Public Safety", icon_name: "ShieldAlert", department_id: getDeptId("CDRRMO") },
        { name: "Public Safety Concerns", group_name: "Public Safety", icon_name: "ShieldAlert", department_id: getDeptId("CDRRMO") },
        { name: "Fire Hazard or Grassfire", group_name: "Public Safety", icon_name: "Flame", department_id: getDeptId("BFP") },
        { name: "Drought & Crop Damage", group_name: "Agriculture", icon_name: "Sprout", department_id: getDeptId("AGRI") },
        { name: "Livestock Heat Stress", group_name: "Agriculture", icon_name: "Dog", department_id: getDeptId("AGRI") },
        { name: "Water Supply Interruption", group_name: "Utilities", icon_name: "Droplet", department_id: getDeptId("PCWD") },
        { name: "Water Tanker Request", group_name: "Utilities", icon_name: "Truck", department_id: getDeptId("PCWD") },
        { name: "Power Outage or Sparking Line", group_name: "Utilities", icon_name: "Zap", department_id: getDeptId("NEECO") },
        { name: "Hospital Emergency Telemetry", group_name: "Health Services", icon_name: "HeartPulse", department_id: getDeptId("PCH") },
        { name: "Heat Exhaustion / Stroke", group_name: "Health Services", icon_name: "HeartPulse", department_id: getDeptId("PCH") },
        { name: "Streetlights for Repair", group_name: "General Services", icon_name: "Wrench", department_id: null },
        { name: "Uncollected Garbage / Declogging", group_name: "General Services", icon_name: "Trash2", department_id: null }
      ];

      const { error } = await supabase.from("categories").insert(defaultCats);
      if (error) throw error;
      await onUpdate?.();
      showSuccessModal("Categories Initialized", `${defaultCats.length} standard citizen categories have been loaded and linked.`);
      showToast?.({
        type: "success",
        title: "Standard Categories Loaded",
        message: `${defaultCats.length} standard categories initialized successfully.`
      });
    } catch (err) {
      logger.error("Error seeding categories:", err);
      showErrorModal("Error", "Failed to initialize categories: " + (err?.message || "Unknown error"));
    } finally {
      setSeedingCategories(false);
    }
  };

  // Get unique group names for suggestions
  const existingGroups = useMemo(() => {
    return [...new Set(categories.map(c => c.group_name).filter(Boolean))];
  }, [categories]);

  // Filtered categories according to search and agency filter
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const q = categorySearch.toLowerCase().trim();
      const matchesSearch = !q || (
        c.name?.toLowerCase().includes(q) ||
        c.group_name?.toLowerCase().includes(q) ||
        c.departments?.name?.toLowerCase().includes(q)
      );

      const deptName = c.departments?.name?.toUpperCase() || "";
      const matchesAgency = selectedAgencyFilter === "ALL" 
        ? true 
        : selectedAgencyFilter === "UNASSIGNED" 
          ? !c.department_id && !deptName
          : deptName === selectedAgencyFilter;

      return matchesSearch && matchesAgency;
    });
  }, [categories, categorySearch, selectedAgencyFilter]);

  // Filtered admin users for module permissions
  const filteredAdmins = useMemo(() => {
    if (!adminSearch.trim()) return adminUsers;
    const q = adminSearch.toLowerCase().trim();
    return adminUsers.filter(u => 
      u.full_name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) ||
      (u.assigned_department || u.department)?.toLowerCase().includes(q)
    );
  }, [adminUsers, adminSearch]);

  const activeAdminsCount = useMemo(() => {
    return adminUsers.filter(u => {
      const perms = userPermissions[u.id] || {};
      return Object.values(perms).some(p => p.can_view || p.can_create || p.can_edit || p.can_delete);
    }).length;
  }, [adminUsers, userPermissions]);

  const noAccessAdminsCount = adminUsers.length - activeAdminsCount;
  const linkedCategoriesCount = useMemo(() => categories.filter(c => c.department_id || c.departments?.name).length, [categories]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      {/* ── 1. Module Permissions Section (Superadmin Only) ── */}
      {isSuperadmin && (
        <div style={{ ...cardStyle, position: "relative", zIndex: 10, padding: 22 }}>
          {/* Section Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ea580c",
                flexShrink: 0
              }}>
                <Key size={19} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: S.text }}>Module Permissions & Access Control</h3>
                  <Badge variant="outline" style={{ gap: 4, padding: "2.5px 8px", fontSize: 10.5, fontWeight: 800, background: "rgba(245, 158, 11, 0.12)", color: "#ea580c", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                    <ShieldCheck size={12} />
                    <span>Superadmin Only</span>
                  </Badge>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted, maxWidth: 650 }}>
                  Assign granular CRUD access (View, Create, Edit, Delete) to administrative officers across CLIMA operational modules.
                </p>
              </div>
            </div>

            {/* KPI Badges & Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Badge variant="secondary" style={{ gap: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 800 }}>
                <Users size={12} style={{ opacity: 0.8 }} />
                <span>{adminUsers.length} {adminUsers.length === 1 ? "Admin Officer" : "Admin Officers"}</span>
              </Badge>
              <Badge variant="outline" style={{ gap: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 800, color: "#16a34a", borderColor: "rgba(22, 163, 74, 0.3)", background: S.isDark ? "rgba(22, 163, 74, 0.1)" : "#f0fdf4" }}>
                <CheckCircle2 size={12} />
                <span>{activeAdminsCount} Configured</span>
              </Badge>
              {noAccessAdminsCount > 0 && (
                <Badge variant="outline" style={{ gap: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 800, color: S.muted }}>
                  <Clock size={12} style={{ opacity: 0.7 }} />
                  <span>{noAccessAdminsCount} Pending</span>
                </Badge>
              )}
              
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(true)}
                style={{
                  padding: "8px 15px",
                  borderRadius: 10,
                  border: `1px solid ${S.border}`,
                  background: S.cardSubtle,
                  color: S.text,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <ShieldCheck size={14} style={{ color: "#ea580c" }} />
                <span>Role Presets</span>
              </button>

              <button
                type="button"
                onClick={loadAdminUsers}
                disabled={loadingPermissions}
                title="Reload Admin Permissions"
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `1px solid ${S.border}`,
                  background: S.cardSubtle,
                  color: S.muted,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: loadingPermissions ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                  opacity: loadingPermissions ? 0.6 : 1,
                }}
              >
                <RefreshCw size={13} className={loadingPermissions ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Admin Search & Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
              <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: S.muted }} />
              <input
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                placeholder="Search admin officers by name or email…"
                style={{
                  ...inputStyle,
                  paddingLeft: 38,
                  paddingRight: adminSearch ? 32 : 12,
                  height: 40,
                  fontSize: 13,
                  borderRadius: 12,
                }}
              />
              {adminSearch && (
                <button
                  type="button"
                  onClick={() => setAdminSearch("")}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: S.muted,
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Badge variant="secondary" style={{ padding: "4px 10px", fontSize: 11.5, fontWeight: 800 }}>
              Showing {filteredAdmins.length} of {adminUsers.length} administrators
            </Badge>
          </div>

          {/* Admin Users Table (Matching UsersTab) */}
          {adminUsers.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              background: S.cardSubtle,
              borderRadius: 14,
              border: `1px dashed ${S.border}`
            }}>
              <Users size={32} style={{ color: S.muted, margin: "0 auto 10px", opacity: 0.6 }} />
              <div style={{ fontWeight: 800, fontSize: 14, color: S.text }}>No Admin Users Found</div>
              <p style={{ fontSize: 12.5, color: S.muted, maxWidth: 360, margin: "4px auto 0" }}>
                There are currently no users with the &quot;admin&quot; role. You can promote registered users to admin in the Users tab.
              </p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "30px 20px",
              background: S.cardSubtle,
              borderRadius: 14,
              border: `1px dashed ${S.border}`
            }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: S.text }}>No admin matches &quot;{adminSearch}&quot;</div>
              <button
                type="button"
                onClick={() => setAdminSearch("")}
                style={{ marginTop: 8, fontSize: 12, color: "#ea580c", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div
              style={{
                border: `1px solid ${S.border}`,
                borderRadius: 16,
                background: S.isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 740 }}>
                  {/* Table Header Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(320px, 2.4fr) minmax(170px, 1.2fr) minmax(160px, 1.1fr) minmax(230px, 1.4fr)",
                      padding: "10px 18px",
                      background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                      borderBottom: `1px solid ${S.border}`,
                      fontSize: 11,
                      fontWeight: 800,
                      color: S.muted,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      alignItems: "center",
                    }}
                  >
                    <span>Admin Officer</span>
                    <span>Assigned Agency</span>
                    <span>Modules Access</span>
                    <span style={{ textAlign: "right" }}>Actions</span>
                  </div>

                  {/* Rows */}
                  {filteredAdmins.map((user, idx) => {
                    const perms = userPermissions[user.id] || {};
                    const activeCount = Object.keys(perms).filter(m => perms[m].can_view || perms[m].can_create || perms[m].can_edit || perms[m].can_delete).length;

                    return (
                      <ModulePermissionRow
                        key={user.id}
                        user={user}
                        permissions={perms}
                        modules={MODULES}
                        moduleCount={activeCount}
                        onToggle={toggleModulePermission}
                        onToggleAllModule={toggleAllModuleCrud}
                        onGrantAll={grantAllPermissions}
                        onRevokeAll={revokeAllPermissions}
                        onApplyPresetTemplate={(uId) => {
                          setSelectedUser(uId);
                          setIsPresetModalOpen(true);
                        }}
                        isLast={idx === filteredAdmins.length - 1}
                        S={S}
                        btnDanger={btnDanger}
                        loadingPermissions={loadingPermissions}
                        ORANGE_GRADIENT={ORANGE_GRADIENT}
                        ORANGE_SHADOW={ORANGE_SHADOW}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2. Issue Categories & Agency Routing Section ── */}
      <div style={{ ...cardStyle, position: "relative", zIndex: 10, padding: 22 }}>
        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ea580c",
              flexShrink: 0
            }}>
              <Tag size={19} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: S.text }}>Issue Categories & Agency Routing</h3>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted, maxWidth: 650 }}>
                Categories are selected by citizens when filing incident reports. Each category belongs to a group and routes tickets directly to a designated agency.
              </p>
            </div>
          </div>

          {/* Quick Metrics & + Add Category Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge variant="secondary" style={{ gap: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 800 }}>
              <Tag size={12} style={{ opacity: 0.8 }} />
              <span>{categories.length} {categories.length === 1 ? "Category" : "Categories"}</span>
            </Badge>
            <Badge variant="outline" style={{ gap: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 800 }}>
              <Folder size={12} style={{ opacity: 0.8 }} />
              <span>{existingGroups.length} {existingGroups.length === 1 ? "Group" : "Groups"}</span>
            </Badge>
            <Badge variant="outline" style={{ gap: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 800, color: "#16a34a", borderColor: "rgba(22, 163, 74, 0.3)", background: S.isDark ? "rgba(22, 163, 74, 0.1)" : "#f0fdf4" }}>
              <CheckCircle2 size={12} />
              <span>{linkedCategoriesCount} Routed</span>
            </Badge>

            <button
              type="button"
              onClick={() => setIsAddCategoryModalOpen(true)}
              style={{
                ...btnPrimary,
                background: ORANGE_GRADIENT,
                boxShadow: ORANGE_SHADOW,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 800,
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Search & Agency Filter Toolbar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
              <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: S.muted }} />
              <input
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                placeholder="Search categories by name, group, or routed agency…"
                style={{
                  ...inputStyle,
                  paddingLeft: 38,
                  paddingRight: categorySearch ? 32 : 12,
                  height: 40,
                  fontSize: 13,
                  borderRadius: 12,
                }}
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch("")}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: S.muted,
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <Badge variant="secondary" style={{ padding: "4px 10px", fontSize: 11.5, fontWeight: 800 }}>
              Showing {filteredCategories.length} of {categories.length} categories
            </Badge>
          </div>

          {/* Agency Filter Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 2 }}>
              Agency Filter:
            </span>
            {["ALL", ...ORDERED_AGENCIES, "UNASSIGNED"].map(agency => {
              const isSelected = selectedAgencyFilter === agency;

              return (
                <button
                  key={agency}
                  type="button"
                  onClick={() => setSelectedAgencyFilter(agency)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 9999,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: isSelected ? "none" : `1px solid ${S.border}`,
                    background: isSelected ? ORANGE_GRADIENT : S.cardSubtle,
                    color: isSelected ? "#ffffff" : S.muted,
                    boxShadow: isSelected ? "0 2px 8px rgba(234, 88, 12, 0.25)" : "none",
                  }}
                >
                  {agency === "ALL" ? "All Agencies" : agency === "UNASSIGNED" ? "Unassigned" : agency}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories Grouped by group_name */}
        <CategoryGroupList
          categories={filteredCategories}
          allCategoriesCount={categories.length}
          categorySearch={categorySearch}
          selectedAgencyFilter={selectedAgencyFilter}
          onResetFilters={() => { setCategorySearch(""); setSelectedAgencyFilter("ALL"); }}
          S={S}
          btnDanger={btnDanger}
          delCat={delCat}
          onSeedCategories={seedDefaultCategories}
          seeding={seedingCategories}
          ORANGE_GRADIENT={ORANGE_GRADIENT}
          ORANGE_SHADOW={ORANGE_SHADOW}
        />
      </div>

      {/* ── SettingsTab Global Modals (Portalled to document.body for full global screen overlay) ── */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {/* ── Modal 1: Add New Report Category Modal Popup ── */}
          {isAddCategoryModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsAddCategoryModalOpen(false);
              }}
              style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 99999,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20
              }}
            >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: S.card,
              border: `1px solid ${S.borderMedium}`,
              borderRadius: 20,
              width: "100%",
              maxWidth: 520,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              boxShadow: S.isDark ? "0 25px 60px rgba(0,0,0,0.75)" : "0 20px 60px rgba(0,0,0,0.2)",
              fontFamily: S.font,
              color: S.text
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(234, 88, 12, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ea580c",
                  flexShrink: 0
                }}>
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: S.text }}>
                    Add New Report Category
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: S.muted }}>
                    Define citizen reporting categories and bind them to responding municipal agencies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: S.muted,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  borderRadius: 6,
                  outline: "none",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={addCat} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Category Name */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Category Name <span style={{ color: "#ea580c" }}>*</span>
                </label>
                <input
                  autoFocus
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="E.g. Obstructed Sidewalks, Fallen Tree, Low Pressure…"
                  required
                  style={{ ...inputStyle, height: 42, fontSize: 13 }}
                />
              </div>

              {/* Group (shown in app) */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Group (Shown in App) <span style={{ color: "#ea580c" }}>*</span>
                </label>
                {catGroup === "__NEW__" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      autoFocus
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="Type new group name…"
                      required
                      style={{ ...inputStyle, height: 42, fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={() => { setCatGroup(""); setNewGroupName(""); }}
                      style={{
                        padding: "0 14px",
                        borderRadius: 10,
                        border: `1px solid ${S.border}`,
                        background: S.cardSubtle,
                        cursor: "pointer",
                        fontFamily: S.font,
                        fontWeight: 700,
                        fontSize: 12,
                        color: S.muted,
                        whiteSpace: "nowrap"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <CustomSelect
                    value={catGroup}
                    onChange={v => {
                      if (v === "__NEW__") {
                        setCatGroup("__NEW__");
                        setNewGroupName("");
                      } else {
                        setCatGroup(v);
                      }
                    }}
                    options={[
                      { value: "", label: "Select existing group or create new…" },
                      ...existingGroups.map(g => ({ value: g, label: g })),
                      { value: "__NEW__", label: "+ Create New Group…" },
                    ]}
                    accent="#ea580c"
                    isDark={S.isDark}
                  />
                )}
              </div>

              {/* Linked Agency (For routing) */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Linked Agency (Auto-Routing)
                </label>
                <CustomSelect
                  value={catDept}
                  onChange={setCatDept}
                  options={[
                    { value: "", label: "No agency linked (General / Triage)" },
                    ...agencyOptions
                  ]}
                  accent="#ea580c"
                  isDark={S.isDark}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 8, paddingTop: 14, borderTop: `1px solid ${S.border}` }}>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    border: `1px solid ${S.border}`,
                    background: S.cardSubtle,
                    color: S.muted,
                    fontSize: 12.5,
                    fontWeight: 750,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat || !catName.trim() || !(catGroup === "__NEW__" ? newGroupName.trim() : catGroup.trim())}
                  style={{
                    ...btnPrimary,
                    background: ORANGE_GRADIENT,
                    boxShadow: ORANGE_SHADOW,
                    height: 40,
                    padding: "0 22px",
                    borderRadius: 10,
                    opacity: (isSubmittingCat || !catName.trim() || !(catGroup === "__NEW__" ? newGroupName.trim() : catGroup.trim())) ? 0.6 : 1,
                    cursor: (isSubmittingCat || !catName.trim() || !(catGroup === "__NEW__" ? newGroupName.trim() : catGroup.trim())) ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 800,
                    fontSize: 12.5,
                  }}
                >
                  <Plus size={15} />
                  <span>{isSubmittingCat ? "Creating…" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* ── Modal 2: Role Permission Presets Modal Popup ── */}
      {isPresetModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPresetModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: S.card,
              border: `1px solid ${S.borderMedium}`,
              borderRadius: 20,
              width: "100%",
              maxWidth: 580,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              boxShadow: S.isDark ? "0 25px 60px rgba(0,0,0,0.75)" : "0 20px 60px rgba(0,0,0,0.2)",
              fontFamily: S.font,
              color: S.text
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(234, 88, 12, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ea580c",
                  flexShrink: 0
                }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: S.text }}>
                    Role Permission Presets
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: S.muted }}>
                    Quickly assign pre-configured module bundles with full CRUD privileges.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: S.muted,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  borderRadius: 6,
                  outline: "none",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Admin Officer Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Target Admin Officer <span style={{ color: "#ea580c" }}>*</span>
              </label>
              <CustomSelect
                value={selectedUser}
                onChange={setSelectedUser}
                options={[
                  { value: "", label: "Choose an admin officer to apply template…" },
                  ...adminUsers.map(u => ({
                    value: u.id,
                    label: `${u.full_name || 'Admin'} (${u.email})`
                  }))
                ]}
                accent="#ea580c"
                isDark={S.isDark}
              />
            </div>

            {/* Presets Grid */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Choose Preset Template:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
                {Object.entries(ROLE_TEMPLATES).map(([templateName, config]) => {
                  const IconComponent = config.icon || Shield;
                  const moduleList = config.modules || [];

                  return (
                    <button
                      key={templateName}
                      type="button"
                      onClick={() => {
                        if (!selectedUser) {
                          showToast?.({
                            type: "warning",
                            title: "Select Admin First",
                            message: "Please choose an admin officer from the dropdown above first."
                          });
                          return;
                        }
                        applyTemplate(selectedUser, templateName);
                      }}
                      disabled={loadingPermissions}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: `1px solid ${S.border}`,
                        background: S.cardSubtle,
                        cursor: loadingPermissions ? "not-allowed" : "pointer",
                        fontFamily: S.font,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.15s ease",
                        opacity: loadingPermissions ? 0.6 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!loadingPermissions) {
                          e.currentTarget.style.borderColor = config.color || "#ea580c";
                          e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = S.border;
                        e.currentTarget.style.background = S.cardSubtle;
                      }}
                    >
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: `${config.color || "#ea580c"}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: config.color || "#ea580c",
                        flexShrink: 0
                      }}>
                        <IconComponent size={16} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 12.5, color: S.text, lineHeight: 1.2 }}>
                          {templateName}
                        </div>
                        <div style={{ fontSize: 11, color: S.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {moduleList.length === MODULES.length ? "All 11 Modules (Full Access)" : `${moduleList.length} Module${moduleList.length > 1 ? 's' : ''} CRUD Access`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: `1px solid ${S.border}` }}>
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: `1px solid ${S.border}`,
                  background: S.cardSubtle,
                  color: S.muted,
                  fontSize: 12.5,
                  fontWeight: 750,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

/* ── Collapsible Category Group List ── */
function CategoryGroupList({
  categories,
  allCategoriesCount,
  categorySearch,
  selectedAgencyFilter,
  onResetFilters,
  S,
  btnDanger,
  delCat,
  onSeedCategories,
  seeding,
  ORANGE_GRADIENT,
  ORANGE_SHADOW
}) {
  const [openGroups, setOpenGroups] = useState({});

  const grouped = useMemo(() => {
    const map = {};
    categories.forEach(c => {
      const g = c.group_name || "General";
      if (!map[g]) map[g] = [];
      map[g].push(c);
    });
    return map;
  }, [categories]);

  const isOpen = (name) => {
    if (categorySearch && categorySearch.trim()) return true;
    return Boolean(openGroups[name]);
  };
  const toggleGroup = (name) => setOpenGroups(prev => ({ ...prev, [name]: !isOpen(name) }));

  if (allCategoriesCount === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "48px 20px",
        background: S.cardSubtle,
        borderRadius: 14,
        border: `1px dashed ${S.border}`
      }}>
        <Tag size={36} style={{ color: S.muted, margin: "0 auto 12px", opacity: 0.5 }} />
        <div style={{ fontWeight: 800, fontSize: 16, color: S.text }}>No Categories Configured Yet</div>
        <p style={{ fontSize: 13, color: S.muted, maxWidth: 460, margin: "6px auto 18px" }}>
          Citizens choose from these categories when submitting incident reports. You can quickly initialize the standard Palayan City categories or use the form above to create custom ones.
        </p>
        {onSeedCategories && (
          <button
            type="button"
            onClick={onSeedCategories}
            disabled={seeding}
            style={{
              padding: "10px 22px",
              borderRadius: 9999,
              border: "none",
              background: ORANGE_GRADIENT || "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
              boxShadow: ORANGE_SHADOW || "0 3px 12px rgba(234, 88, 12, 0.28)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
              cursor: seeding ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: seeding ? 0.7 : 1,
              transition: "all 0.15s ease"
            }}
          >
            {seeding ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Initializing Standard Categories…</span>
              </>
            ) : (
              <>
                <FolderPlus size={14} />
                <span>Populate Standard City Categories (12)</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "36px 20px",
        background: S.cardSubtle,
        borderRadius: 14,
        border: `1px dashed ${S.border}`
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: S.text }}>
          No categories found matching your filters
        </div>
        <p style={{ fontSize: 12.5, color: S.muted, margin: "4px 0 10px" }}>
          {categorySearch && `Search query: "${categorySearch}". `}
          {selectedAgencyFilter !== "ALL" && `Agency: ${selectedAgencyFilter}.`}
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#ea580c",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.entries(grouped).map(([groupName, cats]) => {
        const open = isOpen(groupName);
        const groupAgencies = [...new Set(cats.map(c => c.departments?.name).filter(Boolean))];

        return (
          <div
            key={groupName}
            style={{
              borderRadius: 14,
              border: `1px solid ${open ? (S.isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(234, 88, 12, 0.3)") : S.border}`,
              overflow: "hidden",
              background: S.cardSubtle,
              transition: "border-color 0.15s ease",
            }}
          >
            {/* Group Header Button */}
            <button
              type="button"
              onClick={() => toggleGroup(groupName)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                border: "none",
                borderBottom: open ? `1px solid ${S.border}` : "none",
                background: S.cardSubtle,
                cursor: "pointer",
                fontFamily: S.font,
                transition: "background 0.15s",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: open ? "rgba(245, 158, 11, 0.12)" : (S.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                  border: `1px solid ${open ? "rgba(245, 158, 11, 0.3)" : S.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: open ? "#ea580c" : S.muted,
                  flexShrink: 0
                }}>
                  <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex", alignItems: "center" }}>
                    <ChevronDown size={13} />
                  </motion.div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Folder size={15} style={{ color: "#ea580c" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 900, color: S.text }}>
                    {groupName}
                  </span>
                </div>
                <Badge variant="secondary" style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px" }}>
                  {cats.length} {cats.length === 1 ? "Category" : "Categories"}
                </Badge>
              </div>

              {/* Agency badges summary in group */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {groupAgencies.map(agencyName => (
                  <Badge
                    key={agencyName}
                    variant="outline"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 8px",
                      color: "#ea580c",
                      borderColor: "rgba(245, 158, 11, 0.3)",
                      background: "rgba(245, 158, 11, 0.06)",
                      gap: 4
                    }}
                  >
                    <Building size={10} style={{ opacity: 0.7 }} />
                    <span>{agencyName}</span>
                  </Badge>
                ))}
              </div>
            </button>

            {/* Collapsible Group Items */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{
                    background: S.isDark ? "rgba(0, 0, 0, 0.2)" : "#ffffff",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    {cats.map((c, idx) => {
                      const agencyName = c.departments?.name;

                      return (
                        <div
                          key={c.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 16px",
                            borderBottom: idx < cats.length - 1 ? `1px solid ${S.border}` : "none",
                            background: "transparent",
                            transition: "background 0.12s ease",
                            gap: 12
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.025)" : "rgba(0, 0, 0, 0.015)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {/* Left: Indicator & Category Name */}
                          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ea580c", flexShrink: 0 }} />
                            <span style={{ fontWeight: 800, fontSize: 13, color: S.text }}>
                              {c.name}
                            </span>
                          </div>

                          {/* Right: Agency Badge & Delete Button */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            {agencyName ? (
                              <Badge
                                variant="outline"
                                style={{
                                  fontSize: 11,
                                  fontWeight: 750,
                                  padding: "2px 9px",
                                  gap: 5,
                                  color: S.text,
                                  borderColor: "rgba(245, 158, 11, 0.3)",
                                  background: "rgba(245, 158, 11, 0.06)"
                                }}
                              >
                                <Building size={11} style={{ opacity: 0.7, color: "#ea580c" }} />
                                <span>{agencyName}</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  color: S.muted
                                }}
                              >
                                Unassigned
                              </Badge>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                delCat(c.id, c.name);
                              }}
                              style={{
                                padding: "5px 8px",
                                borderRadius: 7,
                                border: `1px solid ${S.border}`,
                                background: S.cardSubtle,
                                color: S.muted,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                transition: "all 0.15s ease",
                              }}
                              title={`Delete category "${c.name}"`}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                                e.currentTarget.style.color = "#dc2626";
                                e.currentTarget.style.background = S.isDark ? "rgba(239, 68, 68, 0.1)" : "#fef2f2";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = S.border;
                                e.currentTarget.style.color = S.muted;
                                e.currentTarget.style.background = S.cardSubtle;
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

/* ── Module Permission Row (Inline Table Row Matching UsersTab) ── */
function ModulePermissionRow({
  user,
  permissions,
  modules,
  moduleCount,
  onToggle,
  onToggleAllModule,
  onGrantAll,
  onRevokeAll,
  onApplyPresetTemplate,
  isLast,
  S,
  btnDanger,
  loadingPermissions,
  ORANGE_GRADIENT,
  ORANGE_SHADOW
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const permTypes = [
    { key: "can_view", label: "View", icon: Eye, color: "#3b82f6" },
    { key: "can_create", label: "Create", icon: Plus, color: "#10b981" },
    { key: "can_edit", label: "Edit", icon: Edit2, color: "#f59e0b" },
    { key: "can_delete", label: "Delete", icon: Trash2, color: "#ef4444" }
  ];

  const initials = useMemo(() => {
    if (user.full_name) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (user.email?.[0] || "A").toUpperCase();
  }, [user]);

  const hasFullAccess = moduleCount === modules.length;

  const rawAgency = user.assigned_department || user.department;
  const assignedAgency = (!rawAgency || rawAgency === 'All Departments' || rawAgency === 'All Agencies' || rawAgency === 'Not Assigned')
    ? (user.role === 'superadmin' ? 'All Agencies (Superadmin)' : 'None')
    : rawAgency;

  return (
    <div style={{
      borderBottom: isLast && !isExpanded ? "none" : `1px solid ${S.border}`,
      background: isExpanded ? (S.isDark ? "rgba(245, 158, 11, 0.04)" : "rgba(245, 158, 11, 0.02)") : "transparent",
      transition: "background 0.15s ease",
    }}>
      {/* Main Table Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 2.4fr) minmax(170px, 1.2fr) minmax(160px, 1.1fr) minmax(230px, 1.4fr)",
          padding: "10px 18px",
          alignItems: "center",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={e => {
          if (!isExpanded) e.currentTarget.style.background = S.isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)";
        }}
        onMouseLeave={e => {
          if (!isExpanded) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Column 1: Admin Officer Info (Chevron, Avatar, Name, Badge, Email) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, paddingRight: 12 }}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: isExpanded ? "rgba(245, 158, 11, 0.12)" : (S.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
              border: `1px solid ${isExpanded ? "rgba(245, 158, 11, 0.3)" : S.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isExpanded ? "#ea580c" : S.muted,
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s ease"
            }}
            title={isExpanded ? "Collapse module permissions" : "Expand module permissions"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <ChevronDown size={14} />
            </motion.div>
          </button>

          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              minWidth: 32,
              borderRadius: "50%",
              background: S.isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
              border: `1px solid ${S.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 11.5,
              color: "#ea580c",
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          {/* Name & Email Stack */}
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
              <span style={{
                fontWeight: 800,
                fontSize: 13.5,
                color: S.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {user.full_name || "Admin Officer"}
              </span>
              <Badge variant="outline" style={{ gap: 3, padding: "1px 6px", fontSize: 10, fontWeight: 800, color: S.text, flexShrink: 0 }}>
                <Shield size={10} />
                <span>Admin</span>
              </Badge>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11.5,
              color: S.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              <Mail size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Assigned Agency */}
        <div style={{ minWidth: 0 }}>
          <Badge
            variant="outline"
            style={{
              gap: 5,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
              color: assignedAgency === 'None' ? S.muted : S.text,
              borderColor: assignedAgency === 'None' ? S.border : "rgba(245, 158, 11, 0.3)",
              background: assignedAgency === 'None' ? "transparent" : "rgba(245, 158, 11, 0.06)",
            }}
          >
            <Building size={11} style={{ opacity: 0.7, color: assignedAgency === 'None' ? S.muted : "#ea580c" }} />
            <span>{assignedAgency}</span>
          </Badge>
        </div>

        {/* Column 3: Modules Access */}
        <div style={{ minWidth: 0 }}>
          <Badge
            variant={moduleCount === 0 ? "outline" : hasFullAccess ? "success" : "secondary"}
            style={{
              fontSize: 11,
              fontWeight: 750,
              padding: "3px 10px",
              color: moduleCount === 0 ? S.muted : hasFullAccess ? "#16a34a" : S.text,
              borderColor: hasFullAccess ? "rgba(22, 163, 74, 0.3)" : S.border,
              background: hasFullAccess ? (S.isDark ? "rgba(22, 163, 74, 0.12)" : "#f0fdf4") : "transparent",
            }}
          >
            {moduleCount === 0 ? "No Modules Assigned" : hasFullAccess ? `Full Access (${modules.length})` : `${moduleCount} of ${modules.length} Active`}
          </Badge>
        </div>

        {/* Column 4: Header Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, flexShrink: 0 }}>
          {/* Configure button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: "5px 11px",
              borderRadius: 8,
              border: `1px solid ${isExpanded ? "rgba(245, 158, 11, 0.4)" : S.border}`,
              background: isExpanded ? "rgba(245, 158, 11, 0.08)" : S.cardSubtle,
              color: isExpanded ? "#ea580c" : S.text,
              fontWeight: 750,
              fontSize: 11.5,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
            }}
            title="View & configure granular CRUD permissions"
          >
            <SlidersHorizontal size={12} style={{ color: isExpanded ? "#ea580c" : S.muted }} />
            <span>{isExpanded ? "Close" : "Configure"}</span>
          </button>

          {!hasFullAccess && (
            <button
              type="button"
              onClick={() => onGrantAll(user.id)}
              disabled={loadingPermissions}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: `1px solid ${S.border}`,
                background: S.cardSubtle,
                color: S.text,
                cursor: loadingPermissions ? "not-allowed" : "pointer",
                fontFamily: S.font,
                fontWeight: 750,
                fontSize: 11.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s ease",
                opacity: loadingPermissions ? 0.5 : 1
              }}
              onMouseEnter={e => {
                if (!loadingPermissions) {
                  e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)";
                  e.currentTarget.style.color = "#16a34a";
                  e.currentTarget.style.background = S.isDark ? "rgba(16, 185, 129, 0.08)" : "#f0fdf4";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = S.border;
                e.currentTarget.style.color = S.text;
                e.currentTarget.style.background = S.cardSubtle;
              }}
              title="Grant full CRUD access to all modules"
            >
              <CheckSquare size={12} style={{ color: "#16a34a" }} />
              <span>Grant All</span>
            </button>
          )}

          {moduleCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRevokeAll(user.id);
              }}
              disabled={loadingPermissions}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: `1px solid ${S.border}`,
                background: S.cardSubtle,
                color: S.muted,
                cursor: loadingPermissions ? "not-allowed" : "pointer",
                fontFamily: S.font,
                fontWeight: 750,
                fontSize: 11.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s ease",
                opacity: loadingPermissions ? 0.5 : 1
              }}
              onMouseEnter={e => {
                if (!loadingPermissions) {
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  e.currentTarget.style.color = "#dc2626";
                  e.currentTarget.style.background = S.isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = S.border;
                e.currentTarget.style.color = S.muted;
                e.currentTarget.style.background = S.cardSubtle;
              }}
              title="Revoke all module permissions"
            >
              <Trash2 size={12} style={{ color: "#dc2626" }} />
              <span>Revoke All</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Module Permissions Matrix */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{
              overflow: "hidden",
              background: S.isDark ? "rgba(0, 0, 0, 0.25)" : "rgba(0, 0, 0, 0.015)",
              borderTop: `1px solid ${S.border}`,
            }}
          >
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Header Bar inside expanded panel */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                paddingBottom: 6
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: S.text }}>
                  Configure Granular Module Permissions
                </div>

                {onApplyPresetTemplate && (
                  <button
                    type="button"
                    onClick={() => onApplyPresetTemplate(user.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${S.border}`,
                      background: S.card,
                      color: S.text,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 750,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <ShieldCheck size={11} style={{ color: "#ea580c" }} />
                    <span>Apply Preset Template…</span>
                  </button>
                )}
              </div>

              {/* Table Column Legend */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 14px",
                background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                borderRadius: 8,
                marginBottom: 2
              }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: S.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Module Name & Scope
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: S.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    CRUD Privileges
                  </span>
                  <span style={{ width: 68, textAlign: "center", fontSize: 11, fontWeight: 900, color: S.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    All CRUD
                  </span>
                </div>
              </div>

              {/* Module Rows */}
              {modules.map(module => {
                const perms = permissions[module.name] || {};
                const hasAnyPerm = perms.can_view || perms.can_create || perms.can_edit || perms.can_delete;
                const hasAllPerms = perms.can_view && perms.can_create && perms.can_edit && perms.can_delete;
                const ModuleIcon = module.icon || FileText;

                return (
                  <div
                    key={module.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 14px",
                      borderRadius: 10,
                      background: hasAnyPerm
                        ? (S.isDark ? "rgba(245, 158, 11, 0.06)" : "rgba(245, 158, 11, 0.04)")
                        : (S.isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff"),
                      border: hasAnyPerm
                        ? (S.isDark ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid rgba(234, 88, 12, 0.2)")
                        : `1px solid ${S.border}`,
                      transition: "all 0.15s ease",
                      gap: 12,
                      flexWrap: "wrap"
                    }}
                  >
                    {/* Left: Icon, Module Name & Description */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 220 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: hasAnyPerm
                          ? "rgba(245, 158, 11, 0.12)"
                          : (S.isDark ? "rgba(255, 255, 255, 0.05)" : "#f4f4f5"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: hasAnyPerm ? "#ea580c" : S.muted,
                        flexShrink: 0
                      }}>
                        <ModuleIcon size={16} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: S.text }}>
                            {module.label}
                          </span>
                          <span style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: hasAnyPerm ? "#ea580c" : S.muted,
                            opacity: hasAnyPerm ? 1 : 0.4
                          }} />
                        </div>
                        {module.desc && (
                          <div style={{ fontSize: 11, color: S.muted, marginTop: 1 }}>
                            {module.desc}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: CRUD Buttons + Toggle All */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {permTypes.map(({ key, label, icon: PermIcon, color }) => {
                          const isActive = !!perms[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => onToggle(user.id, module.name, key)}
                              disabled={loadingPermissions}
                              style={{
                                padding: "4px 9px",
                                borderRadius: 7,
                                border: isActive ? `1.5px solid ${color}` : `1px solid ${S.border}`,
                                background: isActive ? color : S.card,
                                color: isActive ? "#ffffff" : S.muted,
                                cursor: loadingPermissions ? "not-allowed" : "pointer",
                                fontFamily: S.font,
                                fontWeight: 800,
                                fontSize: 11,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "all 0.15s ease",
                                opacity: loadingPermissions ? 0.5 : 1,
                                minWidth: 58,
                                justifyContent: "center"
                              }}
                              title={`Toggle ${label} permission`}
                            >
                              <PermIcon size={11} />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Toggle All CRUD for this Module */}
                      <button
                        type="button"
                        onClick={() => onToggleAllModule(user.id, module.name)}
                        disabled={loadingPermissions}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 7,
                          border: hasAllPerms
                            ? "1px solid rgba(245, 158, 11, 0.4)"
                            : `1px solid ${S.border}`,
                          background: hasAllPerms
                            ? (ORANGE_GRADIENT || "rgba(245, 158, 11, 0.14)")
                            : S.cardSubtle,
                          color: hasAllPerms ? "#ffffff" : S.muted,
                          cursor: loadingPermissions ? "not-allowed" : "pointer",
                          fontFamily: S.font,
                          fontWeight: 800,
                          fontSize: 11,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 0.15s ease",
                          width: 64,
                          justifyContent: "center",
                          boxShadow: hasAllPerms ? (ORANGE_SHADOW || "0 2px 8px rgba(234, 88, 12, 0.25)") : "none"
                        }}
                        title={hasAllPerms ? "Disable all 4 CRUD permissions for this module" : "Enable all 4 CRUD permissions for this module"}
                      >
                        {hasAllPerms ? <CheckSquare size={12} /> : <Square size={12} />}
                        <span>All</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    } catch (e) { logger.error(e); }
    finally { setUpdating(false); }
  };

  // Parse guest contact from description
  const guestMatch = report.description?.match(/^\[GUEST:.*?-\s*Contact:\s*(.+?)\]/);
  const contactNumber = guestMatch ? guestMatch[1].trim() : null;
  // Sanitize user-generated report description to prevent XSS
  const desc = DOMPurify.sanitize(report.description?.replace(/^\[GUEST:.*?\]\n\n/s, "") || "No description provided.");

  const statusMap = {
    pending: { color: "#ef4444", bg: "#fef2f2", label: "Pending" },
    inprogress: { color: "#3b82f6", bg: "#eff6ff", label: "In Progress" },
    resolved: { color: "#22c55e", bg: "#f0fdf4", label: "Resolved" },
  };
  const st = statusMap[status] || statusMap.pending;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 99999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S.font, padding: 20 }}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          onClick={e => e.stopPropagation()}
          style={{ background: S.card, border: `1px solid ${S.borderMedium}`, borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", color: S.text }}>

          {/* Header */}
          <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {report.photo_url
                ? <img src={report.photo_url.split(",")[0]} alt="" loading="lazy" width="48" height="48" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} />
                : <FileText size={24} color={st.color} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: S.text, lineHeight: 1.2 }}>{report.title}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted, fontWeight: 600 }}>{report.category || "Uncategorized"}</p>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: S.cardSubtle, border: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}>
              <X size={16} color={S.muted} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 28px" }}>
            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "12px 16px", background: st.bg, borderRadius: 14, border: `1px solid ${st.color}33` }}>
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
                { icon: <Users size={14} color={S.muted} />, label: "Reported by", value: report.full_name || "Anonymous" },
                { icon: <Calendar size={14} color={S.muted} />, label: "Date Filed", value: new Date(report.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) },
                ...(contactNumber ? [{ icon: <Phone size={14} color={S.muted} />, label: "Contact Number", value: contactNumber }] : []),
                ...(report.is_guest ? [{ icon: <AlertCircle size={14} color="#d97706" />, label: "Reporter Type", value: "Guest (Unregistered)" }] : []),
                { icon: <MapPin size={14} color="#16a34a" />, label: "Location", value: report.location || "N/A", span: true },
              ].map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", background: S.cardSubtle, borderRadius: 12, border: `1px solid ${S.border}`, gridColumn: item.span ? "1 / -1" : "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>{item.icon}<span style={{ fontSize: 10, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</span></div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: S.text }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</p>
              <div style={{ padding: "14px 16px", background: S.cardSubtle, borderRadius: 12, border: `1px solid ${S.border}` }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{desc}</p>
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
                        loading="lazy"
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
          style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 100000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 20 }}>
          <img src={lightboxImg} alt="Full view" style={{ maxWidth: "95%", maxHeight: "95vh", borderRadius: 12, objectFit: "contain", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setLightboxImg(null)} style={{ position: "absolute", top: 24, right: 24, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={20} color="white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}

/* ── Activity Logs Tab ── */
function ActivityLogsTab({ S, cardStyle, inputStyle, selectStyle, isSuperadmin = true, showSecurityConfirmModal }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [tableFilter, setTableFilter] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Helper to filter out any mock/dummy records
  const isDummyLog = useCallback((log) => {
    const title = (log.new_data?.title || log.old_data?.title || log.new_data?.name || log.old_data?.name || "").toLowerCase().trim();
    const content = (log.new_data?.content || log.old_data?.content || log.new_data?.description || log.old_data?.description || "").toLowerCase();

    if (!title && !content && !log.table_name) return true;
    if (title === "test" || title === "a" || title.startsWith("test") || title.includes("probe")) return true;
    if (title.startsWith("advisory ca208da9")) return true;
    if (title.includes("obstructed sidewalks")) return true;

    const dummyKeywords = [
      "bollywood", "jantar mantar", "fathom", "indonesian", "palangka raya",
      "nepal", "australia", "pupils and a teacher", "children were buried",
      "chinese foreign minister", "satellite images give clues", "saudi arabia",
      "nay pyi taw", "bbc is in central", "jordon steele-john", "gunmen firing shots",
      "kolkata"
    ];
    return dummyKeywords.some(k => title.includes(k) || content.includes(k));
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch logs
      const { data: logsData, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) logger.warn("Fetch audit_logs error:", error);

      // Fetch users to map actor_id to name
      const { data: usersData } = await supabase.rpc("get_auth_users");
      const uMap = {};
      if (usersData) {
        usersData.forEach(u => {
          uMap[u.id] = u.full_name || u.email;
        });
      }

      // Filter out any mock/dummy test records
      const cleanLogs = (logsData || []).filter(l => !isDummyLog(l));

      setLogs(cleanLogs);
      setUsersMap(uMap);
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      // 1. Try server endpoint
      let cleared = false;
      try {
        const res = await fetch("/api/admin/clear-audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purgeOnlyDummy: false })
        });
        if (res.ok) cleared = true;
      } catch {
        try {
          const res2 = await fetch("http://localhost:3001/api/admin/clear-audit-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ purgeOnlyDummy: false })
          });
          if (res2.ok) cleared = true;
        } catch {}
      }

      // 2. Direct Supabase deletion attempt
      await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      setLogs([]);
      setShowClearModal(false);
      setFeedbackMsg({ type: "success", text: "Audit logs have been cleared successfully." });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      logger.error("Failed to clear logs:", err);
      setFeedbackMsg({ type: "error", text: "Failed to clear logs: " + (err.message || "Error") });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteSingle = (logId) => {
    const proceedDelete = async () => {
      try {
        try {
          await fetch(`/api/admin/audit-logs/${logId}`, { method: "DELETE" });
        } catch {
          try {
            await fetch(`http://localhost:3001/api/admin/audit-logs/${logId}`, { method: "DELETE" });
          } catch {}
        }
        await supabase.from("audit_logs").delete().eq("id", logId);
        setLogs(prev => prev.filter(l => l.id !== logId));
        setFeedbackMsg({ type: "success", text: "Audit log entry deleted successfully." });
        setTimeout(() => setFeedbackMsg(null), 3500);
      } catch (err) {
        logger.error("Failed to delete log entry:", err);
        setFeedbackMsg({ type: "error", text: "Failed to delete log: " + (err.message || "Error") });
      }
    };

    if (showSecurityConfirmModal) {
      showSecurityConfirmModal({
        title: "Delete Audit Log",
        message: "Deleting an audit log entry permanently removes compliance history. Please enter your admin password to authenticate and proceed.",
        itemName: `Audit Log #${logId.slice(0, 8)}`,
        confirmText: "Verify & Delete",
        onConfirmed: proceedDelete,
      });
    } else {
      if (window.confirm("Permanently delete this audit log entry?")) {
        proceedDelete();
      }
    }
  };

  // Distinct tables for filter
  const tableOptions = useMemo(() => {
    const set = new Set();
    logs.forEach(l => { if (l.table_name) set.add(l.table_name); });
    return ["ALL", ...Array.from(set)];
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (tableFilter !== "ALL" && log.table_name !== tableFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (log.new_data?.title || log.old_data?.title || log.new_data?.name || log.old_data?.name || "").toLowerCase();
        const actor = (log.actor_id && usersMap[log.actor_id] ? usersMap[log.actor_id] : "").toLowerCase();
        const tbl = (log.table_name || "").toLowerCase();
        const recId = (log.record_id || "").toLowerCase();
        return title.includes(q) || actor.includes(q) || tbl.includes(q) || recId.includes(q);
      }
      return true;
    });
  }, [logs, actionFilter, tableFilter, searchQuery, usersMap]);

  if (loading) return <p style={{ textAlign: "center", color: S.muted, padding: 40 }}>Loading audit trail…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div style={{
          padding: "12px 18px",
          borderRadius: 10,
          background: feedbackMsg.type === "success" ? (S.isDark ? "rgba(16, 185, 129, 0.2)" : "#ecfdf5") : (S.isDark ? "rgba(239, 68, 68, 0.2)" : "#fef2f2"),
          border: `1px solid ${feedbackMsg.type === "success" ? "#10b981" : "#ef4444"}`,
          color: feedbackMsg.type === "success" ? "#10b981" : "#ef4444",
          fontSize: 13,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          {feedbackMsg.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {feedbackMsg.text}
        </div>
      )}

      <div style={cardStyle}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: S.text }}>Audit Logs & System Activity</h3>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 9999, background: S.isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>
              Immutable administrative history, tracking record creations, modifications, and removals.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={fetchLogs}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${S.border}`,
                background: S.cardSubtle,
                cursor: "pointer",
                fontFamily: S.font,
                fontWeight: 700,
                fontSize: 13,
                color: S.text,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>

            {isSuperadmin && logs.length > 0 && (
              <button
                onClick={() => {
                  if (showSecurityConfirmModal) {
                    showSecurityConfirmModal({
                      title: "Clear All Audit Logs",
                      message: "This will permanently purge all historical audit trail entries from the system database. This action cannot be undone. Please enter your admin password to proceed.",
                      itemName: `All Audit Logs (${logs.length} entries)`,
                      confirmText: "Verify & Purge All",
                      onConfirmed: handleClearLogs,
                    });
                  } else {
                    setShowClearModal(true);
                  }
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  background: S.isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                  cursor: "pointer",
                  fontFamily: S.font,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={14} /> Clear Logs
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <Search size={15} color={S.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search by title, table, user or record ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: 34,
                  fontSize: 13,
                  width: "100%",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <X size={14} color={S.muted} />
                </button>
              )}
            </div>

            {/* Action Filter Pills */}
            <div style={{ display: "flex", gap: 4, background: S.cardSubtle, padding: 3, borderRadius: 8, border: `1px solid ${S.border}` }}>
              {["ALL", "INSERT", "UPDATE", "DELETE"].map(action => (
                <button
                  key={action}
                  onClick={() => setActionFilter(action)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: actionFilter === action ? (S.isDark ? "#374151" : "#ffffff") : "transparent",
                    color: actionFilter === action ? S.text : S.muted,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: actionFilter === action ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Table Filter Dropdown */}
            {tableOptions.length > 2 && (
              <CustomSelect
                value={tableFilter}
                onChange={setTableFilter}
                options={tableOptions.map(t => ({
                  value: t,
                  label: t === "ALL" ? "All Tables" : `Table: ${t}`
                }))}
                compact
                accent={S.accent}
                isDark={S.isDark}
                style={{ width: "auto", minWidth: 140 }}
              />
            )}
          </div>
        </div>

        {/* Logs List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredLogs.map(log => {
            const actorName = log.actor_id ? (usersMap[log.actor_id] || "Admin") : "System / Superadmin";
            const actionColor = log.action === "DELETE" ? "#ef4444" : log.action === "INSERT" ? "#10b981" : "#3b82f6";
            const actionBg = log.action === "DELETE" ? (S.isDark ? "rgba(239, 68, 68, 0.18)" : "#fef2f2") : log.action === "INSERT" ? (S.isDark ? "rgba(16, 185, 129, 0.18)" : "#ecfdf5") : (S.isDark ? "rgba(59, 130, 246, 0.18)" : "#eff6ff");
            
            // Extract item title / name / summary
            const logTitle = log.new_data?.title || log.old_data?.title || log.new_data?.name || log.old_data?.name || log.new_data?.affected_barangays || "";
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: `1px solid ${S.border}`,
                  background: S.cardSubtle,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 6, background: actionBg, color: actionColor, fontSize: 11, fontWeight: 900, letterSpacing: 0.5 }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: S.isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", color: S.text }}>
                      {log.table_name}
                    </span>
                    {logTitle && (
                      <span style={{ fontSize: 13, fontWeight: 800, color: S.text, maxWidth: 460, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={logTitle}>
                        {logTitle}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: S.muted, fontWeight: 700 }}>
                      {new Date(log.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    {isSuperadmin && (
                      <button
                        onClick={() => handleDeleteSingle(log.id)}
                        title="Delete log entry"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: S.muted,
                          padding: 4,
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 12, color: S.muted, fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={13} color={S.muted} />
                    <span style={{ color: S.text, fontWeight: 700 }}>{actorName}</span>
                    <span style={{ color: S.border }}>•</span>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: S.muted }}>Record: {log.record_id ? log.record_id.slice(0, 8) + "…" : "N/A"}</span>
                  </div>

                  {(log.new_data || log.old_data) && (
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#3b82f6",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "2px 6px",
                      }}
                    >
                      {isExpanded ? <>Hide Details <ChevronUp size={12} /></> : <>View Changes <ChevronDown size={12} /></>}
                    </button>
                  )}
                </div>

                {/* Expanded Details JSON viewer */}
                {isExpanded && (
                  <div style={{ marginTop: 4, paddingTop: 10, borderTop: `1px dashed ${S.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                    {log.old_data && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 3 }}>Previous State:</div>
                        <pre style={{ margin: 0, padding: 8, borderRadius: 6, background: S.isDark ? "rgba(0,0,0,0.3)" : "#f8fafc", fontSize: 11, color: S.text, overflowX: "auto", fontFamily: "monospace" }}>
                          {JSON.stringify(log.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_data && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981", marginBottom: 3 }}>New State:</div>
                        <pre style={{ margin: 0, padding: 8, borderRadius: 6, background: S.isDark ? "rgba(0,0,0,0.3)" : "#f8fafc", fontSize: 11, color: S.text, overflowX: "auto", fontFamily: "monospace" }}>
                          {JSON.stringify(log.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div style={{ textAlign: "center", color: S.muted, padding: "36px 20px" }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                {searchQuery || actionFilter !== "ALL" || tableFilter !== "ALL" ? "No matching audit logs found." : "No audit logs recorded yet."}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: S.muted }}>All dummy test records have been permanently cleared.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Clear All Audit Logs */}
      {showClearModal && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: 16,
        }}>
          <div style={{
            ...cardStyle,
            maxWidth: 440,
            width: "100%",
            padding: 24,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239, 68, 68, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: S.text }}>Clear Audit Logs?</h4>
                <p style={{ margin: 0, fontSize: 12, color: S.muted }}>Superadmin Administrative Action</p>
              </div>
            </div>

            <p style={{ margin: "0 0 20px", fontSize: 13, color: S.muted, lineHeight: 1.5 }}>
              This will permanently purge all historical audit trail entries from the system database. This action cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${S.border}`,
                  background: S.cardSubtle,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: S.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearLogs}
                disabled={clearing}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {clearing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {clearing ? "Clearing…" : "Confirm Clear"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


/* ── Advisories Tab (Phase 3) - REDESIGNED WITH BETTER WORKFLOW ── */
function AdvisoriesTab({ 
  S, 
  cardStyle, 
  inputStyle, 
  selectStyle, 
  btnPrimary, 
  btnDanger, 
  isSuperadmin, 
  adminDepartment, 
  canCreate, 
  canEdit, 
  canDelete, 
  showSecurityConfirmModal,
  showSuccessModal,
  showErrorModal,
  showConfirmModal,
  showToast
}) {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdvisory, setEditingAdvisory] = useState(null);
  const [newAdvisory, setNewAdvisory] = useState({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" });
  const [submitting, setSubmitting] = useState(false);
  const [usersMap, setUsersMap] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchAdvisories();
  }, [adminDepartment, isSuperadmin]);

  const fetchAdvisories = async () => {
    if (advisories.length === 0) setLoading(true);
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
      logger.error("Advisories fetch error:", e);
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
      logger.error("Submit error:", err);
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
                  options={[
                    {value: "Extreme Heat", label: "Extreme Heat"},
                    {value: "Water Supply", label: "Water Supply"},
                    {value: "Power Interruption", label: "Power Interruption"},
                    {value: "Public Health", label: "Public Health"},
                    {value: "Fire Safety", label: "Fire Safety"},
                    {value: "General Directives", label: "General Directives"}
                  ]}
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
              <button type="button" onClick={() => { setShowForm(false); setEditingAdvisory(null); setNewAdvisory({ title: "", content: "", category: "General", status: "Draft", scheduled_for: "" }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: S.cardSubtle, color: S.text, fontWeight: 800, cursor: "pointer", fontFamily: S.font }}>Cancel</button>
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
          {canCreate('advisories') && (
            <button onClick={() => setShowForm(true)} style={btnPrimary}><Plus size={16} /> Post Announcement</button>
          )}
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
                
                const imgMatch = (adv.content || "").match(/\[IMAGE_URL:\s*([^\s\]]+)\s*\]/i);
                const displayContent = (adv.content || "").replace(/\[IMAGE_URL:\s*([^\s\]]+)\s*\]/gi, "").trim();
                const attachedImage = adv.image_url || (imgMatch ? imgMatch[1] : null);

                return (
                  <div key={adv.id} style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, background: S.cardSubtle }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 20, background: S.accentBg, color: S.accent, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{adv.category}</span>
                          {adv.departments?.name && <span style={{ fontSize: 10, color: S.muted, fontWeight: 700 }}>• {adv.departments.name}</span>}
                          {adv.scheduled_for && <span style={{ fontSize: 10, color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> Scheduled: {new Date(adv.scheduled_for).toLocaleString()}</span>}
                        </div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: S.text }}>{adv.title}</h4>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, 
                        background: isPublished ? (S.isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5") : isPending ? (S.isDark ? "rgba(217, 119, 6, 0.15)" : "#fffbeb") : isArchived ? (S.isDark ? "rgba(113, 113, 122, 0.15)" : "#f4f4f5") : (S.isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff"), 
                        color: isPublished ? "#10b981" : isPending ? "#d97706" : isArchived ? "#71717a" : "#3b82f6" }}>
                        {adv.status}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: S.text, lineHeight: 1.5, opacity: 0.9 }}>{displayContent}</p>
                    {attachedImage && (
                      <div style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden", maxWidth: 560, border: `1px solid ${S.border}`, background: "#000000", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <img src={attachedImage} alt="Advisory attachment" style={{ width: "auto", maxWidth: "100%", height: "auto", maxHeight: 440, objectFit: "contain", display: "block", margin: "0 auto" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: S.muted, fontWeight: 600 }}>
                      <span>Author: {author} • Created: {new Date(adv.created_at).toLocaleDateString()}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {/* Edit button for drafts and pending */}
                        {(isDraft || isPending) && canEdit('advisories') && (
                          <button
                            onClick={() => handleEdit(adv)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: `1px solid ${S.border}`,
                              background: S.cardSubtle,
                              color: S.text,
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
                                background: S.cardSubtle,
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
                                background: S.cardSubtle,
                                color: S.muted,
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
                              background: S.cardSubtle,
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(adv.id, adv.title);
                          }}
                          style={{ ...btnDanger, fontSize: 12, padding: "6px 12px" }}
                        >
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
    if (records.length === 0) setLoading(true);
    try {
      const { data } = await supabase
        .from("hospital_daily_records")
        .select("*")
        .order("record_date", { ascending: false })
        .limit(30); // Last 30 days
      setRecords(data || []);
    } catch (e) {
      logger.error(e);
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
      <div style={{
        ...cardStyle,
        background: S.isDark
          ? "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #172554 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: S.isDark ? "1px solid rgba(139, 92, 246, 0.25)" : "none",
        boxShadow: S.isDark ? "0 14px 34px rgba(0, 0, 0, 0.55)" : "0 14px 34px rgba(102, 126, 234, 0.25)",
        color: "#fff",
        padding: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, background: "rgba(255,255,255,0.18)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HeartPulse size={32} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Palayan City Hospital</h2>
            <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.9 }}>El Niño Health Impact Monitoring</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 20 }}>
          <div style={{ background: S.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16, backdropFilter: "blur(10px)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: "uppercase" }}>Total Records</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900 }}>{records.length}</p>
          </div>
          <div style={{ background: S.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16, backdropFilter: "blur(10px)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: "uppercase" }}>El Niño Impact</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 900 }}>{elNinoPercentage}%</p>
            <p style={{ margin: "4px 0 0", fontSize: 10, opacity: 0.8 }}>of total admissions</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Last 7 Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{
          ...cardStyle,
          background: S.isDark ? "rgba(225, 29, 72, 0.12)" : "#fff1f2",
          borderColor: S.isDark ? "rgba(225, 29, 72, 0.28)" : "#fecdd3"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={18} color={S.isDark ? "#fb7185" : "#e11d48"} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: S.isDark ? "#fb7185" : "#e11d48", textTransform: "uppercase" }}>Heat Stroke</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: S.isDark ? "#fda4af" : "#9f1239" }}>{totalHeatStroke}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: S.isDark ? "#fb7185" : "#be123c", fontWeight: 600 }}>Last 7 days</p>
        </div>

        <div style={{
          ...cardStyle,
          background: S.isDark ? "rgba(234, 88, 12, 0.12)" : "#fff7ed",
          borderColor: S.isDark ? "rgba(234, 88, 12, 0.28)" : "#fed7aa"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertCircle size={18} color={S.isDark ? "#fb923c" : "#ea580c"} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: S.isDark ? "#fb923c" : "#ea580c", textTransform: "uppercase" }}>Heat Exhaustion</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: S.isDark ? "#fdba74" : "#9a3412" }}>{totalExhaustion}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: S.isDark ? "#fb923c" : "#c2410c", fontWeight: 600 }}>Last 7 days</p>
        </div>

        <div style={{
          ...cardStyle,
          background: S.isDark ? "rgba(2, 132, 199, 0.12)" : "#f0f9ff",
          borderColor: S.isDark ? "rgba(2, 132, 199, 0.28)" : "#bae6fd"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Droplet size={18} color={S.isDark ? "#38bdf8" : "#0284c7"} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: S.isDark ? "#38bdf8" : "#0284c7", textTransform: "uppercase" }}>Dehydration</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: S.isDark ? "#7dd3fc" : "#075985" }}>{totalDehydration}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: S.isDark ? "#38bdf8" : "#0369a1", fontWeight: 600 }}>Last 7 days</p>
        </div>

        <div style={{
          ...cardStyle,
          background: S.isDark ? "rgba(147, 51, 234, 0.12)" : "#faf5ff",
          borderColor: S.isDark ? "rgba(147, 51, 234, 0.28)" : "#e9d5ff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Activity size={18} color={S.isDark ? "#c084fc" : "#9333ea"} />
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: S.isDark ? "#c084fc" : "#9333ea", textTransform: "uppercase" }}>Respiratory</p>
          </div>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: S.isDark ? "#d8b4fe" : "#6b21a8" }}>{totalRespiratory}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: S.isDark ? "#c084fc" : "#7e22ce", fontWeight: 600 }}>Last 7 days</p>
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
                padding: "8px 20px",
                borderRadius: 9999,
                border: "none",
                background: activeSubTab === "add" ? S.accent : (S.isDark ? "rgba(255,255,255,0.06)" : "transparent"),
                color: activeSubTab === "add" ? "#fff" : S.text,
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: activeSubTab === "add" ? `0 4px 14px ${S.accent}55` : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <Plus size={16} strokeWidth={2.6} /> Add Record
            </button>
            <button
              onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }}
              style={{
                padding: "8px 20px",
                borderRadius: 9999,
                border: "none",
                background: activeSubTab === "view" ? S.accent : (S.isDark ? "rgba(255,255,255,0.06)" : "transparent"),
                color: activeSubTab === "view" ? "#fff" : S.text,
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: activeSubTab === "view" ? `0 4px 14px ${S.accent}55` : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <FileText size={16} strokeWidth={2.4} /> View Records
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
                            backgroundColor: editId ? (S.isDark ? "rgba(255,255,255,0.05)" : S.cardSubtle) : S.inputBg,
                            color: S.text,
                            colorScheme: S.isDark ? "dark" : "light",
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
                              padding: "10px 22px",
                              borderRadius: 9999,
                              border: `1px solid ${S.border}`,
                              background: S.cardSubtle,
                              color: S.text,
                              fontSize: 13.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                          >
                            Cancel Edit
                          </button>
                        )}
                        <button type="submit" style={btnPrimary}>
                          <Check size={16} strokeWidth={2.6} /> {editId ? "Update Record" : "Save Record"}
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
                              border: `2px solid ${criticalLevel === "critical" ? (S.isDark ? "rgba(244,63,94,0.35)" : "#fecdd3") : criticalLevel === "warning" ? (S.isDark ? "rgba(249,115,22,0.35)" : "#fed7aa") : S.border}`, 
                              background: criticalLevel === "critical" 
                                ? (S.isDark ? "rgba(225,29,72,0.12)" : "#fff1f2") 
                                : criticalLevel === "warning" 
                                ? (S.isDark ? "rgba(234,88,12,0.12)" : "#fff7ed") 
                                : (S.isDark ? S.cardSubtle : "#fafafa"),
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
                                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: S.text }}>
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
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.isDark ? "#fb7185" : "#e11d48", textTransform: "uppercase" }}>Heat Stroke</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: S.isDark ? "#fda4af" : "#9f1239" }}>{record.heat_stroke_cases || 0}</p>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.isDark ? "#fb923c" : "#ea580c", textTransform: "uppercase" }}>Heat Exhaustion</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: S.isDark ? "#fdba74" : "#9a3412" }}>{record.heat_exhaustion_cases || 0}</p>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.isDark ? "#38bdf8" : "#0284c7", textTransform: "uppercase" }}>Dehydration</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: S.isDark ? "#7dd3fc" : "#075985" }}>{record.dehydration_cases || 0}</p>
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: S.isDark ? "#c084fc" : "#9333ea", textTransform: "uppercase" }}>Respiratory</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: S.isDark ? "#d8b4fe" : "#6b21a8" }}>{record.respiratory_cases || 0}</p>
                                </div>
                              </div>

                              {record.remarks && (
                                <div style={{ 
                                  padding: "12px 16px", 
                                  borderRadius: 10, 
                                  background: S.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", 
                                  marginTop: 12,
                                  border: `1px solid ${S.border}`
                                }}>
                                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: S.muted, textTransform: "uppercase", marginBottom: 4 }}>Remarks</p>
                                  <p style={{ margin: 0, fontSize: 13, color: S.text, lineHeight: 1.5 }}>{record.remarks}</p>
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                              <button 
                                onClick={() => editRecord(record)} 
                                style={{ 
                                  background: S.isDark ? "rgba(255,255,255,0.06)" : "none", 
                                  border: `1px solid ${S.border}`, 
                                  borderRadius: 9999, 
                                  padding: "7px 14px", 
                                  cursor: "pointer", 
                                  color: S.text,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  fontWeight: 700,
                                  fontSize: 12.5,
                                  transition: "all 0.2s ease"
                                }}
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRecord(record.id, record.record_date);
                                }} 
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
  const [barangayError, setBarangayError] = useState(false);
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
    if (records.length === 0) setLoading(true);
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
      logger.error(e);
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

      const selectedList = parseBarangayList(formData.location);
      if (selectedList.length === 0 && !formData.location.trim()) {
        setBarangayError(true);
        showErrorModal(
          "Location Required",
          "Please select at least one Palayan City barangay from the dropdown checklist."
        );
        return;
      }
      setBarangayError(false);

      const finalLocation = selectedList.length > 0 ? selectedList.join(", ") : formData.location.trim();

      const payload = {
        operation_date: formData.operation_date,
        operation_time: formData.operation_time,
        operation_type: formData.operation_type,
        description: formData.description || null,
        location: finalLocation,
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
      setBarangayError(false);
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
    setBarangayError(false);
    setFormData({
      operation_date: record.operation_date,
      operation_time: record.operation_time,
      operation_type: record.operation_type,
      description: record.description || "",
      location: record.location || "",
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
      evacuation: {
        bg: S.isDark ? "rgba(56, 189, 248, 0.14)" : "#eff6ff",
        color: S.isDark ? "#38bdf8" : "#0284c7",
        border: S.isDark ? "rgba(56, 189, 248, 0.28)" : "#bfdbfe",
      },
      rescue: {
        bg: S.isDark ? "rgba(245, 158, 11, 0.14)" : "#fef3c7",
        color: S.isDark ? "#f59e0b" : "#d97706",
        border: S.isDark ? "rgba(245, 158, 11, 0.28)" : "#fde68a",
      },
      relief_distribution: {
        bg: S.isDark ? "rgba(34, 197, 94, 0.14)" : "#f0fdf4",
        color: S.isDark ? "#22c55e" : "#16a34a",
        border: S.isDark ? "rgba(34, 197, 94, 0.28)" : "#bbf7d0",
      },
      damage_assessment: {
        bg: S.isDark ? "rgba(168, 85, 247, 0.14)" : "#faf5ff",
        color: S.isDark ? "#a855f7" : "#9333ea",
        border: S.isDark ? "rgba(168, 85, 247, 0.28)" : "#e9d5ff",
      },
      ambulance_dispatch: {
        bg: S.isDark ? "rgba(239, 68, 68, 0.14)" : "#fef2f2",
        color: S.isDark ? "#ef4444" : "#dc2626",
        border: S.isDark ? "rgba(239, 68, 68, 0.28)" : "#fecaca",
      },
      emergency_response: {
        bg: S.isDark ? "rgba(244, 63, 94, 0.14)" : "#fff1f2",
        color: S.isDark ? "#f43f5e" : "#e11d48",
        border: S.isDark ? "rgba(244, 63, 94, 0.28)" : "#fecdd3",
      },
    };
    const style = colors[type] || {
      bg: S.isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
      color: S.muted,
      border: S.border,
    };
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 6,
          fontSize: 10.5,
          fontWeight: 700,
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        {operationTypeLabels[type] || type}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: S.text, letterSpacing: -0.3 }}>
          Palayan City CDRRMO Operations
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>
          Track individual operations for Super El Niño response
        </p>
      </div>

      {/* Analytics Cards - Minimalist, modern palette */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Evacuations", count: evacuations, icon: Tent, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
          { label: "Rescues", count: rescues, icon: Activity, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
          { label: "Relief Dist.", count: reliefDist, icon: HeartPulse, color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
          { label: "Assessments", count: damageAssess, icon: FileText, color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)" },
          { label: "Ambulances", count: ambulances, icon: Truck, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
          { label: "Emergencies", count: emergencies, icon: AlertTriangle, color: "#f43f5e", bg: "rgba(244, 63, 94, 0.12)" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {item.label}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={13} color={item.color} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: S.text, letterSpacing: -0.5, lineHeight: 1 }}>
                {item.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-tabs & Records Card */}
      <div style={{ ...cardStyle, background: S.isDark ? "rgba(255, 255, 255, 0.02)" : S.card, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {/* Segmented Control */}
          <div
            style={{
              display: "inline-flex",
              padding: 3,
              background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
              borderRadius: 10,
              border: `1px solid ${S.border}`,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: activeSubTab === "add" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
                color: activeSubTab === "add" ? S.text : S.muted,
                fontWeight: activeSubTab === "add" ? 700 : 600,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: activeSubTab === "add" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={13} strokeWidth={2.4} /> Add Record
            </button>
            <button
              type="button"
              onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: activeSubTab === "view" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
                color: activeSubTab === "view" ? S.text : S.muted,
                fontWeight: activeSubTab === "view" ? 700 : 600,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: activeSubTab === "view" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <FileText size={13} strokeWidth={2.2} /> View Records
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "transparent",
              border: `1px solid ${S.border}`,
              padding: "7px 10px",
              borderRadius: 8,
              cursor: "pointer",
              color: S.muted,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            <ChevronDown size={14} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block" }}>
                          Location (Palayan City Barangays) *
                        </label>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                          <ShieldAlert size={12} /> CDRRMO Response Area
                        </span>
                      </div>
                      <BarangayMultiSelect
                        selected={parseBarangayList(formData.location)}
                        onChange={(newList) => {
                          if (newList.length > 0) setBarangayError(false);
                          setFormData({ ...formData, location: newList.join(", ") });
                        }}
                        error={barangayError}
                        isDark={S.isDark}
                        accent="#f59e0b"
                        placeholder="Select Palayan barangay(s) from dropdown checklist..."
                      />
                      {barangayError && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#ef4444", fontSize: 11.5, fontWeight: 700, marginTop: 5 }}>
                          <AlertCircle size={13} strokeWidth={2.4} />
                          <span>Please select at least one Palayan City barangay</span>
                        </div>
                      )}
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
                      <button type="button" onClick={() => { setEditId(null); setFormData({ operation_date: new Date().toISOString().split('T')[0], operation_time: "", operation_type: "evacuation", description: "", location: "", personnel_deployed: 0, beneficiaries: 0 }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: S.cardSubtle, color: S.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                          <button
                            onClick={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: "none",
                              background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: S.text,
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"}
                            onMouseLeave={e => e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Calendar size={14} color={S.muted} strokeWidth={2} />
                              <span>{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: S.muted,
                                  background: S.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                }}
                              >
                                {dayRecords.length} {dayRecords.length === 1 ? 'operation' : 'operations'}
                              </span>
                            </div>
                            <ChevronDown size={15} color={S.muted} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden", background: S.card }}>
                                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                  {dayRecords.map(record => (
                                    <div
                                      key={record.id}
                                      style={{
                                        padding: 12,
                                        background: S.isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.015)",
                                        border: `1px solid ${S.border}`,
                                        borderRadius: 10,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                      }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                          <span style={{ fontSize: 12.5, fontWeight: 700, color: S.text, fontFamily: "monospace" }}>
                                            {record.operation_time || "N/A"}
                                          </span>
                                          {operationTypeBadge(record.operation_type)}
                                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.muted }}>
                                            <MapPin size={12} strokeWidth={2} />
                                            <span>{record.location}</span>
                                          </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <button
                                            onClick={() => editRecord(record)}
                                            style={{
                                              padding: "4px 8px",
                                              borderRadius: 6,
                                              border: `1px solid ${S.border}`,
                                              background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                                              color: S.text,
                                              fontSize: 11,
                                              fontWeight: 600,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 4,
                                            }}
                                          >
                                            <Edit2 size={11} /> Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteRecord(record.id);
                                            }}
                                            style={{ ...btnDanger, fontSize: 11, padding: "4px 8px" }}
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      {record.description && (
                                        <p style={{ margin: 0, fontSize: 12, color: S.isDark ? "#d4d4d8" : "#3f3f46", lineHeight: 1.5 }}>
                                          {record.description}
                                        </p>
                                      )}
                                      <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: S.muted }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <Users size={12} strokeWidth={2} />
                                          <span>{record.personnel_deployed} personnel</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <HeartPulse size={12} strokeWidth={2} />
                                          <span>{record.beneficiaries} beneficiaries</span>
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
  const [barangayError, setBarangayError] = useState(false);
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
    if (records.length === 0) setLoading(true);
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
      logger.error(e);
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

      const selectedList = parseBarangayList(formData.location);
      if (selectedList.length === 0 && !formData.location.trim()) {
        setBarangayError(true);
        showErrorModal(
          "Location Required",
          "Please select at least one Palayan City barangay from the dropdown checklist."
        );
        return;
      }
      setBarangayError(false);

      const finalLocation = selectedList.length > 0 ? selectedList.join(", ") : formData.location.trim();

      const payload = {
        operation_date: formData.operation_date,
        operation_time: formData.operation_time,
        operation_type: formData.operation_type,
        description: formData.description || null,
        location: finalLocation,
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
      setBarangayError(false);
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
    setBarangayError(false);
    setFormData({
      operation_date: record.operation_date,
      operation_time: record.operation_time,
      operation_type: record.operation_type,
      description: record.description || "",
      location: record.location || "",
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
      fire_incident: {
        bg: S.isDark ? "rgba(239, 68, 68, 0.14)" : "#fef2f2",
        color: S.isDark ? "#ef4444" : "#dc2626",
        border: S.isDark ? "rgba(239, 68, 68, 0.28)" : "#fecaca",
      },
      fire_prevention_inspection: {
        bg: S.isDark ? "rgba(245, 158, 11, 0.14)" : "#fff7ed",
        color: S.isDark ? "#f59e0b" : "#c2410c",
        border: S.isDark ? "rgba(245, 158, 11, 0.28)" : "#fed7aa",
      },
      fire_safety_seminar: {
        bg: S.isDark ? "rgba(56, 189, 248, 0.14)" : "#f0f9ff",
        color: S.isDark ? "#38bdf8" : "#0284c7",
        border: S.isDark ? "rgba(56, 189, 248, 0.28)" : "#bae6fd",
      },
      rescue_operation: {
        bg: S.isDark ? "rgba(16, 185, 129, 0.14)" : "#ecfdf5",
        color: S.isDark ? "#10b981" : "#047857",
        border: S.isDark ? "rgba(16, 185, 129, 0.28)" : "#a7f3d0",
      },
      medical_assist: {
        bg: S.isDark ? "rgba(34, 197, 94, 0.14)" : "#f0fdf4",
        color: S.isDark ? "#22c55e" : "#16a34a",
        border: S.isDark ? "rgba(34, 197, 94, 0.28)" : "#bbf7d0",
      },
      emergency_response: {
        bg: S.isDark ? "rgba(168, 85, 247, 0.14)" : "#faf5ff",
        color: S.isDark ? "#a855f7" : "#7e22ce",
        border: S.isDark ? "rgba(168, 85, 247, 0.28)" : "#e9d5ff",
      },
    };
    const style = colors[type] || {
      bg: S.isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
      color: S.muted,
      border: S.border,
    };
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 6,
          fontSize: 10.5,
          fontWeight: 700,
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        {operationTypeLabels[type] || type}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: S.text, letterSpacing: -0.3 }}>
          Palayan City BFP Operations
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>
          Track individual fire and emergency response operations
        </p>
      </div>

      {/* Analytics Cards - Minimalist, modern palette */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Fire Incidents", count: fireIncidents, icon: Flame, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
          { label: "Inspections", count: inspections, icon: FileText, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
          { label: "Seminars", count: seminars, icon: Users, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
          { label: "Rescues", count: rescues, icon: LifeBuoy, color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
          { label: "Medical", count: medicalAssists, icon: HeartPulse, color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
          { label: "Emergencies", count: emergencies, icon: AlertTriangle, color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)" },
          { label: "Casualties", count: totalCasualties, icon: AlertCircle, color: "#dc2626", bg: "rgba(220, 38, 38, 0.12)" },
          { label: "Trucks Sent", count: totalTrucks, icon: Truck, color: "#0284c7", bg: "rgba(2, 132, 199, 0.12)" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {item.label}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={13} color={item.color} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: S.text, letterSpacing: -0.5, lineHeight: 1 }}>
                {item.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-tabs & Records Card */}
      <div style={{ ...cardStyle, background: S.isDark ? "rgba(255, 255, 255, 0.02)" : S.card, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {/* Segmented Control */}
          <div
            style={{
              display: "inline-flex",
              padding: 3,
              background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
              borderRadius: 10,
              border: `1px solid ${S.border}`,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: activeSubTab === "add" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
                color: activeSubTab === "add" ? S.text : S.muted,
                fontWeight: activeSubTab === "add" ? 700 : 600,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: activeSubTab === "add" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={13} strokeWidth={2.4} /> Add Record
            </button>
            <button
              type="button"
              onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: activeSubTab === "view" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
                color: activeSubTab === "view" ? S.text : S.muted,
                fontWeight: activeSubTab === "view" ? 700 : 600,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: activeSubTab === "view" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <FileText size={13} strokeWidth={2.2} /> View Records
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "transparent",
              border: `1px solid ${S.border}`,
              padding: "7px 10px",
              borderRadius: 8,
              cursor: "pointer",
              color: S.muted,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            <ChevronDown size={14} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block" }}>
                          Location (Palayan City Barangays) *
                        </label>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                          <Flame size={12} /> BFP Response Area
                        </span>
                      </div>
                      <BarangayMultiSelect
                        selected={parseBarangayList(formData.location)}
                        onChange={(newList) => {
                          if (newList.length > 0) setBarangayError(false);
                          setFormData({ ...formData, location: newList.join(", ") });
                        }}
                        error={barangayError}
                        isDark={S.isDark}
                        accent="#ef4444"
                        placeholder="Select Palayan barangay(s) from dropdown checklist..."
                      />
                      {barangayError && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#ef4444", fontSize: 11.5, fontWeight: 700, marginTop: 5 }}>
                          <AlertCircle size={13} strokeWidth={2.4} />
                          <span>Please select at least one Palayan City barangay</span>
                        </div>
                      )}
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
                      <button type="button" onClick={() => { setEditId(null); setFormData({ operation_date: new Date().toISOString().split('T')[0], operation_time: "", operation_type: "fire_incident", description: "", location: "", personnel_deployed: 0, fire_trucks_dispatched: 0, casualties: 0, property_damage_estimate: 0 }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: S.cardSubtle, color: S.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
                          <button
                            onClick={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: "none",
                              background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: S.text,
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"}
                            onMouseLeave={e => e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Calendar size={14} color={S.muted} strokeWidth={2} />
                              <span>{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: S.muted,
                                  background: S.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                }}
                              >
                                {dayRecords.length} {dayRecords.length === 1 ? 'operation' : 'operations'}
                              </span>
                            </div>
                            <ChevronDown size={15} color={S.muted} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden", background: S.card }}>
                                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                  {dayRecords.map(record => (
                                    <div
                                      key={record.id}
                                      style={{
                                        padding: 12,
                                        background: S.isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.015)",
                                        border: `1px solid ${S.border}`,
                                        borderRadius: 10,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                      }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                          <span style={{ fontSize: 12.5, fontWeight: 700, color: S.text, fontFamily: "monospace" }}>
                                            {record.operation_time || "N/A"}
                                          </span>
                                          {operationTypeBadge(record.operation_type)}
                                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.muted }}>
                                            <MapPin size={12} strokeWidth={2} />
                                            <span>{record.location}</span>
                                          </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <button
                                            onClick={() => editRecord(record)}
                                            style={{
                                              padding: "4px 8px",
                                              borderRadius: 6,
                                              border: `1px solid ${S.border}`,
                                              background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                                              color: S.text,
                                              fontSize: 11,
                                              fontWeight: 600,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 4,
                                            }}
                                          >
                                            <Edit2 size={11} /> Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteRecord(record.id);
                                            }}
                                            style={{ ...btnDanger, fontSize: 11, padding: "4px 8px" }}
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      {record.description && (
                                        <p style={{ margin: 0, fontSize: 12, color: S.isDark ? "#d4d4d8" : "#3f3f46", lineHeight: 1.5 }}>
                                          {record.description}
                                        </p>
                                      )}
                                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11.5, color: S.muted }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <Users size={12} strokeWidth={2} />
                                          <span>{record.personnel_deployed} personnel</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <Truck size={12} strokeWidth={2} />
                                          <span>{record.fire_trucks_dispatched} trucks</span>
                                        </div>
                                        {record.casualties > 0 && (
                                          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontWeight: 700 }}>
                                            <AlertCircle size={12} strokeWidth={2.2} />
                                            <span>{record.casualties} casualties</span>
                                          </div>
                                        )}
                                        {record.property_damage_estimate > 0 && (
                                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <DollarSign size={12} strokeWidth={2} />
                                            <span>₱{Number(record.property_damage_estimate).toLocaleString()} damage</span>
                                          </div>
                                        )}
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
    if (records.length === 0) setLoading(true);
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
      logger.error(e);
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Reports", value: totalReports, icon: FileText, color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
          { label: "Total Hectares", value: `${totalHectares.toFixed(1)} ha`, icon: Layers, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
          { label: "Total Loss", value: `₱${totalLoss >= 1000000 ? (totalLoss/1000000).toFixed(1) + 'M' : totalLoss.toLocaleString()}`, icon: DollarSign, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
          { label: "Avg Damage", value: `${avgDamagePercent}%`, icon: TrendingDown, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
          { label: "Most Affected", value: cropTypeLabels[mostAffectedCrop] || mostAffectedCrop, icon: Sprout, color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)" },
          { label: "Pending", value: pendingAssessments, icon: AlertCircle, color: "#dc2626", bg: "rgba(220, 38, 38, 0.12)" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {item.label}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={13} color={item.color} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: S.text, letterSpacing: -0.5, lineHeight: 1 }}>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-tabs & Records Card */}
      <div style={{ ...cardStyle, background: S.isDark ? "rgba(255, 255, 255, 0.02)" : S.card, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {/* Segmented Control */}
          <div
            style={{
              display: "inline-flex",
              padding: 3,
              background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
              borderRadius: 10,
              border: `1px solid ${S.border}`,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: activeSubTab === "add" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
                color: activeSubTab === "add" ? S.text : S.muted,
                fontWeight: activeSubTab === "add" ? 700 : 600,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: activeSubTab === "add" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={13} strokeWidth={2.4} /> Add Record
            </button>
            <button
              type="button"
              onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "none",
                background: activeSubTab === "view" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
                color: activeSubTab === "view" ? S.text : S.muted,
                fontWeight: activeSubTab === "view" ? 700 : 600,
                fontSize: 12.5,
                cursor: "pointer",
                boxShadow: activeSubTab === "view" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <FileText size={13} strokeWidth={2.2} /> View Records
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "transparent",
              border: `1px solid ${S.border}`,
              padding: "7px 10px",
              borderRadius: 8,
              cursor: "pointer",
              color: S.muted,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            <ChevronDown size={14} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
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
                            padding: "16px 20px",
                            borderRadius: 12,
                            border: formData.category === "farm" ? `1.5px solid ${S.accent}` : `1px solid ${S.border}`,
                            background: formData.category === "farm" ? S.accentBg : (S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"),
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
                          <Sprout size={22} color={formData.category === "farm" ? S.accent : S.muted} />
                          <span>Farm</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: S.muted }}>Crops & Plants</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, category: "livestock", crop_type: "livestock" })}
                          style={{
                            flex: 1,
                            padding: "16px 20px",
                            borderRadius: 12,
                            border: formData.category === "livestock" ? `1.5px solid ${S.accent}` : `1px solid ${S.border}`,
                            background: formData.category === "livestock" ? S.accentBg : (S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"),
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
                          <Users size={22} color={formData.category === "livestock" ? S.accent : S.muted} />
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
                    
                    {/* Conditional fields based on category */}
                    {formData.category === "farm" ? (
                      <>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Crop Type</label>
                          <select value={formData.crop_type} onChange={e => setFormData({ ...formData, crop_type: e.target.value })} required style={selectStyle}>
                            <option value="rice">Rice</option>
                            <option value="corn">Corn</option>
                            <option value="vegetables">Vegetables</option>
                            <option value="fruits">Fruits</option>
                            <option value="fishery">Fishery</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Area Affected (hectares)</label>
                          <input type="number" min="0" step="0.01" value={formData.area_affected_hectares} onChange={e => setFormData({ ...formData, area_affected_hectares: e.target.value })} required style={inputStyle} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Livestock Type</label>
                          <select value={formData.crop_type} onChange={e => setFormData({ ...formData, crop_type: e.target.value })} required style={selectStyle}>
                            <option value="cattle">Cattle</option>
                            <option value="carabao">Carabao</option>
                            <option value="swine">Swine</option>
                            <option value="poultry">Poultry</option>
                            <option value="goats">Goats</option>
                            <option value="fish">Fish/Aquaculture</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Number of Animals Affected</label>
                          <input type="number" min="0" value={formData.area_affected_hectares} onChange={e => setFormData({ ...formData, area_affected_hectares: e.target.value })} required style={inputStyle} placeholder="Count of animals" />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>
                        {formData.category === "farm" ? "Crop Damage %" : "Mortality Rate %"} (0-100%)
                      </label>
                      <input type="number" min="0" max="100" value={formData.damage_percentage} onChange={e => setFormData({ ...formData, damage_percentage: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>₱ Estimated Loss Value</label>
                      <input type="number" min="0" step="0.01" value={formData.estimated_loss_value} onChange={e => setFormData({ ...formData, estimated_loss_value: e.target.value })} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Cause</label>
                      <select value={formData.cause} onChange={e => setFormData({ ...formData, cause: e.target.value })} required style={selectStyle}>
                        {formData.category === "farm" ? (
                          <>
                            <option value="drought">Drought</option>
                            <option value="pest_infestation">Pest Infestation</option>
                            <option value="crop_failure">Crop Failure</option>
                            <option value="water_shortage">Water Shortage</option>
                            <option value="heat_stress">Heat Stress</option>
                            <option value="flood">Flood</option>
                            <option value="other">Other</option>
                          </>
                        ) : (
                          <>
                            <option value="disease">Disease</option>
                            <option value="heat_stress">Heat Stress</option>
                            <option value="water_shortage">Water/Feed Shortage</option>
                            <option value="drought">Drought Effects</option>
                            <option value="malnutrition">Malnutrition</option>
                            <option value="predator_attack">Predator Attack</option>
                            <option value="other">Other</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: S.muted, display: "block", marginBottom: 4 }}>Assistance Needed</label>
                      <select value={formData.assistance_needed} onChange={e => setFormData({ ...formData, assistance_needed: e.target.value })} style={selectStyle}>
                        <option value="">Select assistance type</option>
                        {formData.category === "farm" ? (
                          <>
                            <option value="seeds">Seeds</option>
                            <option value="fertilizer">Fertilizer</option>
                            <option value="irrigation">Irrigation</option>
                            <option value="pesticides">Pesticides</option>
                            <option value="financial">Financial Aid</option>
                            <option value="equipment">Equipment</option>
                            <option value="none">None</option>
                          </>
                        ) : (
                          <>
                            <option value="veterinary">Veterinary Services</option>
                            <option value="medicine">Medicine/Vaccines</option>
                            <option value="feed">Animal Feed</option>
                            <option value="water">Water Supply</option>
                            <option value="financial">Financial Aid</option>
                            <option value="shelter">Shelter/Housing</option>
                            <option value="none">None</option>
                          </>
                        )}
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
                      <button type="button" onClick={() => { setEditId(null); setFormData({ category: "farm", report_date: new Date().toISOString().split('T')[0], report_time: "", farmer_name: "", barangay: "", crop_type: "rice", area_affected_hectares: 0, damage_percentage: 0, estimated_loss_value: 0, cause: "drought", description: "", assistance_needed: "", status: "pending", assessed_by: "" }); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, background: S.cardSubtle, color: S.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
                          <button
                            onClick={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: "none",
                              background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: S.text,
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"}
                            onMouseLeave={e => e.currentTarget.style.background = S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)"}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <Calendar size={14} color={S.muted} strokeWidth={2} />
                              <span>{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: S.muted,
                                  background: S.isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                }}
                              >
                                {dayRecords.length} {dayRecords.length === 1 ? 'report' : 'reports'}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#f59e0b",
                                  background: "rgba(245, 158, 11, 0.12)",
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                }}
                              >
                                ₱{dayTotalLoss.toLocaleString()}
                              </span>
                            </div>
                            <ChevronDown size={15} color={S.muted} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden", background: S.card }}>
                                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                  {dayRecords.map(record => (
                                    <div
                                      key={record.id}
                                      style={{
                                        padding: 12,
                                        background: S.isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.015)",
                                        border: `1px solid ${S.border}`,
                                        borderRadius: 10,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                      }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
                                          {record.report_time && (
                                            <span style={{ fontSize: 12.5, fontWeight: 700, color: S.text, fontFamily: "monospace" }}>
                                              {record.report_time}
                                            </span>
                                          )}
                                          <span style={{ fontSize: 13, fontWeight: 800, color: S.text }}>{record.farmer_name}</span>
                                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.muted }}>
                                            <MapPin size={12} strokeWidth={2} />
                                            <span>{record.barangay}</span>
                                          </div>
                                          <span
                                            style={{
                                              fontSize: 10.5,
                                              fontWeight: 700,
                                              color: S.isDark ? "#4ade80" : "#15803d",
                                              background: S.isDark ? "rgba(34, 197, 94, 0.12)" : "#f0fdf4",
                                              border: `1px solid ${S.isDark ? "rgba(34, 197, 94, 0.25)" : "#bbf7d0"}`,
                                              padding: "2px 8px",
                                              borderRadius: 6,
                                              textTransform: "uppercase",
                                            }}
                                          >
                                            {cropTypeLabels[record.crop_type]}
                                          </span>
                                          {statusBadge(record.status)}
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                          <button
                                            onClick={() => editRecord(record)}
                                            style={{
                                              padding: "4px 8px",
                                              borderRadius: 6,
                                              border: `1px solid ${S.border}`,
                                              background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                                              color: S.text,
                                              fontSize: 11,
                                              fontWeight: 600,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 4,
                                            }}
                                          >
                                            <Edit2 size={11} /> Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteRecord(record.id);
                                            }}
                                            style={{ ...btnDanger, fontSize: 11, padding: "4px 8px" }}
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      {record.description && (
                                        <p style={{ margin: 0, fontSize: 12, color: S.isDark ? "#d4d4d8" : "#3f3f46", lineHeight: 1.5 }}>
                                          {record.description}
                                        </p>
                                      )}
                                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11.5, color: S.muted }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <Sprout size={12} strokeWidth={2} />
                                          <span>{parseFloat(record.area_affected_hectares).toFixed(2)} ha</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontWeight: 700 }}>
                                          <TrendingDown size={12} strokeWidth={2.2} />
                                          <span>{record.damage_percentage}% damage</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          <DollarSign size={12} strokeWidth={2} />
                                          <span>₱{parseFloat(record.estimated_loss_value).toLocaleString()}</span>
                                        </div>
                                        {record.cause && (
                                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <AlertTriangle size={12} strokeWidth={2} />
                                            <span>{causeLabels[record.cause] || record.cause}</span>
                                          </div>
                                        )}
                                        {record.assistance_needed && (
                                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <HeartPulse size={12} strokeWidth={2} />
                                            <span>{record.assistance_needed}</span>
                                          </div>
                                        )}
                                        {record.assessed_by && (
                                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <Check size={12} strokeWidth={2} />
                                            <span>Assessed by {record.assessed_by}</span>
                                          </div>
                                        )}
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

// Utility helpers for utility outage time & duration calculations
function calculateDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // spans midnight
  }
  return endMinutes - startMinutes;
}

function calculateEndTime(startTime, durationMinutes) {
  if (!startTime || durationMinutes == null || durationMinutes === '') return '';
  const mins = parseInt(durationMinutes, 10);
  if (isNaN(mins) || mins <= 0) return '';
  const [sh, sm] = startTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm)) return '';
  const totalMins = (sh * 60 + sm + mins) % (24 * 60);
  const eh = Math.floor(totalMins / 60);
  const em = totalMins % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

/* ── Water Utility Tab (Phase 8) ── */
function WaterUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const [editId, setEditId] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [barangayError, setBarangayError] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    interruption_date: today,
    interruption_time: '08:00',
    set_end_time: '',
    duration_hours: '',
    provider: 'Palayan City Water District',
    affected_barangays: '',
    cause: 'pipe_burst',
    households_affected: '',
    status: 'ongoing',
    description: ''
  });

  // Real-time ticker to auto-lift water interruptions the instant their scheduled set time expires
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getLocalWaterRecords = () => {
    try {
      const raw = localStorage.getItem('clima_local_water_interruptions');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalWaterRecords = (recs) => {
    try {
      localStorage.setItem('clima_local_water_interruptions', JSON.stringify(recs));
      window.dispatchEvent(new CustomEvent('clima:water_interruption_change', { detail: recs }));
    } catch (e) {}
  };

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    if (records.length === 0) setLoading(true);
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const cutoffDate = oneYearAgo.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('water_interruptions')
        .select('*')
        .gte('interruption_date', cutoffDate)
        .order('interruption_date', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) logger.warn('Supabase fetch water_interruptions error:', error);

      const localRecs = getLocalWaterRecords();
      const combined = [...(data || [])];
      localRecs.forEach(lr => {
        const idx = combined.findIndex(r => String(r.id) === String(lr.id));
        if (idx >= 0) {
          combined[idx] = lr;
        } else {
          combined.unshift(lr);
        }
      });

      const rawRecords = combined;
      const currTime = new Date();

      // Check if any ongoing records have met their set time and auto-lift them in DB
      const expiredIds = rawRecords
        .filter(r => r.status !== 'restored' && r.status !== 'lifted' && !isWaterInterruptionActive(r, currTime))
        .map(r => r.id);

      if (expiredIds.length > 0) {
        supabase
          .from('water_interruptions')
          .update({ status: 'restored', updated_at: currTime.toISOString() })
          .in('id', expiredIds)
          .then(() => logger.info('Auto-lifted expired water interruptions in DB:', expiredIds))
          .catch(err => logger.warn('Failed to auto-lift water in DB:', err));

        // Archive corresponding published water interruption advisories in DB
        supabase
          .from('advisories')
          .update({ status: 'Archived' })
          .eq('category', 'Water Interruption')
          .eq('status', 'Published')
          .then(() => logger.info('Auto-archived water advisories in DB'))
          .catch(err => logger.warn('Failed to auto-archive water advisories in DB:', err));

        rawRecords.forEach(r => {
          if (expiredIds.includes(r.id)) {
            r.status = 'restored';
            r._autoLifted = true;
          }
        });

        // Also update local storage if any local records expired
        let updatedLocal = false;
        localRecs.forEach(lr => {
          if (expiredIds.includes(lr.id)) {
            lr.status = 'restored';
            lr._autoLifted = true;
            updatedLocal = true;
          }
        });
        if (updatedLocal) saveLocalWaterRecords(localRecs);
      }

      setRecords(rawRecords);
    } catch (e) {
      logger.error('fetchRecords error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimeChange = (newStartTime) => {
    let newDuration = formData.duration_hours;
    let newEndTime = formData.set_end_time;

    if (newEndTime) {
      const diffMins = calculateDurationMinutes(newStartTime, newEndTime);
      if (diffMins != null) newDuration = String(parseFloat((diffMins / 60).toFixed(2)));
    } else if (newDuration && parseFloat(newDuration) > 0) {
      newEndTime = calculateEndTime(newStartTime, Math.round(parseFloat(newDuration) * 60));
    }

    setFormData(prev => ({
      ...prev,
      interruption_time: newStartTime,
      set_end_time: newEndTime,
      duration_hours: newDuration
    }));
  };

  const handleEndTimeChange = (newEndTime) => {
    const startTime = formData.interruption_time || '08:00';
    let newDuration = formData.duration_hours;

    if (newEndTime) {
      const diffMins = calculateDurationMinutes(startTime, newEndTime);
      if (diffMins != null) newDuration = String(parseFloat((diffMins / 60).toFixed(2)));
    }

    setFormData(prev => ({
      ...prev,
      interruption_time: startTime,
      set_end_time: newEndTime,
      duration_hours: newDuration
    }));
  };

  const handleDurationChange = (newDurationHours) => {
    const startTime = formData.interruption_time || '08:00';
    const mins = Math.round((parseFloat(newDurationHours) || 0) * 60);
    const newEndTime = calculateEndTime(startTime, mins);

    setFormData(prev => ({
      ...prev,
      interruption_time: prev.interruption_time || startTime,
      duration_hours: newDurationHours,
      set_end_time: newEndTime || prev.set_end_time
    }));
  };

  const resetForm = () => {
    setFormData({
      interruption_date: today,
      interruption_time: '08:00',
      set_end_time: '',
      duration_hours: '',
      provider: 'Palayan City Water District',
      affected_barangays: '',
      cause: 'pipe_burst',
      households_affected: '',
      status: 'ongoing',
      description: ''
    });
    setBarangayError(false);
    setEditId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const selectedList = parseBarangayList(formData.affected_barangays);
    if (!selectedList || selectedList.length === 0) {
      setBarangayError(true);
      showErrorModal(
        "Barangay Selection Required",
        "Please select at least one affected Palayan City barangay from the dropdown before saving."
      );
      return;
    }
    setBarangayError(false);

    const computedDurationMins = (formData.interruption_time && formData.set_end_time)
      ? calculateDurationMinutes(formData.interruption_time, formData.set_end_time)
      : null;
    const finalDurationHours = parseFloat(formData.duration_hours) || (computedDurationMins != null ? parseFloat((computedDurationMins / 60).toFixed(2)) : 0);

    const payload = {
      interruption_date: formData.interruption_date,
      interruption_time: formData.interruption_time || null,
      provider: formData.provider || 'Palayan City Water District',
      affected_barangays: selectedList.join(", "),
      cause: formData.cause,
      duration_hours: finalDurationHours,
      households_affected: parseInt(formData.households_affected) || 0,
      status: editId ? (formData.status || 'ongoing') : 'ongoing',
      description: formData.description,
      updated_at: new Date().toISOString()
    };
    try {
      let error;
      if (editId) {
        ({ error } = await supabase.from('water_interruptions').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('water_interruptions').insert(payload));
      }
      if (error) {
        if (error.message?.includes('violates row-level security policy') || error.code === '42501' || error.message?.includes('row-level security')) {
          const localRecs = getLocalWaterRecords();
          if (editId) {
            const idx = localRecs.findIndex(r => String(r.id) === String(editId));
            if (idx >= 0) localRecs[idx] = { ...localRecs[idx], ...payload, id: editId };
            else localRecs.unshift({ ...payload, id: editId });
          } else {
            localRecs.unshift({ ...payload, id: `local-${Date.now()}` });
          }
          saveLocalWaterRecords(localRecs);
        } else {
          throw error;
        }
      }

      // Sync active water interruptions with advisories table for citizen notification & map visibility
      try {
        const isAll = selectedList.length >= 16;
        const bgyNames = isAll
          ? "Palayan City (All 19 Barangays)"
          : selectedList.length > 0
          ? `Brgy. ${selectedList.join(", ")}`
          : "Palayan City";

        const providerAbbr = formData.provider === 'Balibago Waterworks' ? 'Balibago' : 'PCWD';

        // Archive previous published water interruption advisories to avoid stale alerts
        await supabase
          .from("advisories")
          .update({
            status: "Archived",
          })
          .eq("category", "Water Interruption")
          .eq("status", "Published");

        if (payload.status !== "restored") {
          await supabase.from("advisories").insert({
            title: isAll
              ? `${providerAbbr} Water Interruption Advisory • Palayan City (City-wide)`
              : `${providerAbbr} Water Interruption Advisory • ${bgyNames}`,
            category: "Water Interruption",
            status: "Published",
            content: `Scheduled/Ongoing water service interruption in Palayan City affecting: ${bgyNames}. Provider: ${formData.provider}. Cause: ${causeLabels[formData.cause] || formData.cause}. ${formData.description || "Supply line maintenance and restoration ongoing."}`,
            published_at: new Date().toISOString(),
          });
        }
      } catch (advSyncErr) {
        logger.warn("Syncing advisory with water interruption:", advSyncErr);
      }

      showSuccessModal('Saved', editId ? 'Water interruption updated.' : 'Water interruption added.');
      resetForm();
      setActiveTab('view');
      await fetchRecords();
    } catch (err) {
      if (err.message?.includes('violates row-level security policy') || err.code === '42501' || err.message?.includes('row-level security')) {
        const localRecs = getLocalWaterRecords();
        if (editId) {
          const idx = localRecs.findIndex(r => String(r.id) === String(editId));
          if (idx >= 0) localRecs[idx] = { ...localRecs[idx], ...payload, id: editId };
          else localRecs.unshift({ ...payload, id: editId });
        } else {
          localRecs.unshift({ ...payload, id: `local-${Date.now()}` });
        }
        saveLocalWaterRecords(localRecs);
        showSuccessModal('Saved', editId ? 'Water interruption updated.' : 'Water interruption added.');
        resetForm();
        setActiveTab('view');
        await fetchRecords();
        return;
      }
      showErrorModal('Error', 'Failed to save record: ' + (err.message || 'Unknown error'));
    }
  };

  const handleLiftInterruption = (record) => {
    const barangays = parseBarangayList(record.affected_barangays);
    const bgyText = barangays.length > 0 ? `Brgy. ${barangays.join(', ')}` : 'Palayan City';
    showConfirmModal(
      '💧 Lift Water Interruption',
      `Are you sure you want to lift the water interruption for ${bgyText}? This will immediately restore water service status and clear all interruption highlights from citizen and admin maps.`,
      async () => {
        try {
          try {
            await supabase
              .from('water_interruptions')
              .update({
                status: 'restored',
                updated_at: new Date().toISOString(),
              })
              .eq('id', record.id);
          } catch (supaErr) {
            logger.warn('Supabase lift water error:', supaErr);
          }

          // Always update local storage
          const localRecs = getLocalWaterRecords();
          const target = localRecs.find(r => String(r.id) === String(record.id));
          if (target) {
            target.status = 'restored';
            target.updated_at = new Date().toISOString();
            saveLocalWaterRecords(localRecs);
          } else {
            localRecs.unshift({ ...record, status: 'restored', updated_at: new Date().toISOString() });
            saveLocalWaterRecords(localRecs);
          }

          // Archive corresponding published water interruption advisories
          try {
            await supabase
              .from('advisories')
              .update({
                status: 'Archived',
              })
              .eq('category', 'Water Interruption')
              .eq('status', 'Published');
          } catch (advErr) {
            logger.warn('Error archiving corresponding water advisory:', advErr);
          }

          await fetchRecords();
          showSuccessModal('Interruption Lifted', `Water interruption for ${bgyText} has been lifted and map highlights cleared.`);
        } catch (err) {
          logger.error('Failed to lift interruption:', err);
          showErrorModal('Error', 'Failed to lift water interruption: ' + (err.message || 'Unknown error'));
        }
      },
      '💧 Lift Interruption Now'
    );
  };

  const handleEdit = (r) => {
    const calcEndTime = r.interruption_time && r.duration_hours
      ? calculateEndTime(r.interruption_time, Math.round(parseFloat(r.duration_hours) * 60))
      : '';
    setFormData({
      interruption_date: r.interruption_date,
      interruption_time: r.interruption_time || '08:00',
      set_end_time: calcEndTime,
      duration_hours: r.duration_hours != null ? String(r.duration_hours) : '',
      provider: r.provider || 'Palayan City Water District',
      affected_barangays: r.affected_barangays || '',
      cause: r.cause || 'pipe_burst',
      households_affected: r.households_affected != null ? String(r.households_affected) : '',
      status: r.status || 'ongoing',
      description: r.description || ''
    });
    setBarangayError(false);
    setEditId(r.id);
    setActiveTab('add');
  };

  const handleDelete = (id) => {
    showConfirmModal(
      'Delete Water Record',
      'Are you sure you want to delete this water interruption record? This cannot be undone.',
      async () => {
        try {
          try {
            await supabase.from('water_interruptions').delete().eq('id', id);
          } catch (supaDelErr) {
            logger.warn('Supabase delete water error:', supaDelErr);
          }
          const localRecs = getLocalWaterRecords().filter(r => String(r.id) !== String(id));
          saveLocalWaterRecords(localRecs);

          // Archive any published water interruption advisories
          try {
            await supabase
              .from('advisories')
              .update({
                status: 'Archived',
              })
              .eq('category', 'Water Interruption')
              .eq('status', 'Published');
          } catch (advErr) {
            logger.warn('Error archiving water advisory on delete:', advErr);
          }

          await fetchRecords();
          showSuccessModal('Deleted', 'Water interruption record deleted.');
        } catch (err) {
          showErrorModal('Error', 'Failed to delete record.');
        }
      },
      'Delete'
    );
  };

  // Analytics (last 30 days)
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = records.filter(r => new Date(r.interruption_date) >= thirtyDaysAgo);
  const activeCount = records.filter(r => isWaterInterruptionActive(r, now)).length;
  const daysWithInterruptions = recent.length;
  const totalHouseholds = recent.reduce((s, r) => s + (parseInt(r.households_affected) || 0), 0);
  const totalDurationHours = recent.reduce((s, r) => s + (parseFloat(r.duration_hours) || 0), 0);
  const pcwdCount = recent.filter(r => r.provider === 'Palayan City Water District').length;
  const balibagoCount = recent.filter(r => r.provider === 'Balibago Waterworks').length;

  const causeLabels = { pipe_burst: 'Pipe Burst', maintenance: 'Maintenance', shortage: 'Water Shortage', pump_failure: 'Pump Failure', other: 'Other' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: S.text, letterSpacing: -0.3 }}>
          Water Interruption Management
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>
          Track and manage PCWD and Balibago water supply interruptions and live map highlights
        </p>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: "Active Issues", value: activeCount, sub: activeCount > 0 ? "Currently ongoing" : "Water supply normal", icon: Droplet, color: activeCount > 0 ? "#ef4444" : "#0284c7", bg: activeCount > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(2, 132, 199, 0.12)" },
          { label: "Affected Days", value: daysWithInterruptions, sub: "Last 30 days", icon: Calendar, color: "#0284c7", bg: "rgba(2, 132, 199, 0.12)" },
          { label: "Total Incidents", value: recent.length, sub: "Recorded events", icon: Droplet, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
          { label: "Total Duration", value: `${totalDurationHours.toFixed(1)}h`, sub: "Hours cumulative", icon: Clock, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
          { label: "PCWD / Balibago", value: `${pcwdCount} / ${balibagoCount}`, sub: "Provider split", icon: Activity, color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {item.label}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={13} color={item.color} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: S.text, letterSpacing: -0.5, lineHeight: 1 }}>
                {item.value}
              </div>
              <span style={{ fontSize: 11, color: S.muted }}>{item.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Segmented Control */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            display: "inline-flex",
            padding: 3,
            background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
            borderRadius: 10,
            border: `1px solid ${S.border}`,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => { resetForm(); setActiveTab('add'); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "add" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
              color: activeTab === "add" ? S.text : S.muted,
              fontWeight: activeTab === "add" ? 700 : 600,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === "add" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={13} strokeWidth={2.4} /> Add Interruption
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "view" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
              color: activeTab === "view" ? S.text : S.muted,
              fontWeight: activeTab === "view" ? 700 : 600,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === "view" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <FileText size={13} strokeWidth={2.2} /> View Records
          </button>
        </div>
      </div>

      {activeTab === 'add' && (
        <div style={{ ...cardStyle, background: S.isDark ? "rgba(255, 255, 255, 0.02)" : S.card, padding: 18 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: S.text }}>{editId ? 'Edit Water Interruption' : 'Add Water Interruption'}</h3>
          <form onSubmit={handleSave} style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block', marginBottom: 4}}>Date *</label>
                <input type='date' value={formData.interruption_date} onChange={e => setFormData({...formData, interruption_date: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block', marginBottom: 4}}>Provider *</label>
                <CustomSelect
                  value={formData.provider}
                  onChange={v => setFormData({...formData, provider: v})}
                  options={[
                    { value: 'Palayan City Water District', label: 'Palayan City Water District' },
                    { value: 'Balibago Waterworks', label: 'Balibago Waterworks' }
                  ]}
                  accent="#0284c7"
                />
              </div>

              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                  <span>Start Time (Interruption Begins) *</span>
                  {formData.interruption_time && (
                    <span style={{color: "#0284c7", fontWeight: 700}}>
                      {formatTime12h(formData.interruption_time)}
                    </span>
                  )}
                </label>
                <input
                  type='time'
                  value={formData.interruption_time}
                  onChange={e => handleStartTimeChange(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                  <span>Set Time (Auto-lifts Interruption) *</span>
                  {formData.set_end_time && (
                    <span style={{color: '#10b981', fontWeight: 700}}>
                      {formatTime12h(formData.set_end_time)}
                    </span>
                  )}
                </label>
                <input
                  type='time'
                  value={formData.set_end_time}
                  onChange={e => handleEndTimeChange(e.target.value)}
                  placeholder="Set time"
                  style={{
                    ...inputStyle,
                    borderColor: formData.set_end_time ? '#10b981' : undefined
                  }}
                />
              </div>

              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6}}>
                  <label style={{fontSize: 11, fontWeight: 800, color: S.muted}}>
                    Total Duration (hours)
                  </label>
                  {parseFloat(formData.duration_hours) > 0 && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#0284c7',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: S.isDark ? "rgba(2, 132, 199, 0.12)" : "#f0f9ff",
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: `1px solid ${S.isDark ? "rgba(2, 132, 199, 0.28)" : "#bae6fd"}`
                    }}>
                      <Clock size={11} /> Auto-calculated: {formData.duration_hours} hrs
                      {formData.set_end_time ? ` • Auto-lifts at ${formatTime12h(formData.set_end_time)}` : ''}
                    </span>
                  )}
                </div>
                <input
                  type='number'
                  min='0'
                  step='0.25'
                  placeholder='Auto-calculated when set time is selected'
                  value={formData.duration_hours}
                  onChange={e => handleDurationChange(e.target.value)}
                  style={inputStyle}
                />

                {/* Quick Presets */}
                <div style={{display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center'}}>
                  <span style={{fontSize: 10.5, fontWeight: 700, color: S.muted}}>Quick Presets:</span>
                  {[
                    { label: '1 hr', hours: '1' },
                    { label: '2 hrs', hours: '2' },
                    { label: '4 hrs', hours: '4' },
                    { label: '8 hrs', hours: '8' },
                    { label: 'Until 5:00 PM', end: '17:00' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (preset.end) {
                          handleEndTimeChange(preset.end);
                        } else {
                          handleDurationChange(preset.hours);
                        }
                      }}
                      style={{
                        padding: '3px 9px',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        border: `1px solid ${S.border}`,
                        background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                        color: S.text,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{gridColumn: '1 / -1'}}>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block', marginBottom: 4}}>Cause</label>
                <CustomSelect
                  value={formData.cause}
                  onChange={v => setFormData({...formData, cause: v})}
                  options={[
                    { value: 'pipe_burst', label: 'Pipe Burst' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'shortage', label: 'Water Shortage' },
                    { value: 'pump_failure', label: 'Pump Failure' },
                    { value: 'other', label: 'Other' }
                  ]}
                  accent="#0284c7"
                />
              </div>

              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                  <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block'}}>
                    Affected Barangays (Palayan City) *
                  </label>
                  <span style={{fontSize: 11, fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 4}}>
                    <Droplet size={12} /> Highlights on Live Map (Blue)
                  </span>
                </div>
                <BarangayMultiSelect
                  selected={parseBarangayList(formData.affected_barangays)}
                  onChange={(newList) => {
                    if (newList.length > 0) setBarangayError(false);
                    setFormData({...formData, affected_barangays: newList.join(", ")});
                  }}
                  error={barangayError}
                  isDark={S.isDark}
                  accent="#0284c7"
                  placeholder="Select all affected Palayan barangays from dropdown..."
                />
                {barangayError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444', fontSize: 11.5, fontWeight: 700, marginTop: 5 }}>
                    <AlertCircle size={13} strokeWidth={2.4} />
                    <span>Please select at least one affected Palayan City barangay</span>
                  </div>
                )}
              </div>

              <div style={{gridColumn: '1 / -1'}}>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block', marginBottom: 4}}>Description / Notes</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...inputStyle, resize: 'vertical'}} />
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: `1px solid ${S.border}`}}>
              <button type='button' onClick={() => { resetForm(); setActiveTab('view'); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${S.border}`, background: S.cardSubtle, color: S.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type='submit' style={btnPrimary}><Check size={16} /> {editId ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'view' && (
        <div style={{ ...cardStyle, background: S.isDark ? "rgba(255, 255, 255, 0.02)" : S.card, padding: 18 }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <h3 style={{margin: 0, fontSize: 16, fontWeight: 800, color: S.text}}>Water Interruption Records</h3>
            <span style={{fontSize: 12, fontWeight: 600, color: S.muted}}>{records.length} total record{records.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <p style={{color: S.muted, textAlign: 'center', padding: 20}}>Loading records...</p>
          ) : records.length === 0 ? (
            <p style={{color: S.muted, textAlign: 'center', padding: 20}}>No water interruption records yet. Add one above.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {records.map(r => {
                const d = new Date(r.interruption_date + 'T00:00:00');
                const label = d.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
                const active = isWaterInterruptionActive(r, now);
                const endTime = getWaterInterruptionEndTime(r);
                const isTimePassed = endTime ? now >= endTime : false;

                return (
                  <div
                    key={r.id}
                    style={{
                      border: `1px solid ${active ? (S.isDark ? "rgba(2, 132, 199, 0.45)" : "rgba(2, 132, 199, 0.35)") : S.border}`,
                      borderRadius: 10,
                      padding: 14,
                      background: active
                        ? (S.isDark ? "rgba(2, 132, 199, 0.05)" : "rgba(240, 249, 255, 0.5)")
                        : (S.isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.015)"),
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10}}>
                      <div style={{flex: 1, minWidth: 260}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap'}}>
                          <Droplet size={15} color={active ? '#0284c7' : '#10b981'} strokeWidth={2.4} fill={active ? '#0284c7' : 'none'} />
                          <span style={{fontWeight: 800, fontSize: 14, color: S.text}}>{label}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: S.isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
                            color: S.text,
                            border: `1px solid ${S.border}`
                          }}>
                            {r.provider}
                          </span>
                          {active ? (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 10.5,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: S.isDark ? "rgba(2, 132, 199, 0.18)" : "#e0f2fe",
                              color: S.isDark ? "#38bdf8" : "#0284c7",
                              border: `1px solid ${S.isDark ? "rgba(2, 132, 199, 0.35)" : "#bae6fd"}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', display: 'inline-block', boxShadow: '0 0 6px #0284c7' }} />
                              Active Interruption
                            </span>
                          ) : (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: S.isDark ? "rgba(34, 197, 94, 0.14)" : "#f0fdf4",
                              color: S.isDark ? "#22c55e" : "#16a34a",
                              border: `1px solid ${S.isDark ? "rgba(34, 197, 94, 0.28)" : "#bbf7d0"}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Check size={11} strokeWidth={2.6} />
                              {r._autoLifted || isTimePassed ? 'Auto-Lifted' : 'Restored / Lifted'}
                            </span>
                          )}

                          {active && endTime && (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#0284c7',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: S.isDark ? "rgba(2, 132, 199, 0.12)" : "#f0f9ff",
                              border: `1px solid ${S.isDark ? "rgba(2, 132, 199, 0.28)" : "#bae6fd"}`,
                              padding: '2px 7px',
                              borderRadius: 6
                            }}>
                              <Clock size={11} /> Auto-lifts: {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </span>
                          )}
                        </div>

                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11.5, color: S.muted}}>
                          {(r.households_affected || 0) > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Home size={12} strokeWidth={2} />
                              <span>{(r.households_affected || 0).toLocaleString()} households</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} strokeWidth={2} />
                            <span>{r.duration_hours || 0} hrs</span>
                          </div>
                          {r.interruption_time && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} strokeWidth={2} />
                              <span>
                                Schedule: {formatTime12h(r.interruption_time.slice(0, 5))}
                                {endTime ? ` – ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}
                              </span>
                            </div>
                          )}
                          {r.cause && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Wrench size={12} strokeWidth={2} />
                              <span>{causeLabels[r.cause] || r.cause}</span>
                            </div>
                          )}
                        </div>

                        {r.affected_barangays && parseBarangayList(r.affected_barangays).length > 0 ? (
                          <div style={{margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
                            <span style={{fontSize: 11, fontWeight: 700, color: S.muted, display: 'flex', alignItems: 'center', gap: 4}}>
                              <MapPin size={12} color="#0284c7" /> Affected Barangays:
                            </span>
                            {(() => {
                              const bList = parseBarangayList(r.affected_barangays);
                              if (bList.length >= 18) {
                                return (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '2px 9px',
                                      borderRadius: 6,
                                      fontSize: 11,
                                      fontWeight: 800,
                                      background: S.isDark ? "rgba(2, 132, 199, 0.22)" : "#e0f2fe",
                                      border: `1px solid ${S.isDark ? "rgba(2, 132, 199, 0.45)" : "#bae6fd"}`,
                                      color: S.isDark ? "#38bdf8" : "#0284c7",
                                    }}
                                  >
                                    💧 Palayan City (City-wide)
                                  </span>
                                );
                              }
                              return bList.map((bgy) => (
                                <span
                                  key={bgy}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: S.isDark ? "rgba(2, 132, 199, 0.16)" : "#f0f9ff",
                                    border: `1px solid ${S.isDark ? "rgba(2, 132, 199, 0.35)" : "#bae6fd"}`,
                                    color: S.isDark ? "#38bdf8" : "#0369a1",
                                  }}
                                >
                                  {bgy}
                                </span>
                              ));
                            })()}
                          </div>
                        ) : (
                          <div style={{margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6}}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#ef4444'
                            }}>
                              <AlertCircle size={12} strokeWidth={2.4} /> No barangay selected (Click Edit to assign)
                            </span>
                          </div>
                        )}
                        {r.description && <p style={{margin: '4px 0 0', fontSize: 12, color: S.muted}}>{r.description}</p>}
                      </div>

                      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto'}}>
                        {active ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLiftInterruption(r);
                            }}
                            title="Lift water interruption and clear map highlights immediately"
                            style={{
                              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 7,
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: 11.5,
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.32)",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Droplet size={12} fill="#ffffff" />
                            Lift Interruption
                          </button>
                        ) : (
                          <span
                            style={{
                              padding: "4px 9px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              color: S.isDark ? "#22c55e" : "#16a34a",
                              background: S.isDark ? "rgba(34, 197, 94, 0.1)" : "#f0fdf4",
                              border: `1px solid ${S.isDark ? "rgba(34, 197, 94, 0.2)" : "#bbf7d0"}`,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Check size={11} strokeWidth={2.6} /> Lifted
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEdit(r)}
                          style={{
                            background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                            border: `1px solid ${S.border}`,
                            borderRadius: 6,
                            padding: "5px 9px",
                            cursor: 'pointer',
                            color: S.text,
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(r.id);
                          }}
                          style={{ ...btnDanger, fontSize: 11, padding: "5px 9px" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Power Utility Tab (Phase 9) ── */
function PowerUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const [editId, setEditId] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [barangayError, setBarangayError] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    interruption_date: today,
    total_outages: '',
    total_affected_households: '',
    feeders_affected: '',
    total_duration_minutes: '',
    peak_outage_time: '08:00',
    set_end_time: '',
    cause: 'line_fault',
    restoration_status: 'ongoing',
    description: ''
  });

  // Real-time ticker to auto-lift outages the instant their scheduled set time expires
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    if (records.length === 0) setLoading(true);
    try {
      // Fetch last 365 days of records to optimize query performance
      // while still providing sufficient history for View tab
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const cutoffDate = oneYearAgo.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('power_interruptions')
        .select('*')
        .gte('interruption_date', cutoffDate)
        .order('interruption_date', { ascending: false });
      if (error) throw error;

      const rawRecords = data || [];
      const currTime = new Date();

      // Check if any ongoing records have met their set time and auto-lift them in DB
      const expiredIds = rawRecords
        .filter(r => r.restoration_status !== 'restored' && r.restoration_status !== 'lifted' && !isPowerOutageActive(r, currTime))
        .map(r => r.id);

      if (expiredIds.length > 0) {
        supabase
          .from('power_interruptions')
          .update({ restoration_status: 'restored', updated_at: currTime.toISOString() })
          .in('id', expiredIds)
          .then(() => logger.info('Auto-lifted expired power outages in DB:', expiredIds))
          .catch(err => logger.warn('Failed to auto-lift in DB:', err));

        // Archive corresponding published power interruption advisories in DB
        supabase
          .from('advisories')
          .update({ status: 'Archived' })
          .eq('category', 'Power Interruption')
          .eq('status', 'Published')
          .then(() => logger.info('Auto-archived power advisories in DB'))
          .catch(err => logger.warn('Failed to auto-archive advisories in DB:', err));

        rawRecords.forEach(r => {
          if (expiredIds.includes(r.id)) {
            r.restoration_status = 'restored';
            r._autoLifted = true;
          }
        });
      }

      setRecords(rawRecords);
    } catch (e) {
      logger.error('fetchRecords error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimeChange = (newStartTime) => {
    let newDuration = formData.total_duration_minutes;
    let newEndTime = formData.set_end_time;

    if (newEndTime) {
      const diff = calculateDurationMinutes(newStartTime, newEndTime);
      if (diff != null) newDuration = String(diff);
    } else if (newDuration && parseInt(newDuration, 10) > 0) {
      newEndTime = calculateEndTime(newStartTime, newDuration);
    }

    setFormData(prev => ({
      ...prev,
      peak_outage_time: newStartTime,
      set_end_time: newEndTime,
      total_duration_minutes: newDuration
    }));
  };

  const handleEndTimeChange = (newEndTime) => {
    const startTime = formData.peak_outage_time || '08:00';
    let newDuration = formData.total_duration_minutes;

    if (newEndTime) {
      const diff = calculateDurationMinutes(startTime, newEndTime);
      if (diff != null) newDuration = String(diff);
    }

    setFormData(prev => ({
      ...prev,
      peak_outage_time: startTime,
      set_end_time: newEndTime,
      total_duration_minutes: newDuration
    }));
  };

  const handleDurationChange = (newDuration) => {
    const startTime = formData.peak_outage_time || '08:00';
    const newEndTime = calculateEndTime(startTime, newDuration);

    setFormData(prev => ({
      ...prev,
      peak_outage_time: prev.peak_outage_time || startTime,
      total_duration_minutes: newDuration,
      set_end_time: newEndTime || prev.set_end_time
    }));
  };

  const resetForm = () => {
    setFormData({
      interruption_date: today,
      total_outages: '',
      total_affected_households: '',
      feeders_affected: '',
      total_duration_minutes: '',
      peak_outage_time: '08:00',
      set_end_time: '',
      cause: 'line_fault',
      restoration_status: 'ongoing',
      description: ''
    });
    setBarangayError(false);
    setEditId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const selectedList = parseBarangayList(formData.feeders_affected);
    if (!selectedList || selectedList.length === 0) {
      setBarangayError(true);
      showErrorModal(
        "Barangay Selection Required",
        "Please select at least one affected Palayan City barangay from the dropdown before saving."
      );
      return;
    }
    setBarangayError(false);

    const computedDuration = (formData.peak_outage_time && formData.set_end_time)
      ? calculateDurationMinutes(formData.peak_outage_time, formData.set_end_time)
      : null;
    const finalDuration = parseInt(formData.total_duration_minutes, 10) || computedDuration || 0;

    const payload = {
      interruption_date: formData.interruption_date,
      total_outages: parseInt(formData.total_outages) || 1,
      total_affected_households: parseInt(formData.total_affected_households) || 0,
      feeders_affected: selectedList.join(", "),
      total_duration_minutes: finalDuration,
      peak_outage_time: formData.peak_outage_time || null,
      cause: formData.cause,
      restoration_status: editId ? (formData.restoration_status || 'ongoing') : 'ongoing',
      description: formData.description,
      updated_at: new Date().toISOString()
    };
    try {
      let error;
      if (editId) {
        ({ error } = await supabase.from('power_interruptions').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('power_interruptions').insert(payload));
      }
      if (error) throw error;

      // Sync active power interruptions with advisories table for citizen notification & map visibility
      try {
        const selectedList = parseBarangayList(formData.feeders_affected);
        const isAll = selectedList.length >= 16;
        const bgyNames = isAll
          ? "Palayan City (All 19 Barangays)"
          : selectedList.length > 0
          ? `Brgy. ${selectedList.join(", ")}`
          : "Palayan City";

        // Archive previous published power interruption advisories to avoid stale alerts
        await supabase
          .from("advisories")
          .update({
            status: "Archived",
          })
          .eq("category", "Power Interruption")
          .eq("status", "Published");

        if (payload.restoration_status !== "restored") {
          await supabase.from("advisories").insert({
            title: isAll
              ? "NEECO Power Interruption Advisory • Palayan City (City-wide)"
              : `NEECO Power Interruption Advisory • ${bgyNames}`,
            category: "Power Interruption",
            status: "Published",
            content: `Scheduled/Ongoing power interruption in Palayan City affecting: ${bgyNames}. Cause: ${causeLabels[formData.cause] || formData.cause}. ${formData.description || "Grid maintenance and restoration ongoing."}`,
            published_at: new Date().toISOString(),
          });
        }
      } catch (advSyncErr) {
        logger.warn("Syncing advisory with power interruption:", advSyncErr);
      }

      showSuccessModal('Saved', editId ? 'Power record updated.' : 'Power record added.');
      resetForm();
      setActiveTab('view');
      await fetchRecords();
    } catch (err) {
      showErrorModal('Error', 'Failed to save record: ' + (err.message || 'Unknown error'));
    }
  };

  const handleLiftOutage = (record) => {
    const barangays = parseBarangayList(record.feeders_affected);
    const bgyText = barangays.length > 0 ? `Brgy. ${barangays.join(', ')}` : 'Palayan City';
    showConfirmModal(
      '⚡ Lift Power Outage',
      `Are you sure you want to lift the power outage for ${bgyText}? This will immediately restore electricity status and clear all outage highlights from citizen and admin maps.`,
      async () => {
        try {
          const { error } = await supabase
            .from('power_interruptions')
            .update({
              restoration_status: 'restored',
              updated_at: new Date().toISOString(),
            })
            .eq('id', record.id);
          if (error) throw error;

          // Archive corresponding published power interruption advisories
          try {
            await supabase
              .from('advisories')
              .update({
                status: 'Archived',
              })
              .eq('category', 'Power Interruption')
              .eq('status', 'Published');
          } catch (advErr) {
            logger.warn('Error archiving corresponding power advisory:', advErr);
          }

          await fetchRecords();
          showSuccessModal('Outage Lifted', `Power outage for ${bgyText} has been lifted and map highlights cleared.`);
        } catch (err) {
          logger.error('Failed to lift outage:', err);
          showErrorModal('Error', 'Failed to lift power outage: ' + (err.message || 'Unknown error'));
        }
      },
      '⚡ Lift Outage Now'
    );
  };

  const handleEdit = (r) => {
    const calcEndTime = r.peak_outage_time && r.total_duration_minutes
      ? calculateEndTime(r.peak_outage_time, r.total_duration_minutes)
      : '';
    setFormData({
      interruption_date: r.interruption_date,
      total_outages: r.total_outages != null ? String(r.total_outages) : '',
      total_affected_households: r.total_affected_households != null ? String(r.total_affected_households) : '',
      feeders_affected: r.feeders_affected || '',
      total_duration_minutes: r.total_duration_minutes != null ? String(r.total_duration_minutes) : '',
      peak_outage_time: r.peak_outage_time || '08:00',
      set_end_time: calcEndTime,
      cause: r.cause || 'line_fault',
      restoration_status: r.restoration_status || 'ongoing',
      description: r.description || ''
    });
    setBarangayError(false);
    setEditId(r.id);
    setActiveTab('add');
  };

  const handleDelete = (id) => {
    showConfirmModal(
      'Delete Power Record',
      'Are you sure you want to delete this power interruption record? This cannot be undone.',
      async () => {
        try {
          const { error } = await supabase.from('power_interruptions').delete().eq('id', id);
          if (error) throw error;

          // Archive any published power interruption advisories
          try {
            await supabase
              .from('advisories')
              .update({
                status: 'Archived',
              })
              .eq('category', 'Power Interruption')
              .eq('status', 'Published');
          } catch (advErr) {
            logger.warn('Error archiving power advisory on delete:', advErr);
          }

          await fetchRecords();
          showSuccessModal('Deleted', 'Power record deleted.');
        } catch (err) {
          showErrorModal('Error', 'Failed to delete record.');
        }
      },
      'Delete'
    );
  };

  // Analytics (last 30 days)
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = records.filter(r => new Date(r.interruption_date) >= thirtyDaysAgo);
  const activeCount = records.filter(r => isPowerOutageActive(r, now)).length;
  const daysWithOutages = recent.length;
  const totalOutages = recent.reduce((s, r) => s + (parseInt(r.total_outages) || 0), 0);
  const totalHouseholds = recent.reduce((s, r) => s + (parseInt(r.total_affected_households) || 0), 0);
  const totalDurationMins = recent.reduce((s, r) => s + (parseInt(r.total_duration_minutes) || 0), 0);
  const avgOutages = daysWithOutages > 0 ? (totalOutages / daysWithOutages).toFixed(1) : '0.0';

  const causeLabels = { line_fault: 'Line Fault', transformer_issue: 'Transformer Issue', weather: 'Weather', maintenance: 'Maintenance', overload: 'Overload', other: 'Other' };

  const tabBtnStyle = (active) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13,
    background: active ? S.accent : 'transparent', color: active ? '#fff' : S.muted, transition: 'all 0.15s'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: S.text, letterSpacing: -0.3 }}>
          NEECO Power Interruption Management
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: S.muted }}>
          Track electricity outage incidents, duration, and restoration status
        </p>
      </div>

      {/* Analytics Cards - Minimalist, modern palette */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: "Active Outages", value: activeCount, sub: activeCount > 0 ? "Currently ongoing" : "Grid normal", icon: Zap, color: activeCount > 0 ? "#ef4444" : "#10b981", bg: activeCount > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)" },
          { label: "Outage Days", value: daysWithOutages, sub: "Last 30 days", icon: Calendar, color: "#eab308", bg: "rgba(234, 179, 8, 0.12)" },
          { label: "Total Outages", value: totalOutages, sub: "Incidents", icon: Zap, color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
          { label: "Total Duration", value: `${(totalDurationMins / 60).toFixed(1)}h`, sub: "Hours cumulative", icon: Clock, color: "#f97316", bg: "rgba(249, 115, 22, 0.12)" },
          { label: "Avg Outages/Day", value: avgOutages, sub: "Active days", icon: Activity, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                background: S.isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {item.label}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={13} color={item.color} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: S.text, letterSpacing: -0.5, lineHeight: 1 }}>
                {item.value}
              </div>
              <span style={{ fontSize: 11, color: S.muted }}>{item.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Segmented Control */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            display: "inline-flex",
            padding: 3,
            background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
            borderRadius: 10,
            border: `1px solid ${S.border}`,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => { resetForm(); setActiveTab('add'); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "add" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
              color: activeTab === "add" ? S.text : S.muted,
              fontWeight: activeTab === "add" ? 700 : 600,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === "add" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={13} strokeWidth={2.4} /> Add Record
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "view" ? (S.isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff") : "transparent",
              color: activeTab === "view" ? S.text : S.muted,
              fontWeight: activeTab === "view" ? 700 : 600,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: activeTab === "view" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <FileText size={13} strokeWidth={2.2} /> View Records
          </button>
        </div>
      </div>

      {activeTab === 'add' && (
        <div style={{ ...cardStyle, background: S.isDark ? "rgba(255, 255, 255, 0.02)" : S.card, padding: 18 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: S.text }}>{editId ? 'Edit Power Record' : 'Add NEECO Power Interruption'}</h3>
          <form onSubmit={handleSave} style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block', marginBottom: 4}}>Date *</label>
                <input type='date' value={formData.interruption_date} onChange={e => setFormData({...formData, interruption_date: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block', marginBottom: 4}}>Cause</label>
                <CustomSelect
                  value={formData.cause}
                  onChange={v => setFormData({...formData, cause: v})}
                  options={[
                    { value: 'line_fault', label: 'Line Fault' },
                    { value: 'transformer_issue', label: 'Transformer Issue' },
                    { value: 'weather', label: 'Weather' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'overload', label: 'Overload' },
                    { value: 'other', label: 'Other' }
                  ]}
                  accent={S.accent}
                />
              </div>

              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                  <span>Start Time (Outage Begins) *</span>
                  {formData.peak_outage_time && (
                    <span style={{color: S.accent, fontWeight: 700}}>
                      {formatTime12h(formData.peak_outage_time)}
                    </span>
                  )}
                </label>
                <input
                  type='time'
                  value={formData.peak_outage_time}
                  onChange={e => handleStartTimeChange(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                  <span>Set Time (Auto-lifts Outage) *</span>
                  {formData.set_end_time && (
                    <span style={{color: '#10b981', fontWeight: 700}}>
                      {formatTime12h(formData.set_end_time)}
                    </span>
                  )}
                </label>
                <input
                  type='time'
                  value={formData.set_end_time}
                  onChange={e => handleEndTimeChange(e.target.value)}
                  placeholder="Set time"
                  style={{
                    ...inputStyle,
                    borderColor: formData.set_end_time ? '#10b981' : undefined
                  }}
                />
              </div>

              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6}}>
                  <label style={{fontSize: 11, fontWeight: 800, color: S.muted}}>
                    Total Duration (minutes)
                  </label>
                  {parseInt(formData.total_duration_minutes) > 0 && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#10b981',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: S.isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5",
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: `1px solid ${S.isDark ? "rgba(16, 185, 129, 0.25)" : "#d1fae5"}`
                    }}>
                      <Clock size={11} /> Auto-calculated: {Math.floor(parseInt(formData.total_duration_minutes) / 60)}h {parseInt(formData.total_duration_minutes) % 60}m
                      {formData.set_end_time ? ` • Auto-lifts at ${formatTime12h(formData.set_end_time)}` : ''}
                    </span>
                  )}
                </div>
                <input
                  type='number'
                  min='0'
                  placeholder='Auto-calculated when set time is selected'
                  value={formData.total_duration_minutes}
                  onChange={e => handleDurationChange(e.target.value)}
                  style={inputStyle}
                />

                {/* Quick Presets */}
                <div style={{display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center'}}>
                  <span style={{fontSize: 10.5, fontWeight: 700, color: S.muted}}>Quick Presets:</span>
                  {[
                    { label: '1 hr', mins: 60 },
                    { label: '2 hrs', mins: 120 },
                    { label: '4 hrs', mins: 240 },
                    { label: '8 hrs', mins: 480 },
                    { label: 'Until 5:00 PM', end: '17:00' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (preset.end) {
                          handleEndTimeChange(preset.end);
                        } else {
                          handleDurationChange(String(preset.mins));
                        }
                      }}
                      style={{
                        padding: '3px 9px',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        border: `1px solid ${S.border}`,
                        background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                        color: S.text,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{gridColumn: '1 / -1'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                  <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block'}}>
                    Affected Barangays (Palayan City) *
                  </label>
                  <span style={{fontSize: 11, fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4}}>
                    <Zap size={12} /> Highlights on Live Map
                  </span>
                </div>
                <BarangayMultiSelect
                  selected={parseBarangayList(formData.feeders_affected)}
                  onChange={(newList) => {
                    if (newList.length > 0) setBarangayError(false);
                    setFormData({...formData, feeders_affected: newList.join(", ")});
                  }}
                  error={barangayError}
                  isDark={S.isDark}
                  accent={S.accent}
                  placeholder="Select all affected Palayan barangays from dropdown..."
                />
                {barangayError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444', fontSize: 11.5, fontWeight: 700, marginTop: 5 }}>
                    <AlertCircle size={13} strokeWidth={2.4} />
                    <span>Please select at least one affected Palayan City barangay</span>
                  </div>
                )}
              </div>
              <div style={{gridColumn: '1 / -1'}}>
                <label style={{fontSize: 11, fontWeight: 800, color: S.muted, display: 'block', marginBottom: 4}}>Description / Notes</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...inputStyle, resize: 'vertical'}} />
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: `1px solid ${S.border}`}}>
              <button type='button' onClick={() => { resetForm(); setActiveTab('view'); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${S.border}`, background: S.cardSubtle, color: S.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type='submit' style={btnPrimary}><Check size={16} /> {editId ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'view' && (
        <div style={{ ...cardStyle, background: S.isDark ? "rgba(255, 255, 255, 0.02)" : S.card, padding: 18 }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <h3 style={{margin: 0, fontSize: 16, fontWeight: 800, color: S.text}}>NEECO Power Interruption Records</h3>
            <span style={{fontSize: 12, fontWeight: 600, color: S.muted}}>{records.length} total record{records.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <p style={{color: S.muted, textAlign: 'center', padding: 20}}>Loading records...</p>
          ) : records.length === 0 ? (
            <p style={{color: S.muted, textAlign: 'center', padding: 20}}>No power interruption records yet. Add one above.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {records.map(r => {
                const d = new Date(r.interruption_date + 'T00:00:00');
                const label = d.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
                const active = isPowerOutageActive(r, now);
                const endTime = getOutageEndTime(r);
                const isTimePassed = endTime ? now >= endTime : false;

                return (
                  <div
                    key={r.id}
                    style={{
                      border: `1px solid ${active ? (S.isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.3)") : S.border}`,
                      borderRadius: 10,
                      padding: 14,
                      background: active
                        ? (S.isDark ? "rgba(239, 68, 68, 0.04)" : "rgba(254, 242, 242, 0.4)")
                        : (S.isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.015)"),
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10}}>
                      <div style={{flex: 1, minWidth: 260}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap'}}>
                          <Zap size={15} color={active ? '#ef4444' : '#10b981'} strokeWidth={2.4} fill={active ? '#ef4444' : 'none'} />
                          <span style={{fontWeight: 800, fontSize: 14, color: S.text}}>{label}</span>
                          {active ? (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 10.5,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: S.isDark ? "rgba(239, 68, 68, 0.18)" : "#fef2f2",
                              color: S.isDark ? "#ef4444" : "#dc2626",
                              border: `1px solid ${S.isDark ? "rgba(239, 68, 68, 0.35)" : "#fecaca"}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }} />
                              Active Outage
                            </span>
                          ) : (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: S.isDark ? "rgba(34, 197, 94, 0.14)" : "#f0fdf4",
                              color: S.isDark ? "#22c55e" : "#16a34a",
                              border: `1px solid ${S.isDark ? "rgba(34, 197, 94, 0.28)" : "#bbf7d0"}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <Check size={11} strokeWidth={2.6} />
                              {r._autoLifted || isTimePassed ? 'Auto-Lifted' : 'Restored / Lifted'}
                            </span>
                          )}

                          {active && endTime && (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#f59e0b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: S.isDark ? "rgba(245, 158, 11, 0.12)" : "#fffbeb",
                              border: `1px solid ${S.isDark ? "rgba(245, 158, 11, 0.25)" : "#fef3c7"}`,
                              padding: '2px 7px',
                              borderRadius: 6
                            }}>
                              <Clock size={11} /> Auto-lifts: {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </span>
                          )}
                        </div>

                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11.5, color: S.muted}}>
                          {(r.total_outages || 0) > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Zap size={12} strokeWidth={2} />
                              <span>{r.total_outages} outages</span>
                            </div>
                          )}
                          {(r.total_affected_households || 0) > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Home size={12} strokeWidth={2} />
                              <span>{(r.total_affected_households || 0).toLocaleString()} households</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} strokeWidth={2} />
                            <span>{Math.floor((r.total_duration_minutes || 0) / 60)}h {(r.total_duration_minutes || 0) % 60}m</span>
                          </div>
                          {r.peak_outage_time && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} strokeWidth={2} />
                              <span>
                                Schedule: {formatTime12h(r.peak_outage_time.slice(0, 5))}
                                {endTime ? ` – ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : ''}
                              </span>
                            </div>
                          )}
                          {r.cause && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Wrench size={12} strokeWidth={2} />
                              <span>{causeLabels[r.cause] || r.cause}</span>
                            </div>
                          )}
                        </div>

                        {r.feeders_affected && parseBarangayList(r.feeders_affected).length > 0 ? (
                          <div style={{margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'}}>
                            <span style={{fontSize: 11, fontWeight: 700, color: S.muted, display: 'flex', alignItems: 'center', gap: 4}}>
                              <MapPin size={12} color="#f97316" /> Affected Barangays:
                            </span>
                            {(() => {
                              const bList = parseBarangayList(r.feeders_affected);
                              if (bList.length >= 18) {
                                return (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                      padding: '2px 9px',
                                      borderRadius: 6,
                                      fontSize: 11,
                                      fontWeight: 800,
                                      background: S.isDark ? "rgba(249, 115, 22, 0.22)" : "#fff7ed",
                                      border: `1px solid ${S.isDark ? "rgba(249, 115, 22, 0.45)" : "#fed7aa"}`,
                                      color: S.isDark ? "#fb923c" : "#c2410c",
                                    }}
                                  >
                                    ⚡ Palayan City (City-wide)
                                  </span>
                                );
                              }
                              return bList.map((bgy) => (
                                <span
                                  key={bgy}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: S.isDark ? "rgba(249, 115, 22, 0.16)" : "#fff7ed",
                                    border: `1px solid ${S.isDark ? "rgba(249, 115, 22, 0.35)" : "#ffedd5"}`,
                                    color: S.isDark ? "#fb923c" : "#c2410c",
                                  }}
                                >
                                  {bgy}
                                </span>
                              ));
                            })()}
                          </div>
                        ) : (
                          <div style={{margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6}}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#ef4444'
                            }}>
                              <AlertCircle size={12} strokeWidth={2.4} /> No barangay selected (Click Edit to assign)
                            </span>
                          </div>
                        )}
                        {r.description && <p style={{margin: '4px 0 0', fontSize: 12, color: S.muted}}>{r.description}</p>}
                      </div>

                      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto'}}>
                        {active ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLiftOutage(r);
                            }}
                            title="Lift power outage and clear map highlights immediately"
                            style={{
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 7,
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: 11.5,
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.32)",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Zap size={12} fill="#ffffff" />
                            Lift Outage
                          </button>
                        ) : (
                          <span
                            style={{
                              padding: "4px 9px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              color: S.isDark ? "#22c55e" : "#16a34a",
                              background: S.isDark ? "rgba(34, 197, 94, 0.1)" : "#f0fdf4",
                              border: `1px solid ${S.isDark ? "rgba(34, 197, 94, 0.2)" : "#bbf7d0"}`,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Check size={11} strokeWidth={2.6} /> Lifted
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEdit(r)}
                          style={{
                            background: S.isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                            border: `1px solid ${S.border}`,
                            borderRadius: 6,
                            padding: "5px 9px",
                            cursor: 'pointer',
                            color: S.text,
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(r.id);
                          }}
                          style={{ ...btnDanger, fontSize: 11, padding: "5px 9px" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
