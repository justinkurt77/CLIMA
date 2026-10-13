# CLIMA Design System Document

## Brand Identity

**Project Names:**
- **CLIMA** (Climate Information Monitoring and Awareness)
- **PalaSumbong** (Tagalog: "Report Palace" — citizen reporting portal)

**Organization:** Palayan City Government, Nueva Ecija, Philippines

**Purpose:** Public safety and climate awareness platform for disaster response

**Visual Identity:**
- Modern, approachable government service
- Mobile-first design language
- Emphasis on readability and accessibility
- Color-coded departmental theming

---

## Color Palette

### Primary Colors (Light Mode)

| Variable | Hex | Usage |
|----------|-----|-------|
| `--red` | #f97316 | Primary brand color, CTAs, accent elements |
| `--red-dark` | #ea580c | Hover states, active buttons |
| `--orange` | #f97316 | Alias for primary color |
| `--accent-orange` | #f97316 | Accent highlights |
| `--accent-orange-hover` | #ea580c | Hover state for accent elements |
| `--accent-glow` | rgba(249, 115, 22, 0.35) | Glow effects, shadows |

### Status Colors

| Variable | Hex | Usage |
|----------|-----|-------|
| `--green` (text) | #18181b | Success states, resolved status (light mode uses dark text) |
| Success (hardcoded) | #4BB450 | Success badges, resolved status backgrounds |
| Error (hardcoded) | #E74C3C | Error messages, critical alerts |
| Info (hardcoded) | #3498DB | Info messages, water/health themes |
| Warning (hardcoded) | #F39C12 | Warning messages, pending status |

### Neutral/Background Colors (Light Mode)

| Variable | Hex | Usage |
|----------|-----|-------|
| `--white` | #ffffff | Pure white for contrast elements |
| `--cream` | #ffffff | Alias for white |
| `--yellow` | #f4f4f5 | Light gray (misnamed variable) |
| `--bg-app` | #f8f9fa | App background (off-white) |
| `--bg-surface` | #ffffff | Card/surface background |
| `--bg-card` | #ffffff | Card background |
| `--bg-card-subtle` | #f4f4f6 | Subtle card background variant |
| `--bg-glass` | rgba(255, 255, 255, 0.88) | Glassmorphism effect (88% opacity) |
| `--light-gray` | #f4f4f5 | Light gray backgrounds |

### Text Colors (Light Mode)

| Variable | Hex | Usage |
|----------|-----|-------|
| `--text-primary` | #09090b | Primary body text (near-black) |
| `--text-secondary` | #52525b | Secondary text (medium gray) |
| `--text-muted` | #71717a | Muted/disabled text (light gray) |
| `--gray` | #71717a | Alias for muted text |

### Navigation Colors (Light Mode)

| Variable | Hex/RGBA | Usage |
|----------|----------|-------|
| `--nav-bg` | rgba(255, 255, 255, 0.92) | Bottom nav background (92% opacity) |
| `--nav-border` | rgba(0, 0, 0, 0.1) | Nav border (10% black) |
| `--nav-active-bg` | rgba(249, 115, 22, 0.12) | Active tab background (12% orange) |
| `--nav-active-border` | rgba(249, 115, 22, 0.4) | Active tab border (40% orange) |
| `--nav-active-text` | #ea580c | Active tab text (dark orange) |

### Border Colors (Light Mode)

| Variable | RGBA | Usage |
|----------|------|-------|
| `--border-subtle` | rgba(0, 0, 0, 0.08) | Subtle dividers (8% black) |
| `--border-medium` | rgba(0, 0, 0, 0.14) | Medium emphasis borders (14% black) |

### Shadow Styles (Light Mode)

| Variable | Shadow | Usage |
|----------|--------|-------|
| `--shadow-card` | 0 10px 30px rgba(0, 0, 0, 0.06) | Card drop shadows |
| `--shadow-lg` | 0 16px 40px rgba(0, 0, 0, 0.1) | Large elevation shadows (modals) |

### Button Colors (Light Mode)

| Variable | Hex | Usage |
|----------|-----|-------|
| `--btn-primary-bg` | #f97316 | Primary button background |
| `--btn-primary-text` | #ffffff | Primary button text |

---

### Dark Mode Colors

**Background Colors:**

| Variable | Hex/RGBA | Usage |
|----------|----------|-------|
| `--bg-app` | #000000 | Pure black app background |
| `--bg-surface` | #09090b | Slightly lighter surface (near-black) |
| `--bg-card` | #121214 | Card background (dark gray) |
| `--bg-card-subtle` | #18181b | Subtle card variant |
| `--bg-glass` | rgba(16, 16, 18, 0.94) | Glassmorphism effect (94% opacity) |

**Text Colors:**

