# Implementation Plan: AboutScreen Color Token Bugfix

## Overview

Fix the AboutScreen component to use CSS design tokens (`var(--bg-app)`) instead of hardcoded color values. The component currently uses `const bgColor = isDark ? '#161922' : '#1a1d2e'` which causes dark blue backgrounds in both light and dark modes. This fix will ensure the About page respects the theme system like other screens.

## Tasks

- [x] 1. Remove hardcoded bgColor constant from AboutScreen.jsx
  - Dependencies: []
  - Remove the line: `const bgColor = isDark ? '#161922' : '#1a1d2e';`
  - Files: src/screens/AboutScreen.jsx

- [x] 2. Replace bgColor with var(--bg-app) in main wrapper
  - Dependencies: [1]
  - Update main wrapper div background from `background: bgColor,` to `background: 'var(--bg-app)',`
  - Files: src/screens/AboutScreen.jsx

- [x] 3. Replace bgColor with var(--bg-app) in scrollable content  
  - Dependencies: [1]
  - Update scrollable content div background from `background: bgColor,` to `background: 'var(--bg-app)',`
  - Files: src/screens/AboutScreen.jsx

- [x] 4. Update header section background to CSS variable
  - Dependencies: [1]
  - Replace header background from `background: isDark ? '#161922' : '#1a1d2e',` to `background: 'var(--bg-app)',`
  - Files: src/screens/AboutScreen.jsx

- [x] 5. Replace bgColor in content sections wrapper
  - Dependencies: [1]
  - Update content sections wrapper background from `background: bgColor,` to `background: 'var(--bg-app)',`
  - Files: src/screens/AboutScreen.jsx

- [x] 6. Verify no remaining hardcoded colors
  - Dependencies: [2, 3, 4, 5]
  - Search for any remaining instances of `#161922`, `#1a1d2e`, or `bgColor`
  - Ensure code compiles without errors
  - Files: src/screens/AboutScreen.jsx

- [ ] 7. Manual test - Light mode background
  - Dependencies: [6]
  - Open app in light mode, navigate to About tab
  - Verify background is light gray (#f8f9fa)
  - DevTools: check `var(--bg-app)` resolves correctly
  - Compare with Home screen background

- [ ] 8. Manual test - Dark mode background
  - Dependencies: [6]
  - Toggle to dark mode on About tab
  - Verify background is pure black (#000000)
  - DevTools: check `var(--bg-app)` resolves correctly
  - Compare with Home screen background

- [ ] 9. Manual test - Theme toggle transition
  - Dependencies: [7, 8]
  - Stay on About tab and toggle theme multiple times
  - Verify smooth background color transition
  - Check for visual glitches or console errors

- [ ] 10. Visual regression check - Verify card styling preserved
  - Dependencies: [9]
  - Verify all cards still use `var(--bg-card)` backgrounds
  - Check text colors, borders, padding, margins unchanged
  - Test gradient hero cards (KloudTech, PalaSumbong)
  - Verify animations and hover effects work
  - Test version badge copy button and share button

- [x] 11. Build and commit changes
  - Dependencies: [10]
  - Run `npm run build` successfully
  - Commit with message: "Fix AboutScreen color tokens - use var(--bg-app)"
  - Files: src/screens/AboutScreen.jsx

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2, 3, 4, 5] },
    { "wave": 3, "tasks": [6] },
    { "wave": 4, "tasks": [7, 8] },
    { "wave": 5, "tasks": [9] },
    { "wave": 6, "tasks": [10] },
    { "wave": 7, "tasks": [11] }
  ]
}
```

Visual:
```
1 (Remove bgColor)
├─> 2 (Main wrapper)
├─> 3 (Scrollable content)
├─> 4 (Header section)
└─> 5 (Content wrapper)
    └─> 6 (Verify clean)
        ├─> 7 (Test light)
        └─> 8 (Test dark)
            └─> 9 (Test toggle)
                └─> 10 (Visual regression)
                    └─> 11 (Build & commit)
```

## Notes

- The fix is surgical - only replace hardcoded colors with CSS variables
- All card backgrounds, text, borders, animations must remain unchanged
- Header section can either use `var(--bg-app)` or inherit from parent
- Visual regression testing is critical to ensure no unintended changes
- Expected colors: Light=#f8f9fa (gray), Dark=#000000 (black)

