
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

    // Wait a moment to ensure session is properly set on server
    if (data.session) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return data;
  },

  async signUp({ email, password, firstName, lastName }: SignUpData) {
    console.log("Starting sign up process");
    
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error("Auth service sign up error:", error);
      throw error;
    }

    console.log("Sign up successful");
    return data;
  },

  async signOut() {
    console.log("Starting sign out process");
    
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
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle(); // This prevents 406 errors when no row exists

      if (error) {
        console.error('Error fetching user role:', error);
        // If it's a missing profile, the trigger should create it on next auth event
        return 'user'; // Safe fallback
      }

      // If no profile exists yet (shouldn't happen with trigger, but just in case)
      if (!data) {
        console.warn(`⚠️ No profile found for user ${userId}, defaulting to 'user' role`);
        return 'user';
      }

      const role = data.role || 'user'; // Ensure we have a valid role
      console.log(`✅ User role for ${userId}: ${role}`);
      
      return role;
    } catch (error) {
      console.error('Unexpected error in getUserRole:', error);
      return 'user'; // Ultimate fallback
    }
  },
};

export default authService;
