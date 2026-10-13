# CLIMA Implementation Plan

## Project Status Overview

**Project Phases:** 12/12 Complete (100%)  
**Feature Completion:** 95% production-ready  
**Critical Security Issues:** 2 (CORS, .env exclusion)  
**Performance Gaps:** 5 (caching, pagination, debouncing, indexing, rate limiting)

---

## Completed Features

### Phase 1: Backend Foundation ✅
- Supabase PostgreSQL setup (25 tables)
- Row Level Security (RLS) policies on all tables
- User authentication (email/password via Supabase Auth)
- Role-based access control (user, admin, superadmin)
- Audit logging system (triggers on key tables)
- Activity logging for user actions

### Phase 2: Administrative Portal ✅
- Admin login screen with password reset
- 12-tab admin dashboard with sidebar navigation
- Department-specific theming (accent colors)
- Module permissions system
- Admin map screen with report filtering
- First-time password change enforcement

### Phase 3: Official Advisories ✅
- Advisory creation and publishing workflow
- Status lifecycle (Draft → Pending → Published → Archived)
- Scheduled publishing capability
- Severity levels (low, medium, high, critical)
- Citizen advisory display on home screen
- Department-specific advisories

### Phase 4: Facebook Integration (Database Complete, UI Not Activated) ⚠️
- Database schema complete (facebook_pages, facebook_keywords, facebook_moderation_queue)
- FacebookModerationScreen.jsx component exists
- NOT activated in admin dashboard tabs
- Requires Facebook Graph API integration

### Phase 5: Hospital Monitoring ✅
- Hospital registry with location data
- Daily heat-related case entry (heat stroke, heat exhaustion, dehydration)
- Admin dashboard table with CRUD operations
- Citizen El Niño dashboard display
- Real-time data sync via Supabase subscriptions

### Phase 6: CDRRMO Operations ✅
- CDRRMO operation types (dispatch, evacuation, relief)
- Personnel and vehicle tracking
- Families affected tracking
- Evacuation center registry with capacity tracking
- Admin dashboard CRUD interface
- Citizen El Niño dashboard display

### Phase 7: BFP Operations ✅
- Fire incident tracking (wildfire, structure_fire, rescue)
- Fire alarm level tracking (1-5)
- Trucks and personnel deployment tracking
- Property damage estimates
- Fire station registry
- Admin dashboard CRUD interface
- Citizen El Niño dashboard display (wildfire filter)

### Phase 8: Water Utility Module ✅
- Water interruption scheduling per barangay
- Affected areas (sitio/purok) tracking
- Tanker deployment flag
- Water facility registry (pumping stations, reservoirs, treatment plants)
- Admin dashboard scheduling interface
- Citizen El Niño dashboard schedule display

### Phase 9: Power Utility Module ✅
- Power outage scheduling per barangay
- Feeder linkage (NEECO grid)
- Estimated restoration time tracking
- Power feeder registry
- Admin dashboard scheduling interface
- Citizen El Niño dashboard schedule display

### Phase 10: GIS Expansion ✅
- 11-layer interactive map (Mapbox GL JS)
- Layer controls panel with toggles
- Custom markers per layer type
- Clustering for report pins
- Mapbox geocoding search
- Layer visibility persistence

### Phase 11: Inter-Agency Intelligence ✅
- Automated conflict detection system
- Alert types (utility_conflict, hospital_dependency, power_cascade)
- Severity levels (low, medium, high, critical)
- Intelligence dashboard for superadmins
- Alert acknowledgment and resolution workflow
- Affected agencies tracking

### Phase 12: Reporting & Analytics ✅
- Executive dashboard with multi-agency KPIs
- Time-series charts (Recharts: area, bar, pie)
- Date range filters
- PDF export (jspdf + jspdf-autotable)
- CSV export via JavaScript blob download
- Real-time data refresh

### Citizen Features ✅
- Mobile-first PWA with service worker
- Weather dashboard with barangay selection (Open-Meteo API)
- KloudTech weather station integration
- 4-step incident report submission (category, details, location, success)
- Photo upload with compression and watermarking
- Guest and authenticated reporting
- Emergency hotlines directory
- El Niño monitoring dashboard (6 sections)
- Dark mode toggle
- Responsive UI (mobile bottom nav, desktop sidebar)
- Map screen with 11 toggleable layers

