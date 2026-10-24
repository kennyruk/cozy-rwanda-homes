import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/smart-rent/layout";
import { AccountTypeTabs, PENDING_TYPE_KEY } from "../components/smart-rent/account";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { homeFor, safeRedirect, useAuth, type AccountType } from "../lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined; as?: AccountType | undefined } => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
    as: s["as"] === "landlord" || s["as"] === "tenant" ? s["as"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in | Smart Rent" },
      { name: "description", content: "Sign in or create a Smart Rent account as a tenant or a landlord." },
      { property: "og:title", content: "Sign in | Smart Rent" },
      { property: "og:description", content: "Create your Smart Rent tenant or landlord account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const STORE_KEY = "smart-rent-after-login";

const COPY = {
  tenant: {
    signin: ["Welcome back", "Sign in to message landlords about homes you like."],
    signup: ["Create a tenant account", "Free. Browse homes and message landlords directly."],
  },
  landlord: {
    signin: ["Landlord sign in", "Sign in to manage your listings and reply to tenants."],
    signup: ["Create a landlord account", "Free. List your homes and hear from tenants directly."],
  },
} as const;

function AuthPage() {
  const search = Route.useSearch();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<AccountType>(search.as ?? "tenant");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (loading || !user || !role) return;
    const stored = sessionStorage.getItem(STORE_KEY);
    sessionStorage.removeItem(STORE_KEY);
    navigate({ to: safeRedirect(search.redirect ?? stored ?? homeFor(role)), replace: true });
  }, [user, role, loading, search.redirect, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const back = new URL("/auth", window.location.origin);
      if (search.redirect) back.searchParams.set("redirect", safeRedirect(search.redirect));
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim(), account_type: type }, emailRedirectTo: back.toString() } });
      if (error) toast.error(error.message);
      else if (!data.session) setSent(true);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
        if (r && r.role !== type) toast(`This is a ${r.role} account, so we've opened the ${r.role} side.`);
      }
    }
    setBusy(false);
  }

  async function google() {
    if (search.redirect) sessionStorage.setItem(STORE_KEY, safeRedirect(search.redirect));
    // Only used if this Google account is new and has no account type yet.
    if (mode === "signup") sessionStorage.setItem(PENDING_TYPE_KEY, type);
    else sessionStorage.removeItem(PENDING_TYPE_KEY);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error("Google sign-in failed. Please try again.");
  }

  const [title, sub] = COPY[type][mode];
  return (
    <PageShell footer={false}>
      <div className="auth-shell">
        <div className="auth-card">
          {sent ? <>
            <h1>Check your email</h1>
            <p className="muted">We sent a confirmation link to <strong>{email}</strong>. Open it to finish creating your {type} account.</p>
          </> : <>
            <AccountTypeTabs value={type} onChange={setType} />
            <h1>{title}</h1>
            <p className="muted">{sub}</p>
            <button type="button" className="button button-ghost full" onClick={google}>Continue with Google</button>
            <div className="divider"><span>or</span></div>
            <form onSubmit={submit} className="stack">
              {mode === "signup" && <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
              <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
              <label>Password<input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
              <button className="button button-primary full" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : `Create ${type} account`}</button>
            </form>
            <p className="switch">{mode === "signin" ? "New to Smart Rent?" : "Already have an account?"} <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
          </>}
        </div>
      </div>
    </PageShell>
  );
}
