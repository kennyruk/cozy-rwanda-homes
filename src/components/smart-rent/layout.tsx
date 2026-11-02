import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Info, LayoutGrid, MessageCircle, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { RoleChooser } from "./account";
import { Brand } from "./brand";

export function SiteHeader() {
  const { user, role, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isLandlord = role === "landlord";
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link to="/" className="logo-link"><Brand /></Link>
        <nav className="main-nav">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "active" }}>Home</Link>
          <Link to="/explore" activeProps={{ className: "active" }}>Explore</Link>
          <Link to="/how-it-works" className="nav-secondary" activeProps={{ className: "nav-secondary active" }}>How it works</Link>
          <Link to="/about" className="nav-secondary" activeProps={{ className: "nav-secondary active" }}>About us</Link>
          {user && role && <Link to="/messages" activeProps={{ className: "active" }}>Messages</Link>}
          {isLandlord && <Link to="/dashboard" activeProps={{ className: "active" }}>My listings</Link>}
        </nav>
        <div className="nav-actions">
          {!loading && !user && <Link to="/auth" search={{ as: "landlord", redirect: "/landlord" }} className="button button-ghost button-small"><Plus size={16} />List a property</Link>}
          {isLandlord && <Link to="/landlord" className="button button-ghost button-small"><Plus size={16} />List a property</Link>}
          {isAdmin && <Link to="/admin" className="button button-ghost button-small admin-entry"><ShieldCheck size={16} />Admin</Link>}
          {!loading && (user
            ? <>{role && <Link to="/account" className="account-badge account-link" title="My account"><UserRound size={14} />{role === "landlord" ? "Landlord" : "Tenant"}</Link>}<button className="button button-quiet button-small" onClick={signOut}>Sign out</button></>
            : <Link to="/auth" className="button button-primary button-small">Sign in</Link>)}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const { user, role, isAdmin } = useAuth();
  return (
    <nav className="mobile-nav">
      <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "active" }}><Home /><span>Home</span></Link>
      <Link to="/explore" activeProps={{ className: "active" }}><Search /><span>Explore</span></Link>
      {role === "landlord" && <Link to="/landlord" activeProps={{ className: "active" }}><Plus /><span>List</span></Link>}
      {role === "tenant" && <Link to="/how-it-works" activeProps={{ className: "active" }}><Info /><span>Help</span></Link>}
      {!user && <Link to="/auth" search={{ as: "landlord", redirect: "/landlord" }}><Plus /><span>List</span></Link>}
      <Link to="/messages" activeProps={{ className: "active" }}><MessageCircle /><span>Messages</span></Link>
      {isAdmin && <Link to="/admin"><ShieldCheck /><span>Admin</span></Link>}
      {role === "landlord"
        ? <Link to="/dashboard" activeProps={{ className: "active" }}><LayoutGrid /><span>Listings</span></Link>
        : !user
          ? <Link to="/auth" activeProps={{ className: "active" }}><UserRound /><span>Sign in</span></Link>
          : <Link to="/account" activeProps={{ className: "active" }}><UserRound /><span>Account</span></Link>}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div><Brand /><p>Connecting landlords and tenants across Rwanda.</p></div>
        <div className="footer-links">
          <Link to="/explore">Explore homes</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/about">About us</Link>
          <Link to="/auth" search={{ as: "landlord", redirect: "/landlord" }}>For landlords</Link>
          <span>© {new Date().getFullYear()} Smart Rent</span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  const { user, role, isAdmin, loading } = useAuth();
  const needsRole = !loading && !!user && !role && !isAdmin;
  return <><SiteHeader /><main className="page-main">{needsRole ? <RoleChooser /> : children}</main>{footer && <SiteFooter />}<MobileNav /></>;
}
