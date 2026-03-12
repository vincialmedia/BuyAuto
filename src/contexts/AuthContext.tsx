"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getMyMessageCounts } from "@/services/messagingService";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  profileLoading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  messageCount: number;
  messageCountLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshMessageCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  profileLoading: true,
  isAdmin: false,
  adminLoading: true,
  messageCount: 0,
  messageCountLoading: true,
  refreshProfile: async () => {},
  refreshMessageCount: async () => {},
});

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  const [messageCount, setMessageCount] = useState(0);
  const [messageCountLoading, setMessageCountLoading] = useState(true);

  const refreshMessageCount = async () => {
    try {
      setMessageCountLoading(true);
      const counts = await getMyMessageCounts();
      setMessageCount(counts.total);
    } catch (e) {
      console.error("Error fetching message counts:", e);
      setMessageCount(0);
    } finally {
      setMessageCountLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      setAdminLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setIsAdmin(false);
        return;
      }

      setProfile(data ?? null);

      const role = data?.role ?? "private";
      setIsAdmin(role === "admin");
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setProfileLoading(false);
      setAdminLoading(false);
    }
  };

  const refreshProfile = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error refreshing session:", error);
      return;
    }

    const nextSession = data.session ?? null;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      await fetchProfile(nextSession.user.id);
      await refreshMessageCount();
    } else {
      setProfile(null);
      setIsAdmin(false);
      setProfileLoading(false);
      setAdminLoading(false);
      setMessageCount(0);
      setMessageCountLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.error("Error getting session:", error);
      }

      if (!mounted) return;

      const nextSession = data.session ?? null;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        await fetchProfile(nextSession.user.id);
        await refreshMessageCount();
      } else {
        setProfile(null);
        setIsAdmin(false);
        setProfileLoading(false);
        setAdminLoading(false);
        setMessageCount(0);
        setMessageCountLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        await fetchProfile(nextSession.user.id);
        await refreshMessageCount();
      } else {
        setProfile(null);
        setIsAdmin(false);
        setProfileLoading(false);
        setAdminLoading(false);
        setMessageCount(0);
        setMessageCountLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        isAdmin,
        adminLoading,
        messageCount,
        messageCountLoading,
        refreshProfile,
        refreshMessageCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};