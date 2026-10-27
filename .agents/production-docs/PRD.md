# CLIMA Production Requirements Document (PRD)

**Version:** 1.0  
**Date:** January 8, 2026  
**Project:** CLIMA - Climate Information Monitoring & Alert Platform  
**Location:** Palayan City, Nueva Ecija, Philippines

---

## Executive Summary

### Purpose
CLIMA (Climate Information Monitoring and Awareness) is a comprehensive disaster response and utility monitoring platform serving Palayan City. The system integrates real-time weather monitoring, multi-agency emergency coordination, incident reporting, and El Niño impact tracking into a unified Progressive Web Application.

### Goals
1. **Public Safety:** Enable citizens to report incidents and receive emergency alerts
2. **Agency Coordination:** Facilitate multi-agency disaster response (CDRRMO, BFP, Hospitals)
3. **Data Transparency:** Provide real-time visibility of utility interruptions and agricultural damages
4. **Situational Awareness:** Monitor El Niño impacts across health, agriculture, and infrastructure
5. **Resource Optimization:** Enable data-driven decision making for city officials

### Target Users
- **Citizens** (19 barangays, ~45,000 population): Report incidents, view weather, access hotlines
- **Emergency Responders** (CDRRMO, BFP): Track operations, manage dispatches
- **Hospital Staff**: Monitor heat-related cases
- **Agriculture Officers**: Track crop damages and livestock losses
- **Utility Managers**: Schedule and communicate interruptions
- **City Officials**: Access analytics and executive dashboards
- **ICT Superadmins**: System administration and user management

---

## User Roles

### Role Matrix

| Role | Authentication | Capabilities |
|------|---------------|--------------|
| **Anonymous Citizen** | None | View weather, advisories, map; cannot submit reports |
| **Authenticated Citizen** | Email/Password | Submit reports, view personal report history, customize profile |
| **Category Admin** | Email/Password + Admin Role | Manage reports/data in assigned categories only |
| **Department Admin** | Email/Password + Admin Role | Manage all categories within their department |
| **Superadmin** | Email/Password + Superadmin Flag | Full system access, user management, audit logs |

---

## Feature List by Phase

### ✅ Phase 1: Foundation (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F1.1: User Authentication
- **User Story:** As a citizen, I want to create an account so I can submit incident reports
- **Acceptance Criteria:**
  - Email/password registration
  - Email verification (optional enforcement)
  - Login with session persistence
  - Password reset via email OTP
  - Profile customization (first name, last name, phone, avatar)
- **Implementation:** Supabase Auth + AuthScreen.jsx + ProfileScreen.jsx

#### F1.2: Supabase Integration
- **User Story:** As a developer, I need a backend database that supports real-time updates
- **Acceptance Criteria:**
  - PostgreSQL database with PostGIS extension
  - Row Level Security (RLS) enabled on all tables
  - Real-time subscriptions for live data
  - Storage bucket for photo uploads
- **Implementation:** @supabase/supabase-js v2.104.1

#### F1.3: Role-Based Access Control (RBAC)
- **User Story:** As an admin, I want different permission levels for different users
- **Acceptance Criteria:**
  - Roles: Citizen, Admin, Superadmin
  - Category-level permissions (admin can be restricted to specific categories)
  - Module-level permissions (view/create/edit/delete granularity)
  - Superadmin bypass all restrictions
- **Implementation:** Hardcoded superadmin hashes + profiles.role + admin_module_permissions table

---

### ✅ Phase 2: Administrative Portal (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F2.1: Admin Dashboard
- **User Story:** As an admin, I want a centralized console to manage all data
- **Acceptance Criteria:**
  - 12-tab interface (Overview, Reports, Advisories, Hospital, CDRRMO, BFP, Agriculture, Water, Power, Users, Offices, Logs)
  - Department-branded theme (accent color from department)
  - KPI cards, recent activity, charts
  - Responsive design (mobile + desktop)
- **Implementation:** AdminDashboard.jsx (2000+ lines)

#### F2.2: User Management (Superadmin Only)
- **User Story:** As a superadmin, I want to create admin accounts and assign roles
- **Acceptance Criteria:**
  - CRUD operations on users
  - Role assignment (admin vs citizen)
  - Category assignment (restrict admin to specific categories)
  - Force password change on first login
  - Deactivate/reactivate users
- **Implementation:** Users tab in AdminDashboard.jsx

