# CLIMA Backend Schema Document

## Database: Supabase PostgreSQL

**Provider:** Supabase (managed PostgreSQL 15+)  
**Total Tables:** 25  
**Storage Buckets:** 1  
**RLS Enabled:** All tables  
**Audit Logging:** Enabled via triggers on key tables

---

## Tables

### 1. reports

**Purpose:** Citizen-submitted incident reports

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique report identifier |
| icon | text | | Icon identifier for category |
| title | text | | Report title/summary |
| category | text | | Category name (links to categories table) |
| department_id | uuid | FOREIGN KEY → departments(id) | Department responsible for category |
| description | text | | Detailed description of incident |
| location | text | | Human-readable address |
| lat | float | | Latitude coordinate |
| lng | float | | Longitude coordinate |
| status | text | DEFAULT 'pending' | Report status (pending, in_progress, resolved, rejected) |
| status_label | text | DEFAULT 'pending' | Display label for status |
| upvotes | integer | DEFAULT 0 | Number of citizen upvotes |
| photo_url | text | | Comma-separated URLs to uploaded photos |
| full_name | text | | Submitter name (required for guests, optional for authenticated) |
| is_guest | boolean | DEFAULT true | True if submitted without authentication |
| user_id | uuid | FOREIGN KEY → auth.users(id), NULLABLE | User ID if authenticated submission |
| created_at | timestamptz | DEFAULT now() | Timestamp of submission |

**Primary Key:** id  
**Foreign Keys:**
- department_id → departments.id
- user_id → auth.users.id

**RLS:** Enabled

---

### 2. departments

**Purpose:** Government departments/agencies managing different categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique department identifier |
| name | text | UNIQUE, NOT NULL | Department name (e.g., "CDRRMO", "BFP", "Hospital") |
| accent_color | text | | Hex color for theming admin dashboard |
| created_at | timestamptz | DEFAULT now() | Timestamp of creation |

**Primary Key:** id  
**Foreign Keys:** None  
**RLS:** Enabled

---

### 3. categories

**Purpose:** Incident report categories organized by department

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique category identifier |
| name | text | NOT NULL | Category name (e.g., "Fire Incident", "Water Leak") |
| group_name | text | DEFAULT 'General' | Grouping label for UI organization |
| icon | text | | Icon identifier for UI display |
| icon_name | text | | Lucide React icon name |
| department_id | uuid | FOREIGN KEY → departments(id) | Parent department |
| created_at | timestamptz | DEFAULT now() | Timestamp of creation |

**Primary Key:** id  
**Foreign Keys:**
- department_id → departments.id

**RLS:** Enabled

---

### 4. profiles

**Purpose:** Extended user profile data (mirrors auth.users)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, FOREIGN KEY → auth.users(id) | User ID (same as auth.users) |
| email | text | | User email (mirrored from auth.users) |
| full_name | text | | Display name |
| role | text | | User role: 'user', 'admin', 'superadmin' |
| assigned_categories | jsonb | | Array of category names admin can manage |
| assigned_department | text | | Department name for admin |
| must_change_password | boolean | DEFAULT false | Force password change on next login |
| last_password_change | timestamptz | | Timestamp of last password change |
| created_at | timestamptz | DEFAULT now() | Account creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last profile update timestamp |

**Primary Key:** id  
**Foreign Keys:**
- id → auth.users.id

**RLS:** Enabled

---

### 5. audit_logs

**Purpose:** Automatic audit trail for data changes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log entry identifier |
| table_name | varchar(50) | | Name of table that was modified |
| record_id | uuid | | ID of the modified record |
| action | varchar(10) | | SQL action: INSERT, UPDATE, DELETE |
| old_data | jsonb | | Complete record state before change (UPDATE/DELETE) |
| new_data | jsonb | | Complete record state after change (INSERT/UPDATE) |
| actor_id | uuid | | User ID who performed action (from auth.uid()) |
| ip_address | inet | | IP address of actor (if available) |
| created_at | timestamptz | DEFAULT now() | Timestamp of action |

