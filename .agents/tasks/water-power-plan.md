# Implementation Plan: Water & Power Utility Modules Redesign

## Overview
Redesign Water and Power utility modules to track **interruption events** (per-operation records) instead of static facilities/feeders. Follow the proven CDRRMO/BFP per-operation pattern with day-grouping in the View tab.

## Current State Analysis

### WaterUtilityTab (Lines 4704-4877)
- Currently tracks static `water_facilities` table (pumping stations, reservoirs, treatment plants)
- Shows total facilities, operational count, maintenance/offline count
- Simple CRUD form for adding/editing facilities
- No time-series tracking of interruptions

### PowerUtilityTab (Lines 4879-5042)
- Currently tracks static `power_feeders` table (feeder names, substations)
- Shows total feeders, energized count, de-energized/tripped count
- Simple CRUD form for adding/editing feeders
- No time-series tracking of outages

### Pattern to Follow (CDRRMO/BFP)
From lines 3393-4120 (OperationsTab and BfpOperationsTab):
- **Per-operation records**: Each row = one interruption event
- **Sub-tabs**: "Add Record" and "View Records"
- **Day grouping**: Records grouped by date with collapsible day headers
- **Analytics cards**: Last 7 days summary by operation type
- **Form validation**: Prevents future dates
- **Date/time fields**: `operation_date` (DATE), `operation_time` (TIME)
- **CustomSelect** for dropdowns, **not native select**
- **AnimatePresence** + **motion.div** for smooth expand/collapse

## Design Decisions

### Water Interruptions
**Decision**: Track water service interruptions by provider and area affected.

**Rationale**: Palayan has multiple water providers (Palayan City Water District, Balibago Waterworks). Need to track which provider had the interruption, when, where, and how many households affected.

**Fields**:
- `interruption_date` (DATE) - When the interruption occurred
- `interruption_time` (TIME) - Start time of interruption
- `provider` (TEXT) - "Palayan City Water District" or "Balibago Waterworks"
- `interruption_type` (TEXT) - "scheduled_maintenance", "pipe_burst", "pump_failure", "water_shortage", "emergency_repair", "other"
- `affected_area` (TEXT) - Barangay or street name
- `households_affected` (INTEGER) - Number of households impacted
- `duration_hours` (NUMERIC) - Estimated or actual duration
- `status` (TEXT) - "ongoing", "restored", "scheduled"
- `description` (TEXT) - Details about the interruption
- `restored_at` (TIMESTAMPTZ) - When service was restored

**Analytics cards** (last 7 days):
1. Total Interruptions
2. Scheduled Maintenance
3. Emergency Repairs
4. Pipe Bursts
5. Ongoing Interruptions
6. Total Households Affected

### Power Outages
**Decision**: Track power interruptions by feeder line and affected areas.

**Rationale**: Palayan has one power provider (NEECO) but multiple feeder lines. Need to track which feeder line failed, when, where, and impact.

**Fields**:
- `outage_date` (DATE) - When the outage occurred
- `outage_time` (TIME) - Start time of outage
- `feeder_name` (TEXT) - Name of the feeder line (e.g., "Palayan Feeder 1", "Palayan Feeder 2")
- `outage_type` (TEXT) - "scheduled_maintenance", "line_fault", "transformer_failure", "weather_related", "overload", "emergency_repair", "other"
- `affected_area` (TEXT) - Barangay or area name
- `customers_affected` (INTEGER) - Number of customers impacted
- `duration_hours` (NUMERIC) - Estimated or actual duration
- `status` (TEXT) - "ongoing", "restored", "scheduled"
- `description` (TEXT) - Details about the outage
- `restored_at` (TIMESTAMPTZ) - When power was restored

**Analytics cards** (last 7 days):
1. Total Outages
2. Scheduled Maintenance
3. Line Faults
4. Weather Related
5. Ongoing Outages
6. Total Customers Affected

## Implementation Steps

---

