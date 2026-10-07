import { useState } from "react";
import { ClipboardList, Inbox } from "lucide-react";
import ReportCard from "../components/ui/ReportCard";

function MyReportsScreen({ onOpenModal, userReports = [] }) {
  const [filter, setFilter] = useState("all");
  // Merge static sample data + user-submitted reports
  const allReports = [...userReports];

  const filteredReports = allReports.filter(
    (r) => filter === "all" || r.status === filter,
  );

  const isEmptyDueToFilter = allReports.length > 0 && filteredReports.length === 0;

  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, #769054 0%, #4b6043 100%)",
          borderRadius: 28,
          margin: "16px",
          marginTop: "calc(16px + env(safe-area-inset-top, 0px))",
          padding: "24px",
          flexShrink: 0,
          boxShadow: "0 8px 24px rgba(75, 96, 67, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        
        <div>
          <div
            style={{
              fontFamily: "'Baloo 2', cursive",
              fontSize: 28,
              fontWeight: 900,
              color: "white",
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            My Reports
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.85)",
              fontWeight: 600,
            }}
          >
            All your reported problems
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            padding: "8px 14px",
            borderRadius: 20,
            color: "white",
            fontSize: 13,
            fontWeight: 800,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {allReports.length} {allReports.length === 1 ? "Report" : "Reports"}
        </div>
      </div>

      <div
        style={{
          padding: "8px 16px 16px 16px",
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
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "8px 18px",
              borderRadius: 24,
              border: filter === f.id ? "none" : "1px solid rgba(75, 96, 67, 0.15)",
              background: filter === f.id ? "#4B6043" : "rgba(255, 255, 255, 0.95)",
              color: filter === f.id ? "white" : "#4B6043",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              boxShadow:
                filter === f.id
                  ? "0 4px 12px rgba(75, 96, 67, 0.2)"
                  : "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            {f.label}
          </button>
        ))}
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
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {filteredReports.length === 0 ? (
            <div
              className="empty-state"
              style={{
                borderRadius: 24,
                padding: "48px 24px",
                background: "white",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                border: "1px solid rgba(75, 96, 67, 0.08)",
                margin: "8px 0"
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f0fcf5, #e3f2dc)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4B6043",
                  marginBottom: 4,
                }}
              >
                {isEmptyDueToFilter ? (
                  <Inbox size={34} strokeWidth={1.5} />
                ) : (
                  <ClipboardList size={34} strokeWidth={1.5} />
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280, textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Baloo 2', cursive",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#4B6043",
                    lineHeight: 1.3,
                  }}
                >
                  {isEmptyDueToFilter ? "No matching reports" : "You haven't reported anything yet!"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(75, 96, 67, 0.65)",
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
                  background: "#4B6043",
                  color: "white",
                  border: "none",
                  borderRadius: 20,
                  padding: "12px 28px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(75, 96, 67, 0.25)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.96)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
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
    </>
  );
}

export default MyReportsScreen;
