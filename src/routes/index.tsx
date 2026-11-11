import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, MapPin, Plus, Search, UserRound } from "lucide-react";
import { useState } from "react";
import landingCss from "../landing.css?url";
import villa from "../assets/luxury-villa-scene.jpg";
import apartment from "../assets/modern-apartment-view.jpg.asset.json";
import luxuryVilla from "../assets/luxury-villa-view.jpg.asset.json";
import { Brand } from "../components/smart-rent/brand";
import { RoleChooser } from "../components/smart-rent/account";
import { Button } from "../components/ui/button";
import { useAuth } from "../lib/auth";
import { DISTRICTS, formatPrice, PROPERTY_TYPES } from "../lib/listings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Rent — Find your perfect home in Rwanda" },
      { name: "description", content: "Find apartments, houses and rooms to rent across Rwanda. Search by location, property type and budget, and connect directly with landlords." },
      { property: "og:title", content: "Smart Rent — Find your perfect home in Rwanda" },
      { property: "og:description", content: "Your next home starts here. Explore rental homes across Rwanda and message landlords directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: landingCss },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500&display=swap" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { user, role, isAdmin, loading } = useAuth();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const listHref = !user
    ? { to: "/auth" as const, search: { as: "landlord" as const, redirect: "/landlord" } }
    : role === "landlord" ? { to: "/landlord" as const } : null;

  return (
    <main className="villa-landing">
      <img className="villa-backdrop" src={villa} alt="A contemporary concrete villa with warmly lit interiors and an infinity pool at sunset" width={952} height={768} fetchPriority="high" />
      <div className="villa-shade" />
      <header className="villa-header">
        <Link to="/" className="villa-brand" aria-label="Smart Rent home"><Brand light /></Link>
        <nav className="villa-nav" aria-label="Main navigation">
          <Link to="/" className="selected">Home</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/about">About us</Link>
        </nav>
        <div className="villa-actions">
          {listHref && <Button asChild variant="ghost" className="villa-list"><Link {...listHref}><Plus />List a property</Link></Button>}
          <Button asChild variant="ghost" size="icon" className="villa-account"><Link to={user ? isAdmin ? "/admin" : "/account" : "/auth"} aria-label={user ? isAdmin ? "Admin dashboard" : "My account" : "Sign in"} title={user ? isAdmin ? "Admin dashboard" : "My account" : "Sign in"}><UserRound /></Link></Button>
        </div>
      </header>

      <div className="villa-title">
        <p className="villa-eyebrow">// &nbsp;01 Find Your Perfect Home</p>
        <h1><span className="villa-smart">SMART</span><span className="villa-rent">RENT</span></h1>
      </div>

      <div className="villa-previews" aria-label="Browse property types">
        <Link to="/explore" search={{ type: "Apartment", location: "Kigali" }} className="villa-preview">
          <img src={apartment.url} alt="Modern apartment architecture" width={135} height={76} />
          <span className="villa-preview-caption"><strong>Modern Apartment</strong><span><MapPin />Kigali</span></span>
        </Link>
        <Link to="/explore" search={{ type: "House", location: "Kigali" }} className="villa-preview">
          <img src={luxuryVilla.url} alt="Contemporary villa architecture" width={153} height={76} />
          <span className="villa-preview-caption"><strong>Luxury Villa</strong><span><MapPin />Kigali</span></span>
        </Link>
      </div>

      <form className="villa-search" onSubmit={(event) => {
        event.preventDefault();
        navigate({ to: "/explore", search: { location: location || undefined, type: type || undefined, maxPrice: Number(budget) || undefined } });
      }}>
        <label className="villa-location"><span>Location</span><div><input aria-label="Location" list="villa-districts" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Search city or district" /><ChevronDown /></div></label>
        <datalist id="villa-districts">{["Kigali", ...DISTRICTS].map((district) => <option value={district} key={district} />)}</datalist>
        <label><span>Property type</span><div><select aria-label="Property type" value={type} onChange={(event) => setType(event.target.value)}><option value="">Any type</option>{PROPERTY_TYPES.map((propertyType) => <option key={propertyType}>{propertyType}</option>)}</select><ChevronDown /></div></label>
        <label><span>Budget</span><div><select aria-label="Budget" value={budget} onChange={(event) => setBudget(event.target.value)}><option value="">Any price</option>{[200_000, 400_000, 700_000, 1_000_000].map((price) => <option key={price} value={price}>Up to {formatPrice(price)} RWF</option>)}</select><ChevronDown /></div></label>
        <Button type="submit" className="villa-search-submit"><Search />Search homes</Button>
      </form>
      {!loading && user && !role && !isAdmin && <div className="villa-role-chooser"><RoleChooser /></div>}
    </main>
  );
}