**Primary Key:** id  
**Foreign Keys:** None (actor_id not enforced due to system actions)  
**RLS:** Enabled

---

### 6. activity_logs

**Purpose:** User activity tracking (logins, actions)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log entry identifier |
| user_id | uuid | FOREIGN KEY → auth.users(id) | User who performed action |
| action | text | | Action description (e.g., "User login", "Report created") |
| details | text | | Additional context or metadata |
| ip_address | inet | | IP address of user |
| created_at | timestamptz | DEFAULT now() | Timestamp of action |

**Primary Key:** id  
**Foreign Keys:**
- user_id → auth.users.id

**RLS:** Enabled

---

### 7. notifications

**Purpose:** User notifications and system alerts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique notification identifier |
| user_id | uuid | FOREIGN KEY → auth.users(id), NULLABLE | Target user (null for broadcast) |
| title | text | | Notification title |
| message | text | | Notification body |
| type | varchar(50) | DEFAULT 'system' | Notification type (system, report, advisory, alert) |
| is_read | boolean | DEFAULT false | Read status |
| created_at | timestamptz | DEFAULT now() | Timestamp of creation |

**Primary Key:** id  
**Foreign Keys:**
- user_id → auth.users.id (nullable)

**RLS:** Enabled

---

### 8. advisories

**Purpose:** Official government advisories and announcements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique advisory identifier |
| title | text | NOT NULL | Advisory title |
| content | text | NOT NULL | Advisory body content |
| category | text | | Advisory category (e.g., "El Niño", "Typhoon", "Health") |
| severity | text | | Severity level: low, medium, high, critical |
| status | text | DEFAULT 'Draft' | Workflow status: Draft, Pending, Published, Unpublished, Archived |
| author_id | uuid | FOREIGN KEY → auth.users(id) | Admin who created advisory |
| department_id | uuid | FOREIGN KEY → departments(id) | Issuing department |
| scheduled_publish_at | timestamptz | NULLABLE | Future publication timestamp (for scheduled posts) |
| published_at | timestamptz | NULLABLE | Actual publication timestamp |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Primary Key:** id  
**Foreign Keys:**
- author_id → auth.users.id
- department_id → departments.id

**RLS:** Enabled

---

### 9. facebook_pages

**Purpose:** Registered Facebook pages for monitoring (Phase 4 - not yet activated)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique record identifier |
| page_id | text | UNIQUE | Facebook page ID |
| page_name | text | | Facebook page name |
| access_token | text | | Facebook Graph API access token |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

**Primary Key:** id  
**Foreign Keys:** None  
**RLS:** Enabled

---

### 10. facebook_keywords

**Purpose:** Keywords for automatic post categorization (Phase 4)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique keyword identifier |
| keyword | text | NOT NULL | Keyword or phrase to detect |
| category | text | FOREIGN KEY → categories(name) | Suggested category if keyword found |
| is_active | boolean | DEFAULT true | Enable/disable keyword |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

**Primary Key:** id  
**Foreign Keys:**
- category → categories.name

**RLS:** Enabled

---

### 11. facebook_moderation_queue

**Purpose:** Queue of detected Facebook posts awaiting moderation (Phase 4)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique queue entry identifier |
| post_id | text | UNIQUE | Facebook post ID |
| page_id | uuid | FOREIGN KEY → facebook_pages(id) | Source Facebook page |
| post_content | text | | Full post text |
| detected_keywords | text[] | | Array of matched keywords |
| suggested_category | text | | Auto-suggested category based on keywords |
| status | text | DEFAULT 'pending' | Moderation status: pending, approved, rejected, converted |
| moderated_by | uuid | FOREIGN KEY → auth.users(id), NULLABLE | Admin who reviewed post |
| moderated_at | timestamptz | NULLABLE | Moderation timestamp |
| created_at | timestamptz | DEFAULT now() | Detection timestamp |

