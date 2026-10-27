# El Niño Impact Dashboard Redesign Plan

## Executive Summary

Redesign `ElNinoMonitoringDashboard.jsx` to match the premium HomeScreen design system with **ZERO changes to data fetching or Supabase queries**. This is a visual-only redesign applying the modern card-based layout, framer-motion animations, and CSS design tokens from HomeScreen.

---

## 1. Current Structure of ElNinoMonitoringDashboard.jsx

### Component Architecture (Current State)
```
ElNinoMonitoringDashboard (root)
├── Dashboard Header (emoji + title + subtitle)
├── AdvisoriesSection (collapsible)
│   └── AdvisoryCard[] (expandable)
├── HospitalMonitoringSection (collapsible)
│   ├── StatCard[] (grid of 4)
│   └── LineChart (Recharts 7-day trend)
├── BFPOperationsSection (collapsible)
│   └── OperationCard[]
├── CDRRMOOperationsSection (collapsible)
│   └── OperationCard[]
├── AgricultureDamagesSection (collapsible)
│   ├── StatCard[] (grid of 3)
│   └── DamageCard[]
└── InterruptionsSection (collapsible)
    ├── Water interruptions list
    └── Power interruptions list
```

### Current Data Fetching (PRESERVE COMPLETELY)
- `fetchAdvisories()`: `supabase.from('advisories').select('*').eq('status', 'Published')`
- `fetchHospitalData()`: `supabase.from('hospital_daily_records').select('*').gte('record_date', thirtyDaysAgo)`
- `fetchBFPOperations()`: `supabase.from('bfp_operations').select('*').or('operation_type.eq.wildfire,incident_type.eq.wildfire')`
- `fetchCDRRMOOperations()`: `supabase.from('cdrrmo_daily_operations').select('*').gte('operation_date', thirtyDaysAgo)`
- `fetchAgricultureDamages()`: `supabase.from('agriculture_damage_reports').select('*').order('report_date', { ascending: false })`
- `fetchInterruptions()`: water_interruptions + power_interruptions tables with `interruption_date >= today`
- **Real-time subscriptions**: advisories channel with postgres_changes listener

**NO CHANGES TO ANY OF THE ABOVE.**

---

## 2. Design System CSS Classes (Exact Definitions)

### Layout Grid
```css
.desktop-main-grid {
  display: grid;
  grid-template-columns: 1.62fr 1fr;  /* ~62% left, ~38% right */
  gap: 18px;
}

.desktop-left-column,
.desktop-right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

### Hero Card (for main title + background image)
```css
.desktop-hero-card {
  min-height: 290px;
  border-radius: 24px;
  padding: 28px 30px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-card);
}

.desktop-hero-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(10, 12, 16, 0.25) 0%, rgba(10, 12, 16, 0.05) 40%, transparent 70%);
  z-index: 1;
  pointer-events: none;
  transition: background 0.4s ease;
}

html.dark .desktop-hero-card::before,
[data-theme="dark"] .desktop-hero-card::before {
  background: linear-gradient(
    90deg,
    rgba(10, 12, 16, 0.55) 0%,
    rgba(10, 12, 16, 0.2) 40%,
    rgba(10, 12, 16, 0.45) 100%
  );
}
```

### Standard Card
```css
.desktop-card {
  background: var(--bg-card);
  border-radius: 22px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
}
```

### Card Variations Used
- `.desktop-hourly-card`: for horizontal scrolling content rows
- `.desktop-weekly-card`: for grid layouts (7 columns)
- `.desktop-live-conditions-card`: right column card with padding
- `.desktop-recent-card`: list-style right column card

---

## 3. Color Palette & Design Tokens

### CSS Variables (from :root and html.dark)
```css
/* Light Mode */
--bg-app: #f8f9fa;
--bg-surface: #ffffff;
--bg-card: #ffffff;
--bg-card-subtle: #f4f4f6;
--bg-glass: rgba(255, 255, 255, 0.88);
--border-subtle: rgba(0, 0, 0, 0.08);
--border-medium: rgba(0, 0, 0, 0.14);
--text-primary: #09090b;
--text-secondary: #52525b;
--text-muted: #71717a;
--accent-orange: #f97316;
--accent-orange-hover: #ea580c;
--accent-glow: rgba(249, 115, 22, 0.35);
--shadow-card: 0 10px 30px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.1);

