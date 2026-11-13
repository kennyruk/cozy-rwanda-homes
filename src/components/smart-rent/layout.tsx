import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Home, Info, LayoutGrid, MessageCircle, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "../ui/button";
import { RoleChooser } from "./account";
import { Brand } from "./brand";

/** True once the page has been scrolled a little, so the navbar can switch to its frosted-glass look. */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** Same header as the landing page, on a solid ink bar so every page shares one look. */
export function SiteHeader() {
  const { user, role, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isLandlord = role === "landlord";
  const scrolled = useScrolled();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const accountTo = user ? (isAdmin ? "/admin" : "/account") : "/auth";
  const accountLabel = user ? (isAdmin ? "Admin dashboard" : "My account") : "Log in";
  const loginLabel = user ? (isAdmin ? "Admin" : "My account") : "Log in";
  return (
    <header className="site-header" data-scrolled={scrolled ? "true" : "false"}>
      <div className="villa-header">
        <Link to="/" className="villa-brand" aria-label="Smart Rent home"><Brand light /></Link>
        <nav className="villa-nav" aria-label="Main navigation">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "selected" }}>Home</Link>
          <Link to="/explore" activeProps={{ className: "selected" }}>Explore</Link>
          <Link to="/how-it-works" className="nav-secondary" activeProps={{ className: "nav-secondary selected" }}>How it works</Link>
          <Link to="/about" className="nav-secondary" activeProps={{ className: "nav-secondary selected" }}>About us</Link>
          {user && role && <Link to="/messages" activeProps={{ className: "selected" }}>Messages</Link>}
          {isLandlord && <Link to="/dashboard" activeProps={{ className: "selected" }}>My listings</Link>}
        </nav>
        <div className="villa-actions">
          {!loading && !user && <Button asChild variant="ghost" className="villa-list"><Link to="/auth" search={{ as: "landlord", redirect: "/landlord" }}><Plus />List a property</Link></Button>}
          {isLandlord && <Button asChild variant="ghost" className="villa-list"><Link to="/landlord"><Plus />List a property</Link></Button>}
          {!loading && user && <Button variant="ghost" className="villa-list" onClick={signOut}>Sign out</Button>}
          <Button asChild variant="ghost" className="villa-login" data-pending={loading ? "true" : "false"}>
            <Link to={accountTo} title={user && role ? `${accountLabel} (${role})` : accountLabel}>{loginLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Phone navigation: a bar fixed to the bottom of the screen. Hidden on larger screens, where the header shows the links. */
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


/** Same footer as the landing page. */
export function SiteFooter() {
  return (
    <footer className="estate-footer">
      <div className="estate-container">
        <Link to="/" aria-label="Smart Rent home"><Brand light /></Link>
        <p>Connecting landlords and tenants across Rwanda.</p>
        <nav aria-label="Footer navigation">
          <Link to="/explore">Explore</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/about">About us</Link>
          <Link to="/auth" search={{ as: "landlord", redirect: "/landlord" }}>For landlords</Link>
        </nav>
        <small>© {new Date().getFullYear()} Smart Rent</small>
      </div>
    </footer>
  );
}

export function PageShell({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  const { user, role, isAdmin, loading } = useAuth();
  const needsRole = !loading && !!user && !role && !isAdmin;
  return <><SiteHeader /><main className="page-main">{needsRole ? <RoleChooser /> : children}</main>{footer && <SiteFooter />}<MobileNav /></>;
}
