import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/smart-rent/layout";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { safeRedirect, useAuth } from "../lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in | Smart Rent" },
      { name: "description", content: "Sign in or create a Smart Rent account to list homes and message landlords." },
      { property: "og:title", content: "Sign in | Smart Rent" },
      { property: "og:description", content: "Create your Smart Rent account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const STORE_KEY = "smart-rent-after-login";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const stored = sessionStorage.getItem(STORE_KEY);
    sessionStorage.removeItem(STORE_KEY);
    navigate({ to: safeRedirect(redirect ?? stored ?? "/"), replace: true });
  }, [user, loading, redirect, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin + "/auth" + (redirect ? `?redirect=${encodeURIComponent(safeRedirect(redirect))}` : "") } });
      if (error) toast.error(error.message);
      else if (!data.session) setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setBusy(false);
  }

  async function google() {
    if (redirect) sessionStorage.setItem(STORE_KEY, safeRedirect(redirect));
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) toast.error("Google sign-in failed. Please try again.");
  }

  return (
    <PageShell footer={false}>
      <div className="auth-shell">
        <div className="auth-card">
          {sent ? <>
            <h1>Check your email</h1>
            <p className="muted">We sent a confirmation link to <strong>{email}</strong>. Open it to finish creating your account.</p>
          </> : <>
            <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
            <p className="muted">{mode === "signin" ? "Sign in to message landlords and manage your listings." : "One account to rent or to list your property."}</p>
            <button type="button" className="button button-ghost full" onClick={google}>Continue with Google</button>
            <div className="divider"><span>or</span></div>
            <form onSubmit={submit} className="stack">
              {mode === "signup" && <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
              <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
              <label>Password<input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
              <button className="button button-primary full" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
            </form>
            <p className="switch">{mode === "signin" ? "New to Smart Rent?" : "Already have an account?"} <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
          </>}
        </div>
      </div>
    </PageShell>
  );
}