| Variable | Hex | Usage |
|----------|-----|-------|
| `--text-primary` | #ffffff | Primary text (white) |
| `--text-secondary` | #a1a1aa | Secondary text (light gray) |
| `--text-muted` | #71717a | Muted text (medium gray) |

**Navigation Colors:**

| Variable | RGBA/Hex | Usage |
|----------|----------|-------|
| `--nav-bg` | rgba(12, 12, 14, 0.94) | Bottom nav background (94% opacity) |
| `--nav-border` | rgba(255, 255, 255, 0.12) | Nav border (12% white) |
| `--nav-active-bg` | rgba(249, 115, 22, 0.2) | Active tab background (20% orange) |
| `--nav-active-border` | rgba(249, 115, 22, 0.5) | Active tab border (50% orange) |
| `--nav-active-text` | #f97316 | Active tab text (bright orange) |

**Border Colors:**

| Variable | RGBA | Usage |
|----------|------|-------|
| `--border-subtle` | rgba(255, 255, 255, 0.08) | Subtle dividers (8% white) |
| `--border-medium` | rgba(255, 255, 255, 0.16) | Medium emphasis borders (16% white) |

**Shadow Styles:**

| Variable | Shadow | Usage |
|----------|--------|-------|
| `--shadow-card` | 0 10px 30px rgba(0, 0, 0, 0.6) | Card drop shadows (darker) |
| `--shadow-lg` | 0 16px 40px rgba(0, 0, 0, 0.75) | Large elevation shadows (darker) |

---

### Agency-Specific Colors

Departments have custom accent colors stored in `departments.accent_color` (database):

**Expected Palette (based on typical government agency colors):**
- **CDRRMO:** #3498DB (Blue) — Emergency management
- **BFP:** #E74C3C (Red) — Fire protection
- **Hospital/Health:** #4BB450 (Green) — Healthcare
- **Agriculture:** #27AE60 (Green) — Agriculture/environment
- **Water Utility:** #5DADE2 (Light Blue) — Water services
- **Power Utility:** #F39C12 (Yellow/Orange) — Electrical services
- **LGU/Generic:** #f97316 (Orange) — Default/administrative

**Usage:** Admin dashboard sidebar and headers dynamically themed with department accent color.

---

## Typography

### Font Families

**Primary (Body & UI):**
```css
font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```
- **Nunito** — Rounded, friendly sans-serif (Google Fonts)
- Fallback to system fonts for performance

**Display (Logos & Heroes):**
```css
font-family: "Baloo 2", cursive;
```
- **Baloo 2** — Playful, rounded display font (Google Fonts)
- Used for CLIMA logo, hero headings

**Monospace (Codes, OTPs):**
```css
font-family: "Courier New", monospace;
```
- Used for OTP codes, tracking IDs, technical data

---

### Type Scale

| Context | Font Size | Font Weight | Line Height | Usage |
|---------|-----------|-------------|-------------|-------|
| Hero | 32px | 700 (Bold) | 1.2 | Main landing headlines |
| Hero (Mobile) | 26px | 700 (Bold) | 1.2 | Mobile hero text |
| H1 | 24px | 700 (Bold) | 1.3 | Page titles |
| H2 | 20px | 600 (SemiBold) | 1.4 | Section headings |
| H3 | 18px | 600 (SemiBold) | 1.4 | Subsection headings |
| H4 | 16px | 600 (SemiBold) | 1.4 | Card titles |
| Body (Large) | 15px | 400 (Regular) | 1.6 | Main content, descriptions |
| Body (Default) | 14px | 400 (Regular) | 1.6 | Standard UI text |
| Body (Small) | 13px | 400 (Regular) | 1.5 | Labels, captions |
| Caption | 12px | 400 (Regular) | 1.4 | Timestamps, metadata |
| Tiny | 10px | 400 (Regular) | 1.3 | Legal text, fine print |

### Font Weights

- **400 (Regular):** Body text, descriptions
- **500 (Medium):** Emphasized text (rarely used)
- **600 (SemiBold):** Headings, buttons, labels
- **700 (Bold):** Hero text, primary headings

---

## Spacing System

### Base Unit: 4px

**Common Spacing Values:**

| Variable/Class | Value | Usage |
|----------------|-------|-------|
| xs | 4px | Tight spacing, icon-text gaps |
| sm | 8px | Small gaps, compact layouts |
| md | 12px | Default spacing, form field gaps |
| base | 16px | Standard padding, card padding |
| lg | 20px | Generous spacing, section gaps |
| xl | 24px | Large spacing, hero padding |
| 2xl | 32px | Extra large spacing, screen padding |
| 3xl | 48px | Hero sections, major dividers |

**Common Patterns:**
- **Card padding:** 16px (mobile), 20px (desktop)
- **Screen padding:** 16px horizontal (mobile), 24px (desktop)
- **Gap between cards:** 12px (mobile), 16px (desktop)
- **Form field gap:** 12px vertical
- **Section gap:** 24px vertical

