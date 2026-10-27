# About Legal Modals Bugfix Design

## Overview

The Privacy Policy and Terms of Service modals fail to display because the `<LegalModal>` JSX elements are not rendered in `AboutScreen.jsx`, despite the component being imported and state management being properly configured. The fix requires adding two `<LegalModal>` component instances to the JSX return statement, properly configured with their respective props for state management and content loading.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user clicks the Privacy Policy or Terms of Service links
- **Property (P)**: The desired behavior when links are clicked - modals should open and display legal document content
- **Preservation**: All other About screen functionality (NPC badge modal, share button, navigation, theming) must remain unchanged
- **LegalModal**: The reusable modal component in `src/components/ui/LegalModal.jsx` that accepts `isOpen`, `onClose`, `title`, and `contentUrl` props
- **showPrivacyPolicy**: Boolean state variable that controls Privacy Policy modal visibility
- **showTermsOfService**: Boolean state variable that controls Terms of Service modal visibility

## Bug Details

### Bug Condition

The bug manifests when a user clicks either the "Privacy Policy" or "Terms of Service" links in the Legal & Privacy card section. The `onClick` handlers correctly update the state variables (`setShowPrivacyPolicy(true)` or `setShowTermsOfService(true)`), but no corresponding `<LegalModal>` components exist in the JSX to respond to these state changes, resulting in no visible modal.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserInteraction
  OUTPUT: boolean
  
  RETURN input.action = 'click'
         AND input.target IN ['Privacy Policy link', 'Terms of Service link']
         AND LegalModalComponentsNotRendered()
END FUNCTION
```

### Examples

- **Privacy Policy Click**: User clicks "Privacy Policy" link → state updates to `showPrivacyPolicy=true` → nothing happens because no `<LegalModal isOpen={showPrivacyPolicy} ... />` exists
- **Terms of Service Click**: User clicks "Terms of Service" link → state updates to `showTermsOfService=true` → nothing happens because no `<LegalModal isOpen={showTermsOfService} ... />` exists
- **State Without Effect**: State variables change correctly, but without corresponding JSX elements, the state changes have no visual effect
- **Edge Case**: Multiple rapid clicks on the links correctly toggle state but still produce no visible result

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- NPC Badge modal (showNPCBadge state and its modal) must continue to work exactly as before
- Share button functionality must remain unchanged
- All About screen content sections (features, tech stack, agencies, contact) must render identically
- Theme switching (dark/light mode) must apply correctly to all components
- Scroll behavior and layout must remain unchanged

**Scope:**
All inputs that do NOT involve clicking the Privacy Policy or Terms of Service links should be completely unaffected by this fix. This includes:
- Clicks on other links or buttons (NPC Badge, Share, external links)
- Scrolling the About screen content
- Theme changes
- Page navigation

## Hypothesized Root Cause

Based on the bug description and code inspection, the issue is:

1. **Missing JSX Elements**: The `<LegalModal>` components were never added to the JSX return statement in `AboutScreen.jsx`
   - The component is correctly imported at line 23: `import LegalModal from '../components/ui/LegalModal';`
   - State variables are correctly declared: `showPrivacyPolicy`, `showTermsOfService`
   - State setters are correctly called in onClick handlers
   - BUT: No `<LegalModal>` elements exist in the returned JSX

2. **Incomplete Implementation**: The implementation was partially completed (import, state, handlers) but the final rendering step was missed

3. **No Render Path**: Without the JSX elements, React has no instructions to render the modals when state changes, so the state updates have no effect on the DOM

## Correctness Properties

Property 1: Bug Condition - Legal Modals Display When Links Clicked

_For any_ user interaction where a Privacy Policy or Terms of Service link is clicked, the fixed AboutScreen component SHALL render the corresponding LegalModal component with the correct props (isOpen={true}, appropriate title, and contentUrl pointing to the markdown file), causing the modal to appear with the legal document content loaded and displayed.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Legal-Link Interactions Unchanged

_For any_ user interaction that is NOT clicking the Privacy Policy or Terms of Service links (such as clicking the NPC Badge, Share button, external links, or scrolling), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing About screen functionality including modal displays, navigation, theming, and content rendering.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/screens/AboutScreen.jsx`

**Function**: `AboutScreen` component return statement

