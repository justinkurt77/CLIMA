# CLIMA Performance Optimization Implementation Plan

## Project Context
- **Project Type**: React + Vite + Supabase PWA (Progressive Web App)
- **Build Command**: `npm run build`
- **Dev Command**: `npm run dev`
- **Test Framework**: None detected (manual testing required)
- **Verification**: Visual inspection + Lighthouse audit + browser DevTools

## Current State Analysis
Based on exploration of the CLIMA codebase:
- React 19.2.0 + Vite 7.3.1 + Supabase 2.104.1
- No pagination or infinite scroll implemented
- React Query NOT installed (needs installation)
- Multiple Supabase queries fetching related data (categories → departments pattern found)
- No lazy loading on images (though minimal `<img>` tags found, mostly icon-based UI)
- No React.memo optimization on components
- No database indexes documented
- 8 major data tables: hospital_daily_records, cdrrmo_daily_operations, bfp_operations, agriculture_damage_reports, water_interruptions, power_interruptions, advisories, reports

## Performance Issues Identified
1. **No pagination** → All records loaded at once in AdminDashboard.jsx
2. **Potential N+1 queries** → `categories.select("*, departments(name)")` pattern but needs verification of actual N+1 in data fetching loops
3. **No component memoization** → Large dashboard components re-render unnecessarily
4. **Missing database indexes** → Date-based queries without proper indexing
5. **No image optimization** → Though minimal images, ReportCard.jsx has `<img>` tags without lazy loading

---

## Fix 1: Pagination with React Query (HIGH PRIORITY)

### Overview
Install React Query and create 5 paginated data hooks for the most data-heavy modules. Replace full-table queries with cursor-based pagination using Supabase .range(). Implement infinite scroll in the AdminDashboard tabs.

### Implementation Steps

- [ ] 1. **Install React Query dependencies**
      ```bash
      npm install @tanstack/react-query@5.62.19 react-intersection-observer@9.13.3
      ```
      Files: package.json
      Verify: `npm list @tanstack/react-query react-intersection-observer` shows both packages installed

- [ ] 2. **Set up QueryClientProvider in src/main.jsx**
      Import QueryClient and QueryClientProvider from @tanstack/react-query. Wrap the entire `<App />` with QueryClientProvider, passing a new QueryClient instance with default staleTime of 5 minutes.
      Files: src/main.jsx
      Verify: `npm run dev` starts without errors; React DevTools shows QueryClientProvider in component tree

- [ ] 3. **Create src/hooks/ directory and pagination hooks**
      Create 5 hooks using useInfiniteQuery pattern:
      - src/hooks/usePaginatedReports.js (PAGE_SIZE=50, filters: status, category, department_id)
      - src/hooks/usePaginatedAdvisories.js (PAGE_SIZE=20, filters: status, department_id)
      - src/hooks/usePaginatedHospitalRecords.js (PAGE_SIZE=30, filters: date range, hospital_name)
      - src/hooks/usePaginatedCDRRMOOps.js (PAGE_SIZE=30, filters: date range, status, operation_type)
      - src/hooks/usePaginatedBFPOps.js (PAGE_SIZE=30, filters: date range, status, operation_type)
      
      Each hook:
      - Uses useInfiniteQuery with queryKey including filters
      - Fetches data with Supabase .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)
      - Joins related tables in single query: `.select('*, departments(name, accent_color), categories(name, icon)')`
      - Returns { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error }
      - Implements getNextPageParam to return nextPage or undefined
      
      Files: src/hooks/usePaginatedReports.js, src/hooks/usePaginatedAdvisories.js, src/hooks/usePaginatedHospitalRecords.js, src/hooks/usePaginatedCDRRMOOps.js, src/hooks/usePaginatedBFPOps.js
      Verify: `npm run build` succeeds with no import errors