/* Dark Mode */
--bg-app: #000000;
--bg-surface: #09090b;
--bg-card: #121214;
--bg-card-subtle: #18181b;
--bg-glass: rgba(16, 16, 18, 0.94);
--border-subtle: rgba(255, 255, 255, 0.08);
--border-medium: rgba(255, 255, 255, 0.16);
--text-primary: #ffffff;
--text-secondary: #a1a1aa;
--text-muted: #71717a;
--accent-orange: #f97316;
--accent-orange-hover: #ea580c;
--accent-glow: rgba(249, 115, 22, 0.45);
--shadow-card: 0 10px 30px rgba(0, 0, 0, 0.6);
--shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.75);
```

### Section-Specific Colors (keep existing)
```javascript
const COLORS = {
  heatStroke: "#ef4444",
  heatExhaustion: "#f97316",
  dehydration: "#0ea5e9",
  respiratory: "#8b5cf6",
  wildfire: "#dc2626",
  water: "#06b6d4",
  power: "#f59e0b",
  agriculture: "#10b981",
};
```

---

## 4. Framer-Motion Animation Patterns

### From HomeScreen.jsx
```jsx
// Staggered entrance for cards
<motion.div
  initial={{ opacity: 0, y: 28, scale: 0.985 }}
  whileInView={{ opacity: 1, y: 0, scale: 1 }}
  viewport={{ once: true, margin: "-30px" }}
  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
  className="desktop-hero-card"
>
  {/* Hero content */}
</motion.div>

// Subsequent cards with delay
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-30px" }}
  transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
  className="desktop-card"
>
  {/* Card content */}
</motion.div>

// Collapsible sections (already using AnimatePresence)
<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Timing Pattern
- Hero card: delay 0, duration 0.55s
- Left column cards: delays 0.08s, 0.16s, 0.24s... duration 0.5s
- Right column cards: delays 0.05s, 0.13s, 0.21s... duration 0.5s
- Easing: `[0.16, 1, 0.3, 1]` (smooth cubic-bezier)

---

## 5. Layout Plan

### Desktop Layout (>= 1024px)

#### Structure
```
<div className="desktop-view-container">
  <main className="desktop-main-grid">
    <div className="desktop-left-column">
      {/* Hero Card */}
      {/* Official Advisories */}
      {/* Hospital Monitoring */}
      {/* BFP Wildfire Operations */}
      {/* Agricultural Damages */}
    </div>
    
    <div className="desktop-right-column">
      {/* CDRRMO Operations */}
      {/* Scheduled Interruptions */}
      {/* Summary Stats Panel */}
    </div>
  </main>
</div>
```

#### LEFT COLUMN (~62% width)

**1. Hero Card with Background Image**
- Use `desktop-hero-card` class
- Background image: `/elnino_hero.jpg` (drought/heat landscape) or create gradient fallback
- Frosted glass overlay (like HomeScreen weather card)
- Left side: Large emoji 🌡️ + "El Niño Impact Dashboard" title + subtitle
- Right side: Floating glass card with mission statement

**2. Official Advisories Section**
- `desktop-card` with collapsible header
- Icon: `<Megaphone>` with gradient background (blue gradient)
- Grid of advisory cards (keep existing AdvisoryCard component, just restyle)
- Each advisory: borderLeft accent color, rounded corners, urgency badge

**3. Hospital Monitoring Section**
- `desktop-card`
- Icon: `<HeartPulse>` with red gradient background
- 2×2 grid of StatCards (Heat Stroke, Heat Exhaustion, Dehydration, Respiratory)
- Recharts LineChart below stats (keep existing, adjust colors to match theme)

