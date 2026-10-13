# CLIMA Application Flow Document

## Navigation Architecture

### Routing System
**Type:** State-based routing (no React Router)  
**Implementation:** `activeScreen` state in App.jsx controls which screen renders  
**Mechanism:** Single-page app with conditional rendering based on state

### Navigation Components
- **Citizen:** `CitizenNav.jsx` — Bottom navigation bar (5 tabs)
- **Admin:** Sidebar navigation in `AdminDashboard.jsx` (12 tabs)

### Screen Management
- Only one screen visible at a time
- Screens animated with Framer Motion (slide/fade transitions)
- Browser back/forward monitored via `popstate` event (App.jsx lines 86-100)

---

## Screen Inventory

### Citizen Screens

| Screen Name | File | Route Trigger | Description |
|-------------|------|---------------|-------------|
| **Home** | HomeScreen.jsx | `activeScreen === "home"` | Main dashboard with weather, advisories, reports preview |
| **Map** | MapScreen.jsx | `activeScreen === "maps"` | Full-screen interactive map with 11 toggleable layers |
| **Emergency** | EmergencyScreen.jsx | `activeScreen === "emergency"` | Emergency hotlines directory (6 departments) |
| **Profile** | ProfileScreen.jsx | `activeScreen === "profile"` | User authentication and profile customization |
| **El Niño** | ElNinoMonitoringDashboard.jsx | `activeScreen === "elnino"` | El Niño impact dashboard (6 monitoring sections) |

### Admin Screens

| Screen Name | File | Route Trigger | Description |
|-------------|------|---------------|-------------|
| **Admin Login** | AdminLogin.jsx | `pathname === "/admin"`, not authenticated | Email/password login, password reset, first-time password change |
| **Admin Dashboard** | AdminDashboard.jsx | `pathname === "/admin"`, authenticated | Multi-tab admin console (12 modules) |
| **Admin Map** | AdminMapScreen.jsx | `activeScreen === "admin-map"`, authenticated | Full-screen map with report filtering and status updates |
| **Change Password** | ChangePasswordScreen.jsx | Triggered by `must_change_password` flag | Force password change on first admin login |
| **Forgot Password** | ForgotPasswordScreen.jsx | Triggered from AdminLogin | Password recovery via email OTP |

### Embedded Screens

| Screen Name | Parent | Trigger | Description |
|-------------|--------|---------|-------------|
| **My Reports** | ProfileScreen.jsx | Authenticated user clicks "My Reports" | User's submitted reports history |
| **Auth Screen** | ProfileScreen.jsx | Unauthenticated user accesses Profile | Email/password login/signup form |
| **Facebook Moderation** | AdminDashboard.jsx | Admin tab (not yet activated) | Social media monitoring queue |
| **Intelligence Dashboard** | AdminDashboard.jsx | Admin tab (Phase 11) | Inter-agency intelligence and conflict alerts |
| **Executive Dashboard** | AdminDashboard.jsx | Admin tab (Phase 12) | Analytics, charts, PDF/CSV export |

---

## User Journeys

### Journey 1: Anonymous Citizen — View Weather & Advisories

**Goal:** Check today's weather and see if any advisories are active

**Steps:**
1. User opens app (CLIMA loads HomeScreen by default)
2. HomeScreen renders:
   - Weather hero section with heat index, temperature, "feels like" display
   - Barangay selector dropdown (34 options)
   - Current conditions fetched from Open-Meteo API based on barangay lat/lng
3. User scrolls down to see:
   - "Official Advisories" section with published advisory cards
   - Severity color coding (low=blue, medium=yellow, high=orange, critical=red)
   - Tap advisory card to expand full content in modal
4. User scrolls further to see:
   - "Recent Reports" section with latest 5 citizen reports
   - Tap "View All" to navigate to Map screen with reports layer active
5. User taps bottom nav "Maps" icon → `setActiveScreen("maps")`
6. MapScreen renders with default layers (reports, hospitals, fire stations)
7. User taps layer control button → LayerControls panel slides in
8. User toggles layers on/off to see facilities and incidents
9. User taps report pin → MapPopupContent shows report details

**Exit:** User closes app or navigates to another screen via bottom nav

---

### Journey 2: Citizen — Submit a Report

**Goal:** Report a broken water pipe to the government

**Prerequisite:** User does NOT need to be logged in (guest submission allowed)

