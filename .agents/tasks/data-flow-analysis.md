# CLIMA Data Flow Analysis Report
**Date:** October 12, 2026  
**Issue:** Records encoded on admin side not displayed on client side  
**Status:** ✅ Bugs identified and fixes applied

---

## Executive Summary

The root cause of records not appearing on the client side was a combination of:
1. **RLS Policy Restrictions** — All data tables blocked anonymous (unauthenticated) reads
2. **Database Schema Mismatches** — Admin dashboard querying wrong table names and non-existent columns
3. **Client UI Gaps** — HomeScreen not displaying most admin-encoded data types

## Bugs Identified

### 🔴 BUG 1: OverviewTab reads from wrong BFP table name

**Location:** `src/screens/AdminDashboard.jsx` line ~756  
**Issue:** 
- OverviewTab queries `bfp_daily_operations` (which doesn't exist in deployed schema)
- Actual deployed table is `bfp_operations` (confirmed in `supabase_bfp_operations_v2.sql` and `FIX_DATABASE_SCHEMA.sql`)

**Fix Applied:** ✅
```javascript
// BEFORE:
supabase.from("bfp_daily_operations")

// AFTER:
supabase.from("bfp_operations")
```

---

### 🔴 BUG 2: OverviewTab uses wrong column names for BFP data

**Location:** `src/screens/AdminDashboard.jsx` `prepareEmergencyOpsTimeline()` function  
**Issue:**
- Function references `r.fire_incidents` and `r.rescue_operations` as aggregate columns
- `bfp_operations` table stores per-operation records with `operation_type` column (not daily aggregates)
- Schema uses: `operation_type`, `location`, `personnel_deployed`, `fire_trucks_dispatched`, `casualties`, `property_damage_estimate`

**Fix Applied:** ✅
```javascript
// BEFORE:
const bfpRecord = bfpRecords.find(r => r.operation_date === dateStr);
bfp: (bfpRecord?.fire_incidents || 0) + (bfpRecord?.rescue_operations || 0)

// AFTER:
const bfpOpsForDate = bfpRecords.filter(r => r.operation_date === dateStr);
const fireIncidents = bfpOpsForDate.filter(r => r.operation_type === 'fire_incident').length;
const rescueOps = bfpOpsForDate.filter(r => r.operation_type === 'rescue_operation').length;
bfp: fireIncidents + rescueOps
```

Also fixed the `bfpIncidentsLast7` calculation:
```javascript
// BEFORE:
.reduce((sum, r) => sum + (r.fire_incidents || 0), 0);

// AFTER:
.filter(r => r.operation_date >= last7Days && r.operation_type === 'fire_incident').length;
```

---

### 🔴 BUG 3: RLS policies block PUBLIC (anonymous) reads on most tables

**Location:** Supabase database RLS policies  
**Issue:**
All client-side screens run **without authentication** (citizens are anonymous users). But these tables had RLS policies restricted to `TO authenticated` only:

| Table | Current Policy | Required For Client |
|-------|---------------|---------------------|
| `bfp_operations` | ❌ authenticated only | ✅ Public read needed |
| `cdrrmo_daily_operations` | ❌ authenticated only | ✅ Public read needed |
| `agriculture_damage_reports` | ❌ authenticated only (role=admin) | ✅ Public read needed |
| `water_interruptions` | ❌ authenticated only (role=admin) | ✅ Public read needed |
| `power_interruptions` | ❌ authenticated only (role=admin) | ✅ Public read needed |
| `hospital_daily_records` | ✅ Has public SELECT policy | ✅ Already correct |
| `advisories` | ⚠️ Needs verification | ✅ Public read for Published status |

**Fix Created:** ✅  
SQL migration file created at: `FIX_PUBLIC_RLS_POLICIES.sql`

**Action Required:**
1. Open Supabase SQL Editor
2. Run the entire `FIX_PUBLIC_RLS_POLICIES.sql` script
3. Verify policies were created with the verification query at end of file

---

### 🟡 BUG 4: MapScreen reads from wrong table (non-critical)

**Location:** `src/screens/MapScreen.jsx`  
**Issue:**
- MapScreen queries `supabase.from('hospitals')` for the hospital layer
- All hospital data is encoded into `hospital_daily_records` table
- The `hospitals` table may not exist or be empty
- MapScreen shows hospitals as static hardcoded points from `CLIMA_COMMUNITY_FACILITIES` array

**Impact:** Low — hospitals still display from hardcoded coordinates  
**Fix Required:** Change MapScreen to query `hospital_daily_records` and use unique hospital names + locations

**Status:** ⚠️ NOT FIXED in this run (requires separate MapScreen refactor)

---

### 🟡 BUG 5: Client screens don't display most admin-encoded data (UI gap)

**Location:** `src/screens/HomeScreen.jsx`  
**Issue:**
HomeScreen currently only displays:
- ✅ Weather (KloudTech)
- ✅ Advisories
- ✅ Citizen reports
- ✅ Barangay list

HomeScreen does NOT display:
- ❌ Hospital records
- ❌ CDRRMO operations
- ❌ BFP operations
- ❌ Agriculture damages
- ❌ Water interruptions (should show active interruptions)
- ❌ Power interruptions (should show active outages)

**Status:** ⚠️ NOT FIXED in this run (requires HomeScreen UI redesign to add these sections)

**Recommendation:**  
Add the following sections to HomeScreen:
1. **Active Advisories** card (already exists, verify it's working)
2. **Active Water Interruptions** card (if any current)
3. **Active Power Outages** card (if any current)
4. **Recent Emergency Operations** list (CDRRMO + BFP last 7 days)
5. **Hospital Capacity Summary** (available beds across all facilities)

---

## Feature Addition: KloudTech Station Data in Admin Dashboard

**Request:** Add KloudTech (KT) live sensor data to Admin Dashboard Overview tab  
**Status:** ✅ COMPLETED

**Changes Applied:**
1. ✅ Added import of `fetchKloudtechDashboard` and `adaptKloudtechTelemetry` from `kloudtechService.js`
2. ✅ Added `ktData` state to OverviewTab
3. ✅ Created `fetchKloudtechData()` function to load station data on mount
4. ✅ Added KloudTech Live Sensor card in OverviewTab JSX (displays between Summary Cards and Charts Grid)
5. ✅ Added Wifi icon to Lucide imports

**Card Features:**
- Station name display
- "LIVE" badge with animated pulse indicator (if data is live)
- Live sensor readings: Temperature, Humidity, Heat Index, Wind Speed, Pressure, UV Index
- Last updated timestamp
- Styled consistently with existing SummaryCard pattern
- Gradient background with accent color border

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD (Authenticated)              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ OverviewTab                                               │   │
│  │  - Queries: hospital_daily_records ✅                    │   │
│  │  - Queries: cdrrmo_daily_operations ✅                   │   │
│  │  - Queries: bfp_operations ✅ (FIXED)                    │   │
│  │  - Queries: advisories ✅                                │   │
│  │  - Queries: KloudTech API ✅ (ADDED)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CRUD Tabs (Hospitals, Operations, BFP, etc.)             │   │
│  │  - INSERT/UPDATE operations ✅                           │   │
│  │  - RLS: authenticated users with role=admin ✅           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  SUPABASE DB    │
                    │  (PostgreSQL)   │
                    └─────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CLIENT SIDE (Anonymous/Unauthenticated)            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ HomeScreen                                                │   │
│  │  - Reads: advisories (status='Published') ✅             │   │
│  │  - Reads: reports ✅                                     │   │
│  │  - Reads: KloudTech weather ✅                           │   │
│  │  - Reads: barangays ✅                                   │   │
│  │  - ❌ MISSING: hospital, cdrrmo, bfp, water, power       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ MapScreen                                                 │   │
│  │  - Reads: reports ✅                                     │   │
│  │  - ❌ Queries wrong 'hospitals' table                    │   │
│  │  - ⚠️ Uses hardcoded facility coordinates               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Steps

### ✅ Code Fixes (Already Applied)
1. Check `AdminDashboard.jsx` line ~756: Should query `bfp_operations` not `bfp_daily_operations`
2. Check `prepareEmergencyOpsTimeline()`: Should count `operation_type` rows, not read aggregate columns
3. Check imports: Should include `fetchKloudtechDashboard`, `adaptKloudtechTelemetry`, and `Wifi` icon
4. Check OverviewTab JSX: Should render KloudTech Live Sensor card after Summary Cards Grid

### 🔧 Manual SQL Migration Required
1. Open Supabase project: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]
2. Navigate to SQL Editor
3. Open `FIX_PUBLIC_RLS_POLICIES.sql` from project root
4. Copy and paste entire script
5. Click "Run" to execute
6. Run the verification query at end of script to confirm all policies were created
7. Expected result: Each table should have a public SELECT policy with `TO anon, authenticated`

### 🧪 Testing Client-Side Data Flow
After applying SQL migration:

1. **Test Anonymous Reads (as citizen user):**
   ```javascript
   // Run in browser console on client side (not logged in)
   const { data, error } = await supabase
     .from('bfp_operations')
     .select('*')
     .limit(5);
   console.log('BFP ops:', data); // Should return data, not null
   ```

2. **Test each table:**
   - `cdrrmo_daily_operations`
   - `agriculture_damage_reports`
   - `water_interruptions`
   - `power_interruptions`
   - `advisories` (with status='Published')
   - `hospital_daily_records`

3. **Verify admin encoding → client display:**
   - Encode a BFP operation in admin dashboard
   - Refresh client app (not implemented to show yet, but query should work)
   - Check browser Network tab: Supabase query should return data (no 403/401 errors)

---

## Next Steps (Recommendations)

### High Priority
1. ✅ **Apply SQL migration** (`FIX_PUBLIC_RLS_POLICIES.sql`) — REQUIRED to fix data visibility
2. 🔲 **Test data flow** after SQL migration to confirm anonymous reads work
3. 🔲 **Add client UI sections** to HomeScreen for displaying:
   - Active water/power interruptions
   - Recent emergency operations summary
   - Hospital capacity overview

### Medium Priority
4. 🔲 **Fix MapScreen hospital layer** to read from `hospital_daily_records` instead of non-existent `hospitals` table
5. 🔲 **Add real-time subscriptions** for critical data (advisories, water/power interruptions) so citizens get instant updates

### Low Priority
6. 🔲 **Optimize queries** with indexes on frequently queried date columns (`operation_date`, `record_date`)
7. 🔲 **Add data retention policies** for old operation records (archive after 1 year)

---

## Files Modified in This Run

| File | Change Summary |
|------|---------------|
| `src/screens/AdminDashboard.jsx` | Fixed BFP table query, fixed column references, added KloudTech integration |
| `FIX_PUBLIC_RLS_POLICIES.sql` | **NEW FILE** — SQL migration to add public read policies |
| `.agents/tasks/data-flow-analysis.md` | **NEW FILE** — This report |

---

## Conclusion

**Root Cause Confirmed:**  
Records encoded on admin side were not displayed on client side because:
1. RLS policies blocked all anonymous reads (authentication required)
2. Admin dashboard had schema mismatches preventing proper data queries
3. Client UI was not designed to display most data types

**Fixes Applied:**
- ✅ Admin dashboard schema mismatches corrected
- ✅ KloudTech live sensor data added to admin dashboard
- ✅ SQL migration script created for RLS policies

**Action Required:**
- 🔧 **User must run `FIX_PUBLIC_RLS_POLICIES.sql` in Supabase SQL Editor**

Once the SQL migration is applied, all admin-encoded records will be readable by anonymous client users. The client UI still needs enhancement to actually display these records in HomeScreen and MapScreen, but the data flow will be unblocked.
