# CLIMA Technical Requirements Document

## Technology Stack

### Frontend Core

#### UI Framework
- **react** v19.2.0 — Core UI library
- **react-dom** v19.2.0 — DOM rendering engine
- **framer-motion** v12.34.3 — Declarative animations and page transitions

#### State Management
- **React Context API** — Theme management (dark mode toggle)
- **React Hooks** — Component-level state (useState, useEffect, useMemo, useCallback)
- No external state library (Redux, Zustand, etc.)

---

### Backend & Database

#### Backend-as-a-Service (BaaS)
- **@supabase/supabase-js** v2.104.1 — PostgreSQL database + Authentication + Storage + Realtime subscriptions
  - **Database:** PostgreSQL 15+ (managed)
  - **Auth:** Supabase Auth (email/password, bcrypt hashing)
  - **Storage:** S3-compatible object storage for images
  - **Realtime:** WebSocket subscriptions for live data updates

#### Express Server (Backend API)
- **express** v5.3.0 — HTTP server for custom endpoints
- **cors** v2.8.6 — Cross-Origin Resource Sharing middleware
- **body-parser** v2.3.0 — Request body parsing (JSON, URL-encoded)
- **dotenv** v17.4.2 — Environment variable loader
- **nodemailer** v10.1.0 — Email service (Gmail SMTP for OTP delivery)

---

### Maps & Geospatial

#### Mapping Library
- **mapbox-gl** v3.18.1 — WebGL-based interactive maps
- **react-map-gl** v8.1.0 — React wrapper for Mapbox GL JS
- **@mapbox/mapbox-gl-geocoder** v5.1.2 — Location search and reverse geocoding

#### Purpose
- Interactive GIS map with 11 toggleable layers
- Citizen report pins with clustering
- Facility markers (hospitals, fire stations, evacuation centers)
- Location picker for incident reporting

---

### Data Visualization

#### Charting Library
- **recharts** v3.10.1 — React-based chart library for executive dashboard
  - Area charts (reports per day)
  - Bar charts (cases per category)
  - Pie charts (status distribution)

---

### Image & File Processing

#### Client-Side Processing
- **browser-image-compression** v2.0.2 — Image compression before upload (reduces bandwidth, improves performance)
- **jspdf** v4.2.1 — PDF generation for executive reports
- **jspdf-autotable** v5.0.8 — Table generation for PDF exports
- **pptxgenjs** v4.0.1 — PowerPoint presentation generation (planned feature)

---

### UI Components & Styling

#### CSS Framework
- **tailwindcss** v4.2.4 — Utility-first CSS framework
- **@tailwindcss/vite** v4.2.4 — Tailwind integration for Vite
- **postcss** v8.5.14 — CSS post-processor
- **autoprefixer** v10.5.0 — Automatic vendor prefixing for CSS

#### Component Primitives
- **@radix-ui/react-slot** v1.2.4 — Slot component for composable UI primitives

#### Icons
- **lucide-react** v0.575.0 — Icon library (686+ icons, tree-shakeable)

#### Utilities
- **class-variance-authority** v0.7.1 — Type-safe CSS variant management
- **clsx** v2.1.1 — Conditional className utility
- **tailwind-merge** v3.5.0 — Merge Tailwind classes without conflicts

---

### Build & Development Tools

#### Build Tool
- **vite** v7.3.1 — Next-generation frontend build tool (ESBuild-based)
- **@vitejs/plugin-react** v5.1.1 — React Fast Refresh + JSX transform for Vite

#### PWA Support
- **vite-plugin-pwa** v1.2.0 — Progressive Web App manifest and service worker generation

#### Process Management
- **concurrently** v10.0.6 — Run multiple npm scripts in parallel (dev server + Express server)

---

### Code Quality Tools

