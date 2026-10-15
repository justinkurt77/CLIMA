import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import {
  X,
  ArrowLeft,
  LogOut,
  AlertCircle,
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { useTheme } from "../context/ThemeContext";
import CustomSelect from "../components/ui/CustomSelect";
import AdminOverviewCommand from "../components/dashboard/AdminOverviewCommand";

// Color design tokens: Black for dark mode, White for light mode, Orange-Yellow accents
const getZTokens = (isDark) => ({
  50: isDark ? "#000000" : "#ffffff",
  100: isDark ? "#09090b" : "#f8f9fa",
  200: isDark ? "#121214" : "#ffffff",
  250: isDark ? "#18181b" : "#f4f4f6",
  300: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.10)",
  400: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.18)",
  500: isDark ? "#52525b" : "#a1a1aa",
  600: isDark ? "#71717a" : "#71717a",
  700: isDark ? "#a1a1aa" : "#52525b",
  800: isDark ? "#e4e4e7" : "#27272a",
  900: "#f59e0b",
  920: "#fbbf24",
  940: "#ea580c",
  950: isDark ? "#ffffff" : "#09090b",
  glassBg: isDark ? "rgba(18, 18, 20, 0.94)" : "rgba(255, 255, 255, 0.95)",
  glassRail: isDark ? "rgba(12, 12, 14, 0.85)" : "rgba(244, 244, 246, 0.92)",
});

const SC = { pending: "#ef4444", inprogress: "#3b82f6", resolved: "#22c55e" };
const SBG = { pending: "rgba(239, 68, 68, 0.15)", inprogress: "rgba(59, 130, 246, 0.15)", resolved: "rgba(34, 197, 94, 0.15)" };
const SL = { pending: "Pending", inprogress: "In Progress", resolved: "Resolved" };

const ICON_MAP = {
  ShieldAlert,
  Wrench,
  Trash2,
  Dog,
  Construction,
  TreePine,
  CarFront,
  ClipboardList,
};

const REPORT_REFRESH_MS = 30 * 1000;

/**
 * Full-screen Field GIS Console.
 * Shares the exact same live map as the dashboard overview (theme-aware Dark / Light /
 * Satellite basemap, live KloudTech + rainfall data, realtime citizen reports) â€“
 * this screen only adds the standalone header and the report detail modal.
 */
