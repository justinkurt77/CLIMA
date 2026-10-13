# Security Fixes Implementation Plan

## Overview
This plan addresses 3 critical security fixes for the CLIMA system: production logging cleanup, file upload validation, and server-side input validation. Based on codebase analysis, the system currently uses esbuild's `pure` option which only marks console calls for removal but doesn't guarantee elimination. File uploads lack MIME type and magic byte validation. Input validation is client-side only with no database-level constraints.

## Console Statement Files Found
The following files contain console.log/error/warn statements:
- server.js (10 instances)
- src/services/kloudtechService.js (10 instances)
- src/lib/security.js (1 instance)
- src/screens/AdminMapScreen.jsx (2 instances)
- src/screens/AdminLogin.jsx (4 instances)
- src/App.jsx (5 instances)
- src/screens/FacebookModerationScreen.jsx (3 instances)
- src/components/dashboard/ElNinoMonitoringDashboard.jsx (5 instances)
- src/screens/HomeScreen.jsx (5 instances)
- src/components/ui/ErrorBoundary.jsx (1 instance)
- src/screens/AdminDashboard.jsx (6+ instances)
- src/screens/ProfileScreen.jsx (1 instance - in truncated section)

**Total: 50+ console statements across 12+ files**

---

## Fix 1: Logger Utility + Strip Console in Production

### Rationale
Current vite.config.js uses esbuild's `pure` option which only marks console calls as side-effect-free but doesn't guarantee removal. For reliable production console removal, we need terser minifier with explicit `drop_console: true`. A logger utility provides environment-aware logging that can be controlled at build time.

### Implementation Steps

- [ ] 1. Create logger utility with environment-aware logging
      Files: c:\Users\User\CLIMA\src\lib\logger.js
      What: Create logger module with log(), warn(), error(), debug() methods that check import.meta.env.MODE and only output in development
      Verify: Run `npm run dev` and confirm logger outputs; run `npm run build` and verify build succeeds

- [ ] 2. Replace console statements in server.js
      Files: c:\Users\User\CLIMA\server.js
      What: Replace 10 console.log/error instances with logger calls (note: server.js runs in Node, so use process.env.NODE_ENV instead of import.meta.env)
      Verify: Run `npm run server` and confirm server starts with logger output

- [ ] 3. Replace console statements in service layer
      Files: c:\Users\User\CLIMA\src\services\kloudtechService.js, c:\Users\User\CLIMA\src\lib\security.js
      What: Replace all console calls (11 total) with logger.log/warn/error
      Verify: Run `npm run dev` and test KloudTech integration on map screen

- [ ] 4. Replace console statements in screen components
      Files: 
      - c:\Users\User\CLIMA\src\screens\AdminMapScreen.jsx (2 instances)
      - c:\Users\User\CLIMA\src\screens\AdminLogin.jsx (4 instances)
      - c:\Users\User\CLIMA\src\screens\FacebookModerationScreen.jsx (3 instances)
      - c:\Users\User\CLIMA\src\screens\HomeScreen.jsx (5 instances)
      - c:\Users\User\CLIMA\src\screens\AdminDashboard.jsx (6+ instances)
      - c:\Users\User\CLIMA\src\screens\ProfileScreen.jsx (1 instance)
      What: Replace all console.log/error/warn calls with logger equivalents (21+ instances)
      Verify: Run `npm run dev` and navigate through admin and client flows, verify no console errors

- [ ] 5. Replace console statements in remaining components
      Files:
      - c:\Users\User\CLIMA\src\App.jsx (5 instances)
      - c:\Users\User\CLIMA\src\components\dashboard\ElNinoMonitoringDashboard.jsx (5 instances)
      - c:\Users\User\CLIMA\src\components\ui\ErrorBoundary.jsx (1 instance)
      What: Replace all remaining console calls (11 instances)
      Verify: Run `npm run dev` and test El Niño dashboard, trigger error boundary

- [ ] 6. Update vite.config.js to use terser with drop_console
      Files: c:\Users\User\CLIMA\vite.config.js
      What: Change build.minify from 'esbuild' to 'terser', add terserOptions with compress.drop_console: true, compress.drop_debugger: true, remove esbuild.pure config
      Verify: Run `npm run build`, then check dist bundle with text search for "console.log" - should find zero matches

- [ ] 7. Create production build verification script
      Files: c:\Users\User\CLIMA\verify-production-build.js
      What: Node script that searches dist/**/*.js for console.log/error/warn patterns and exits with error if any found
      Verify: Run `npm run build && node verify-production-build.js` - should pass with no console statements found

---

## Fix 2: File Upload MIME Validation

### Rationale
Current file upload in Step2DetailsForm.jsx and ProfileScreen.jsx only checks file extension via accept="image/*". This is insufficient as extensions can be spoofed. Need magic byte validation via file-type package plus server-side RLS policies in Supabase Storage.

### Implementation Steps

