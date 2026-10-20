import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { readGoogleNames } from "@/lib/buyauto/googleSignIn";

/**
 * Lets SSR and the middleware see a session the browser just received: sets
 * the auth cookies server-side, then gives them a moment to settle.
 */
async function syncServerSession(session: Session | null | undefined) {
  if (!session?.access_token || !session.refresh_token) return;

  try {
    const resp = await fetch("/api/auth-set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });

    if (!resp.ok) {
      console.error("Failed to set session cookie:", await resp.text());
    }
  } catch (e) {
    console.error("Error setting session cookie:", e);
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
}

interface SignInData {
  email: string;
  password: string;
}

interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  newsletterConsent?: boolean;
  accountType?: "private" | "garage";
  garageName?: string;
  city?: string;
  contactEmail?: string;
  /** Where the confirmation-email link should land (must be in the Supabase
   *  auth redirect allow-list; falls back to the Site URL otherwise). */
  emailRedirectTo?: string;
}

const authService = {
  async signIn({ email, password }: SignInData) {
    console.log("Starting sign in process");
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Auth service sign in error:", error);
      throw error;
    }

    console.log("Sign in successful, session:", data.session);

    // Ensure SSR/middleware can see the session: set auth cookies server-side
    await syncServerSession(data.session);

    return data;
  },

  /**
   * Signs in with the ID token from Google's button. Supabase creates the
   * account on first use (the profile trigger takes Google's full name) and
   * links Google to an existing account with the same verified e-mail.
   * Resolves as soon as the session exists; call finishGoogleSignIn next.
   */
  async signInWithGoogle({ token, nonce }: { token: string; nonce: string }) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
      nonce,
    });

    if (error) {
      console.error("Auth service Google sign in error:", error);
      throw error;
    }

    return data;
  },

  /**
   * After signInWithGoogle: sets the server-side session cookies and, when
   * the account has no first name yet (new Google account), stores Google's
   * first and last name the way an e-mail sign-up does. Never throws: the
   * person is signed in either way.
   */
  async finishGoogleSignIn({ session, user, idToken }: { session: Session | null; user: User; idToken: string }) {
    await syncServerSession(session);

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const hasFirstName = typeof meta.first_name === "string" && meta.first_name.trim() !== "";
    if (hasFirstName) return;

    const names = readGoogleNames(idToken);
    if (!names) return;

    const { error } = await supabase.auth.updateUser({
      data: { first_name: names.firstName, last_name: names.lastName },
    });
    if (error) console.error("Could not store the name from Google:", error);
  },

  async signUp({ email, password, firstName, lastName, newsletterConsent, accountType, garageName, city, contactEmail, emailRedirectTo }: SignUpData) {
    console.log("Starting sign up process");

    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          role: accountType || "private",
          garage_name: garageName,
          city: city,
          contact_email: contactEmail,
        },
      },
    });

    if (error) {
      console.error("Auth service sign up error:", error);
      throw error;
    }

    // When email confirmations are enabled, Supabase does not return an error
    // for an already-registered address (to avoid leaking which emails exist).
    // Instead it returns an obfuscated user with an empty `identities` array.
    // Detect that case and surface it as a proper "already exists" error.
    const identities = data?.user?.identities;
    if (data?.user && Array.isArray(identities) && identities.length === 0) {
      const duplicateError = new Error("User already registered") as Error & {
        code?: string;
      };
      duplicateError.code = "email_exists";
      throw duplicateError;
    }

    console.log("Sign up successful, user data:", data.user);

    // If user opted into newsletter, subscribe them
    if (newsletterConsent && data.user?.email) {
      try {
        await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            email: data.user.email, 
            consent: true 
          }),
        });
        console.log("Newsletter subscription added during registration");
      } catch (e) {
        console.error("Error subscribing to newsletter during registration:", e);
      }
    }

    return data;
  },

  async signOut() {
    console.log("Starting sign out process");

    // Clear server-side cookies (SSR/middleware visibility)
    try {
      await fetch("/api/auth-signout", { method: "POST" });
    } catch (e) {
      console.error("Error clearing server auth cookies:", e);
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Auth service sign out error:", error);
      throw error;
    }

    console.log("Sign out successful");
    
    // Force page reload to clear any cached auth state
    setTimeout(() => {
      window.location.href = "/auth";
    }, 100);
  },

  async resetPassword(email: string) {
    console.log("Starting password reset for:", email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });

    if (error) {
      console.error("Auth service reset password error:", error);
      throw error;
    }

    console.log("Password reset email sent");
  },

  async updatePassword(password: string) {
    console.log("Starting password update process");
    
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error("Auth service update password error:", error);
      throw error;
    }

    console.log("Password successfully updated");
    return data;
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting current session:", error);
      return null;
    }
    
    return session;
  },

  async getUserRole(userId: string): Promise<string> {
    try {
      // Use maybeSingle() to handle cases where profile doesn't exist yet
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle(); // This prevents 406 errors when no row exists

      if (error) {
        console.error("Error fetching user role:", error);
        // If it's a missing profile, the trigger should create it on next auth event
        return "user"; // Safe fallback
      }

      // If no profile exists yet (shouldn't happen with trigger, but just in case)
      if (!data) {
        console.warn(`⚠️ No profile found for user ${userId}, defaulting to 'user' role`);
        return "user";
      }

      const role = data.role || "user"; // Ensure we have a valid role
      console.log(`✅ User role for ${userId}: ${role}`);
      
      return role;
    } catch (error) {
      console.error("Unexpected error in getUserRole:", error);
      return "user"; // Ultimate fallback
    }
  },
};

export default authService;