- [ ] 4. **Update ReportsTab in AdminDashboard.jsx to use usePaginatedReports**
      Replace the existing reports state and fetchData logic with usePaginatedReports hook. Map `data.pages.flatMap(page => page)` to get all loaded items. Add infinite scroll trigger at bottom using useInView from react-intersection-observer that calls fetchNextPage when visible.
      Files: src/screens/AdminDashboard.jsx (ReportsTab function)
      Verify: Open admin dashboard → Reports tab → scroll to bottom → next page loads automatically; browser Network tab shows paginated queries with .range() params

- [ ] 5. **Update AdvisoriesTab to use usePaginatedAdvisories**
      Same pattern as ReportsTab: replace state with hook, implement infinite scroll.
      Files: src/screens/AdminDashboard.jsx (AdvisoriesTab function)
      Verify: Advisories tab loads 20 at a time, infinite scroll works, no console errors

- [ ] 6. **Update HospitalsTab to use usePaginatedHospitalRecords**
      Files: src/screens/AdminDashboard.jsx (HospitalsTab function)
      Verify: Hospital records tab loads 30 at a time, date filter triggers new query, infinite scroll works

- [ ] 7. **Update OperationsTab (CDRRMO) to use usePaginatedCDRRMOOps**
      Files: src/screens/AdminDashboard.jsx (OperationsTab function)
      Verify: CDRRMO operations tab loads 30 at a time, filters work, infinite scroll works

- [ ] 8. **Update BfpOperationsTab to use usePaginatedBFPOps**
      Files: src/screens/AdminDashboard.jsx (BfpOperationsTab function)
      Verify: BFP operations tab loads 30 at a time, filters work, infinite scroll works

---

## Fix 2: Eliminate N+1 Queries (HIGH PRIORITY)

### Overview
Audit all Supabase queries to ensure related data is fetched in a single query using joins, not in loops. The primary pattern to fix is reports/advisories/operations fetching categories/departments separately.

### Implementation Steps

- [ ] 1. **Audit and document all Supabase queries across the application**
      Search for patterns like:
      - Multiple .from().select() calls in loops
      - .map() over results followed by individual queries
      - fetchData functions that query one table then loop to query related records
      
      Files to check: src/screens/AdminDashboard.jsx, src/screens/HomeScreen.jsx, src/screens/AdminMapScreen.jsx, src/screens/ProfileScreen.jsx, src/components/dashboard/ElNinoMonitoringDashboard.jsx
      Verify: Create a checklist document listing each query location and whether it has N+1 risk

- [ ] 2. **Fix reports queries to join categories and departments in single query**
      Current pattern in AdminDashboard.jsx line 254: `supabase.from("reports").select("*")`
      Replace with: `supabase.from("reports").select("*, categories(id, name, icon, department_id, departments(id, name, accent_color))")`
      This fetches all related data in ONE query instead of N separate queries for each report's category/department.
      Files: src/screens/AdminDashboard.jsx (fetchData function)
      Verify: Browser Network tab shows single query with nested data; no multiple separate queries for categories or departments

- [ ] 3. **Fix advisories queries to join departments and profiles in single query**
      Current pattern: `supabase.from("advisories").select("*, departments(name)")`
      Add author profile join: `supabase.from("advisories").select("*, departments(id, name, accent_color), profiles(id, full_name, email)")`
      Files: src/screens/AdminDashboard.jsx (AdvisoriesTab fetchAdvisories), src/screens/HomeScreen.jsx (fetchAdvisories)
      Verify: Network tab shows single query with all related data

- [ ] 4. **Fix hospital records queries to join related lookup tables**
      If hospital_daily_records has foreign keys to hospitals or other tables, join them in the initial query.
      Files: src/screens/AdminDashboard.jsx (HospitalsTab), src/components/dashboard/ElNinoMonitoringDashboard.jsx
      Verify: Single query per fetch, no loops triggering additional queries

