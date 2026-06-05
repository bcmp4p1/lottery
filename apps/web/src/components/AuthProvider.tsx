"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { UserRole } from "@lottery/shared";
import { getSupabase } from "@/lib/supabase/client";
import { api } from "@/lib/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  email: string | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Track the Supabase session. onAuthStateChange fires with the initial
  // session on subscribe, so we don't need a separate getSession() call.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthResolved(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Resolve the role from the API (DB is the source of truth). Runs in its own
  // effect — not inside the auth callback — to avoid Supabase deadlocks, and is
  // race-safe via the `active` flag.
  useEffect(() => {
    if (!authResolved) return;
    let active = true;

    const resolveRole = async () => {
      setLoading(true);
      if (!session) {
        if (active) {
          setRole(null);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await api.getMe();
        if (active) setRole(me.role);
      } catch {
        if (active) setRole(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void resolveRole();
    return () => {
      active = false;
    };
  }, [session, authResolved]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!session,
      email: session?.user.email ?? null,
      isAdmin: role === UserRole.Admin,
      loading,
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // When email confirmation is required, Supabase returns no session —
        // the user must click the link in their inbox before they can sign in.
        return { needsEmailConfirmation: !data.session };
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, role, loading, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