**Steps:**
1. User on any citizen screen
2. User taps floating "+ Report" button (bottom-right corner)
3. System checks authentication:
   - If NOT logged in: Asks "Submit as guest or sign in?" (prompt in ReportModal)
   - User chooses "Submit as Guest"
4. `ReportModal` opens with 4-step wizard:

   **Step 1: Category Picker**
   - Grid of category icons (from `categories` table)
   - Icons grouped by department (CDRRMO, BFP, Hospital, etc.)
   - User taps "Water & Sanitation" icon
   - Next button enabled → User taps Next

   **Step 2: Details Form**
   - Description textarea (min 10 characters)
   - Photo upload button (optional, max 3 photos)
   - User types: "Broken water pipe flooding the street"
   - User taps camera icon → file picker opens
   - User selects photo from gallery
   - Photo compressed via `browser-image-compression` (max 1MB, 1920x1920px)
   - Photo watermarked with filename in bottom-right corner
   - Preview thumbnail shown
   - Guest info card prompts for optional full name
   - User types: "Juan Dela Cruz"
   - Next button enabled → User taps Next

   **Step 3: Map Picker**
   - Mapbox map centered on user's current location (if permission granted)
   - Center pin overlay (crosshair style)
   - Instruction: "Drag map to select exact location"
   - User drags map to street where pipe is broken
   - On map drag end: Reverse geocoding via Mapbox API fetches address
   - Address displayed below map: "Barangay Poblacion, Palayan City"
   - Submit button enabled → User taps Submit

   **Step 4: Success Confirmation**
   - Success icon animation
   - Message: "Report submitted! Tracking ID: ABC123"
   - Report stored in `reports` table with:
     - `status='pending'`
     - `is_guest=true`
     - `full_name='Juan Dela Cruz'`
     - `user_id=null`
     - `photo_url='reports/{random-folder}/{timestamp}.jpg'`
   - Close button → Modal closes, returns to previous screen

5. Report now visible on Map screen (reports layer) with "pending" status
6. Admin receives notification in Admin Dashboard → Citizen Reports tab

**Exit:** User returns to Home screen via bottom nav

---

### Journey 3: Citizen — View El Niño Dashboard

**Goal:** Check how El Niño is affecting Palayan City

**Steps:**
1. User taps bottom nav "El Niño" icon (sun icon)
2. `setActiveScreen("elnino")`
3. `ElNinoMonitoringDashboard.jsx` renders with 6 sections:

   **Section 1: Official Advisories**
   - Filters advisories to El Niño category only
   - Shows advisory cards with severity color coding
   - Tap to expand full advisory content

   **Section 2: Hospital Monitoring**
   - Displays heat-related case statistics from `hospital_daily_records`
   - Shows: Total cases, heat stroke, heat exhaustion, dehydration
   - Recent records list with date, hospital name, case counts
   - If no data: "No heat-related cases recorded recently"

   **Section 3: BFP Operations (Wildfire Response)**
   - Filters `bfp_operations` to `incident_type='wildfire'` only
   - Shows: Total wildfires, ongoing fires, extinguished fires
   - Recent incidents list with location, status, alarm level
   - If no data: "No wildfire incidents recorded"

   **Section 4: CDRRMO Operations**
   - Displays all El Niño-related operations from `cdrrmo_operations`
   - Operation types: dispatch, evacuation, relief
   - Recent operations list with type, location, status, personnel deployed
   - If no data: "No CDRRMO operations recorded"

   **Section 5: Agricultural Damages**
   - Displays crop/livestock damage from `agriculture_damage_reports`
   - Shows: Total area affected (hectares), estimated loss value (PHP)
   - Recent reports list with barangay, crop type, severity
   - If no data: "No agricultural damages reported"

   **Section 6: Utility Interruptions**
   - Combined view of water and power interruptions
   - Shows upcoming scheduled interruptions per barangay
   - Status: scheduled, ongoing, resolved/restored
   - If no data: "No scheduled interruptions"

4. User scrolls through all sections (collapsible cards)
5. User taps back arrow or bottom nav to return to Home

**Exit:** User navigates to another screen

---

### Journey 4: Citizen — View Map

**Goal:** Explore the interactive map and see facilities in the city

**Steps:**
1. User taps bottom nav "Maps" icon
2. `setActiveScreen("maps")`
3. MapScreen renders:
   - Mapbox map centered on Palayan City (default coordinates)
   - Default layers active: Citizen Reports, Hospitals, Fire Stations
4. User sees:
   - Report pins (colored by category) with clustering
   - Hospital markers (red cross icon)
   - Fire station markers (flame icon)
