import { Building2, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth, type AccountType } from "@/lib/auth";

export const PENDING_TYPE_KEY = "smart-rent-account-type";

export const ACCOUNT_TYPES: { value: AccountType; label: string; short: string; copy: string; Icon: typeof KeyRound }[] = [
  { value: "tenant", label: "I'm looking for a home", short: "Tenant", copy: "Browse homes and message landlords.", Icon: KeyRound },
  { value: "landlord", label: "I'm a landlord", short: "Landlord", copy: "List your homes for free and reply to tenants.", Icon: Building2 },
];

export function AccountTypeTabs({ value, onChange }: { value: AccountType; onChange: (v: AccountType) => void }) {
  return (
    <div className="account-tabs" role="tablist" aria-label="Account type">
      {ACCOUNT_TYPES.map(({ value: v, short, Icon }) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} className={value === v ? "active" : ""} onClick={() => onChange(v)}>
          <Icon size={17} />{short}
        </button>
      ))}
    </div>
  );
}

/** Shown to signed-in people who haven't said whether they rent or list (e.g. first Google sign-in). */
export function RoleChooser() {
  const { chooseRole } = useAuth();
  const [busy, setBusy] = useState(false);

  async function pick(r: AccountType) {
    setBusy(true);
    try { await chooseRole(r); sessionStorage.removeItem(PENDING_TYPE_KEY); }
    catch { toast.error("Couldn't save your choice. Please try again."); setBusy(false); }
  }

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_TYPE_KEY);
    if (pending === "tenant" || pending === "landlord") void pick(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>How will you use Smart Rent?</h1>
        <p className="muted">Pick one. Tenant accounts message landlords; landlord accounts list homes.</p>
        <div className="role-options">
          {ACCOUNT_TYPES.map(({ value, label, copy, Icon }) => (
            <button key={value} type="button" className="role-option" disabled={busy} onClick={() => pick(value)}>
              <Icon size={22} /><span><strong>{label}</strong><small>{copy}</small></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