#### F2.3: Permission Matrix (Superadmin Only)
- **User Story:** As a superadmin, I want granular control over what each admin can do
- **Acceptance Criteria:**
  - Module-level permissions (12 modules)
  - Action-level permissions (view/create/edit/delete)
  - Permission inheritance (superadmin always has all permissions)
- **Implementation:** admin_module_permissions table + hasPermission() helper

#### F2.4: Activity Logs (Superadmin Only)
- **User Story:** As a superadmin, I want to audit all admin actions
- **Acceptance Criteria:**
  - Log all CRUD operations (who, what, when, which record)
  - Searchable and filterable
  - Export to CSV
- **Implementation:** Activity Logs tab (partial - admin_audit_logs table exists)

---

### ✅ Phase 3: Official Advisories (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F3.1: Advisory Creation
- **User Story:** As an admin, I want to create public advisories
- **Acceptance Criteria:**
  - Title, content, category (General/Heat/Flood/Typhoon/Other)
  - WYSIWYG editor or markdown support
  - Scheduled publishing (publish_date)
  - Draft → Pending → Published workflow
- **Implementation:** Official Advisories tab in AdminDashboard.jsx

#### F3.2: Advisory Approval Workflow
- **User Story:** As a superadmin, I want to review advisories before publication
- **Acceptance Criteria:**
  - Draft state (author only can see)
  - Pending state (awaiting approval)
  - Published state (public)
  - Unpublished state (retracted)
  - Approval requires superadmin or authorized role
- **Implementation:** status field + lifecycle controls

#### F3.3: Citizen Advisory Display
- **User Story:** As a citizen, I want to see the latest official advisories on the home screen
- **Acceptance Criteria:**
  - Real-time updates (Supabase realtime subscription)
  - Expandable card design
  - Category badge (color-coded)
  - Timestamp (published date)
- **Implementation:** HomeScreen.jsx advisories section + ElNinoMonitoringDashboard.jsx

---

### ✅ Phase 4: Facebook Integration (Partial)
**Priority:** Should-Have | **Status:** ⚠️ Schema Complete, UI Not Activated

#### F4.1: Keyword Detection System
- **User Story:** As an admin, I want to automatically detect disaster-related posts on Facebook
- **Acceptance Criteria:**
  - Webhook endpoint receives Facebook Graph API events
  - Keyword matching (configurable list: "baha", "sunog", "aksidente", etc.)
  - Store matched posts in facebook_posts table
  - Auto-flag for moderation
- **Implementation:** supabase_phase4.sql schema exists, webhook endpoint not deployed

#### F4.2: Moderation Queue
- **User Story:** As an admin, I want to review flagged posts before creating incident reports
- **Acceptance Criteria:**
  - List of posts requiring review
  - Preview post content, images, location
  - Actions: Approve → Create Report, Reject → Ignore
  - Track moderation decisions
- **Implementation:** FacebookModerationScreen.jsx exists but not linked in navigation

---

### ✅ Phase 5: Hospital Module (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F5.1: Heat-Related Case Monitoring
- **User Story:** As a hospital admin, I want to log daily heat-related cases
- **Acceptance Criteria:**
  - Record date, hospital name
  - Case counts: Heat Stroke, Heat Exhaustion, Dehydration, Respiratory
  - Total bed capacity, available beds
  - Notes field
- **Implementation:** Hospital Monitoring tab in AdminDashboard.jsx

#### F5.2: Hospital Analytics Dashboard
- **User Story:** As a city official, I want to see heat case trends
- **Acceptance Criteria:**
  - 7-day trend line chart
  - Total cases by type
  - Capacity utilization percentage
  - Historical data (30-day, 90-day views)
- **Implementation:** AdminDashboard.jsx Overview tab + ElNinoMonitoringDashboard.jsx

---

### ✅ Phase 6: CDRRMO Operations (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F6.1: Dispatch Tracking
- **User Story:** As a CDRRMO dispatcher, I want to log emergency operations
- **Acceptance Criteria:**
  - Operation date, type (Rescue/Evacuation/Relief/Medical), status
  - Location (barangay or free text)
  - Number of people affected, evacuees, rescued
  - Response time
  - Units deployed (personnel count)
  - Notes and recommendations
- **Implementation:** CDRRMO Operations tab in AdminDashboard.jsx

#### F6.2: Evacuation Center Management
- **User Story:** As a CDRRMO officer, I want to track active evacuation centers
- **Acceptance Criteria:**
  - Center name, location, capacity
  - Current occupancy
  - Available resources (food, water, medical)
  - Status (Active/Inactive)
