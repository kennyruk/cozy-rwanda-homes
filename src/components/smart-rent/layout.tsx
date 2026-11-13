import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "../ui/button";
import { RoleChooser } from "./account";
import { Brand } from "./brand";

/** Same header as the landing page, on a solid ink bar so every page shares one look. */
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
  const accountTo = user ? (isAdmin ? "/admin" : "/account") : "/auth";
  const accountLabel = user ? (isAdmin ? "Admin dashboard" : "My account") : "Log in";
  const loginLabel = user ? (isAdmin ? "Admin" : "My account") : "Log in";
  return (
    <header className="site-header">
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
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

/**
 * Phone navigation: a button in the header that drops a menu down from the top bar.
 * Hidden on larger screens, where the header shows the links inline.
 */
export function MobileMenu() {
  const { user, role, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLandlord = role === "landlord";
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  async function signOut() {
    setOpen(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" className="villa-menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
        {open ? <X /> : <Menu />}
      </button>
      {open && <div className="villa-menu-backdrop" onClick={close} aria-hidden="true" />}
      <nav id="mobile-menu" className="villa-menu" data-open={open ? "true" : "false"} aria-label="Menu" aria-hidden={!open} inert={!open}>
        <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "selected" }} onClick={close}>Home</Link>
        <Link to="/explore" activeProps={{ className: "selected" }} onClick={close}>Explore</Link>
        <Link to="/how-it-works" activeProps={{ className: "selected" }} onClick={close}>How it works</Link>
        <Link to="/about" activeProps={{ className: "selected" }} onClick={close}>About us</Link>
        {user && role && <Link to="/messages" activeProps={{ className: "selected" }} onClick={close}>Messages</Link>}
        {isLandlord && <Link to="/dashboard" activeProps={{ className: "selected" }} onClick={close}>My listings</Link>}
        {isLandlord && <Link to="/landlord" activeProps={{ className: "selected" }} onClick={close}>List a property</Link>}
        {!loading && !user && <Link to="/auth" search={{ as: "landlord", redirect: "/landlord" }} onClick={close}>List a property</Link>}
        {user && <Link to={isAdmin ? "/admin" : "/account"} activeProps={{ className: "selected" }} onClick={close}>{isAdmin ? "Admin dashboard" : "My account"}</Link>}
        {!loading && user && <button type="button" onClick={signOut}>Sign out</button>}
      </nav>
    </>
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
  return <><SiteHeader /><main className="page-main">{needsRole ? <RoleChooser /> : children}</main>{footer && <SiteFooter />}</>;
}
