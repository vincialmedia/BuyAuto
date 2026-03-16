"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

  const didInitRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const resetAuthedState = useCallback(() => {
    setProfile(null);
    setIsAdmin(false);
    setProfileLoading(false);
    setAdminLoading(false);
    setMessageCount(0);
    setMessageCountLoading(false);
  }, []);

  const refreshMessageCount = useCallback(async () => {
    try {
      setMessageCountLoading(true);
      const counts = await getMyMessageCounts({ force: true });
      setMessageCount(counts.total);
    } catch (e) {
      console.error("Error fetching message counts:", e);
      setMessageCount(0);
    } finally {
      setMessageCountLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setProfileLoading(true);
      setAdminLoading(true);

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

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
  }, []);

  const handleSessionChange = useCallback(
    (nextSession: Session | null, opts?: { force?: boolean }) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        const userId = nextSession.user.id;
        const shouldFetch = !!opts?.force || lastFetchedUserIdRef.current !== userId;

        lastFetchedUserIdRef.current = userId;

        if (shouldFetch) {
          void fetchProfile(userId);
          void refreshMessageCount();
        }
      } else {
        lastFetchedUserIdRef.current = null;
        resetAuthedState();
      }
    },
    [fetchProfile, refreshMessageCount, resetAuthedState]
  );

  const refreshProfile = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error refreshing session:", error);
      return;
    }

    handleSessionChange(data.session ?? null, { force: true });
  }, [handleSessionChange]);

  useEffect(() => {
    let mounted = true;

    const applyInitialSession = (nextSession: Session | null) => {
      if (!mounted) return;
      if (didInitRef.current) return;
      didInitRef.current = true;
      handleSessionChange(nextSession, { force: true });
    };

    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      if (didInitRef.current) return;

      console.warn("Auth init timed out; continuing without session.");
      didInitRef.current = true;
      handleSessionChange(null, { force: true });
    }, 6000);

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) console.error("Error getting session:", error);
        applyInitialSession(data.session ?? null);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      if (event === "INITIAL_SESSION") {
        applyInitialSession(nextSession);
        return;
      }

      if (event === "SIGNED_OUT") {
        didInitRef.current = true;
        handleSessionChange(null, { force: true });
        return;
      }

      if (!didInitRef.current) {
        applyInitialSession(nextSession);
        return;
      }

      handleSessionChange(nextSession);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [handleSessionChange]);

  const value = useMemo<AuthContextType>(
    () => ({
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
    }),
    [
      adminLoading,
      isAdmin,
      loading,
      messageCount,
      messageCountLoading,
      profile,
      profileLoading,
      refreshMessageCount,
      refreshProfile,
      session,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};