---

## In-Progress / Incomplete Items

### 1. Facebook Integration UI (Phase 4)
**Status:** Database ready, UI component exists but not activated  
**Required:**
- Activate FacebookModerationScreen.jsx in AdminDashboard tabs
- Implement Facebook Graph API webhook receiver
- Add keyword detection logic
- Test post-to-report conversion flow

### 2. Email Verification Enforcement
**Status:** Email verification configured but auto-confirmed for admins  
**Issue:** server.js sets `email_confirm: true` when creating admins (line 69)  
**Required:**
- Set `email_confirm: false` in admin creation
- Send email verification link via Supabase Auth
- Enforce email verification in Supabase Dashboard settings

### 3. Pagination Implementation
**Status:** Missing on all data tables  
**Impact:** Performance degradation with 1000+ records  
**Required:**
- Implement LIMIT/OFFSET queries with Supabase
- Add pagination UI (page numbers, prev/next buttons)
- Target tables: reports, advisories, hospital_daily_records, operations tables

### 4. API Response Caching
**Status:** No caching layer implemented  
**Impact:** Excessive API calls, slower load times  
**Required:**
- Integrate React Query or SWR
- Cache GET requests with automatic refetch
- Invalidate cache on mutations
- Set cache TTL (5 minutes recommended)

### 5. Input Debouncing
**Status:** No debouncing on search inputs  
**Impact:** API calls on every keystroke  
**Required:**
- Add lodash.debounce or custom hook
- Apply to barangay search, location search, report filtering
- 300ms delay recommended

---

## Planned / Next Steps

### Short-Term (Pre-Deployment)

#### 1. Fix Critical Security Issues
- **Priority:** CRITICAL
- **Tasks:**
  - Add `.env` to .gitignore (currently missing)
  - Restrict CORS to production domain only (currently allows all origins)
  - Move KloudTech API credentials to server-side proxy
  - Add rate limiting middleware (express-rate-limit)
  - Enable email verification enforcement
- **Timeline:** 1 day

#### 2. Add Database Indexes
- **Priority:** HIGH
- **Tasks:**
  - Create indexes on created_at, status, category columns
  - Test query performance before/after
  - Monitor slow query logs in Supabase
- **Timeline:** 2 hours

#### 3. Implement Pagination
- **Priority:** HIGH
- **Tasks:**
  - Add pagination to all data tables (reports, advisories, operations)
  - Default page size: 20 records
  - Add loading states during page changes
- **Timeline:** 1 day

#### 4. Add Loading Skeletons
- **Priority:** MEDIUM
- **Tasks:**
  - Replace "Loading..." text with skeleton components
  - Use Tailwind CSS for shimmer animations
  - Apply to card grids, tables, forms
- **Timeline:** 4 hours

#### 5. Run Lighthouse Audit
- **Priority:** MEDIUM
- **Tasks:**
  - Deploy to staging environment
  - Run Lighthouse audit on all key screens
  - Fix issues with Performance Score < 90
  - Fix issues with Accessibility Score < 90
- **Timeline:** 1 day

---

### Medium-Term (Post-Deployment)

#### 6. Implement API Caching
- **Priority:** HIGH
- **Tasks:**
  - Integrate React Query
  - Migrate Supabase queries to React Query hooks
  - Add cache invalidation logic
  - Monitor cache hit rate
- **Timeline:** 3 days

#### 7. Add Server-Side Validation
- **Priority:** MEDIUM
- **Tasks:**
  - Expand server.js validation for all endpoints
  - Validate report submissions (required fields, data types)
  - Validate advisory content (XSS prevention)
  - Add input sanitization
- **Timeline:** 2 days

#### 8. Activate Facebook Integration
- **Priority:** LOW
- **Tasks:**
  - Set up Facebook App in Meta Developer Console
  - Configure webhook URL in server.js
  - Implement webhook signature verification
  - Activate FacebookModerationScreen.jsx in AdminDashboard
  - Test end-to-end flow
- **Timeline:** 3 days

