import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/smart-rent/layout";
import { PasswordField } from "../components/smart-rent/ui";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | Smart Rent" },
      { name: "description", content: "Set a new password for your Smart Rent account." },
      { property: "og:title", content: "Choose a new password | Smart Rent" },
      { property: "og:description", content: "Reset your Smart Rent password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("The two passwords don't match. Please re-enter them."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message.includes("session") ? "This reset link has expired. Please request a new one." : error.message); return; }
    toast.success("Password updated. You're signed in.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <PageShell footer={false}>
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Choose a new password</h1>
          <p className="muted">Enter your new password twice.</p>
          <form onSubmit={submit} className="stack">
            <PasswordField label="New password" value={password} onChange={setPassword} />
            <PasswordField label="Re-enter new password" value={confirm} onChange={setConfirm} />
            <button className="button button-primary full" disabled={busy}>{busy ? "Please wait…" : "Save new password"}</button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