- [ ] 5. **Fix CDRRMO operations queries to join operation types and resources**
      Ensure cdrrmo_daily_operations fetches all related data in single query with appropriate joins.
      Files: src/screens/AdminDashboard.jsx (OperationsTab), src/components/dashboard/ElNinoMonitoringDashboard.jsx
      Verify: Network tab shows single comprehensive query

- [ ] 6. **Fix BFP operations queries to join fire stations and resource data**
      Files: src/screens/AdminDashboard.jsx (BfpOperationsTab), src/components/dashboard/ElNinoMonitoringDashboard.jsx
      Verify: Network tab shows single comprehensive query

- [ ] 7. **Fix agriculture damage reports queries to join farmer/location lookups**
      Files: src/screens/AdminDashboard.jsx (AgricultureDamagesTab)
      Verify: Network tab shows single comprehensive query

- [ ] 8. **Verify ReportCard component doesn't trigger additional queries**
      Check that ReportCard.jsx (which receives report prop) doesn't make any Supabase calls internally.
      Files: src/components/ui/ReportCard.jsx
      Verify: Search code for `supabase` import—should not exist in this component

- [ ] 9. **Verify MapPins and map components don't have N+1 patterns**
      Files: src/components/map/MapPins.jsx, src/components/map/MapPopupContent.jsx, src/screens/MapScreen.jsx, src/screens/AdminMapScreen.jsx
      Verify: No loops over markers/pins that trigger individual queries

---

## Fix 3: Quick Performance Wins (MEDIUM PRIORITY)

### Overview
Apply standard React performance optimizations: lazy loading images, React.memo for expensive components, preconnect hints for external domains.

### Implementation Steps

- [ ] 1. **Add lazy loading to all images in ReportCard.jsx**
      Find `<img>` tag at line 86 in ReportCard.jsx. Add `loading="lazy"` attribute and explicit `width={44}` `height={44}` attributes (already has inline style, but explicit attributes help browser).
      Files: src/components/ui/ReportCard.jsx
      Verify: Inspect element in browser → img tag has loading="lazy" width="44" height="44"

- [ ] 2. **Search for and fix all other images across the app**
      Run grep to find all `<img` tags: most UI is icon-based (lucide-react) but check photo uploads, report images, user avatars.
      Command: `grep -r "<img" src/`
      Files: Any files with img tags (likely ReportModal.jsx, PhotoCard.jsx, PhotoLightbox.jsx)
      Verify: All found img tags have loading="lazy" and explicit dimensions

- [ ] 3. **Add preconnect and dns-prefetch to index.html**
      Add before existing stylesheet links:
      ```html
      <link rel="preconnect" href="https://api.mapbox.com" />
      <link rel="preconnect" href="https://events.mapbox.com" />
      <link rel="dns-prefetch" href="https://api.mapbox.com" />
      <link rel="dns-prefetch" href="https://events.mapbox.com" />
      <link rel="preconnect" href="https://<SUPABASE_PROJECT>.supabase.co" />
      <link rel="dns-prefetch" href="https://<SUPABASE_PROJECT>.supabase.co" />
      ```
      Replace `<SUPABASE_PROJECT>` with actual Supabase project URL from .env (read VITE_SUPABASE_URL).
      Files: index.html
      Verify: View page source → preconnect and dns-prefetch links present; browser DevTools Network tab shows earlier connection establishment

- [ ] 4. **Wrap ReportCard in React.memo**
      Export as `export default React.memo(ReportCard)` to prevent unnecessary re-renders when parent updates but props haven't changed.
      Files: src/components/ui/ReportCard.jsx
      Verify: React DevTools Profiler shows ReportCard doesn't re-render when unrelated state changes

- [ ] 5. **Wrap MapPins PinMarker component in React.memo**
      In MapPins.jsx, wrap the PinMarker export with React.memo.
      Files: src/components/map/MapPins.jsx
      Verify: React DevTools Profiler shows fewer PinMarker re-renders on map interactions