5. User taps layer control button (bottom-left)
6. LayerControls panel slides in with 11 toggles:
   - Citizen Reports ✓
   - Hospitals ✓
   - Fire Stations ✓
   - Evacuation Centers ☐
   - Water Facilities ☐
   - Power Feeders ☐
   - BFP Operations ☐
   - CDRRMO Operations ☐
   - Agricultural Damage Zones ☐
   - Weather Stations ☐
   - Barangay Boundaries ☐
7. User toggles "Evacuation Centers" on
8. Evacuation center markers appear (shelter icon)
9. User taps evacuation center marker → Popup shows:
   - Name: "Poblacion Covered Court"
   - Capacity: 500 families
   - Current Occupancy: 0 families
   - Status: Operational
10. User taps search bar (top)
11. SearchBar powered by Mapbox Geocoding API
12. User types "city hall"
13. Autocomplete suggestions appear
14. User selects "Palayan City Hall"
15. Map flies to City Hall location with marker
16. User taps report pin → MapPopupContent shows report details:
    - Title, category, description, photo, status
    - Upvote button (if authenticated)
    - "View Details" button → Opens DescriptionModal with full description

**Exit:** User navigates to another screen via bottom nav

---

### Journey 5: Admin — Login & Access Dashboard

**Goal:** Admin logs in to view citizen reports and department operations

**Steps:**
1. User navigates to `https://clima-app.com/admin` in browser
2. App.jsx detects `pathname === "/admin"`
3. System checks `isAdminAuthenticated` state:
   - If false → Renders `AdminLogin` screen
4. AdminLogin screen shows:
   - Email input
   - Password input
   - "Login" button
   - "Forgot Password?" link
5. Admin types email: admin@palayan.gov.ph
6. Admin types password: ••••••••
7. Admin clicks "Login"
8. System calls `supabase.auth.signInWithPassword({ email, password })`
9. Supabase returns session with user object
10. System checks user role:
    - SHA-256 hash of email compared against hardcoded superadmin hashes
    - OR `user.user_metadata.role === 'admin'`
11. If role valid:
    - `setIsAdminAuthenticated(true)`
    - `setUser(user)`
12. System checks `user.user_metadata.must_change_password`:
    - If true → Renders `ChangePasswordScreen` (first-time login)
    - Admin forced to change password before accessing dashboard
13. After password change (or if not required):
    - AdminDashboard renders
    - Sidebar navigation shows 12 tabs (filtered by module permissions)
    - Dashboard tab active by default (tab 0)
14. Dashboard tab shows:
    - KPI cards: Total Reports, Pending Reports, Ongoing Operations, Active Alerts
    - Weather sensor widget (KloudTech API integration) with live temperature, humidity, heat index
    - Recent reports table (last 10 reports)
    - Quick stats chart (reports per category)
15. Admin department accent color loaded from `departments.accent_color`
16. Sidebar styled with department color (e.g., CDRRMO = blue, BFP = red)

**Exit:** Admin navigates to another tab or logs out

---

### Journey 6: Admin — Record Disaster Data

**Goal:** CDRRMO admin records a dispatch operation to a fire incident

**Prerequisite:** Admin logged in with CDRRMO assigned category

**Steps:**
1. Admin on AdminDashboard (authenticated)
2. Admin clicks sidebar tab "CDRRMO Operations" (tab 4)
3. CDRRMO Operations tab renders:
   - Operations table with columns: Date, Type, Location, Status, Personnel, Actions
   - "+ Add Operation" button (top-right)
   - Filter dropdowns: Operation Type, Status, Date Range
4. Admin clicks "+ Add Operation"
5. Add Operation modal opens with form:
   - Operation Type dropdown: [Dispatch, Evacuation, Relief]
   - Incident Type input: "Fire response support"
   - Location input with autocomplete
   - Barangay dropdown (34 barangays)
   - Description textarea: "CDRRMO dispatch to assist BFP in structure fire"
   - Status dropdown: [Ongoing, Completed, Standby]
   - Personnel Deployed: 5
   - Vehicles Deployed: 2
   - Families Affected: 3
   - Start Time: datetime picker (defaults to now)
   - End Time: datetime picker (optional)
6. Admin fills all required fields
7. Admin clicks "Submit"
8. System calls `supabase.from('cdrrmo_operations').insert({ ... })`
9. RLS policy checks:
   - User has admin role AND `can_create` permission for `cdrrmo` module
   - If pass → Insert succeeds
