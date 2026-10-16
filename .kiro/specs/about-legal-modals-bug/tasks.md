# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Legal Modal Links Do Not Open Modals
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases: clicking Privacy Policy link or Terms of Service link with any initial state
  - Test that clicking "Privacy Policy" link results in a modal appearing in the DOM (from Bug Condition in design)
  - Test that clicking "Terms of Service" link results in a modal appearing in the DOM (from Bug Condition in design)
  - The test assertions should match the Expected Behavior Properties from design: modal exists, is visible, has correct title and content URL
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: state changes but no modal DOM elements exist
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Legal-Link Interactions Remain Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for NPC Badge modal click (modal opens correctly)
  - Observe behavior on UNFIXED code for Share button (native share triggers)
  - Observe behavior on UNFIXED code for theme changes (styling applies correctly)
  - Observe behavior on UNFIXED code for content scrolling (scroll works correctly)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Fix for missing LegalModal components in AboutScreen.jsx

  - [ ] 3.1 Implement the fix
    - Add `<LegalModal>` JSX element for Privacy Policy at end of component return (before closing root div)
    - Configure props: `isOpen={showPrivacyPolicy}`, `onClose={() => setShowPrivacyPolicy(false)}`, `title="Privacy Policy"`, `contentUrl="/legal/privacy-policy.md"`
    - Add `<LegalModal>` JSX element for Terms of Service immediately after Privacy Policy modal
    - Configure props: `isOpen={showTermsOfService}`, `onClose={() => setShowTermsOfService(false)}`, `title="Terms of Service"`, `contentUrl="/legal/terms-of-service.md"`
    - Verify both modals render after the scrollable content div but inside the root wrapper
    - _Bug_Condition: isBugCondition(input) where input is clicking Privacy Policy or Terms of Service links_
    - _Expected_Behavior: Modal components render when state is true, display legal content from markdown files_
    - _Preservation: NPC Badge modal, Share button, theme changes, scroll behavior, all other About screen functionality_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Legal Modals Open and Display Content
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify clicking Privacy Policy link opens modal with correct content
    - Verify clicking Terms of Service link opens modal with correct content
    - Verify modals can be closed via X button or backdrop click
    - _Requirements: Expected Behavior Properties from design (2.1, 2.2, 2.3)_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Legal-Link Interactions Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm NPC Badge modal still works correctly
    - Confirm Share button still triggers native share
    - Confirm theme changes still apply correctly
    - Confirm scroll behavior unchanged
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
