# Implementation Plan: OTP-Based Forgot Password & Force Password Change

## Context

After exploring the CLIMA codebase, I found:

- **Build system**: Vite + React (no build/test commands configured)
- **Backend**: Express.js server on port 3001 (server.js)
- **Existing API endpoints**: 
  - `POST /api/auth/forgot-password` (sends OTP) - ✅ already implemented
  - `POST /api/auth/reset-password` (verifies OTP + resets password) - ✅ already implemented
  - `POST /api/auth/change-password` (for forced password change) - ✅ already implemented
- **Database**: Supabase with `password_reset_otps` table and `verify_password_reset_otp` RPC function
- **Styling pattern**: Inline styles with lucide-react icons, purple gradient (#667eea → #764ba2) for auth screens
- **Auth flow**: AdminLogin.jsx uses step-based state machine ('login', 'forgot', 'reset', 'force_reset')
- **Email template**: Admin creation email already says "CLIMA System (Climate Information Monitoring and Awareness)"

## Design Decisions

1. **Separate ForgotPasswordScreen component**: Create a standalone component (following ChangePasswordScreen pattern) instead of inline form in AdminLogin. This provides:
   - Cleaner separation of concerns
   - Reusable component architecture
   - Better UX with full-screen view
   - Easier maintenance

2. **Two-step OTP flow in single component**: 
   - Step 1: Email input → API call → shows Step 2
   - Step 2: OTP + new password + confirm password → API call → success → redirect
   - This mirrors the pattern in AdminLogin.jsx's step-based state machine

3. **Countdown timer implementation**: Use React state + useEffect interval for 10-minute countdown, displaying MM:SS format

4. **Resend OTP logic**: Track last send time, enable "Resend OTP" button after 60 seconds cooldown

5. **Force password change flow**: Modify AdminLogin to check `must_change_password` or `force_password_reset` flags and show ChangePasswordScreen (already exists)

6. **Email template update**: The server.js already has the correct text "CLIMA System (Climate Information Monitoring and Awareness)" in the admin creation endpoint - no change needed

## Verification Strategy

- Manual testing by running `npm run dev:all` (starts both Vite dev server and Express server)
- Test full flow: AdminLogin → Forgot Password → OTP email → Reset → Login
- Test forced password change: New admin login → ChangePasswordScreen → Success
- Verify email template displays correct text

---

## Implementation Steps

### 1. Create ForgotPasswordScreen.jsx component

**What**: Build a standalone forgot password screen with two-step OTP flow matching ChangePasswordScreen's styling.

**Files**: 
- `c:\Users\User\CLIMA/src/screens/ForgotPasswordScreen.jsx` (create new file)

**Details**:

State variables:
```javascript
const [step, setStep] = useState(1); // 1 = email input, 2 = OTP verification
const [email, setEmail] = useState('');
const [otp, setOtp] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState(false);
const [expiresAt, setExpiresAt] = useState(null);
const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
const [canResend, setCanResend] = useState(false);
const [resendCooldown, setResendCooldown] = useState(60);
```

Component structure:
- Purple gradient background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- White card with rounded corners (borderRadius: 16), padding: 40, maxWidth: 400
- Icon badge at top (Mail for step 1, Lock for step 2) with purple background (#ede9fe)
- Step 1: Email input form → POST to `http://localhost:3001/api/auth/forgot-password`
- Step 2: OTP input (6-digit numeric), new password, confirm password → POST to `http://localhost:3001/api/auth/reset-password`
- Success state: CheckCircle2 icon with green background, "Password Reset!" message, auto-redirect after 2s using `setTimeout(() => onBack(), 2000)`
- Error alerts: Red background (#fef2f2), AlertCircle icon
- 10-minute countdown timer displayed as "Time remaining: MM:SS" in step 2
- "Resend OTP" button: disabled for first 60 seconds, shows cooldown countdown

Timer implementation:
```javascript
useEffect(() => {
  if (step === 2 && timeRemaining > 0) {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }
}, [step, timeRemaining]);

useEffect(() => {
  if (step === 2 && resendCooldown > 0) {
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }
}, [step, resendCooldown]);
```

Resend OTP handler:
```javascript
const handleResendOTP = async () => {
  setCanResend(false);
  setResendCooldown(60);
  // Call the same forgot-password endpoint
  await handleSendOTP();
};
```

Props:
- `onBack` (function): callback to return to login screen

**Verify**: Run `npm run dev:all`, navigate to admin login, click "Forgot Password?", verify:
- Step 1 email form submits successfully
- OTP email is received (check console logs for generated OTP)
- Step 2 shows countdown timer and OTP/password fields
- Resend button is disabled for 60 seconds, then becomes enabled
- Successful reset redirects back to login
- Error states display properly

---

### 2. Modify AdminLogin.jsx to integrate ForgotPasswordScreen

**What**: Replace the inline forgot password form with ForgotPasswordScreen component, and add force password change detection.

**Files**:
- `c:\Users\User\CLIMA/src/screens/AdminLogin.jsx`

**Changes**:

1. Add imports at top:
```javascript
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ChangePasswordScreen from './ChangePasswordScreen';
```

2. Add new state variable:
```javascript
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [mustChangePassword, setMustChangePassword] = useState(false);
```

3. Modify `handleLogin` function to check for forced password change (after successful login, before `checkAdminAuth`):
```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) throw loginError;

    // Check if they need to change password (temporary password or force reset)
    const needsPasswordChange = 
      data.user?.user_metadata?.must_change_password || 
      data.user?.user_metadata?.force_password_reset;

    if (needsPasswordChange) {
      setSessionUser(data.user);
      setMustChangePassword(true);
      setStep("login"); // Keep step as login, but show ChangePasswordScreen
    } else {
      await checkAdminAuth(data.user);
    }
  } catch (err) {
    setError(err.message || "Invalid login credentials.");
  } finally {
    setLoading(false);
  }
};
```

4. Remove the old `step === 'forgot'` and `step === 'reset'` and `step === 'force_reset'` branches from the form rendering (lines that check these steps)

5. Update the "Forgot Password?" button click handler (replace the old button that sets `step` to 'forgot'):
```javascript
onClick={() => { setShowForgotPassword(true); setError(""); setMsg(""); }}
```

6. Add conditional rendering at the component's top level (before the main return statement):
```javascript
// Show Forgot Password screen
if (showForgotPassword) {
  return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
}

// Show Change Password screen (for forced password change)
if (mustChangePassword && sessionUser) {
  return (
    <ChangePasswordScreen 
      user={sessionUser} 
      onPasswordChanged={async () => {
        // After password changed, verify admin status and proceed to dashboard
        await checkAdminAuth(sessionUser);
        setMustChangePassword(false);
      }} 
    />
  );
}
```

7. Clean up: Remove `step === 'forgot'`, `step === 'reset'`, and `step === 'force_reset'` branches from the form, keeping only the `step === 'login'` UI

8. Remove the "Back to Login" button that was shown on `step === 'forgot'` or `step === 'force_reset'` (no longer needed)

**Verify**: Run `npm run dev:all`, test:
- Click "Forgot Password?" → shows ForgotPasswordScreen
- Complete forgot password flow → returns to login
- Login with new admin account (with temporary password) → shows ChangePasswordScreen
- Complete password change → proceeds to dashboard
- Normal admin login (without forced change) → proceeds directly to dashboard

---

### 3. Verify App.jsx routing (no changes expected)

**What**: Confirm that ForgotPasswordScreen and ChangePasswordScreen are rendered as children of AdminLogin, not as separate routes in App.jsx.

**Files**:
- `c:\Users\User\CLIMA/src/App.jsx` (read only, no modifications)

**Findings from exploration**:
- App.jsx lazy-loads AdminLogin component
- AdminLogin is rendered when `activeScreen === 'admin'` and `!isAdminAuthenticated`
- ChangePasswordScreen and ForgotPasswordScreen are both rendered INSIDE AdminLogin.jsx based on state, not as separate routes
- No changes needed to App.jsx

**Verify**: Read through App.jsx lines 248-269 (the admin screen rendering section) and confirm:
- AdminLogin is conditionally rendered
- No separate routes for ChangePasswordScreen or ForgotPasswordScreen exist
- The existing pattern supports nested screen rendering within AdminLogin

---

### 4. Test complete authentication flows end-to-end

**What**: Manual testing of all authentication scenarios to ensure the complete user journey works.

**Test scenarios**:

1. **Forgot Password Flow (Existing Admin)**:
   - Navigate to `/admin`
   - Click "Forgot Password?"
   - Enter admin email → verify OTP email received
   - Enter OTP + new password → verify success message
   - Redirect to login → login with new password → verify dashboard access

2. **New Admin First Login (Force Password Change)**:
   - Create new admin via superadmin panel
   - Check email for temporary password
   - Login with email + temporary password
   - Verify ChangePasswordScreen is shown automatically
   - Set new password → verify redirect to dashboard

3. **Normal Admin Login**:
   - Login with existing admin (not requiring password change)
   - Verify direct access to dashboard

4. **OTP Expiration**:
   - Request OTP
   - Wait 10+ minutes (or manually test with expired timestamp)
   - Attempt to use expired OTP → verify error message

5. **OTP Resend**:
   - Request OTP
   - Wait 60 seconds on Step 2
   - Click "Resend OTP" → verify new OTP sent
   - Verify countdown timer resets

6. **Error Handling**:
   - Test with invalid email → verify error message
   - Test with wrong OTP → verify error message
   - Test with mismatched passwords → verify validation

**Verification commands**:
- Start dev environment: `npm run dev:all`
- Frontend: http://localhost:5173/admin
- Backend: http://localhost:3001/api/health

**Expected results**:
- All flows complete successfully without errors
- Email notifications are sent with correct branding
- Countdown timers display correctly
- State transitions are smooth
- No console errors
- Proper error messages for all failure cases

---

## Notes

- The backend API endpoints (`/api/auth/forgot-password` and `/api/auth/reset-password`) are already implemented in `server.js`
- The database table `password_reset_otps` and RPC function `verify_password_reset_otp` already exist (from `supabase_password_management.sql`)
- Email template for admin creation already includes the correct "CLIMA System (Climate Information Monitoring and Awareness)" text - no changes needed
- ChangePasswordScreen.jsx already exists and is fully functional
- The project uses inline styles (no CSS modules or Tailwind in component files)
- Icons are from `lucide-react` package
- The server logs temporary passwords to console for testing (line 52 in server.js)

## Risks & Mitigations

**Risk**: OTP emails may be delayed or not delivered
**Mitigation**: Server logs OTP to console for testing; production should use reliable SMTP service

**Risk**: User closes browser during Step 2 of forgot password
**Mitigation**: OTP is valid for 10 minutes; user can restart flow and request new OTP

**Risk**: Countdown timer continues after component unmount
**Mitigation**: useEffect cleanup functions clear intervals

**Risk**: User attempts to use the same OTP twice
**Mitigation**: Backend marks OTP as used after first successful verification (column `used` in `password_reset_otps` table)
