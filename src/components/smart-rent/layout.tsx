import { Link } from "@tanstack/react-router";
import { Heart, Home, Menu, MessageCircle, Search, UserRound } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="nav-shell"><Link to="/" className="logo-link"><Brand /></Link><nav className={open ? "main-nav is-open" : "main-nav"}><Link to="/">Home</Link><Link to="/explore">Explore</Link><a href="/#how-it-works">How it works</a><Link to="/landlord">For landlords</Link></nav><div className="nav-actions"><Link to="/dashboard" className="login-link">Log in</Link><Link to="/dashboard" className="button button-primary button-small">Sign up</Link></div><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Open menu"><Menu /></button></div></header>;
}

export function MobileNav() {
  return <nav className="mobile-nav"><Link to="/"><Home /><span>Home</span></Link><Link to="/explore"><Search /><span>Explore</span></Link><Link to="/saved"><Heart /><span>Saved</span></Link><Link to="/messages"><MessageCircle /><span>Messages</span></Link><Link to="/dashboard"><UserRound /><span>Profile</span></Link></nav>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-inner"><div><Brand light /><p>Find a place. Feel at home.</p></div><div className="footer-links"><Link to="/explore">Explore homes</Link><Link to="/landlord">List a property</Link><Link to="/messages">Messages</Link><span>© 2026 Smart Rent Rwanda</span></div></div></footer>;
}

export function PageShell({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return <><SiteHeader /><main>{children}</main>{footer && <SiteFooter />}<MobileNav /></>;
}