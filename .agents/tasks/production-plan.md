# Implementation Plan: CLIMA Production Enhancements

This plan transforms CLIMA into a production-ready government disaster response platform by implementing comprehensive performance optimizations, UX enhancements, accessibility features, and professional branding aligned with Palayan City Government standards.

---

## PHASE 1 - Foundation & Build Config

- [ ] 1. Install and configure react-helmet-async for unique page titles per route.
      Add HelmetProvider wrapper in main.jsx, implement <Helmet> in each screen component (HomeScreen, MapScreen, ProfileScreen, EmergencyScreen, ElNinoMonitoringDashboard, LegalScreen, AdminDashboard, AdminMapScreen) with titles following pattern: 'CLIMA - [Screen Name] | Palayan City Government'.
      Files: src/main.jsx, src/screens/*.jsx
      Verify: Navigate to each screen and check browser tab title changes uniquely.

- [ ] 2. Add comprehensive social meta tags to index.html.
      Include OpenGraph (og:title, og:description, og:image=/social-share.png, og:url, og:type=website) and Twitter Card (twitter:card=summary_large_image, twitter:image) meta tags. Set meta description: 'Climate Information Monitoring and Awareness - Official disaster response platform of Palayan City Government, Nueva Ecija'.
      Files: index.html
      Verify: View page source and confirm all og: and twitter: meta tags are present. Test with Facebook/Twitter debugger tools.

- [ ] 3. Create custom 404 page and integrate into routing.
      Build NotFoundScreen.jsx with professional government design: heading 'Page Not Found', helpful message, button to return home. Export as lazy component. Add route logic in App.jsx to show NotFoundScreen when activeScreen is invalid.
      Files: src/screens/NotFoundScreen.jsx, src/App.jsx
      Verify: Navigate to /invalid-route and confirm 404 page displays with professional design.

- [ ] 4. Implement skip-to-content accessibility link.
      Create SkipToContent.jsx component: visually hidden until keyboard focus, on Enter jumps to #main-content. Render as first child in App.jsx, add id="main-content" to main screen container.
      Files: src/components/accessibility/SkipToContent.jsx, src/App.jsx
      Verify: Press Tab on page load, confirm skip link appears focused, press Enter and confirm focus jumps to main content.

- [ ] 5. Create print stylesheet for clean printing.
      Develop public/print.css with @media print rules: hide navigation, modals, map controls, floating buttons; show content in black on white; readable fonts; page break controls. Link in index.html with media="print".
      Files: public/print.css, index.html
      Verify: Press Ctrl+P for print preview, confirm navigation and map hidden, content readable.

- [ ] 6. Defer non-critical scripts and optimize font loading.
      Move Google Fonts <link> to end of <head> in index.html. Verify module scripts have implicit defer (already deferred by type="module"). Add preconnect hints for external domains.
      Files: index.html
      Verify: Check Network tab, confirm fonts load after critical resources.

- [ ] 7. Audit and remove unused npm dependencies.
      Run 'npm list --depth=0', identify unused packages. Found: body-parser (unused in client), jspdf/jspdf-autotable (if client doesn't export PDFs). Confirm with grep search, then 'npm uninstall body-parser jspdf jspdf-autotable'. Update package.json.
      Files: package.json
      Verify: Run 'npm run build' after uninstall, confirm no errors. Check package.json lists only used dependencies.

- [ ] 8. Remove em-dashes and placeholder text from all components.
      Grep all .jsx files for '—' character and replace with '-' or remove. Grep for 'placeholder', 'Lorem', 'ipsum' and replace input placeholders with professional government prompts. Remove any lorem ipsum filler. Key files: AdminMapScreen.jsx, AdminDashboard.jsx, ProfileScreen.jsx, AdminLogin.jsx, ForgotPasswordScreen.jsx, ChangePasswordScreen.jsx.
      Files: src/screens/*.jsx, src/components/**/*.jsx
      Verify: Run 'grep -r "—" src/' and confirm no results. Run 'grep -ri "lorem\\|ipsum" src/' and confirm no results. All input placeholders use professional language.

