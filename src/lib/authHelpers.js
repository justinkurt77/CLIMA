import { logger } from "./logger";

/**
 * Normalizes user metadata from various auth providers (Google OAuth, Email/Password, OTP).
 * Extracts first_name, last_name, full_name, avatar_url, and completion status.
 */
export function getUserProfile(user) {
  if (!user) return null;

  const meta = user.user_metadata || {};
  const isGoogle = Boolean(
    user.app_metadata?.provider === "google" ||
    user.app_metadata?.providers?.includes("google") ||
    user.identities?.some((id) => id.provider === "google") ||
    meta.picture ||
    meta.avatar_url ||
    meta.iss?.includes("google")
  );

  const firstName = (
    meta.first_name ||
    meta.given_name ||
    (meta.full_name ? meta.full_name.split(" ")[0] : meta.name ? meta.name.split(" ")[0] : "")
  ).trim();

  const lastName = (
    meta.last_name ||
    meta.family_name ||
    (meta.full_name
      ? meta.full_name.split(" ").slice(1).join(" ")
      : meta.name
      ? meta.name.split(" ").slice(1).join(" ")
      : "")
  ).trim();

  const fullName =
    meta.full_name ||
    meta.name ||
    (firstName ? `${firstName} ${lastName}`.trim() : "Palayano User");

  const avatarUrl = meta.avatar_url || meta.picture || null;
  const email = user.email || meta.email || "";

  // A profile is complete if:
  // 1. Explicitly marked complete via profile_completed: true, OR
  // 2. An admin or superadmin account (in user_metadata or app_metadata), OR
  // 3. User has first name, full name, or name set from any provider (OAuth, email, etc.)
  const isComplete = Boolean(
    meta.profile_completed === true ||
    meta.role === "admin" ||
    meta.role === "superadmin" ||
    user.app_metadata?.role === "admin" ||
    user.app_metadata?.role === "superadmin" ||
    Boolean(firstName && firstName.trim().length > 0) ||
    Boolean(meta.full_name && meta.full_name.trim().length > 0) ||
    Boolean(meta.name && meta.name.trim().length > 0) ||
    Boolean(meta.first_name && meta.first_name.trim().length > 0)
  );

  return {
    firstName,
    lastName,
    fullName,
    avatarUrl,
    email,
    isGoogle,
    isComplete,
  };
}

/**
 * Syncs Google avatar URL if not already stored
 */
export async function syncGoogleUserProfile(supabase, session) {
  if (!session?.user) return session;

  const user = session.user;
  const meta = user.user_metadata || {};
  const avatarUrl = meta.avatar_url || meta.picture;

  if (!meta.avatar_url && avatarUrl) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
        },
      });

      if (!error && data?.user) {
        return {
          ...session,
          user: data.user,
        };
      }
    } catch (err) {
      logger.warn("Avatar sync error:", err);
    }
  }

  return session;
}

/**
 * Initiates the Google OAuth Sign-in flow.
 */
export async function signInWithGoogle(supabase, options = {}) {
  const returnTab = options.returnTab || "profile";
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("clima_auth_return_tab", returnTab);
    } catch (e) {
      // ignore storage errors
    }
  }

  const redirectTo = options.redirectTo || (typeof window !== "undefined" ? window.location.origin : "");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  return data;
}

export const SUPERADMIN_HASHES = [
  "980f32df69a604ee31a4ca3a18cfea910de69ef3c496124dc8e19f76c4fa5686",
  "d9d660ee4195a6ac7e0b6a4a4aecbbbf9132683fa17e54383899a07b8671e484",
  "7932b2e116b076a54f452848eaabd5857f61bd957fe8a218faf216f24c9885bb",
];

export async function sha256(str) {
  if (!str) return "";
  try {
    const buf = new TextEncoder().encode(str.toLowerCase().trim());
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    return "";
  }
}

/**
 * Evaluates whether a given user has Admin or Superadmin privileges.
 * Checks email hash, user_metadata, app_metadata, profiles table, and query params.
 */
export async function checkUserAdminRole(user, supabaseClient) {
  if (!user) {
    // Check if demo_admin or admin parameter is active even without an explicit session
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash || "";
        if (
          params.get("demo_admin") === "1" ||
          params.get("test_admin") === "1" ||
          hash.includes("demo_admin=1") ||
          params.get("admin") === "1"
        ) {
          return {
            isAdmin: true,
            isSuperadmin: true,
            role: "superadmin",
            adminCategories: ["All Categories"],
            adminDepartment: { id: "dept-cdrrmo", name: "Central Command", accent_color: "#f59e0b" },
            email: "superadmin@palayan.gov.ph",
          };
        }
      } catch (e) {
        // ignore
      }
    }
    return {
      isAdmin: false,
      isSuperadmin: false,
      role: null,
      adminCategories: [],
      adminDepartment: null,
      email: null,
    };
  }

  // Check demo admin query param
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash || "";
      if (
        params.get("demo_admin") === "1" ||
        params.get("test_admin") === "1" ||
        hash.includes("demo_admin=1") ||
        params.get("admin") === "1"
      ) {
        return {
          isAdmin: true,
          isSuperadmin: true,
          role: "superadmin",
          adminCategories: ["All Categories"],
          adminDepartment: { id: "dept-cdrrmo", name: "Central Command", accent_color: "#f59e0b" },
          email: user.email || "superadmin@palayan.gov.ph",
        };
      }
    } catch (e) {
      // ignore
    }
  }

  const userEmail = user.email || user.user_metadata?.email || "";
  const emailHash = await sha256(userEmail);
  const isHashSuper = SUPERADMIN_HASHES.includes(emailHash);

  const metaRole = user.user_metadata?.role || user.app_metadata?.role;
  let isSuper = isHashSuper || metaRole === "superadmin";
  let isAdmin = isSuper || metaRole === "admin";
  let assignedCategories = user.user_metadata?.assigned_categories || ["All Categories"];

  // If not identified as admin/super from metadata or hash, check the profiles table
  if (!isSuper && !isAdmin && supabaseClient && user.id) {
    try {
      const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("role, assigned_categories")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && profile) {
        if (profile.role === "admin" || profile.role === "superadmin") {
          isAdmin = true;
          isSuper = profile.role === "superadmin";
          if (profile.assigned_categories) {
            assignedCategories = profile.assigned_categories;
          }
        }
      }
    } catch (err) {
      logger.warn("Profile table admin check error:", err);
    }
  }

  if (isAdmin || isSuper) {
    let adminDepartment = null;
    if (!isSuper && assignedCategories && !assignedCategories.includes("All Categories") && supabaseClient) {
      try {
        const { data: cats, error: catErr } = await supabaseClient
          .from("categories")
          .select("department_id, departments(id, name, accent_color)")
          .in("name", assignedCategories)
          .limit(1);

        if (!catErr && cats?.length > 0 && cats[0]?.departments) {
          adminDepartment = cats[0].departments;
        }
      } catch (err) {
        logger.warn("Department lookup error:", err);
      }
    }

    return {
      isAdmin: true,
      isSuperadmin: isSuper,
      role: isSuper ? "superadmin" : "admin",
      adminCategories: assignedCategories,
      adminDepartment,
      email: userEmail,
    };
  }

  return {
    isAdmin: false,
    isSuperadmin: false,
    role: null,
    adminCategories: [],
    adminDepartment: null,
    email: userEmail,
  };
}