#### Linting
- **eslint** v9.39.1 — JavaScript/React code linter
- **@eslint/js** v9.39.1 — ESLint core JavaScript rules
- **eslint-plugin-react-hooks** v7.0.1 — React Hooks linting rules
- **eslint-plugin-react-refresh** v0.4.24 — React Fast Refresh linting rules

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIMA System                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  Citizen PWA     │◄──────►│  Admin PWA       │          │
│  │  (React SPA)     │        │  (React SPA)     │          │
│  └────────┬─────────┘        └────────┬─────────┘          │
│           │                           │                     │
│           ▼                           ▼                     │
│  ┌─────────────────────────────────────────────┐           │
│  │         Supabase Client Library             │           │
│  │  (Direct connection, RLS-protected)         │           │
│  └──────────────┬──────────────────────────────┘           │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────────────────────┐          │
│  │         Supabase Backend (BaaS)              │          │
│  │  • PostgreSQL 15 (25+ tables)                │          │
│  │  • Row Level Security (RLS)                  │          │
│  │  • Supabase Auth (email/password)            │          │
│  │  • Supabase Storage (S3-compatible)          │          │
│  │  • Realtime (WebSocket subscriptions)        │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │      Express.js Server (server.js)           │          │
│  │  • Admin user creation                       │          │
│  │  • Password reset (OTP via email)            │          │
│  │  • Nodemailer (Gmail SMTP)                   │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  External APIs:                                             │
│  • Mapbox (maps, geocoding)                                 │
│  • KloudTech SEA IoT (weather telemetry)                    │
│  • Open-Meteo (barangay weather forecasts)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

**Type:** Single-Page Application (SPA)  
**Routing:** State-based (no React Router) via `activeScreen` state in App.jsx  
**Component Pattern:** Functional components with hooks  
**Data Flow:** Unidirectional (props down, events up)  
**Code Splitting:** React.lazy() for MapScreen, AdminDashboard, AdminMapScreen, AdminLogin

---

## Authentication Architecture

### Provider
**Supabase Auth** — Managed authentication service

### Flow
1. **User Registration/Login:**
   - Email + password submitted to `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()`
   - Supabase returns session with JWT access token
   - Session stored in HTTP-only cookies (secure by default, no localStorage exposure)

2. **Session Persistence:**
   - `supabase.auth.getSession()` on App.jsx mount (line 101)
   - `supabase.auth.onAuthStateChange()` listener for real-time session updates (line 110)

3. **Role Determination:**
   - **Superadmin:** Detected via SHA-256 hash of email OR `user.user_metadata.role === 'superadmin'`
   - **Admin:** `user.user_metadata.role === 'admin'`
   - **Assigned Categories:** `user.user_metadata.assigned_categories` (array)
   - **Fallback:** Check `profiles.role` if metadata not set

4. **Protected Routes:**
   - Admin routes check `isAdminAuthenticated` state
   - If false, render AdminLogin screen
   - After login, `checkAdminAuth()` verifies role and restores session

### Session Storage Method
- **Storage:** HTTP-only cookies (Supabase default, not accessible via JavaScript)
- **Security:** Prevents XSS token theft
- **Alternative:** `localStorage` can be configured but NOT RECOMMENDED

### Role Storage
- **Primary:** `auth.users.raw_user_meta_data.role` (set by server.js via service role key)
- **Mirror:** `profiles.role` (synced via trigger or manual update)
- **Admin Department:** Looked up from first assigned category → `categories.department_id` → `departments.name`

---

## Database Architecture

### Database Provider
**Supabase PostgreSQL 15+** (managed cloud database)

### Schema Design Philosophy
- **Normalization:** 3NF (third normal form) with foreign key constraints
- **Audit Trail:** Automatic logging via triggers on key tables
- **Security:** Row Level Security (RLS) on all tables
- **Timestamping:** `created_at` (timestamptz) on all tables, `updated_at` where applicable

### Table Count
**25 tables + 1 storage bucket**

### RLS Approach
- **Enabled on all tables**
- **Anonymous users:** SELECT on published/public data only (advisories, reports, operations data)
- **Authenticated users:** SELECT own data + INSERT reports
- **Admins:** Full CRUD on assigned category data
- **Superadmins:** Bypass all policies (full access)

### Realtime Subscriptions
- **reports table:** Live updates for admin dashboards
- **advisories table:** Live updates for citizen home screen
- **hospital_daily_records, cdrrmo_operations, bfp_operations, etc.:** Live updates for El Niño dashboard

---

## API Integration Architecture

### 1. Supabase API
**Base URL:** `process.env.VITE_SUPABASE_URL`  
**Authentication:** `process.env.VITE_SUPABASE_ANON_KEY` (client-side)  
**Service Role Key:** `process.env.SUPABASE_SERVICE_ROLE_KEY` (server-side only)

**Access Pattern:**
- **Client-side:** Direct connection via `@supabase/supabase-js` client
- **Security:** RLS policies enforce access control at database level
- **Operations:** All CRUD operations, auth, storage uploads, realtime subscriptions

---

### 2. KloudTech SEA IoT API
**Base URL:** `https://api.kloudtechsea.com/api/v1`  
**Authentication:** JWT Bearer token