- [ ] 9. Create UTM tracking helper utility.
      Build src/lib/utm.js with addUTMParams(url, source, medium, campaign) function that appends ?utm_source=...&utm_medium=...&utm_campaign=... to external links. Export for use in components with external links.
      Files: src/lib/utm.js
      Verify: Import in component, test with console.log(addUTMParams('https://example.com', 'clima', 'web', 'footer')), confirm URL has UTM params.

- [ ] 10. Replace Vite favicon with Palayan City government seal.
       Convert public/logo.webp to favicon.ico format using sharp or online tool. Place in public/favicon.ico. Update index.html <link rel="icon" href="/favicon.ico">. Update manifest.webmanifest icons array to reference /logo.webp with proper sizes (192x192, 512x512).
       Files: public/favicon.ico, index.html, manifest.webmanifest
       Verify: Check browser tab icon shows Palayan seal (not Vite logo). Clear browser cache if needed.

- [ ] 11. Update index.html page title to be descriptive.
       Change <title> from 'CLIMA' to 'CLIMA - Palayan City Disaster Response | Climate Monitoring & Awareness'.
       Files: index.html
       Verify: Load site and check default browser tab title before React hydrates.

- [ ] 12. Run production build and verify output.
       Execute 'npm run build', check dist/ folder structure, confirm code splitting produced separate chunks (vendor-react, vendor-supabase, vendor-mapbox, vendor-charts, vendor-ui, MapScreen, AdminDashboard, LegalScreen). No errors.
       Files: n/a (build verification)
       Verify: npm run build completes with exit code 0. Check dist/assets/ for chunk files. Note chunk sizes for documentation.

---

## PHASE 2 - Data Layer & Performance

- [ ] 1. Extract useDebounce hook for reusability.
      Move useDebounce function from components/map/SearchBar.jsx to src/hooks/useDebounce.js. Export as default or named export. Update SearchBar import.
      Files: src/hooks/useDebounce.js, src/components/map/SearchBar.jsx
      Verify: Run 'npm run build', confirm no errors. Test SearchBar component still works.

- [ ] 2. Apply debounce to AdminMapScreen search input.
      In AdminMapScreen.jsx line 552, wrap searchQuery state with useDebounce(searchQuery, 300). Use debounced value for filtering reports list.
      Files: src/screens/AdminMapScreen.jsx
      Verify: Type in admin map search field, confirm filter operations only trigger after 300ms pause (not on every keystroke). Use console.log to verify.

- [ ] 3. Apply debounce to HomeScreen barangay search.
      In HomeScreen.jsx line 787, wrap searchQuery with useDebounce(searchQuery, 300). Apply debounced value to filteredBarangays useMemo dependency.
      Files: src/screens/HomeScreen.jsx
      Verify: Type in barangay search, confirm filtering happens after 300ms pause.

- [ ] 4. Apply debounce to AdminDashboard search/filter inputs.
      Find all input onChange handlers for search/filter fields in AdminDashboard.jsx. Apply useDebounce with 300ms delay before triggering filter operations.
      Files: src/screens/AdminDashboard.jsx
      Verify: Type in admin dashboard search/filter fields, confirm operations debounced.

- [ ] 5. Create reusable PaginationControls component.
      Build src/components/ui/PaginationControls.jsx accepting props: { currentPage, totalPages, onPageChange, isLoading, hasNextPage, onNextPage }. Render Previous/Next buttons and page indicator. Style matching existing button patterns with proper disabled states.
      Files: src/components/ui/PaginationControls.jsx
      Verify: Import in test component, pass mock props, confirm buttons render and onClick fires.

- [ ] 6. Add pagination UI to AdminDashboard ReportsTab.
      The usePaginatedReports hook is already available. Wire up PaginationControls component below reports list with fetchNextPage, hasNextPage, isFetchingNextPage from useInfiniteQuery result. Display loading state on Next button when fetching.
      Files: src/screens/AdminDashboard.jsx
      Verify: In admin Reports tab, scroll to bottom and confirm Next Page button appears if >50 records. Click and confirm new page loads.

- [ ] 7. Add pagination UI to AdminDashboard AdvisoriesTab, Operations sections.
      Apply PaginationControls to AdvisoriesTab (usePaginatedAdvisories), BFP Operations (usePaginatedBFPOps), CDRRMO Operations (usePaginatedCDRRMOOps), Hospital Records (usePaginatedHospitalRecords). Wire up fetchNextPage for each.
      Files: src/screens/AdminDashboard.jsx
      Verify: Navigate to each tab/section, confirm pagination controls appear and work.