**4. BFP Wildfire Operations Section**
- `desktop-card`
- Icon: `<Flame>` with red-orange gradient
- List of operation cards with fire emoji 🔥 and status badges

**5. Agricultural Damages Section**
- `desktop-card`
- Icon: `<Sprout>` with green gradient
- 3-column stat grid (Hectares, Farmers, Est. Loss)
- List of recent damage reports (farmer name, barangay, area, loss)

#### RIGHT COLUMN (~38% width)

**1. CDRRMO Operations Card**
- `desktop-card`
- Icon: `<Siren>` with orange gradient
- Compact list of active operations
- Status badges (active/ongoing/completed)

**2. Scheduled Interruptions Card**
- `desktop-card`
- Two sub-sections with tabs or divider:
  - Water 💧 (blue icon, Droplet)
  - Power ⚡ (yellow icon, Zap)
- List format: date, time, affected barangays
- Empty state if no interruptions scheduled

**3. Summary Stats Panel**
- `desktop-card`
- Quick metrics:
  - Total active advisories
  - Heat-related cases (last 7 days)
  - Active wildfires
  - Agricultural damages (hectares + ₱)
- Each metric in colored pill badge

### Mobile Layout (<1024px)

Single column stack:
```
<div className="mobile-view-container">
  <div style={{ padding: '20px 16px' }}>
    {/* Hero Card (full width) */}
    {/* All sections stacked vertically */}
  </div>
</div>
```

Use existing collapsible sections, just apply new card styles.

---

## 6. Per-Section Redesign Notes

### Hero Card Redesign
- **Background**: Use CSS `backgroundImage: url('/elnino_hero.jpg')` or solid gradient fallback
- **Overlay**: Apply `::before` pseudo-element with gradient (light 25% opacity, dark 55%)
- **Content Layout**: Flexbox justify-between
- **Left Side**: 
  - Large emoji: `font-size: 64px; margin-bottom: 12px;`
  - Title: `.desktop-hero-temp` style (84px font, white, text-shadow)
  - Subtitle: `.desktop-hero-condition` style (26px font)
- **Right Side**: 
  - Floating glass card: `.desktop-hero-glass-card`
  - Text: "Real-time monitoring of Super El Niño effects across Palayan City with live sensor data and coordinated agency response tracking."

### Advisories Section
- **Header Icon**: Gradient background circle (40×40px, borderRadius 12px)
- **Gradient**: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
- **Card Background**: `var(--bg-card)` with `border: 1px solid var(--border-subtle)`
- **Advisory Cards**: Keep existing expandable logic, restyle:
  - `borderLeft: 4px solid ${urgencyColor}`
  - `borderRadius: 12px`
  - Urgency badge: uppercase, 10px font, colored background

### Hospital Monitoring Section
- **Stat Cards**: 2×2 grid on desktop, 4×1 on mobile
- **StatCard Component**: Already exists, keep, ensure uses:
  - `background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'`
  - `borderLeft: 3px solid ${color}`
  - `borderRadius: 10px`
- **LineChart**: Recharts component stays, adjust:
  - CartesianGrid: `stroke={isDark ? '#27272a' : '#e5e7eb'}`
  - Axis ticks: `fill={isDark ? '#a1a1aa' : '#71717a'}`
  - Tooltip: match card background

### BFP Operations Section
- **Icon Background**: `linear-gradient(135deg, #dc2626 0%, #991b1b 100%)`
- **Operation Cards**: Keep existing, restyle borders and spacing

