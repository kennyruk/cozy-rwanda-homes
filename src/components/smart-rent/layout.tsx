import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, LayoutGrid, MessageCircle, Plus, Search, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Brand } from "./brand";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
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
          {user && <Link to="/messages" activeProps={{ className: "active" }}>Messages</Link>}
          {user && <Link to="/dashboard" activeProps={{ className: "active" }}>My listings</Link>}
        </nav>
        <div className="nav-actions">
          <Link to="/landlord" className="button button-ghost button-small"><Plus size={16} />List a property</Link>
          {!loading && (user
            ? <button className="button button-quiet button-small" onClick={signOut}>Sign out</button>
            : <Link to="/auth" className="button button-primary button-small">Sign in</Link>)}
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const { user } = useAuth();
  return (
    <nav className="mobile-nav">
      <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "active" }}><Home /><span>Home</span></Link>
      <Link to="/explore" activeProps={{ className: "active" }}><Search /><span>Explore</span></Link>
      <Link to="/landlord" activeProps={{ className: "active" }}><Plus /><span>List</span></Link>
      <Link to="/messages" activeProps={{ className: "active" }}><MessageCircle /><span>Messages</span></Link>
      {user
        ? <Link to="/dashboard" activeProps={{ className: "active" }}><LayoutGrid /><span>Listings</span></Link>
        : <Link to="/auth" activeProps={{ className: "active" }}><UserRound /><span>Sign in</span></Link>}
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
          <Link to="/landlord">List a property</Link>
          <span>© {new Date().getFullYear()} Smart Rent</span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return <><SiteHeader /><main className="page-main">{children}</main>{footer && <SiteFooter />}<MobileNav /></>;
}
