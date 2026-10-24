import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/smart-rent/layout";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account | Smart Rent" },
      { name: "description", content: "See your Smart Rent account details or delete your account." },
      { property: "og:title", content: "My account | Smart Rent" },
      { property: "og:description", content: "Manage your Smart Rent account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const CONFIRM_WORD = "DELETE";

function AccountPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const remove = useServerFn(deleteMyAccount);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (confirm.trim().toUpperCase() !== CONFIRM_WORD) return;
    setBusy(true);
    try {
      await remove();
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut({ scope: "local" });
      toast.success("Your account has been deleted.");
      navigate({ to: "/", replace: true });
    } catch {
      toast.error("Couldn't delete your account. Please try again.");
      setBusy(false);
    }
  }

  const name = (user?.user_metadata?.["full_name"] as string | undefined) || "";
  return (
    <PageShell>
      <div className="form-shell">
        <p className="eyebrow">{role === "landlord" ? "Landlord" : "Tenant"} account</p>
        <h1>My account</h1>
        <div className="listing-form">
          <fieldset>
            <legend>Details</legend>
            <dl className="account-details">
              {name && <><dt>Name</dt><dd>{name}</dd></>}
              <dt>Email</dt><dd>{user?.email}</dd>
              <dt>Account type</dt><dd>{role === "landlord" ? "Landlord — lists homes" : "Tenant — messages landlords"}</dd>
            </dl>
          </fieldset>
          <form className="danger-zone" onSubmit={onDelete}>
            <h2>Delete account</h2>
            <p className="muted">
              This permanently deletes your account{role === "landlord" ? ", all your listings and their photos" : ""} and all your conversations. It can't be undone.
            </p>
            <label className="field">Type {CONFIRM_WORD} to confirm<input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></label>
            <button className="button button-danger" disabled={busy || confirm.trim().toUpperCase() !== CONFIRM_WORD}><Trash2 size={17} />{busy ? "Deleting…" : "Delete my account"}</button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