---

## Border Radius Scale

| Value | Usage |
|-------|-------|
| 4px | Small elements (badges, chips) |
| 8px | Buttons, inputs, small cards |
| 12px | Standard cards, modals |
| 16px | Large cards, hero sections |
| 24px | Rounded containers, feature cards |
| 999px (full) | Pills, fully rounded buttons |

---

## Component Patterns

### Cards

#### Desktop Card
```css
.desktop-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-subtle);
}
```

#### Hero Card
```css
.hero-card {
  background: linear-gradient(135deg, #f97316, #ea580c);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: var(--shadow-lg);
}
```

#### Glass Card (Glassmorphism)
```css
.glass-card {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid var(--border-medium);
}
```

---

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s ease;
}
.btn-primary:hover {
  background: var(--accent-orange-hover);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}
.btn-secondary:hover {
  background: var(--bg-card-subtle);
}
```

#### Danger Button
```css
.btn-danger {
  background: #E74C3C;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}
.btn-danger:hover {
  background: #C0392B;
}
```

#### Icon Button
```css
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
}
```

---

### Navigation

#### Desktop Sidebar (Admin)
```css
.sidebar {
  width: 260px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  padding: 20px 0;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
}
.sidebar-item {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}
.sidebar-item.active {
  background: var(--nav-active-bg);
  color: var(--nav-active-text);
  border-right: 3px solid var(--accent-orange);
}
```

#### Mobile Bottom Nav
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: var(--nav-bg);
  border-top: 1px solid var(--nav-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  backdrop-filter: blur(12px);
  z-index: 1000;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
}
.nav-item.active {
  background: var(--nav-active-bg);
  color: var(--nav-active-text);
  border: 1px solid var(--nav-active-border);
}
```

---

### Forms

#### Input Field
```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  transition: border 0.2s ease;
}
.input:focus {
  outline: none;
  border-color: var(--accent-orange);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.input::placeholder {
  color: var(--text-muted);
}
```

#### Label
```css
.label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}
```

#### Textarea
```css
.textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
}
```

#### Select Dropdown
```css
.select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Chevron down icon */
}
```

---

### Modals

