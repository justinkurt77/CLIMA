# Implementation Plan: Merge Settings and My Reports with Enhanced Auth Flow

## Overview
Merge the Settings (ProfileScreen) and My Reports functionality into a single authenticated page. Remove the separate "reports" navigation item and enhance the auth flow so users must be logged in to access profile/reports features or submit new reports.

## Context Analysis

**Current Navigation Structure:**
- **Mobile (CitizenNav.jsx)**: 4 items in MOBILE_NAV_ITEMS array
  - home, maps, emergency, profile
- **Desktop (CitizenNav.jsx)**: 6 items in DESKTOP_NAV_ITEMS array
  - home, maps, elnino, emergency, reports, profile

**Current App.jsx Routing:**
- Has separate screen routes for: home, maps, elnino, emergency, profile, reports, admin, admin-map
- ReportModal opens via `onOpenModal` callback prop
- Session state is managed globally via `session` state

**Current ProfileScreen Behavior:**
- Shows AuthScreen if not logged in or profile incomplete (`!session?.user?.user_metadata?.first_name`)
- Has internal view states: "menu", "reports", "customize", "support"
- "My Reports" is first item in menuItems array
- Already filters `userReports` to show only the logged-in user's reports

**Current ReportModal:**
- Currently does not check authentication before opening
- Allows guest submissions (prompts for name/contact if no session)

---

## Implementation Steps

### 1. Update CitizenNav.jsx - Remove "Reports" from Desktop Navigation
**What:** Remove the "reports" nav item from DESKTOP_NAV_ITEMS array to match the mobile navigation pattern (4 items mobile, 5 items desktop).

**Files:**
- `c:\Users\User\CLIMA/src/components/layout/CitizenNav.jsx`

**Changes:**
- In DESKTOP_NAV_ITEMS array, remove the line:
  ```javascript
  { id: "reports", label: "Reports", icon: BarChart2 },
  ```
- Change the profile item label from "Settings" to "Profile" for consistency:
  ```javascript
  { id: "profile", label: "Profile", icon: User },
  ```
- Remove the `BarChart2` icon import if no longer used elsewhere (verify first)

**Current DESKTOP_NAV_ITEMS (lines 18-25):**
```javascript
const DESKTOP_NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "elnino", label: "El Niño", icon: Activity },
  { id: "emergency", label: "Alerts", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: BarChart2 },      // ← REMOVE THIS LINE
  { id: "profile", label: "Settings", icon: Settings },       // ← CHANGE TO: label: "Profile", icon: User
];
```

**After:**
```javascript
const DESKTOP_NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "maps", label: "Map", icon: MapPin },
  { id: "elnino", label: "El Niño", icon: Activity },
  { id: "emergency", label: "Alerts", icon: AlertTriangle },
  { id: "profile", label: "Profile", icon: User },
];
```

**Icon Import Changes:**
- Keep `User` import (already imported for MOBILE_NAV_ITEMS)
- Remove `Settings` import (line 8)
- Remove `BarChart2` import (line 8) if not used elsewhere in the file

**Verify:** Run `npm run dev` and confirm desktop navigation displays 5 items (Home, Map, El Niño, Alerts, Profile) and mobile displays 4 items (Home, Map, Alerts, Profile).

---

### 2. Update App.jsx - Remove Reports Screen Routing and Add Auth Check to Report Modal

**What:** Remove the "reports" screen case from App.jsx routing, and add authentication check when opening the ReportModal.

**Files:**
- `c:\Users\User\CLIMA/src/App.jsx`

**Changes:**

**A. Remove reports screen routing** (lines 332-349):
```javascript
{activeScreen === "reports" && (
  <motion.div
    key="reports"
    variants={screenVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={screenVariants.transition}
    className="screen active citizen-screen-view"
    style={{
      zIndex: 10,
      background: "transparent",
    }}
  >
    <MyReportsScreen
      onOpenModal={openModal}
      userReports={userReports}
    />
  </motion.div>
)}
```
Entire block should be removed.

