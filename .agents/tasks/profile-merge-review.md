# Profile and Reports Merge with Enhanced Auth Flow

Consolidates Settings (ProfileScreen) and My Reports functionality into a single authenticated page. Desktop navigation reduced from 6 items to 5, standalone reports screen removed, and authentication gates added before report submission or profile access. The change keeps the mobile navigation structure unchanged (4 items) and ensures unauthenticated users land on the profile auth screen when attempting protected actions.

Build passed cleanly (3080 modules transformed in 12.15s, exit code 0). All navigation counts, routing logic, and auth checks match the implementation plan.

**Watch for:** None. All requirements met, no blocking concerns.

**Verdict**: APPROVED

## High-level view

Desktop navigation now has 5 items (Home, Map, El Niño, Alerts, Profile) matching the plan's target count. Mobile navigation unchanged at 4 items (Home, Map, Alerts, Profile). The "Reports" nav item is removed, and "Settings" is relabeled "Profile" with the User icon.

The standalone "reports" screen routing block in App.jsx (21 lines) is removed entirely. MyReportsScreen import is deleted. The component itself remains intact and is accessed exclusively through ProfileScreen's internal view state.

App.jsx's `openModal` function now checks session and `first_name` metadata before opening the modal. If either is missing, it redirects to the profile screen instead of opening the modal. This is the primary auth gate.

ProfileScreen's `handleLoginSuccess` callback no longer auto-navigates to home after successful login. Users stay on the profile screen to access the menu, where "My Reports" remains the first item.

ReportModal adds a secondary useEffect-based auth check that closes the modal if it somehow opens without a valid session, logging a console warning. This is defensive — the primary gate is in App.jsx.

<details>
<summary>Issues (0)</summary>

No blocking or non-blocking issues found.

</details>

<details>
<summary>Details</summary>

## Desktop navigation reduced to 5 items

CitizenNav.jsx DESKTOP_NAV_ITEMS array (lines 21-26 post-change) has exactly 5 entries: home, maps, elnino, emergency, profile. The "reports" entry is removed. The profile item label changed from "Settings" to "Profile" and icon from Settings to User. The BarChart2 and Settings icon imports are removed. Mobile nav MOBILE_NAV_ITEMS unchanged at 4 items.

## Standalone reports screen routing removed

App.jsx lines 332-349 (pre-change) contained a motion.div block for `activeScreen === "reports"` that rendered MyReportsScreen. This entire block is deleted. The MyReportsScreen import at line 4 (pre-change) is also removed. The component file itself is unchanged — ProfileScreen still imports and renders it as an internal view when `view === "reports"`.

## Auth check added to openModal

App.jsx `openModal` function (line 223 post-change) checks `if (!session || !session.user?.user_metadata?.first_name)`. If either condition fails, it calls `setActiveScreen('profile')` and returns early without setting modalOpen to true. This redirects unauthenticated users to the profile screen, where ProfileScreen's own auth check will show AuthScreen.

The `first_name` check ensures users have completed profile setup, not just verified email.

## ProfileScreen stays on profile after login

ProfileScreen.jsx `handleLoginSuccess` function (lines 77-80 post-change) now only calls `setShowAuth(false)`. The previous logic that checked `if (setActiveScreen) { setActiveScreen("home"); }` is removed.

## ReportModal defensive auth check

ReportModal.jsx adds a useEffect (lines 39-47 post-change) that runs when `isOpen` or `session` changes. If the modal is open but session is missing or `first_name` metadata is absent, it logs a console warning and calls `handleClose()`. The primary gate is in App.jsx's openModal; this ensures modal state inconsistency doesn't bypass the auth requirement.

The useEffect import is added to line 1 alongside useRef and useState.

## Build verification

Build completed successfully with exit code 0 (3080 modules transformed in 12.15s). No import errors, no syntax errors, no undefined component references.

</details>

<details>
<summary>File Map</summary>

**Modified files:**

- `src/components/layout/CitizenNav.jsx` — removed "reports" nav item from desktop array (5 items now), changed profile label from "Settings" to "Profile", removed BarChart2 and Settings icon imports
- `src/App.jsx` — removed MyReportsScreen import, removed reports screen routing block (21 lines), added auth check to openModal function (redirect to profile if no session or incomplete profile)
- `src/screens/ProfileScreen.jsx` — removed auto-navigate to home in handleLoginSuccess, keeps users on profile screen after successful login
- `src/components/ui/ReportModal.jsx` — added useEffect import, added secondary auth check that closes modal if opened without valid session

**Unchanged:**
- `src/screens/MyReportsScreen.jsx` — still exists, still imported by ProfileScreen

Full diff: `git show 8712051`

</details>