- [ ] 1. Install file-type package for magic byte validation
      Files: c:\Users\User\CLIMA\package.json
      What: Run `npm install file-type@19.0.0` (v19 is latest ESM-only version compatible with Vite)
      Verify: Check package.json dependencies includes file-type, run `npm run dev` to confirm no import errors

- [ ] 2. Create file validation utility module
      Files: c:\Users\User\CLIMA\src\lib\fileValidator.js
      What: Create validateImageFile(file) async function that checks: (1) extension against whitelist ['.jpg', '.jpeg', '.png', '.webp', '.heic'], (2) MIME type from file.type against ['image/jpeg', 'image/png', 'image/webp', 'image/heic'], (3) magic bytes via fileTypeFromBlob() from file-type package, (4) file size < 10MB. Return { valid: boolean, error?: string }
      Verify: Create unit test file or manual test that validates good/bad image files

- [ ] 3. Add validation to Step2DetailsForm photo upload
      Files: c:\Users\User\CLIMA\src\components\ui\report/Step2DetailsForm.jsx, c:\Users\User\CLIMA\src\components\ui\report\PhotoCard.jsx
      What: In PhotoCard.jsx onChange handler, iterate through e.target.files and call validateImageFile() for each before creating preview. Show error message if validation fails. Set max 4 photos, max 10MB total
      Verify: Run `npm run dev`, attempt to upload: valid jpg (should work), renamed .txt to .jpg (should fail), oversized image (should fail)

- [ ] 4. Add validation to ProfileScreen avatar upload
      Files: c:\Users\User\CLIMA\src\screens\ProfileScreen.jsx
      What: In handleAvatarChange function, call validateImageFile() before setAvatarFile(). Show error state if validation fails. Limit to single file, 5MB max
      Verify: Run `npm run dev`, login, go to Customize Profile, attempt to upload valid/invalid avatar files

