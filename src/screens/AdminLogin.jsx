import { useState, useEffect } from "react";
import { Shield, Lock, Mail, ArrowRight, BarChart3, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("login"); // login, forgot, reset, force_reset
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

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
    const isSuper = superadminsHashes.includes(userEmailHash);
    let isAdmin = user?.user_metadata?.role === 'admin';
    let assignedCategories = user?.user_metadata?.assigned_categories || ["All Categories"];

    if (!isSuper && !isAdmin) {
      const { data: authUsers } = await supabase.rpc('get_auth_users').eq('email', user?.email);
      if (authUsers && authUsers.length > 0 && authUsers[0].role === 'admin') {
        isAdmin = true;
        assignedCategories = authUsers[0].assigned_categories || ["All Categories"];
      }
    }

    if (isSuper || isAdmin) {
      // Resolve the admin's department from their assigned categories
      let adminDepartment = null;
      if (!isSuper && assignedCategories && !assignedCategories.includes("All Categories")) {
        try {
          const { data: cats } = await supabase
            .from("categories")
            .select("department_id, departments(id, name, accent_color)")
            .in("name", assignedCategories)
            .limit(1);
          if (cats && cats.length > 0 && cats[0].departments) {
            adminDepartment = cats[0].departments;
          }
        } catch (e) { console.error("Dept lookup failed", e); }
      }
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

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8faf7",
      fontFamily: "'Nunito', sans-serif",
      position: "fixed",
      inset: 0,
      zIndex: 9999
    }}>
      {/* Background patterns */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.5,
        pointerEvents: "none",
        backgroundImage: "radial-gradient(circle at 1px 1px, #373D20 1px, transparent 0)",
        backgroundSize: "40px 40px"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid rgba(55, 61, 32, 0.1)",
          borderRadius: 32,
          padding: "48px 40px",
          boxShadow: "0 25px 60px -12px rgba(55, 61, 32, 0.12)",
          position: "relative",
          zIndex: 1
        }}
      >
        {/* Logo and Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 64,
            height: 64,
            background: "#373D20",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 10px 25px rgba(55, 61, 32, 0.2)"
          }}>
            <BarChart3 size={32} color="white" />
          </div>
          <h1 style={{
            color: "#373D20",
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            fontFamily: "'Baloo 2', cursive"
          }}>
            {step === 'forgot' ? "Reset Password" : step === 'reset' || step === 'force_reset' ? "Set New Password" : "Admin Access"}
          </h1>
          <p style={{
            color: "rgba(55, 61, 32, 0.5)",
            margin: "8px 0 0",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase"
          }}>
            {step === 'force_reset' ? "Required for new accounts" : "PalaSumbong System"}
          </p>
        </div>

        <form onSubmit={step === 'login' ? handleLogin : step === 'forgot' ? handleForgotPassword : handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {(step === 'login' || step === 'forgot') && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", color: "rgba(55, 61, 32, 0.4)" }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Admin Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box", padding: "16px 16px 16px 48px",
                  background: "#f8faf7", border: "1px solid rgba(55, 61, 32, 0.12)", borderRadius: 16,
                  color: "#373D20", fontSize: 15, fontWeight: 600, outline: "none", transition: "all 0.2s"
                }}
                onFocus={(e) => { e.target.style.background = "white"; e.target.style.borderColor = "#373D20"; }}
                onBlur={(e) => { e.target.style.background = "#f8faf7"; e.target.style.borderColor = "rgba(55, 61, 32, 0.12)"; }}
              />
            </div>
          )}

          {step === 'login' && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", color: "rgba(55, 61, 32, 0.4)" }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box", padding: "16px 16px 16px 48px",
                  background: "#f8faf7", border: "1px solid rgba(55, 61, 32, 0.12)", borderRadius: 16,
                  color: "#373D20", fontSize: 15, fontWeight: 600, outline: "none", transition: "all 0.2s", letterSpacing: 2
                }}
                onFocus={(e) => { e.target.style.background = "white"; e.target.style.borderColor = "#373D20"; }}
                onBlur={(e) => { e.target.style.background = "#f8faf7"; e.target.style.borderColor = "rgba(55, 61, 32, 0.12)"; }}
              />
            </div>
          )}

          {(step === 'reset' || step === 'force_reset') && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", color: "rgba(55, 61, 32, 0.4)" }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: "100%", boxSizing: "border-box", padding: "16px 16px 16px 48px",
                  background: "#f8faf7", border: "1px solid rgba(55, 61, 32, 0.12)", borderRadius: 16,
                  color: "#373D20", fontSize: 15, fontWeight: 600, outline: "none", transition: "all 0.2s", letterSpacing: 2
                }}
                onFocus={(e) => { e.target.style.background = "white"; e.target.style.borderColor = "#373D20"; }}
                onBlur={(e) => { e.target.style.background = "#f8faf7"; e.target.style.borderColor = "rgba(55, 61, 32, 0.12)"; }}
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
                style={{ display: "flex", alignItems: "center", gap: 8, color: "#047857", background: "#D1FAE5", padding: 14, borderRadius: 16, fontSize: 13, fontWeight: 600, overflow: "hidden" }}
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
                style={{ display: "flex", alignItems: "center", gap: 8, color: "#E74C3C", fontSize: 13, fontWeight: 700, overflow: "hidden" }}
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
              padding: "16px", borderRadius: 16, border: "none", background: "#373D20", color: "white", fontSize: 16, fontWeight: 900,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10, transition: "all 0.2s", boxShadow: "0 10px 20px rgba(55, 61, 32, 0.15)"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "white", borderRadius: "50%" }} />
            ) : (
              <>
                {step === 'forgot' ? "Send Reset Email" : step === 'reset' || step === 'force_reset' ? "Save Password" : "Login"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
          
          {step === 'login' && (
            <button
              type="button"
              onClick={() => { setStep('forgot'); setError(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: "rgba(55, 61, 32, 0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: -10 }}
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
              style={{ background: "none", border: "none", color: "rgba(55, 61, 32, 0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: -10 }}
            >
              Back to Login
            </button>
          )}
        </form>

        <p style={{ textAlign: "center", color: "rgba(55, 61, 32, 0.3)", fontSize: 12, fontWeight: 600, marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Shield size={12} />
          Secure Admin Environment
        </p>
      </motion.div>
    </div>
  );
}

