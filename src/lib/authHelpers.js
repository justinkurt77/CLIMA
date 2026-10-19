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

  // A profile is complete only if:
  // 1. Explicitly marked complete via profile_completed: true, OR
  // 2. An admin or superadmin account, OR
  // 3. (Legacy non-Google accounts) already has explicit first_name
  const isComplete = Boolean(
    meta.profile_completed === true ||
    meta.role === "admin" ||
    meta.role === "superadmin" ||
    (!isGoogle && meta.first_name)
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
