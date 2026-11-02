import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "tenant" | "landlord";

type AuthState = {
  session: Session | null;
  user: User | null;
  /** null = signed in but hasn't picked tenant or landlord yet */
  role: AccountType | null;
  /** Site admin (sees and manages everything). Cosmetic in the UI; the database enforces it. */
  isAdmin: boolean;
  loading: boolean;
  chooseRole: (role: AccountType) => Promise<void>;
};

const AuthContext = createContext<AuthState>({ session: null, user: null, role: null, isAdmin: false, loading: true, chooseRole: async () => {} });

async function loadRole(userId: string): Promise<AccountType | null> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role ?? null;
}

async function loadIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [roleState, setRoleState] = useState<{ uid: string; role: AccountType | null; isAdmin: boolean } | null>(null);
  const uid = session?.user.id ?? null;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); setReady(true); });
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    Promise.all([loadRole(uid), loadIsAdmin(uid)]).then(([role, isAdmin]) => { if (alive) setRoleState({ uid, role, isAdmin }); });
    return () => { alive = false; };
  }, [uid]);

  const chooseRole = useCallback(async (r: AccountType) => {
    if (!uid) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: r });
    if (error) {
      const existing = await loadRole(uid);
      if (!existing) throw error;
      setRoleState((prev) => ({ uid, role: existing, isAdmin: prev?.uid === uid ? prev.isAdmin : false }));
      return;
    }
    setRoleState((prev) => ({ uid, role: r, isAdmin: prev?.uid === uid ? prev.isAdmin : false }));
  }, [uid]);

  const roleKnown = !!uid && roleState?.uid === uid;
  const value: AuthState = {
    session,
    user: session?.user ?? null,
    role: roleKnown && roleState ? roleState.role : null,
    isAdmin: roleKnown && roleState ? roleState.isAdmin : false,
    loading: !ready || (!!uid && !roleKnown),
    chooseRole,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** Where to send someone after they sign in, when no specific page was requested. */
export const homeFor = (role: AccountType | null, isAdmin = false) => (isAdmin ? "/admin" : role === "landlord" ? "/dashboard" : "/explore");