10. Success toast: "Operation recorded successfully"
11. Modal closes
12. Operations table refreshes with new entry at top
13. Realtime subscription broadcasts update to other admin sessions
14. Citizen El Niño Dashboard updates immediately (if user has it open)

**Exit:** Admin navigates to another tab or logs out

---

### Journey 7: Admin — Manage Reports

**Goal:** Admin updates status of a citizen report from "pending" to "resolved"

**Steps:**
1. Admin on AdminDashboard → "Citizen Reports" tab (tab 1)
2. Reports table shows all reports (or filtered by assigned categories)
3. Table columns: ID, Date, Category, Title, Location, Status, Actions
4. Admin sees report: "Broken water pipe flooding street" (status: pending)
5. Admin clicks "View" button in Actions column
6. Report detail modal opens:
   - Full report details
   - Photo gallery (if photos attached)
   - Status update dropdown
   - Notes textarea
   - Map preview of location
7. Admin selects status dropdown → Options: Pending, In Progress, Resolved, Rejected
8. Admin selects "Resolved"
9. Admin types note: "Water district repaired the pipe on Jan 3, 2026"
10. Admin clicks "Update Status"
11. System calls `supabase.from('reports').update({ status: 'resolved', status_label: 'resolved' }).eq('id', reportId)`
12. RLS policy checks admin role and assigned categories
13. If report category in admin's assigned categories → Update succeeds
14. Success toast: "Report status updated"
15. Modal closes
16. Reports table refreshes, report now shows green "Resolved" badge
17. Audit log entry created automatically via trigger
18. Citizen who submitted report sees updated status on Map screen

**Exit:** Admin continues reviewing reports or navigates to another tab

---

### Journey 8: Superadmin — Manage Users

**Goal:** Superadmin creates a new admin user for Hospital department

**Steps:**
1. Superadmin on AdminDashboard → "Users" tab (tab 9)
2. Tab shows users table: Email, Name, Role, Department, Actions
3. Superadmin clicks "+ Add User" button
4. Add User modal opens with form:
   - Email input: hospital-admin@palayan.gov.ph
   - Full Name input: "Dr. Maria Santos"
   - Role dropdown: [User, Admin, Superadmin]
   - Assigned Department dropdown: [CDRRMO, BFP, Hospital, Agriculture, Water, Power, LGU]
   - Assigned Categories multi-select: [Shows categories filtered by selected department]
5. Superadmin fills:
   - Email: hospital-admin@palayan.gov.ph
   - Full Name: Dr. Maria Santos
   - Role: Admin
   - Department: Hospital
   - Categories: [Heat Stroke Cases, Medical Emergency]
6. Superadmin clicks "Create User"
7. Frontend calls Express server: POST `/api/admin/create`
8. Server.js:
   - Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
   - Calls `supabase.auth.admin.createUser({ email, password: tempPassword, email_confirm: true })`
   - Updates `auth.users.raw_user_meta_data.role`, `assigned_categories`, `assigned_department`
   - Inserts into `profiles` table
9. Server sends welcome email via Nodemailer with temp password
10. Success response returned to frontend
11. Success toast: "Admin user created. Welcome email sent."
12. Modal closes
13. Users table refreshes with new user
14. Activity log entry created
15. New admin receives email with temp password
16. New admin logs in → Forced to change password on first login

**Exit:** Superadmin continues user management or navigates to another tab

---

## Authentication Flow

### Citizen Authentication (Optional)

```
┌─────────────────────────────────────────────────────┐
│         User opens app (not authenticated)          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ App.jsx loads         │
         │ getSession() → null   │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ HomeScreen renders    │
         │ Guest mode active     │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌────────────────┐    ┌──────────────────┐
│ User browses   │    │ User taps        │
│ without login  │    │ Profile tab      │
└────────────────┘    └────────┬─────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │ ProfileScreen shows   │
                   │ AuthScreen (login UI) │
                   └───────────┬───────────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
                   ▼                       ▼
         ┌─────────────────┐   ┌─────────────────┐
         │ User signs up   │   │ User logs in    │
         │ (creates acct)  │   │ (existing acct) │
         └────────┬────────┘   └────────┬────────┘
                  │                     │
                  └──────────┬──────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │ supabase.auth.signUp()   │
              │ or signInWithPassword()  │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Session created          │
              │ onAuthStateChange fires  │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ App.jsx setUser(user)    │
              │ ProfileScreen re-renders │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ ProfileScreen shows:     │
              │ - My Reports             │
              │ - Customize Profile      │
              │ - Help & Support         │
              └──────────────────────────┘
```

