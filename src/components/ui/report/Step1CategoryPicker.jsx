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
          // Group by group_name (NOT by department/office)
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
          // Fallback to hardcoded groups if no DB categories exist yet
          setCategoryGroups(CATEGORY_GROUPS.map(g => ({ name: g.name, items: g.items, iconName: g.iconName })));
          setExpandedGroups({ 0: true });
        }
      } catch (err) {
        console.error("Error loading categories, using fallback", err);
        // Fallback to hardcoded groups on error
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "absolute", inset: 0, background: "white", zIndex: 10000,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 16px", paddingTop: "calc(20px + env(safe-area-inset-top, 0px))", display: "flex", alignItems: "center", background: "white", zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronLeft size={24} strokeWidth={2} color="#000" />
        </button>
      </div>

      {/* Category List */}
      <div className="hide-scroll" style={{ padding: "0 24px", paddingBottom: 110, flex: 1, overflowY: "auto" }}>
        <h1 style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: -0.3, color: "#1a1108", marginBottom: 32, lineHeight: 1.25 }}>
          Select a category that best describes the issue
        </h1>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 32, height: 32, border: "3px solid #e8ebe4", borderTopColor: "#3F6F23", borderRadius: "50%" }} />
          </div>
        ) : (
          categoryGroups.map((group, i) => {
            const isExpanded = !!expandedGroups[i];
            const GroupIcon = ICON_MAP[group.iconName] || Folder;
            return (
              <div key={i} style={{ marginBottom: 28 }}>
                <div onClick={() => toggleGroup(i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "8px 0" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#2E2A27", margin: 0, display: "flex", alignItems: "center" }}>
                    <GroupIcon size={16} color={isExpanded ? "#3F6F23" : "#6b6560"} style={{ marginRight: 8, marginTop: -2 }} />
                    {group.name}
                  </h2>
                  <div style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "#6b6560", fontSize: 12 }}>▼</div>
                </div>

                <div style={{ display: "grid", gridTemplateRows: isExpanded ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease-out" }}>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 16 }}>
                      {group.items.map((item) => {
                        const isSelected = selectedCategory === item;
                        return (
                          <button key={item} onClick={() => { setSelectedCategory(item); setSelectedIcon(group.iconName); }}
                            style={{
                              padding: "8px 16px", borderRadius: 30,
                              background: isSelected ? "#3F6F23" : "white",
                              border: isSelected ? "1px solid transparent" : "1px solid #EAEAEA",
                              fontSize: 12, fontWeight: 700, color: isSelected ? "#ffffff" : "#2E2A27",
                              cursor: "pointer", transition: "all 0.2s",
                            }}>
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {i < categoryGroups.length - 1 && <div style={{ height: 1, background: "#f0f0f0", marginTop: 28 }} />}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Fixed Next Button */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 20%)", display: "flex", justifyContent: "center" }}>
        <button disabled={!selectedCategory} onClick={() => onNext(selectedCategory, selectedIcon)}
          style={{ width: "100%", maxWidth: 400, padding: "14px 16px", borderRadius: 30, background: selectedCategory ? "#3F6F23" : "#C7D6BE", color: "#ffffff", border: "none", fontSize: 16, fontWeight: 700, cursor: selectedCategory ? "pointer" : "not-allowed", transition: "background 0.3s" }}>
          Next
        </button>
      </div>
    </motion.div>
  );
}
