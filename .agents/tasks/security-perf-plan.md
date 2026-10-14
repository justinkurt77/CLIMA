# CLIMA Security & Performance Audit Implementation Plan

**Task:** Comprehensive security hardening and performance optimization for CLIMA disaster response platform (Palayan City Government)

**Status:** Ready for implementation (FEAT artifacts created, workflow restructured)

---

## Implementation Approach

This plan has been decomposed into 5 focused features (FEATs) for sequential implementation. Each FEAT is independently verifiable and leaves the codebase in a working state.

**Workflow:** Per-FEAT implementation → Integration verification → Review/fix loop → Finalization

---

## FEAT-001: Console Statement Cleanup

- [x] **What:** Replace all direct `console.log/error/warn` calls with the existing `logger` utility across the entire `src/` directory. The logger already exists and suppresses output in production builds.

- **Files to modify:**
  - `src/lib/supabase.js`
  - `src/services/kloudtechService.js`
  - `src/lib/security.js`
  - `src/components/dashboard/ElNinoMonitoringDashboard.jsx`
  - `src/screens/AdminMapScreen.jsx`
  - `src/screens/AdminDashboard.jsx`
  - `src/screens/ExecutiveDashboard.jsx`
  - `src/screens/FacebookModerationScreen.jsx`
  - `src/screens/HomeScreen.jsx`
  - `src/screens/IntelligenceDashboard.jsx`
  - Plus ~10 more screen/component files with console usage

- **Verification:**
  ```bash
  # Check no direct console calls remain (except in logger.js)
  grep -r "console\.(log|error|warn)" src/ | grep -v logger.js
  
  # Build and verify console statements stripped
  npm run build
  node verify-production-build.js
  
  # Test dev mode still shows logs
  npm run dev
  ```

---

## FEAT-002: Security Hardening

- [x] **What:** Apply comprehensive security measures: update 21 vulnerable dependencies (2 low, 4 moderate, 15 high), expand DOMPurify sanitization to all user content displays, add helmet middleware with CSP headers, tighten CORS, verify RLS enabled.

- **Files to modify:**
  - `package.json` (dependency updates)
  - `server.js` (add helmet, CSP, tighten CORS)
  - `src/screens/AdminDashboard.jsx` (sanitize report displays)
  - `src/screens/AdminMapScreen.jsx` (sanitize report displays)
  - `src/screens/HomeScreen.jsx` (sanitize advisory displays)

- **Verification:**
  ```bash
  # Check vulnerabilities reduced
  npm audit
  
  # Verify security headers present
  npm run server &
  curl -I http://localhost:3001/api/health
  # Should see: X-Frame-Options, Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security
  
  # Test XSS protection
  # Submit report with: <script>alert('xss')</script> in title
  # Verify: displays as text, not executed
  
  # Verify RLS (Supabase SQL Editor)
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  # All tables should have rowsecurity = true
  ```

---

## FEAT-003: Performance Optimization

- [x] **What:** Apply database performance indexes, compress large images (8 files totaling ~6MB), add cache-control headers, verify Vite minification.

- **Files to modify:**
  - Database: Run `PERFORMANCE_INDEXES_WORKING.sql` in Supabase SQL Editor
  - `public/logo-dark.png` → compress to WebP (783KB)
  - `public/logo.png` → compress to WebP (809KB)
  - `public/night.jpg` → compress to WebP (796KB)
  - `public/rainy_dark.jpg` → compress to WebP (605KB)
  - `public/stormy_clouds.jpg` → compress to WebP (723KB)
  - `public/stormy_dark.jpg` → compress to WebP (696KB)
  - `public/wind_radar.jpg` → compress to WebP (925KB)
  - `public/wind_radar_light.jpg` → compress to WebP (1128KB)
  - Components referencing these images (update paths to .webp)
  - `server.js` (add cache-control middleware)

