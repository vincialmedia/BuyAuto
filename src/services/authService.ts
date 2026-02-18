import { supabase } from "@/integrations/supabase/client";

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
    if (data.session?.access_token && data.session.refresh_token) {
      try {
        const resp = await fetch("/api/auth-set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });

        if (!resp.ok) {
          console.error("Failed to set session cookie:", await resp.text());
        }
      } catch (e) {
        console.error("Error setting session cookie:", e);
      }
    }

    // Wait a moment to ensure session is properly set on server
    if (data.session) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return data;
  },

  async signUp({ email, password, firstName, lastName, newsletterConsent, accountType }: SignUpData) {
    console.log("Starting sign up process");
    
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          role: accountType || "private",
        },
      },
    });

    if (error) {
      console.error("Auth service sign up error:", error);
      throw error;
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
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      console.error("Auth service reset password error:", error);
      throw error;
    }

    console.log("Password reset email sent");
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