---

### Admin Authentication (Required)

```
┌─────────────────────────────────────────────────────┐
│     Admin navigates to /admin (not authenticated)   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ App.jsx detects       │
         │ pathname === "/admin" │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ isAdminAuthenticated? │
         └───┬───────────────┬───┘
             │               │
          No │               │ Yes
             ▼               ▼
   ┌─────────────────┐   ┌────────────────────┐
   │ Render          │   │ Render             │
   │ AdminLogin      │   │ AdminDashboard     │
   └────────┬────────┘   └────────────────────┘
            │
            ▼
   ┌─────────────────┐
   │ Admin enters    │
   │ email/password  │
   └────────┬────────┘
            │
            ▼
   ┌─────────────────────────────┐
   │ signInWithPassword()        │
   └────────┬────────────────────┘
            │
            ▼
   ┌─────────────────────────────┐
   │ Verify role in user_metadata│
   └────┬────────────────────┬───┘
        │                    │
     Valid                Invalid
        │                    │
        ▼                    ▼
┌───────────────┐    ┌──────────────────┐
│ Check         │    │ Show error:      │
│ must_change_  │    │ "Not authorized" │
│ password flag │    └──────────────────┘
└───┬───────┬───┘
    │       │
 True      False
    │       │
    ▼       ▼
┌──────────┐ ┌─────────────────┐
│ Force    │ │ setIsAdmin      │
│ password │ │ Authenticated   │
│ change   │ │ (true)          │
└────┬─────┘ └────────┬────────┘
     │                │
     └────────┬───────┘
              │
              ▼
     ┌────────────────┐
     │ Render         │
     │ AdminDashboard │
     └────────────────┘
```

---

## Modal Flows

### ReportModal (4-Step Wizard)

**Trigger:** User taps "+ Report" floating button

**Steps:**
1. **Step 1: Category Picker**
   - Display: Grid of category icons
   - Input: User taps category
   - Validation: Category required
   - Next: Store category, advance to step 2

2. **Step 2: Details Form**
   - Display: Description textarea, photo upload button, guest name input (if not logged in)
   - Input: User types description, uploads photos, enters name
   - Validation: Description min 10 chars, photos optional (max 3, max 1MB each)
   - Processing: Compress photos, watermark with filename
   - Next: Store details, advance to step 3

3. **Step 3: Map Picker**
   - Display: Mapbox map with center pin, drag instruction
   - Input: User drags map to select location
   - Processing: On drag end, reverse geocode to get address
   - Validation: Location required (lat/lng)
   - Next: Submit report to database

4. **Step 4: Success**
   - Display: Success icon, tracking ID, close button
   - Action: Insert report into `reports` table
   - Next: Close modal, return to previous screen

**Exit:** User closes modal (close button or backdrop click)

---

### Admin Report Detail Modal

**Trigger:** Admin clicks "View" in Citizen Reports table

**Display:**
- Report header (title, category, date)
- Photo gallery (if photos attached, lightbox on click)
- Full description
- Location map preview
- Status update section:
  - Current status badge
  - Status dropdown (Pending, In Progress, Resolved, Rejected)
  - Notes textarea
  - "Update Status" button
- Close button (X in top-right)

**Actions:**
1. Admin selects new status from dropdown
2. Admin types notes (optional)
3. Admin clicks "Update Status"
4. System updates `reports` table
5. Success toast, modal closes
6. Table refreshes

**Exit:** Close button or backdrop click

---

### Admin Add Operation Modal (CDRRMO/BFP/Hospital/Agriculture)

**Trigger:** Admin clicks "+ Add [Operation Type]" in respective tab

**Display (varies by module):**
- Form fields specific to operation type
- Required fields marked with *
- Submit button (disabled until validation passes)
- Cancel button

**Example: CDRRMO Add Operation**
- Operation Type* dropdown
- Incident Type* input
- Location* input with autocomplete
- Barangay* dropdown
- Description* textarea
- Status* dropdown
- Personnel Deployed* number input
- Vehicles Deployed* number input
- Families Affected number input
- Start Time* datetime picker
- End Time datetime picker
- Submit button

**Actions:**
1. Admin fills form
2. Client-side validation (required fields, min values)
3. Admin clicks "Submit"
4. System inserts into `[module]_operations` table
5. Success toast, modal closes
6. Table refreshes with new entry

**Exit:** Cancel button or backdrop click (confirmation if form dirty)

---

## Real-time Data Flow

