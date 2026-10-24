import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "tenant" | "landlord";

type AuthState = {
  session: Session | null;
  user: User | null;
  /** null = signed in but hasn't picked tenant or landlord yet */
  role: AccountType | null;
  loading: boolean;
  chooseRole: (role: AccountType) => Promise<void>;
};

const AuthContext = createContext<AuthState>({ session: null, user: null, role: null, loading: true, chooseRole: async () => {} });

async function loadRole(userId: string): Promise<AccountType | null> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current: string | null = null;
    async function apply(s: Session | null) {
      setSession(s);
      const uid = s?.user.id ?? null;
      if (uid === current) { setLoading(false); return; }
      current = uid;
      if (!uid) { setRole(null); setLoading(false); return; }
      setLoading(true);
      const r = await loadRole(uid);
      if (current === uid) { setRole(r); setLoading(false); }
    }
    const { data } = supabase.auth.onAuthStateChange((_event, s) => { setTimeout(() => void apply(s), 0); });
    supabase.auth.getSession().then(({ data: { session: s } }) => apply(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const chooseRole = useCallback(async (r: AccountType) => {
    const uid = session?.user.id;
    if (!uid) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: r });
    if (error) {
      const existing = await loadRole(uid);
      if (!existing) throw error;
      setRole(existing);
      return;
    }
    setRole(r);
  }, [session]);

  return <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, chooseRole }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** Where to send someone after they sign in, when no specific page was requested. */
export const homeFor = (role: AccountType | null) => (role === "landlord" ? "/dashboard" : "/explore");
