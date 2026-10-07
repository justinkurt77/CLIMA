import { useState } from "react";
import { ClipboardList, Inbox, Plus } from "lucide-react";
import ReportCard from "../components/ui/ReportCard";

function MyReportsScreen({ onOpenModal, userReports = [] }) {
  const [filter, setFilter] = useState("all");
  const allReports = [...userReports];

  const filteredReports = allReports.filter(
    (r) => filter === "all" || r.status === filter,
  );

  const isEmptyDueToFilter = allReports.length > 0 && filteredReports.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000000" }}>
      {/* Header Card */}
      <div
        style={{
          background: "linear-gradient(145deg, #18181b 0%, #0d0d0f 100%)",
          borderRadius: 26,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          margin: "12px 14px",
          marginTop: "calc(12px + env(safe-area-inset-top, 0px))",
          padding: "22px",
          flexShrink: 0,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
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
              color: "#ffffff",
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
              color: "#a1a1aa",
              fontWeight: 600,
            }}
          >
            All your submitted incident reports
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            padding: "8px 14px",
            borderRadius: 18,
            color: "#ffffff",
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
                  : "1px solid rgba(255, 255, 255, 0.12)",
                background: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.05)",
                color: isActive ? "#000000" : "#a1a1aa",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                boxShadow: isActive
                  ? "0 4px 14px rgba(255, 255, 255, 0.2)"
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
                background: "#121214",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
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
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
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
                    color: "#ffffff",
                    lineHeight: 1.3,
                  }}
                >
                  {isEmptyDueToFilter ? "No matching reports" : "No reports yet"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#71717a",
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
                  background: "#ffffff",
                  color: "#000000",
                  border: "none",
                  borderRadius: 22,
                  padding: "11px 26px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(255, 255, 255, 0.15)",
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