**Primary Key:** id  
**Foreign Keys:**
- page_id → facebook_pages.id
- moderated_by → auth.users.id

**RLS:** Enabled

---

### 12. hospitals

**Purpose:** Hospital registry for health monitoring (Phase 5)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique hospital identifier |
| name | text | NOT NULL | Hospital name |
| address | text | | Physical address |
| lat | float | | Latitude coordinate |
| lng | float | | Longitude coordinate |
| contact_number | text | | Phone number |
| capacity | integer | | Total bed capacity |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

**Primary Key:** id  
**Foreign Keys:** None  
**RLS:** Enabled

---

### 13. hospital_daily_records

**Purpose:** Daily heat-related case tracking per hospital (Phase 5)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique record identifier |
| hospital_id | uuid | FOREIGN KEY → hospitals(id) | Hospital reporting data |
| date | date | NOT NULL | Report date |
| heat_stroke_cases | integer | DEFAULT 0 | Number of heat stroke cases |
| heat_exhaustion_cases | integer | DEFAULT 0 | Number of heat exhaustion cases |
| dehydration_cases | integer | DEFAULT 0 | Number of dehydration cases |
| total_cases | integer | DEFAULT 0 | Sum of all heat-related cases |
| notes | text | | Additional notes or context |
| recorded_by | uuid | FOREIGN KEY → auth.users(id) | Admin who entered data |
| created_at | timestamptz | DEFAULT now() | Entry timestamp |

**Primary Key:** id  
**Foreign Keys:**
- hospital_id → hospitals.id
- recorded_by → auth.users.id

**RLS:** Enabled

---

### 14. cdrrmo_operations

**Purpose:** CDRRMO dispatch, evacuation, and relief operations (Phase 6)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique operation identifier |
| operation_type | text | NOT NULL | Operation type: dispatch, evacuation, relief |
| incident_type | text | | Nature of incident (e.g., "Fire support", "Flood evacuation") |
| location | text | NOT NULL | Incident location |
| barangay | text | | Barangay name |
| lat | float | NULLABLE | Latitude coordinate |
| lng | float | NULLABLE | Longitude coordinate |
| description | text | | Detailed operation description |
| status | text | NOT NULL | Operation status: ongoing, completed, standby |
| personnel_deployed | integer | | Number of CDRRMO personnel |
| vehicles_deployed | integer | | Number of vehicles used |
| families_affected | integer | NULLABLE | Number of families affected/evacuated |
| start_time | timestamptz | NOT NULL | Operation start timestamp |
| end_time | timestamptz | NULLABLE | Operation end timestamp |
| recorded_by | uuid | FOREIGN KEY → auth.users(id) | Admin who recorded operation |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

**Primary Key:** id  
**Foreign Keys:**
- recorded_by → auth.users.id

**RLS:** Enabled

---

### 15. evacuation_centers

**Purpose:** Evacuation center registry and capacity tracking (Phase 6)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique center identifier |
| name | text | NOT NULL | Evacuation center name |
| barangay | text | NOT NULL | Barangay location |
| capacity | integer | NOT NULL | Maximum family capacity |
| current_occupancy | integer | DEFAULT 0 | Current number of families |
| lat | float | NOT NULL | Latitude coordinate |
| lng | float | NOT NULL | Longitude coordinate |
| status | text | DEFAULT 'operational' | Center status: operational, full, closed |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

**Primary Key:** id  
**Foreign Keys:** None  
**RLS:** Enabled

---

### 16. bfp_operations