- [ ] 8. Verify ReportCard memoization and optimize parent re-renders.
      Confirm ReportCard is wrapped in React.memo (src/components/ui/ReportCard.jsx line 58). Check parent components rendering ReportCard lists - wrap any inline callback functions with useCallback to prevent prop changes.
      Files: src/components/ui/ReportCard.jsx, src/screens/HomeScreen.jsx, src/screens/AdminDashboard.jsx
      Verify: Use React DevTools Profiler, trigger list re-render, confirm ReportCard instances don't re-render unnecessarily.

- [ ] 9. Verify MapScreen performance optimizations.
      Confirm useMemo for stationCoverageGeoJSON (line 388), heatIndexCoverageGeoJSON (line 397). Confirm useCallback for onMapLoad (line 515), refreshWeatherData (line 423), fitAllPins (line 243). No changes needed if already optimized.
      Files: src/screens/MapScreen.jsx
      Verify: Code review confirms all expensive computations memoized, callbacks wrapped.

- [ ] 10. Create LoadingSkeleton component for data loading states.
       Build src/components/ui/LoadingSkeleton.jsx accepting variant prop: 'card' | 'row' | 'avatar'. Implement shimmer animation with CSS keyframes. Render placeholder shapes based on variant.
       Files: src/components/ui/LoadingSkeleton.jsx
       Verify: Import and render <LoadingSkeleton variant="card" count={3} />, confirm shimmer animation displays.

- [ ] 11. Replace loading text with LoadingSkeleton in HomeScreen.
       When loading advisories or reports in HomeScreen.jsx, show <LoadingSkeleton variant="card" count={3} /> instead of plain 'Loading...' text.
       Files: src/screens/HomeScreen.jsx
       Verify: Reload page or trigger data fetch, confirm skeleton cards appear before real data.

- [ ] 12. Add LoadingSkeleton to AdminDashboard analytics loading states.
       In AdminDashboard.jsx OverviewTab, when fetching analytics data, show LoadingSkeleton for metric cards and chart areas until data loads.
       Files: src/screens/AdminDashboard.jsx
       Verify: Navigate to admin Overview tab, confirm skeletons appear briefly before charts render.