#### 9. Implement Offline Queue
- **Priority:** LOW
- **Tasks:**
  - Add IndexedDB storage for offline reports
  - Queue reports when offline
  - Sync queue when connection restored
  - Show queue status in UI
- **Timeline:** 2 days

#### 10. Add Push Notifications
- **Priority:** LOW
- **Tasks:**
  - Implement service worker push notification handler
  - Add Supabase Edge Function for notification dispatch
  - Allow users to subscribe/unsubscribe
  - Test on iOS and Android
- **Timeline:** 3 days

---

## Critical Issues Found During Analysis

### Security Issues (by priority)

#### CRITICAL

**1. .env File NOT Excluded from Git**
- **File:** .gitignore (line 15 has typo: `# Environment variabless*`)
- **Missing:** `.env`, `.env.local`, `.env.production`
- **Risk:** API keys and secrets committed to repository
- **Remediation:**
  ```bash
  echo "" >> .gitignore
  echo "# Environment variables" >> .gitignore
  echo ".env" >> .gitignore
  echo ".env.local" >> .gitignore
  echo ".env.production" >> .gitignore
  git rm --cached .env (if already committed)
  ```

**2. CORS Allows All Origins**
- **File:** server.js (line 14)
- **Issue:** `app.use(cors());` allows requests from any domain
- **Risk:** API abuse, CSRF attacks
- **Remediation:**
  ```javascript
  app.use(cors({
    origin: process.env.VITE_APP_URL,
    credentials: true
  }));
  ```

#### WARNING

**3. KloudTech API Credentials Exposed to Client**
- **File:** .env
- **Issue:** `VITE_KLOUDTECH_EMAIL`, `VITE_KLOUDTECH_PASSWORD`, `VITE_KLOUDTECH_TOKEN` exposed via VITE_ prefix
- **Risk:** API credentials visible in production bundle
- **Remediation:**
  - Move KloudTech API calls to Express server
  - Create proxy endpoint: GET `/api/weather/telemetry`
  - Store credentials server-side only (remove VITE_ prefix)

**4. No Rate Limiting on API Endpoints**
- **File:** server.js
- **Issue:** No rate limiting middleware
- **Risk:** API abuse, DDoS attacks
- **Remediation:**
  ```javascript
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per IP
  });
  app.use('/api/', limiter);
  ```

**5. Limited Server-Side Input Validation**
- **File:** server.js
- **Issue:** Only email/password validated, no validation for report submissions
- **Risk:** Invalid data insertion, XSS attacks
- **Remediation:**
  - Add express-validator middleware
  - Validate all request bodies
  - Sanitize HTML inputs

#### PARTIAL

**6. Email Verification Bypassed for Admins**
- **File:** server.js (line 69)
- **Issue:** `email_confirm: true` auto-confirms admin emails
- **Risk:** Account takeover if email not verified
- **Remediation:**
  - Set `email_confirm: false`
  - Send verification email via Supabase Auth
  - Require admins to verify email before dashboard access

