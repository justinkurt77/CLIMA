# Bugfix Requirements Document

## Introduction

The About screen's Privacy Policy and Terms of Service links fail to display their respective modal dialogs when clicked. Despite having the `LegalModal` component imported and state management properly wired up, the modals never appear because the `<LegalModal>` JSX elements are missing from the component's render output. This prevents users from accessing important legal documentation required for compliance with RA 10173 (Data Privacy Act of 2012).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the "Privacy Policy" link in the Legal & Privacy section THEN the system does nothing (no modal appears, no visual feedback)

1.2 WHEN a user clicks the "Terms of Service" link in the Legal & Privacy section THEN the system does nothing (no modal appears, no visual feedback)

1.3 WHEN the state variables `showPrivacyPolicy` or `showTermsOfService` change to `true` THEN no corresponding JSX elements respond to these state changes because the `<LegalModal>` components are not rendered

### Expected Behavior (Correct)

2.1 WHEN a user clicks the "Privacy Policy" link in the Legal & Privacy section THEN the system SHALL display a modal overlay with the Privacy Policy content loaded from `/legal/privacy-policy.md`

2.2 WHEN a user clicks the "Terms of Service" link in the Legal & Privacy section THEN the system SHALL display a modal overlay with the Terms of Service content loaded from `/legal/terms-of-service.md`

2.3 WHEN a modal is open THEN the system SHALL allow the user to close it by clicking the X button, clicking the backdrop, or pressing Escape

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user interacts with any other part of the About screen (feature cards, tech stack, KloudTech acknowledgment, development team, contact info) THEN the system SHALL CONTINUE TO function exactly as before

3.2 WHEN the NPC Badge is clicked and displayed THEN the system SHALL CONTINUE TO show the badge modal without interference from the legal modals

3.3 WHEN the page is rendered in dark or light theme mode THEN the system SHALL CONTINUE TO apply correct theme styling to all existing components

3.4 WHEN the Share button is clicked (if available) THEN the system SHALL CONTINUE TO trigger the native share functionality