### CDRRMO Section
- **Icon Background**: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`
- **Compact layout**: Right column, smaller padding

### Agriculture Section
- **Icon Background**: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
- **Stat Grid**: 3 columns (Hectares, Farmers, Est. Loss)
- **Damage Cards**: List with farmer icon, barangay badge, hectares, loss amount

### Interruptions Section
- **Icon Background**: `linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)`
- **Two subsections**: 
  - Water: Blue Droplet icon
  - Power: Yellow Zap icon
- **List format**: Date + Time + Barangays
- **Empty state**: Gray icon + "No scheduled interruptions"

---

## 7. Recharts Integration Notes

### Keep All Recharts Components
- `<LineChart>`, `<BarChart>`, `<PieChart>` stay exactly as-is
- Only adjust theming props:

```jsx
<CartesianGrid 
  strokeDasharray="3 3" 
  stroke={isDark ? '#27272a' : '#e5e7eb'} 
/>
<XAxis 
  dataKey="date" 
  tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#71717a' }} 
/>
<YAxis 
  tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#71717a' }} 
/>
<Tooltip
  contentStyle={{
    background: isDark ? '#18181b' : '#fff',
    border: `1px solid ${isDark ? '#27272a' : '#e5e7eb'}`,
    borderRadius: 8,
    fontSize: 12,
  }}