**7. Client-Side File Upload Validation Only**
- **File:** ReportModal.jsx
- **Issue:** File type/size validated client-side, not server-side
- **Risk:** Malicious file uploads if client-side validation bypassed
- **Remediation:**
  - Add server-side file validation in Supabase Storage policies
  - Enforce max file size (1MB) and allowed types (image/*) via RLS

#### NEEDS_EXTERNAL_VERIFICATION

**8. Vulnerable Dependencies (npm audit)**
- **Action Required:** Run `npm audit` and update packages
- **Timeline:** Weekly during development, monthly in production

**9. Security Scan (Claude Code Security Scan)**
- **Action Required:** Run comprehensive security scan
- **Timeline:** Before deployment

---

### Performance Issues

#### MISSING (High Impact)

**1. API Response Caching**
- **Impact:** Every request hits database/API
- **Solution:** React Query with 5-minute cache TTL

**2. Pagination on Large Lists**
- **Impact:** Fetching 1000+ reports in single query
- **Solution:** LIMIT 20 OFFSET (page-1)*20

**3. Database Indexing on Frequently Queried Columns**
- **Impact:** Slow queries on created_at, status, category
- **Solution:** Add 9 recommended indexes (see BACKEND_SCHEMA.md)

**4. Input Debouncing**
- **Impact:** Barangay search triggers API call per keystroke
- **Solution:** 300ms debounce on all search inputs

**5. Rate Limiting**
- **Impact:** No protection against API abuse
- **Solution:** express-rate-limit middleware (100 req/15min)

#### MISSING (Medium Impact)

**6. Loading Skeletons**
- **Impact:** Poor perceived performance
- **Solution:** Skeleton components with shimmer animation

**7. Server-Side Caching (Redis/In-Memory)**
- **Impact:** Express endpoints hit database on every request
- **Solution:** Redis cache for weather data (5-minute TTL)

**8. API Payload Compression**
- **Impact:** Large JSON responses not compressed
- **Solution:** Express compression middleware

#### PARTIAL (Needs Improvement)

**9. Image Compression**
- **Status:** Implemented client-side (browser-image-compression)
- **Improvement:** Add WebP conversion, better compression settings

**10. N+1 Query Pattern (Minor)**
- **File:** App.jsx (lines 166-177)
- **Issue:** photo_url string splitting in map() callback
- **Solution:** Pre-process photo_url to array before rendering

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Run npm audit and update vulnerable packages**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Add .env to .gitignore and remove from git history**
  ```bash
  echo -e "\n# Environment variables\n.env\n.env.local\n.env.production" >> .gitignore
  git rm --cached .env
  git commit -m "fix: remove .env from git tracking"
  ```

- [ ] **Set all production environment variables in hosting platform**
  - Vercel/Netlify: Add via dashboard
  - Include all VITE_ prefixed vars for frontend
  - Include server-side vars for Express backend

- [ ] **Run all SQL migrations on production database**
  - Execute in order: phase1 → setup → fixes → modules
  - Verify with `SELECT * FROM information_schema.tables;`

- [ ] **Enable email verification in Supabase Dashboard**
  - Authentication → Settings → Enable "Confirm email"
  - Update server.js: `email_confirm: false`

- [ ] **Configure Supabase CORS to production domain only**
  - Supabase Dashboard → Settings → API
  - Add production domain to allowed origins
  - Remove `*` wildcard

- [ ] **Set rate limits on Supabase project**
  - Supabase Dashboard → Settings → Rate Limits
  - Enable rate limiting per IP
  - Set reasonable limits (100 req/min)

- [ ] **Remove/disable all debug console.log statements**
  - Already configured in vite.config.js (purged in build)
  - Manually review server.js for sensitive logs

- [ ] **Enable Supabase realtime for required tables**
  - Database → Replication → Enable for:
    - reports, advisories, hospital_daily_records
    - cdrrmo_operations, bfp_operations, agriculture_damage_reports
    - water_interruptions, power_interruptions

- [ ] **Test RLS policies with anon and authenticated roles**
  ```sql
  SET ROLE anon;
  SELECT * FROM reports; -- Should succeed
  INSERT INTO reports VALUES (...); -- Should succeed
  UPDATE reports SET status='resolved' WHERE id='...'; -- Should fail
  
  SET ROLE authenticated;
  -- Test with mock user_id
  ```

- [ ] **Verify storage bucket policies**
  - Test upload as anon (should fail)
  - Test upload as authenticated (should succeed)
  - Test public read access (should succeed)

---

### Build & Deploy

- [ ] **npm run build — verify no errors**
  ```bash
  npm run build
  # Check for errors in terminal
  # Verify dist/ folder created
  ```

- [ ] **Test production build locally (npm run preview)**
  ```bash
  npm run preview
  # Open http://localhost:4173
  # Test all key user journeys
  ```

- [ ] **Deploy frontend to Vercel/Netlify/hosting**
  - Connect GitHub repo
  - Set build command: `npm run build`
  - Set output directory: `dist`
  - Add environment variables

- [ ] **Deploy Express server (Railway/Heroku/DigitalOcean)**
  - Set start command: `node server.js`
  - Add environment variables (server-side only)
  - Configure PORT (usually 3000 or 8080)

- [ ] **Configure custom domain + SSL**
  - Add domain in hosting dashboard
  - Update DNS records (A/CNAME)
  - Verify SSL certificate issued

- [ ] **Set environment variables on hosting platform**
  - Frontend: All VITE_ vars
  - Backend: SUPABASE_SERVICE_ROLE_KEY, SMTP_USER, SMTP_PASS, PORT

- [ ] **Test OAuth/auth flows on production domain**
  - Test signup → email verification → login
  - Test password reset via OTP
  - Test admin login and role detection

---

### Post-Deployment

- [ ] **Run Lighthouse audit**
  ```bash
  # Chrome DevTools → Lighthouse → Generate report
  # Target: Performance > 90, Accessibility > 90, Best Practices > 90
  ```

- [ ] **Run npm audit**
  ```bash
  npm audit
  # Address any HIGH/CRITICAL vulnerabilities
  ```

- [ ] **Test all user journeys end-to-end**
  - Anonymous citizen: View weather, advisories, map
  - Citizen: Submit report, view my reports
  - Admin: Login, record operations, update report status
  - Superadmin: Manage users, view audit logs

- [ ] **Verify PWA installability**
  - Chrome: Install banner appears
  - iOS Safari: "Add to Home Screen" works
  - Test offline fallback page

- [ ] **Set up error monitoring (Sentry recommended)**
  - Create Sentry project
  - Add Sentry SDK to frontend and backend
  - Configure error reporting
  - Test with intentional error

- [ ] **Set up uptime monitoring (UptimeRobot/Pingdom)**
  - Monitor frontend URL (every 5 minutes)
  - Monitor backend health endpoint (every 5 minutes)
  - Configure email/SMS alerts

---

## Maintenance Plan

### Weekly
- **Review Supabase logs for errors or unauthorized access attempts**
  - Supabase Dashboard → Logs → Check for 401/403/500 errors
  - Review audit_logs table for suspicious activity
  - Check activity_logs for unusual patterns

- **Check report queue — ensure no unreviewed reports >48h old**
  ```sql
  SELECT * FROM reports 
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '48 hours';
  ```

### Monthly
- **npm audit — update vulnerable dependencies**
  ```bash
  npm audit
  npm update
  npm audit fix
  git commit -m "chore: update dependencies"
  ```

- **Review user feedback and bug reports**
  - Check support email/form submissions
  - Prioritize bugs by severity
  - Add to issue tracker

- **Test PWA update delivery**
  - Deploy small change
  - Verify service worker updates automatically
  - Test on installed PWA instances

### Quarterly
- **Full Lighthouse performance audit**
  - Run on all key screens
  - Compare with baseline scores
  - Address regressions

- **Review and rotate API keys**
  - Generate new Supabase anon key (if needed)
  - Rotate SMTP password
  - Update Mapbox token
  - Update in hosting platform env vars

- **Database performance review (slow query log)**
  - Supabase Dashboard → Performance Insights
  - Identify slow queries (>500ms)
  - Add missing indexes
  - Optimize query patterns

- **Accessibility audit**
  - Test with screen reader (NVDA/JAWS)
  - Test keyboard navigation
  - Verify color contrast with Axe DevTools
  - Fix WCAG 2.1 AA violations

---

## Recommended Next Features

Based on gap analysis from code review:

### 1. Automated Report Assignment
**Description:** Auto-assign reports to admins based on category  
**Benefit:** Faster response times, clear accountability  
**Effort:** 2 days  
**Tables:** Add `assigned_to` column to reports table

### 2. SMS Notifications
**Description:** Send SMS alerts for critical advisories  
**Benefit:** Reach citizens without internet access  
**Effort:** 3 days  
**Service:** Twilio or Semaphore (Philippines)

### 3. Multi-Language Support (Tagalog + English)
**Description:** i18n for all UI text  
**Benefit:** Accessibility for non-English speakers  
**Effort:** 5 days  
**Library:** react-i18next

### 4. Report Upvoting System (Already in Schema)
**Description:** Allow citizens to upvote reports to indicate prevalence  
**Benefit:** Prioritize high-impact issues  
**Effort:** 1 day  
**Note:** upvotes column exists but not implemented in UI

### 5. Historical Data Visualization
**Description:** Time-series charts for historical operations data  
**Benefit:** Identify trends, seasonal patterns  
**Effort:** 3 days  
**Library:** Recharts (already in stack)

### 6. Export Individual Report as PDF
**Description:** Download single report as PDF with photos  
**Benefit:** Print-friendly reports for field teams  
**Effort:** 2 days  
**Library:** jspdf (already in stack)

### 7. Admin Mobile App (React Native)
**Description:** Dedicated admin mobile app for field operations  
**Benefit:** Record operations without laptop  
**Effort:** 15 days  
**Note:** Reuse existing Supabase backend

### 8. Citizen Report Status Tracking
**Description:** Email/SMS notification when report status changes  
**Benefit:** Transparency, citizen engagement  
**Effort:** 2 days  
**Service:** Nodemailer (already in stack)

### 9. Heat Map Layer (Incident Density)
**Description:** Visualize incident density per barangay  
**Benefit:** Identify high-risk areas  
**Effort:** 3 days  
**Library:** Mapbox GL JS heatmap layer

### 10. Voice Recording for Reports
**Description:** Allow audio description instead of text  
**Benefit:** Accessibility for low-literacy users  
**Effort:** 4 days  
**Library:** Web Audio API + Supabase Storage

---

## Testing Strategy

### Recommended Unit Tests

**Priority Functions to Test:**
1. `utils/compression.js` — Image compression logic
2. `utils/geocoding.js` — Reverse geocoding
3. `utils/permissions.js` — hasPermission() helper
4. `utils/dateFormatters.js` — Date formatting
5. `utils/validators.js` — Form validation helpers

**Framework:** Jest + React Testing Library

### Recommended Integration Tests

**Priority Flows to Test:**
1. **Report Submission Flow:**
   - Select category → enter details → upload photo → select location → submit
   - Verify report appears in database
   - Verify photo uploaded to storage

2. **Admin Login Flow:**
   - Enter credentials → verify role → redirect to dashboard
   - Verify session persists on reload

3. **Advisory Publishing Flow:**
   - Create draft → publish → verify appears on citizen home screen

4. **RLS Policy Enforcement:**
   - Test as anon user → verify can read but not update
   - Test as admin → verify can update assigned categories only

**Framework:** Playwright or Cypress

### Manual QA Checklist

**Per-Feature Test Scenarios:**

#### Citizen Report Submission
- [ ] Submit as guest (no login)
- [ ] Submit as authenticated user
- [ ] Upload 1 photo
- [ ] Upload 3 photos (max)
- [ ] Try to upload 4 photos (should fail)
- [ ] Try to upload non-image file (should fail)
- [ ] Submit without description (should fail)
- [ ] Submit with <10 character description (should fail)
- [ ] Verify report appears on map immediately
- [ ] Verify photo thumbnails load

#### Admin Dashboard
- [ ] Login as superadmin → verify all tabs visible
- [ ] Login as department admin → verify only assigned tabs visible
- [ ] Try to access tab without permission → verify access denied
- [ ] Update report status → verify citizen sees update on map
- [ ] Create advisory → verify appears on citizen home screen
- [ ] Record CDRRMO operation → verify appears in El Niño dashboard

#### El Niño Dashboard
- [ ] Verify all 6 sections load data
- [ ] Verify "No data" states when tables empty
- [ ] Verify real-time updates when admin adds data
- [ ] Verify water/power interruption schedules display correctly

#### Map Screen
- [ ] Toggle all 11 layers on/off
- [ ] Click report pin → verify popup shows correct data
- [ ] Click facility marker → verify popup shows correct data
- [ ] Search for location → verify map flies to result
- [ ] Verify clustering works with 50+ reports

#### PWA Installation
- [ ] Install on Android Chrome → verify icon and splash screen
- [ ] Install on iOS Safari → verify icon appears on home screen
- [ ] Test offline → verify fallback page appears
- [ ] Test service worker update → verify new version loads

---

## Document Version

**Version:** 1.0  
**Generated:** January 4, 2026  
**Based on:** ANALYSIS.md (CLIMA System Comprehensive Code Analysis)  
**Production Readiness:** 95% (pending security/performance fixes)

---

**END OF IMPLEMENTATION PLAN DOCUMENT**
