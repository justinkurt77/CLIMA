# CLIMA / PalaSumbong — Comprehensive System Analysis

> **Project:** CLIMA (Climate & Local Incident Management Application) / PalaSumbong  
> **Stack:** React 19 + Vite · Supabase (PostgreSQL + Auth + Realtime) · Mapbox GL · Framer Motion  
> **Scope:** Multi-agency disaster response, public incident reporting, agriculture monitoring, and utility management for Palayan City  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Flow — Start to End](#2-system-flow--start-to-end)
   - 2A. [End-User (Citizen & Farmer) Flow](#2a-end-user-citizen--farmer-flow)
   - 2B. [Agency Admin Flow](#2b-agency-admin-flow)
   - 2C. [Superadmin Flow](#2c-superadmin-flow)
3. [Data Flow — Global Architecture](#3-data-flow--global-architecture)
4. [Per-Module Analysis](#4-per-module-analysis)
   - 4.1 [Client Page (Citizen-Facing App)](#41-client-page-citizen-facing-app)
   - 4.2 [Admin Dashboard](#42-admin-dashboard)
   - 4.3 [Reports Module](#43-reports-module)
   - 4.4 [Advisory Module](#44-advisory-module)
   - 4.5 [Hospital Module](#45-hospital-module)
   - 4.6 [CDRRMO Module](#46-cdrrmo-module)
   - 4.7 [BFP Module](#47-bfp-module)
   - 4.8 [Water Module](#48-water-module)
   - 4.9 [Power Module](#49-power-module)
   - 4.10 [Agriculture Module (City Agriculture Office - CAO)](#410-agriculture-module-city-agriculture-office---cao)
   - 4.11 [User Permission Module](#411-user-permission-module)
   - 4.12 [Settings Module](#412-settings-module)
   - 4.13 [Logs Module](#413-logs-module)
5. [Use Case Diagrams](#5-use-case-diagrams)
   - 5.1 [End-User Use Cases](#51-end-user-use-cases)
   - 5.2 [Admin Use Cases](#52-admin-use-cases)
   - 5.3 [Superadmin Use Cases](#53-superadmin-use-cases)
6. [Role Comparison Matrix](#6-role-comparison-matrix)
7. [Security Model](#7-security-model)

---

## 1. System Overview

CLIMA is a **Progressive Web App (PWA)** serving two distinct user groups:

| Layer | Users | Entry Point |
|-------|-------|-------------|
| **Citizen Portal** | End-users / General public / Farmers | `/` (root) |
| **Admin Console** | Agency Admins / Superadmin | `/admin` |

The system integrates **10 key government agencies and municipal utilities** through a unified Supabase backend with Row Level Security (RLS), real-time subscriptions, and a role-based access control (RBAC) model across 3 tiers:
1. **CDRRMO** — City Disaster Risk Reduction & Management Office
2. **BFP** — Bureau of Fire Protection
3. **CHO / Hospitals** — City Health Office & Emergency Facilities
4. **City Agriculture Office (CAO)** — Farmers assistance, crop monitoring, calamity damage assessment
5. **Water District** — Pumping stations, supply networks & interruptions
6. **Electric Cooperative / Power Utility** — Feeder lines, grid outages & restorations
7. **PNP** — Philippine National Police (Emergency Hotlines & Security)
8. **CPDO / Engineering** — Infrastructure & Public Works
9. **City Administration / Superadmin** — Central command, user RBAC & system governance
10. **General Public / Citizens** — Field reporting, public advisory consumers & hotline users

---

## 2. System Flow — Start to End

### 2A. End-User (Citizen & Farmer) Flow

```mermaid
flowchart TD
    A(["🌐 User Opens App"]) --> B{"Has Session?"}
    B -- "No" --> C["Guest Mode<br/>Browse Map, Weather & Advisories"]
    B -- "Yes" --> D["Authenticated Citizen / Farmer"]

    C --> E["HomeScreen<br/>Weather · Map · Reports Feed · Agri Advisories"]
    D --> E

    E --> F{"User Action"}
    F --> G["📍 View Community Map<br/>MapScreen - Incidents, Farms, Utilities"]
    F --> H["📋 Attempt Submit Report<br/>Click 'Submit Report' Button"]
    F --> I["🔔 Read Official Advisories<br/>Weather, Health, Agri & Drought Warnings"]
    F --> J["🚨 Emergency Hotlines<br/>EmergencyScreen - CDRRMO, BFP, CAO, PNP"]
    F --> K["👤 Profile & My Reports<br/>ProfileScreen / MyReportsScreen"]
    F --> L["🔐 Login / Register<br/>AuthScreen - OTP verified"]

    H --> CHK{"Has Account /<br/>Logged In?"}
    CHK -- "No" --> BLK["🚫 Cannot Submit Without Account<br/>Prompt: Must Register to Report"]
    BLK --> REG["📝 Create Account / Sign In<br/>AuthScreen - OTP verification"]
    REG --> D
    CHK -- "Yes" --> MODAL["📋 Open ReportModal<br/>Disaster, Infra, Crop or Pest"]
    REG -.->|"After Account Created"| MODAL

    MODAL --> M["📸 Attach Photo<br/>GPS Location Auto-detected"]
    M --> N["Select Category<br/>Flooding, Fire, Crop Damage, Pest Outbreak"]
    N --> O["Submit to Supabase<br/>reports table"]
    O --> P["Target Department Notified<br/>Appears in Admin Dashboard"]
    P --> Q["Admin Updates Status<br/>pending → in-progress → resolved"]
    Q --> R["Citizen Sees Live Update<br/>Real-time Supabase subscription"]
```

### 2B. Agency Admin Flow

```mermaid
flowchart TD
    A["🔐 Open /admin Portal"] --> B{"Session Exists?"}
    B -- "No" --> C["AdminLogin Screen
Enter Email & Password"]
    C --> D{"Check User Metadata
user_metadata.role = admin"}

    B -- "Yes" --> E["Agency Admin Dashboard
Scoped to Assigned Department"]
    D -- "Verified" --> E

    E --> F["9 Scoped Tabs Visible
Overview · Reports · Advisories · Dept Operations
(CDRRMO, BFP, CAO, Water, Power, or Hospital)"]

    F --> G{"Select Admin Action"}
    G --> H["Manage Citizen Reports
Filter by Assigned Department
Update: Pending → In-Progress → Resolved"]
    G --> I["Log Department Operations
Dispatches · Evacuation · Hydrants
Crops & Damage Claims · Outages"]
    G --> J["Create Public Advisory
Draft & Submit for Superadmin Approval"]
    G --> K["Admin GIS Map View
Track Department Resources & Pin Locations"]
    G --> L["Generate Reports
Export Department PDF & CSV Summaries"]
```

### 2C. Superadmin Flow

```mermaid
flowchart TD
    A["👑 Open /admin Portal"] --> B{"Session Exists?"}
    B -- "No" --> C["AdminLogin Screen
Enter Email & Password"]
    C --> D{"Cryptographic Verification
SHA-256 Email Hash Match"}

    B -- "Yes" --> E["Superadmin Central Command
Full Unrestricted Citywide Access"]
    D -- "Verified" --> E

    E --> F["All 12 Modules Visible
Reports · Advisories · Hospitals · CDRRMO · BFP
Water · Power · Agriculture · Users · Settings · Logs · Map"]

    F --> G{"Select Superadmin Action"}
    G --> H["Review & Approve Advisories
Final Citywide Broadcast to Citizens"]
    G --> I["User & RBAC Management
Create Admins · Assign Depts · Permissions"]
    G --> J["Inter-Agency Cascade Center
Monitor Cross-Utility Alerts & Hospital Power"]
    G --> K["System Settings
Manage Departments · Categories · Accent Colors"]
    G --> L["Activity & Audit Logs
Inspect Full Database Modification History"]
    G --> M["Citywide Executive Overview
All-Agency Incident Metrics & Master Reports"]
```

---

## 3. Data Flow — Global Architecture

```mermaid
flowchart LR
    subgraph CLIENT["Client Layer (React 19 + Vite)"]
        direction TB
        CS["CitizenNav / HomeScreen"]
        AD["AdminDashboard.jsx"]
        AM["AdminMapScreen.jsx"]
    end

    subgraph SUPABASE["Supabase Backend"]
        direction TB
        AUTH["Auth Service<br/>JWT + Session"]
        DB[("PostgreSQL DB<br/>RLS Enforced")]
        RT["Realtime<br/>Subscriptions"]
        ST["Storage<br/>Photo Uploads"]
    end

    subgraph EXTERNAL["External APIs"]
        MB["Mapbox GL<br/>Map Tiles + Geocoding"]
        WX["Open-Meteo API<br/>Weather + Heat Index + Agri Rain"]
        FB["Facebook Graph API<br/>Webhook Monitoring"]
    end

    CS -->|"Auth requests"| AUTH
    AD -->|"RPC calls + CRUD"| DB
    AM -->|"Spatial GIS data"| DB
    AUTH -->|"JWT Token"| DB
    DB -->|"Row-level data"| AD
    RT -->|"Report updates, Advisories, Agri alerts"| CS
    CS -->|"Photo upload"| ST
    CS <-->|"Map render"| MB
    CS <-->|"Weather fetch"| WX
    FB -->|"Incoming posts"| DB
```

### Core Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `reports` | Citizen incident & damage reports | `id, category, status, lat, lng, user_id, department_id, images` |
| `departments` | Government agencies / offices | `id, name, code, accent_color, icon` |
| `categories` | Report categories per department | `id, name, group_name, department_id` |
| `advisories` | Official public bulletins & alerts | `id, title, content, status, department_id, scheduled_at, published_at` |
| `hospital_daily_reports` | Hospital capacity & health metrics | `id, hospital_id, date, available_beds, heat_cases` |
| `cdrrmo_dispatches` | Emergency response dispatch logs | `id, incident_type, status, team_deployed, destination` |
| `cdrrmo_evacuation_centers` | Evacuation center capacities | `id, name, capacity, current_occupants, status` |
| `bfp_stations` | Fire stations and response units | `id, name, trucks_available, personnel, status` |
| `bfp_hydrants` | Fire hydrant spatial infrastructure | `id, location, status, pressure_psi, last_inspected` |
| `water_facilities` | Pumping stations & reservoirs | `id, name, type, status, capacity_m3` |
| `water_interruptions` | Water service outage tracking | `id, area, start_time, end_time, reason, advisory_id` |
| `power_feeders` | Electrical distribution lines | `id, name, status, barangays_served, load_capacity` |
| `power_interruptions` | Scheduled & emergency power outages | `id, feeder_id, start_time, estimated_restoration, reason` |
| `agri_crop_monitoring` | Crop health, plantings & harvest data | `id, barangay, crop_type, area_hectares, stage, expected_yield` |
| `agri_damage_reports` | Calamity agricultural loss assessments | `id, report_id, farmer_name, crop_type, damage_hectares, estimated_loss, status` |
| `agri_facilities` | Solar dryers, warehouses & irrigation | `id, name, facility_type, barangay, capacity, operational_status` |
| `audit_logs` | Immutable audit trail of DB actions | `id, table_name, action, old_data, new_data, actor_id, created_at` |
| `notifications` | System & citizen notifications | `id, user_id, title, message, type, is_read` |
| `conflict_alerts` | Inter-agency cascade & conflict flags | `id, alert_type, severity, affected_agencies, status` |
| `inter_agency_notifications` | Cross-department operational memos | `id, from_dept, to_dept, subject, priority, message` |

---

## 4. Per-Module Analysis

---

### 4.1 Client Page (Citizen-Facing App)

**Entry Point:** `/` → `HomeScreen.jsx`  
**Navigation:** `CitizenNav.jsx` — bottom floating mobile tab bar

#### Screens Available

| Screen | Component | Access | Purpose |
|--------|-----------|--------|---------|
| Home / Dashboard | `HomeScreen.jsx` | Public | Live weather, advisories, quick report launcher, incident feed |
| Community Map | `MapScreen.jsx` | Public | Interactive Mapbox with 12 toggleable GIS layers (Incidents, Hospitals, Evacuation, Hydrants, Farms/Dryers, Utilities) |
| Emergency Hotlines | `EmergencyScreen.jsx` | Public | One-touch calling for CDRRMO, BFP, CAO, Hospitals, Police |
| My Reports | `MyReportsScreen.jsx` | Authenticated | Track submitted reports, review field updates and photos |
| Profile | `ProfileScreen.jsx` | Authenticated | Manage citizen info, barangay address, contact number |
| Login / Register | `AuthScreen.jsx` | Guests only | Phone/Email OTP authentication and password recovery |

#### Module Navigation (Bottom Tab Bar)

```mermaid
graph LR
    NAV["Citizen Navigation"] --> HM["Home Dashboard"]
    NAV --> MAP["Community Map"]
    NAV --> HOT["Emergency Hotlines"]
    NAV --> REP["Report Incident (Modal)"]
    NAV --> MYR["My Reports (History)"]
    NAV --> PROF["Profile & Settings"]
```

#### User Access Levels (Guest vs. Authenticated Citizen)

```mermaid
flowchart TD
    OPEN["Open Citizen App"] --> AUTH{"Is User Logged In?"}
    AUTH -- "Yes" --> USER["Full Citizen & Farmer Access
Track Reports · Receive Live Updates · Profile"]
    AUTH -- "No" --> GUEST["Public Guest Mode
Browse Map · View Weather & Advisories · Call Hotlines"]
```

#### Simple Incident Reporting Flow

```mermaid
flowchart LR
    S0["1. Account Check<br/>(Login/Register if Guest)"] --> S1["2. Open Report Modal"]
    S1 --> S2["3. Take Photo & Auto-GPS"]
    S2 --> S3["4. Select Category"]
    S3 --> S4["5. Submit to City Responders"]
    S4 --> S5["6. Track Live Status Updates"]
```

#### Citizen Features
- 🌤️ **Live Weather & Heat Index** — Real-time Open-Meteo data with heat danger flags and agricultural rain forecast.
- 🗺️ **Comprehensive GIS Map** — Layered spatial visualization of incidents, fire hydrants, evacuation centers, agricultural facilities, and utility outages.
- 🌾 **Agricultural & Weather Alerts** — Instant awareness of heavy downpours, drought advisories, pest outbreaks, and typhoon signals.
- 📋 **Multipurpose Incident Reporting** — Citizen reporting for general emergencies, power/water outages, road blockages, and agricultural calamity damages.
- 🚨 **Emergency Directory** — Fast click-to-call dialing to local CDRRMO, BFP, City Agri, and hospitals.

---

### 4.2 Admin Dashboard

**Entry Point:** `/admin` → `AdminDashboard.jsx`  
**Auth Gate:** `AdminLogin.jsx` → SHA-256 email hash check (Superadmin) + `user_metadata.role` (Agency Admin)

#### Module Navigation — Agency Admin Dashboard (9 Scoped Tabs)

```mermaid
graph LR
    SIDEBAR["Agency Admin Sidebar"] --> OV["Overview: Dept KPIs & Daily Summary"]
    SIDEBAR --> CR["Reports: Dept-Scoped Citizen Incident Tickets"]
    SIDEBAR --> ADV["Advisories: Draft & Submit Bulletins"]
    SIDEBAR --> HOSP["Hospitals: Bed Census & Heat Stroke Tracking"]
    SIDEBAR --> OPS["CDRRMO: Dispatches & Evacuation Shelters"]
    SIDEBAR --> BFP["BFP: Truck Readiness & Hydrant Network"]
    SIDEBAR --> WAT["Water: Pumping Stations & Service Interruptions"]
    SIDEBAR --> PWR["Power: Feeder Lines & Outage ETAs"]
    SIDEBAR --> AGR["🌾 Agriculture: Crop Stages & Calamity Loss Claims"]
    SIDEBAR --> MAP["Map View: Dept Resources & Spatial Incident Pins"]
```

#### Module Navigation — Superadmin Dashboard (All 12 Modules)

```mermaid
graph LR
    SIDEBAR["Superadmin Sidebar"] --> OV["Overview: Citywide Master Incident Statistics"]
    SIDEBAR --> CR["Reports: All 10 Departments Full Incident Control"]
    SIDEBAR --> ADV["Advisories: Approval Gate & Broadcast Publishing"]
    SIDEBAR --> HOSP["Hospitals: All Facilities & Cascade Warnings"]
    SIDEBAR --> OPS["CDRRMO: Rescue Assets & Citywide Evacuations"]
    SIDEBAR --> BFP["BFP: Citywide Fire Units & Hydrant Infrastructure"]
    SIDEBAR --> WAT["Water: Full Municipal Pumping Network"]
    SIDEBAR --> PWR["Power: Grid Feeders & Blackout Cascade Center"]
    SIDEBAR --> AGR["🌾 Agriculture: Citywide Crops, Claims & Facilities"]
    SIDEBAR --> USR["Users (Exclusive): Admin Accounts & RBAC Roles"]
    SIDEBAR --> SET["Settings (Exclusive): Departments & Brand Colors"]
    SIDEBAR --> LOG["Logs (Exclusive): Immutable Database Audit Ledger"]
    SIDEBAR --> MAP["Map View: Master Command GIS Spatial Layers"]
```

#### Role-Based Access Control — Agency Admin

```mermaid
flowchart TD
    OPEN["Open /admin Portal"] --> AUTH{"Verify Role: Agency Admin"}
    AUTH -- "Verified (admin)" --> AA["Agency Admin Access Level
Scoped Strictly to Assigned Office (9 Tabs):
• Manage Own Department's Citizen Reports
• Log Field Operations (Dispatches, Hydrants, Crops, Outages)
• Draft Public Advisories (Pending Superadmin Approval)
• View Department GIS Map Layers
• Export Department PDF & CSV Summaries
(No access to Users, Settings, or Audit Logs)"]
    AUTH -- "Invalid" --> REJ["❌ Access Denied
Redirect to Citizen Portal"]
```

#### Role-Based Access Control — Superadmin

```mermaid
flowchart TD
    OPEN["Open /admin Portal"] --> AUTH{"Verify Role: Superadmin"}
    AUTH -- "Verified (SHA-256 Match)" --> SA["Superadmin Access Level
Full Unrestricted Citywide Command (All 12 Tabs):
• All Agency Admin Capabilities Across ALL Depts
• Public Advisory Approval & Citywide Publishing Gate
• User & RBAC Management (Create Admins & Assign Roles)
• System Settings (Departments, Categories, Accent Colors)
• Immutable Activity & Audit Logs
• Inter-Agency Conflict & Cascade Intelligence
• Executive Citywide Master Analytics & Data Export"]
    AUTH -- "Invalid" --> REJ["❌ Access Denied
Redirect to Citizen Portal"]
```

#### Data Flow — Admin Dashboard

```mermaid
sequenceDiagram
    participant A as Admin
    participant DASH as AdminDashboard
    participant SB as Supabase

    A->>DASH: Submit login credentials
    DASH->>SB: signInWithPassword()
    SB-->>DASH: Authenticated Session + JWT
    DASH->>DASH: Verify role and department assignment
    DASH->>SB: Query departments, categories, active metrics
    SB-->>DASH: Initial dashboard metrics

    A->>DASH: Select Navigation Tab (e.g., Agriculture)
    DASH->>SB: Query tab-specific operational tables
    SB-->>DASH: Return filtered rows
    DASH-->>A: Render Active Module View
```

---

### 4.3 Reports Module

#### Incident Reporting & Resolution Process

```mermaid
flowchart TD
    C1["Click 'Report Incident'"] --> C2{"Has Account?"}
    C2 -- "No" --> C2A["Sign In / Create Account"]
    C2A --> C3["Select Category<br/>(Flood, Fire, Crop Damage etc.)"]
    C2 -- "Yes" --> C3
    C3 --> C4["Add Description & Attach Photos"]
    C4 --> C5["Set Location (GPS or Map Pin)"]
    C5 --> C6["Submit Incident Report"]
    C6 --> A1["Department Receives Incident Alert"]
    A1 --> A2["Review Details, Photos & Map Pin"]
    A2 --> A3{"Assess Report"}
    A3 -- "Valid" --> A4["Dispatch Responders (In Progress)"]
    A3 -- "Invalid" --> A5["Reject (Duplicate / False Alarm)"]
    A4 --> A6["Field Team Resolves Emergency"]
    A6 --> A7["Close Incident (Resolved)"]
```

#### Process Overview (Presentation Summary)

1. **Citizen Submission:**
   - **Access:** Citizen logs in and taps "Report Incident".
   - **Details:** Selects category (e.g., flooding, fire, crop loss), writes description, and attaches photos.
   - **Location:** Auto-detects GPS coordinates or places an exact pin on the map.
   - **Submit:** Sends report directly to the city emergency command center.

2. **Department Response & Dispatch:**
   - **Alert:** The designated city agency (CDRRMO, BFP, City Agri, etc.) receives the ticket instantly.
   - **Verification:** Responders review photo proof and spatial map location.
   - **Dispatch:** Status changes to **In Progress** as field personnel are deployed.

3. **Resolution & Live Tracking:**
   - **On-Site Action:** Responders address the situation on the ground.
   - **Closure:** Once confirmed resolved, the ticket is marked **Resolved**.
   - **Live Citizen Update:** The reporting citizen sees real-time status and resolution notes directly in their app.

---

### 4.4 Advisory Module

#### Advisory Creation & Approval Process

```mermaid
flowchart TD
    A1["Click 'Create Advisory'"] --> A2["Select Category<br/>(Weather, Calamity, Outage, Health, Agri)"]
    A2 --> A3["Draft Bulletin Content<br/>(Title, Description & Severity Level)"]
    A3 --> A4["Set Target Area (Barangays)<br/>& Schedule Time"]
    A4 --> A5["Submit for Superadmin Approval<br/>(Status: PendingReview)"]
    A5 --> S1["Superadmin Receives Advisory Alert"]
    S1 --> S2["Review Details, Severity & Coordination"]
    S2 --> S3{"Assess Advisory"}

    S3 -- "Valid / Approved" --> P1["Superadmin Approves & Broadcasts<br/>(Status: Published)"]
    S3 -- "Invalid / Rejected" --> R1["Reject with Comments<br/>(Status: Rejected)"]
    R1 --> R2["Agency Admin Re-edits Draft"]
    R2 --> A5

    P1 --> P2["Supabase Realtime Pushes Alert Citywide"]
    P2 --> P3["End-Users (Citizens & Farmers) can now<br/>VIEW Official Advisory on App & Map"]

    P3 --> S4{"Advisory Action / Lifecycle"}
    S4 -- "Temporary Take Down" --> U1["Unpublish Bulletin<br/>(Status: Unpublished - Hidden from Citizens)"]
    U1 -->|"Re-published"| P1
    S4 -- "Event Resolved / Expired" --> AR1["Archive Advisory<br/>(Status: Archived - Permanent Record)"]
```

#### Process Overview (Presentation Summary)

1. **Agency Admin Drafting:**
   - **Creation:** Designated department admin (CDRRMO, BFP, CAO, Water, Power, Health) drafts an official public bulletin.
   - **Targeting & Scheduling:** Specifies advisory type (calamity, crop pest alert, water/power outage, health advisory), severity level, and optional scheduled broadcast time (`scheduled_at`).
   - **Submission:** Submits bulletin to the city command queue, moving state to **Pending Review**.

2. **Superadmin Review & Approval Gate:**
   - **Central Quality Control:** Superadmin evaluates bulletin accuracy, tone, and inter-agency coordination before public release.
   - **Approval & Broadcast:** Upon approval, the advisory is published citywide and timestamped (`published_at`).
   - **Rejection Loop:** If amendments are required, the advisory is rejected with explanatory notes and returned to **Draft** for revision and resubmission.

3. **Live Citizen Broadcast:**
   - **Instant Push Notification:** Supabase Realtime broadcasts the advisory immediately across all citizen devices.
   - **Multi-Screen Visibility:** Highlighted as top-level danger banners and cards on citizen `HomeScreen`, map overlays, and SMS/push feeds.
   - **Takedown Flexibility:** Admins can temporarily transition bulletins to **Unpublished** for rapid corrections, and toggle back to **Published** instantly.

4. **Resolution & Archival:**
   - **Closure:** Once the calamity resolves or the scheduled validity lapses, the bulletin transitions to **Archived**.
   - **Historical Audit:** Archived advisories are permanently stored for incident post-mortems and compliance reporting.

---

### 4.5 Hospital Module

#### Hospital Daily Census & Health Impact Flow

```mermaid
flowchart TD
    H1["Hospital Staff Opens Hospital Module<br/>(Palayan City Hospital)"] --> H2["Select Date & Enter Daily Record<br/>(Admissions, Heat Stroke, Dehydration, Respiratory)"]
    H2 --> H3{"Does Record Exist<br/>for Selected Date?"}

    H3 -- "Yes (Duplicate Date)" --> H4["Prompt: 'Record Already Exists'<br/>(Option to Update Existing Data)"]
    H4 --> H5["Update Existing Daily Record<br/>(Date Locked, Values Modified)"]
    H3 -- "No (New Date)" --> H6["Save New Daily Record<br/>(Insert to Database)"]

    H5 --> H7["System Computes Health Impact<br/>(Heat & El Niño Case Percentage)"]
    H6 --> H7

    H7 --> H8{"Assess Surge & Bed Capacity"}
    H8 -- "Critical / High Impact (>50%)" --> H9["Trigger Cascade Alert to Superadmin & CDRRMO<br/>(Deploy Medical Aid / Issue Health Advisory)"]
    H8 -- "Normal / Low Impact (<50%)" --> H10["Log Routine Census & Update Analytics Charts"]

    H9 --> H11["End-Users (Citizens & Patients) can VIEW<br/>Hospital Emergency Status & Health Advisories on App"]
    H10 --> H11
```

#### Process Overview (Presentation Summary)

1. **Daily Intake & Data Entry:**
   - **Access:** Hospital Staff / CHO Admin logs into the admin portal and navigates to the Hospital Module.
   - **Data Capture:** Enters daily total admissions alongside extreme weather health metrics (Heat Stroke, Heat Exhaustion, Dehydration, and Respiratory distress).
   - **Date Validation:** System blocks future dates to ensure genuine chronological reporting.

2. **Smart Duplicate Date Prevention:**
   - **Verification:** Automatically checks if a daily log already exists for the selected date.
   - **Friendly Update Flow:** If a duplicate is detected, rather than throwing an error, prompts the user with an *"Update Record"* option with date locking to protect historical logs.

3. **Automated Impact Analysis & Surge Triggers:**
   - **Impact Calculation:** Computes the percentage of admissions caused by environmental and heat factors.
   - **Inter-Agency Cascade:** When heat-related admissions spike or bed occupancy crosses critical thresholds, automatic surge alerts are sent to the City Disaster Office (CDRRMO) and Superadmin for medical emergency dispatch or drafting public health advisories.

4. **Public & Administrative Visibility:**
   - **Administrative Dashboard:** Recharts render 30-day historical admission trends and El Niño impact levels.
   - **Citizen View:** The general public and patients can view active hospital operational status and live health advisories on the citizen app.

---

### 4.6 CDRRMO Module

#### CDRRMO Disaster Operations & Ambulance Rescue Flow

```mermaid
flowchart TD
    C1["CDRRMO Admin Opens Operations Tab<br/>(Palayan City Disaster Office)"] --> C2["Select Date & Enter Operations & Rescue Log<br/>(Ambulance Dispatches, Medical Rescues, Evacuations, Relief)"]
    C2 --> C3{"Does Record Exist<br/>for Selected Date?"}

    C3 -- "Yes" --> C4["Prompt: 'Record Already Exists'<br/>(Option to Update Existing Data)"]
    C4 --> C5["Update Existing Operations Record<br/>(Date Locked, Values Modified)"]
    C3 -- "No" --> C6["Save New Operations Record<br/>(Insert to Database)"]

    C5 --> C7["System Aggregates 7-Day Rescue Runs,<br/>Ambulance Dispatches & Shelter Headcounts"]
    C6 --> C7

    C7 --> C8{"Disaster Surge or Critical Ambulance Demand?"}
    C8 -- "Yes" --> C9["Trigger Cascade Coordination to Hospitals & BFP<br/>(Deploy Backup Ambulances, Rescue Units & Open Shelters)"]
    C8 -- "No" --> C10["Log Routine Rescue Operations & Update Analytics Charts"]

    C9 --> C11["End-Users (Citizens & Patients) can VIEW<br/>Live Evacuation Centers, Safe Zones & Emergency Hotlines"]
    C10 --> C11
```

#### Process Overview (Presentation Summary)

1. **Operational Intake & Rescue Logging:**
   - **Access:** CDRRMO Officer logs into the admin portal and accesses the Operations Tab.
   - **Data Capture:** Enters daily emergency operations, specifically **Ambulance Dispatches, Field Medical Rescues**, relief goods distribution, family assistance, and evacuation shelter headcounts.
   - **Date Validation:** Blocks future date entries to maintain an accurate chronological rescue record.

2. **Smart Duplicate Date Handling:**
   - **Integrity Verification:** System checks if a daily operations log has already been submitted for the chosen date.
   - **Non-Destructive Update:** If duplicate exists, displays a clear modal allowing staff to update the day's record with date-locking enabled to protect chronological archives.

3. **Multi-Agency Escalation & Hospital Linkage:**
   - **Emergency Medical Synergy:** CDRRMO ambulance dispatches link directly with the City Health Office / Palayan City Hospital for coordinated emergency room triage.
   - **Cascade Mobilization:** If ambulance calls spike or a massive disaster occurs, alerts trigger automatically to Superadmin and BFP for joint emergency rescue teams and shelter opening.

4. **Public Evacuation & Emergency Accessibility:**
   - **Administrative Dashboard:** Displays 7-day rolling totals for ambulance runs, rescue dispatches, and relief goods.
   - **Citizen View:** Citizens and affected families can view real-time open evacuation centers, safe routes, and one-touch CDRRMO ambulance hotlines directly on the app.

---

### 4.7 BFP Module

#### BFP Fire Operations & Water Readiness Flow

```mermaid
flowchart TD
    B1["BFP Admin Opens Fire Operations Tab<br/>(Palayan City Fire Station)"] --> B2["Select Date & Enter Daily Fire Operations<br/>(Incidents, Inspections, Rescues, Medical Assists)"]
    B2 --> B3{"Does Record Exist<br/>for Selected Date?"}

    B3 -- "Yes" --> B4["Prompt: 'Record Already Exists'<br/>(Option to Update Existing Data)"]
    B4 --> B5["Update Existing Operations Record<br/>(Date Locked, Values Modified)"]
    B3 -- "No" --> B6["Save New Operations Record<br/>(Insert to Database)"]

    B5 --> B7["System Aggregates Fire Risk Trends<br/>& Fire Truck / Water Tanker Readiness"]
    B6 --> B7

    B7 --> B8{"Active Major Fire or Water Shortage?"}
    B8 -- "Yes" --> B9["Trigger Cascade Alert to Water District & CDRRMO<br/>(Priority Refill at Pumping Station & Backup Tankers)"]
    B8 -- "No" --> B10["Log Routine Fire Prevention & Update Operational Charts"]

    B9 --> B11["End-Users (Citizens & Businesses) can VIEW<br/>Live Fire Danger Alerts & Emergency Hotlines on App"]
    B10 --> B11
```

#### Process Overview (Presentation Summary)

1. **Daily Operational Intake & Logging:**
   - **Access:** BFP Officer logs into the admin portal and accesses the BFP Operations Tab.
   - **Data Capture:** Enters daily fire incidents responded to, building safety inspections, barangay safety seminars, rescues, and medical assists.
   - **Date Validation:** System prevents future date submissions to guarantee authentic reporting.

2. **Smart Duplicate Date Handling:**
   - **Integrity Check:** Checks if a daily log already exists for the chosen date.
   - **Safe Update Flow:** If a record exists, prompts staff with a friendly modal allowing them to update the day's record with date-locking enabled to preserve historical data.

3. **Inter-Agency Cascade & Water District Linkage:**
   - **Water Refill Telemetry:** Because the city operates without a municipal hydrant network, fire suppression relies on mobile fire trucks and water tankers.
   - **Cascade Response:** When major fire alarms strike or tanker water depletes, automated cascade alerts dispatch to the Water District (for emergency priority refilling at city pumping stations) and CDRRMO for coordinated response.

4. **Public Fire Safety & Emergency Visibility:**
   - **Administrative Dashboard:** Recharts track incident trends, seasonal fire risks (especially during El Niño / dry months), and truck readiness.
   - **Citizen View:** Residents can view active fire hazard warnings, safety guidelines, and one-touch BFP emergency hotlines on the citizen app.

---

### 4.8 Water Module

#### Water Utility Operations & Facility Status Flow

```mermaid
flowchart TD
    W1["Water District Admin Opens Water Tab<br/>(Palayan City Water Utility)"] --> W2["Select Facility & Log Operational Status<br/>(Pumping Station, Reservoir, Location, Status)"]
    W2 --> W3{"Does Facility Already Exist<br/>in Database?"}

    W3 -- "Yes" --> W4["Prompt: 'Facility Exists'<br/>(Option to Update Facility Status)"]
    W4 --> W5["Update Existing Facility Record<br/>(Change Status to Operational / Maintenance / Offline)"]
    W3 -- "No" --> W6["Save New Water Facility Record<br/>(Insert to Database)"]

    W5 --> W7["System Aggregates Municipal Water Supply<br/>& Pumping Station Capacities"]
    W6 --> W7

    W7 --> W8{"Facility Offline or Service Interruption?"}
    W8 -- "Yes" --> W9["Trigger Cascade Alert to Hospital, BFP & Agriculture<br/>(Deploy Water Tankers & Issue Outage Advisory)"]
    W8 -- "No" --> W10["Log Routine Water Supply Telemetry & Update Status Board"]

    W9 --> W11["End-Users (Citizens & Farmers) can VIEW<br/>Live Water Outages, Pumping Status & Tanker Routes on App"]
    W10 --> W11
```

#### Process Overview (Presentation Summary)

1. **Facility Telemetry & Status Logging:**
   - **Access:** Water District Officer logs into the admin portal and accesses the Water Utility Tab.
   - **Data Capture:** Monitors city water infrastructure including pumping stations, reservoirs, and water treatment plants, logging operational state (*Operational, Maintenance, or Offline*).
   - **Location Mapping:** Each facility is mapped to its serving barangays to track municipal water pressure.

2. **Smart Facility Management & Updates:**
   - **Registry Check:** Checks whether the infrastructure asset is already registered in the municipal database.
   - **Status Toggle:** Admins can quickly update status when routine maintenance or unexpected pump breakdowns occur, keeping records synchronized without duplicate entries.

3. **Multi-Agency Cascade & Drought Linkage:**
   - **Inter-Agency Cascade:** When a primary pumping station trips offline or schedules maintenance, automated cascade warnings trigger to:
     - **City Hospital:** To verify reservoir backup levels.
     - **BFP Fire Station:** To divert fire trucks for water refilling to alternate stations.
     - **City Agriculture Office:** To assess impact on irrigation canals and farm drying.
   - **Emergency Deployment:** Dispatches emergency water tankers to affected residential barangays.

4. **Public Interruption Awareness:**
   - **Administrative Dashboard:** Displays live counts of operational vs offline facilities across the city grid.
   - **Citizen View:** Households and farmers can view scheduled water interruptions, live service recovery ETAs, and emergency tanker schedules on the citizen app.

---

### 4.9 Power Module

**Component:** `PowerUtilityTab` inside `AdminDashboard.jsx`  
**Tables:** `power_feeders`, `power_interruptions`, `power_restorations`

#### Key Features
- Distribution feeder monitoring with mapped barangay coverage.
- Outage logging (Emergency trip vs Scheduled maintenance) with restoration ETAs.
- Cross-agency cascade alerts: Automatic warnings to hospitals, water pumps, and cold storage facilities upon feeder loss.

---

### 4.10 Agriculture Module (City Agriculture Office - CAO)

**Component:** `AgricultureTab` inside `AdminDashboard.jsx`  
**Tables:** `agri_crop_monitoring`, `agri_damage_reports`, `agri_facilities`, `agri_supplies`  
**Citizen View:** `HomeScreen.jsx` (Agri Advisories) & `ReportModal.jsx` (Crop/Farm Damage Reporting)

#### Data Flow — Agriculture Module

```mermaid
flowchart TD
    subgraph CITIZEN["Farmers and Citizens"]
        F1["Farmer submits crop damage or pest report"] --> R[("reports table")]
        F2["Farmer views drought and weather advisories"] <-- RT[("Supabase Realtime")]
    end

    subgraph CAO["City Agriculture Office Admin"]
        CAO_ADM["Agriculture Officer"] --> TAB["AgricultureTab"]
        TAB --> M1["Crop Monitoring<br/>Hectares, Stage, Expected Yield"]
        TAB --> M2["Damage Assessment Validation<br/>Verify claims and compute losses"]
        TAB --> M3["Agricultural Facilities<br/>Solar dryers, Cold storage, Irrigation"]
        TAB --> M4["Farm Supply Inventory<br/>Seeds, Fertilizers, Fuel subsidies"]
    end

    subgraph CROSS["Inter-Agency Intelligence"]
        WX["Open-Meteo<br/>Heat Index and Rain Forecast"] --> TAB
        PWR["Power Outage on Cold Storage"] --> ALERT["Conflict Alert"]
        WAT["Irrigation canal dry or pump offline"] --> TAB
    end

    R --> TAB
    TAB --> VAL["Validated Calamity Loss Report"]
    VAL --> EXP["Export for DA and City Council Aid"]
    M2 --> ADV[("advisories table")]
    ADV --> RT
```

#### Key Features

1. **Crop Health & Seasonal Planting Monitoring:**
   - Tracks standing crops (Rice, Corn, High-Value Crops, Vegetables) by barangay.
   - Monitors crop growth stages (Seedling, Vegetative, Reproductive, Harvesting).
   - Estimates expected harvest yield and market readiness.

2. **Calamity Damage Assessment & Validation:**
   - Intake and validation of farmer damage reports post-typhoon, flood, drought, or extreme heat.
   - Computes damaged area (hectares) and estimated monetary loss (PHP).
   - Generates official City Agriculture Loss Reports for Department of Agriculture (DA) quick response funding and crop insurance claims.

3. **Agricultural Facilities & Machinery Tracking:**
   - Spatial monitoring of public solar dryer pavements, cold storage units, rice mills, and irrigation water gates.
   - Status tracking (Operational, Under Repair, Flooded, Unavailable).

4. **Pest & Livestock Disease Outbreak Early Warning:**
   - Tracking of Fall Armyworm (FAW), Rice Tungro, African Swine Fever (ASF), and avian influenza reports.
   - Automated triggers for containment advisories to affected barangays.

5. **Inter-Agency Synergies:**
   - **Weather + Agriculture:** High heat index automatically alerts CAO to drought stress on standing rice crops.
   - **Water + Agriculture:** Pumping station outages cross-referenced with farm irrigation supply lines.
   - **Power + Agriculture:** Electrical blackouts trigger alerts for municipal cold storage and dairy preservation facilities.

---

### 4.11 User Permission Module

**Component:** `UsersTab` inside `AdminDashboard.jsx` (Superadmin only)  
**Tables:** `auth.users` (accessed via `get_auth_users()` `SECURITY DEFINER` RPC)

#### Data Flow — User Permissions

```mermaid
flowchart TD
    SA["👑 Superadmin"] --> UT["UsersTab"]
    UT --> GU["get_auth_users RPC"]
    GU --> UL["User List<br/>Email, Role, Department, Categories"]

    SA --> NA["Create Agency Account<br/>supabase.auth.admin.createUser"]
    NA --> MD["user_metadata:<br/>role: admin, dept: CAO"]
    MD --> DB[("auth.users")]

    SA --> SR["set_user_role RPC"]
    SR --> DB
```

#### Role Levels

| Role | Target Users | Admin Console Access | Data Scope |
|------|--------------|----------------------|------------|
| `citizen` | General Public, Farmers, Residents | None (Citizen App only) | Own submitted reports and public views |
| `admin` | Department Personnel (CDRRMO, BFP, CAO, Water, Power, Hospitals) | Yes (9 scoped tabs) | Scoped strictly to assigned department data & reports |
| `superadmin` | City Administrator, City ICT Office | Yes (All 12 tabs) | Full system-wide read/write, user management, audit logs |

---

### 4.12 Settings Module

**Component:** `SettingsTab` inside `AdminDashboard.jsx` (Superadmin only)  
**Tables:** `departments`, `categories`

#### Key Features
- **Department CRUD:** Create, update, or disable city departments with dedicated brand colors and icons.
- **Category Management:** Define incident reporting categories (e.g., Flooding, Fire, Crop Damage, Water Leak) and assign them to responsible departments.
- **Dynamic Theming:** Agency admin dashboards inherit their department's accent color automatically.

---

### 4.13 Logs Module

**Component:** `ActivityLogsTab` inside `AdminDashboard.jsx` (Superadmin only)  
**Tables:** `audit_logs`, `security_events`

#### Key Features
- Immutable ledger capturing every DB `INSERT`, `UPDATE`, and `DELETE` via PostgreSQL trigger functions.
- Captured metadata: Table name, operation, previous JSON state, new JSON state, acting user ID, and timestamp.
- Comprehensive security audit log capturing failed logins, role modifications, and privilege escalations.

---

## 5. Use Case Diagrams

### 5.1 End-User (Citizen & Farmer) Use Cases

```mermaid
graph TD
    EU(["👤 Citizen & Farmer"])

    EU --> UC1["View Weather & Heat Index<br/>Hourly & 7-Day Forecast"]
    EU --> UC2["Browse Community GIS Map<br/>Incidents · Facilities · Outages"]
    EU --> UC3["View Official Advisories<br/>Weather · Health · Agri Warnings"]
    EU --> UC4["Access Emergency Hotlines<br/>CDRRMO · BFP · CAO · Hospitals · Police"]
    EU --> UC5["Submit Incident Report<br/>General Disaster · Infra · Utility Outage"]
    EU --> UC6["Submit Agricultural Damage Report<br/>Crop Loss · Pest Outbreak · Irrigation"]
    EU --> UC7["Register / Login<br/>OTP verified mobile or email"]
    EU --> UC8["Track My Reports<br/>Live status updates & resolution notes"]
    EU --> UC9["Manage Profile<br/>Contact details & barangay location"]
    EU --> UC10["Guest Browsing<br/>Read-only access without login"]

    UC5 --> AUTH{"User Session"}
    UC6 --> AUTH
    AUTH -- "Guest (No Account)" --> GUEST["Blocked: Must register / log in first"]
    AUTH -- "Authenticated" --> ACCT["Tied to account & tracked in history"]

    style EU fill:#2d8119,color:#fff
```

### 5.2 Admin (Agency Admin) Use Cases

```mermaid
graph TD
    ADMIN(["🔐 Agency Admin<br/>e.g., CAO / CDRRMO / BFP"])

    ADMIN --> A1["Login to Admin Console<br/>/admin portal"]
    ADMIN --> A2["View Department Overview<br/>Key department KPIs & alerts"]
    ADMIN --> A3["Manage Citizen Reports<br/>Acknowledge · Dispatch · Resolve"]
    ADMIN --> A4["Create Department Advisories<br/>Draft & submit for Superadmin approval"]
    ADMIN --> A5["Manage Operations<br/>CDRRMO / BFP / Hospital / Agri"]
    ADMIN --> A6["Track Utilities<br/>Water pumping & Power feeders"]
    ADMIN --> A7["Monitor Agricultural Operations<br/>Crop records · Calamity claims · Facilities"]
    ADMIN --> A8["Export Analytics<br/>Generate official PDF & CSV reports"]
    ADMIN --> A9["View Spatial GIS Map<br/>Track department resources & incidents"]
    ADMIN --> A10["Receive Inter-Agency Alerts<br/>Cross-utility cascade warnings"]

    style ADMIN fill:#2563eb,color:#fff
```

### 5.3 Superadmin Use Cases

```mermaid
graph TD
    SA(["👑 Superadmin<br/>City Administrator / ICT"])

    SA --> S1["All Agency Admin Capabilities +"]
    SA --> S2["Approve / Reject Public Advisories<br/>Final citywide publishing gate"]
    SA --> S3["Manage User Accounts & RBAC<br/>Create admins · Assign departments · Roles"]
    SA --> S4["Configure Departments & Categories<br/>CRUD departments · Category bindings"]
    SA --> S5["View Immutable Audit Logs<br/>Full database modification trail"]
    SA --> S6["Inter-Agency Conflict Center<br/>Monitor cross-utility cascades"]
    SA --> S7["Executive City Dashboard<br/>Cross-agency citywide metrics"]
    SA --> S8["Resolve System Alerts<br/>Acknowledge & clear system emergencies"]
    SA --> S9["System Configuration & Maintenance<br/>Backup · Security · Platform variables"]

    style SA fill:#dc2626,color:#fff
```

---

## 6. Role Comparison Matrix

| Feature / Module | 👤 Citizen / Farmer | 🔐 Agency Admin | 👑 Superadmin |
|------------------|:-------------------:|:---------------:|:-------------:|
| View Weather & Community Map | ✅ | ✅ | ✅ |
| Submit General Incident Report | ✅ | ✅ | ✅ |
| Submit Farm Damage / Pest Report | ✅ | ✅ | ✅ |
| View Published Advisories | ✅ | ✅ | ✅ |
| Access Emergency Hotlines | ✅ | ✅ | ✅ |
| Admin Console Access (`/admin`) | ❌ | ✅ | ✅ |
| Manage Reports (Status / Notes) | ❌ | ✅ *(Dept-scoped)* | ✅ *(All)* |
| Draft Public Advisories | ❌ | ✅ *(Dept-scoped)* | ✅ |
| **Approve & Publish Advisories** | ❌ | ❌ | ✅ |
| Hospital Capacity Module | ❌ | ✅ | ✅ |
| CDRRMO Operations Module | ❌ | ✅ | ✅ |
| BFP Fire Operations Module | ❌ | ✅ | ✅ |
| Water Utility Module | ❌ | ✅ | ✅ |
| Power Utility Module | ❌ | ✅ | ✅ |
| **Agriculture Module (CAO)** | ❌ *(Can report)* | ✅ | ✅ |
| **User & RBAC Management** | ❌ | ❌ | ✅ |
| **Settings (Depts & Categories)** | ❌ | ❌ | ✅ |
| **Audit & Activity Logs** | ❌ | ❌ | ✅ |
| Inter-Agency Cascade Center | ❌ | Read-Only | ✅ Full |
| Spatial GIS Map Admin Control | ❌ | ✅ | ✅ |
| Export Official PDF / CSV Reports | ❌ | ✅ | ✅ |
| Executive Citywide Analytics | ❌ | ❌ | ✅ |

---

## 7. Security Model

```mermaid
flowchart TD
    REQ["Client API Request"] --> JWT{"Valid Supabase JWT?"}
    JWT -- "No" --> PUB["Public RLS Policies<br/>Read-only on published reports & advisories"]
    JWT -- "Yes" --> ROLE{"user_metadata.role"}

    ROLE -- "citizen" --> CIT["Citizen Policies<br/>CRUD on own reports<br/>Read-only on public data"]
    ROLE -- "admin" --> ADM["Agency Admin Policies<br/>Scoped by assigned_department<br/>Audit-logged updates"]
    ROLE -- "superadmin" --> SAP["Superadmin Policies<br/>Bypass dept restrictions<br/>Full platform access"]

    ADM --> RLS["Row Level Security Enforcement<br/>auth.uid + auth.jwt"]
    SAP --> RLS
    RLS --> DB[("PostgreSQL Database")]
    DB --> AUD["PostgreSQL Trigger: process_audit_log"]
    AUD --> LOG[("audit_logs Table")]
```

### Security Safeguards

| Layer | Safeguard | Implementation Details |
|-------|-----------|------------------------|
| **Authentication** | Supabase JWT | Secure token refresh, session persistence, OTP email/phone authentication. |
| **Superadmin Gate** | SHA-256 Email Hash | Superadmin identity verified via client & server SHA-256 cryptographic hash checks. |
| **Access Control** | Row Level Security (RLS) | Strictly enforced on all PostgreSQL tables using `auth.uid()` and `user_metadata.role`. |
| **Data Integrity** | PostgreSQL Triggers | `process_audit_log()` captures pre- and post-mutation JSON state on every critical table. |
| **Privileged RPC** | `SECURITY DEFINER` Functions | Administrative operations (e.g., `get_auth_users()`, `set_user_role()`) run with elevated database privileges only when called by a verified superadmin. |
| **Input Protection** | Sanitization & Validation | Multi-tier input validation, XSS prevention, and parameterized queries across all endpoints. |

---

*Document generated from CLIMA / PalaSumbong System Architecture Analysis — October 2026*  
*Covers: Citizen Portal · Multi-Agency Admin Console · City Agriculture Office Integration · Database Architecture*
