import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronsUpDown, Check, X, User, Shield, ShieldCheck, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserCombobox({
  users = [],
  value = "",
  onChange,
  placeholder = "Search and select a registered user...",
  isDark = false,
  accent = "#f59e0b",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Find currently selected user
  const selectedUser = useMemo(() => {
    if (!value) return null;
    return users.find((u) => u.email?.toLowerCase() === value.toLowerCase() || u.id === value);
  }, [users, value]);

  // Filter users based on query and role
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      // Role filter
      if (roleFilter === "citizens" && (u.role === "admin" || u.role === "superadmin")) return false;
      if (roleFilter === "admins" && u.role !== "admin" && u.role !== "superadmin") return false;

      // Text search
      if (!q) return true;
      const nameMatch = (u.full_name || "").toLowerCase().includes(q);
      const emailMatch = (u.email || "").toLowerCase().includes(q);
      const agencyMatch = (u.assigned_department || "").toLowerCase().includes(q);
      return nameMatch || emailMatch || agencyMatch;
    });
  }, [users, searchQuery, roleFilter]);

  const handleSelect = (user) => {
    if (onChange) {
      onChange(user.email, user);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange("", null);
    }
    setSearchQuery("");
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  };

  const getRoleLabel = (role) => {
    if (role === "superadmin") return "Superadmin";
    if (role === "admin") return "Admin";
    return "Citizen";
  };

  const textColor = isDark ? "#ffffff" : "#09090b";
  const mutedColor = isDark ? "#a1a1aa" : "#71717a";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)";

  const hasAgency = (u) =>
    u.assigned_department && u.assigned_department !== "Not Assigned" && u.assigned_department !== "None";

  const renderAvatar = (u, size = 32) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size <= 28 ? 10 : 11,
        fontWeight: 700,
        color: mutedColor,
        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#f4f4f5",
        border: `1px solid ${borderColor}`,
      }}
    >
      {getInitials(u.full_name, u.email)}
    </div>
  );

  const renderMeta = (u) => (
    <span style={{ fontSize: 11, color: mutedColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {getRoleLabel(u.role)}
      {hasAgency(u) ? ` · ${u.assigned_department}` : ""}
    </span>
  );

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          minHeight: 44,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          background: isDark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
          border: `1.5px solid ${isOpen ? accent : isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"}`,
          borderRadius: 12,
          color: isDark ? "#ffffff" : "#09090b",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? `0 0 0 3px ${accent}25` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          {selectedUser ? (
            <>
              {renderAvatar(selectedUser, 28)}
              <div style={{ textAlign: "left", minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedUser.full_name || selectedUser.email}
                </span>
                <span style={{ fontSize: 11, color: mutedColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedUser.email} · {getRoleLabel(selectedUser.role)}
                  {hasAgency(selectedUser) ? ` · ${selectedUser.assigned_department}` : ""}
                </span>
              </div>
            </>
          ) : value ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
              <Mail size={15} color={accent} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: isDark ? "#71717a" : "#a1a1aa" }}>
              <Search size={15} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{placeholder}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {selectedUser || value ? (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                color: isDark ? "#a1a1aa" : "#71717a",
              }}
            >
              <X size={14} />
            </button>
          ) : null}
          <ChevronsUpDown size={15} style={{ opacity: 0.6 }} />
        </div>
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 100,
              background: isDark ? "#121214" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.14)"}`,
              borderRadius: 14,
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}`,
                background: isDark ? "rgba(255, 255, 255, 0.02)" : "#fafafa",
              }}
            >
              <Search size={15} style={{ color: accent, flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered users by name, email, or agency..."
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDark ? "#ffffff" : "#09090b",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", color: "#a1a1aa" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: "8px 12px",
                borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}`,
                background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.01)",
              }}
            >
              {[
                { id: "all", label: "All Users", count: users.length },
                { id: "citizens", label: "Citizens", count: users.filter((u) => u.role !== "admin" && u.role !== "superadmin").length },
                { id: "admins", label: "Admins", count: users.filter((u) => u.role === "admin" || u.role === "superadmin").length },
              ].map((tab) => {
                const isActive = roleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoleFilter(tab.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      background: isActive ? (isDark ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent",
                      color: isActive ? textColor : mutedColor,
                      boxShadow: isActive ? `0 0 0 1px ${borderColor}` : "none",
                      transition: "all 0.12s",
                    }}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>

            {/* Users Scrollable List */}
            <div
              style={{
                maxHeight: 260,
                overflowY: "auto",
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {filteredUsers.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <User size={28} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDark ? "#ffffff" : "#09090b" }}>
                    No users found
                  </p>
                  <p style={{ margin: "4px 0 12px", fontSize: 11, color: isDark ? "#71717a" : "#a1a1aa" }}>
                    No registered user matched &quot;{searchQuery}&quot;
                  </p>
                  {searchQuery.includes("@") && (
                    <button
                      type="button"
                      onClick={() => handleSelect({ email: searchQuery.trim(), full_name: searchQuery.trim(), role: "user" })}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        background: `${accent}20`,
                        color: accent,
                        border: `1px solid ${accent}40`,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Use custom email: {searchQuery.trim()}
                    </button>
                  )}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id || (selectedUser?.email && selectedUser.email === u.email);
                  return (
                    <button
                      key={u.id || u.email}
                      type="button"
                      onClick={() => handleSelect(u)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: isSelected
                          ? (isDark ? "rgba(255, 255, 255, 0.06)" : "#f4f4f5")
                          : "transparent",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.05)" : "#f4f4f6";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                        {renderAvatar(u, 32)}
                        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: textColor,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {u.full_name || u.email}
                            </span>
                            {renderMeta(u)}
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: mutedColor,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {u.email}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{ color: textColor, display: "flex", alignItems: "center", marginLeft: 8 }}>
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div
              style={{
                padding: "8px 12px",
                borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"}`,
                fontSize: 11,
                color: isDark ? "#71717a" : "#a1a1aa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: isDark ? "rgba(255, 255, 255, 0.02)" : "#fafafa",
              }}
            >
              <span>{users.length} total registered users</span>
              <span>Click any user to select</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
