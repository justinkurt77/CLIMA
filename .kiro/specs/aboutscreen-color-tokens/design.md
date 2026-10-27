# AboutScreen Color Tokens Bugfix Design

## Overview

The AboutScreen component uses hardcoded color values (`#161922` and `#1a1d2e`) instead of CSS variables for background colors. This causes the component to display a dark blue background in both light and dark modes, breaking the theme system. The fix will replace hardcoded values with `var(--bg-app)` which correctly resolves to `#f8f9fa` in light mode and `#000000` in dark mode.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when AboutScreen renders with hardcoded background colors instead of theme-aware CSS variables
- **Property (P)**: The desired behavior - AboutScreen should use `var(--bg-app)` for background colors, respecting light/dark theme
- **Preservation**: Card backgrounds (already using `var(--bg-card)`) and all other styling must remain unchanged
- **bgColor**: The constant variable defined as `const bgColor = isDark ? '#161922' : '#1a1d2e'` in AboutScreen.jsx
- **--bg-app**: The CSS custom property that resolves to `#f8f9fa` (light) or `#000000` (dark) based on theme
- **--bg-card**: The CSS custom property for card backgrounds (already correctly implemented)

## Bug Details

### Bug Condition

The bug manifests when the AboutScreen component is rendered in either light or dark mode. The component defines a `bgColor` constant with hardcoded color values that does not respond to theme changes. Additionally, the header section uses inline theme-conditional colors that should use CSS variables.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { component: React.Component, theme: 'light' | 'dark' }
  OUTPUT: boolean
  
  RETURN input.component === AboutScreen
         AND (usesHardcodedColor(input.component, 'bgColor')
              OR usesHardcodedColor(input.component, 'header.background'))
         AND NOT usesThemeVariable(input.component, '--bg-app')
END FUNCTION
```

### Examples

- **Light Mode Issue**: User enables light mode → AboutScreen displays dark blue background (`#1a1d2e`) → Expected: light background (`#f8f9fa`)
- **Dark Mode Issue**: User enables dark mode → AboutScreen displays dark blue background (`#161922`) instead of pure black → Expected: black background (`#000000`)
- **Header Section Issue**: Header uses conditional `isDark ? '#161922' : '#1a1d2e'` → Always shows dark blue → Expected: respects theme via CSS variables
- **Edge Case - Theme Toggle**: User toggles theme while on AboutScreen → Background color does not update correctly → Expected: smooth transition to correct theme background

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Card backgrounds must continue using `var(--bg-card)` exactly as implemented
- All text colors using `var(--text-primary)` and `var(--text-secondary)` must remain unchanged
- Border colors using `var(--border-subtle)` must remain unchanged
- All padding, margins, layout, and spacing must remain exactly the same
- Animation transitions and motion effects must remain unchanged
- Logo display, version badge, share button functionality must remain unchanged
- All gradient backgrounds (KloudTech card, PalaSumbong card) must remain unchanged
- All helper component styling (FeatureCard, TechCard, InfoPill, etc.) must remain unchanged

**Scope:**
All styling that does NOT involve the main container background colors should be completely unaffected by this fix. This includes:
- Card components and their backgrounds
- Text styling and colors
- Icon colors and sizes
- Border styles
- Interactive hover effects
- Gradient hero cards
- Button styles

## Hypothesized Root Cause

Based on the bug description and code review, the root cause is clear:

1. **Hardcoded bgColor Constant**: The component defines `const bgColor = isDark ? '#161922' : '#1a1d2e'` which uses hardcoded hex values instead of CSS variables
   - This constant is used in multiple places (main wrapper, scrollable content, content sections)
   - The colors chosen (`#161922` and `#1a1d2e`) are both dark blue variants

2. **Header Section Inline Style**: The header section uses `background: isDark ? '#161922' : '#1a1d2e'` in inline styles
   - This duplicates the hardcoded color logic
   - Should use CSS variables for consistency

3. **Theme Context Not Utilized**: While the component imports and uses `useTheme()` hook, it only reads `isDark` to conditionally apply hardcoded colors instead of letting CSS variables handle the theming

4. **CSS Variable System Ignored**: The app's CSS variable system (`--bg-app`, `--bg-card`, etc.) is properly defined but not used for these background colors

## Correctness Properties

Property 1: Bug Condition - Background Uses Theme Variables

_For any_ render of AboutScreen where theme variables are defined in the CSS system, the component SHALL use `var(--bg-app)` for all main container backgrounds, allowing the background color to dynamically resolve to `#f8f9fa` in light mode and `#000000` in dark mode.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Card and Text Styling Unchanged

_For any_ render of AboutScreen where the bug fix has been applied, the component SHALL produce exactly the same visual appearance for all card backgrounds, text colors, borders, spacing, animations, and interactive elements as the original component, preserving all existing styling except for the main container background colors.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

The fix is straightforward and surgical:

**File**: `src/screens/AboutScreen.jsx`

**Function**: `AboutScreen` component

**Specific Changes**:

1. **Remove bgColor Constant**: Delete the line:
   ```javascript
   const bgColor = isDark ? '#161922' : '#1a1d2e';
   ```

2. **Update Main Wrapper Background**: Replace `background: bgColor,` with:
   ```javascript
   background: 'var(--bg-app)',
   ```

3. **Update Scrollable Content Background**: Replace `background: bgColor,` with:
   ```javascript
   background: 'var(--bg-app)',
   ```

4. **Update Header Section Background**: Replace `background: isDark ? '#161922' : '#1a1d2e',` with:
   ```javascript
   background: 'var(--bg-app)',
   ```
   Note: Alternatively, could remove this property entirely to inherit from parent

