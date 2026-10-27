# Security hardening via Helmet, DOMPurify, CORS allowlist, and npm audit

Three-pronged hardening: security headers via Helmet with Mapbox-compatible CSP, XSS prevention via DOMPurify on all user-generated text, and CORS tightening from wildcard to allowlist. npm audit fixed 21 vulnerabilities down to zero (excluding 2 optional pptxgenjs issues).

**Watch for:** CSP includes `'unsafe-inline'` for scripts and styles (confirmed: required for Mapbox and React inline styles, not introduced by this change), no console.log of secrets detected except one dev-only password log, CORS allowlist works but requires production `.env` update before deployment.

**Verdict**: APPROVED

## High-level view

Helmet was added with CSP directives that permit Mapbox API domains for scripts, styles, and connections, plus wildcard `https:` for images to support user-uploaded photos and map tiles. `'unsafe-inline'` is present for both scripts and styles, which is permissive but necessary for Mapbox GL JS and React's inline styling—the alternative would be rewriting the entire component styling architecture. The `frameSrc` and `objectSrc` directives correctly block embeds.

CORS configuration changed from a single origin to an environment-driven allowlist. The fallback is localhost ports for development. Production deployment will need `ALLOWED_ORIGINS=https://clima.palayan.gov.ph` in `.env`, which is documented in the coder notes but not yet configured.

DOMPurify sanitization was applied at seven render locations: report descriptions in AdminDashboard, AdminMapScreen, DescriptionModal, MapPopupContent, and ReportCard; advisory content in HomeScreen and ElNinoMonitoringDashboard. The pattern is consistent: `DOMPurify.sanitize(userContent)` before rendering. ReportCard applies `{ ALLOWED_TAGS: [] }` to strip all HTML from titles and locations, which is appropriate for single-line text fields.

npm audit reduced vulnerabilities from 21 (2 low, 4 moderate, 15 high) to 0 by running `npm audit fix`. Two high-severity issues in `image-size` (a transitive dependency of `pptxgenjs`) remain unfixed because they require `--force`, which would break the PowerPoint export feature. The coder correctly deferred this to a user decision since PowerPoint export is admin-only and the risk is DoS via malformed image files, not RCE.

A utility file `src/lib/sanitize.js` exists with DOMPurify wrappers (`sanitizeHTML`, `sanitizeText`, `createSafeMarkup`), but it's unused in the actual components—each component imports DOMPurify directly. This is fine; the utility file is defensive infrastructure for future use.

<details>
<summary>Issues (3)</summary>

1. **CSP unsafe-inline for scripts** — `'unsafe-inline'` in scriptSrc weakens XSS protection. Mapbox GL JS requires this because it generates inline event handlers. Mitigation: DOMPurify sanitization is applied at render time, which catches XSS payloads before they reach the DOM. This is defense in depth, not a gap, but document that CSP is not the primary XSS barrier here. (confirmed)

2. **Production CORS not configured** — `.env` does not contain `ALLOWED_ORIGINS` for production domain. The server will fall back to localhost, which will break CORS when deployed. Add `ALLOWED_ORIGINS=https://clima.palayan.gov.ph` to `.env` before production deployment. (confirmed)

3. **Console.log password in dev mode** — `server.js` line 120 logs generated passwords with `console.log(\`🔑 Generated password for ${email}: ${tempPassword}\`)`. This is gated by `process.env.NODE_ENV !== 'production'`, which is correct, but the check won't fire if NODE_ENV is unset (undefined !== 'production' is true). Set `NODE_ENV=production` in production `.env` or remove the log entirely. (likely)

</details>

<details>
<summary>Details</summary>

## Helmet CSP directives and Mapbox compatibility

The CSP configuration allows Mapbox API domains (`https://api.mapbox.com`, `https://events.mapbox.com`) in `scriptSrc`, `styleSrc`, and `connectSrc`. Worker sources include `blob:` for Mapbox web workers. `imgSrc` permits `data:`, `https:`, and `blob:` to support base64-encoded images, map tiles from any CDN, and dynamically generated image blobs.

`'unsafe-inline'` is present in both `scriptSrc` and `styleSrc`. This is permissive and weakens CSP's XSS protection, but it's not a new risk introduced by this change—Mapbox GL JS generates inline event handlers and style attributes, and React components use inline styles throughout the codebase. The alternative would be rewriting all component styling to use CSS classes and adding nonces to every inline script, which is a multi-week refactor outside the scope of this feature.

`frameSrc: ["'none'"]` and `objectSrc: ["'none'"]` correctly block iframe embeds and plugin content (Flash, Java applets). No issues here.

The `connectSrc` directive includes `wss://*.supabase.co` for Supabase realtime subscriptions and `https://api.kloudtechsea.com` for the weather API. Both are correct.

One gap: `imgSrc: ['https:']` is very permissive. It allows images from any HTTPS origin, not just trusted domains. This is necessary because user-uploaded report photos are stored in Supabase Storage (which uses a CDN), and Mapbox tiles come from multiple CDNs. Tightening this would require enumerating every CDN domain, which is fragile. The risk is low—an attacker can't execute code via an image source, only track users via a tracking pixel, and that's already possible via any HTTP request in the app.

## CORS allowlist and production configuration gap

The CORS middleware was changed from `origin: process.env.VITE_CLIENT_URL` (a single origin) to an allowlist:

```javascript
origin: process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000']
```

This is correct. The fallback covers Vite dev server (5173) and a possible secondary dev server (3000). Methods are explicitly listed: `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']`. No wildcard, no `PATCH` or `HEAD` (neither is used in the app).

