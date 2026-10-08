import { useState, useEffect } from "react";
import { Facebook, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

export default function FacebookModerationScreen() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all

  useEffect(() => {
    fetchFacebookPosts();

    // Set up real-time subscription
    const subscription = supabase
      .channel("facebook_posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "facebook_posts",
        },
        () => {
          fetchFacebookPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const fetchFacebookPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("facebook_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Failed to fetch Facebook posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const moderatePost = async (postId, action, reason = "") => {
    try {
      const { error } = await supabase
        .from("facebook_posts")
        .update({
          status: action,
          moderation_reason: reason,
          moderated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;

      // If approved, convert to incident report
      if (action === "approved") {
        const post = posts.find((p) => p.id === postId);
        if (post) {
          await convertToIncident(post);
        }
      }

      fetchFacebookPosts();
    } catch (err) {
      console.error("Failed to moderate post:", err);
      alert("Failed to moderate post");
    }
  };

  const convertToIncident = async (post) => {
    try {
      const { error } = await supabase.from("reports").insert({
        title: `FB: ${post.message?.substring(0, 50) || "Untitled"}`,
        description: post.message || "",
        category: post.detected_category || "Other",
        status: "pending",
        lat: post.lat,
        lng: post.lng,
        source: "facebook",
        source_id: post.fb_post_id,
        images: post.images || [],
        created_at: post.created_at,
      });

      if (error) throw error;
    } catch (err) {
      console.error("Failed to convert to incident:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#10B981", text: "#ffffff" };
      case "rejected":
        return { bg: "#EF4444", text: "#ffffff" };
      case "pending":
        return { bg: "#F59E0B", text: "#ffffff" };
      default:
        return { bg: "#6B7280", text: "#ffffff" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} />;
      case "rejected":
        return <XCircle size={16} />;
      case "pending":
        return <Clock size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  return (
    <div
      style={{
        flex: 1,
        background: isDark ? "#09090b" : "#f9fafb",
        overflow: "auto",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isDark ? "#18181b" : "#ffffff",
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
          border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Facebook size={28} color="#1877F2" />
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: isDark ? "#ffffff" : "#09090b",
                margin: 0,
              }}
            >
              Facebook Moderation Queue
            </h1>
            <p
              style={{
                fontSize: 14,
                color: isDark ? "#a1a1aa" : "#71717a",
                margin: 0,
              }}
            >
              Review and approve citizen reports from Facebook
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: filter === f
                  ? isDark ? "#ffffff" : "#09090b"
                  : isDark ? "#27272a" : "#e5e7eb",
                color: filter === f
                  ? isDark ? "#09090b" : "#ffffff"
                  : isDark ? "#a1a1aa" : "#52525b",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: isDark ? "#71717a" : "#a1a1aa",
          }}
        >
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: isDark ? "#71717a" : "#a1a1aa",
          }}
        >
          No posts found for "{filter}" status
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {posts.map((post) => {
            const statusColor = getStatusColor(post.status);
            return (
              <div
                key={post.id}
                style={{
                  background: isDark ? "#18181b" : "#ffffff",
                  borderRadius: 12,
                  border: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                  overflow: "hidden",
                }}
              >
                {/* Post Header */}
                <div
                  style={{
                    padding: 16,
                    borderBottom: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Facebook size={20} color="#1877F2" />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isDark ? "#ffffff" : "#09090b",
                        }}
                      >
                        {post.author_name || "Unknown User"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: statusColor.bg,
                        color: statusColor.text,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {getStatusIcon(post.status)}
                      <span style={{ textTransform: "capitalize" }}>{post.status}</span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div style={{ padding: 16 }}>
                  <p
                    style={{
                      fontSize: 14,
                      color: isDark ? "#e4e4e7" : "#3f3f46",
                      lineHeight: 1.6,
                      margin: 0,
                      marginBottom: 12,
                    }}
                  >
                    {post.message || "No message"}
                  </p>

                  {post.detected_keywords && post.detected_keywords.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {post.detected_keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: isDark ? "#27272a" : "#f3f4f6",
                            color: isDark ? "#fbbf24" : "#d97706",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {post.detected_category && (
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: isDark ? "#422006" : "#fef3c7",
                        color: isDark ? "#fbbf24" : "#92400e",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "inline-block",
                        marginBottom: 12,
                      }}
                    >
                      Category: {post.detected_category}
                    </div>
                  )}

                  {post.images && post.images.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      {post.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 12,
                      color: isDark ? "#71717a" : "#a1a1aa",
                      marginTop: 8,
                    }}
                  >
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                {post.status === "pending" && (
                  <div
                    style={{
                      padding: 16,
                      borderTop: isDark ? "1px solid #27272a" : "1px solid #e5e7eb",
                      display: "flex",
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() => moderatePost(post.id, "approved")}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#10B981",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Reason for rejection (optional):");
                        moderatePost(post.id, "rejected", reason || "");
                      }}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#EF4444",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