- [ ] 5. Create Supabase Storage RLS policies SQL
      Files: c:\Users\User\CLIMA\SECURITY_STORAGE_POLICIES.sql
      What: Create SQL script with policies for 'reports' storage bucket: (1) Enable RLS on storage.objects, (2) INSERT policy: authenticated users can upload to avatars/* and reports/*, restrict file size via pg_column_size() < 10485760 (10MB), (3) SELECT policy: public read on reports/*, authenticated read on avatars/*, (4) UPDATE/DELETE policy: users can only modify their own uploads via user_id check
      Verify: Apply SQL in Supabase dashboard, test upload/read permissions from client

- [ ] 6. Add server-side file validation endpoint
      Files: c:\Users\User\CLIMA\server.js
      What: Add POST /api/validate-upload endpoint that receives file metadata (mimetype, size, extension) and returns validation result. This provides defense-in-depth if client validation is bypassed
      Verify: Test endpoint with curl/Postman, verify it rejects invalid files

---

## Fix 3: Server-Side Input Validation SQL

### Rationale
Current validation is client-side only via React form validation. Malicious actors can bypass client validation and submit directly to Supabase. Need PostgreSQL trigger functions and CHECK constraints to enforce data integrity at database level. Also need DOMPurify to prevent XSS in report/advisory display.

### Implementation Steps

- [ ] 1. Create database validation triggers SQL script
      Files: c:\Users\User\CLIMA\SECURITY_INPUT_VALIDATION.sql
      What: Create SQL with:
      - CHECK constraints on reports table: description length 10-5000 chars, category IN (valid list from CATEGORY_GROUPS), status IN ('pending', 'inprogress', 'resolved'), latitude BETWEEN -90 AND 90, longitude BETWEEN -180 AND 180
      - CHECK constraints on advisories table: title length 3-200 chars, content length 10-10000 chars, severity IN ('low', 'medium', 'high', 'critical'), status IN ('draft', 'active', 'expired')
      - CHECK constraints on hospital_daily_records: el_nino_cases >= 0, available_beds >= 0, available_beds <= total_bed_capacity
      - CHECK constraints on water_interruptions: affected_households >= 0, duration_hours >= 0, status IN ('scheduled', 'ongoing', 'completed')
      - CHECK constraints on power_interruptions: affected_households >= 0, duration_hours >= 0, status IN ('scheduled', 'ongoing', 'completed')
      - Trigger function validate_report_before_insert() that runs additional business logic validation
      Verify: Apply SQL, attempt to INSERT invalid data via Supabase SQL editor - should fail with constraint violation

- [ ] 2. Create validation trigger for reports table
      Files: c:\Users\User\CLIMA\SECURITY_INPUT_VALIDATION.sql (continued)
      What: Add BEFORE INSERT/UPDATE trigger on reports that validates: (1) full_name is not empty if user_id is null (guest reports), (2) contact info matches phone pattern if provided, (3) photo_urls array has max 4 elements, (4) location string is not empty
      Verify: Test INSERT with valid/invalid report data in Supabase SQL editor

- [ ] 3. Install and configure DOMPurify for XSS prevention
      Files: c:\Users\User\CLIMA\package.json
      What: Run `npm install dompurify @types/dompurify isomorphic-dompurify` for client-side sanitization
      Verify: Check package.json, run `npm run dev` to confirm no import errors

- [ ] 4. Add DOMPurify sanitization to ReportCard display
      Files: c:\Users\User\CLIMA\src\components\ui\ReportCard.jsx
      What: Import DOMPurify, wrap report.title, report.category, report.location in DOMPurify.sanitize() before rendering. Use sanitize(text, { ALLOWED_TAGS: [] }) to strip all HTML
      Verify: Create test report with XSS payload `<script>alert('xss')</script>` in title via Supabase, verify it renders as plain text in client

- [ ] 5. Add DOMPurify sanitization to advisory displays
      Files: c:\Users\User\CLIMA\src\components\dashboard\ElNinoMonitoringDashboard.jsx
      What: Find all advisory content rendering (title, description), wrap in DOMPurify.sanitize() with ALLOWED_TAGS: ['b', 'i', 'u', 'br'] to allow safe formatting
      Verify: Insert advisory with HTML in Supabase, verify safe tags render and script tags are stripped

- [ ] 6. Add sanitization to MapPopupContent
      Files: c:\Users\User\CLIMA\src\components\map\MapPopupContent.jsx
      What: Sanitize all user-generated content displayed in map popups (report description, location, full_name)
      Verify: View reports on map, inspect DOM to confirm no unescaped HTML

- [ ] 7. Create database validation documentation
      Files: c:\Users\User\CLIMA\SECURITY_INPUT_VALIDATION_README.md
      What: Document all validation rules, constraint names, how to add new validations, and troubleshooting guide for constraint violations
      Verify: Review documentation for completeness

---

## Verification Commands

### After Fix 1 (Logger):
```bash
npm run build
node verify-production-build.js
# Should output: "✅ Production build verified: No console statements found"
```

### After Fix 2 (File Upload):
```bash
npm run dev
# Test in browser:
# 1. Submit report with valid jpg - should work
# 2. Rename malware.txt to malware.jpg, attempt upload - should fail with "Invalid file type"
# 3. Upload 15MB image - should fail with "File too large"
```

### After Fix 3 (Input Validation):
```sql
-- Run in Supabase SQL editor:
-- Should fail with constraint violation
INSERT INTO reports (description, category, status, latitude, longitude) 
VALUES ('x', 'InvalidCategory', 'invalid', 91, 200);

-- Should succeed
INSERT INTO reports (description, category, status, latitude, longitude, full_name, location) 
VALUES ('Valid report description', 'Road Damage', 'pending', 15.5398, 121.0827, 'Test User', 'Palayan City');
```

---

## Dependencies & Prerequisites

### Required npm packages:
- file-type@19.0.0 (for magic byte validation)
- dompurify (for XSS prevention)
- @types/dompurify (TypeScript definitions)
- isomorphic-dompurify (universal DOMPurify)

### Supabase Configuration:
- Database access to create triggers and constraints
- Storage bucket 'reports' must exist with RLS enabled
- Admin privileges to modify storage policies

### Build Tools:
- Node.js v18+ (for server.js and build scripts)
- Vite v7.3.1 (already installed)
- terser support in Vite (built-in, just needs config)

---

## Risk Assessment & Rollback

### Risk: Breaking existing reports/uploads
**Mitigation**: Apply database constraints with `NOT VALID` flag initially, then validate existing data, then validate constraint
**Rollback**: Drop constraints with `ALTER TABLE reports DROP CONSTRAINT constraint_name`

### Risk: File validation too strict, rejecting valid uploads
**Mitigation**: Start with permissive whitelist, monitor logs for false positives
**Rollback**: Temporarily disable fileValidator checks, revert to accept="image/*"

### Risk: DOMPurify breaking legitimate formatted content
**Mitigation**: Use ALLOWED_TAGS for advisory content that needs formatting
**Rollback**: Remove DOMPurify.sanitize() wrappers, React escapes by default anyway

---

## Implementation Order Rationale

1. **Fix 1 first** because it's non-breaking and improves debugging during Fixes 2-3
2. **Fix 2 second** because it's isolated to upload flows and easier to test
3. **Fix 3 last** because database constraints require careful migration and affect entire system

Each fix is independently deployable and can be verified in isolation.

---

## Security Checklist Verification

After all fixes applied:

- [x] **#9 Keep sensitive data out of logs**: Logger utility prevents production console output
- [x] **#10 Use parameterized SQL queries**: Already using Supabase client (parameterized by default)
- [x] **#11 Validate form inputs**: Database constraints + triggers
- [x] **#12 Block cross-site scripting**: DOMPurify sanitization
- [x] **#13 Validate file uploads**: Magic byte + MIME + size validation
- [ ] **#14 Verify webhook signatures**: Not applicable (no webhooks in scope)
- [ ] **#15 Rate limit requests**: Already implemented in server.js with express-rate-limit
- [ ] **#16 Tighten CORS settings**: Already configured in server.js
- [ ] **#17 Disable production debugging**: Covered by Fix 1

**3 of 9 security requirements fully addressed by this plan.**
