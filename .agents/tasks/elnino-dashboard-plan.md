# El Niño Dashboard Implementation Plan
**Task:** Update CLIMA app dashboards with El Niño-focused monitoring and utility interruption scheduling

**Date Created:** 2025-01-04  
**Workspace:** c:\Users\User\CLIMA  
**Build Status:** ✅ Passing (0 errors)

---

## 📋 Executive Summary

This plan addresses two user requests:
1. **Original Issue:** Records encoded in admin side not displayed on client side (RLS policy fix required)
2. **Dashboard Enhancement:** Add El Niño impact monitoring and utility interruption schedules to both admin and client dashboards

**Approach:** Fix RLS policies first, then enhance dashboards in parallel (admin interruptions tab + client El Niño section).

---

## 🔍 Codebase Analysis

### Current State

**HomeScreen.jsx (Client Dashboard):**
- Lines: 720+ (complex, weather-focused)
- Current sections: Weather hero, hourly/weekly forecast, barangay selector, advisories, user reports
- State management: React hooks (useState, useEffect, useMemo)
- Data fetching: Supabase queries + KloudTech IoT integration
- Charts: Recharts (LineChart already in use)
- Icons: Lucide React
- Animation: Framer Motion
- Theme: Dark mode support via ThemeContext
- Pattern: Card-based layout with motion animations

**AdminDashboard.jsx:**
- Lines: 5800+ (comprehensive multi-tab dashboard)
- Current tabs: Overview, Reports, Advisories, Hospitals, CDRRMO Operations, BFP Operations, Agriculture, Water, Power, Users, Settings, Logs
- Tab structure: Motion-animated conditional rendering with `tabVariants`
- Modal system: Global modal state with `showSuccessModal`, `showErrorModal`, `showConfirmModal`
- Permission system: Module-level RBAC with `canViewModule`, `canCreate`, `canEdit`, `canDelete`
- Water & Power tabs already exist at lines 5485 and 5825
- Pattern: Each tab is a separate function component with CRUD operations

**Database Tables (from SQL files):**
- `hospital_daily_records`: heat_stroke_cases, heat_exhaustion_cases, dehydration_cases, respiratory_cases, total_admissions, record_date
- `cdrrmo_daily_operations`: relief_operations, evacuations_conducted, families_assisted, ambulance_dispatches, emergency_responses, operation_date
- `bfp_operations`: operation_type, operation_date, operation_time, location, personnel_deployed, fire_trucks, casualties, property_damage, description
- `agriculture_damage_reports`: category (farm/livestock), crop_type, area_affected_hectares, damage_percentage, estimated_loss_value, cause, barangay, report_date
- `water_interruptions`: interruption_date, interruption_time, provider, affected_barangays, cause, duration_hours, households_affected, status, description
- `power_interruptions`: interruption_date, total_outages, total_affected_households, feeders_affected, total_duration_minutes, peak_outage_time, cause, restoration_status, description
- `advisories`: title, content, category, status, department_id, published_at, scheduled_for

**Libraries Available:**
- Recharts 3.10.1 (LineChart, BarChart, PieChart, Tooltip, Legend, ResponsiveContainer)
- Framer Motion 12.34.3 (motion, AnimatePresence)
- Lucide React 0.575.0 (all icons)
- Supabase JS 2.104.1
- React 19.2.0

**Build System:**
- Vite 7.3.2
- No test framework detected
- Build command: `npm run build`
- Dev command: `npm run dev`

**Environment Variables (.env):**
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (configured)
- VITE_KLOUDTECH_API_BASE, VITE_KLOUDTECH_TOKEN (KloudTech IoT integration)

**Key Patterns Observed:**
1. Inline styles (no CSS modules) with theme colors from S object
2. Card-based layouts with consistent `cardStyle`
3. Real-time Supabase subscriptions for live updates
4. Date filtering: `getDateDaysAgo(days)` helper function
5. PALAYAN_BARANGAYS array with 19 barangays
6. Heat index calculation: `calculateHeatIndex(tempC, humidity)` using NOAA Rothfusz formula
7. Empty states: "No data available" messages with icons
8. Mobile responsive: grid with `repeat(auto-fit, minmax(...))`
9. Loading states: pulse animation skeletons
10. Permission checks in admin: `hasPermission(module, permType)`

---

## 🐛 Critical Bug Fix (Priority 1)

### Issue: Records Not Visible on Client Side

