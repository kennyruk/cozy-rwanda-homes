import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Ban, Home, MessagesSquare, RotateCcw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { adminDeleteUser, adminListUsers, adminSetRole, adminSetSuspended, type AdminUser } from "@/lib/admin.functions";
import { ago, fmtDate } from "@/lib/admin";

type UserSearch = { type?: "landlord" | "tenant" | undefined; status?: "suspended" | "untyped" | undefined };

export const Route = createFileRoute("/_authenticated/admin/users")({
  validateSearch: (s: Record<string, unknown>): UserSearch => ({
    type: s["type"] === "landlord" || s["type"] === "tenant" ? s["type"] : undefined,
    status: s["status"] === "suspended" || s["status"] === "untyped" ? s["status"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "People | Smart Rent admin" },
      { name: "description", content: "Manage every landlord and tenant account on Smart Rent." },
      { property: "og:title", content: "People | Smart Rent admin" },
      { property: "og:description", content: "Manage Smart Rent accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

const TITLES = { landlord: "Landlords", tenant: "Tenants", all: "All people" } as const;

function UsersPage() {
  const { type, status } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/users" });
  const qc = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const setSuspended = useServerFn(adminSetSuspended);
  const deleteUser = useServerFn(adminDeleteUser);
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => listUsers() });
  const [q, setQ] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const fail = (e: unknown) => toast.error(e instanceof Error && e.message !== "Forbidden" ? e.message : "That didn't work. Please try again.");

  const roleM = useMutation({ mutationFn: (v: { userId: string; role: "tenant" | "landlord" }) => setRole({ data: v }), onSuccess: () => { toast.success("Account type changed"); refresh(); }, onError: fail });
  const suspendM = useMutation({ mutationFn: (v: { userId: string; suspended: boolean }) => setSuspended({ data: v }), onSuccess: (_d, v) => { toast.success(v.suspended ? "Account suspended — they can't sign in and their homes are hidden" : "Account restored"); refresh(); }, onError: fail });
  const deleteM = useMutation({ mutationFn: (userId: string) => deleteUser({ data: { userId } }), onSuccess: () => { toast.success("Account deleted"); refresh(); }, onError: fail });

  const all = users.data ?? [];
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((u) =>
      (!type || u.role === type) &&
      (status !== "suspended" || u.suspended) &&
      (status !== "untyped" || (!u.role && !u.isAdmin)) &&
      (!term || u.email.toLowerCase().includes(term) || u.name.toLowerCase().includes(term)));
  }, [all, q, type, status]);

  const busy = roleM.isPending || suspendM.isPending || deleteM.isPending;

  function confirmDelete(u: AdminUser) {
    const what = u.role === "landlord" ? `their ${u.listings} listing${u.listings === 1 ? "" : "s"}, photos and all conversations` : "all their conversations";
    if (window.prompt(`Delete ${u.email}? This also removes ${what}. It can't be undone.\n\nType DELETE to confirm.`)?.trim().toUpperCase() === "DELETE") deleteM.mutate(u.id);
  }

  return (
    <>
      <header className="adm-head">
        <div><p className="adm-kicker">Manage</p><h1>{TITLES[type ?? "all"]}</h1></div>
        <p className="adm-stamp">{users.data ? `${rows.length} of ${all.length} accounts` : "Loading…"}</p>
      </header>

      <div className="adm-toolbar">
        <label className="adm-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" aria-label="Search people" /></label>
        <div className="adm-chips">
          <Link to="/admin/users" search={{ type }} className={!status ? "active" : ""}>Everyone</Link>
          <Link to="/admin/users" search={{ type, status: "suspended" }} className={status === "suspended" ? "active" : ""}>Suspended</Link>
          {!type && <Link to="/admin/users" search={{ status: "untyped" }} className={status === "untyped" ? "active" : ""}>No account type</Link>}
        </div>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Person</th><th>Type</th><th className="num">Listings</th><th>Joined</th><th>Last sign-in</th><th>Status</th><th className="right">Actions</th></tr></thead>
          <tbody>
            {users.isError ? <tr><td colSpan={7} className="adm-empty">Couldn't load accounts.</td></tr>
              : !users.data ? <tr><td colSpan={7}><div className="adm-skel" /></td></tr>
              : rows.length === 0 ? <tr><td colSpan={7} className="adm-empty">No accounts match.</td></tr>
              : rows.map((u) => (
                <tr key={u.id} className={u.suspended ? "is-off" : ""}>
                  <td><strong>{u.name || "—"}</strong><small>{u.email}</small></td>
                  <td>
                    {u.isAdmin ? <span className="adm-tag adm-tag-admin">Admin{u.role ? ` · ${u.role}` : ""}</span>
                      : <select className="adm-select" value={u.role ?? ""} disabled={busy} aria-label={`Account type for ${u.email}`} onChange={(e) => roleM.mutate({ userId: u.id, role: e.target.value as "tenant" | "landlord" })}>
                        {!u.role && <option value="" disabled>Not chosen</option>}
                        <option value="tenant">Tenant</option>
                        <option value="landlord">Landlord</option>
                      </select>}
                  </td>
                  <td className="num">{u.listings ? <Link to="/admin/listings" search={{ owner: u.id }} className="adm-link">{u.listings}</Link> : "0"}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>{ago(u.lastSignInAt)}</td>
                  <td>{u.suspended ? <span className="adm-dot off">Suspended</span> : !u.confirmed ? <span className="adm-dot wait">Email not confirmed</span> : <span className="adm-dot live">Active</span>}</td>
                  <td className="right">
                    <div className="adm-actions">
                      {u.listings > 0 && <Link to="/admin/listings" search={{ owner: u.id }} className="adm-icon" title="Their listings" aria-label="Their listings"><Home size={15} /></Link>}
                      <Link to="/admin/messages" search={{ user: u.id }} className="adm-icon" title="Their messages" aria-label="Their messages"><MessagesSquare size={15} /></Link>
                      {!u.isAdmin && (u.suspended
                        ? <button className="adm-icon" title="Restore account" aria-label="Restore account" disabled={busy} onClick={() => suspendM.mutate({ userId: u.id, suspended: false })}><RotateCcw size={15} /></button>
                        : <button className="adm-icon" title="Suspend account" aria-label="Suspend account" disabled={busy} onClick={() => { if (window.confirm(`Suspend ${u.email}? They won't be able to sign in and their homes will be hidden.`)) suspendM.mutate({ userId: u.id, suspended: true }); }}><Ban size={15} /></button>)}
                      {!u.isAdmin && <button className="adm-icon danger" title="Delete account" aria-label="Delete account" disabled={busy} onClick={() => confirmDelete(u)}><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {type && <p className="adm-foot-note"><button type="button" className="adm-link" onClick={() => navigate({ search: {} })}>Show everyone</button></p>}
    </>
  );
}
