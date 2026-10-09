import { useState } from "react";
import { ClipboardList, Inbox, Plus } from "lucide-react";
import ReportCard from "../components/ui/ReportCard";
import { useTheme } from "../context/ThemeContext";

function MyReportsScreen({ onOpenModal, userReports = [] }) {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState("all");
  const allReports = [...userReports];

  const filteredReports = allReports.filter(
    (r) => filter === "all" || r.status === filter,
  );

  const isEmptyDueToFilter = allReports.length > 0 && filteredReports.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-app)", transition: "background-color 0.25s ease" }}>
      {/* Header Card */}
      <div
        style={{
          background: isDark
            ? "linear-gradient(145deg, #18181b 0%, #0d0d0f 100%)"
            : "linear-gradient(145deg, #ffffff 0%, #f4f4f6 100%)",
          borderRadius: 26,
          border: "1px solid var(--border-medium)",
          margin: "12px 14px",
          marginTop: "calc(12px + env(safe-area-inset-top, 0px))",
          padding: "22px",
          flexShrink: 0,
          boxShadow: "var(--shadow-card)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1.1,
              marginBottom: 4,
              letterSpacing: -0.5,
            }}
          >
            My Reports
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            All your submitted climate reports
          </div>
        </div>

        <div
          style={{
            background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid rgba(0, 0, 0, 0.1)",
            padding: "8px 14px",
            borderRadius: 18,
            color: "var(--text-primary)",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {allReports.length} {allReports.length === 1 ? "Report" : "Reports"}
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          padding: "4px 14px 14px",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          flexShrink: 0,
        }}
        className="hide-scroll"
      >
        {[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "inprogress", label: "In Progress" },
          { id: "resolved", label: "Resolved" },
        ].map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "8px 18px",
                borderRadius: 22,
                border: isActive
                  ? "none"
                  : "1px solid var(--border-subtle)",
                background: isActive ? "var(--btn-primary-bg)" : "var(--bg-card)",
                color: isActive ? "var(--btn-primary-text)" : "var(--text-muted)",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                boxShadow: isActive
                  ? "var(--shadow-card)"
                  : "none",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          className="scroll-area hide-scroll"
          style={{
            padding: "0 14px 100px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {filteredReports.length === 0 ? (
            <div
              className="empty-state"
              style={{
                borderRadius: 24,
                padding: "48px 24px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                margin: "12px 0",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--bg-card-subtle)",
                  border: "1px solid var(--border-medium)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {isEmptyDueToFilter ? (
                  <Inbox size={32} strokeWidth={1.8} />
                ) : (
                  <ClipboardList size={32} strokeWidth={1.8} />
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280, textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  {isEmptyDueToFilter ? "No matching reports" : "No reports yet"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {isEmptyDueToFilter
                    ? `You don't have any reports currently marked as "${filter === "inprogress" ? "In Progress" : filter.charAt(0).toUpperCase() + filter.slice(1)}".`
                    : "Help the community by reporting problems you see."}
                </div>
              </div>

              <button
                onClick={isEmptyDueToFilter ? () => setFilter("all") : onOpenModal}
                style={{
                  marginTop: 8,
                  background: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-text)",
                  border: "none",
                  borderRadius: 22,
                  padding: "11px 26px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "var(--shadow-card)",
                  transition: "all 0.2s ease",
                }}
              >
                {isEmptyDueToFilter ? "Show All Reports" : "Make a Report"}
              </button>
            </div>
          ) : (
            <>
              {filteredReports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyReportsScreen;