### Supabase Realtime Subscriptions

**Enabled Tables:**
- `reports`
- `advisories`
- `hospital_daily_records`
- `cdrrmo_operations`
- `bfp_operations`
- `agriculture_damage_reports`
- `water_interruptions`
- `power_interruptions`

**How it Works:**
1. Component subscribes on mount:
   ```javascript
   useEffect(() => {
     const subscription = supabase
       .channel('reports-changes')
       .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'reports' },
         handleReportChange
       )
       .subscribe();
     return () => subscription.unsubscribe();
   }, []);
   ```

2. When data changes in database:
   - Supabase broadcasts event via WebSocket
   - All subscribed clients receive update
   - Component re-fetches data or updates local state

3. Use Cases:
   - Admin submits report status update → Other admins see update instantly
   - Hospital admin enters daily cases → El Niño dashboard updates for citizens
   - CDRRMO admin creates operation → Admin map updates with new operation marker

---

## Error Flows

### Network Errors

**Scenario:** User submits report, but network is offline

**Flow:**
1. User completes ReportModal Step 3, taps Submit
2. `supabase.from('reports').insert()` fails with network error
3. Catch block triggers:
   ```javascript
   catch (error) {
     toast.error("Failed to submit report. Check your connection.");
     console.error(error);
   }
   ```
4. Error toast displayed: "Failed to submit report. Check your connection."
5. User remains on Step 3 (can retry)
6. If user closes modal, report data lost (no local queue)

**Improvement Needed:** Offline queue for report submissions

---

### Auth Failures

**Scenario:** Admin session expires while using dashboard

**Flow:**
1. Admin on AdminDashboard, session expires after 1 hour (Supabase default)
2. Admin tries to update report status
3. `supabase.from('reports').update()` fails with 401 Unauthorized
4. `onAuthStateChange` listener fires with `event: 'SIGNED_OUT'`
5. App.jsx sets `isAdminAuthenticated = false`
6. AdminDashboard unmounts, AdminLogin renders
7. Error toast: "Session expired. Please log in again."
8. Admin re-enters credentials
9. After login, redirected to dashboard (previous state lost)

**Improvement Needed:** Automatic token refresh, session persistence

---

### Permission Denied

**Scenario:** Admin tries to access module without permission

**Flow:**
1. Admin logs in with role='admin', assigned_categories=['Hospital Cases']
2. Admin clicks "BFP Operations" tab in sidebar
3. `hasPermission('bfp', 'view')` returns false
4. Tab content shows:
   ```
   🔒 Access Denied
   You don't have permission to view this module.
   Contact your administrator to request access.
   ```
5. Admin cannot see tab content, no data loaded

**Prevention:** Sidebar only shows tabs for which `hasPermission(module, 'view')` returns true

---

### Database RLS Policy Violation

**Scenario:** Admin tries to edit report outside assigned category

**Flow:**
1. Admin logged in with assigned_categories=['Water Issues']
2. Admin navigates to Citizen Reports tab
3. Table shows all reports (client-side, no RLS yet)
4. Admin clicks "View" on report with category='Fire Incident'
5. Admin changes status to "Resolved"
6. System calls `supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)`
7. RLS policy evaluates:
   - User role is 'admin' ✓
   - Report category='Fire Incident'
   - Admin assigned_categories=['Water Issues']
   - 'Fire Incident' NOT IN ['Water Issues'] ✗
8. Update denied by database
9. Supabase returns error: "new row violates row-level security policy"
10. Catch block triggers: `toast.error("You don't have permission to edit this report")`
11. Modal remains open, status not updated

**Prevention:** Client-side filter reports by assigned categories before displaying

---

## Browser Navigation

### Back/Forward Behavior

**Implementation (App.jsx lines 86-100):**
```javascript
useEffect(() => {
  const handlePopState = (event) => {
    if (window.location.pathname === '/admin') {
      setActiveScreen('admin');
    } else {
      setActiveScreen('home');
    }
  };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);
```

**Behavior:**
- Browser back/forward buttons work within single-page app
- URL changes between `/` (citizen screens) and `/admin` (admin screens)
- `activeScreen` state syncs with URL
- Within citizen screens, back button returns to "home"
- Modal states not tracked in history (modals close on back button)

---

## Document Version

**Version:** 1.0  
**Generated:** January 4, 2026  
**Based on:** ANALYSIS.md (CLIMA System Comprehensive Code Analysis)

---

**END OF APPLICATION FLOW DOCUMENT**
