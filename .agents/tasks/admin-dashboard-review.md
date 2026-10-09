# Admin Dashboard Analytics Redesign

The admin dashboard OverviewTab has been replaced with a comprehensive analytics interface featuring real-time metrics, trend comparisons, and multi-line time series charts pulling from hospital, CDRRMO, and BFP operations tables. The 4-card status summary (Total, Pending, In Progress, Resolved) now appears at the top of ReportsTab, before the search/filter controls.

**Watch for:** Date filtering uses client-side filtering for reports but server-side date range queries for operational data, creating a potential mismatch in what "last 7 days" means across different charts. The El Niño case aggregation is hardcoded as a sum of 4 specific case types; if the schema evolves to include new heat-related categories, the calculation won't automatically include them.

**Verdict**: APPROVED

## High-level view

The overview dashboard now displays 6 metric cards (citizen reports, advisories, hospital admissions, CDRRMO ops, fire incidents, ambulance dispatches) with week-over-week trend indicators, plus 5 recharts visualizations covering report volume, top categories, health operations, emergency operations, and status distribution. The date range selector (7/30/90 days) controls all charts via a single state variable that triggers parallel queries to `hospital_daily_records`, `cdrrmo_daily_operations`, `bfp_daily_operations`, and `advisories`.

ReportsTab received a structural change: the 4 status cards (total/pending/in progress/resolved) now render before the search bar and filter controls, calculated from the `filtered` array so they respect active user filters. This means the card counts dynamically adjust as the user searches or narrows by date/category, which differs from the OverviewTab cards that always show the full last-7-days count.

Data preparation functions (`prepareReportsTimeline`, `prepareHealthOpsTimeline`, etc.) generate day-by-day arrays for the charts, filling in zeros for dates with no records. The health operations chart displays total hospital admissions alongside El Niño cases (calculated as heat_stroke + heat_exhaustion + dehydration + respiratory). The emergency operations chart overlays three lines: CDRRMO (relief + evacuations + emergency responses), BFP (fire incidents + rescue ops), and ambulance dispatches.

Build completed successfully with no errors and only standard chunk-size warnings for large dependencies. The implementation follows the existing inline-style pattern, uses theme colors from the `S` prop, and wraps all charts in `ResponsiveContainer` for fluid width.

<details>
<summary>Issues (3)</summary>

1. **Date range inconsistency between tabs** — OverviewTab uses independent date filtering (7/30/90 days) while ReportsTab uses manual start/end date pickers. Consider syncing them or clarifying that Overview shows "last N days" while Reports shows "custom range."

2. **El Niño case calculation is brittle** — `prepareHealthOpsTimeline` hardcodes `heat_stroke_cases + heat_exhaustion_cases + dehydration_cases + respiratory_cases`. If new heat-related columns are added to the schema, charts won't reflect them. Add a schema comment or consider a database view that defines "el_nino_cases" centrally.

3. **Trend calculation shows week-over-week but label says "Last 7 days"** — `formatTrend` compares `reportsLast7` (days 0-6) to `reportsPrior7` (days 7-13), but the card subtitle just says "Last 7 days" without indicating the comparison period. Users might expect an absolute count, not a trend. Either clarify the label ("vs. prior week") or separate trend from the main metric.

</details>

<details>
<summary>Details</summary>

## Trend label ambiguity

The trend calculation compares "last 7 days" to "prior 7 days" but the card subtitle just says "Last 7 days." A reviewer testing this might expect the number to be an absolute count, not a comparison. If the previous week had 10 reports and this week has 5, the trend shows "↓ 50%" in green (suggesting improvement), but the main number "5" looks smaller than expected. The label should clarify "vs. prior week" or the trend should be presented separately from the main metric.

## El Niño case calculation is hardcoded

`prepareHealthOpsTimeline` calculates `elNinoCases` as `heat_stroke_cases + heat_exhaustion_cases + dehydration_cases + respiratory_cases`. If the schema adds a new heat-related column (e.g., `heat_cramps_cases`), it won't appear in the chart unless the code is updated. The database schema should either include a computed column or a comment indicating which fields comprise "El Niño cases."

## ReportsTab status cards calculated from filtered array

The counts are calculated from the `filtered` array, meaning they reflect active search/category/date filters. This is a behavioral difference from OverviewTab, where the summary cards always show "last 7 days" regardless of user filters. Users might expect the status cards in ReportsTab to show all-time counts or match the OverviewTab period, not the currently filtered view. The current implementation is consistent with the "X results found" label, but it's a design decision worth verifying with the user.

## Date range filtering asymmetry

OverviewTab queries use `.gte("record_date", startDate)` (server-side filter) for hospital/CDRRMO/BFP data. The `reports` array comes from the parent component's `fetchData`, which doesn't have a date range filter. The chart preparation functions then filter `reports` on the client side using `r.created_at.startsWith(dateStr)`.

This creates a subtle mismatch. The hospital/CDRRMO/BFP charts show data starting exactly N days ago (server-filtered). The citizen reports timeline shows data from the `reports` array, which might include older records. In practice, `fetchData` calls `.order("created_at", { ascending: false })` without a date filter, so the `reports` array could contain months of data. The chart preparation functions will only use the last N days, but if `reports` is empty or sparse, the chart might show all zeros even if the operational data charts have activity. This is unlikely to cause visible bugs but could confuse debugging.

</details>

<details>
<summary>File Map</summary>

**Modified:**
- `src/screens/AdminDashboard.jsx` — Added recharts imports, replaced OverviewTab with analytics dashboard featuring 6 summary cards and 5 charts (LineChart for reports/health/emergency trends, BarChart for categories, PieChart for status distribution), added helper functions (`formatTrend`, `getDateDaysAgo`, `formatDateShort`), added data preparation functions (`prepareReportsTimeline`, `prepareReportsByCategory`, `prepareHealthOpsTimeline`, `prepareEmergencyOpsTimeline`, `prepareStatusDistribution`, `renderPieLabel`), added `SummaryCard` component, restructured ReportsTab to display 4 status cards above the search/filter section

**Database tables referenced (not modified):**
- `hospital_daily_records` — queried for `record_date`, `total_admissions`, `heat_stroke_cases`, `heat_exhaustion_cases`, `dehydration_cases`, `respiratory_cases`
- `cdrrmo_daily_operations` — queried for `operation_date`, `relief_operations`, `evacuations_conducted`, `emergency_responses`, `ambulance_dispatches`
- `bfp_daily_operations` — queried for `operation_date`, `fire_incidents`, `rescue_operations`
- `advisories` — queried for status "Published"

**Coder notes:** `.agents/tasks/admin-dashboard-coder-notes.md`

</details>