**B. Enhance the `openModal` function** (currently line 127):

Replace:
```javascript
const openModal = () => setModalOpen(true);
```

With:
```javascript
const openModal = () => {
  // Check if user is authenticated before opening modal
  if (!session || !session.user?.user_metadata?.first_name) {
    // User not logged in or profile incomplete → redirect to profile/auth
    setActiveScreen('profile');
    return;
  }
  setModalOpen(true);
};
```

**C. Remove MyReportsScreen import** (line 5):
```javascript
import MyReportsScreen from "./screens/MyReportsScreen";  // ← REMOVE THIS LINE
```

**Verify:** 
1. Run `npm run dev`
2. While logged out, click "+ Submit Report" → should navigate to profile and show auth screen
3. While logged in, click "+ Submit Report" → should open the report modal
4. Navigating to a non-existent "reports" screen should do nothing

---

### 3. Update ProfileScreen.jsx - Ensure Auth Flow on Profile Navigation

**What:** The ProfileScreen already shows AuthScreen when not logged in, but we need to ensure it's shown immediately when the user navigates to the profile screen.

**Files:**
- `c:\Users\User\CLIMA/src/screens/ProfileScreen.jsx`

**Changes:**

**Current logic is already correct:**
- Line 37-41: `useEffect` sets `showAuth` to true when session is missing or incomplete
- Line 171: Returns `<AuthScreen onLoginSuccess={handleLoginSuccess} session={session} />` when `showAuth` is true
- `handleLoginSuccess` callback sets `showAuth` to false and navigates to home

**Enhancement needed:** Ensure the `handleLoginSuccess` function keeps the user on the profile screen if they were trying to access reports/profile features (not just redirect to home).

**Update `handleLoginSuccess`** (lines 167-172):
```javascript
const handleLoginSuccess = () => {
  setShowAuth(false);
  if (setActiveScreen) {
    setActiveScreen("home");  // ← CHANGE TO: stay on profile, don't auto-navigate
  }
};
```

**Change to:**
```javascript
const handleLoginSuccess = () => {
  setShowAuth(false);
  // Stay on profile screen to show the user their profile menu
  // Don't auto-navigate away after successful login
};
```

**Verify:** 
1. Run `npm run dev`
2. While logged out, click "Profile" nav item → should immediately show AuthScreen
3. Complete login/registration → should show ProfileScreen menu with "My Reports" as first option
4. Click "My Reports" → should show the user's reports

---

### 4. Update ReportModal.jsx - Add Auth Check on Mount

**What:** Add a secondary auth check inside ReportModal component that redirects to profile if the user somehow bypasses the App.jsx check.

**Files:**
- `c:\Users\User\CLIMA/src/components/ui/ReportModal.jsx`

**Changes:**

**Add useEffect hook** after the existing state declarations (around line 30):
```javascript
import { useRef, useState, useEffect } from "react";  // ← Add useEffect to imports (line 1)

// ... existing state declarations ...

// Add this useEffect after state declarations, before helper functions
useEffect(() => {
  // Secondary auth check: if modal is open but user is not authenticated,
  // close the modal (App.jsx should have redirected to profile already)
  if (isOpen && (!session || !session.user?.user_metadata?.first_name)) {
    console.warn('ReportModal opened without valid session - closing');
    handleClose();
  }
}, [isOpen, session]);
```

**Note:** This is a defensive check. The primary auth gate is in App.jsx's `openModal` function. This useEffect ensures that if the modal state somehow gets set to `true` without a valid session, it will immediately close.

**Verify:**
1. Run `npm run dev`
2. While logged out, manually try to trigger report submission → should redirect to profile
3. While logged in, report submission should work normally
4. Check browser console for any auth warnings

---

## Verification Procedure

After implementing all changes, run through this complete verification:

### Build & Start
```bash
npm run dev
```

### Test Cases

