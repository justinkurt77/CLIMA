# Bugfix Requirements Document

## Introduction

The AboutScreen.jsx component is using hardcoded dark blue color values (`#161922` and `#1a1d2e`) for background colors instead of using the system's CSS design tokens (CSS variables). This causes the About page to display dark blue backgrounds in both light and dark modes, breaking the system's theme consistency. The hardcoded colors appear on the body background and header section, making them inconsistent with other screens (Home, Profile, Maps) which properly use CSS variables like `var(--bg-app)`, `var(--bg-card)`, etc.

The bug affects user experience because:
- Light mode users see an incorrect dark background instead of the expected light gray (`--bg-app: #f8f9fa`)
- The About page doesn't match the visual appearance of other system screens
- The design token system is bypassed, breaking the centralized theme management

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the About page is rendered in light mode THEN the body background displays hardcoded dark blue (`#161922` or `#1a1d2e`) instead of light gray

1.2 WHEN the About page is rendered in dark mode THEN the body background displays hardcoded dark blue (`#161922` or `#1a1d2e`) instead of black

1.3 WHEN the About page header section is rendered THEN it uses hardcoded dark blue backgrounds in both light and dark modes instead of design tokens

1.4 WHEN comparing the About page with other screens (Home, Profile, Maps) THEN the background colors are visibly inconsistent because About uses hardcoded colors

### Expected Behavior (Correct)

2.1 WHEN the About page is rendered in light mode THEN the body background SHALL use `var(--bg-app)` which resolves to `#f8f9fa` (light gray)

2.2 WHEN the About page is rendered in dark mode THEN the body background SHALL use `var(--bg-app)` which resolves to `#000000` (black)

2.3 WHEN the About page header section is rendered THEN it SHALL use either `var(--bg-surface)` or a custom gradient that respects the theme mode

2.4 WHEN comparing the About page with other screens (Home, Profile, Maps) THEN the background colors SHALL be consistent across all screens using the same CSS variable system

### Unchanged Behavior (Regression Prevention)

3.1 WHEN card components on the About page are rendered THEN the system SHALL CONTINUE TO use `var(--bg-card)` for card backgrounds

3.2 WHEN text elements on the About page are rendered THEN the system SHALL CONTINUE TO use `var(--text-primary)` and `var(--text-secondary)` color variables

3.3 WHEN border elements on the About page are rendered THEN the system SHALL CONTINUE TO use `var(--border-subtle)` color variables

3.4 WHEN the theme is toggled between light and dark mode THEN all other screens SHALL CONTINUE TO display correctly with proper CSS variable usage

3.5 WHEN animation and layout behavior execute on the About page THEN they SHALL CONTINUE TO function as currently implemented