- **Implementation:** Database schema exists (evacuation_centers table), UI pending

---

### ✅ Phase 7: BFP Operations (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F7.1: Fire Incident Management
- **User Story:** As a BFP officer, I want to log fire incidents and responses
- **Acceptance Criteria:**
  - Operation date, type (Fire/Wildfire/Rescue/Training/Other)
  - Location, status (Ongoing/Controlled/Resolved)
  - Fire out time, alarm level
  - Estimated damage (PHP), area affected (hectares for wildfires)
  - Casualties (injuries, fatalities)
  - Units deployed (fire trucks, personnel)
- **Implementation:** BFP Operations tab in AdminDashboard.jsx

#### F7.2: Wildfire Tracking (El Niño Focus)
- **User Story:** As a city official, I want to monitor wildfire activity during El Niño
- **Acceptance Criteria:**
  - Filter operations by type = "Wildfire"
  - Track area affected in hectares
  - Status dashboard (Active/Controlled/Resolved counts)
  - Integration with El Niño dashboard
- **Implementation:** ElNinoMonitoringDashboard.jsx BFP section

---

### ✅ Phase 8: Water Utility Module (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F8.1: Water Interruption Scheduling
- **User Story:** As a water utility manager, I want to announce scheduled interruptions
- **Acceptance Criteria:**
  - Interruption date and time
  - Provider (Palayan City Water District / Balibago Waterworks)
  - Affected barangays (comma-separated or multiselect)
  - Cause (Pipe Burst/Maintenance/Shortage/Pump Failure/Other)
  - Duration (hours), households affected
  - Status (Scheduled/Ongoing/Restored)
  - Description/notes
- **Implementation:** Water Utility tab in AdminDashboard.jsx

#### F8.2: Citizen Water Interruption View
- **User Story:** As a citizen, I want to see upcoming water interruptions in my barangay
- **Acceptance Criteria:**
  - Filter by barangay
  - Show scheduled and ongoing interruptions
  - Display date, time, duration, cause
  - Real-time updates
- **Implementation:** ElNinoMonitoringDashboard.jsx Interruptions section

---

### ✅ Phase 9: Power Utility Module (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F9.1: Power Outage Scheduling
- **User Story:** As a power utility manager, I want to announce scheduled outages
- **Acceptance Criteria:**
  - Same fields as water interruptions (date, time, provider, barangays, cause, duration, status)
  - Cause options: Maintenance/Equipment Failure/Weather/Other
  - Estimated restoration time
- **Implementation:** Power Utility tab in AdminDashboard.jsx

#### F9.2: Citizen Power Outage View
- **User Story:** As a citizen, I want to see upcoming power outages in my barangay
- **Acceptance Criteria:**
  - Same display as water interruptions
  - Combined view (water + power in one section)
- **Implementation:** ElNinoMonitoringDashboard.jsx Interruptions section

---

### ✅ Phase 10: GIS Expansion (Complete)
**Priority:** Must-Have | **Status:** ✅ Complete

#### F10.1: Interactive Map with 11 Layers
- **User Story:** As a citizen/admin, I want to visualize spatial data on a map
- **Acceptance Criteria:**
  - Base layer: Mapbox Streets
  - 11 toggleable layers:
    1. Barangay Boundaries (GeoJSON polygons)
    2. Citizen Reports (clustered markers)
    3. Hospitals (4 facilities with bed capacity)
    4. Fire Stations (BFP stations)
    5. Evacuation Centers
    6. Water Facilities (pumping stations, reservoirs)
    7. Power Infrastructure (feeders)
    8. Hotels (tourism layer)
    9. Restaurants (tourism layer)
    10. Tourist Attractions
    11. Weather Stations (KloudTech IoT sensors)
  - Layer control panel (collapsible)
  - Marker clustering for performance
- **Implementation:** MapScreen.jsx + LayerControls.jsx

#### F10.2: Incident Heatmap
- **User Story:** As a city official, I want to see incident density across the city
- **Acceptance Criteria:**
  - Color-coded heatmap (red = high density)
  - Filter by category, date range
  - Toggle on/off
- **Implementation:** Partial - clustering provides visual density, true heatmap pending

---

### ✅ Phase 11: Inter-Agency Intelligence (Complete)
**Priority:** Should-Have | **Status:** ✅ Complete