**1. Navigation Structure:**
- [ ] Mobile nav shows exactly 4 items: Home, Map, Alerts, Profile
- [ ] Desktop nav shows exactly 5 items: Home, Map, El Niño, Alerts, Profile
- [ ] No "Reports" or "Settings" items visible in navigation

**2. Unauthenticated User Flow:**
- [ ] Click "Profile" nav → immediately shows AuthScreen
- [ ] Click "+ Submit Report" button → navigates to Profile and shows AuthScreen
- [ ] Cannot access MyReportsScreen directly
- [ ] Cannot open ReportModal without authentication

**3. Authenticated User Flow:**
- [ ] Complete registration/login → stays on ProfileScreen showing menu
- [ ] ProfileScreen menu shows "My Reports" as first item
- [ ] Click "My Reports" → shows only the logged-in user's reports
- [ ] Click "+ Submit Report" → opens ReportModal normally
- [ ] Can submit reports successfully
- [ ] Can navigate back from reports view to profile menu

**4. ProfileScreen Views:**
- [ ] Profile menu displays: My Reports, Customize Profile, Help & Support, Theme Toggle, Logout
- [ ] Each menu item navigates to correct view
- [ ] "Go Back" button returns to profile menu from all sub-views
- [ ] User avatar and stats display correctly
- [ ] Logout button signs out and returns to home

**5. Edge Cases:**
- [ ] Incomplete profile (verified email but no first_name) → shows "Complete Profile" screen
- [ ] Session expires while on profile → shows AuthScreen
- [ ] Multiple rapid clicks on "+ Submit Report" while logged out → only one redirect
- [ ] Browser refresh while on profile → maintains correct auth state

### Commands to Run
```bash
# Start dev server
npm run dev

# In browser, open:
# http://localhost:5173

# Test on different screen sizes:
# - Mobile: < 1024px width
# - Desktop: >= 1024px width
```

### Success Criteria
- All navigation items are correct (4 mobile, 5 desktop)
- No "reports" or "settings" labels in nav
- Unauthenticated users are blocked from reports and modal
- Authenticated users can access all profile features
- My Reports is accessible only through ProfileScreen menu
- No console errors or warnings during normal operation
- All animations and transitions work smoothly

---

## Files Modified Summary

1. **c:\Users\User\CLIMA/src/components/layout/CitizenNav.jsx**
   - Remove "reports" from DESKTOP_NAV_ITEMS
   - Change profile label from "Settings" to "Profile"
   - Update icon imports

2. **c:\Users\User\CLIMA/src/App.jsx**
   - Remove reports screen routing block
   - Add auth check to `openModal` function
   - Remove MyReportsScreen import

3. **c:\Users\User\CLIMA/src/screens/ProfileScreen.jsx**
   - Simplify `handleLoginSuccess` to not auto-navigate

4. **c:\Users\User\CLIMA/src/components/ui/ReportModal.jsx**
   - Add useEffect for secondary auth check
   - Add useEffect to imports

---

## Rollback Plan

If issues arise, revert changes in reverse order:
1. Revert ReportModal.jsx (remove useEffect)
2. Revert ProfileScreen.jsx (restore auto-navigate in handleLoginSuccess)
3. Revert App.jsx (restore reports routing and openModal)
4. Revert CitizenNav.jsx (restore reports nav item)

Each file can be reverted independently using git:
```bash
git checkout HEAD -- src/components/layout/CitizenNav.jsx
git checkout HEAD -- src/App.jsx
git checkout HEAD -- src/screens/ProfileScreen.jsx
git checkout HEAD -- src/components/ui/ReportModal.jsx
```

---

## Notes

- **No database changes required** - all changes are frontend-only
- **No breaking changes to existing functionality** - ProfileScreen and MyReportsScreen components remain fully functional
- **Maintains existing auth flow** - uses existing Supabase session management
- **Mobile-first design preserved** - navigation changes maintain responsive behavior
- **Accessibility maintained** - all aria-labels and keyboard navigation remain intact