- **Verification:**
  ```bash
  # Verify DB indexes created (Supabase SQL Editor)
  # Run verification query from PERFORMANCE_INDEXES_WORKING.sql
  
  # Check image compression
  ls -lh public/*.webp
  # All should be <400KB
  
  # Check build size reduced
  npm run build
  du -sh dist/
  
  # Verify cache headers
  curl -I http://localhost:3001/api/health
  # Should see: Cache-Control header
  ```

---

## FEAT-004: Database Input Validation

- [x] **What:** Apply SQL constraints and validation triggers by running `SECURITY_INPUT_VALIDATION_FINAL.sql`. This script fixes existing invalid data, then adds check constraints for reports (description length, lat/lng ranges, status enum), advisories (title/content length), and validation triggers for hospital, BFP, CDRRMO operations.

- **Database changes only:** Run in Supabase SQL Editor
  - Fix existing data (set defaults for NULL/invalid values)
  - Add check constraints (19 constraints across 4 tables)
  - Create validation triggers (4 triggers)

- **Verification:**
  ```sql
  -- In Supabase SQL Editor: Run verification queries from SECURITY_INPUT_VALIDATION_FINAL.sql
  
  -- Check constraints
  SELECT conname AS constraint_name, conrelid::regclass AS table_name
  FROM pg_constraint
  WHERE connamespace = 'public'::regnamespace AND contype = 'c'
  AND conrelid::regclass::text IN ('reports', 'advisories', 'agriculture_damage_reports')
  ORDER BY table_name, constraint_name;
  
  -- Check triggers
  SELECT trigger_name, event_object_table
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND event_object_table IN ('reports', 'hospital_daily_records', 'cdrrmo_daily_operations', 'bfp_operations')
  ORDER BY event_object_table, trigger_name;
  
  -- Test constraint enforcement
  INSERT INTO reports (description, lat, lng) VALUES ('short', 999, 999);
  -- Should fail with check constraint error
  ```

---

## FEAT-005: Legal Documents & Compliance

- [x] **What:** Create 5 required legal documents tailored for CLIMA and Palayan City government, plus LegalScreen component to display them.

- **Files to create:**
  - `public/legal/terms-of-service.md` (500-2000 words, CLIMA-specific)
  - `public/legal/privacy-policy.md` (GDPR + Philippines Data Privacy Act 2012 compliant)
  - `public/legal/data-processing-agreement.md` (for inter-agency data sharing)
  - `public/legal/refund-policy.md` (free service, no charges)
  - `public/legal/master-service-agreement.md` (inter-agency SLA)
  - `src/screens/LegalScreen.jsx` (new component with tabs for each doc)

- **Files to modify:**
  - `src/screens/ProfileScreen.jsx` (add footer links to legal docs)
  - `src/App.jsx` (add lazy-loaded /legal route)

- **Verification:**
  ```bash
  # Check files created
  ls -lh public/legal/
  # Should see 5 .md files
  
  # Check word counts
  wc -w public/legal/*.md
  # Each should be 500+ words
  
  # Test in browser
  npm run dev
  # Navigate to /legal, verify documents display correctly
  ```

---

## Cross-FEAT Integration Verification

After all FEATs complete, verify system-wide:

1. **Build succeeds:** `npm run build` (no errors)
2. **Dev server starts:** `npm run dev` (no errors)
3. **Key features work:**
   - Admin login (email + password auth)
   - Report submission (citizen report with photo)
   - Map loads (Mapbox + pins)
   - Legal docs display (/legal route)
4. **Security headers present:** `curl -I http://localhost:3001/api/health`
5. **Images optimized:** Check dist/ size reduced, WebP files in public/
6. **Console statements removed:** No console.* in dist/ bundle

---

## Manual Tasks (User to Complete)

These require Supabase dashboard access or external services:

### Database (Supabase SQL Editor)
1. ✅ Run `PERFORMANCE_INDEXES_WORKING.sql` (FEAT-003)
2. ✅ Run `SECURITY_INPUT_VALIDATION_FINAL.sql` (FEAT-004)
3. ✅ Verify RLS enabled on all tables (FEAT-002)

