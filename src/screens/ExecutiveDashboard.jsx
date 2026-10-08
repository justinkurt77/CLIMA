import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import "jspdf-autotable";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function ExecutiveDashboard() {
  const { isDark } = useTheme();
  const [dateRange, setDateRange] = useState("7days"); // 7days, 30days, 90days, year
  const [analytics, setAnalytics] = useState({
    incidents: [],
    categories: [],
    heatIndex: [],
    utilities: [],
    hospitals: [],
    fire: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : dateRange === "90days" ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Incidents by day
      const { data: incidents } = await supabase
        .from("reports")
        .select("created_at, status, category")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      // Category breakdown
      const { data: categories } = await supabase
        .from("reports")
        .select("category")
        .gte("created_at", startDate.toISOString());

      // Hospitals data
      const { data: hospitals } = await supabase
        .from("hospitals")
        .select("heat_stroke_cases, heat_exhaustion_cases, dehydration_cases");

      // Process data
      const incidentsByDay = processIncidentsByDay(incidents || []);
      const categoryBreakdown = processCategoryBreakdown(categories || []);
      const hospitalStats = processHospitalStats(hospitals || []);

      setAnalytics({
        incidents: incidentsByDay,
        categories: categoryBreakdown,
        hospitals: hospitalStats,
        heatIndex: generateMockHeatIndexData(daysAgo),
        utilities: generateMockUtilityData(),
        fire: generateMockFireData(),
      });
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const processIncidentsByDay = (incidents) => {
    const dayMap = {};
    incidents.forEach((inc) => {
      const day = new Date(inc.created_at).toLocaleDateString();
      if (!dayMap[day]) {
        dayMap[day] = { date: day, pending: 0, inprogress: 0, resolved: 0 };
      }
      dayMap[day][inc.status]++;
    });
    return Object.values(dayMap);
  };

  const processCategoryBreakdown = (categories) => {
    const catMap = {};
    categories.forEach((cat) => {
      const category = cat.category || "Other";
      catMap[category] = (catMap[category] || 0) + 1;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  };

  const processHospitalStats = (hospitals) => {
    const totals = hospitals.reduce(
      (acc, h) => ({
        heatStroke: acc.heatStroke + (h.heat_stroke_cases || 0),
        heatExhaustion: acc.heatExhaustion + (h.heat_exhaustion_cases || 0),
        dehydration: acc.dehydration + (h.dehydration_cases || 0),
      }),
      { heatStroke: 0, heatExhaustion: 0, dehydration: 0 }
    );

    return [
      { name: "Heat Stroke", value: totals.heatStroke },
      { name: "Heat Exhaustion", value: totals.heatExhaustion },
      { name: "Dehydration", value: totals.dehydration },
    ];
  };

  const generateMockHeatIndexData = (days) => {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString(),
        heatIndex: 35 + Math.random() * 10,
        temperature: 30 + Math.random() * 8,
      });
    }
    return data;
  };

  const generateMockUtilityData = () => [
    { name: "Power Interruptions", value: 12 },
    { name: "Water Outages", value: 8 },
    { name: "Resolved", value: 15 },
  ];

  const generateMockFireData = () => [
    { month: "Jan", incidents: 3 },
    { month: "Feb", incidents: 2 },
    { month: "Mar", incidents: 5 },
    { month: "Apr", incidents: 4 },
    { month: "May", incidents: 6 },
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("CLIMA Executive Report", 14, 22);

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Period: ${dateRange}`, 14, 36);

    // Incidents Table
    doc.setFontSize(14);
    doc.text("Incident Summary", 14, 46);

    const incidentData = analytics.categories.map((cat) => [
      cat.name,
      cat.value,
    ]);

    doc.autoTable({
      startY: 50,
      head: [["Category", "Count"]],
      body: incidentData,
    });

    // Hospital Cases
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text("Hospital Cases", 14, finalY);

    const hospitalData = analytics.hospitals.map((h) => [h.name, h.value]);

    doc.autoTable({
      startY: finalY + 4,
      head: [["Condition", "Cases"]],
      body: hospitalData,
    });

    // Save
    doc.save(`CLIMA_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportToExcel = async () => {
    // Simple CSV export (for full Excel support, use xlsx library)
    let csv = "CLIMA Executive Report\n";
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Period: ${dateRange}\n\n`;

    csv += "Incident Categories\n";
    csv += "Category,Count\n";
    analytics.categories.forEach((cat) => {
      csv += `${cat.name},${cat.value}\n`;
    });

    csv += "\nHospital Cases\n";
    csv += "Condition,Cases\n";
    analytics.hospitals.forEach((h) => {
      csv += `${h.name},${h.value}\n`;
    });

    // Create download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CLIMA_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BarChart3 size={28} color="#3B82F6" />
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: isDark ? "#ffffff" : "#09090b",
                  margin: 0,
                }}
              >
                Executive Dashboard
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: isDark ? "#a1a1aa" : "#71717a",
                  margin: 0,
                }}
              >
                Comprehensive analytics and reporting
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                background: isDark ? "#27272a" : "#ffffff",
                color: isDark ? "#ffffff" : "#09090b",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>

            {/* Export Buttons */}
            <button
              onClick={exportToPDF}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#EF4444",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FileText size={16} />
              PDF
            </button>

            <button
              onClick={exportToExcel}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#10B981",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={16} />
              CSV
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: isDark ? "#71717a" : "#a1a1aa",
          }}
        >
          Loading analytics...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: 20,
          }}
        >
          {/* Incidents by Day */}
          <div
            style={{
              background: isDark ? "#18181b" : "#ffffff",
              borderRadius: 12,
              padding: 20,
              border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
              gridColumn: "span 2",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#09090b",
                marginBottom: 16,
              }}
            >
              Incident Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.incidents}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e5e7eb"} />
                <XAxis dataKey="date" stroke={isDark ? "#71717a" : "#a1a1aa"} />
                <YAxis stroke={isDark ? "#71717a" : "#a1a1aa"} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#18181b" : "#ffffff",
                    border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="inprogress" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div
            style={{
              background: isDark ? "#18181b" : "#ffffff",
              borderRadius: 12,
              padding: 20,
              border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#09090b",
                marginBottom: 16,
              }}
            >
              Incident Categories
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Hospital Cases */}
          <div
            style={{
              background: isDark ? "#18181b" : "#ffffff",
              borderRadius: 12,
              padding: 20,
              border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#09090b",
                marginBottom: 16,
              }}
            >
              Hospital Cases
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.hospitals}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e5e7eb"} />
                <XAxis dataKey="name" stroke={isDark ? "#71717a" : "#a1a1aa"} />
                <YAxis stroke={isDark ? "#71717a" : "#a1a1aa"} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#18181b" : "#ffffff",
                    border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heat Index */}
          <div
            style={{
              background: isDark ? "#18181b" : "#ffffff",
              borderRadius: 12,
              padding: 20,
              border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
              gridColumn: "span 2",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#09090b",
                marginBottom: 16,
              }}
            >
              Heat Index Analytics
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.heatIndex}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e5e7eb"} />
                <XAxis dataKey="date" stroke={isDark ? "#71717a" : "#a1a1aa"} />
                <YAxis stroke={isDark ? "#71717a" : "#a1a1aa"} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#18181b" : "#ffffff",
                    border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="heatIndex" stroke="#F59E0B" strokeWidth={2} name="Heat Index" />
                <Line type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2} name="Temperature" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