#### F11.1: Utility Conflict Detection
- **User Story:** As a coordinator, I want to know when power/water outages overlap
- **Acceptance Criteria:**
  - Detect concurrent interruptions (same date/time/barangay)
  - Alert notification
  - Display in intelligence dashboard
- **Implementation:** Database functions (detect_concurrent_interruptions) + IntelligenceDashboard.jsx

#### F11.2: Hospital Dependency Monitoring
- **User Story:** As a CDRRMO officer, I want to know if a hospital loses power/water
- **Acceptance Criteria:**
  - Cross-reference hospital locations with utility interruptions
  - Auto-alert when dependency detected
  - Display affected hospitals with capacity info
- **Implementation:** Database functions + conflict_alerts table

---

### ✅ Phase 12: Reporting & Analytics (Complete)
**Priority:** Should-Have | **Status:** ✅ Complete

#### F12.1: Executive Dashboard
- **User Story:** As a city official, I want high-level analytics and KPIs
- **Acceptance Criteria:**
  - Date range filtering (7/30/90/365 days)
  - Charts: Heat index trends, incident trends, fire analytics, utility analytics
  - KPI cards: Total reports, active incidents, response time averages
  - Export to PDF (with charts)
  - Export to CSV (raw data)
- **Implementation:** ExecutiveDashboard.jsx

#### F12.2: El Niño Impact Dashboard
- **User Story:** As a citizen, I want to see El Niño-related impacts in one place
- **Acceptance Criteria:**
  - 6 sections: Advisories, Hospital Heat Cases, Wildfire Response, CDRRMO Operations, Agricultural Damages, Utility Interruptions
  - Real-time data updates
  - 7-day trend charts
  - Accessible from citizen navigation (mobile + desktop)
- **Implementation:** ElNinoMonitoringDashboard.jsx

---

## Functional Requirements

### FR-001: Weather Dashboard
**Priority:** Must-Have  
**Status:** ✅ Complete  
**Description:** Display real-time weather conditions for Palayan City and all 19 barangays  
**Components:**
- Live temperature, humidity, wind speed, pressure, UV index
- Heat index calculation (NOAA formula)
- 8-hour hourly forecast
- 7-day weekly forecast
- Barangay-specific weather (dropdown selector)
- Integration with KloudTech IoT weather sensors
- Fallback to Open-Meteo API if sensors offline

### FR-002: Incident Reporting
**Priority:** Must-Have  
**Status:** ✅ Complete  
**Description:** Enable citizens to submit geo-tagged incident reports  
**Workflow:**
1. User must be authenticated (email verification optional)
2. Step 1: Select category (Flood/Fire/Landslide/Accident/Medical/Other)
3. Step 2: Describe incident, upload photo (compressed to 200KB, max 1 photo)
4. Step 3: Pick location on map (drag center pin or use GPS)
5. Step 4: Submit → Report created with status "Pending"
6. Email notification sent to assigned admin (if category has assigned department)

### FR-003: Real-Time Data Sync
**Priority:** Must-Have  
**Status:** ✅ Complete  
**Description:** All clients receive live updates without manual refresh  
**Implementation:**
- Supabase Realtime subscriptions on:
  - `advisories` table (new advisories appear on HomeScreen)
  - `reports` table (admin sees new reports instantly)
  - `hospital_daily_records` (dashboard updates)
  - Other operational tables
- Reconnection handling on network loss

### FR-004: Mobile-First PWA
**Priority:** Must-Have  
**Status:** ✅ Complete  
**Description:** Progressive Web App installable on mobile devices  
**Features:**
- Service worker with offline support
- App manifest (icon, splash screen, theme color)
- Add to Home Screen prompt
- 90+ Lighthouse PWA score (target)
- Responsive breakpoint: 1024px (mobile < 1024, desktop >= 1024)

### FR-005: Admin Report Moderation
**Priority:** Must-Have  
**Status:** ✅ Complete  
**Description:** Admins can review, update, and resolve citizen reports  
**Actions:**
- View report details (description, photo, location, timestamp, submitter)
- Update status (Pending → In Progress → Resolved)
- Update status label (custom text for citizens)
- Add admin notes (internal only)
- Delete report (soft delete or hard delete)
- Filter by category, status, date range
- Export to CSV

---

## Non-Functional Requirements

### NFR-001: Performance
- **Target:** Page load < 3 seconds on 3G
- **Target:** Time to Interactive (TTI) < 5 seconds
- **Target:** First Contentful Paint (FCP) < 2 seconds
- **Strategy:**
  - Code splitting (React.lazy for admin/map screens)
  - Image compression (browser-image-compression)
  - Vite build optimization (minification, tree-shaking)
  - Mapbox GL marker clustering (reports layer)
  - Debounce search inputs (300ms)
  - Pagination for large lists (50 items per page)