**Purpose:** BFP fire incident and response tracking (Phase 7)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique operation identifier |
| incident_type | text | NOT NULL | Incident type: wildfire, structure_fire, rescue |
| location | text | NOT NULL | Incident location |
| barangay | text | | Barangay name |
| lat | float | NULLABLE | Latitude coordinate |
| lng | float | NULLABLE | Longitude coordinate |
| description | text | | Detailed incident description |
| fire_alarm_level | integer | NULLABLE | Fire alarm level (1-5) |
| status | text | NOT NULL | Incident status: ongoing, extinguished, controlled |
| trucks_deployed | integer | | Number of fire trucks |
| personnel_deployed | integer | | Number of firefighters |
| casualties | integer | DEFAULT 0 | Number of casualties |
| property_damage_estimate | numeric | NULLABLE | Estimated property damage (PHP) |
| start_time | timestamptz | NOT NULL | Incident start timestamp |
| end_time | timestamptz | NULLABLE | Incident end timestamp |
| recorded_by | uuid | FOREIGN KEY → auth.users(id) | Admin who recorded incident |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

**Primary Key:** id  
**Foreign Keys:**
- recorded_by → auth.users.id

**RLS:** Enabled

---

### 17. fire_stations

**Purpose:** Fire station registry and resource tracking (Phase 7)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique station identifier |
| name | text | NOT NULL | Fire station name |
| address | text | | Physical address |
| lat | float | NOT NULL | Latitude coordinate |
| lng | float | NOT NULL | Longitude coordinate |
| trucks_available | integer | | Number of fire trucks |
| personnel_count | integer | | Number of firefighters assigned |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

**Primary Key:** id  
**Foreign Keys:** None  
**RLS:** Enabled

---

### 18. water_facilities

**Purpose:** Water infrastructure registry (Phase 8)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique facility identifier |
| name | text | NOT NULL | Facility name |
| facility_type | text | NOT NULL | Type: pumping_station, reservoir, treatment_plant |
| address | text | | Physical address |
| barangay | text | | Barangay location |
| lat | float | NOT NULL | Latitude coordinate |
| lng | float | NOT NULL | Longitude coordinate |
| capacity | numeric | | Capacity in liters or cubic meters |
| status | text | DEFAULT 'operational' | Status: operational, maintenance, offline |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

**Primary Key:** id  
**Foreign Keys:** None  
**RLS:** Enabled

---

### 19. water_interruptions

**Purpose:** Water service interruption scheduling per barangay (Phase 8)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique interruption identifier |
| barangay | text | NOT NULL | Affected barangay |
| affected_areas | text[] | | Array of specific sitios/puroks affected |
| reason | text | NOT NULL | Reason for interruption |
| status | text | NOT NULL | Status: scheduled, ongoing, resolved |
| start_time | timestamptz | NOT NULL | Interruption start timestamp |
| end_time | timestamptz | NULLABLE | Actual end timestamp |
| estimated_end_time | timestamptz | NULLABLE | Estimated restoration timestamp |
| tanker_deployed | boolean | DEFAULT false | Water tanker deployed flag |
| recorded_by | uuid | FOREIGN KEY → auth.users(id) | Admin who scheduled interruption |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

**Primary Key:** id  
**Foreign Keys:**
- recorded_by → auth.users.id

**RLS:** Enabled

---

### 20. power_feeders

**Purpose:** Power grid feeder registry (Phase 9)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique feeder identifier |
| feeder_name | text | NOT NULL | Feeder line name |
| provider | text | NOT NULL | Electric provider (e.g., "NEECO") |
| barangays_covered | text[] | | Array of barangays served by feeder |
| status | text | DEFAULT 'operational' | Status: operational, maintenance, offline |
| created_at | timestamptz | DEFAULT now() | Registration timestamp |

**Primary Key:** id  
**Foreign Keys:** None  
**RLS:** Enabled

---

### 21. power_interruptions

**Purpose:** Power outage scheduling per barangay (Phase 9)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique interruption identifier |
| feeder_id | uuid | FOREIGN KEY → power_feeders(id), NULLABLE | Associated feeder (optional) |
| provider | text | NOT NULL | Electric provider (e.g., "NEECO") |
| barangay | text | NOT NULL | Affected barangay |
| affected_areas | text[] | | Array of specific sitios/puroks affected |
| reason | text | NOT NULL | Reason for outage |
| status | text | NOT NULL | Status: scheduled, ongoing, restored |
| start_time | timestamptz | NOT NULL | Outage start timestamp |
| end_time | timestamptz | NULLABLE | Actual restoration timestamp |
| estimated_end_time | timestamptz | NULLABLE | Estimated restoration timestamp |
| recorded_by | uuid | FOREIGN KEY → auth.users(id) | Admin who scheduled outage |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

