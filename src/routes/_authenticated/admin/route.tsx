import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Gauge, Home, KeyRound, LogOut, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Smart Rent" },
      { name: "description", content: "Smart Rent admin console." },
      { property: "og:title", content: "Admin | Smart Rent" },
      { property: "og:description", content: "Smart Rent admin console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) return <div className="adm-gate"><p>Checking access…</p></div>;
  if (!isAdmin) {
    return (
      <div className="adm-gate">
        <ShieldCheck size={28} />
        <h1>Admins only</h1>
        <p>This area is for Smart Rent staff.</p>
        <Link to="/" className="button button-primary">Back to Smart Rent</Link>
      </div>
    );
  }

  const item = "adm-nav-item";
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-mark">
          <span className="adm-mark-icon"><Home size={16} /></span>
          <div><strong>Smart Rent</strong><small>Admin console</small></div>
        </div>
        <nav className="adm-nav">
          <span className="adm-nav-label">Monitor</span>
          <Link to="/admin" activeOptions={{ exact: true }} className={item} activeProps={{ className: `${item} active` }}><Gauge size={16} />Overview</Link>
          <Link to="/admin/messages" search={{}} className={item} activeProps={{ className: `${item} active` }}><MessagesSquare size={16} />All messages</Link>
          <span className="adm-nav-label">Manage</span>
          <Link to="/admin/users" search={{ type: "landlord" }} activeOptions={{ includeSearch: true }} className={item} activeProps={{ className: `${item} active` }}><Building2 size={16} />Landlords</Link>
          <Link to="/admin/users" search={{ type: "tenant" }} activeOptions={{ includeSearch: true }} className={item} activeProps={{ className: `${item} active` }}><KeyRound size={16} />Tenants</Link>
          <Link to="/admin/users" search={{}} activeOptions={{ includeSearch: true }} className={item} activeProps={{ className: `${item} active` }}><Users size={16} />All people</Link>
          <Link to="/admin/listings" search={{}} className={item} activeProps={{ className: `${item} active` }}><Home size={16} />Listings</Link>
        </nav>
        <div className="adm-side-foot">
          <Link to="/" className={item}><ArrowLeft size={16} />Back to site</Link>
          <button type="button" className={item} onClick={signOut}><LogOut size={16} />Sign out</button>
          <p className="adm-who" title={user?.email ?? ""}>{user?.email}</p>
        </div>
      </aside>
      <main className="adm-main"><Outlet /></main>
    </div>
  );
}
