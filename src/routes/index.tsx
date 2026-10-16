import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import hero from "../assets/smart-rent-hero.jpg";
import { PageShell } from "../components/smart-rent/layout";
import { CardSkeletons, EmptyState, PropertyCard } from "../components/smart-rent/ui";
import { fetchListings, PROPERTY_TYPES } from "../lib/listings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Rent — Rental homes across Rwanda" },
      { name: "description", content: "Find rental homes across Rwanda and message landlords directly. Landlords list for free." },
      { property: "og:title", content: "Smart Rent — Rental homes across Rwanda" },
      { property: "og:description", content: "Browse homes and talk directly with landlords." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const latest = useQuery({ queryKey: ["listings", "latest"], queryFn: () => fetchListings({ limit: 6 }) });

  return (
    <PageShell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Smart Rent Rwanda</p>
          <h1>Find a place.<br />Feel at home.</h1>
          <p className="lede">Browse homes listed by landlords across Rwanda, then message them directly. No agents in between.</p>
          <form className="search-bar" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/explore", search: { location, type } }); }}>
            <label><span>Where</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="District or neighbourhood" /></label>
            <label><span>Type</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Any</option>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <button className="button button-primary search-go" aria-label="Search homes"><Search size={18} /><span>Search</span></button>
          </form>
        </div>
        <div className="hero-image"><img src={hero} alt="A home on a green Rwandan hillside" width="1600" height="1000" /></div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><h2>Newly listed</h2><p>The latest homes from landlords on Smart Rent.</p></div>
          <Link to="/explore" className="text-link">See all <ArrowRight size={16} /></Link>
        </div>
        {latest.isError ? <EmptyState title="Couldn't load homes" copy="Please check your connection and try again." />
          : latest.data && latest.data.length === 0 ? <EmptyState title="No homes listed yet" copy="Be the first landlord to list a property — it's free." action={<Link to="/landlord" className="button button-primary">List a property</Link>} />
          : <div className="property-grid">{latest.data ? latest.data.map((l) => <PropertyCard listing={l} key={l.id} />) : <CardSkeletons />}</div>}
      </section>

      <section className="section how" id="how-it-works">
        <h2>How it works</h2>
        <div className="how-grid">
          <div><span>1</span><h3>Landlords list</h3><p>Add photos, a price and the essentials. Listing is free.</p></div>
          <div><span>2</span><h3>Tenants browse</h3><p>Search by area, type, budget and bedrooms.</p></div>
          <div><span>3</span><h3>Talk directly</h3><p>Create an account and message the landlord about the home you like.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div><h2>Have a place to rent?</h2><p>Reach tenants across Rwanda at no cost.</p></div>
          <Link to="/landlord" className="button button-light">List your property <ArrowRight size={16} /></Link>
        </div>
      </section>
    </PageShell>
  );
}