**Primary Key:** id  
**Foreign Keys:**
- feeder_id → power_feeders.id
- recorded_by → auth.users.id

**RLS:** Enabled

---

### 22. inter_agency_alerts

**Purpose:** Inter-agency conflict detection and coordination alerts (Phase 11)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique alert identifier |
| alert_type | text | NOT NULL | Type: utility_conflict, hospital_dependency, power_cascade |
| severity | text | NOT NULL | Severity: low, medium, high, critical |
| title | text | NOT NULL | Alert title |
| description | text | NOT NULL | Alert description and context |
| affected_agencies | text[] | | Array of department names affected |
| status | text | DEFAULT 'active' | Status: active, acknowledged, resolved |
| generated_by | text | DEFAULT 'system' | Source: system (auto), manual (admin-created) |
| acknowledged_by | uuid | FOREIGN KEY → auth.users(id), NULLABLE | Admin who acknowledged |
| resolved_by | uuid | FOREIGN KEY → auth.users(id), NULLABLE | Admin who resolved |
| created_at | timestamptz | DEFAULT now() | Alert creation timestamp |
| resolved_at | timestamptz | NULLABLE | Resolution timestamp |

**Primary Key:** id  
**Foreign Keys:**
- acknowledged_by → auth.users.id
- resolved_by → auth.users.id

**RLS:** Enabled

---

### 23. agriculture_damage_reports

**Purpose:** Crop and livestock damage tracking due to El Niño (Phase 8 Extension)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique report identifier |
| barangay | text | NOT NULL | Affected barangay |
| farmer_name | text | NULLABLE | Farmer name (optional) |
| crop_type | text | NOT NULL | Type of crop or livestock affected |
| area_affected_hectares | numeric | NOT NULL | Area affected in hectares |
| damage_severity | text | NOT NULL | Severity: minor, moderate, severe, total_loss |
| estimated_loss_value | numeric | NOT NULL | Estimated financial loss (PHP) |
| cause | text | NOT NULL | Cause of damage (e.g., "Drought", "Heat stress") |
| date_reported | date | NOT NULL | Date damage was reported |
| recorded_by | uuid | FOREIGN KEY → auth.users(id) | Admin who recorded report |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

**Primary Key:** id  
**Foreign Keys:**
- recorded_by → auth.users.id

**RLS:** Enabled

---

### 24. password_reset_otps

**Purpose:** One-time passwords for password reset flow

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique OTP identifier |
| user_id | uuid | FOREIGN KEY → auth.users(id) | User requesting reset |
| email | text | NOT NULL | Email address |
| otp_code | text | NOT NULL | 6-digit OTP code |
| expires_at | timestamptz | NOT NULL | OTP expiration timestamp (10 minutes) |
| used | boolean | DEFAULT false | Whether OTP has been used |
| created_at | timestamptz | DEFAULT now() | OTP generation timestamp |

**Primary Key:** id  
**Foreign Keys:**
- user_id → auth.users.id

**RLS:** Enabled

---

### 25. admin_module_permissions

**Purpose:** Granular module-level permissions for admin users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique permission identifier |
| user_id | uuid | FOREIGN KEY → auth.users(id) | Admin user |
| module_name | text | NOT NULL | Module: dashboard, reports, advisories, hospital, cdrrmo, bfp, agriculture, water, power, users, settings, logs |
| can_view | boolean | DEFAULT false | Permission to view module |
| can_create | boolean | DEFAULT false | Permission to create records |
| can_edit | boolean | DEFAULT false | Permission to edit records |
| can_delete | boolean | DEFAULT false | Permission to delete records |
| created_at | timestamptz | DEFAULT now() | Permission grant timestamp |

