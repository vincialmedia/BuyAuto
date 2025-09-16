
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
};

export default authService;