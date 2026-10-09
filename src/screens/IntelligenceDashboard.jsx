import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Bell, Network, Activity } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function IntelligenceDashboard() {
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // active, all, resolved

  useEffect(() => {
    fetchData();

    // Real-time subscriptions
    const alertsSub = supabase
      .channel("conflict_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conflict_alerts" },
        () => fetchData()
      )
      .subscribe();

    const notifsSub = supabase
      .channel("inter_agency_notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inter_agency_notifications" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      alertsSub.unsubscribe();
      notifsSub.unsubscribe();
    };
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch alerts
      let alertsQuery = supabase
        .from("conflict_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter === "active") {
        alertsQuery = alertsQuery.eq("status", "active");
      } else if (filter === "resolved") {
        alertsQuery = alertsQuery.eq("status", "resolved");
      }

      const { data: alertsData } = await alertsQuery;

      // Fetch notifications
      const { data: notifsData } = await supabase
        .from("inter_agency_notifications")
        .select(`
          *,
          from_department:departments!from_department_id(name),
          to_department:departments!to_department_id(name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      setAlerts(alertsData || []);
      setNotifications(notifsData || []);
    } catch (err) {
      console.error("Failed to fetch intelligence data:", err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from("conflict_alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from("conflict_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return { bg: "#DC2626", text: "#ffffff", border: "#B91C1C" };
      case "high":
        return { bg: "#F59E0B", text: "#ffffff", border: "#D97706" };
      case "medium":
        return { bg: "#3B82F6", text: "#ffffff", border: "#2563EB" };
      case "low":
        return { bg: "#10B981", text: "#ffffff", border: "#059669" };
      default:
        return { bg: "#6B7280", text: "#ffffff", border: "#4B5563" };
    }
  };

  const getAlertTypeIcon = (alertType) => {
    switch (alertType) {
      case "utility_outage_impact":
        return "⚠️";
      case "concurrent_incidents":
        return "🔥";
      case "resource_conflict":
        return "⚡";
      default:
        return "🔔";
    }
  };

  return (
    <div
      style={{
        flex: 1,
        background: isDark ? "#09090b" : "#f9fafb",
        overflow: "auto",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isDark ? "#18181b" : "#ffffff",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
          border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Network size={28} color="#3B82F6" />
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: isDark ? "#ffffff" : "#09090b",
                margin: 0,
              }}
            >
              Inter-Agency Intelligence
            </h1>
            <p
              style={{
                fontSize: 14,
                color: isDark ? "#a1a1aa" : "#71717a",
                margin: 0,
              }}
            >
              Automated conflict detection and cross-agency coordination
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            { label: "Active Alerts", value: alerts.filter(a => a.status === "active").length, icon: "🚨", color: "#EF4444" },
            { label: "Acknowledged", value: alerts.filter(a => a.status === "acknowledged").length, icon: "👁️", color: "#F59E0B" },
            { label: "Resolved", value: alerts.filter(a => a.status === "resolved").length, icon: "✅", color: "#10B981" },
            { label: "Notifications", value: notifications.filter(n => !n.read).length, icon: "📬", color: "#3B82F6" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: isDark ? "#27272a" : "#f3f4f6",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: stat.color,
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: isDark ? "#a1a1aa" : "#71717a",
                  fontWeight: 600,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8 }}>
          {["active", "all", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background:
                  filter === f
                    ? isDark
                      ? "#ffffff"
                      : "#09090b"
                    : isDark
                      ? "#27272a"
                      : "#e5e7eb",
                color:
                  filter === f
                    ? isDark
                      ? "#09090b"
                      : "#ffffff"
                    : isDark
                      ? "#a1a1aa"
                      : "#52525b",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
        }}
      >
        {/* Alerts Column */}
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: isDark ? "#ffffff" : "#09090b",
              marginBottom: 16,
            }}
          >
            Conflict Alerts
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: isDark ? "#71717a" : "#a1a1aa" }}>
              Loading...
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: isDark ? "#71717a" : "#a1a1aa" }}>
              No alerts found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {alerts.map((alert) => {
                const severity = getSeverityColor(alert.severity);
                return (
                  <div
                    key={alert.id}
                    style={{
                      background: isDark ? "#18181b" : "#ffffff",
                      borderRadius: 12,
                      border: `2px solid ${severity.border}`,
                      overflow: "hidden",
                    }}
                  >
                    {/* Alert Header */}
                    <div
                      style={{
                        background: severity.bg,
                        padding: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 24 }}>{getAlertTypeIcon(alert.alert_type)}</div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: severity.text,
                            marginBottom: 4,
                          }}
                        >
                          {alert.title}
                        </div>
                        <div style={{ fontSize: 12, color: severity.text, opacity: 0.9 }}>
                          {alert.alert_type.replace(/_/g, " ").toUpperCase()}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.2)",
                          color: severity.text,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {alert.status}
                      </div>
                    </div>

                    {/* Alert Body */}
                    <div style={{ padding: 16 }}>
                      <p
                        style={{
                          fontSize: 14,
                          color: isDark ? "#e4e4e7" : "#3f3f46",
                          lineHeight: 1.6,
                          margin: 0,
                          marginBottom: 12,
                        }}
                      >
                        {alert.description}
                      </p>

                      {/* Affected Facilities */}
                      {alert.affected_facilities && alert.affected_facilities.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: isDark ? "#a1a1aa" : "#71717a",
                              marginBottom: 8,
                            }}
                          >
                            Affected Facilities:
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {alert.affected_facilities.map((facility, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: "8px 12px",
                                  background: isDark ? "#27272a" : "#f3f4f6",
                                  borderRadius: 8,
                                  fontSize: 13,
                                  color: isDark ? "#e4e4e7" : "#3f3f46",
                                }}
                              >
                                <strong>{facility.id}</strong> - {facility.info || ""}
                                {facility.criticality && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      background: "#F59E0B",
                                      color: "#ffffff",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {facility.criticality}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div style={{ fontSize: 12, color: isDark ? "#71717a" : "#a1a1aa", marginBottom: 12 }}>
                        {new Date(alert.created_at).toLocaleString()}
                      </div>

                      {/* Actions */}
                      {alert.status === "active" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            style={{
                              flex: 1,
                              padding: "10px 16px",
                              borderRadius: 8,
                              border: "none",
                              background: "#3B82F6",
                              color: "#ffffff",
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            style={{
                              flex: 1,
                              padding: "10px 16px",
                              borderRadius: 8,
                              border: "none",
                              background: "#10B981",
                              color: "#ffffff",
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Column */}
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: isDark ? "#ffffff" : "#09090b",
              marginBottom: 16,
            }}
          >
            Recent Notifications
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  background: isDark ? "#18181b" : "#ffffff",
                  borderRadius: 12,
                  padding: 16,
                  border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                  opacity: notif.read ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isDark ? "#ffffff" : "#09090b",
                    marginBottom: 6,
                  }}
                >
                  {notif.subject}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: isDark ? "#a1a1aa" : "#71717a",
                    lineHeight: 1.5,
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  {notif.message}
                </p>
                <div
                  style={{
                    fontSize: 11,
                    color: isDark ? "#71717a" : "#a1a1aa",
                  }}
                >
                  From: {notif.from_department?.name || "System"} →{" "}
                  {notif.to_department?.name || "All"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
