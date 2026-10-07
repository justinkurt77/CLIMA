import { useState, useEffect } from "react";
import { ChevronLeft, Folder, Loader2, ShieldAlert, Wrench, Trash2, Dog, Construction, TreePine, CarFront, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { CATEGORY_GROUPS } from "./reportConstants";

const ICON_MAP = { ShieldAlert, Wrench, Trash2, Dog, Construction, TreePine, CarFront, ClipboardList, Folder };

export default function Step1CategoryPicker({ onNext, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState("ClipboardList");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (error) throw error;

        if (data && data.length > 0) {
          const groupsObj = {};
          data.forEach((cat) => {
            const gName = cat.group_name || "General";
            if (!groupsObj[gName]) {
              groupsObj[gName] = { name: gName, items: [], iconName: cat.icon_name || "Folder" };
            }
            groupsObj[gName].items.push(cat.name);
          });

          const groups = Object.values(groupsObj);
          setCategoryGroups(groups);
          if (groups.length > 0) setExpandedGroups({ 0: true });
        } else {
          setCategoryGroups(CATEGORY_GROUPS.map(g => ({ name: g.name, items: g.items, iconName: g.iconName })));
          setExpandedGroups({ 0: true });
        }
      } catch (err) {
        console.error("Error loading categories, using fallback", err);
        setCategoryGroups(CATEGORY_GROUPS.map(g => ({ name: g.name, items: g.items, iconName: g.iconName })));
        setExpandedGroups({ 0: true });
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const toggleGroup = (i) =>
    setExpandedGroups((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "absolute",
        inset: 0,
        background: "#000000",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px",
          paddingTop: "calc(20px + env(safe-area-inset-top, 0px))",
          display: "flex",
          alignItems: "center",
          background: "#000000",
          zIndex: 10,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "50%",
            width: 40,
            height: 40,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.2} color="#ffffff" />
        </button>
      </div>

      {/* Category List */}
      <div className="hide-scroll" style={{ padding: "0 22px", paddingBottom: 110, flex: 1, overflowY: "auto" }}>
        <h1
          style={{
            fontFamily: "Nunito, sans-serif",
            fontWeight: 900,
            fontSize: 24,
            letterSpacing: -0.5,
            color: "#ffffff",
            marginBottom: 28,
            lineHeight: 1.25,
          }}
        >
          Select incident category
        </h1>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 32,
                height: 32,
                border: "3px solid rgba(255,255,255,0.15)",
                borderTopColor: "#ffffff",
                borderRadius: "50%",
              }}
            />
          </div>
        ) : (
          categoryGroups.map((group, i) => {
            const isExpanded = !!expandedGroups[i];
            const GroupIcon = ICON_MAP[group.iconName] || Folder;
            return (
              <div key={i} style={{ marginBottom: 24 }}>
                <div
                  onClick={() => toggleGroup(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  <h2
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#ffffff",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <GroupIcon size={16} color="#ffffff" />
                    {group.name}
                  </h2>
                  <div
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      color: "#71717a",
                      fontSize: 12,
                    }}
                  >
                    ▼
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                    transition: "grid-template-rows 0.3s ease-out",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 14 }}>
                      {group.items.map((item) => {
                        const isSelected = selectedCategory === item;
                        return (
                          <button
                            key={item}
                            onClick={() => {
                              setSelectedCategory(item);
                              setSelectedIcon(group.iconName);
                            }}
                            style={{
                              padding: "9px 18px",
                              borderRadius: 30,
                              background: isSelected ? "#ffffff" : "#141416",
                              border: isSelected
                                ? "1px solid #ffffff"
                                : "1px solid rgba(255, 255, 255, 0.12)",
                              fontSize: 12,
                              fontWeight: 700,
                              color: isSelected ? "#000000" : "#a1a1aa",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              boxShadow: isSelected
                                ? "0 4px 14px rgba(255, 255, 255, 0.25)"
                                : "none",
                            }}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {i < categoryGroups.length - 1 && (
                  <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", marginTop: 24 }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Fixed Next Button */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 20px",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.95) 30%)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          disabled={!selectedCategory}
          onClick={() => onNext(selectedCategory, selectedIcon)}
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "15px 16px",
            borderRadius: 30,
            background: selectedCategory ? "#ffffff" : "#27272a",
            color: selectedCategory ? "#000000" : "#71717a",
            border: "none",
            fontSize: 15,
            fontWeight: 800,
            cursor: selectedCategory ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            boxShadow: selectedCategory
              ? "0 4px 20px rgba(255, 255, 255, 0.2)"
              : "none",
          }}
        >
          Next
        </button>
      </div>
    </motion.div>
  );
}