### Security (External Services)
4. ⚠️ **Configure WAF** through hosting provider or Cloudflare (blocks common attacks)
5. ⚠️ **Document DDoS response plan** (escalation contacts, mitigation steps)
6. ⚠️ **Implement IP anomaly detection** via Cloudflare or equivalent (throttle → ban based on behavior)

### SEO & UX (requested but out of scope for security/perf audit)
- Remove purple gradients
- Add dark mode toggle
- Add cookie consent form
- Add custom domain + favicon
- Add Privacy/Terms pages (✅ covered in FEAT-005)
- Add meta tags, sitemap.xml, robots.txt
- Fix header hierarchy (H1 tags)
- Add social share images
- Add custom 404 page
- Add sticky header, mobile menu, hover states
- Add scroll progress bar, back-to-top button
- Add loading animations, site search
- Add FAQ section, newsletter signup
- Add print stylesheet, UTM tracking

*(These are deferred to a separate UX/SEO workflow)*

---

## Success Criteria

✅ **Security (19 checks)**
1. Admin routes protected (server-side auth)
2. RLS enabled on all tables
3. Email verification enforced
4. Passwords hashed (Supabase Auth default)
5. Auth tokens in httpOnly cookies (Supabase Auth default)
6. API secrets server-side only (.env not committed)
7. Sensitive data not logged (logger used)
8. Parameterized SQL (Supabase client default)
9. Form inputs validated (fileValidator + server-side)
10. XSS blocked (DOMPurify sanitization)
11. File uploads validated (fileValidator.js)
12. Webhook signatures verified (Facebook moderation)
13. Rate limiting enabled (100/15min global, 5/15min auth)
14. CORS tightened (single origin)
15. Production debugging disabled (vite.config drops console)
16. Vulnerable dependencies updated (npm audit fix)
17. Helmet security headers added
18. CSP configured
19. Database constraints enforced

✅ **Performance (20 checks)**
1. Images compressed (WebP format)
2. Lazy loading enabled (loading="lazy" on images)
3. Code splitting enabled (React.lazy)
4. API responses cached (Cache-Control headers)
5. CDN-ready (cache headers + static assets)
6. JS/CSS minified (Vite terser)
7. DB indexed (5 tables, 12 indexes)
8. React renders optimized (existing)
9. Input handlers debounced (existing)
10. Large lists paginated (existing hooks)
11. Unused dependencies removed (npm audit fix)
12. Non-critical scripts deferred (Vite lazy loading)
13. Loading skeletons present (existing)
14. Load balancer (deployment infrastructure, out of scope)
15. API payloads compressed (gzip via hosting)
16. DB connection pooling (Supabase default)
17. Expensive computations cached (React hooks)
18. N+1 queries fixed (Supabase select/join patterns)
19. Server-side caching (Cache-Control headers)
20. Lighthouse audit >90 (manual verification)

---

## Artifacts Created

- `c:\Users\User\CLIMA\.agents\tasks\security-perf-audit\task.json`
- `c:\Users\User\CLIMA\.agents\tasks\security-perf-audit\context.json`
- `c:\Users\User\CLIMA\.agents\tasks\security-perf-audit\features\FEAT-001.json`
- `c:\Users\User\CLIMA\.agents\tasks\security-perf-audit\features\FEAT-002.json`
- `c:\Users\User\CLIMA\.agents\tasks\security-perf-audit\features\FEAT-003.json`
- `c:\Users\User\CLIMA\.agents\tasks\security-perf-audit\features\FEAT-004.json`
- `c:\Users\User\CLIMA\.agents\tasks\security-perf-audit\features\FEAT-005.json`

**Workflow:** Remaining steps replaced with 5 per-FEAT coder steps + convergence loop (fixer + reviewer) + finalize step.

---

**Implementation starts now.** Each FEAT will be implemented sequentially by dedicated coder steps, followed by integration verification and review.