/>
```

### Line/Bar Colors
- Use existing `COLORS` object
- Ensure sufficient contrast in both themes

---

## 8. Icon Gradient Backgrounds Pattern

For every section header icon:

```jsx
<div style={{
  width: 40,
  height: 40,
  borderRadius: 12,
  background: 'linear-gradient(135deg, #COLOR1 0%, #COLOR2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}}>
  <IconComponent size={20} color="#fff" />
</div>
```

Gradients:
- Advisories: `#3b82f6` → `#2563eb` (blue)
- Hospital: `#ef4444` → `#dc2626` (red)
- BFP: `#dc2626` → `#991b1b` (dark red)
- CDRRMO: `#f59e0b` → `#d97706` (orange)
- Agriculture: `#10b981` → `#059669` (green)
- Interruptions: `#06b6d4` → `#0891b2` (cyan)

---

## 9. Mobile Responsive Adjustments

### Breakpoint: 1024px
```css
@media (min-width: 1024px) {
  .desktop-view-container { display: block; }
  .mobile-view-container { display: none; }
}

@media (max-width: 1023px) {
  .desktop-view-container { display: none; }
  .mobile-view-container { display: block; }
}
```

### Mobile Layout
- Single column, full width
- Remove 2-column grid
- Keep collapsible sections
- Adjust padding: `20px 16px`
- Hero card: min-height 220px, stack content vertically
- Stat grids: 2×2 instead of 4×1, or stack to single column
- Charts: ResponsiveContainer handles width automatically

---

## 10. Stop-Condition File Wiring

### File Path
`c:\Users\User\CLIMA\.agents\tasks\elnino-redesign\done.json`

### Content When Complete
```json
{
  "status": "completed",
  "timestamp": "2025-01-06T10:30:00Z",
  "verification": {
    "visual_match": true,
    "data_queries_unchanged": true,
    "animations_working": true,
    "responsive_tested": true
  }
}
```

### Implementation Steps for Coder
1. After all redesign work complete
2. Run `npm run build` to verify no errors
3. Visually test in browser (desktop + mobile)
4. Confirm all Supabase queries unchanged (git diff check)
5. Write the done.json file
6. Commit with message: "feat: redesign El Niño dashboard to match HomeScreen design system"

---

## 11. Verification Commands

### Build
```bash
npm run build
```
Expected: Clean build with no errors, no warnings related to ElNinoMonitoringDashboard.

### Dev Server
```bash
npm run dev
```
Then navigate to the El Niño dashboard and verify:
- Desktop layout matches HomeScreen premium feel
- Animations smooth on scroll
- Collapsible sections work
- Dark mode toggle reflects correctly
- Mobile view stacks properly
- All data displays (advisories, hospital, BFP, CDRRMO, agriculture, interruptions)

### Code Check
```bash
git diff src/components/dashboard/ElNinoMonitoringDashboard.jsx
```
Verify: NO changes to:
- `fetchAdvisories`
- `fetchHospitalData`
- `fetchBFPOperations`
- `fetchCDRRMOOperations`
- `fetchAgricultureDamages`
- `fetchInterruptions`
- Supabase channel subscriptions
- Any `.from()`, `.select()`, `.eq()`, `.gte()`, `.order()` calls

---

## 12. Implementation Checklist

### Phase 1: Structure
- [ ] Wrap dashboard in `<div className="desktop-view-container">` for desktop
- [ ] Add `<main className="desktop-main-grid">` with left + right columns
- [ ] Create mobile wrapper `<div className="mobile-view-container">`
- [ ] Add responsive CSS media queries

### Phase 2: Hero Card
- [ ] Create hero card with background image/gradient
- [ ] Add frosted glass overlay (::before)
- [ ] Style title + subtitle with HomeScreen typography
- [ ] Add floating glass card on right side

### Phase 3: Left Column Sections
- [ ] Redesign Advisories section header with gradient icon
- [ ] Apply desktop-card class to Advisories
- [ ] Redesign Hospital section with StatCard grid + LineChart
- [ ] Redesign BFP section with operation cards
- [ ] Redesign Agriculture section with 3-stat grid

### Phase 4: Right Column Sections
- [ ] Redesign CDRRMO section (compact layout)
- [ ] Redesign Interruptions section (Water + Power subsections)
- [ ] Add Summary Stats Panel

### Phase 5: Animations
- [ ] Apply framer-motion initial/whileInView to hero card
- [ ] Apply staggered delays to left column cards
- [ ] Apply staggered delays to right column cards
- [ ] Test AnimatePresence on collapsible sections

### Phase 6: Theming
- [ ] Replace all hardcoded colors with CSS variables
- [ ] Test dark mode for all sections
- [ ] Adjust Recharts tooltip/axis colors
- [ ] Verify icon gradient backgrounds in both themes

### Phase 7: Mobile Responsive
- [ ] Test single-column layout on <1024px
- [ ] Verify collapsible sections work on mobile
- [ ] Check hero card mobile stacking
- [ ] Test stat grids on small screens

### Phase 8: Verification
- [ ] Run `npm run build` (no errors)
- [ ] Visual test in browser (desktop + mobile)
- [ ] Git diff confirms no query changes
- [ ] Write done.json file
- [ ] Commit changes

---

## 13. Key Design Principles

1. **Visual-Only Redesign**: Zero changes to data fetching, Supabase queries, or business logic.
2. **Design System Consistency**: Match HomeScreen's card styles, animations, typography, and spacing.
3. **Performance**: Use CSS transforms and framer-motion for smooth 60fps animations.
4. **Accessibility**: Maintain existing ARIA labels, keyboard navigation, and semantic HTML.
5. **Responsiveness**: Desktop 2-column grid, mobile single-column stack.
6. **Dark Mode First**: Use CSS variables for all colors, test both themes.
7. **Data Integrity**: All existing StatCards, Recharts, and data displays remain functional.

---

## 14. Reference Files

### Must Read Before Implementation
1. `c:\Users\User\CLIMA\src\screens\HomeScreen.jsx` (lines 1-1020) — Layout structure, animation patterns, CSS class usage
2. `c:\Users\User\CLIMA\src\index.css` (lines 2100-2500) — Desktop grid, card classes, design tokens
3. `c:\Users\User\CLIMA\src\components\dashboard\ElNinoMonitoringDashboard.jsx` (current file) — Existing component structure, data fetching

### Key Patterns to Extract from HomeScreen
- Hero card with dynamic background image
- 2-column desktop grid (1.62fr 1fr)
- Staggered framer-motion entrance animations
- Gradient icon backgrounds for section headers
- Frosted glass card overlays
- Responsive layout switching at 1024px breakpoint
- Dark mode CSS variable usage

---

## Conclusion

This plan provides a complete blueprint for redesigning the El Niño dashboard to match the premium HomeScreen design while preserving 100% of the existing data logic. The coder should follow this plan section-by-section, referencing the exact CSS classes and animation patterns documented here. The result will be a visually cohesive dashboard that feels like a natural extension of the HomeScreen experience.