**Primary Key:** id  
**Foreign Keys:**
- user_id → auth.users.id

**RLS:** Enabled

---

## Row Level Security Policies

### reports table

**Policy 1:** `Allow public read access on reports` (SELECT)  
- **Applies to:** All users (anon, authenticated)  
- **Condition:** `true` (anyone can read)

**Policy 2:** `Allow public insert access on reports` (INSERT)  
- **Applies to:** All users (anon, authenticated)  
- **Condition:** `true` (anyone can submit)

**Policy 3:** `Allow authenticated owner or admin update access on reports` (UPDATE)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.uid() = user_id) OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

**Policy 4:** `Agency admin update reports` (UPDATE)  
- **Applies to:** Authenticated users  
- **Condition:** `(role = 'superadmin') OR (role = 'admin' AND assigned_department = department.name) OR (auth.uid() = user_id)`

---

### departments table

**Policy 1:** `Public read departments` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Superadmin modify departments` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'`

---

### categories table

**Policy 1:** `Public read categories` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Superadmin modify categories` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'`

---

### audit_logs table

**Policy 1:** `Superadmin read audit logs` (SELECT)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'`

**Policy 2:** `System insert audit logs` (INSERT)  
- **Applies to:** All users  
- **Condition:** `true` (triggered by database functions)

---

### notifications table

**Policy 1:** `Read notifications` (SELECT)  
- **Applies to:** Authenticated users  
- **Condition:** `auth.uid() = user_id OR user_id IS NULL`

**Policy 2:** `Insert notifications` (INSERT)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### advisories table

**Policy 1:** `Allow anon read published advisories` (SELECT)  
- **Applies to:** All users  
- **Condition:** `status = 'Published'`

**Policy 2:** `Allow authenticated users to read their drafts` (SELECT)  
- **Applies to:** Authenticated users  
- **Condition:** `auth.uid() = author_id`

**Policy 3:** `Allow admins full access` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### hospital_daily_records table

**Policy 1:** `Allow anon read hospital_daily_records` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Allow admins full access` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### cdrrmo_operations table

**Policy 1:** `Allow anon read cdrrmo_operations` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Allow admins full access` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### bfp_operations table

**Policy 1:** `Allow anon read bfp_operations` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Allow admins full access` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### agriculture_damage_reports table

**Policy 1:** `Allow anon read agriculture_damage_reports` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Allow admins full access` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### water_interruptions table

**Policy 1:** `Allow anon read water_interruptions` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Allow admins full access` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### power_interruptions table

**Policy 1:** `Allow anon read power_interruptions` (SELECT)  
- **Applies to:** All users  
- **Condition:** `true`

**Policy 2:** `Allow admins full access` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')`

---

### profiles table

**Multiple policies for read/update based on role:**
- Users can read/update own profile
- Admins can read profiles in their department
- Superadmins can read/update all profiles

---

### admin_module_permissions table

**Policy 1:** `Admins can read own permissions` (SELECT)  
- **Applies to:** Authenticated users  
- **Condition:** `auth.uid() = user_id`

**Policy 2:** `Superadmins can manage all permissions` (ALL)  
- **Applies to:** Authenticated users  
- **Condition:** `(auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin'`

---

**Note:** FIX_PUBLIC_RLS_POLICIES.sql adds anon SELECT policies to 7 tables (hospitals, evacuation_centers, fire_stations, water_facilities, power_feeders, inter_agency_alerts, facebook_moderation_queue) for El Niño dashboard visibility.

---

## Indexes

**No explicit CREATE INDEX statements found in reviewed SQL files.**

Supabase automatically creates indexes on:
- Primary keys (all `id` columns)
- Foreign keys (all `*_id` columns)
- UNIQUE constraints (e.g., `departments.name`)