#### Modal Backdrop
```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### Modal Container
```css
.modal {
  background: var(--bg-surface);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  z-index: 9999;
}
.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-body {
  padding: 20px;
}
.modal-footer {
  padding: 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

---

### Status Badges

#### Badge Base
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

#### Status Variants
```css
.badge-pending {
  background: rgba(243, 156, 18, 0.2);
  color: #F39C12;
}
.badge-in-progress {
  background: rgba(52, 152, 219, 0.2);
  color: #3498DB;
}
.badge-resolved {
  background: rgba(75, 180, 80, 0.2);
  color: #4BB450;
}
.badge-rejected {
  background: rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}
```

#### Severity Badges (Advisories)
```css
.badge-low {
  background: rgba(52, 152, 219, 0.2);
  color: #3498DB;
}
.badge-medium {
  background: rgba(243, 156, 18, 0.2);
  color: #F39C12;
}
.badge-high {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}
.badge-critical {
  background: rgba(231, 76, 60, 0.2);
  color: #E74C3C;
}
```

---

## Motion & Animation

### Transition Durations

| Duration | Usage |
|----------|-------|
| 150ms | Micro-interactions (hover, focus) |
| 200ms | Button states, color changes |
| 300ms | Slide animations, modal open/close |
| 500ms | Page transitions, screen changes |

### Easing Curves

**Default:** `ease` (cubic-bezier(0.25, 0.1, 0.25, 1.0))  
**Ease-Out:** `ease-out` (cubic-bezier(0, 0, 0.58, 1.0)) — Elements entering  
**Ease-In:** `ease-in` (cubic-bezier(0.42, 0, 1, 1)) — Elements exiting  
**Spring (Framer Motion):** `type: "spring", stiffness: 300, damping: 30`

---

### Animation Patterns (Framer Motion)

#### Page Transition
```javascript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
const pageTransition = { duration: 0.3, ease: "easeOut" };
```

#### Modal Animation
```javascript
const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};
const modalTransition = { duration: 0.2, ease: "easeOut" };
```

#### Slide In (Bottom Nav)
```javascript
const slideUpVariants = {
  initial: { y: 100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 100, opacity: 0 }
};
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile (sm) | < 768px | Single column, bottom nav |
| Tablet (md) | 768px - 1024px | Single column, optional sidebar |
| Desktop (lg) | >= 1024px | Sidebar nav (admin), centered shell with margins (citizen) |

### Layout Patterns

#### Mobile (< 1024px)
- **Citizen:** Full-width screens, bottom navigation (70px height), 16px side padding
- **Admin:** Login screen full-width, dashboard with mobile hamburger menu (future)
- **Cards:** Full-width with 12px gap
- **Typography:** Smaller hero (26px), body (14px)

#### Desktop (>= 1024px)
- **Citizen:** Centered shell with max-width 1200px, 48px side margins, "desktop card" styling
- **Admin:** Fixed sidebar (260px width), content area with left margin
- **Cards:** Grid layouts (2-3 columns), 16px gap
- **Typography:** Larger hero (32px), body (15px)

### CSS Media Query
```css
@media (min-width: 1024px) {
  /* Desktop styles */
}
```

---

## Icon System

### Library
**Lucide React** v0.575.0 — 686+ open-source icons

### Icon Sizes

| Size | Dimension | Usage |
|------|-----------|-------|
| xs | 14px | Inline icons, badges |
| sm | 16px | Buttons, labels |
| md | 20px | Navigation, cards |
| lg | 24px | Hero sections, feature cards |
| xl | 32px | Large CTAs, empty states |

### Common Icons Used

| Icon Name | Usage |
|-----------|-------|
| Home | Home tab, dashboard |
| Map | Map tab, location |
| AlertTriangle | Emergency tab, warnings |
| User | Profile tab, user management |
| Sun | El Niño tab, weather |
| Settings | Settings, configuration |
| Bell | Notifications, alerts |
| LogOut | Logout button |
| Plus | Add actions, create new |
| X | Close buttons, dismiss |
| ChevronDown | Dropdowns, expand |
| ChevronRight | Navigation, next |
| Check | Success states, completed |
| AlertCircle | Errors, attention |
| Info | Information, help |
| Search | Search bars |
| Filter | Filter controls |
| Upload | Photo upload |
| MapPin | Location markers |
| Flame | BFP operations |
| Droplet | Water utility |
| Zap | Power utility |
| Sprout | Agriculture |
| Heart | Hospital/health |
| Shield | CDRRMO operations |

### Icon Style
- **Stroke Width:** 2px (default)
- **Color:** Inherits from parent text color
- **Variants:** No filled icons, stroke-only for consistency

---

## Map Styling

### Mapbox Style
**Style URL:** `mapbox://styles/mapbox/streets-v12` (default)  
**Alternative:** `mapbox://styles/mapbox/dark-v11` (dark mode, not currently implemented)

### Map Markers

#### Report Pins
- **Shape:** Circle with icon
- **Size:** 32px diameter (default), 40px (selected)
- **Color:** Category-specific (e.g., red for fire, blue for water, green for health)
- **Clustering:** Enabled with count badge

#### Facility Markers
- **Hospitals:** Red cross icon, white background, red border
- **Fire Stations:** Flame icon, red background
- **Evacuation Centers:** Shelter icon, blue background
- **Water Facilities:** Droplet icon, blue background
- **Power Feeders:** Zap icon, yellow background
- **Weather Stations:** Cloud icon, gray background

### Cluster Styles
- **Small Cluster (< 10):** 40px circle, light orange background
- **Medium Cluster (10-50):** 50px circle, medium orange background
- **Large Cluster (> 50):** 60px circle, dark orange background
- **Text:** White, bold, centered

---

## Scrollbar Styles

### Webkit Browsers (Chrome, Safari, Edge)
```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18); /* Light mode */
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-orange); /* Orange on hover */
}
/* Dark mode */
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.22);
}
```

### Firefox
```css
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) transparent; /* Light mode */
}
/* Dark mode */
* {
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
}
```

### Hide Scrollbar (Utility Class)
```css
.hide-scroll::-webkit-scrollbar {
  display: none;
}
.hide-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

## Accessibility Considerations

### Color Contrast
- **WCAG 2.1 AA Target:** 4.5:1 for normal text, 3:1 for large text
- **Primary orange (#f97316) on white:** 3.9:1 (fails for small text, use with large/bold text only)
- **Text primary (#09090b) on white:** 20.8:1 (passes)
- **Text secondary (#52525b) on white:** 8.1:1 (passes)
- **Text muted (#71717a) on white:** 4.9:1 (passes for small text)

**Recommendation:** Use primary orange for large elements (buttons, headings), not small body text.

### Focus States
- **Visible outline:** 2px solid orange, 3px offset
- **Box shadow:** 0 0 0 3px var(--accent-glow)
- **Applied to:** All interactive elements (buttons, inputs, links)

### Touch Targets
- **Minimum size:** 44x44px (WCAG 2.5.5 AAA)
- **Navigation buttons:** 60x60px (exceeds minimum)
- **Form buttons:** 48px height (exceeds minimum)

---

## Document Version

**Version:** 1.0  
**Generated:** January 4, 2026  
**Based on:** ANALYSIS.md (CLIMA System Comprehensive Code Analysis)

---

**END OF DESIGN SYSTEM DOCUMENT**
