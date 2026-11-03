import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Banknote, Check, Eye, FileText, HandCoins, MessageCircle, Search, ShieldAlert, Tag } from "lucide-react";
import { useState } from "react";
import hero from "../assets/home-hero-street.jpg";
import typeApartment from "../assets/type-apartment.jpg";
import typeHouse from "../assets/type-house.jpg";
import typeRoom from "../assets/type-room.jpg";
import { PageShell } from "../components/smart-rent/layout";
import { CardSkeletons, EmptyState, PropertyCard } from "../components/smart-rent/ui";
import { useAuth } from "../lib/auth";
import { fetchListings, fetchListingCounts, formatPrice, PROPERTY_TYPES } from "../lib/listings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Rent — Rental homes across Rwanda" },
      { name: "description", content: "Find apartments, houses and rooms to rent across Rwanda and message landlords directly. Landlords list for free." },
      { property: "og:title", content: "Smart Rent — Rental homes across Rwanda" },
      { property: "og:description", content: "Browse homes by area, type and budget, then talk directly with the landlord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TYPES = [
  { type: "Apartment", img: typeApartment, copy: "Flats in shared buildings, often with parking and security." },
  { type: "House", img: typeHouse, copy: "Whole homes with a compound, for families or sharing." },
  { type: "Room", img: typeRoom, copy: "A single room — the simplest way to start renting." },
] as const;

const AREAS = [
  { district: "Gasabo", region: "Kigali" },
  { district: "Kicukiro", region: "Kigali" },
  { district: "Nyarugenge", region: "Kigali" },
  { district: "Musanze", region: "Northern" },
  { district: "Huye", region: "Southern" },
  { district: "Rubavu", region: "Western" },
  { district: "Muhanga", region: "Southern" },
  { district: "Rwamagana", region: "Eastern" },
];

const BUDGETS = [200_000, 400_000, 700_000, 1_000_000];

const FAQ = [
  { q: "Does Smart Rent cost anything?", a: "No. Browsing, messaging and listing a home are all free. There is no commission on rent." },
  { q: "Who can list a home?", a: "Anyone with a landlord account. Choose “Landlord” when you create your account, then add photos, the location and the monthly rent." },
  { q: "How do I contact a landlord?", a: "Create a free tenant account, open the home you like and press “Message landlord”. The conversation stays in your Messages." },
  { q: "Can I have both a tenant and a landlord account?", a: "Each account is one or the other, so landlords and tenants always know who they're talking to. Use a second email if you need both." },
  { q: "What happens to misleading listings?", a: "Our team can hide or remove listings and accounts that break the rules. If something looks wrong, don't pay — tell us." },
];

