# Water and Power Utility Module Implementation

Two new utility tracking modules for monitoring El Niño-related service interruptions: water (supporting Palayan City Water District and Balibago Waterworks) and power (NEECO). The water module uses grouped day-based views with collapsible sections defaulting to collapsed, while power uses a flat chronological list. Both include analytics cards showing 30-day summaries, database-enforced constraints via CHECK clauses, and 365-day query windows. Build passed cleanly.

**Watch for:** No blocking issues found. Implementation matches spec requirements.

**Verdict**: APPROVED

## High-level view

The water module queries `water_interruptions` with a 365-day filter and groups by date in the view tab with collapsible day headers defaulting to collapsed. The power module queries `power_interruptions` with the same 365-day filter but renders a flat list by date. Both Add forms include all required fields with CustomSelect dropdowns for constrained values (provider, cause, status). Database CHECK constraints enforce the dropdown values at the schema level. Analytics cards compute from the last 30 days of the fetched records. Edit and delete operations work through standard Supabase patterns. The forms call `fetchRecords()` after successful save.

The 365-day query window optimizes performance while maintaining a year of historical visibility. Day expansion state in water uses `expandedDays[day] === true` for default-collapsed behavior, toggled via `!prev[d]`. Error handling routes through `showErrorModal`.

<details>
<summary>Details</summary>

## Database schema enforces dropdown constraints

The SQL schema files define CHECK constraints matching form dropdown options exactly. Water provider is constrained to 'Palayan City Water District' or 'Balibago Waterworks', cause to pipe_burst | maintenance | shortage | pump_failure | other, status to ongoing | restored. Power cause is constrained to line_fault | transformer_issue | weather | maintenance | overload | other, restoration_status to ongoing | restored | partial. Form CustomSelect components at water lines 4833 (provider), 4843 (cause), 4852 (status) and power lines 5253 (cause), 5265 (restoration_status) specify identical value sets.

## Water module groups by day with collapsible sections

WaterUtilityTab fetches with `.gte('interruption_date', cutoffDate)` where cutoffDate is 365 days ago (line 4732), ordered by `interruption_date` descending then `created_at` descending. The view tab (line 4915) reduces records into a `grouped` object keyed by date, sorts the keys descending, then maps over `sortedDays` to render collapsible day sections (line 4926-5046).

Day sections show a header button (line 4995) with date label, record count badge, and chevron icon. The `isOpen` check (line 4988) is `expandedDays[day] === true`, which evaluates false for undefined (initial state), so days default to collapsed. The toggle function (line 4850) does `!prev[d]`, flipping undefined → true → false → true as the user clicks. When `isOpen` is true, the section renders `dayRecords.map(r => ...)` inside a conditional block (line 5003-5037), displaying provider, status badge, time, barangays, duration, households, cause, description, and edit/delete buttons.

## Power module renders flat list by date

PowerUtilityTab fetches with the same 365-day filter (line 5067), ordered by `interruption_date` descending. The view tab (line 5285) maps directly over `records` without day grouping, rendering each record as a flat card (line 5294-5319) showing date label, restoration status badge, outage count, households, duration, peak time, cause, feeders, description, and edit/delete buttons. No collapsibility.

## Add forms have all required fields

Water Add form (line 4821): date (required), time, provider dropdown (required via CustomSelect), affected_barangays, cause dropdown, status dropdown, duration_hours, households_affected, description textarea.

Power Add form (line 5233): interruption_date (required), peak_outage_time, total_outages (required), total_duration_minutes, total_affected_households, cause dropdown, feeders_affected, restoration_status dropdown, description textarea.

Field presence and input types match spec. Power form places feeders_affected after cause rather than after households, but all fields are present and accessible.

## Analytics compute from 30-day subset of fetched records

Both modules filter the already-fetched `records` array (which holds up to 365 days of data) to a `recent` subset covering the last 30 days (water line 4882, power line 5178). Analytics cards compute from this subset: water shows total interruptions, total duration, total households, ongoing count, provider split (PCWD vs Balibago); power shows days with outages, total outages, total households, total duration, average outages per day. Since 30 days is always within 365 days, the analytics always have the full 30-day window.

## Save calls fetchRecords, errors route to showErrorModal

Water `handleSave` (line 4788) and power `handleSave` (line 5107) build a payload, call Supabase insert or update based on `editId`, then on success call `showSuccessModal`, reset form, switch to view tab, and `await fetchRecords()`. On error, both call `showErrorModal` with the error message. Edit operations (water line 4798, power line 5139) load record into `formData` and switch to Add tab. Delete operations (water line 4812, power line 5152) call `showConfirmModal`, then delete via `.delete().eq('id', id)`, fetch records, and show success modal.

</details>

<details>
<summary>File map</summary>

- `supabase_water_interruptions.sql` — schema for water_interruptions table with CHECK constraints
- `supabase_power_interruptions.sql` — schema for power_interruptions table with CHECK constraints
- `src/screens/AdminDashboard.jsx` (lines 4704-5315) — WaterUtilityTab and PowerUtilityTab implementations

Full diff: `git diff main src/screens/AdminDashboard.jsx supabase_water_interruptions.sql supabase_power_interruptions.sql`

</details>