- [ ] 6. **Wrap expensive sections of ElNinoMonitoringDashboard in React.memo**
      Break down ElNinoMonitoringDashboard.jsx into smaller components for each section (AdvisoriesSection, HospitalSection, BFPSection, CDRRMOSection, AgricultureSection, InterruptionsSection) and wrap each in React.memo with proper dependency checking.
      Files: src/components/dashboard/ElNinoMonitoringDashboard.jsx
      Verify: React DevTools Profiler shows sections only re-render when their specific data changes

- [ ] 7. **Optimize AdminDashboard tab rendering with useMemo**
      Wrap expensive computations (analytics calculations, chart data transformations) in useMemo with appropriate dependencies.
      Files: src/screens/AdminDashboard.jsx (OverviewTab analytics calculations)
      Verify: React DevTools Profiler shows reduced render times

---

## Fix 4: Database Indexes (MEDIUM PRIORITY)

### Overview
Create comprehensive database indexes for all date-based queries, status filters, and foreign key lookups to speed up Supabase queries by 10-100x.

### Implementation Steps

- [ ] 1. **Create PERFORMANCE_DATABASE_INDEXES.sql with all necessary indexes**
      Create file with indexes for:
      
      **hospital_daily_records:**
      - CREATE INDEX IF NOT EXISTS idx_hospital_records_date_desc ON hospital_daily_records(record_date DESC);
      - CREATE INDEX IF NOT EXISTS idx_hospital_records_hospital ON hospital_daily_records(hospital_name);
      - CREATE INDEX IF NOT EXISTS idx_hospital_records_date_hospital ON hospital_daily_records(record_date DESC, hospital_name);
      
      **cdrrmo_daily_operations:**
      - CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_date_desc ON cdrrmo_daily_operations(operation_date DESC);
      - CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_status ON cdrrmo_daily_operations(status);
      - CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_type ON cdrrmo_daily_operations(operation_type);
      - CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_composite ON cdrrmo_daily_operations(operation_date DESC, status);
      
      **bfp_operations:**
      - CREATE INDEX IF NOT EXISTS idx_bfp_ops_date_desc ON bfp_operations(operation_date DESC);
      - CREATE INDEX IF NOT EXISTS idx_bfp_ops_status ON bfp_operations(status);
      - CREATE INDEX IF NOT EXISTS idx_bfp_ops_type ON bfp_operations(operation_type);
      - CREATE INDEX IF NOT EXISTS idx_bfp_ops_incident_type ON bfp_operations(incident_type);
      - CREATE INDEX IF NOT EXISTS idx_bfp_ops_composite ON bfp_operations(operation_date DESC, status);
      
      **agriculture_damage_reports:**
      - CREATE INDEX IF NOT EXISTS idx_agri_damage_date_desc ON agriculture_damage_reports(report_date DESC);
      - CREATE INDEX IF NOT EXISTS idx_agri_damage_barangay ON agriculture_damage_reports(barangay);
      - CREATE INDEX IF NOT EXISTS idx_agri_damage_crop ON agriculture_damage_reports(crop_type);
      - CREATE INDEX IF NOT EXISTS idx_agri_damage_status ON agriculture_damage_reports(status);
      - CREATE INDEX IF NOT EXISTS idx_agri_damage_category ON agriculture_damage_reports(category);
      
      **water_interruptions:**
      - CREATE INDEX IF NOT EXISTS idx_water_int_date_desc ON water_interruptions(interruption_date DESC);
      - CREATE INDEX IF NOT EXISTS idx_water_int_status ON water_interruptions(status);
      - CREATE INDEX IF NOT EXISTS idx_water_int_provider ON water_interruptions(provider);
      - CREATE INDEX IF NOT EXISTS idx_water_int_composite ON water_interruptions(interruption_date DESC, status);
      - CREATE INDEX IF NOT EXISTS idx_water_int_barangays_gin ON water_interruptions USING GIN (to_tsvector('english', affected_barangays));
      
      **power_interruptions:**
      - CREATE INDEX IF NOT EXISTS idx_power_int_date_desc ON power_interruptions(interruption_date DESC);
      - CREATE INDEX IF NOT EXISTS idx_power_int_status ON power_interruptions(status);
      - CREATE INDEX IF NOT EXISTS idx_power_int_provider ON power_interruptions(provider);
      - CREATE INDEX IF NOT EXISTS idx_power_int_composite ON power_interruptions(interruption_date DESC, status);
      - CREATE INDEX IF NOT EXISTS idx_power_int_barangays_gin ON power_interruptions USING GIN (to_tsvector('english', affected_barangays));
      
      **advisories:**
      - CREATE INDEX IF NOT EXISTS idx_advisories_status ON advisories(status);
      - CREATE INDEX IF NOT EXISTS idx_advisories_published_desc ON advisories(published_at DESC);
      - CREATE INDEX IF NOT EXISTS idx_advisories_composite ON advisories(status, published_at DESC);
      - CREATE INDEX IF NOT EXISTS idx_advisories_department ON advisories(department_id);
      
      **reports:**
      - CREATE INDEX IF NOT EXISTS idx_reports_department ON reports(department_id);
      - CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      - CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
      - CREATE INDEX IF NOT EXISTS idx_reports_created_desc ON reports(created_at DESC);
      - CREATE INDEX IF NOT EXISTS idx_reports_composite ON reports(department_id, status, created_at DESC);
      - CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
      
      **activity_logs (if exists):**
      - CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
      - CREATE INDEX IF NOT EXISTS idx_activity_logs_created_desc ON activity_logs(created_at DESC);
      - CREATE INDEX IF NOT EXISTS idx_activity_logs_composite ON activity_logs(user_id, created_at DESC);
      
      **notifications (if exists):**
      - CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      - CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
      - CREATE INDEX IF NOT EXISTS idx_notifications_created_desc ON notifications(created_at DESC);
      - CREATE INDEX IF NOT EXISTS idx_notifications_composite ON notifications(user_id, is_read, created_at DESC);
      
      Files: PERFORMANCE_DATABASE_INDEXES.sql
      Verify: File exists with all 40+ index creation statements