function Home() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const latest = useQuery({ queryKey: ["listings", "latest"], queryFn: () => fetchListings({ limit: 6 }) });
  const counts = useQuery({ queryKey: ["listings", "counts"], queryFn: fetchListingCounts });

  const homesLabel = (n: number | undefined) => (n ? `${n} ${n === 1 ? "home" : "homes"}` : "View homes");
  const listHref = !user ? { to: "/auth" as const, search: { as: "landlord" as const, redirect: "/landlord" } } : role === "landlord" ? { to: "/landlord" as const } : null;

  return (
    <PageShell>
      <section className="home-hero">
        <img className="home-hero-img" src={hero} alt="A residential street on a green hillside in Kigali" width={1920} height={1088} />
        <div className="home-hero-inner">
          <div className="home-hero-panel">
            <p className="eyebrow">Homes for rent in Rwanda</p>
            <h1>Find a place.<br />Feel at home.</h1>
            <p className="home-hero-lede">Apartments, houses and rooms listed by the landlords themselves. Message them directly — no agents, no fees.</p>
            <form className="home-search" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/explore", search: { location: location || undefined, type: type || undefined, maxPrice: Number(budget) || undefined } }); }}>
              <label className="home-search-where"><span>Where</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="District or neighbourhood" /></label>
              <label><span>Type</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Any type</option>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label><span>Budget</span><select value={budget} onChange={(e) => setBudget(e.target.value)}><option value="">Any price</option>{BUDGETS.map((b) => <option key={b} value={b}>Up to {formatPrice(b)}</option>)}</select></label>
              <button className="button button-primary"><Search size={18} />Search homes</button>
            </form>
            <div className="home-quick">
              <span>Popular:</span>
              {["Kimihurura", "Kicukiro", "Remera", "Nyamirambo", "Musanze"].map((p) => <Link key={p} to="/explore" search={{ location: p }}>{p}</Link>)}
            </div>
          </div>
        </div>
      </section>

      <section className="home-facts" aria-label="Why Smart Rent">
        <div><HandCoins size={22} /><p><strong>Free for everyone</strong><span>No listing fees, no commission.</span></p></div>
        <div><MessageCircle size={22} /><p><strong>Talk to the landlord</strong><span>Messages go straight to the owner.</span></p></div>
        <div><Banknote size={22} /><p><strong>Rent shown upfront</strong><span>Every home lists its monthly price in RWF.</span></p></div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">Browse by type</p><h2>What are you looking for?</h2></div>
        </div>
        <div className="type-grid">
          {TYPES.map((t) => (
            <Link key={t.type} to="/explore" search={{ type: t.type }} className="type-card">
              <div className="type-photo"><img src={t.img} alt={`${t.type} for rent`} width={960} height={720} loading="lazy" /></div>
              <div className="type-body">
                <div><h3>{t.type === "House" ? "Houses" : `${t.type}s`}</h3><p>{t.copy}</p></div>
                <span className="type-count">{homesLabel(counts.data?.byType[t.type])} <ArrowRight size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="band">
      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">Newly listed</p><h2>Latest homes on Smart Rent</h2></div>
          <Link to="/explore" className="text-link">See all homes <ArrowRight size={16} /></Link>
        </div>
        {latest.isError ? <EmptyState title="Couldn't load homes" copy="Please check your connection and try again." />
          : latest.data && latest.data.length === 0 ? <EmptyState title="No homes listed yet" copy="Be the first landlord to list a property — it's free." action={<Link to="/auth" search={{ as: "landlord", redirect: "/landlord" }} className="button button-primary">List a property</Link>} />
          : <div className="property-grid">{latest.data ? latest.data.map((l) => <PropertyCard listing={l} key={l.id} />) : <CardSkeletons />}</div>}
      </section>
      </div>

      <section className="section areas">
        <div className="areas-intro">
          <p className="eyebrow">Browse by area</p>
          <h2>Homes across the country</h2>
          <p className="muted">Start in Kigali or look further out. Type any neighbourhood in the search to narrow it down.</p>
          <Link to="/explore" className="text-link">All areas <ArrowRight size={16} /></Link>
        </div>
        <ul className="area-list">
          {AREAS.map((a) => (
            <li key={a.district}>
              <Link to="/explore" search={{ location: a.district }}>
                <span><strong>{a.district}</strong><small>{a.region}</small></span>
                <em>{counts.data?.byDistrict[a.district] ? homesLabel(counts.data.byDistrict[a.district]) : ""}</em>
                <ArrowRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section budgets">
        <div className="section-heading">
          <div><p className="eyebrow">Browse by budget</p><h2>Homes that fit what you pay</h2></div>
        </div>
        <div className="budget-grid">
          {BUDGETS.map((b, i) => (
            <Link key={b} to="/explore" search={{ maxPrice: b }} className="budget-card">
              <small>{i === 0 ? "Starter" : i === 1 ? "Comfortable" : i === 2 ? "Family" : "Premium"}</small>
              <strong>{formatPrice(b)}</strong>
              <span>RWF / month or less <ArrowRight size={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section audiences">
        <div className="audience">
          <p className="eyebrow">For tenants</p>
          <h2>Find it, ask, go see it.</h2>
          <ul>
            <li><Check size={16} />Search by area, type, budget and bedrooms</li>
            <li><Check size={16} />See photos, the price and what's included</li>
            <li><Check size={16} />Message the landlord and arrange a visit</li>
          </ul>
          {user ? <Link to="/explore" className="button button-primary">Browse homes <ArrowRight size={16} /></Link>
            : <Link to="/auth" search={{ as: "tenant" }} className="button button-primary">Create a tenant account <ArrowRight size={16} /></Link>}
        </div>
        <div className="audience audience-dark">
          <p className="eyebrow">For landlords</p>
          <h2>List once, hear from tenants.</h2>
          <ul>
            <li><Check size={16} />Add up to 8 photos, the rent and the essentials</li>
            <li><Check size={16} />Hide a home when it's taken, show it again later</li>
            <li><Check size={16} />Reply to tenants in one inbox — free, always</li>
          </ul>
          {listHref ? <Link {...listHref} className="button button-light">List your property <ArrowRight size={16} /></Link>
            : <Link to="/how-it-works" className="button button-light">How listing works <ArrowRight size={16} /></Link>}
        </div>
      </section>

      <section className="section how">
        <div className="section-heading">
          <div><p className="eyebrow">How it works</p><h2>Three steps, no middleman</h2></div>
          <Link to="/how-it-works" className="text-link">More detail <ArrowRight size={16} /></Link>
        </div>
        <div className="how-grid">
          <div><span>01</span><h3>Landlords list</h3><p>Add photos, a price and the essentials. Listing is free.</p></div>
          <div><span>02</span><h3>Tenants browse</h3><p>Search by area, type, budget and bedrooms.</p></div>
          <div><span>03</span><h3>Talk directly</h3><p>Create an account and message the landlord about the home you like.</p></div>
        </div>
      </section>

      <section className="section safety">
        <div className="safety-head">
          <ShieldAlert size={26} />
          <div><h2>Renting safely</h2><p className="muted">A few habits that protect your money.</p></div>
        </div>
        <div className="safety-grid">
          <div><Eye size={18} /><h3>Visit first</h3><p>See the home in person before you pay anything.</p></div>
          <div><BadgeCheck size={18} /><h3>Meet the owner</h3><p>Ask for ID and confirm they own or manage the property.</p></div>
          <div><FileText size={18} /><h3>Get it in writing</h3><p>Agree the rent, deposit and dates in a signed contract.</p></div>
          <div><Tag size={18} /><h3>Too cheap?</h3><p>A price far below the area's usual rent is a warning sign.</p></div>
        </div>
      </section>

      <section className="section faq">
        <div className="faq-intro"><p className="eyebrow">Questions</p><h2>Good to know</h2><p className="muted">Still unsure? <Link to="/about" className="text-link">Read about us</Link></p></div>
        <div className="faq-list">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div><h2>Have a place to rent?</h2><p>Reach tenants across Rwanda at no cost.</p></div>
          {listHref ? <Link {...listHref} className="button button-light">List your property <ArrowRight size={16} /></Link>
            : <Link to="/explore" className="button button-light">Browse homes <ArrowRight size={16} /></Link>}
        </div>
      </section>
    </PageShell>
  );
}