- [ ] **1. Create SQL migration file for water_interruptions table**
  
  **What**: Create `supabase_water_interruptions.sql` with per-interruption schema.
  
  **Files**: 
  - Create: `c:\Users\User\CLIMA\supabase_water_interruptions.sql`
  
  **Details**:
  - Drop existing `water_facilities` table (CASCADE)
  - Create `water_interruptions` table with fields: id (BIGSERIAL PRIMARY KEY), interruption_date (DATE NOT NULL), interruption_time (TIME), provider (TEXT NOT NULL), interruption_type (TEXT NOT NULL), affected_area (TEXT NOT NULL), households_affected (INTEGER DEFAULT 0), duration_hours (NUMERIC(5,2) DEFAULT 0), status (TEXT DEFAULT 'ongoing'), description (TEXT), restored_at (TIMESTAMPTZ), created_at (TIMESTAMPTZ DEFAULT NOW()), updated_at (TIMESTAMPTZ DEFAULT NOW())
  - Create indexes: `idx_water_interruptions_date` (interruption_date DESC), `idx_water_interruptions_provider` (provider), `idx_water_interruptions_type` (interruption_type), `idx_water_interruptions_status` (status)
  - Add RLS policies matching BFP pattern (authenticated users can view, admins can insert/update/delete)
  - Add trigger for updated_at timestamp
  - Use pattern from `supabase_bfp_operations_v2.sql` (lines 1-78) as template
  
  **Verify**: Run `cat c:\Users\User\CLIMA\supabase_water_interruptions.sql` and confirm table structure matches BFP operations pattern

---

- [ ] **2. Create SQL migration file for power_outages table**
  
  **What**: Create `supabase_power_outages.sql` with per-outage schema.
  
  **Files**:
  - Create: `c:\Users\User\CLIMA\supabase_power_outages.sql`
  
  **Details**:
  - Drop existing `power_feeders` table (CASCADE)
  - Create `power_outages` table with fields: id (BIGSERIAL PRIMARY KEY), outage_date (DATE NOT NULL), outage_time (TIME), feeder_name (TEXT NOT NULL), outage_type (TEXT NOT NULL), affected_area (TEXT NOT NULL), customers_affected (INTEGER DEFAULT 0), duration_hours (NUMERIC(5,2) DEFAULT 0), status (TEXT DEFAULT 'ongoing'), description (TEXT), restored_at (TIMESTAMPTZ), created_at (TIMESTAMPTZ DEFAULT NOW()), updated_at (TIMESTAMPTZ DEFAULT NOW())
  - Create indexes: `idx_power_outages_date` (outage_date DESC), `idx_power_outages_feeder` (feeder_name), `idx_power_outages_type` (outage_type), `idx_power_outages_status` (status)
  - Add RLS policies matching BFP pattern (authenticated users can view, admins can insert/update/delete)
  - Add trigger for updated_at timestamp
  - Use pattern from `supabase_bfp_operations_v2.sql` (lines 1-78) as template
  
  **Verify**: Run `cat c:\Users\User\CLIMA\supabase_power_outages.sql` and confirm table structure matches BFP operations pattern

---

- [ ] **3. Replace WaterUtilityTab component (Lines 4704-4877)**
  
  **What**: Replace entire WaterUtilityTab function with new per-interruption design.
  
  **Files**:
  - Modify: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (lines 4704-4877)
  
  **Details**:
  - **State management** (follow OperationsTab pattern lines 3395-3418):
    - `records` (from water_interruptions table)
    - `loading`, `activeSubTab` ("view" or "add"), `isExpanded`, `editId`, `expandedDays`
    - `formData`: interruption_date, interruption_time, provider, interruption_type, affected_area, households_affected, duration_hours, status, description
  
  - **fetchRecords()**: Query `water_interruptions` table, order by interruption_date DESC, interruption_time DESC, auto-expand first day only
  
  - **handleSave()**: Validate no future dates (like line 3445-3451), insert/update water_interruptions, reset form, switch to "view" tab
  
  - **editRecord()** and **deleteRecord()**: Follow pattern from lines 3489-3520
  
  - **Analytics cards** (last 7 days, pattern from lines 3523-3543):
    1. Total Interruptions (all records)
    2. Scheduled Maintenance (interruption_type === "scheduled_maintenance")
    3. Emergency Repairs (interruption_type === "emergency_repair")
    4. Pipe Bursts (interruption_type === "pipe_burst")
    5. Ongoing (status === "ongoing")
    6. Total Households Affected (sum of households_affected)
  
  - **Provider options**: Use CustomSelect (NOT native select) with options: "Palayan City Water District", "Balibago Waterworks"
  
  - **Interruption Type options**: Use CustomSelect with: "scheduled_maintenance", "pipe_burst", "pump_failure", "water_shortage", "emergency_repair", "other" (display as: "Scheduled Maintenance", "Pipe Burst", "Pump Failure", "Water Shortage", "Emergency Repair", "Other")
  
  - **Status options**: Use CustomSelect with: "ongoing", "restored", "scheduled"
  
  - **Sub-tabs**: Add Record / View Records (pattern lines 3609-3623)
  
  - **Day grouping**: Group by interruption_date with collapsible headers showing count (pattern lines 3550-3572, 3664-3693)
  
  - **Record cards within each day** (pattern lines 3695-3723):
    - Show: time, interruption_type badge (colored), provider, affected_area, households_affected, duration_hours
    - Badge colors: scheduled_maintenance (blue), pipe_burst (red), pump_failure (orange), water_shortage (yellow), emergency_repair (pink), other (gray)
    - Show description if present
    - Edit/Delete buttons
  
  - **Icons**: Use `<Droplet size={16} color="#0284c7" />` for water-related elements (already imported)
  
  - **Form fields order**: interruption_date (date input, max=today), interruption_time (time input), provider (CustomSelect), interruption_type (CustomSelect), affected_area (text input), households_affected (number input min=0), duration_hours (number input step=0.5 min=0), status (CustomSelect), description (textarea)
  
  - Keep function signature: `function WaterUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal })`
  
  **Verify**: Run `npm run build` - build must succeed with no errors. Visually inspect that WaterUtilityTab matches CDRRMO pattern with 6 analytics cards, sub-tabs, and day-grouped records.