**Key Management:**
- **Credentials:** Stored in `.env` as `VITE_KLOUDTECH_EMAIL`, `VITE_KLOUDTECH_PASSWORD` (⚠️ WARNING: exposed to client)
- **Token:** Obtained via POST `/auth/login`, stored in `localStorage.getItem('kloudtech_token')`
- **Alternative:** `VITE_KLOUDTECH_TOKEN` can be hardcoded (also exposed to client)

**Endpoints Used:**
- GET `/telemetry/dashboard` — Real-time weather station data
- GET `/station/active/simple` — List of active weather stations

**Access Pattern:**
- **Client-side** (kloudtechService.js)
- **Fallback:** Hardcoded Popolon AWS station data if API fails

**⚠️ SECURITY ISSUE:** Credentials exposed via VITE_ prefix. Should be proxied through Express server.

---

### 3. Mapbox API
**Token:** `process.env.VITE_MAPBOX_TOKEN`  
**Services:**
- **Mapbox GL JS:** Map rendering (vector tiles)
- **Mapbox Geocoding API:** Reverse geocoding (lat/lng → address)

**Access Pattern:**
- **Client-side** (MapScreen.jsx, AdminMapScreen.jsx, report location picker)
- **Security:** Acceptable for client-side use with URL restrictions in Mapbox dashboard

---

### 4. Open-Meteo API
**Base URL:** `https://api.open-meteo.com/v1/forecast`  
**Authentication:** None (public API)

**Parameters:**
- latitude, longitude
- current, hourly, daily weather variables

**Access Pattern:**
- **Client-side** (HomeScreen.jsx for barangay weather forecasts)
- **No rate limiting observed** (acceptable for low-volume use)

---

### 5. Express Backend API (server.js)
**Base URL:** `http://localhost:3001/api` (PORT configurable via env)

**Endpoints:**
1. **GET `/health`** — Health check
2. **POST `/admin/create`** — Create admin user (body: email, full_name, assigned_categories, assigned_department)
3. **POST `/auth/forgot-password`** — Send OTP email (body: email)
4. **POST `/auth/reset-password`** — Verify OTP and reset password (body: email, otp, newPassword)
5. **POST `/auth/change-password`** — Change password (body: userId, newPassword)

**Authentication:** Uses `SUPABASE_SERVICE_ROLE_KEY` for privileged operations

**Email Service:**
- **Provider:** Gmail SMTP via Nodemailer
- **Credentials:** `SMTP_USER`, `SMTP_PASS`

---

## Environment Variables

### Client-Side (VITE_ prefix — exposed to frontend bundle)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (e.g., https://xxx.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key (safe for client) |
| `VITE_MAPBOX_TOKEN` | Mapbox public access token |
| `VITE_KLOUDTECH_API_BASE` | KloudTech API base URL |
| `VITE_KLOUDTECH_EMAIL` | ⚠️ KloudTech login email (should be server-side) |
| `VITE_KLOUDTECH_PASSWORD` | ⚠️ KloudTech login password (should be server-side) |
| `VITE_KLOUDTECH_TOKEN` | ⚠️ KloudTech JWT token (should be server-side) |
| `VITE_APP_URL` | Public URL of the deployed app (for OAuth redirects) |

### Server-Side (no VITE_ prefix — server.js only)

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (full database access, bypasses RLS) |
| `SMTP_USER` | Gmail account for sending emails |
| `SMTP_PASS` | Gmail app password (not regular password) |
| `PORT` | Express server port (default: 3001) |

---

## PWA Configuration

### Service Worker Strategy
**Plugin:** vite-plugin-pwa  
**Strategy:** `registerType: 'autoUpdate'` (automatic service worker updates)

### Configuration (vite.config.js)
```javascript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'mapbox-cache',
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      }
    ]
  },
  manifest: {
    name: 'CLIMA - Palayan City',
    short_name: 'CLIMA',
    description: 'Climate Information Monitoring and Awareness',
    theme_color: '#f97316',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
})
```

### Offline Capabilities
- **App Shell:** Cached for offline access
- **Static Assets:** Cached (JS, CSS, images)
- **API Requests:** No offline support (require network)
- **Fallback:** Offline page shown when no network

---

## Deployment Architecture

### Frontend Deployment
**Build Tool:** Vite  
**Build Command:** `npm run build`  
**Output:** `dist/` folder (static HTML/CSS/JS)

**Recommended Hosting:**
- **Vercel** (automatic Git integration, edge CDN)
- **Netlify** (similar features, alternative)
- **GitHub Pages** (free, manual deploy)