**Specific Changes**:
1. **Add Privacy Policy LegalModal**: Insert `<LegalModal>` JSX element before the closing wrapper div
   - Props: `isOpen={showPrivacyPolicy}`, `onClose={() => setShowPrivacyPolicy(false)}`, `title="Privacy Policy"`, `contentUrl="/legal/privacy-policy.md"`
   - Position: After the main content wrapper, before the closing `</div>` of the root element

2. **Add Terms of Service LegalModal**: Insert second `<LegalModal>` JSX element adjacent to the first
   - Props: `isOpen={showTermsOfService}`, `onClose={() => setShowTermsOfService(false)}`, `title="Terms of Service"`, `contentUrl="/legal/terms-of-service.md"`
   - Position: Immediately after the Privacy Policy modal

3. **Placement Location**: Add both modals at the end of the component's JSX, after the scrollable content div but before the root wrapper closing tag
   - This ensures modals render at the correct z-index level
   - Maintains separation between content and overlay UI

4. **Verify Props Match Interface**: Ensure all props match the `LegalModal` component's expected interface
   - `isOpen` (boolean): Controls modal visibility
   - `onClose` (function): Callback to close the modal
   - `title` (string): Modal header text
   - `contentUrl` (string): Path to markdown file to load

5. **Content URLs**: Use correct public paths for legal documents
   - Privacy Policy: `/legal/privacy-policy.md` (exists in `public/legal/`)
   - Terms of Service: `/legal/terms-of-service.md` (exists in `public/legal/`)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate clicking the Privacy Policy and Terms of Service links, verify state changes, and assert that modal elements should exist in the DOM. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Privacy Policy Click Test**: Simulate clicking "Privacy Policy" link, verify `showPrivacyPolicy` becomes true, assert modal DOM element exists (will fail on unfixed code)
2. **Terms of Service Click Test**: Simulate clicking "Terms of Service" link, verify `showTermsOfService` becomes true, assert modal DOM element exists (will fail on unfixed code)
3. **Modal Close Test**: Assume modal is open, simulate close action, verify state becomes false (may work for state but no DOM effect on unfixed code)
4. **Content Loading Test**: Verify modal would load content from correct URL if it were rendered (will fail on unfixed code)

**Expected Counterexamples**:
- State updates correctly but no `<LegalModal>` elements exist in rendered DOM
- querySelector/getByRole for modal elements returns null even when state is true
- Possible root cause confirmed: Missing JSX elements in component return statement

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := AboutScreen_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Expected Behavior**: Modal elements exist in DOM, are visible, display correct content, and can be closed.

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT AboutScreen_original(input) = AboutScreen_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for NPC Badge modal, Share button, scrolling, and theme changes, then write property-based tests capturing that behavior.

**Test Cases**:
1. **NPC Badge Modal Preservation**: Observe that clicking NPC Badge opens its modal on unfixed code, then write test to verify this continues after fix
2. **Share Button Preservation**: Observe that Share button triggers native share on unfixed code, then write test to verify this continues after fix
3. **Theme Toggle Preservation**: Observe that theme changes apply correctly on unfixed code, then write test to verify styling remains correct after fix
4. **Scroll Behavior Preservation**: Observe that content scrolls correctly on unfixed code, then write test to verify scroll behavior unchanged after fix

### Unit Tests

- Test that clicking Privacy Policy link opens Privacy Policy modal with correct content URL
- Test that clicking Terms of Service link opens Terms of Service modal with correct content URL
- Test that clicking modal close button (X) closes the modal
- Test that clicking modal backdrop closes the modal
- Test that modal title displays correctly for each legal document type
- Test that state management (open/close) works correctly for each modal independently

### Property-Based Tests

- Generate random sequences of user interactions (clicks, scrolls, theme changes) and verify correct modal behavior
- Generate random combinations of modal states (both closed, one open, both open if possible) and verify rendering
- Test that all non-legal-link interactions preserve existing behavior across many scenarios
- Verify z-index and overlay behavior works correctly with multiple modals

### Integration Tests

- Test full user flow: navigate to About screen → click Privacy Policy → modal opens → content loads → close modal
- Test full user flow: navigate to About screen → click Terms of Service → modal opens → content loads → close modal
- Test that opening legal modal doesn't break NPC Badge modal functionality
- Test that theme changes apply correctly to legal modals when they're open
- Test accessibility: keyboard navigation, focus management, screen reader support