- [ ] 13. Audit all images for lazy loading attribute.
       Confirm loading="lazy" on all <img> tags. Already present in: ReportCard (line 85), PhotoCard (line 53), AdminDashboard (lines 1605, 3023, 3091). Add to any remaining images in HomeScreen, EmergencyScreen, ProfileScreen, ElNinoMonitoringDashboard.
       Files: src/components/**/*.jsx, src/screens/*.jsx
       Verify: Grep '<img' across src/, confirm all have loading="lazy" attribute (except above-fold hero images if any).

- [ ] 14. Verify HomeScreen performance optimizations.
       Confirm heatIndex (line 358), weatherInfo, filteredBarangays (line 371), waveInfo (line 393), formattedRecordedAt (line 704), liveStationData (line 721), heroBgUrl (line 311) are all useMemo wrapped. No changes if already optimized.
       Files: src/screens/HomeScreen.jsx
       Verify: Code review confirms all expensive computations memoized.

- [ ] 15. Optimize ElNinoMonitoringDashboard data aggregations.
       If ElNinoMonitoringDashboard.jsx has large data aggregations or chart data preparations, wrap with useMemo based on data dependencies.
       Files: src/components/dashboard/ElNinoMonitoringDashboard.jsx
       Verify: Code review, add useMemo where appropriate, test dashboard loads without lag.

- [ ] 16. Verify Vite code splitting configuration.
       Confirm vite.config.js rollupOptions.output.manualChunks produces separate chunks for MapScreen, AdminDashboard, LegalScreen, AdminMapScreen (lazy loaded components). Already configured.
       Files: vite.config.js
       Verify: Run 'npm run build', check dist/assets/ for separate chunk files matching lazy-loaded routes.

- [ ] 17. Test debounced search, pagination, skeletons, lazy image loading in browser.
       Run 'npm run dev', open DevTools Network tab with Slow 3G throttling. Navigate to each screen, type in search fields (confirm debounce), scroll long lists (confirm pagination), reload (confirm skeletons), scroll down (confirm images load on viewport entry).
       Files: n/a (manual testing)
       Verify: Document test results. Search debounces, pagination works, skeletons show, images lazy load.

---

## PHASE 3 - UI/UX Core

- [ ] 1. Add visible dark mode toggle button to navigation.
      In CitizenNav.jsx, import useTheme from context/ThemeContext. Add button with Moon/Sun icon (lucide-react) that calls toggleTheme on click. Position in top-right of nav bar. Style as icon button with hover state.
      Files: src/components/layout/CitizenNav.jsx
      Verify: Load site, locate dark mode toggle button, click and confirm theme switches, reload and confirm theme persists.

- [ ] 2. Remove purple gradients and apply Palayan City brand colors.
      In src/index.css, replace purple colors (#8b5cf6, #a855f7) with neutral blues, grays, or greens. Lines 2812 (pressure-icon), 2814 (uv-icon). Verify --accent-orange (#f97316) aligns with government branding (acceptable for alerts/CTAs). Document color changes.
      Files: src/index.css
      Verify: Grep 'purple|#8b5cf6|#a855f7' and confirm no purple remain. Visual inspection of all screens.

- [ ] 3. Replace pill-shaped buttons with standard government-style buttons.
      Audit all button border-radius values in src/index.css and src/components/ui/button.jsx. Reduce border-radius from 20px+ to 8px or 10px. Check lines 2092+ in index.css for button styles.
      Files: src/index.css, src/components/ui/button.jsx
      Verify: Visual inspection of all buttons (citizen nav, admin panels, modals). Measure border-radius in DevTools, confirm none exceed 10px.

- [ ] 4. Create StickyHeader component with scroll shadow.
      Build src/components/layout/StickyHeader.jsx that detects scroll position with useEffect + window.scrollY listener. When scrollY > 50, add box-shadow via state. Style as sticky top-0 z-50. Render children (logo, nav items).
      Files: src/components/layout/StickyHeader.jsx
      Verify: Wrap header in HomeScreen or App.jsx with StickyHeader. Scroll down and confirm shadow appears.

- [ ] 5. Enhance mobile menu with smooth animations.
      In CitizenNav mobile menu (if hamburger exists), apply framer-motion AnimatePresence for open/close. Ensure keyboard accessible: focus trap when open, Esc key closes menu.
      Files: src/components/layout/CitizenNav.jsx
      Verify: Open mobile view, tap hamburger, confirm menu animates in smoothly. Press Esc and confirm menu closes. Tab through menu items and confirm focus trap.

- [ ] 6. Create and implement scroll progress bar.
      Build src/hooks/useScrollProgress.js: hook returning scroll percentage (0-100) based on scrollTop vs scrollHeight. Build src/components/ui/ScrollProgressBar.jsx: fixed top bar (height 3px, background gradient --accent-orange), width from scroll percentage. Render in App.jsx.
      Files: src/hooks/useScrollProgress.js, src/components/ui/ScrollProgressBar.jsx, src/App.jsx
      Verify: Scroll page, confirm thin bar at top fills from left to right as you scroll down.

- [ ] 7. Create and implement scroll-to-top button.
      Build src/components/ui/ScrollToTopButton.jsx: fixed bottom-right button (bottom: 80px, right: 20px) with ArrowUp icon. Show only when scrollY > 300. On click, window.scrollTo({ top: 0, behavior: 'smooth' }). Style as circular button with shadow.
      Files: src/components/ui/ScrollToTopButton.jsx, src/App.jsx
      Verify: Scroll down >300px, confirm button fades in. Click and confirm smooth scroll to top.

- [ ] 8. Create and implement floating emergency contact button.
      Build src/components/ui/FloatingContactButton.jsx: fixed bottom-right button (bottom: 140px, right: 20px) with Phone icon. On click, open tel: link or show emergency contact modal. Style as circular button with red/orange background and pulse animation.
      Files: src/components/ui/FloatingContactButton.jsx, src/App.jsx
      Verify: Confirm button visible on all citizen screens. Click and confirm tel: link opens or modal displays.

- [ ] 9. Add hover states to all interactive elements.
      Audit all buttons, links, cards in src/index.css. Add :hover and :focus-visible pseudo-classes with transform: translateY(-1px) or scale(1.02), transition: all 0.2s. Check .desktop-nav-btn (line 1862), .desktop-wind-card, report cards, advisory cards, etc.
      Files: src/index.css
      Verify: Hover over every button, link, card. Confirm visual feedback (scale, shadow, or translation).

- [ ] 10. Verify smooth page transition animations.
       Confirm App.jsx screenVariants (lines 385-390) use framer-motion AnimatePresence with smooth initial/animate/exit states. Add loading spinner or skeleton during transitions if needed.
       Files: src/App.jsx
       Verify: Navigate between screens, confirm smooth fade/slide transitions with no jarring jumps.

- [ ] 11. Add password visibility toggle to all password fields.
       In ProfileScreen, ChangePasswordScreen, AdminLogin, ForgotPasswordScreen, find password input fields. Add toggle button (Eye/EyeOff icon from lucide-react) next to input. On click, toggle input type between 'password' and 'text'. Maintain accessible label.
       Files: src/screens/ProfileScreen.jsx, src/screens/ChangePasswordScreen.jsx, src/screens/AdminLogin.jsx, src/screens/ForgotPasswordScreen.jsx
       Verify: Find any password input, click eye icon, confirm password becomes visible. Click again and confirm it hides.

- [ ] 12. Create CopyButton component and add to report IDs and coordinates.
       Build src/components/ui/CopyButton.jsx: button with Copy icon. On click, navigator.clipboard.writeText(text), show brief 'Copied!' tooltip. In AdminDashboard report details (line 3065) and MapPopupContent, add CopyButton next to report ID and coordinates.
       Files: src/components/ui/CopyButton.jsx, src/screens/AdminDashboard.jsx, src/components/map/MapPopupContent.jsx
       Verify: In admin, view report details, click copy button next to ID. Paste into notepad and confirm value copied. Verify 'Copied!' message appears.

- [ ] 13. Run production build and test all UI enhancements.
       Execute 'npm run build', then 'npm run dev'. Test dark mode toggle, scroll progress bar, scroll-to-top button, floating contact button, hover states, password toggles, copy buttons in browser.
       Files: n/a (manual testing)
       Verify: Document test results for all UI features.

---

## PHASE 4 - Features & Content

- [ ] 1. Create and implement cookie consent banner.
      Build src/components/ui/CookieConsent.jsx: fixed bottom bar with message 'This site uses cookies to improve your experience. We comply with R.A. 10173 (Data Privacy Act of 2012).' Buttons: Accept (green), Decline (gray). On Accept, localStorage.setItem('clima-cookie-consent', 'accepted'). Render only if consent not set. Render in App.jsx.
      Files: src/components/ui/CookieConsent.jsx, src/App.jsx
      Verify: Load site in incognito, confirm banner appears. Click Accept, confirm banner disappears. Reload and confirm banner stays hidden. Check localStorage for 'clima-cookie-consent' key.

- [ ] 2. Create ConfirmModal component for destructive actions.
      Build src/components/ui/ConfirmModal.jsx: modal accepting { isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, isDangerous }. If isDangerous=true, red confirm button. Use framer-motion for animation.
      Files: src/components/ui/ConfirmModal.jsx
      Verify: Test in isolation with mock props, confirm modal renders with buttons and animations.

- [ ] 3. Apply ConfirmModal to all delete operations in AdminDashboard.
      Find delete operations (delete report ~line 3140, delete admin, delete category, delete department, revoke access). Before calling delete function, show ConfirmModal with message 'Are you sure? This action cannot be undone.' On confirm, proceed.
      Files: src/screens/AdminDashboard.jsx
      Verify: In admin, attempt to delete report. Confirm modal appears. Click Cancel and verify nothing deletes. Attempt again, click Confirm and verify deletion proceeds.

- [ ] 4. Create expandable FAQ section component.
      Build src/components/faq/FAQSection.jsx: accordion component accepting array of { question, answer } objects. Each item is a button (question) + collapsible content (answer) with ChevronDown icon. Use framer-motion for expand/collapse animation.
      Files: src/components/faq/FAQSection.jsx
      Verify: Render with mock data, click questions and confirm answers expand/collapse smoothly.

- [ ] 5. Create FAQ data with 8-10 disaster response questions.
      Build src/data/faqData.js: export array of FAQ items: What is CLIMA?, How do I report an incident?, What happens after I report?, How do I register?, What information is collected?, Who can see my reports?, Emergency contact information, Privacy policy overview, Terms of service summary, How to verify advisory authenticity. Write in professional government tone.
      Files: src/data/faqData.js
      Verify: Import and inspect data structure, confirm professional language.

- [ ] 6. Integrate FAQ section into HomeScreen or create FAQScreen.
      Render <FAQSection items={faqData} /> in HomeScreen.jsx (below main content) or create dedicated FAQScreen.jsx. If new screen, update App.jsx routing and add FAQ nav item to CitizenNav.
      Files: src/screens/HomeScreen.jsx (or src/screens/FAQScreen.jsx), src/App.jsx, src/components/layout/CitizenNav.jsx
      Verify: Navigate to FAQ section/screen, confirm questions display. Click 3 different questions and verify answers expand.

- [ ] 7. Create newsletter signup component with success state.
      Build src/components/newsletter/NewsletterSignup.jsx: form with email input and Subscribe button. On submit, insert to Supabase 'newsletter_subscribers' table (or use advisory subscription mechanism). Show success message 'Thank you for subscribing to CLIMA advisories!' with CheckCircle icon. Include error handling.
      Files: src/components/newsletter/NewsletterSignup.jsx
      Verify: Render in HomeScreen or Footer. Enter email, click Subscribe, confirm success message appears.

- [ ] 8. Implement global search modal component.
      Build src/components/search/GlobalSearch.jsx: modal overlay with search input. As user types (debounced 300ms), search reports (title, description, location), advisories (title, content), FAQs (questions/answers). Display results grouped by category. Click result navigates to detail. Use framer-motion.
      Files: src/components/search/GlobalSearch.jsx
      Verify: Open modal, type 'flood', confirm matching reports/advisories appear. Click result and confirm navigation.

- [ ] 9. Create useGlobalSearch hook for search logic.
      Build src/hooks/useGlobalSearch.js: hook accepting query string, returns { reports, advisories, faqs } filtered arrays using useMemo.
      Files: src/hooks/useGlobalSearch.js
      Verify: Test hook with mock data, confirm filtering works correctly.

- [ ] 10. Add global search trigger (keyboard shortcut or button).
       Add keyboard shortcut listener (Ctrl+K or Cmd+K) in App.jsx useEffect. On trigger, open GlobalSearch modal. Alternatively, add search icon button in header/nav.
       Files: src/App.jsx, src/components/layout/CitizenNav.jsx
       Verify: Press Ctrl+K (Windows) or Cmd+K (Mac) and confirm search modal opens. Type and search.

- [ ] 11. Replace Vite favicon with Palayan City seal (duplicate of Phase 1 step 10 - confirm completed).
       Convert logo.webp to favicon.ico, update index.html and manifest.webmanifest. Already covered in Phase 1.
       Files: public/favicon.ico, index.html, manifest.webmanifest
       Verify: Confirm favicon shows Palayan seal in browser tab.

- [ ] 12. Create social share image asset.
       Design public/social-share.png (1200x630px) with CLIMA logo, tagline 'Climate Information Monitoring and Awareness | Palayan City Government', and Palayan background image. Use Figma, Canva, or Photoshop. Export as PNG.
       Files: public/social-share.png
       Verify: Confirm file exists at correct dimensions (1200x630px). Verify index.html og:image meta tag points to /social-share.png.

- [ ] 13. Add custom domain configuration file.
       Create vercel.json or netlify.toml in project root. For Vercel: { "github": { "silent": true } }. For Netlify: [[redirects]] in netlify.toml or _redirects file. Document intended domain palayan-clima.gov.ph (user must configure DNS separately).
       Files: vercel.json or netlify.toml
       Verify: File exists in project root with basic configuration.

- [ ] 14. Verify Privacy Policy and Terms of Service exist in LegalScreen.
       Confirm LegalScreen.jsx (src/screens/LegalScreen.jsx) displays Privacy Policy and Terms tabs. Verify markdown files exist in public/legal/privacy-policy.md and public/legal/terms-of-service.md. If missing, create with professional government legal templates.
       Files: public/legal/privacy-policy.md, public/legal/terms-of-service.md
       Verify: Navigate to LegalScreen, click Privacy Policy tab, confirm content loads. Repeat for Terms of Service.

- [ ] 15. Create Footer component with legal links.
       Build src/components/layout/Footer.jsx: footer with links to Legal (Privacy Policy, Terms), Contact, About, social media icons (if applicable). Style as dark bar at bottom with subtle border, government professional aesthetic.
       Files: src/components/layout/Footer.jsx
       Verify: Render in isolation, confirm links present and styled.

- [ ] 16. Integrate Footer into citizen screens.
       In App.jsx or HomeScreen, render <Footer /> at bottom of main content. Ensure footer appears on all citizen screens (Home, Maps, Profile, Emergency, ElNiño, Legal) but not admin screens.
       Files: src/App.jsx
       Verify: Navigate to each citizen screen, scroll to bottom, confirm footer appears with legal links. Admin screens should not show footer.

- [ ] 17. Run production build and test all features.
       Execute 'npm run build' and 'npm run dev'. Test cookie consent, confirmation modals, FAQ accordion, newsletter signup, global search (Ctrl+K), footer links, social share image meta tag.
       Files: n/a (manual testing)
       Verify: Document test results for all Phase 4 features.

---

## PHASE 5 - Final Polish & Audit

- [ ] 1. Update all stale content dates.
      Grep all .jsx and .md files for date strings, 'last updated', 'updated at', copyright years. Update to current date (2024/2025). Check footer copyright, legal docs, any hardcoded timestamps.
      Files: src/**/*.jsx, public/legal/*.md, src/components/layout/Footer.jsx
      Verify: Run 'grep -r "last updated\\|Last Updated\\|Copyright 202[0-3]" src/' and confirm no stale dates.

- [ ] 2. Remove fake reviews, testimonials, placeholder metrics.
      Audit all components for fake reviews, customer counters, testimonials, 'Made with AI' tags, marketing copy. Remove any non-applicable content. CLIMA is a professional government disaster response system.
      Files: src/**/*.jsx
      Verify: Visual inspection of all screens, confirm no commercial/marketing elements.

