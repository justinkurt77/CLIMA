# Admin Dashboard Analytics Redesign - Implementation Plan

## Overview
This plan redesigns the AdminDashboard Overview tab as a comprehensive analytics dashboard with charts, and moves the 4 report status cards to the top of the Reports tab.

**File to modify:** `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx`

---

## 1. Add recharts Import to File Header

**Location:** After the existing imports at the top of the file (around line 1-11)

**Action:** Add recharts components import

```javascript
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
```

**Verification:** Run `npm run build` — should compile without import errors

---

## 2. Create Utility Helper Functions

**Location:** Before the `OverviewTab` function (around line 580)

**Action:** Add utility functions for trend calculation and data formatting

```javascript
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
```

**Verification:** No immediate verification needed — used by OverviewTab

---

## 3. Replace the OverviewTab Function

**Location:** Lines 585-622 (current OverviewTab implementation)

**Action:** Replace the entire `OverviewTab` function with a new analytics-focused version

### 3a. New OverviewTab Structure

```javascript
/* ── Overview Tab - Analytics Dashboard ── */
function OverviewTab({ reports, S, cardStyle, onViewReport }) {
  const [analyticsData, setAnalyticsData] = useState({
    hospitalRecords: [],
    cdrrmoRecords: [],
    bfpRecords: [],
    advisories: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // 7, 30, or 90 days

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
```

### 3b. Add Supporting Components and Data Prep Functions

**Location:** After the new OverviewTab function

```javascript
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
```

**Verification:** Run `npm run dev` — navigate to Dashboard > Overview tab, verify charts render with no errors

---

## 4. Update ReportsTab with Status Cards

**Location:** Find the ReportsTab function (around line 670)

**Action:** Add the 4 status cards at the top of the ReportsTab return statement, before the existing card that contains search/filter

### 4a. Modify ReportsTab Return Statement

**Find this section (around line 750):**
```javascript
return (
  <div style={cardStyle}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
```

**Replace with:**
```javascript
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
```

**And at the end of ReportsTab, close the new wrapper div:**

Find the last closing tag of the ReportsTab return (currently `</div>`) and ensure it closes both the cardStyle div AND the outer flex container.

**Verification:** Run `npm run dev` — navigate to Dashboard > Citizen Reports tab, verify 4 cards appear at top before the search/filter section

---

## 5. Database Column Reference

Based on exploration of SQL schema files and existing queries in the codebase:

### hospital_daily_records
- `record_date` (DATE)
- `heat_stroke_cases` (INT)
- `heat_exhaustion_cases` (INT)
- `dehydration_cases` (INT)
- `respiratory_cases` (INT)
- `total_admissions` (INT)
- `remarks` (TEXT)

### cdrrmo_daily_operations
- `operation_date` (DATE)
- `relief_operations` (INT)
- `evacuations_conducted` (INT)
- `families_assisted` (INT)
- `distribution_points` (INT)
- `ambulance_dispatches` (INT)
- `emergency_responses` (INT)
- `remarks` (TEXT)

### bfp_daily_operations
- `operation_date` (DATE)
- `fire_incidents` (INT)
- `fire_prevention_inspections` (INT)
- `fire_safety_seminars` (INT)
- `rescue_operations` (INT)
- `medical_assists` (INT)
- `emergency_responses` (INT)
- `remarks` (TEXT)

### advisories
- `id` (UUID)
- `title` (TEXT)
- `content` (TEXT)
- `category` (VARCHAR)
- `status` (VARCHAR) - values: Draft, Pending, Published, Archived
- `created_at` (TIMESTAMPTZ)
- `published_at` (TIMESTAMPTZ)

---

## 6. Styling and Theme Integration

All charts use the existing theme colors from the `S` (styles) prop:
- `S.accent` - primary accent color (varies by department)
- `S.red` (#E74C3C) - error/pending states
- `S.green` (#4BB450) - success/resolved states
- `S.blue` (#3498DB) - info/in-progress states
- `S.border` - border colors
- `S.muted` - muted text colors
- `S.card` - card backgrounds

Charts are wrapped in `ResponsiveContainer` to adapt to parent container width automatically.

---

## 7. Final Verification Steps

After implementing all changes:

1. **Build Check:**
   ```powershell
   npm run build
   ```
   Verify no TypeScript/import errors

2. **Development Server:**
   ```powershell
   npm run dev
   ```

3. **Visual Verification:**
   - Navigate to Admin Dashboard
   - Check Overview tab displays:
     - Date range selector (7/30/90 days)
     - 6 summary cards with icons
     - 5 charts (Reports Trend, Top Categories, Health Ops, Emergency Ops, Status Distribution)
     - Loading skeletons appear during data fetch
   - Check Reports tab displays:
     - 4 status cards at top (Total, Pending, In Progress, Resolved)
     - Search/filter section below cards
     - Reports list below filters

4. **Interaction Testing:**
   - Click date range buttons (7/30/90 days) - charts should update
   - Hover over chart elements - tooltips should appear
   - Verify chart legends are readable
   - Check responsive behavior on smaller screens

5. **Data Validation:**
   - Verify trend arrows show correct direction (up/down/stable)
   - Confirm summary card counts match what's in the database
   - Check chart data points correspond to actual records

---

## Notes

- **Recharts is already installed** (v3.10.1 in package.json) - no installation needed
- The existing `reports` prop passed to OverviewTab contains all citizen reports with `created_at`, `status`, `category` fields
- All database queries use the existing `supabase` import already in the file
- The plan follows the existing code style: inline styles, no CSS modules, consistent use of the `S` theme object
- Loading states use simple skeleton divs with pulse animation
- Error handling logs to console (following existing pattern in the codebase)
- Date formatting uses simple MM/DD format for chart x-axes to save space
- El Niño cases calculated as sum of: heat_stroke + heat_exhaustion + dehydration + respiratory cases

---

## Implementation Order

1. Add recharts import
2. Add utility functions
3. Replace OverviewTab function
4. Add supporting components (SummaryCard, data prep functions)
5. Update ReportsTab with status cards
6. Test and verify

Each step leaves the codebase in a buildable state.