**Root Cause:** RLS policies on data tables restrict SELECT to `authenticated` role only. Client-side HomeScreen runs as anonymous user (no auth).

**Affected Tables:**
- hospital_daily_records
- cdrrmo_daily_operations
- bfp_operations
- agriculture_damage_reports
- water_interruptions
- power_interruptions
- advisories

**Solution:** Already documented in `FIX_PUBLIC_RLS_POLICIES.sql` — add public SELECT policies with `TO anon, authenticated USING (true)`.

**Verification:** After applying SQL, query tables from unauthenticated Supabase client and confirm data returns.

---

## 📐 Implementation Plan

This work decomposes into 3 separable features: RLS fix, Admin Interruptions UI, and Client El Niño Dashboard.

### Feature Order & Dependencies

1. **FEAT-001** (RLS Fix) — Must complete first; blocks client-side data visibility
2. **FEAT-002** (Admin Interruptions Tab) — Independent of FEAT-003; can run parallel after FEAT-001
3. **FEAT-003** (Client El Niño Dashboard) — Independent of FEAT-002; requires FEAT-001 complete

---

### FEAT-001: Fix RLS Policies for Public Data Access

**Type:** fix  
**Status:** pending  
**Blocking:** FEAT-003

**Description:**  
Apply RLS policy fixes from `FIX_PUBLIC_RLS_POLICIES.sql` to allow anonymous clients to read operational data. Without this, client-side dashboard will show empty states for all data sections.

**Steps:**
1. Review `FIX_PUBLIC_RLS_POLICIES.sql` (already written, lines 1-68)
2. Connect to Supabase project via SQL Editor (Dashboard → SQL Editor)
3. Execute the SQL script in full
4. Run verification query at bottom of script to confirm policies exist
5. Test anonymous read access: open browser DevTools console on unauthenticated page, execute `supabase.from('hospital_daily_records').select('*').limit(1)` and confirm data returns (not auth error)

**Verification:**
- Command: Manual SQL execution in Supabase Dashboard
- Expected outcome: 7 new SELECT policies visible in `pg_policies` system table; anonymous Supabase client queries return data without auth errors
- Additional check: Open CLIMA client in incognito window, HomeScreen should display advisories and any existing records

**Acceptance Criteria:**
- [ ] All 7 data tables have public SELECT policies with `TO anon, authenticated`
- [ ] Anonymous client can query hospital_daily_records, bfp_operations, cdrrmo_daily_operations, agriculture_damage_reports, water_interruptions, power_interruptions without RLS block
- [ ] Published advisories visible to anonymous users (`status = 'Published'` filter enforced)
- [ ] Admin write permissions (INSERT/UPDATE/DELETE) remain restricted to authenticated admins

---

### FEAT-002: Admin Dashboard Interruptions Enhancement

**Type:** feat  
**Status:** pending  
**Blocking:** None (independent feature)

**Description:**  
Enhance existing Water Utility and Power Utility tabs in AdminDashboard with prominent "Schedule Interruption" and "View Schedule" sections. Display upcoming and past interruptions in table format with CRUD operations. Add "KT" (KloudTech) live sensor widget to Admin Overview tab.

**Current State:**
- WaterUtilityTab exists at line 5485 with basic CRUD for `water_interruptions` table
- PowerUtilityTab exists at line 5825 with basic CRUD for `power_interruptions` table
- Both tabs already have forms, but need scheduling/calendar view emphasis

**Steps:**

1. **Enhance WaterUtilityTab (src/screens/AdminDashboard.jsx lines 5485-5823)**
   - Add "Upcoming Interruptions" section at top with calendar icon
   - Query: `supabase.from('water_interruptions').select('*').eq('status', 'ongoing').order('interruption_date', {ascending: true})`
   - Display: Table with columns: Date, Time, Provider, Affected Barangays, Duration (hours), Households Affected, Status badge
   - Add "Schedule New Interruption" button with prominent styling (orange accent for water)
   - Form fields: interruption_date (date picker), interruption_time (time picker), provider (dropdown: 'Palayan City Water District', 'Balibago Waterworks'), affected_barangays (text), cause (dropdown: 'pipe_burst', 'maintenance', 'shortage', 'pump_failure', 'other'), duration_hours (number), households_affected (number), description (textarea)
   - Past interruptions: Separate collapsible section with `status = 'restored'` filter
   - Color coding: Blue theme (Droplet icon from Lucide)