5. **Update Content Sections Background**: Replace `background: bgColor,` with:
   ```javascript
   background: 'var(--bg-app)',
   ```

6. **Verify No Other References**: Ensure no other instances of `bgColor`, `#161922`, or `#1a1d2e` remain in the file

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis by observing hardcoded backgrounds in both themes.

**Test Plan**: Manually test AboutScreen in both light and dark modes on the UNFIXED code. Observe the background colors and verify they do not match the expected theme colors. Use browser DevTools to inspect computed styles and confirm hardcoded values are being applied.

**Test Cases**:
1. **Light Mode Background Test**: Open AboutScreen in light mode → Observe dark blue background (`#1a1d2e`) → Expected in unfixed code: fails (wrong color)
2. **Dark Mode Background Test**: Open AboutScreen in dark mode → Observe dark blue background (`#161922`) → Expected in unfixed code: fails (not pure black)
3. **Theme Toggle Test**: Toggle theme while on AboutScreen → Observe background changes between two dark blue variants → Expected in unfixed code: fails (should be light/dark contrast)
4. **DevTools Inspection**: Inspect computed styles → Find hardcoded hex values instead of CSS variables → Expected in unfixed code: confirms root cause

**Expected Counterexamples**:
- Background color does not match theme expectations (light theme shows dark blue)
- Computed styles show `#161922` or `#1a1d2e` instead of CSS variable values
- Theme toggle does not produce expected light/dark contrast
- Possible causes: hardcoded colors in component, CSS variables not being referenced

### Fix Checking

**Goal**: Verify that after applying the fix, AboutScreen correctly uses CSS variables and displays the proper background color in both light and dark modes.

**Pseudocode:**
```
FOR ALL theme IN ['light', 'dark'] DO
  result := renderAboutScreen(theme)
  ASSERT result.backgroundColor = getCSSVariableValue('--bg-app', theme)
  ASSERT NOT containsHardcodedColor(result, '#161922')
  ASSERT NOT containsHardcodedColor(result, '#1a1d2e')
END FOR
```

### Preservation Checking

**Goal**: Verify that for all visual elements NOT related to the main container background, the fixed component produces the same result as the original component.

**Pseudocode:**
```
FOR ALL visualElement IN [cards, text, borders, spacing, animations] DO
  ASSERT renderAboutScreen_original(theme, visualElement) = renderAboutScreen_fixed(theme, visualElement)
END FOR
```

**Testing Approach**: Manual visual regression testing is recommended for preservation checking because:
- It captures subtle visual differences that automated tests might miss
- It verifies layout, spacing, and styling remain pixel-perfect
- It confirms animations and interactions work identically
- It validates that only the intended background colors changed

**Test Plan**: Observe the UNFIXED AboutScreen's appearance for cards, text, animations, and interactions. Take screenshots. After applying the fix, compare side-by-side to verify all non-background elements are identical.

**Test Cases**:
1. **Card Background Preservation**: Verify all cards continue using `var(--bg-card)` and display correctly in both themes
2. **Text Color Preservation**: Verify all text colors remain unchanged (primary, secondary, white text on gradients)
3. **Layout and Spacing Preservation**: Verify padding, margins, gaps, and responsive grid layouts remain identical
4. **Animation Preservation**: Verify Framer Motion animations (fade-in, scale, hover effects) continue working identically
5. **Interactive Element Preservation**: Verify buttons (copy, share), links, and hover states work identically
6. **Gradient Card Preservation**: Verify KloudTech and PalaSumbong hero cards with gradients remain unchanged
7. **Logo and Badge Preservation**: Verify logo display, version badge, and visual hierarchy remain unchanged

### Unit Tests

- Test that AboutScreen component renders without errors in light mode
- Test that AboutScreen component renders without errors in dark mode
- Test that computed background style uses CSS variable reference
- Test that no hardcoded color strings (`#161922`, `#1a1d2e`) exist in rendered output
- Test that card backgrounds continue using `var(--bg-card)`

### Property-Based Tests

- Generate random theme toggles and verify background always matches expected CSS variable value
- Generate random viewport sizes and verify layout remains consistent with theme changes
- Test across multiple theme switches to ensure no memory leaks or style accumulation

### Integration Tests

- Test full app flow: navigate to AboutScreen → toggle theme → verify background updates
- Test deep linking: open app directly to `/about` in different themes → verify correct background
- Test theme persistence: reload page while on AboutScreen → verify theme is restored correctly
- Test responsive behavior: resize viewport on AboutScreen → verify background remains correct

### Manual Visual Regression Test Plan

**Pre-Fix Screenshots (UNFIXED code):**
1. AboutScreen in light mode - full scroll
2. AboutScreen in dark mode - full scroll
3. Close-up of header section in both themes
4. Close-up of card section in both themes

**Post-Fix Verification (FIXED code):**
1. AboutScreen in light mode - verify light background (`#f8f9fa`)
2. AboutScreen in dark mode - verify dark background (`#000000`)
3. Compare cards side-by-side - verify identical appearance
4. Compare text colors side-by-side - verify identical appearance
5. Test hover interactions - verify identical behavior
6. Test animations - verify identical motion effects
7. Verify no visual regressions in any section

**Success Criteria:**
- Light mode shows proper light background (not dark blue)
- Dark mode shows proper dark background (pure black, not dark blue)
- All card, text, border, spacing, and animation styling is pixel-perfect identical to unfixed version
- Theme toggle produces smooth transition between light and dark backgrounds
- No console errors or warnings
- DevTools inspection shows CSS variable usage instead of hardcoded colors
