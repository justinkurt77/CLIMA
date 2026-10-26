import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  Phone,
  Loader2,
  ArrowLeft,
  MapPin,
  CheckCircle,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import GoogleIcon from "../components/ui/GoogleIcon";
import { signInWithGoogle, getUserProfile } from "../lib/authHelpers";
import { logger } from "../lib/logger";
import { useTheme } from "../context/ThemeContext";

export default function AuthScreen({ onLoginSuccess, session }) {
  const { isDark } = useTheme();

  const T = {
    cardBg: isDark ? "#121214" : "#ffffff",
    cardBorder: isDark ? "1px solid rgba(249, 115, 22, 0.25)" : "1px solid rgba(0, 0, 0, 0.08)",
    cardShadow: isDark
      ? "0 16px 48px rgba(0, 0, 0, 0.75)"
      : "0 20px 48px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
    title: isDark ? "#ffffff" : "#09090b",
    subtitle: isDark ? "#a1a1aa" : "#71717a",
    inputBg: isDark ? "#18181b" : "#f4f4f5",
    inputBgFocus: isDark ? "#202024" : "#ffffff",
    inputBorder: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)",
    inputText: isDark ? "#ffffff" : "#09090b",
    iconColor: isDark ? "#71717a" : "#94a3b8",
    divider: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
    dividerText: isDark ? "#71717a" : "#94a3b8",
    errorBg: isDark ? "#27272a" : "#fef2f2",
    errorText: isDark ? "#ffffff" : "#dc2626",
    errorBorder: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(239, 68, 68, 0.25)",
    noteBg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
    noteBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
    googleBtnBg: "#ffffff",
    googleBtnText: "#18181b",
    googleBtnBorder: isDark ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(0, 0, 0, 0.12)",
    googleBtnShadow: isDark ? "0 4px 14px rgba(0, 0, 0, 0.35)" : "0 2px 8px rgba(0, 0, 0, 0.06)",
  };

  const initialProfile = getUserProfile(session?.user);
  const [mode, setMode] = useState(
    session && !initialProfile?.isComplete ? "complete" : "login",
  ); // login, register, verify, complete

  useEffect(() => {
    // If the global auth listener sends us a session, check if setup is complete
    if (session?.user) {
      const p = getUserProfile(session.user);
      if (p?.isComplete) {
        onLoginSuccess?.(session);
      } else {
        setMode("complete");
      }
    }
  }, [session, onLoginSuccess]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState(null);

  // Profile completion fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password fields
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Sync profile data if user came from OAuth with partial metadata
  useEffect(() => {
    if (session?.user) {
      const p = getUserProfile(session.user);
      if (p) {
        if (!firstName && p.firstName) setFirstName(p.firstName);
        if (!lastName && p.lastName) setLastName(p.lastName);
      }
    }
  }, [session]);

  const isOAuthUser = Boolean(
    session?.user?.app_metadata?.provider === "google" ||
    session?.user?.app_metadata?.providers?.includes("google") ||
    session?.user?.identities?.some((id) => id.provider === "google") ||
    session?.user?.user_metadata?.avatar_url ||
    session?.user?.user_metadata?.picture ||
    session?.user?.user_metadata?.iss?.includes("google")
  );

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle(supabase, { returnTab: "profile" });
    } catch (err) {
      logger.error("Google sign-in error:", err);
      let errMsg = err.message || "Failed to sign in with Google.";
      if (
        errMsg.toLowerCase().includes("provider is not enabled") ||
        errMsg.toLowerCase().includes("unsupported provider")
      ) {
        errMsg =
          "Google login is not enabled in the Supabase project. Please configure Google provider in Supabase Auth settings.";
      }
      setError(errMsg);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      const meta = data.user.user_metadata || {};
      const hasName = Boolean(meta.first_name || meta.given_name || meta.full_name || meta.name);
      const isAdmin = Boolean(
        meta.role === 'admin' ||
        meta.role === 'superadmin' ||
        data.user.app_metadata?.role === 'admin' ||
        data.user.app_metadata?.role === 'superadmin'
      );

      if (!hasName && !isAdmin && !meta.profile_completed) {
        setMode("complete");
      } else {
        setMode("success_login");
        setTimeout(() => {
          onLoginSuccess?.(data.session);
        }, 1500);
      }
    } catch (err) {
      setError(
        err.message || "Failed to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Send OTP using custom Nodemailer backend without touching Supabase auth.users prematurely
  const sendUserOtp = async (targetEmail, type = 'signup') => {
    const cleanEmail = targetEmail.trim().toLowerCase();

    const response = await fetch('/api/auth/send-user-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, type }),
    });

    const resData = await response.json();
    if (response.ok && resData.success) {
      return { success: true };
    }
    throw new Error(resData.error || 'Failed to send verification code. Please check your email.');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await sendUserOtp(email, 'signup');
      setMode("verify");
      setMsg(
        "A 6-digit verification code has been sent to your email. Check your inbox (and spam folder)!",
      );
    } catch (err) {
      setError(err.message || "Failed to send Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Invalid or expired verification code.');
      }

      // Store the secure verification token and proceed to profile setup
      setVerificationToken(resData.verificationToken);
      setMode("complete");
    } catch (err) {
      setError(err.message || "Invalid Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isOAuthUser && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!isOAuthUser && (!password || password.length < 6)) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      // CASE 1: Email-OTP Citizen Registration
      // This is the ONLY time the user record is created in Supabase auth.users!
      if (verificationToken) {
        const response = await fetch('/api/auth/complete-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            verificationToken,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || undefined,
            password,
          }),
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || 'Failed to complete registration.');
        }

        // Sign in immediately to establish active session
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

        if (signInError) throw signInError;

        setMode("success");
        setTimeout(() => {
          onLoginSuccess(signInData.session);
        }, 2000);
        return;
      }

      // CASE 2: OAuth or already authenticated user updating profile
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const updatePayload = {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          phone: phone.trim() || undefined,
          profile_completed: true,
        },
      };

      if (!isOAuthUser && password) {
        updatePayload.password = password;
      }

      const { data, error } = await supabase.auth.updateUser(updatePayload);

      if (error) throw error;

      // Upsert to profiles table in Supabase
      if (session?.user) {
        try {
          await supabase.from("profiles").upsert({
            id: session.user.id,
            email: session.user.email,
            full_name: fullName,
            phone: phone.trim() || null,
            role: session.user.user_metadata?.role || "citizen",
            updated_at: new Date().toISOString(),
          });
        } catch (profErr) {
          logger.warn("Profile table upsert error:", profErr);
        }
      }

      const sessionResponse = await supabase.auth.getSession();

      // Show smooth success modal
      setMode("success");
      const finalSession = data.session || sessionResponse.data.session;

      // Delay navigation 2 seconds to let the user see the success feedback
      setTimeout(() => {
        onLoginSuccess(finalSession);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD: Send OTP ──────────────────────────────
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await sendUserOtp(email, 'recovery');
      setMode("forgot_verify");
      setMsg(
        "A 6-digit password reset code has been sent to your email. Check your inbox (and spam folder)!",
      );
    } catch (err) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD: Verify OTP ──────────────────────────────
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: "recovery",
      });

      if (error) {
        const magicRes = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp.trim(),
          type: "magiclink",
        });
        if (!magicRes.error) {
          data = magicRes.data;
          error = null;
        } else {
          throw error;
        }
      }

      // User is now signed in - move to reset password screen
      setMode("reset_password");
      setMsg(null);
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD: Set New Password ──────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (resetPassword !== resetConfirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (resetPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: resetPassword,
      });

      if (error) throw error;

      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();

      setMode("reset_success");
      setResetPassword("");
      setResetConfirmPassword("");
      setOtp("");
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    icon,
    type,
    placeholder,
    value,
    onChange,
    disabled = false,
    isPassword = false,
    showPasswordState = false,
    togglePasswordVisibility = null,
  ) => (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <div
        style={{ position: "absolute", left: 14, top: 14, color: T.iconColor }}
      >
        {icon}
      </div>
      <input
        className="auth-input"
        type={isPassword && !showPasswordState ? "password" : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        style={{
          width: "100%",
          padding: "14px 16px 14px 44px",
          paddingRight: isPassword ? "44px" : "16px",
          borderRadius: 14,
          border: `1px solid ${T.inputBorder}`,
          background: T.inputBg,
          color: T.inputText,
          fontSize: 15,
          outline: "none",
          transition: "all 0.3s ease",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#f97316";
          e.target.style.background = T.inputBgFocus;
          e.target.style.boxShadow = "0 0 0 3px rgba(249, 115, 22, 0.25)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = T.inputBorder;
          e.target.style.background = T.inputBg;
          e.target.style.boxShadow = "none";
        }}
      />
      {isPassword && togglePasswordVisibility && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          style={{
            position: "absolute",
            right: 14,
            top: 14,
            background: "none",
            border: "none",
            color: T.subtitle,
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={showPasswordState ? "Hide password" : "Show password"}
        >
          {showPasswordState ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );

  // Animation variants
  const formVariants = {
    initial: { opacity: 0, x: 20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        {/* Animated Auth Card */}
        <motion.div
          initial={{ scale: 0.95, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            width: "100%",
            maxWidth: 400,
            borderRadius: 24,
            padding: "28px 22px 32px",
            boxShadow: T.cardShadow,
            display: "flex",
            flexDirection: "column",
            maxHeight: "88vh",
            overflowY: "auto",
            position: "relative",
            transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
          }}
          className="hide-scroll"
        >
          {/* Header inside Login Box */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'Nohemi', sans-serif",
                fontSize: 26,
                fontWeight: 900,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/logo.webp"
                  alt="CLIMA Logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))",
                  }}
                />
              </div>
              <div>
                <span style={{ color: T.title, letterSpacing: 1.5 }}>CLIMA</span>
              </div>
            </div>
            <p
              style={{
                color: T.subtitle,
                fontSize: 11,
                fontWeight: 600,
                margin: 0,
                textAlign: "center",
                letterSpacing: "0.2px",
              }}
            >
              Climate &amp; Local Incident Monitoring Application
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* LOGIN MODE */}
            {mode === "login" && (
              <motion.form
                key="login"
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleLogin}
              >
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                  }}
                >
                  Welcome back Palayano!
                </h2>
                <p style={{ color: T.subtitle, fontSize: 14, marginBottom: 20 }}>
                  Login to access your Palayan community.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: T.errorText,
                      background: T.errorBg,
                      border: `1px solid ${T.errorBorder}`,
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {renderInput(
                  <Mail size={20} />,
                  "email",
                  "Email Address",
                  email,
                  setEmail,
                )}
                {renderInput(
                  <Lock size={20} />,
                  "text",
                  "Password",
                  password,
                  setPassword,
                  false,
                  true,
                  showPassword,
                  () => setShowPassword(!showPassword),
                )}

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !email || !password}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                    opacity: loading || !email || !password ? 0.6 : 1,
                  }}
                >
                  {loading ? <Loader2 className="spin" size={20} color="#ffffff" /> : "Login"}
                </motion.button>

                {/* Forgot Password Link */}
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 14,
                  }}
                >
                  <span
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setMsg(null);
                      setOtp("");
                    }}
                    style={{
                      color: T.subtitle,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Forgot Password?
                  </span>
                </div>

                {/* Modern Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "20px 0 16px",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: T.divider }} />
                  <span
                    style={{
                      color: T.dividerText,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    or continue with
                  </span>
                  <div style={{ flex: 1, height: 1, background: T.divider }} />
                </div>

                {/* Google Sign In Button */}
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: isDark ? "#f4f4f5" : "#f8f9fa" }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: 14,
                    background: T.googleBtnBg,
                    color: T.googleBtnText,
                    fontSize: 15,
                    fontWeight: 700,
                    border: T.googleBtnBorder,
                    cursor: loading || googleLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    boxShadow: T.googleBtnShadow,
                    opacity: loading || googleLoading ? 0.7 : 1,
                  }}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="spin" size={19} color="#18181b" />
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon size={20} />
                      <span>Continue with Google</span>
                    </>
                  )}
                </motion.button>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: 16,
                    fontSize: 14,
                    color: T.subtitle,
                    fontWeight: 600,
                  }}
                >
                  Don't have an account?{" "}
                  <span
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    style={{
                      color: "#f97316",
                      cursor: "pointer",
                      fontWeight: 800,
                      textDecoration: "underline",
                    }}
                  >
                    Register
                  </span>
                </div>
              </motion.form>
            )}

            {/* REGISTER MODE */}
            {mode === "register" && (
              <motion.form
                key="register"
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleSendOtp}
              >
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: T.subtitle,
                    fontWeight: 700,
                    padding: 0,
                    marginBottom: 20,
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} /> Back to Login
                </button>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                  }}
                >
                  Create Account
                </h2>
                <p style={{ color: T.subtitle, fontSize: 15, marginBottom: 20 }}>
                  Enter your email address to get a verification code.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: T.errorText,
                      background: T.errorBg,
                      border: `1px solid ${T.errorBorder}`,
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Google Sign Up Button */}
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: isDark ? "#f4f4f5" : "#f8f9fa" }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    borderRadius: 14,
                    background: T.googleBtnBg,
                    color: T.googleBtnText,
                    fontSize: 15,
                    fontWeight: 700,
                    border: T.googleBtnBorder,
                    cursor: loading || googleLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    boxShadow: T.googleBtnShadow,
                    opacity: loading || googleLoading ? 0.7 : 1,
                    marginBottom: 16,
                  }}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="spin" size={19} color="#18181b" />
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon size={20} />
                      <span>Sign up with Google</span>
                    </>
                  )}
                </motion.button>

                {/* Modern Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "18px 0 20px",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: T.divider }} />
                  <span
                    style={{
                      color: T.dividerText,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    or register with email code
                  </span>
                  <div style={{ flex: 1, height: 1, background: T.divider }} />
                </div>

                {renderInput(
                  <Mail size={20} />,
                  "email",
                  "Email Address",
                  email,
                  setEmail,
                )}

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                    opacity: loading || !email ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} color="#ffffff" />
                  ) : (
                    "Send Code"
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* VERIFY MODE */}
            {mode === "verify" && (
              <motion.form
                key="verify"
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleVerifyOtp}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setOtp("");
                    setVerificationToken(null);
                    setError(null);
                    setMsg(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: T.subtitle,
                    fontWeight: 700,
                    padding: 0,
                    marginBottom: 20,
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} /> Change Email
                </button>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                  }}
                >
                  Verify Email
                </h2>
                <p style={{ color: T.subtitle, fontSize: 14, marginBottom: 16 }}>
                  We sent a verification code to <span style={{ color: T.title, fontWeight: 700 }}>{email}</span>
                </p>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: isDark ? "#ffffff" : "#047857",
                      background: isDark ? "#27272a" : "#ecfdf5",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(16, 185, 129, 0.25)",
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {msg}
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: T.errorText,
                      background: T.errorBg,
                      border: `1px solid ${T.errorBorder}`,
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {renderInput(
                  <ShieldCheck size={20} />,
                  "text",
                  "Enter 6-digit Code",
                  otp,
                  setOtp,
                )}

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !otp || otp.trim().length < 6}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                    opacity: loading || !otp || otp.trim().length < 6 ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} color="#ffffff" />
                  ) : (
                    "Verify Code"
                  )}
                </motion.button>

                {/* Helpful Note & Resend Code */}
                <div
                  style={{
                    marginTop: 18,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: T.noteBg,
                    border: `1px solid ${T.noteBorder}`,
                    fontSize: 12,
                    color: T.subtitle,
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  💡 Tip: Please check your inbox (and spam folder) for the 6-digit verification code.
                </div>

                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#f97316",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Didn't receive it? Resend Code
                  </button>
                </div>
              </motion.form>
            )}

            {/* COMPLETE MODE */}
            {mode === "complete" && (
              <motion.form
                key="complete"
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleCompleteProfile}
              >
                {(verificationToken || isOAuthUser) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isOAuthUser) {
                        try {
                          await supabase.auth.signOut();
                        } catch (e) {
                          logger.warn("Sign out on cancel:", e);
                        }
                      }
                      setMode("login");
                      setVerificationToken(null);
                      setOtp("");
                      setError(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: T.subtitle,
                      fontWeight: 700,
                      padding: 0,
                      marginBottom: 20,
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeft size={18} /> Cancel & Back
                  </button>
                )}
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                  }}
                >
                  Complete Profile
                </h2>
                <p style={{ color: T.subtitle, fontSize: 15, marginBottom: 28 }}>
                  {isOAuthUser
                    ? "Set up your profile details."
                    : "Set up your profile details and password."}
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: T.errorText,
                      background: T.errorBg,
                      border: `1px solid ${T.errorBorder}`,
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {renderInput(
                  <User size={20} />,
                  "text",
                  "First Name",
                  firstName,
                  setFirstName,
                )}
                {renderInput(
                  <User size={20} />,
                  "text",
                  "Last Name",
                  lastName,
                  setLastName,
                )}
                {renderInput(
                  <Phone size={20} />,
                  "tel",
                  "Mobile Number (Optional)",
                  phone,
                  setPhone,
                )}
                {!isOAuthUser && (
                  <>
                    {renderInput(
                      <Lock size={20} />,
                      "text",
                      "New Password",
                      password,
                      setPassword,
                      false,
                      true,
                      showPassword,
                      () => setShowPassword(!showPassword),
                    )}
                    {renderInput(
                      <Lock size={20} />,
                      "text",
                      "Confirm Password",
                      confirmPassword,
                      setConfirmPassword,
                      false,
                      true,
                      showConfirmPassword,
                      () => setShowConfirmPassword(!showConfirmPassword),
                    )}
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={
                    loading ||
                    !firstName.trim() ||
                    !lastName.trim() ||
                    (!isOAuthUser &&
                      (!password ||
                        !confirmPassword ||
                        password !== confirmPassword ||
                        password.length < 6))
                  }
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                    opacity:
                      loading ||
                      !firstName.trim() ||
                      !lastName.trim() ||
                      (!isOAuthUser &&
                        (!password ||
                          !confirmPassword ||
                          password !== confirmPassword ||
                          password.length < 6))
                        ? 0.6
                        : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} color="#ffffff" />
                  ) : (
                    "Finish Setup"
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* FORGOT PASSWORD: Enter Email */}
            {mode === "forgot" && (
              <motion.form
                key="forgot"
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleForgotSendOtp}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setMsg(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: T.subtitle,
                    fontWeight: 700,
                    padding: 0,
                    marginBottom: 20,
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} /> Back to Login
                </button>

                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(249, 115, 22, 0.1)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid rgba(249, 115, 22, 0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <KeyRound size={28} color="#f97316" />
                </div>

                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                  }}
                >
                  Forgot Password?
                </h2>
                <p style={{ color: T.subtitle, fontSize: 15, marginBottom: 28 }}>
                  Enter your email and we'll send you a code to reset your
                  password.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: T.errorText,
                      background: T.errorBg,
                      border: `1px solid ${T.errorBorder}`,
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {renderInput(
                  <Mail size={20} />,
                  "email",
                  "Email Address",
                  email,
                  setEmail,
                )}

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                    opacity: loading || !email ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} color="#ffffff" />
                  ) : (
                    "Send Reset Code"
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* FORGOT PASSWORD: Verify Code */}
            {mode === "forgot_verify" && (
              <motion.form
                key="forgot_verify"
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleForgotVerifyOtp}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setMsg(null);
                    setOtp("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: T.subtitle,
                    fontWeight: 700,
                    padding: 0,
                    marginBottom: 20,
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} /> Change Email
                </button>

                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                  }}
                >
                  Verify Code
                </h2>
                <p style={{ color: T.subtitle, fontSize: 15, marginBottom: 12 }}>
                  Enter the 8-digit code sent to <span style={{ color: T.title, fontWeight: 700 }}>{email}</span>
                </p>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: isDark ? "#ffffff" : "#047857",
                      background: isDark ? "#27272a" : "#ecfdf5",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(16, 185, 129, 0.25)",
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {msg}
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: T.errorText,
                      background: T.errorBg,
                      border: `1px solid ${T.errorBorder}`,
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {renderInput(
                  <ShieldCheck size={20} />,
                  "text",
                  "Enter 8-digit Code",
                  otp,
                  setOtp,
                )}

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !otp || otp.length < 6}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                    opacity: loading || !otp || otp.length < 6 ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} color="#ffffff" />
                  ) : (
                    "Verify Code"
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* FORGOT PASSWORD: Set New Password */}
            {mode === "reset_password" && (
              <motion.form
                key="reset_password"
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleResetPassword}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(249, 115, 22, 0.1)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid rgba(249, 115, 22, 0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Lock size={28} color="#f97316" />
                </div>

                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                  }}
                >
                  Set New Password
                </h2>
                <p style={{ color: T.subtitle, fontSize: 15, marginBottom: 28 }}>
                  Create a strong new password for your account.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: T.errorText,
                      background: T.errorBg,
                      border: `1px solid ${T.errorBorder}`,
                      padding: 14,
                      borderRadius: 16,
                      fontSize: 13,
                      marginBottom: 20,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {renderInput(
                  <Lock size={20} />,
                  "text",
                  "New Password",
                  resetPassword,
                  setResetPassword,
                  false,
                  true,
                  showResetPassword,
                  () => setShowResetPassword(!showResetPassword),
                )}
                {renderInput(
                  <Lock size={20} />,
                  "text",
                  "Confirm New Password",
                  resetConfirmPassword,
                  setResetConfirmPassword,
                  false,
                  true,
                  showResetConfirmPassword,
                  () => setShowResetConfirmPassword(!showResetConfirmPassword),
                )}

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !resetPassword || !resetConfirmPassword}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                    opacity:
                      loading || !resetPassword || !resetConfirmPassword
                        ? 0.6
                        : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} color="#ffffff" />
                  ) : (
                    "Reset Password"
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* RESET SUCCESS MODE */}
            {mode === "reset_success" && (
              <motion.div
                key="reset_success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.5, type: "spring" },
                }}
                exit={{ opacity: 0, scale: 1.1 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 10px",
                  textAlign: "center",
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 100,
                    delay: 0.2,
                  }}
                  style={{
                    width: 80,
                    height: 80,
                    background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    boxShadow: isDark ? "0 0 30px rgba(255, 255, 255, 0.15)" : "0 0 30px rgba(16, 185, 129, 0.15)",
                  }}
                >
                  <CheckCircle size={48} color={isDark ? "#ffffff" : "#10b981"} strokeWidth={2.2} />
                </motion.div>

                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  Password Reset!
                </h2>
                <p
                  style={{
                    color: T.subtitle,
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 24,
                  }}
                >
                  Your password has been successfully updated.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#ea580c" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setMsg(null);
                    setEmail("");
                    setPassword("");
                  }}
                  style={{
                    width: "100%",
                    maxWidth: 280,
                    padding: "15px",
                    borderRadius: 14,
                    background: "#f97316",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.35)",
                  }}
                >
                  Go to Login
                </motion.button>
              </motion.div>
            )}

            {/* SUCCESS MODE */}
            {(mode === "success" || mode === "success_login") && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.5, type: "spring" },
                }}
                exit={{ opacity: 0, scale: 1.1 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 10px",
                  textAlign: "center",
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 100,
                    delay: 0.2,
                  }}
                  style={{
                    width: 80,
                    height: 80,
                    background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    boxShadow: isDark ? "0 0 30px rgba(255, 255, 255, 0.15)" : "0 0 30px rgba(16, 185, 129, 0.15)",
                  }}
                >
                  <CheckCircle size={48} color={isDark ? "#ffffff" : "#10b981"} strokeWidth={2.2} />
                </motion.div>

                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: T.title,
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  {mode === "success_login"
                    ? "Welcome Back!"
                    : "Setup Complete!"}
                </h2>
                <p
                  style={{
                    color: T.subtitle,
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 24,
                  }}
                >
                  Your account is fully ready. Taking you to the home screen...
                </p>
                <Loader2 className="spin" size={28} color="#f97316" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        /* Hide scrollbars for the forms */
        .hide-scroll::-webkit-scrollbar {
          width: 0px;
          background: transparent; /* make scrollbar invisible */
        }
        .auth-input::placeholder {
          color: ${isDark ? "#71717a" : "#a1a1aa"};
        }
      `}</style>
    </div>
  );
}