2. **Enhance PowerUtilityTab (src/screens/AdminDashboard.jsx lines 5825-6162)**
   - Add "Upcoming Outages" section at top with lightning icon
   - Query: `supabase.from('power_interruptions').select('*').gte('interruption_date', 'today').order('interruption_date', {ascending: true})`
   - Display: Table with columns: Date, Feeders Affected, Households, Total Duration (minutes), Peak Outage Time, Cause, Status badge
   - Add "Schedule New Outage" button with prominent styling (yellow accent for power)
   - Form fields: interruption_date (date picker), total_outages (number), total_affected_households (number), feeders_affected (text), total_duration_minutes (number), peak_outage_time (time picker), cause (dropdown: 'line_fault', 'transformer_issue', 'weather', 'maintenance', 'overload', 'other'), restoration_status (dropdown: 'ongoing', 'restored', 'partial'), description (textarea)
   - Past outages: Separate collapsible section with historical records
   - Color coding: Yellow theme (Zap icon from Lucide)

3. **Add KloudTech Live Sensor Widget to Admin Overview Tab (line 721 OverviewTab function)**
   - Already partially exists (lines 796-918) but needs "KT" branding emphasis
   - Add large "KT" badge/logo in top-left corner of sensor card
   - Position: After summary cards grid, before charts section
   - Keep existing KloudTech integration logic (fetchKloudtechDashboard from services/kloudtechService.js)
   - Display metrics: Temperature, Humidity, Heat Index, Wind Speed, Pressure, UV Index
   - Add "LIVE" pulse indicator when `isLive: true`

**Files Modified:**
- src/screens/AdminDashboard.jsx (lines 5485-6162 for utility tabs, lines 721-1433 for overview)

**Verification:**
- Command: `npm run build` (must pass with 0 errors)
- Manual test in dev: `npm run dev`, login as admin, navigate to Water Utility tab
- Expected outcome: Can create new water interruption with date/time, see it in "Upcoming Interruptions" list, change status to 'restored' and see it move to "Past Interruptions"
- Repeat for Power Utility tab
- Check Overview tab displays "KT" branding on sensor widget

**Acceptance Criteria:**
- [ ] Water Utility tab has "Upcoming Interruptions" section with table view (blue theme, Droplet icon)
- [ ] Power Utility tab has "Upcoming Outages" section with table view (yellow theme, Zap icon)
- [ ] Both tabs have "Schedule New" button and form with all required fields
- [ ] Forms validate required fields before submission
- [ ] Interruptions display in chronological order (soonest first)
- [ ] Status badges color-coded: ongoing (orange), restored (green), partial (yellow)
- [ ] Past interruptions collapsible to reduce clutter
- [ ] KloudTech sensor widget on Overview tab has prominent "KT" badge
- [ ] All CRUD operations use global modal system (showSuccessModal, showErrorModal, showConfirmModal)
- [ ] Build passes: `npm run build` completes with 0 errors

---

### FEAT-003: Client Dashboard El Niño Impact Section

**Type:** feat  
**Status:** pending  
**Blocking:** Requires FEAT-001 complete (RLS fix)

**Description:**  
Add comprehensive "El Niño Impact Dashboard" section to HomeScreen (client side) displaying 6 sub-sections: Official Advisories, Hospital Monitoring (heat-related cases only), BFP Wildfire Operations, CDRRMO El Niño Response, Agricultural Damages, and Utility Interruption Schedule. Use orange/red heat theme, charts for trends, real-time subscriptions.

**Current State:**
- HomeScreen already displays advisories (lines 580-650) in collapsible section
- Weather data, barangay selector, and reports exist
- No El Niño-specific health/ops monitoring yet

**Steps:**

1. **Create ElNinoMonitoringCard.jsx component (src/components/ElNinoMonitoringCard.jsx)**
   - Reusable card wrapper for all 6 sub-sections
   - Props: title, icon, data[], loading, emptyMessage, children
   - Style: cardStyle pattern from HomeScreen with accent color prop
   - Dark mode support via isDark from ThemeContext
   - Motion animation: fadeIn on mount (Framer Motion)
   - Structure: Header (icon + title + "Last updated" timestamp) + content area + "View All" link (optional)

2. **Add El Niño section to HomeScreen.jsx after weather forecast section (insert around line 650)**
   - Section header: "🌡️ El Niño Impact Dashboard" with flame/sun icon, orange gradient background
   - Subtitle: "Real-time monitoring of heat-related incidents and utility status"