export default function AdminMapScreen({
  onLogout,
  onBackToDashboard,
  isSuperadmin,
  adminCategories,
  adminDepartment,
}) {
  const { isDark } = useTheme();
  const Z = useMemo(() => getZTokens(isDark), [isDark]);
  const [reports, setReports] = useState([]);
  const [detailReport, setDetailReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (!isSuperadmin && adminCategories && !adminCategories.includes("All Categories")) {
        query = query.in("category", adminCategories);
      }
      const { data, error } = await query;
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      logger.error("Error fetching map reports:", err);
    }
  }, [isSuperadmin, adminCategories]);

  // Realtime: any insert / update / delete on reports refreshes the map immediately,
  // with a periodic refresh as a safety net if the realtime channel is unavailable.
  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel("admin_map_reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => fetchReports())
      .subscribe();
    const poll = setInterval(() => {
      if (!document.hidden) fetchReports();
    }, REPORT_REFRESH_MS);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  const pillBase = {
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 9999,
    background: Z.glassBg,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${Z[300]}`,
    boxShadow: isDark ? "0 10px 30px rgba(0, 0, 0, 0.5)" : "0 8px 24px rgba(0, 0, 0, 0.08)",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: Z[50],
        color: Z[950],
        fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
        borderRadius: "inherit",
        zIndex: 50,
      }}
    >
      <AdminOverviewCommand
        reports={reports}
        onViewReport={setDetailReport}
        isDark={isDark}
        isSuperadmin={isSuperadmin}
        adminDepartment={adminDepartment}
        leftInset={14}
      />

      <header
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          height: 44,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <div style={pillBase}>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              title="Return to Admin Dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 9999,
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                color: Z[900],
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </button>
          )}
          <span style={{ fontSize: 13, fontWeight: 900, color: Z[950], letterSpacing: "-0.01em" }}>
            Palayan Field GIS Console
          </span>
        </div>

        <div style={{ ...pillBase, padding: "4px 8px" }}>
          <button
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onStatusChange={(newStatus) => {
            setReports((prev) => prev.map((r) => (r.id === detailReport.id ? { ...r, status: newStatus } : r)));
          }}
        />
      )}
    </div>
  );
}

/* ── Full Report Detail Modal ── */
function ReportDetailModal({ report, onClose, onStatusChange }) {
  const { isDark } = useTheme();
  const Z = getZTokens(isDark);
  const [status, setStatus] = useState(report.status);
  const [updating, setUpdating] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const DynIcon = (report.icon && ICON_MAP[report.icon]) || AlertCircle;
  const photos = report.photo_url
    ? report.photo_url.split(",").filter(Boolean)
    : [];

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await supabase
        .from("reports")
        .update({ status: newStatus, status_label: SL[newStatus] || newStatus })
        .eq("id", report.id);
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (e) {
      logger.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const guestMatch = report.description?.match(
    /^\[GUEST:.*?-\s*Contact:\s*(.+?)\]/
  );
  const contactNumber = guestMatch ? guestMatch[1].trim() : null;
  const desc = DOMPurify.sanitize(
    report.description?.replace(/^\[GUEST:.*?\]\n\n/s, "") ||
      "No description provided."
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: Z[100],
            border: `1px solid ${Z[300]}`,
            borderRadius: 20,
            width: "100%",
            maxWidth: 520,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            color: Z[950],
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${Z[300]}`,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: SBG[status] || SBG.pending,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DynIcon size={22} color={SC[status] || SC.pending} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                {report.title}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: Z[600], fontWeight: 700 }}>
                {report.category || "Uncategorized"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: Z[50],
                border: `1px solid ${Z[300]}`,
                color: Z[700],
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: Z[50],
                borderRadius: 12,
                border: `1px solid ${Z[300]}`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: SC[status] || SC.pending }}>
                Status: {SL[status] || status}
              </span>
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
                accent={Z[900]}
              />
            </div>

            {/* Reporter details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                background: Z[50],
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${Z[300]}`,
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: Z[700], fontSize: 10, fontWeight: 700, display: "block" }}>
                  REPORTED BY
                </span>
                <span style={{ fontWeight: 800 }}>{report.full_name || "Anonymous"}</span>
              </div>
              <div>
                <span style={{ color: Z[700], fontSize: 10, fontWeight: 700, display: "block" }}>
                  DATE FILED
                </span>
                <span style={{ fontWeight: 800 }}>
                  {new Date(report.created_at).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {contactNumber && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: Z[700], fontSize: 10, fontWeight: 700, display: "block" }}>
                    CONTACT
                  </span>
                  <span style={{ fontWeight: 800 }}>{contactNumber}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <span style={{ color: Z[700], fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                Description
              </span>
              <p
                style={{
                  margin: "6px 0 0",
                  padding: 12,
                  background: Z[50],
                  borderRadius: 10,
                  border: `1px solid ${Z[300]}`,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: Z[800],
                }}
              >
                {desc}
              </p>
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div>
                <span style={{ color: Z[700], fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                  Photos ({photos.length})
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                  {photos.map((p, i) => (
                    <img
                      key={i}
                      src={p.trim()}
                      alt="Report evidence"
                      onClick={() => setLightboxImg(p.trim())}
                      style={{
                        width: "100%",
                        height: 110,
                        objectFit: "cover",
                        borderRadius: 10,
                        cursor: "pointer",
                        border: `1px solid ${Z[300]}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
