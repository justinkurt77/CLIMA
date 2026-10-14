import { useState, useEffect } from "react";
import { Shield, Lock, Mail, ArrowRight, BarChart3, AlertCircle, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { useTheme } from "../context/ThemeContext";
import ChangePasswordScreen from "./ChangePasswordScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";

export default function AdminLogin({ onLogin }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("login"); // login, forgot, reset, force_reset, change_password
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const superadminsHashes = [
    '980f32df69a604ee31a4ca3a18cfea910de69ef3c496124dc8e19f76c4fa5686',
    'd9d660ee4195a6ac7e0b6a4a4aecbbbf9132683fa17e54383899a07b8671e484'
  ];

  // Listen for password recovery links
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('reset');
        setSessionUser(session?.user);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAdminAuth = async (user) => {
    const sha256 = async (str) => {
      const buf = new TextEncoder().encode(str.toLowerCase().trim());
      const hash = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    };
    const userEmailHash = await sha256(user?.email || "");
    const isHashSuper = superadminsHashes.includes(userEmailHash);
    
    // Check for superadmin or admin role in user_metadata
    const userRole = user?.user_metadata?.role;
    let isSuper = isHashSuper || userRole === 'superadmin';
    let isAdmin = userRole === 'admin';
    let assignedCategories = user?.user_metadata?.assigned_categories || ["All Categories"];

    if (!isSuper && !isAdmin) {
      // Check profiles table for role
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, assigned_categories')
          .eq('id', user?.id)
          .single();
        
        if (profileError) {
          logger.error("Profile lookup error:", profileError);
          throw new Error("Database error: Unable to verify admin role");
        }
        
        if (profile) {
          const role = profile.role;
          if (role === 'admin' || role === 'superadmin') {
            isAdmin = role === 'admin';
            isSuper = role === 'superadmin';
            assignedCategories = profile.assigned_categories || ["All Categories"];
          }
        }
      } catch (e) {
        logger.error("Error checking admin auth:", e);
        throw e; // Re-throw to be caught by outer try-catch
      }
    }

    if (isSuper || isAdmin) {
      // Resolve the admin's department from their assigned categories (optional, non-blocking)
      let adminDepartment = null;
      if (!isSuper && assignedCategories && !assignedCategories.includes("All Categories")) {
        try {
          const { data: cats, error: catError } = await supabase
            .from("categories")
            .select("department_id, departments(id, name, accent_color)")
            .in("name", assignedCategories)
            .limit(1);
          
          if (!catError && cats && cats.length > 0 && cats[0].departments) {
            adminDepartment = cats[0].departments;
          }
        } catch (e) { 
          logger.warn("Department lookup failed (non-critical):", e); 
        }
      }
      // Login succeeds even if department lookup fails
      onLogin({ isSuperadmin: isSuper, adminCategories: assignedCategories, adminDepartment });
    } else {
      await supabase.auth.signOut();
      setError("Unauthorized admin account.");
      setStep("login");
    }
  };

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

      // Check if user must change password (first-time login)
      const { data: profile } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', data.user.id)
        .single();

      if (profile?.must_change_password) {
        setSessionUser(data.user);
        setStep("change_password");
        return;
      }

      // Check if they are forced to reset password (new registered admin)
      if (data.user?.user_metadata?.force_password_reset) {
        setSessionUser(data.user);
        setStep("force_reset");
      } else {
        await checkAdminAuth(data.user);
      }
    } catch (err) {
      setError(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/admin',
      });
      if (error) throw error;
      setMsg("Password reset email sent. Please check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { force_password_reset: false }
      });

      if (error) throw error;
      
      setMsg("Password updated successfully!");
      
      // Complete login
      await checkAdminAuth(data.user);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // Show ChangePasswordScreen if user must change password
  if (step === "change_password" && sessionUser) {
    return (
      <ChangePasswordScreen
        user={sessionUser}
        onPasswordChanged={async () => {
          // After password change, proceed with login
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await checkAdminAuth(user);
          }
        }}
      />
    );
  }

  // Show ForgotPasswordScreen if requested
  if (showForgotPassword) {
    return (
      <ForgotPasswordScreen
        onBack={() => {
          setShowForgotPassword(false);
          setError("");
          setMsg("");
        }}
      />
    );
  }

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: isDark ? "#090a0f" : "#f8f9fa",
      fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Inter', 'Outfit', sans-serif)",
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      transition: "background 0.25s ease",
    }}>
      {/* Background patterns */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: isDark ? 0.35 : 0.6,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"} 1px, transparent 0)`,
        backgroundSize: "32px 32px"
      }} />

      {/* Floating Theme Switcher */}
      <div style={{ position: "absolute", top: 24, right: 28, zIndex: 10 }}>
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
            background: isDark ? "rgba(18, 20, 26, 0.85)" : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            color: isDark ? "#ffffff" : "#09090b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 14px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",
          }}
        >
          {isDark ? <Sun size={19} color="#f59e0b" /> : <Moon size={19} color="#64748b" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%",
          maxWidth: 420,
          background: isDark ? "rgba(18, 20, 26, 0.96)" : "#ffffff",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: 28,
          padding: "44px 36px",
          boxShadow: isDark ? "0 25px 60px -12px rgba(0, 0, 0, 0.85)" : "0 25px 60px -12px rgba(0, 0, 0, 0.1)",
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Logo and Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60,
            height: 60,
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img
              src="/logo.png"
              alt="CLIMA Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: isDark
                  ? "drop-shadow(0 0 1px rgba(255, 255, 255, 0.85)) drop-shadow(0 2px 12px rgba(249, 115, 22, 0.45))"
                  : "drop-shadow(0 2px 10px rgba(249, 115, 22, 0.25))",
              }}
            />
          </div>
          <h1 style={{
            color: isDark ? "#ffffff" : "#09090b",
            margin: 0,
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}>
            {step === 'forgot' ? "Reset Password" : step === 'reset' || step === 'force_reset' ? "Set New Password" : "Admin Console"}
          </h1>
          <p style={{
            color: isDark ? "#a1a1aa" : "#71717a",
            margin: "6px 0 0",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase"
          }}>
            {step === 'force_reset' ? "Required for new accounts" : "CLIMA Central Management"}
          </p>
        </div>

        <form onSubmit={step === 'login' ? handleLogin : step === 'forgot' ? handleForgotPassword : handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {(step === 'login' || step === 'forgot') && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", color: isDark ? "#71717a" : "#a1a1aa" }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Admin Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box", padding: "14px 16px 14px 46px",
                  background: isDark ? "#161922" : "#f4f4f6",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: 14,
                  color: isDark ? "#ffffff" : "#09090b",
                  fontSize: 14, fontWeight: 600, outline: "none", transition: "all 0.2s"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#f97316"; }}
                onBlur={(e) => { e.target.style.borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"; }}
              />
            </div>
          )}

          {step === 'login' && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", color: isDark ? "#71717a" : "#a1a1aa" }}>
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box", padding: "14px 46px 14px 46px",
                  background: isDark ? "#161922" : "#f4f4f6",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: 14,
                  color: isDark ? "#ffffff" : "#09090b",
                  fontSize: 14, fontWeight: 600, outline: "none", transition: "all 0.2s"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#f97316"; }}
                onBlur={(e) => { e.target.style.borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: isDark ? "#71717a" : "#a1a1aa",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {(step === 'reset' || step === 'force_reset') && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", color: isDark ? "#71717a" : "#a1a1aa" }}>
                <Lock size={18} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box", padding: "14px 46px 14px 46px",
                  background: isDark ? "#161922" : "#f4f4f6",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: 14,
                  color: isDark ? "#ffffff" : "#09090b",
                  fontSize: 14, fontWeight: 600, outline: "none", transition: "all 0.2s"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#f97316"; }}
                onBlur={(e) => { e.target.style.borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"; }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: isDark ? "#71717a" : "#a1a1aa",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
                onBlur={(e) => { e.target.style.borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"; }}
              />
            </div>
          )}

          {/* Success Message */}
          <AnimatePresence>
            {msg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8, color: "#22c55e", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: 12, borderRadius: 14, fontSize: 13, fontWeight: 600, overflow: "hidden" }}
              >
                {msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: 12, borderRadius: 14, fontSize: 13, fontWeight: 700, overflow: "hidden" }}
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px",
              borderRadius: 14,
              border: "none",
              background: "#f97316",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 6,
              transition: "all 0.2s",
              boxShadow: "0 8px 24px rgba(249, 115, 22, 0.38)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 22, height: 22, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }} />
            ) : (
              <>
                {step === 'forgot' ? "Send Reset Email" : step === 'reset' || step === 'force_reset' ? "Save Password" : "Sign In to Console"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
          
          {step === 'login' && (
            <button
              type="button"
              onClick={() => { setShowForgotPassword(true); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: isDark ? "#a1a1aa" : "#71717a", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: -6 }}
            >
              Forgot Password?
            </button>
          )}

          {(step === 'forgot' || step === 'force_reset') && (
            <button
              type="button"
              onClick={async () => { 
                setStep('login'); 
                setError(""); 
                setMsg(""); 
                if (step === 'force_reset') await supabase.auth.signOut(); 
              }}
              style={{ background: "none", border: "none", color: isDark ? "#a1a1aa" : "#71717a", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: -6 }}
            >
              Back to Login
            </button>
          )}
        </form>

        <p style={{ textAlign: "center", color: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.35)", fontSize: 12, fontWeight: 600, marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Shield size={12} />
          Secure Admin Environment
        </p>
      </motion.div>
    </div>
  );
}