3. **Sub-section 1: Official Advisories (enhance existing, lines 580-650)**
   - Filter: advisories where category includes 'Weather' or title/content contains 'el niño', 'heat', 'drought' (case-insensitive)
   - Display: Card list with title, urgency badge (High/Medium/Low based on category or custom urgency field if exists), published date, preview (first 120 chars of content)
   - Color: Red for High urgency, Orange for Medium, Yellow for Low
   - Icon: AlertTriangle from Lucide
   - Query: `supabase.from('advisories').select('*').eq('status', 'Published').order('published_at', {ascending: false}).limit(3)`
   - Empty state: "No active advisories at this time"

4. **Sub-section 2: Hospital Monitoring (Heat-Related Cases)**
   - Create ElNinoMonitoringCard with title "Hospital Heat Impact"
   - Icon: HeartPulse (Lucide), color: #dc2626 (red)
   - Query: `supabase.from('hospital_daily_records').select('heat_stroke_cases, heat_exhaustion_cases, dehydration_cases, respiratory_cases, record_date').order('record_date', {ascending: false}).limit(7)`
   - Display: 
     - Summary cards (grid): Total Heat Stroke (last 7 days), Heat Exhaustion, Dehydration, Respiratory
     - 7-day trend chart: LineChart (Recharts) with 4 lines (heat_stroke_cases, heat_exhaustion_cases, dehydration_cases, respiratory_cases) by record_date
     - X-axis: record_date formatted as "M/D" using formatDateShort helper
     - Y-axis: case count
     - Colors: Heat stroke (dark red), Heat exhaustion (orange), Dehydration (blue), Respiratory (gray)
   - Empty state: "No recent hospital data available"
   - Real-time subscription: Subscribe to `hospital_daily_records` inserts/updates

