import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  LogOut,
  ChevronRight,
  ClipboardList,
  ArrowLeft,
  User,
  Camera,
  Loader2,
  Check,
} from "lucide-react";
import MyReportsScreen from "./MyReportsScreen";
import AuthScreen from "./AuthScreen";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";

const menuItems = [
  { id: "reports", Icon: ClipboardList, label: "My Reports" },
  { id: "customize", Icon: User, label: "Customize Profile" },
  { id: "support", Icon: HelpCircle, label: "Help & Support" },
];

function ProfileScreen({ userReports: allReports, onOpenModal, session, setActiveScreen }) {
  // Filter for the user's personal reports to show in "My Reports" and stats
  const userReports = (allReports || []).filter((r) => {
    if (!session?.user) return false;
    const uid = session.user.id;
    const meta = session.user.user_metadata;
    const firstName = meta?.first_name || "";
    const lastName = meta?.last_name || "";
    const fullName = meta?.full_name || `${firstName} ${lastName}`.trim();
    
    return r.user_id === uid || (fullName && r.full_name === fullName);
  });
  const [view, setView] = useState("menu"); // "menu" | "reports" | "customize"
  const [showAuth, setShowAuth] = useState(
    !session || !session?.user?.user_metadata?.first_name,
  );

  // Form states for profile customization
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  // Sync session metadata
  useEffect(() => {
    if (session?.user?.user_metadata) {
      const meta = session.user.user_metadata;
      setFirstName(meta.first_name || "");
      setLastName(meta.last_name || "");
      setPhone(meta.phone || "");
      setAvatarPreview(meta.avatar_url || "");
      setAvatarFile(null);
    }
  }, [session, view]);

  // Require users to complete setup (set first name) before seeing their profile
  useEffect(() => {
    if (!session || !session.user?.user_metadata?.first_name) {
      setShowAuth(true);
    }
  }, [session]);

  const handleLoginSuccess = () => {
    setShowAuth(false);
    if (setActiveScreen) {
      setActiveScreen("home");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First Name and Last Name are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let finalAvatarUrl = session.user.user_metadata?.avatar_url || null;

      if (avatarFile) {
        // Compress avatar image
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 400,
          useWebWorker: true,
        };
        const compressed = await imageCompression(avatarFile, options);

        const generateRandomString = (length = 32) => {
          const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          const array = new Uint8Array(length);
          crypto.getRandomValues(array);
          return Array.from(array)
            .map((x) => chars[x % chars.length])
            .join("");
        };

        const randomFolder = generateRandomString(32);
        const randomFileName = generateRandomString(16);
        const fileExt = compressed.name.split(".").pop() || "jpg";
        const fileName = `${randomFileName}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${randomFolder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("reports")
          .upload(filePath, compressed, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("reports")
          .getPublicUrl(filePath);

        finalAvatarUrl = publicUrlData.publicUrl;
      }

      // Update auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim() || null,
          avatar_url: finalAvatarUrl,
        },
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        setView("menu");
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err.message || "An error occurred while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (showAuth) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} session={session} />;
  }

  return (
    <div className="profile-screen-wrap">
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {view === "reports" ? (
            <motion.div
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
              }}
            >
              {/* Back Button Area */}
              <div
                style={{
                  padding: "16px 20px 0 20px",
                  marginTop: "env(safe-area-inset-top)",
                  display: "flex",
                }}
              >
                <button
                  onClick={() => setView("menu")}
                  style={{
                    padding: "8px 16px 8px 12px",
                    background: "#18181b",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#ffffff",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                  Go Back
                </button>
              </div>

              {/* The actual My Reports content flows underneath */}
              <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
                <MyReportsScreen
                  userReports={userReports}
                  onOpenModal={onOpenModal}
                />
              </div>
            </motion.div>
          ) : view === "customize" ? (
            <motion.div
              key="customize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
              }}
            >
              {/* Back Button Area */}
              <div
                style={{
                  padding: "16px 20px 0 20px",
                  marginTop: "env(safe-area-inset-top)",
                  display: "flex",
                }}
              >
                <button
                  onClick={() => setView("menu")}
                  style={{
                    padding: "8px 16px 8px 12px",
                    background: "#18181b",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#ffffff",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                  Go Back
                </button>
              </div>

              {/* Form Content */}
              <div
                style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}
                className="hide-scroll"
              >
                <form
                  onSubmit={handleSaveProfile}
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  <h2
                    style={{
                      fontFamily: "Baloo 2, cursive",
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#ffffff",
                      margin: 0,
                    }}
                  >
                    Customize Profile
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#a1a1aa",
                      fontWeight: 600,
                      marginTop: -15,
                      marginBottom: 5,
                    }}
                  >
                    Update your display details and profile picture.
                  </p>

                  {error && (
                    <div
                      style={{
                        color: "#ffffff",
                        background: "#27272a",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        padding: "12px 16px",
                        borderRadius: 14,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {success && (
                    <div
                      style={{
                        color: "#000000",
                        background: "#ffffff",
                        padding: "12px 16px",
                        borderRadius: 14,
                        fontSize: 13,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Check size={16} strokeWidth={3} />
                      Profile updated successfully!
                    </div>
                  )}

                  {/* Avatar upload section */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      margin: "10px 0",
                    }}
                  >
                    <div
                      style={{ position: "relative", cursor: "pointer" }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background: "#18181b",
                            border: "2px solid rgba(255, 255, 255, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 36,
                            fontWeight: "bold",
                            color: "#ffffff",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                          }}
                        >
                          {firstName?.charAt(0).toUpperCase() || "P"}
                        </div>
                      )}
                      {/* Camera Overlay Icon */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          background: "#ffffff",
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#000000",
                          border: "2px solid #000000",
                          boxShadow: "0 2px 8px rgba(255,255,255,0.2)",
                        }}
                      >
                        <Camera size={16} />
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#a1a1aa",
                      }}
                    >
                      Tap circle to change photo
                    </span>
                  </div>

                  {/* Inputs */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#ffffff",
                        }}
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        required
                        disabled={saving}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          background: "#141416",
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 600,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#ffffff",
                        }}
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        required
                        disabled={saving}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          background: "#141416",
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 600,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#ffffff",
                        }}
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number (optional)"
                        disabled={saving}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          background: "#141416",
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 600,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={saving || !firstName.trim() || !lastName.trim()}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 16,
                      background: "#ffffff",
                      color: "#000000",
                      fontSize: 15,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginTop: 10,
                      boxShadow: "0 4px 18px rgba(255, 255, 255, 0.2)",
                      opacity:
                        saving || !firstName.trim() || !lastName.trim()
                          ? 0.6
                          : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {saving ? (
                      <Loader2 className="spin" size={20} />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : view === "support" ? (
            <motion.div
              key="support"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
              }}
            >
              {/* Back Button Area */}
              <div
                style={{
                  padding: "16px 20px 0 20px",
                  marginTop: "env(safe-area-inset-top)",
                  display: "flex",
                }}
              >
                <button
                  onClick={() => setView("menu")}
                  style={{
                    padding: "8px 16px 8px 12px",
                    background: "#18181b",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#ffffff",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                  Go Back
                </button>
              </div>

              {/* Support Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 20px 40px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 0,
                }}
                className="hide-scroll"
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <h2
                    style={{
                      fontFamily: "Baloo 2, cursive",
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#ffffff",
                      margin: 0,
                    }}
                  >
                    Help & Support
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#a1a1aa",
                      fontWeight: 600,
                      marginTop: -15,
                      marginBottom: 5,
                    }}
                  >
                    Need help? Get in touch with our technical team.
                  </p>

                  {/* Reach out to ICT Division card */}
                  <div
                    style={{
                      background: "#121214",
                      borderRadius: 22,
                      padding: 20,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <HelpCircle size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#ffffff" }}>
                          City ICT Division
                        </div>
                        <div style={{ fontSize: 12, color: "#71717a", fontWeight: 600 }}>
                          Official Support Channel
                        </div>
                      </div>
                    </div>

                    <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.08)" }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>📧</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#71717a", letterSpacing: 0.5 }}>EMAIL ADDRESS</span>
                          <a href="mailto:ict@palayancity.gov.ph" style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", textDecoration: "none" }}>
                            ict@palayancity.gov.ph
                          </a>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>📞</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#71717a", letterSpacing: 0.5 }}>CONTACT NUMBER</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                            (044) 940-1234
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>🏢</span>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#71717a", letterSpacing: 0.5 }}>OFFICE LOCATION</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", lineHeight: 1.4 }}>
                            2nd Floor, City Hall Building,<br />Brgy. Singalat, Palayan City
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Powered By Section at the Bottom */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 40,
                    textAlign: "center",
                  }}
                >
                  <img
                    src="/palayan_ict.png"
                    alt="Palayan City ICT Division Logo"
                    style={{
                      height: 52,
                      objectFit: "contain",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#71717a" }}>
                      Powered by
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
                      Palayan City ICT Division
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
              }}
            >
              {/* Outer header card */}
              <div className="profile-header-card">
                {/* Monochrome pill: avatar + name */}
                <div className="profile-pill">
                  {session?.user?.user_metadata?.avatar_url ? (
                    <img
                      src={session.user.user_metadata.avatar_url}
                      alt="Profile"
                      className="profile-avatar-green"
                      style={{
                        objectFit: "cover",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                      }}
                    />
                  ) : (
                    <div
                      className="profile-avatar-green"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "#ffffff",
                        background: "#27272a",
                      }}
                    >
                      {session?.user?.user_metadata?.first_name?.charAt(0).toUpperCase() || "P"}
                    </div>
                  )}
                  <span className="profile-name-green">
                    {session?.user?.user_metadata?.full_name || "Palayano User"}
                  </span>
                </div>

                {/* Stats bar */}
                <div className="profile-stats-bar">
                  <div
                    className="pstat-col"
                    onClick={() => setView("reports")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="pstat-num-green">
                      {userReports?.length || 0}
                    </div>
                    <div className="pstat-lbl-green">Reported</div>
                  </div>
                  <div className="pstat-sep" />
                  <div className="pstat-col">
                    <div className="pstat-num-green">
                      {userReports?.filter((r) => r.status === "resolved")
                        .length || 0}
                    </div>
                    <div className="pstat-lbl-green">Resolved</div>
                  </div>
                  <div className="pstat-sep" />
                  <div className="pstat-col">
                    <div className="pstat-num-green">
                      {userReports?.filter((r) => r.status === "pending")
                        .length || 0}
                    </div>
                    <div className="pstat-lbl-green">Pending</div>
                  </div>
                </div>
              </div>

              {/* Light green body with pill menu items */}
              <div className="profile-body-green">
                <div className="menu-list-green">
                  {menuItems.map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      className="menu-item-green"
                      onClick={() => {
                        if (id === "reports") setView("reports");
                        if (id === "customize") setView("customize");
                        if (id === "support") setView("support");
                      }}
                    >
                      <span className="menu-icon-green">
                        <Icon size={20} strokeWidth={2} />
                      </span>
                      <span className="menu-text-green">{label}</span>
                      <ChevronRight
                        size={18}
                        strokeWidth={2}
                        className="menu-arrow-green"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark green logout bar pinned at bottom */}
              <div className="profile-logout-bar">
                <button
                  className="profile-logout-btn"
                  aria-label="Logout"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    if (setActiveScreen) {
                      setActiveScreen("home");
                    }
                  }}
                >
                  <LogOut size={20} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProfileScreen;