- [ ] 3. Run production build and capture output.
      Execute 'npm run build', capture full console output including chunk sizes, warnings, errors. Fix any build errors. Note chunk size warnings (AdminDashboard >500KB) - consider further lazy loading if needed.
      Files: n/a (build verification)
      Verify: npm run build completes with exit code 0. Save output to text file for documentation.

- [ ] 4. Install Lighthouse CLI and run desktop audit.
      Run 'npm install -g lighthouse' or use npx. Start production preview: 'npm run build && npm run preview' (usually http://localhost:4173). Run: 'npx lighthouse http://localhost:4173 --output=html --output-path=./lighthouse-report.html --preset=desktop --only-categories=performance,accessibility,best-practices,seo'.
      Files: lighthouse-report.html
      Verify: Lighthouse report HTML file generated in project root.

- [ ] 5. Review Lighthouse scores and fix flagged issues.
      Open lighthouse-report.html, record scores: Performance (target >=90), Accessibility (>=90), Best Practices (>=90), SEO (>=90). Investigate issues: missing alt text, low contrast, large bundles, render-blocking resources. Fix and re-run if any score <85.
      Files: Various (based on Lighthouse findings)
      Verify: All Lighthouse scores >= 85 (ideally >=90). Document scores.

- [ ] 6. Verify WCAG 2.1 AA accessibility compliance.
      Check all interactive elements have proper ARIA labels, all images have alt text (empty alt="" for decorative), color contrast meets WCAG AA (4.5:1 normal text, 3:1 large text). Use axe DevTools extension or browser Accessibility Audit.
      Files: src/**/*.jsx
      Verify: Run axe DevTools scan, confirm no critical or serious issues. Document any manual testing required (screen reader, keyboard-only navigation).

- [ ] 7. Verify performance optimizations.
      Confirm code splitting works (separate chunks for routes), images compressed (check public/ file sizes), API responses cached (React Query), no unnecessary re-renders (React DevTools Profiler).
      Files: n/a (verification)
      Verify: Check dist/ chunks, test API caching in Network tab, profile re-renders in React DevTools.

- [ ] 8. Create comprehensive PRODUCTION_ENHANCEMENTS.md documentation.
      Build markdown doc with sections: Overview (summary of all changes), Performance Optimizations (chunking, lazy loading, caching, debounce, pagination with metrics), UX Improvements (dark mode, scroll controls, search, FAQ, consent, modals, hover, toggles, copy), Accessibility (skip links, WCAG notes, keyboard nav), Content & Branding (removed placeholders, added seal, social image, footer, legal), Build & Deployment (Vite config, dependency cleanup, domain config), Lighthouse Scores (current/before-after), Known Limitations (manual WCAG testing required), Testing Checklist (all features to test), Future Recommendations (image compression, CI/CD, E2E tests, monitoring, SSR, PWA review).
      Files: PRODUCTION_ENHANCEMENTS.md
      Verify: Read through doc, confirm all sections complete and comprehensive.

- [ ] 9. Document before/after bundle sizes.
      In PRODUCTION_ENHANCEMENTS.md, add section comparing bundle sizes from npm run build output before enhancements vs after. Example: 'Before: index.js 1.2MB. After: index.js 760KB + vendor-mapbox 1.6MB + AdminDashboard 754KB = total split into optimized chunks.' Calculate total size if available.
      Files: PRODUCTION_ENHANCEMENTS.md
      Verify: Bundle size comparison documented with specific numbers.

- [ ] 10. Document Lighthouse scores.
       In PRODUCTION_ENHANCEMENTS.md, add Lighthouse Scores section with Performance, Accessibility, Best Practices, SEO scores. Include before/after if baseline exists, otherwise just current scores. Note any flagged issues and resolutions.
       Files: PRODUCTION_ENHANCEMENTS.md
       Verify: Lighthouse scores documented with metrics.

- [ ] 11. Add comprehensive testing checklist.
       In PRODUCTION_ENHANCEMENTS.md, add Testing Checklist section listing all features to test manually: dark mode toggle, pagination, search, cookie consent, FAQ accordion, scroll-to-top, floating contact, confirmation modals, password toggle, copy-to-clipboard, skip-to-content, print stylesheet, social meta tags, footer links, etc.
       Files: PRODUCTION_ENHANCEMENTS.md
       Verify: Checklist covers all FEAT-001 through FEAT-004 features.

- [ ] 12. Add future recommendations section.
       In PRODUCTION_ENHANCEMENTS.md, suggest: image compression for public/ assets, CI/CD with Lighthouse checks, E2E tests (Playwright/Cypress), Core Web Vitals monitoring in production, SSR/SSG for faster initial loads, review PWA service worker caching strategy.
       Files: PRODUCTION_ENHANCEMENTS.md
       Verify: Future recommendations section complete and actionable.

- [ ] 13. Run final production build.
       Execute 'npm run build' one last time, ensure clean output with no errors. Warnings about chunk size are acceptable if documented.
       Files: n/a (build verification)
       Verify: npm run build exit code 0, dist/ folder ready for deployment.

- [ ] 14. Commit all changes to git.
       Stage all modified files, commit with message: 'feat: production enhancements - performance, UX, accessibility, branding'. Do NOT push - user will review first.
       Files: n/a (git commit)
       Verify: Run 'git status' and confirm clean working tree (all changes committed). Run 'git log -1' and confirm commit message. Do not push to remote.

---

## Notes

- **Accessibility**: Full WCAG 2.1 AA compliance requires manual testing with screen readers and assistive technologies beyond automated audits.
- **Performance**: Code splitting and lazy loading already configured in vite.config.js. Additional optimization may target AdminDashboard if bundle remains >500KB after all phases.
- **Branding**: All placeholder text, em-dashes, purple gradients, and pill buttons must be removed/replaced for professional government aesthetic.
- **Testing**: Manual browser testing required for all interactive features (dark mode, search, pagination, modals, etc.). Lighthouse provides automated performance/accessibility metrics.
- **Dependencies**: React Query already configured in main.jsx for API caching. Pagination hooks already exist and just need UI controls.
- **Deployment**: Custom domain configuration files added, but DNS and domain registration handled separately by user.

---

**Total Items**: 73 implementation steps across 5 phases.