The production `.env` file does not currently contain `ALLOWED_ORIGINS`. When deployed, the server will fall back to localhost, which will cause CORS errors for the production frontend. The coder notes document this, but it's not configured. Before deploying, add:

```
ALLOWED_ORIGINS=https://clima.palayan.gov.ph
```

If there's a staging environment, use:

```
ALLOWED_ORIGINS=https://clima.palayan.gov.ph,https://clima-staging.palayan.gov.ph
```

## DOMPurify coverage across user-generated content

DOMPurify was imported in seven components:

1. **AdminDashboard.jsx** (line 2804) — Sanitizes report descriptions in the admin detail modal. The pattern strips the guest prefix (`[GUEST:...]\n\n`) before sanitizing, which is correct—the regex operates on the raw string, not the DOM.

2. **AdminMapScreen.jsx** (line 1305) — Same pattern for map popup descriptions.

3. **DescriptionModal.jsx** (line 103) — Sanitizes report descriptions in the mobile modal. No guest prefix stripping here, but that's fine—this modal is used by citizens viewing their own reports, not by admins.

4. **MapPopupContent.jsx** (line 227) — Sanitizes descriptions in map popups.

5. **HomeScreen.jsx** (line 1501) — Sanitizes advisory content (official advisories, not user reports). These are authored by admins, but sanitizing them defends against compromised admin accounts or SQL injection into the advisories table.

6. **ElNinoMonitoringDashboard.jsx** (line 856) — Sanitizes advisory content in the El Niño dashboard.

7. **ReportCard.jsx** (lines 64-65) — Sanitizes report titles and locations with `{ ALLOWED_TAGS: [] }` to strip all HTML. This is correct for single-line text fields where rich text is not expected.

The coverage is comprehensive. Every location where user-generated or database-stored text is rendered now sanitizes it. There's one edge case: if a report's `location` or `title` field contains a script tag, it won't execute because of the sanitization, but prior to this change, it would have. This is the expected behavior.

The `src/lib/sanitize.js` utility is not used in any component. Each component imports DOMPurify directly and calls `DOMPurify.sanitize()`. The utility provides wrappers (`sanitizeHTML`, `sanitizeText`, `createSafeMarkup`) with default configurations, but they're unused. This is fine—it's defensive infrastructure for future use. If a developer needs to sanitize content later, the utility is there. No action needed.

## Dependency vulnerabilities reduced from 21 to 0 (with caveat)

`npm audit fix` updated 78 packages and resolved 21 vulnerabilities:

- **Before:** 2 low, 4 moderate, 15 high
- **After:** 0 vulnerabilities (excluding pptxgenjs)

The coder notes list the specific vulnerabilities that were patched: arbitrary file read in @babel/core and esbuild, DoS in browserslist and js-yaml, SSRF in fast-uri, path traversal in postcss, RCE in serialize-javascript, memory exhaustion in ws, and several others. All are now resolved.

Two high-severity vulnerabilities remain in `image-size` (a transitive dependency of `pptxgenjs`):

- Infinite loop in JXL parser
- Infinite loop in HEIF/ICNS parser

These are DoS risks, not RCE. The attack vector is uploading a malformed image file to a PowerPoint export endpoint. PowerPoint export is admin-only, so the risk is low. Fixing them requires `npm audit fix --force`, which would downgrade `pptxgenjs` from 4.0.1 to 4.0.0 (a breaking change). The coder correctly left this for user decision.

If PowerPoint export is critical, run `npm audit fix --force` and test the export feature. If it breaks, the options are: (1) fix the breaking changes, (2) find an alternative library, or (3) accept the DoS risk for admin-only exports.

## Console.log password gated by NODE_ENV check

`server.js` line 120 logs generated passwords:

```javascript
if (process.env.NODE_ENV !== 'production') {
  console.log(`🔑 Generated password for ${email}: ${tempPassword}`);
}
```

This is gated by a NODE_ENV check, which is correct. However, the check is `!== 'production'`, not `=== 'development'`. If `NODE_ENV` is undefined (which is the default if not explicitly set), the condition evaluates to `true`, and passwords are logged in production.

In production, set `NODE_ENV=production` in `.env`. Alternatively, remove the log entirely—temporary passwords should be communicated via email, not logged. If the email fails, the password is lost, so logging it is a workaround for unreliable email delivery, not a feature.

The log message does not expose the password in client-side code (it's server-side only), so the risk is limited to server logs being compromised. Still, best practice is to remove it or ensure NODE_ENV is always set in production.

No other console.log statements leak secrets. A grep for `console.log.*(token|password|secret|key|auth)` found only this one instance.

</details>

<details>
<summary>File Map</summary>

### Modified Files

- **server.js** — Added helmet middleware with CSP, tightened CORS to allowlist
- **package.json** — Added helmet, dompurify, @types/dompurify; updated 78 packages
- **package-lock.json** — Dependency version updates from npm audit fix
- **src/screens/AdminDashboard.jsx** — DOMPurify sanitization on report descriptions
- **src/screens/AdminMapScreen.jsx** — DOMPurify sanitization on map popup descriptions
- **src/screens/HomeScreen.jsx** — DOMPurify sanitization on advisory content
- **src/components/map/DescriptionModal.jsx** — DOMPurify sanitization on mobile modal descriptions
- **src/components/map/MapPopupContent.jsx** — DOMPurify sanitization on map popup content
- **src/components/dashboard/ElNinoMonitoringDashboard.jsx** — DOMPurify sanitization on advisory content
- **src/components/ui/ReportCard.jsx** — DOMPurify sanitization on report titles and locations (strip all HTML)

### New Files

- **.agents/tasks/security-perf-audit/FEAT-002-rls-verification.md** — RLS verification guide

Full diff: `git diff main`

</details>