**Recommended Additional Indexes (Missing):**
```sql
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_advisories_status ON advisories(status);
CREATE INDEX idx_hospital_daily_records_date ON hospital_daily_records(date);
CREATE INDEX idx_cdrrmo_operations_start_time ON cdrrmo_operations(start_time);
CREATE INDEX idx_bfp_operations_start_time ON bfp_operations(start_time);
CREATE INDEX idx_water_interruptions_start_time ON water_interruptions(start_time);
CREATE INDEX idx_power_interruptions_start_time ON power_interruptions(start_time);
```

---

## Database Functions

### 1. process_audit_log()

**Purpose:** Automatically log data changes to audit_logs table  
**Type:** Trigger function  
**Returns:** Trigger  
**Language:** PL/pgSQL  
**Security:** SECURITY DEFINER

**Behavior:**
- Captures INSERT/UPDATE/DELETE on monitored tables
- Stores old_data (for UPDATE/DELETE) and new_data (for INSERT/UPDATE) as JSONB
- Records actor_id from auth.uid()
- Returns NEW for INSERT/UPDATE, OLD for DELETE

---

### 2. get_auth_users()

**Purpose:** Fetch all users with role/categories from auth.users (superadmin function)  
**Type:** RPC (Remote Procedure Call)  
**Returns:** Table of user data  
**Language:** PL/pgSQL  
**Security:** SECURITY DEFINER  
**Permissions:** GRANT EXECUTE TO authenticated

**Access Control:**
- Requires admin or superadmin role
- Throws exception if unauthorized

---

### 3. set_user_role()

**Purpose:** Update user role, categories, and department  
**Type:** RPC  
**Parameters:**
- `target_user_id` (uuid)
- `new_role` (text)
- `assigned_categories` (jsonb)
- `assigned_department` (text)  
**Returns:** void  
**Language:** PL/pgSQL  
**Security:** SECURITY DEFINER  
**Permissions:** GRANT EXECUTE TO authenticated

**Behavior:**
- Updates auth.users.raw_user_meta_data
- Syncs profiles table
- Requires admin role

---

### 4. confirm_user_email()

**Purpose:** Manually confirm user email (bypass email verification)  
**Type:** RPC  
**Parameters:**
- `target_user_id` (uuid)  
**Returns:** void  
**Language:** PL/pgSQL  
**Security:** SECURITY DEFINER  
**Permissions:** GRANT EXECUTE TO authenticated

**Behavior:**
- Sets auth.users.email_confirmed_at to now()
- Requires admin role

---

### 5. verify_password_reset_otp()

**Purpose:** Validate OTP and return user_id if valid  
**Type:** RPC (assumed from server.js usage)  
**Parameters:**
- `p_email` (text)
- `p_otp_code` (text)  
**Returns:** uuid (user_id) or null  
**Language:** PL/pgSQL (assumed)

**Behavior:**
- Checks password_reset_otps table
- Validates OTP not expired and not used
- Marks OTP as used if valid

---

## Triggers

### 1. reports_audit

**Table:** reports  
**Event:** AFTER INSERT OR UPDATE OR DELETE  
**Function:** process_audit_log()

---

### 2. departments_audit

**Table:** departments  
**Event:** AFTER INSERT OR UPDATE OR DELETE  
**Function:** process_audit_log()

---

### 3. categories_audit

**Table:** categories  
**Event:** AFTER INSERT OR UPDATE OR DELETE  
**Function:** process_audit_log()

---

**Note:** Additional triggers likely exist for automatic profile creation on auth.users insert (auth.on_auth_user_created hook) based on profiles table structure.

---

## Storage Buckets

### Bucket: reports

**Type:** Public bucket  
**Purpose:** User-uploaded incident photos and profile avatars  
**Access Control:** RLS policies on bucket

**Organization:**
- Random 32-character folder names for security
- Paths:
  - `avatars/{random-folder}/{random-filename}-{timestamp}.{ext}`
  - `photos/{random-folder}/{random-filename}-{timestamp}.{ext}`

**File Processing (Client-Side):**
- Compression via browser-image-compression
- Max size: 0.2MB (200KB) for avatars, 1MB for photos
- Max dimensions: 400x400 for avatars, 1920x1920 for photos
- Watermarking: Applied to report photos (canvas-based, filename in bottom-right corner)