### NFR-002: Security
- **Requirement:** Protect against OWASP Top 10 vulnerabilities
- **Implementation:**
  - Row Level Security (RLS) on all Supabase tables
  - Parameterized queries (Supabase client does this by default)
  - Input validation (HTML sanitization, file type checks)
  - XSS protection (React escapes by default, DOMPurify for HTML content)
  - CSRF protection (Supabase session tokens)
  - Rate limiting (Supabase built-in, 1000 req/min per IP)
  - HTTPS only (enforced by hosting)
  - Environment variables in .env (not in Git)

### NFR-003: Accessibility
- **Target:** WCAG 2.1 Level AA compliance
- **Strategy:**
  - Semantic HTML (nav, main, section, article)
  - ARIA labels on interactive elements
  - Keyboard navigation support
  - Focus management (modals trap focus)
  - Color contrast ratio >= 4.5:1 (text on background)
  - Screen reader tested (manual testing required)

### NFR-004: Browser Support
- **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Android 90+
- **Note:** No IE11 support (uses ES6+ features)

### NFR-005: Uptime & Reliability
- **Target:** 99.5% uptime (monthly)
- **Strategy:**
  - Supabase Realtime reconnection on disconnect
  - Error boundaries (React ErrorBoundary component)
  - Fallback UI for failed data loads
  - Toast notifications for user feedback

### NFR-006: Scalability
- **Capacity:** Support 10,000 concurrent users (city population ~45,000)
- **Strategy:**
  - Supabase connection pooling (PgBouncer)
  - Indexed database queries (see BACKEND_SCHEMA.md)
  - CDN for static assets (Vercel/Netlify/Cloudflare)
  - Lazy loading images and map tiles

### NFR-007: Data Retention
- **Policy:**
  - Reports: 2 years (archive or delete after)
  - Advisories: Indefinite (historical record)
  - Operational data (hospital, CDRRMO, BFP): 2 years
  - Audit logs: 1 year
  - User accounts: Inactive > 1 year → deactivate

---

## Out of Scope (Future Enhancements)

### Planned but Not Implemented
1. **SMS Notifications** - Bulk SMS for critical advisories
2. **Mobile Native Apps** - iOS/Android apps (PWA sufficient for now)
3. **Multi-Language Support** - English + Tagalog (currently English only)
4. **Voice Commands** - Accessibility feature for visually impaired
5. **Offline Mode** - Full offline support (currently requires internet)
6. **AI-Powered Insights** - Predictive analytics, anomaly detection
7. **Blockchain Audit Trail** - Immutable log for sensitive operations
8. **Drone Integration** - Aerial imagery overlay on map
9. **IoT Sensor Network** - City-wide sensor deployment (currently only KloudTech partnership)

### Explicitly Not Supported
1. **Payment Processing** - No financial transactions
2. **E-Commerce** - No marketplace features
3. **Social Networking** - No user-to-user messaging (one-way reporting only)
4. **Third-Party Integrations** - No Zapier, IFTTT, etc.

---

## Success Metrics

### Adoption Metrics
- **Target:** 5,000 registered users in first 6 months
- **Target:** 500 incident reports submitted in first 3 months
- **Target:** 80% of citizens aware of platform (survey)

### Engagement Metrics
- **Target:** 60% monthly active users (return within 30 days)
- **Target:** Average session duration > 3 minutes
- **Target:** 70% of reports include photos

### Operational Metrics
- **Target:** Average response time (Pending → In Progress) < 30 minutes during business hours
- **Target:** 90% of reports resolved within 48 hours
- **Target:** Zero security incidents (unauthorized access, data breach)

### Technical Metrics
- **Target:** 95%+ Lighthouse Performance score
- **Target:** 90%+ Lighthouse PWA score
- **Target:** < 1% error rate (exceptions / total requests)
- **Target:** 99.5% uptime (measured monthly)

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Project Owner** | Palayan City ICT Division | __________ | __________ |
| **Product Manager** | __________ | __________ | __________ |
| **Technical Lead** | __________ | __________ | __________ |
| **QA Lead** | __________ | __________ | __________ |

---

**Document Version History:**
- v1.0 (Jan 8, 2026) - Initial PRD based on comprehensive code analysis
