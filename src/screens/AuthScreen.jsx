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
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthScreen({ onLoginSuccess, session }) {
  const [mode, setMode] = useState(
    session && !session.user?.user_metadata?.first_name ? "complete" : "login",
  ); // login, register, verify, complete

  useEffect(() => {
    // If the global auth listener sends us a session that isn't fully set up,
    // lock the user into the complete profile screen.
    if (session && !session.user?.user_metadata?.first_name) {
      setMode("complete");
    }
  }, [session]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // Profile completion fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password fields
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

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

      if (!data.user.user_metadata?.first_name) {
        setMode("complete");
      } else {
        setMode("success_login");
        setTimeout(() => {
          onLoginSuccess(data.session);
        }, 2000);
      }
    } catch (err) {
      setError(
        err.message || "Failed to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const { error: checkError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (!checkError) {
        throw new Error(
          "This email is already registered! Please go back and Login.",
        );
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMode("verify");
      setMsg(
        "Please check your email inbox for the 8-digit verification code. (Check spam too!)",
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
      let sessionData = null;

      const { data: signupData, error: signupError } =
        await supabase.auth.verifyOtp({
          email: email,
          token: otp,
          type: "signup",
        });

      if (signupError) {
        const { data: magicData, error: magicError } =
          await supabase.auth.verifyOtp({
            email: email,
            token: otp,
            type: "magiclink",
          });

        if (magicError) throw magicError;
        sessionData = magicData;
      } else {
        sessionData = signupData;
      }

      const user = sessionData?.user || sessionData?.session?.user;

      if (user) {
        if (!user.user_metadata?.first_name) {
          setMode("complete");
        } else if (sessionData?.session) {
          onLoginSuccess(sessionData.session);
        } else {
          throw new Error("No active session created.");
        }
      } else {
        throw new Error("Missing user data from verification.");
      }
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          phone: phone || undefined,
        },
      });

      if (error) throw error;

      const sessionResponse = await supabase.auth.getSession();

      // Instead of calling immediately, show a smooth success modal
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
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes("signups not allowed") ||
          error.message?.toLowerCase().includes("user not found")
        ) {
          throw new Error("No account found with this email address.");
        }
        throw error;
      }

      setMode("forgot_verify");
      setMsg(
        "A 8-digit code has been sent to your email. Check your inbox (and spam folder).",
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
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: "magiclink",
      });

      if (error) throw error;

      // User is now signed in — move to reset password screen
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
  ) => (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <div
        style={{ position: "absolute", left: 14, top: 14, color: "#4B6043" }}
      >
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        style={{
          width: "100%",
          padding: "14px 16px 14px 44px",
          borderRadius: 14,
          border: "2px solid #E5E7EB",
          background: "#F9FAFB",
          fontSize: 15,
          outline: "none",
          transition: "all 0.3s ease",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#4aaa1f";
          e.target.style.background = "#fff";
          e.target.style.boxShadow = "0 0 0 4px rgba(74, 170, 31, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#E5E7EB";
          e.target.style.background = "#F9FAFB";
          e.target.style.boxShadow = "none";
        }}
      />
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
      {/* Floating Island Header (Similar to HomeScreen) */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(118, 144, 84, 0.95)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 32,
          margin: "8px",
          marginTop: "calc(8px + env(safe-area-inset-top, 0px))",
          padding: "20px 16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            fontFamily: "'Baloo 2', cursive",
            fontSize: 32,
            fontWeight: 900,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 4,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MapPin size={20} fill="#2e5716" color="white" />
          </div>
          <div>
            <span style={{ color: "#FFFFCC" }}>Pala</span>
            <span style={{ color: "white" }}>Sumbong</span>
          </div>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 13,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Palayan City Sumbong System
        </p>
      </motion.div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center", // Center content on screen
          padding: "0 16px",
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
            background: "white",
            width: "100%",
            maxWidth: 400,
            borderRadius: 24, // Round all borders since it is centered
            padding: "28px 20px 32px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)", // Standard shadow for floating
            display: "flex",
            flexDirection: "column",
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative",
          }}
          className="hide-scroll"
        >
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
                    color: "#1F2937",
                    marginBottom: 8,
                  }}
                >
                  Welcome back Palayano!
                </h2>
                <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>
                  Login to access your Palayan community.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#DC2626",
                      background: "#FEF2F2",
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
                  "password",
                  "Password",
                  password,
                  setPassword,
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !email || !password}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
                    opacity: loading || !email || !password ? 0.7 : 1,
                  }}
                >
                  {loading ? <Loader2 className="spin" size={20} /> : "Login"}
                </motion.button>

                {/* Forgot Password Link */}
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 16,
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
                      color: "#6B7280",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Forgot Password?
                  </span>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: 16,
                    fontSize: 15,
                    color: "#4B5563",
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
                      color: "#4aaa1f",
                      cursor: "pointer",
                      fontWeight: 800,
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
                    color: "#4B5563",
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
                    color: "#1F2937",
                    marginBottom: 8,
                  }}
                >
                  Create Account
                </h2>
                <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 28 }}>
                  Enter your email address to get a verification code.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#DC2626",
                      background: "#FEF2F2",
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
                    opacity: loading || !email ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} />
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
                  onClick={() => setMode("register")}
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#4B5563",
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
                    color: "#1F2937",
                    marginBottom: 8,
                  }}
                >
                  Verify Email
                </h2>
                <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 12 }}>
                  We sent a 8-digit code to {email}
                </p>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#047857",
                      background: "#D1FAE5",
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
                      color: "#DC2626",
                      background: "#FEF2F2",
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !otp || otp.length < 6}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
                    opacity: loading || !otp || otp.length < 6 ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} />
                  ) : (
                    "Verify Code"
                  )}
                </motion.button>
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
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#1F2937",
                    marginBottom: 8,
                  }}
                >
                  Complete Profile
                </h2>
                <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 28 }}>
                  Set up your profile details and password.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#DC2626",
                      background: "#FEF2F2",
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
                {renderInput(
                  <Lock size={20} />,
                  "password",
                  "New Password",
                  password,
                  setPassword,
                )}
                {renderInput(
                  <Lock size={20} />,
                  "password",
                  "Confirm Password",
                  confirmPassword,
                  setConfirmPassword,
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={
                    loading ||
                    !firstName ||
                    !lastName ||
                    !password ||
                    !confirmPassword
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
                    opacity:
                      loading ||
                      !firstName ||
                      !lastName ||
                      !password ||
                      !confirmPassword
                        ? 0.7
                        : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} />
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
                    color: "#4B5563",
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
                    background: "linear-gradient(135deg, #FFF3E0, #FFE0B2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    boxShadow: "0 4px 16px rgba(255, 152, 0, 0.15)",
                  }}
                >
                  <KeyRound size={30} color="#E65100" />
                </div>

                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#1F2937",
                    marginBottom: 8,
                  }}
                >
                  Forgot Password?
                </h2>
                <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 28 }}>
                  Enter your email and we'll send you a code to reset your
                  password.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#DC2626",
                      background: "#FEF2F2",
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
                    opacity: loading || !email ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} />
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
                    color: "#4B5563",
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
                    color: "#1F2937",
                    marginBottom: 8,
                  }}
                >
                  Verify Code
                </h2>
                <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 12 }}>
                  Enter the 8-digit code sent to {email}
                </p>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#047857",
                      background: "#D1FAE5",
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
                      color: "#DC2626",
                      background: "#FEF2F2",
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !otp || otp.length < 6}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
                    opacity: loading || !otp || otp.length < 6 ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} />
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
                    background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    boxShadow: "0 4px 16px rgba(76, 175, 80, 0.15)",
                  }}
                >
                  <Lock size={30} color="#2E7D32" />
                </div>

                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#1F2937",
                    marginBottom: 8,
                  }}
                >
                  Set New Password
                </h2>
                <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 28 }}>
                  Create a strong new password for your account.
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      color: "#DC2626",
                      background: "#FEF2F2",
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
                  "password",
                  "New Password",
                  resetPassword,
                  setResetPassword,
                )}
                {renderInput(
                  <Lock size={20} />,
                  "password",
                  "Confirm New Password",
                  resetConfirmPassword,
                  setResetConfirmPassword,
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !resetPassword || !resetConfirmPassword}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
                    opacity:
                      loading || !resetPassword || !resetConfirmPassword
                        ? 0.7
                        : 1,
                  }}
                >
                  {loading ? (
                    <Loader2 className="spin" size={20} />
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
                    width: 90,
                    height: 90,
                    background: "#E8F8F0",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    boxShadow: "0 8px 32px rgba(46, 172, 109, 0.25)",
                  }}
                >
                  <CheckCircle size={54} color="#2eac6d" strokeWidth={2.5} />
                </motion.div>

                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#1F2937",
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  Password Reset!
                </h2>
                <p
                  style={{
                    color: "#6B7280",
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 24,
                  }}
                >
                  Your password has been successfully updated.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
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
                    padding: "14px",
                    borderRadius: 14,
                    background: "#4B6043",
                    color: "white",
                    fontSize: 15,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(75, 96, 67, 0.3)",
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
                    width: 90,
                    height: 90,
                    background: "#E8F8F0",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    boxShadow: "0 8px 32px rgba(46, 172, 109, 0.25)",
                  }}
                >
                  <CheckCircle size={54} color="#2eac6d" strokeWidth={2.5} />
                </motion.div>

                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#1F2937",
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
                    color: "#6B7280",
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 24,
                  }}
                >
                  Your account is fully ready. Taking you to the home screen...
                </p>
                <Loader2 className="spin" size={28} color="#4B6043" />
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
      `}</style>
    </div>
  );
}