**RLS Policies (Assumed):**
- SELECT: Public (anyone can view uploaded files)
- INSERT: Authenticated users only
- UPDATE: Owner or admin only
- DELETE: Owner or admin only

---

## Authentication Schema

### Provider
**Supabase Auth** — Uses auth.users table (managed by Supabase, not directly modifiable)

**auth.users structure (relevant fields):**
- `id` (uuid) — Primary key
- `email` (text) — User email
- `encrypted_password` (text) — Bcrypt hash (managed by Supabase)
- `email_confirmed_at` (timestamptz) — Email verification timestamp
- `raw_user_meta_data` (jsonb) — Custom metadata storage
- `created_at` (timestamptz) — Account creation timestamp

### Profile Extension
**Table:** profiles (extends auth.users with 1:1 relationship)

### Role Storage
**Primary:** `auth.users.raw_user_meta_data.role`  
**Mirror:** `profiles.role`  
**Sync Method:** Manual via set_user_role() function

**Role Values:**
- `'user'` — Standard citizen
- `'admin'` — Department admin
- `'superadmin'` — System administrator

### Category Assignment Storage
**Location:** `auth.users.raw_user_meta_data.assigned_categories` (jsonb array)  
**Example:** `["Water Issues", "Road Damage"]` or `["All Categories"]`

### Department Assignment Storage
**Location:** `auth.users.raw_user_meta_data.assigned_department` (text)  
**Example:** `"CDRRMO"`, `"BFP"`, `"Hospital"`

---

## Data Relationships Overview

### High-Level Entity Relationships

```
auth.users (1) ←→ (1) profiles
    ↓ (1)
    ↓ (many)
reports (many) → (1) departments
reports (many) → (1) categories
categories (many) → (1) departments

advisories (many) → (1) departments
advisories (many) → (1) auth.users (author)

hospital_daily_records (many) → (1) hospitals
hospital_daily_records (many) → (1) auth.users (recorded_by)

cdrrmo_operations (many) → (1) auth.users (recorded_by)
bfp_operations (many) → (1) auth.users (recorded_by)
agriculture_damage_reports (many) → (1) auth.users (recorded_by)
water_interruptions (many) → (1) auth.users (recorded_by)
power_interruptions (many) → (1) auth.users (recorded_by)
power_interruptions (many) → (1) power_feeders

admin_module_permissions (many) → (1) auth.users
```

---

## Security Model Summary

### RLS Approach
**Philosophy:** Defense in depth — client-side filtering + database-level enforcement

**Access Tiers:**
1. **Anonymous Users:**
   - SELECT published/public data (advisories, reports, operations)
   - INSERT reports (guest submission)
   - No UPDATE/DELETE

2. **Authenticated Citizens:**
   - All anonymous capabilities
   - SELECT own reports and profile
   - UPDATE own profile

3. **Department Admins:**
   - All citizen capabilities
   - Full CRUD on assigned category data
   - SELECT cross-department data for coordination
   - Module permissions enforced via admin_module_permissions

4. **Superadmins:**
   - Bypass all RLS policies
   - Full access to all tables
   - User management capabilities
   - Audit log access

### Permission Enforcement Layers

**Layer 1: Database RLS Policies**
- Evaluated on every SQL query
- Cannot be bypassed by client code
- Based on auth.uid() and auth.jwt() metadata

**Layer 2: Module Permissions**
- Granular per-module CRUD control
- Stored in admin_module_permissions table
- Enforced client-side with database validation

**Layer 3: Client-Side Guards**
- UI elements hidden if no permission
- Route protection (admin dashboard)
- Fail gracefully if permission denied

---

## Document Version

**Version:** 1.0  
**Generated:** January 4, 2026  
**Based on:** ANALYSIS.md (CLIMA System Comprehensive Code Analysis)

---

**END OF BACKEND SCHEMA DOCUMENT**