**Build Optimizations:**
- JS/CSS minification (ESBuild)
- Tree-shaking (remove unused code)
- Code splitting (React.lazy)
- Console.log purging in production

---

### Backend Deployment
**Server:** Express.js (server.js)  
**Runtime:** Node.js 18+

**Recommended Hosting:**
- **Heroku** (easy Node.js hosting)
- **Railway** (modern Heroku alternative)
- **DigitalOcean App Platform** (managed Node.js)
- **AWS EC2** (self-managed)

**Required Environment Variables:** See "Server-Side" section above

---

### Database Deployment
**Managed Service:** Supabase (cloud-hosted PostgreSQL)  
**No self-hosting required**

**Setup Steps:**
1. Create Supabase project
2. Run all SQL migration files in order:
   - `supabase_phase1.sql`
   - `supabase_setup.sql`
   - `FIX_DATABASE_SCHEMA.sql`
   - `FIX_PUBLIC_RLS_POLICIES.sql`
   - `FIX_SET_USER_ROLE_FINAL.sql`
   - `CREATE_ADMIN_BYPASS_EMAIL.sql`
   - `FIX_ASSIGNED_DEPARTMENT_DISPLAY.sql`
   - Module-specific SQL files (hospital, cdrrmo, bfp, agriculture, etc.)
3. Enable Supabase Auth email provider
4. Enable Supabase Storage bucket: `reports`
5. Enable Supabase Realtime on required tables

---

## Development Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Git
- Text editor (VS Code recommended)
- Supabase account

### Installation
```bash
git clone <repository-url>
cd CLIMA
npm install
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in all required environment variables
3. Run database migrations in Supabase SQL Editor

### Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Dev Frontend** | `npm run dev` | Start Vite dev server (port 5173) |
| **Dev Server** | `npm run dev:server` | Start Express server (port 3001) |
| **Dev All** | `npm run dev:all` | Run both concurrently |
| **Build** | `npm run build` | Build for production (output: dist/) |
| **Preview** | `npm run preview` | Preview production build locally |
| **Lint** | `npm run lint` | Run ESLint on src/ |

### Development Workflow
1. Run `npm run dev:all` to start both servers
2. Open browser to `http://localhost:5173`
3. Edit files in `src/` — Vite hot-reloads automatically
4. Admin panel accessible at `http://localhost:5173/admin`

---

## Technology Choices Rationale

### Why React 19?
- Latest stable release with improved performance
- Built-in concurrent rendering
- Simplified useEffect behavior
- Strong ecosystem and community support

### Why Vite over Create React App?
- 10-100x faster dev server startup
- Instant Hot Module Replacement (HMR)
- Native ES modules (no Webpack bundling in dev)
- Smaller production bundles via Rollup

### Why Supabase over Firebase?
- PostgreSQL (relational) vs Firestore (NoSQL) — better for complex queries
- Row Level Security (RLS) built-in at database level
- Open-source (can self-host if needed)
- Real-time subscriptions without additional cost
- More cost-effective at scale

### Why Mapbox over Google Maps?
- More affordable pricing for public sector
- Better WebGL performance
- Customizable vector tile styling
- Open street map data option

### Why No React Router?
- Simple state-based routing meets app needs
- Reduces bundle size (~50KB saved)
- Easier to implement mobile bottom nav
- URL routing not required (SPA with modals)

---

## Known Technical Debt

### High Priority
1. **CORS Configuration:** `cors()` allows all origins (line 14, server.js) — must restrict to production domain
2. **Rate Limiting:** No rate limiting on Express endpoints — add `express-rate-limit` middleware
3. **KloudTech API Proxy:** Credentials exposed via VITE_ prefix — move to server-side proxy
4. **Database Indexes:** Missing indexes on frequently queried columns (created_at, status, category)

### Medium Priority
5. **API Caching:** No React Query or SWR — every request hits API
6. **Pagination:** No pagination on large lists — will impact performance with 1000+ reports
7. **Input Debouncing:** Search inputs trigger on every keystroke — add debounce
8. **Server-Side Validation:** Limited validation in server.js — expand for all endpoints

### Low Priority
9. **Unused Dependencies:** `pptxgenjs` and `body-parser` may be unused — audit with depcheck
10. **Loading Skeletons:** No shimmer/skeleton loaders — improve perceived performance

---

## Document Version

**Version:** 1.0  
**Generated:** January 4, 2026  
**Based on:** ANALYSIS.md (CLIMA System Comprehensive Code Analysis)  
**Production Readiness:** 95% (pending security/performance fixes)

---

**END OF TECHNICAL REQUIREMENTS DOCUMENT**