---

- [ ] **4. Replace PowerUtilityTab component (Lines 4879-5042)**
  
  **What**: Replace entire PowerUtilityTab function with new per-outage design.
  
  **Files**:
  - Modify: `c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx` (lines 4879-5042)
  
  **Details**:
  - **State management** (follow BfpOperationsTab pattern lines 3745-3774):
    - `records` (from power_outages table)
    - `loading`, `activeSubTab` ("view" or "add"), `isExpanded`, `editId`, `expandedDays`
    - `formData`: outage_date, outage_time, feeder_name, outage_type, affected_area, customers_affected, duration_hours, status, description
  
  - **fetchRecords()**: Query `power_outages` table, order by outage_date DESC, outage_time DESC, auto-expand first day only
  
  - **handleSave()**: Validate no future dates (like line 3799-3805), insert/update power_outages, reset form, switch to "view" tab
  
  - **editRecord()** and **deleteRecord()**: Follow pattern from lines 3843-3874
  
  - **Analytics cards** (last 7 days, pattern from lines 3877-3897):
    1. Total Outages (all records)
    2. Scheduled Maintenance (outage_type === "scheduled_maintenance")
    3. Line Faults (outage_type === "line_fault")
    4. Weather Related (outage_type === "weather_related")
    5. Ongoing (status === "ongoing")
    6. Total Customers Affected (sum of customers_affected)
  
  - **Feeder Name**: Use text input (not dropdown) - allow admins to type feeder name (e.g., "Palayan Feeder 1", "Rizal Feeder", etc.)
  
  - **Outage Type options**: Use CustomSelect with: "scheduled_maintenance", "line_fault", "transformer_failure", "weather_related", "overload", "emergency_repair", "other" (display as: "Scheduled Maintenance", "Line Fault", "Transformer Failure", "Weather Related", "Overload", "Emergency Repair", "Other")
  
  - **Status options**: Use CustomSelect with: "ongoing", "restored", "scheduled"
  
  - **Sub-tabs**: Add Record / View Records (same pattern as WaterUtilityTab)
  
  - **Day grouping**: Group by outage_date with collapsible headers showing count (pattern from BfpOperationsTab lines 3962-4006)
  
  - **Record cards within each day** (pattern lines 4008-4045):
    - Show: time, outage_type badge (colored), feeder_name, affected_area, customers_affected, duration_hours
    - Badge colors: scheduled_maintenance (blue), line_fault (red), transformer_failure (orange), weather_related (purple), overload (yellow), emergency_repair (pink), other (gray)
    - Show description if present
    - Edit/Delete buttons
  
  - **Icons**: Use `<Zap size={16} color="#eab308" />` for power-related elements (already imported)
  
  - **Form fields order**: outage_date (date input, max=today), outage_time (time input), feeder_name (text input), outage_type (CustomSelect), affected_area (text input), customers_affected (number input min=0), duration_hours (number input step=0.5 min=0), status (CustomSelect), description (textarea)
  
  - Keep function signature: `function PowerUtilityTab({ S, cardStyle, inputStyle, selectStyle, btnPrimary, btnDanger, isSuperadmin, adminDepartment, showSuccessModal, showErrorModal, showConfirmModal })`
  
  **Verify**: Run `npm run build` - build must succeed with no errors. Visually inspect that PowerUtilityTab matches BFP pattern with 6 analytics cards, sub-tabs, and day-grouped records.

---