5. **Sub-section 3: BFP Wildfire Operations**
   - Create ElNinoMonitoringCard with title "Wildfire Operations"
   - Icon: Flame (Lucide), color: #ea580c (orange-red)
   - Query: `supabase.from('bfp_operations').select('*').eq('operation_type', 'fire_incident').order('operation_date', {ascending: false}).limit(5)`
   - Additional filter (client-side): description contains 'wildfire' OR location in grassland/forest barangays
   - Display: List of incidents with date, location, personnel deployed, fire trucks, casualties, property damage (formatted as ₱###,###.##), status badge
   - Status: Active (red), Contained (orange), Resolved (green) — derive from operation_date + 24hr logic or add status field
   - Empty state: "No recent wildfire incidents"
   - Real-time subscription: Subscribe to `bfp_operations` WHERE operation_type = 'fire_incident'

6. **Sub-section 4: CDRRMO El Niño Response**
   - Create ElNinoMonitoringCard with title "Emergency Response Operations"
   - Icon: Tent (Lucide), color: #16a34a (green)
   - Query: `supabase.from('cdrrmo_daily_operations').select('*').order('operation_date', {ascending: false}).limit(7)`
   - Filter logic: Show relief_operations, evacuations_conducted, families_assisted, ambulance_dispatches for dates with high heat (join with weather data if possible, or show all)
   - Display: Timeline cards with date, relief operations count, evacuations, families assisted, ambulance dispatches, remarks
   - Chart: BarChart (Recharts) showing daily relief operations + evacuations over 7 days
   - Empty state: "No recent CDRRMO operations"
   - Real-time subscription: Subscribe to `cdrrmo_daily_operations` inserts/updates

7. **Sub-section 5: Agricultural Damages**
   - Create ElNinoMonitoringCard with title "Agricultural Impact"
   - Icon: Sprout (Lucide), color: #65a30d (lime green)
   - Query: `supabase.from('agriculture_damage_reports').select('*').order('report_date', {ascending: false}).limit(8)`
   - Filter (optional client-side): cause IN ('drought', 'heat_stress', 'water_shortage')
   - Display: Grid of damage cards with crop_type, barangay, area_affected_hectares, damage_percentage, estimated_loss_value (formatted as ₱###,###), status badge
   - Summary: Total hectares affected, total estimated loss across all reports in view
   - Color: Orange/brown for drought-related, red for heat stress
   - Empty state: "No agricultural damage reports"
   - Real-time subscription: Subscribe to `agriculture_damage_reports` inserts/updates

8. **Sub-section 6: Utility Interruption Schedule**
   - Create ElNinoMonitoringCard with title "Utility Interruptions"
   - Icon: Droplet + Zap (Lucide), color: gradient blue→yellow
   - Query water: `supabase.from('water_interruptions').select('*').eq('status', 'ongoing').order('interruption_date', {ascending: true}).limit(5)`
   - Query power: `supabase.from('power_interruptions').select('*').gte('interruption_date', 'today').order('interruption_date', {ascending: true}).limit(5)`
   - Display: Combined timeline with date, type badge (Water/Power), affected barangays/feeders, duration, households affected
   - Group by barangay if possible for citizen-specific view
   - Color coding: Blue for water, Yellow for power, Red for critical (>1000 households or >8 hours)
   - Sort: Chronological, soonest interruptions first
   - Empty state: "No scheduled interruptions"
   - Real-time subscription: Subscribe to both `water_interruptions` and `power_interruptions` inserts/updates

9. **State Management in HomeScreen.jsx**
   - Add state hooks:
     ```javascript
     const [elNinoData, setElNinoData] = useState({
       advisories: [],
       hospitalRecords: [],
       bfpOperations: [],
       cdrrmoOperations: [],
       agricultureDamages: [],
       waterInterruptions: [],
       powerInterruptions: []
     });
     const [elNinoLoading, setElNinoLoading] = useState(true);
     ```
   - Add useEffect to fetch all El Niño data on mount and when refreshTrigger changes
   - Add separate useEffect for real-time subscriptions (cleanup on unmount)

10. **Styling & Responsiveness**
    - Mobile: Single column stacked layout
    - Tablet: 2-column grid for sub-sections
    - Desktop: 3-column grid where appropriate
    - All charts: ResponsiveContainer from Recharts
    - Icons: 20px size, matching accent color
    - Spacing: 16px gap between cards, 24px section padding
    - Dark mode: Adjust card backgrounds (#18181b dark, #ffffff light), text colors, chart colors

**Files Created:**
- src/components/ElNinoMonitoringCard.jsx (new, ~150 lines)

**Files Modified:**
- src/screens/HomeScreen.jsx (insert section around line 650, add state/effects at top, ~400 lines added total)

**Verification:**
- Command: `npm run build` (must pass with 0 errors)
- Manual test in dev: `npm run dev` (unauthenticated user view)
- Expected outcome: HomeScreen displays El Niño section with 6 sub-sections, each showing data if available or empty state
- Test data fetch: Add sample records via admin dashboard, confirm they appear on client within 2 seconds (real-time subscription)
- Test responsiveness: Resize browser to mobile width, confirm layout stacks vertically
- Test dark mode: Toggle theme, confirm colors adapt

**Acceptance Criteria:**
- [ ] ElNinoMonitoringCard component created with reusable structure
- [ ] HomeScreen has "El Niño Impact Dashboard" section header with orange gradient
- [ ] Official Advisories sub-section filters for heat/drought/weather advisories, displays top 3
- [ ] Hospital Monitoring shows 7-day trend chart (4 lines: heat stroke, heat exhaustion, dehydration, respiratory) with Recharts LineChart
- [ ] BFP Wildfire Operations lists fire incidents with location, date, personnel, property damage
- [ ] CDRRMO El Niño Response displays relief operations timeline with BarChart showing 7-day operations
- [ ] Agricultural Damages grid shows crop type, barangay, hectares affected, estimated loss in PHP
- [ ] Utility Interruption Schedule combines water + power interruptions in chronological order, color-coded by type
- [ ] All sub-sections have empty states with icons and helpful messages
- [ ] Real-time subscriptions working: new records appear without page refresh within 2 seconds
- [ ] Mobile responsive: all cards stack vertically on <768px width
- [ ] Dark mode support: colors adapt in both themes
- [ ] Last updated timestamps display in local time format
- [ ] Build passes: `npm run build` completes with 0 errors
- [ ] No console errors or warnings in browser DevTools

---

## 🔧 Technical Considerations

### Database Schema Validation

All required tables exist per SQL files reviewed:
- ✅ hospital_daily_records (supabase_hospital_redesign.sql)
- ✅ cdrrmo_daily_operations (supabase_cdrrmo_operations.sql)
- ✅ bfp_operations (supabase_bfp_operations_v2.sql)
- ✅ agriculture_damage_reports (supabase_agriculture_damages.sql)
- ✅ water_interruptions (FIX_DATABASE_SCHEMA.sql lines 31-56)
- ✅ power_interruptions (FIX_DATABASE_SCHEMA.sql lines 61-85)
- ✅ advisories (supabase_phase3.sql lines 3-16)

**No new tables required.**

### RLS Policy Review

Current policies block anonymous SELECT on operational tables. `FIX_PUBLIC_RLS_POLICIES.sql` addresses this comprehensively. Must execute before FEAT-003.

### Component Reusability

Existing patterns to follow:
- Card wrapper: Similar to ReportCard.jsx structure
- Loading states: Pulse animation skeleton (see OverviewTab line 799)
- Charts: ResponsiveContainer + LineChart/BarChart pattern (see OverviewTab lines 1050-1200)
- Real-time: Supabase channel subscription pattern (see HomeScreen line 573)
- Theme: useTheme() hook, isDark boolean
- Icons: Lucide React imports (already extensive in HomeScreen)

### Performance Optimization

- Limit queries to recent data (7-30 days) to avoid large payloads
- Use Supabase .select('specific, columns') instead of .select('*') where possible
- Debounce real-time subscription handlers if rapid updates cause re-renders
- Memoize chart data transformations with useMemo
- Lazy load ElNinoMonitoringCard if section is collapsed initially

### Build Validation

Current build status: ✅ Passing (0 errors, warnings about chunk size acceptable)
- Must maintain clean build after all changes
- Run `npm run build` after each feature completion
- No new dependencies required (all libraries already in package.json)

---

## 🎯 Success Metrics

1. **RLS Fix (FEAT-001):**
   - ✅ All 7 data tables have public SELECT policies
   - ✅ Anonymous client queries return data without 403 errors
   - ✅ Existing admin records visible on client HomeScreen

2. **Admin Interruptions (FEAT-002):**
   - ✅ Water & Power tabs have scheduling sections
   - ✅ Admins can CRUD interruptions via enhanced UI
   - ✅ KloudTech widget on Overview has "KT" branding
   - ✅ Build passes with 0 errors

3. **Client Dashboard (FEAT-003):**
   - ✅ 6 El Niño sub-sections display on HomeScreen
   - ✅ Charts render correctly (Recharts LineChart, BarChart)
   - ✅ Real-time updates work (new records appear within 2s)
   - ✅ Mobile responsive layout
   - ✅ Dark mode support
   - ✅ Build passes with 0 errors

4. **User Experience:**
   - ✅ Citizens see actionable heat impact data on mobile app
   - ✅ Admins can schedule interruptions and see them immediately on citizen app
   - ✅ No broken UI, console errors, or loading states stuck

---

## 📝 Notes

- **Original bug:** "records that are encoded in the admins side is not displayed into the client side" is caused by RLS policies blocking anonymous SELECT. Fix is documented in FIX_PUBLIC_RLS_POLICIES.sql and must be executed in Supabase SQL Editor (not via code).
  
- **KT branding:** User asked to "add the KT into the dashboard of the admin page" — KloudTech sensor widget already exists in OverviewTab (line 796), enhancement is to add prominent "KT" badge/logo.

- **Data filtering:** El Niño focus means filter for heat-related cases (heat stroke, heat exhaustion, dehydration, respiratory), drought-related agriculture damages, wildfire incidents, and heat-driven CDRRMO operations. Not all records from these tables are El Niño-related, so filtering is essential for citizen clarity.

- **Barangay grouping:** HomeScreen displays barangay selector (PALAYAN_BARANGAYS array). Utility interruptions should ideally show which barangays are affected to enable location-based filtering in future enhancement (not in this plan's scope).

- **Real-time priority:** User expects immediate visibility of admin-entered records on client side. Real-time Supabase subscriptions (already pattern in codebase line 573) are mandatory for FEAT-003.

- **Chart libraries:** Recharts already in use (AdminDashboard OverviewTab lines 1050+). Use same patterns for consistency.

- **No TypeScript:** Project is JavaScript (JSX). Do not add TypeScript files.

- **No test files:** No test framework detected. Verification is manual testing in dev mode + build pass.

---

## 🚀 Execution Order

1. **FEAT-001** (RLS Fix) — Execute SQL in Supabase Dashboard → blocks FEAT-003
2. **FEAT-002** (Admin Interruptions) — Independent, can run parallel after FEAT-001
3. **FEAT-003** (Client Dashboard) — Depends on FEAT-001 completion

Total estimated lines of code: ~650 new lines + ~200 lines modified  
Total files: 1 new component + 2 modified screens  
Build impact: Low (no new dependencies, existing patterns)

---

**Plan complete. Ready for implementation.**