- [ ] 2. **Document index rationale and maintenance in comments**
      Add header comments explaining:
      - Why each index exists (query pattern it optimizes)
      - How to verify index usage: `EXPLAIN ANALYZE` examples
      - Warning about write performance tradeoff
      - Recommendation to monitor index usage with pg_stat_user_indexes
      Files: PERFORMANCE_DATABASE_INDEXES.sql
      Verify: File has comprehensive documentation header

- [ ] 3. **Provide execution instructions**
      Add instructions at top of SQL file:
      ```sql
      -- PERFORMANCE DATABASE INDEXES
      -- Run this in Supabase SQL Editor to create all performance indexes
      -- Execution time: ~30-60 seconds depending on data volume
      -- IMPORTANT: Run during low-traffic period if possible
      -- These indexes will significantly improve query performance for date-based and filtered queries
      ```
      Files: PERFORMANCE_DATABASE_INDEXES.sql
      Verify: Clear execution instructions at top of file

- [ ] 4. **Create index monitoring query**
      Add at bottom of file:
      ```sql
      -- VERIFY INDEX USAGE
      -- Run this query after creating indexes to confirm they exist:
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as times_used,
        idx_tup_read as rows_read,
        idx_tup_fetch as rows_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('hospital_daily_records', 'cdrrmo_daily_operations', 'bfp_operations', 
                          'agriculture_damage_reports', 'water_interruptions', 'power_interruptions',
                          'advisories', 'reports', 'activity_logs', 'notifications')
      ORDER BY tablename, indexname;
      ```
      Files: PERFORMANCE_DATABASE_INDEXES.sql
      Verify: Monitoring query present at end of file

---

## Verification Procedure

After implementing all fixes:

1. **Build Verification**
   ```bash
   npm run build
   ```
   Must complete with 0 errors. Check dist/ folder size is reasonable.

2. **Dev Server Testing**
   ```bash
   npm run dev
   ```
   Navigate to http://localhost:5173, test:
   - Admin dashboard loads without errors
   - Each tab (Reports, Advisories, Hospital, CDRRMO, BFP, Agriculture, Water, Power) displays data
   - Infinite scroll works on paginated tabs
   - No console errors

3. **Network Performance Check**
   - Open browser DevTools → Network tab
   - Navigate to admin dashboard Reports tab
   - Verify: Initial query loads ~50 records, not 1000+
   - Scroll to bottom → verify next page query fires
   - Check query response times (should be <500ms)
   - Count total queries: should see 1 paginated query per scroll, not N+1 individual queries

4. **React DevTools Profiler**
   - Install React DevTools browser extension
   - Open Profiler tab
   - Navigate between dashboard tabs
   - Verify: Memo'd components (ReportCard, PinMarker) don't re-render unnecessarily
   - Check render times: tab switches should be <100ms

5. **Database Index Verification**
   - Execute PERFORMANCE_DATABASE_INDEXES.sql in Supabase SQL Editor
   - Run the verification query at bottom of file
   - Confirm all indexes exist with `times_used > 0` after using the app

6. **Lighthouse Audit**
   ```bash
   npm run build
   npm run preview
   ```
   - Open http://localhost:4173 in Chrome incognito
   - Run Lighthouse audit (DevTools → Lighthouse → Desktop)
   - Target scores: Performance 85+, Best Practices 90+
   - Check metrics: FCP <1.5s, LCP <2.5s, TTI <3.5s

7. **Visual Regression Testing**
   - Manually test all screens look identical to before optimization
   - No layout shifts or broken components
   - Images still load correctly (lazy loading shouldn't affect UX)

---

## Success Criteria

- ✅ React Query installed and QueryClientProvider wrapping app
- ✅ 5 pagination hooks created and integrated into AdminDashboard tabs
- ✅ Infinite scroll working on all paginated tabs
- ✅ All N+1 queries eliminated (verified via Network tab)
- ✅ React.memo applied to ReportCard, PinMarker, and dashboard sections
- ✅ Lazy loading on all images
- ✅ Preconnect hints in index.html
- ✅ 40+ database indexes created via PERFORMANCE_DATABASE_INDEXES.sql
- ✅ Build completes with 0 errors
- ✅ All admin dashboard tabs functional
- ✅ Lighthouse Performance score 85+
- ✅ Network tab shows reduced query count and faster response times

---

## Risk Assessment & Rollback Plan

**Risks:**
1. React Query integration could break existing state management
2. Pagination might not work correctly with existing filters
3. Database indexes could slow down writes (unlikely in read-heavy app)

**Mitigation:**
- Test each tab thoroughly after React Query integration
- Keep pagination logic simple: cursor-based with .range()
- Monitor database write performance after index creation

**Rollback:**
- If React Query breaks: `npm uninstall @tanstack/react-query react-intersection-observer` and revert main.jsx and hooks
- If pagination breaks: revert individual tab components to original fetchData pattern
- If indexes cause issues: Drop indexes with `DROP INDEX IF EXISTS idx_name` in Supabase SQL Editor

---

## Notes

- No test framework detected, so all verification is manual + Lighthouse
- Build command `npm run build` uses Vite with esbuild minification
- Existing CSS uses Tailwind 4.2.4 with Vite plugin
- Mapbox GL and Recharts are large dependencies—already optimized in vite.config.js with `optimizeDeps.include`
- Service worker unregistered in index.html script (commented as "Clear any stale service worker caches")

---

**Plan Author**: AI Agent (wf-planner)  
**Plan Date**: 2025-01-XX  
**Estimated Implementation Time**: 8-12 hours (across 4 work sessions)