## Key Patterns to Reuse

### CustomSelect Usage (NOT native select)
```jsx
<CustomSelect
  value={formData.provider}
  onChange={v => setFormData({...formData, provider: v})}
  options={[
    {value: "Palayan City Water District", label: "Palayan City Water District"},
    {value: "Balibago Waterworks", label: "Balibago Waterworks"}
  ]}
  accent={S.accent}
/>
```

### Date Validation Pattern (Lines 3445-3451)
```jsx
const selectedDate = new Date(formData.operation_date);
const today = new Date();
today.setHours(0, 0, 0, 0);
selectedDate.setHours(0, 0, 0, 0);

if (selectedDate > today) {
  showErrorModal("Invalid Date", "Cannot add records for future dates. Please select today or a past date.");
  return;
}
```

### Day Grouping Pattern (Lines 3550-3572)
```jsx
const groupedByDate = records.reduce((acc, record) => {
  if (!acc[record.operation_date]) {
    acc[record.operation_date] = [];
  }
  acc[record.operation_date].push(record);
  return acc;
}, {});
```

### Collapsible Day Header (Lines 3677-3682)
```jsx
<button 
  onClick={() => setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))} 
  style={{ width: "100%", padding: 16, border: "none", background: S.accentBg, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 800, color: S.text }}
>
  <span>📅 {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {dayRecords.length} operation{dayRecords.length > 1 ? 's' : ''}</span>
  <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
</button>
```

### Badge Color Function Pattern (Lines 3574-3595)
```jsx
const operationTypeBadge = (type) => {
  const colors = {
    evacuation: { bg: "#dbeafe", color: "#1e40af" },
    rescue: { bg: "#fef3c7", color: "#92400e" },
    // ... etc
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
```

### Sub-tabs Navigation (Lines 3609-3623)
```jsx
<div style={{ display: "flex", gap: 12, paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid ${S.border}` }}>
  <button onClick={() => { setActiveSubTab("add"); setIsExpanded(true); }} 
    style={{ ...btnPrimary, background: activeSubTab === "add" ? S.accent : "transparent", color: activeSubTab === "add" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
    <Plus size={14} /> Add Record
  </button>
  <button onClick={() => { setActiveSubTab("view"); setIsExpanded(true); }} 
    style={{ ...btnPrimary, background: activeSubTab === "view" ? S.accent : "transparent", color: activeSubTab === "view" ? "#fff" : S.text, boxShadow: "none", padding: "8px 16px", fontSize: 13 }}>
    <FileText size={14} /> View Records
  </button>
  <button onClick={() => setIsExpanded(!isExpanded)} 
    style={{ marginLeft: "auto", background: "none", border: `1px solid ${S.border}`, padding: "8px", borderRadius: 8, cursor: "pointer", color: S.text, display: "flex", alignItems: "center" }}>
    <ChevronDown size={16} style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
  </button>
</div>
```

## Icons Already Imported
From line 7-8:
- ✅ `Droplet` (for water)
- ✅ `Zap` (for power)
- ✅ `Clock` (for time display)
- ✅ `Plus`, `Trash2`, `Edit2`, `Check`, `X`, `ChevronDown`, `MapPin`, `FileText`

No additional icon imports needed.

## Database Migration Execution
After SQL files are created, they must be executed in Supabase:
1. Open Supabase SQL Editor
2. Run `supabase_water_interruptions.sql`
3. Run `supabase_power_outages.sql`
4. Verify tables exist: `SELECT * FROM water_interruptions LIMIT 1;` and `SELECT * FROM power_outages LIMIT 1;`

## Testing Checklist
After implementation:
1. ✅ Build succeeds (`npm run build`)
2. ✅ Water tab shows 6 analytics cards
3. ✅ Power tab shows 6 analytics cards
4. ✅ Add Record form uses CustomSelect (not native select)
5. ✅ Cannot add records for future dates
6. ✅ Records group by day with collapsible headers
7. ✅ Edit and Delete buttons work
8. ✅ Day header shows correct count (e.g., "3 interruptions")
9. ✅ Badge colors match operation/outage types
10. ✅ Sub-tabs (Add/View) switch smoothly with animation

## Summary
This plan converts Water and Power modules from static facility/feeder tracking to dynamic per-event tracking following the proven CDRRMO/BFP pattern. Key changes:
- Static tables → Per-operation records
- Simple lists → Day-grouped collapsible timeline
- Basic counts → 6 detailed analytics cards (last 7 days)
- Native selects → CustomSelect components
- No time tracking → Full date/time/duration tracking
