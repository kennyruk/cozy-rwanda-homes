import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Handshake, Home, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import heroImage from "../assets/smart-rent-hero.jpg";
import { PageShell } from "../components/smart-rent/layout";
import { PropertyCard, SectionHeading } from "../components/smart-rent/ui";
import { properties } from "../data/properties";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Smart Rent | Homes for rent across Rwanda" },
    { name: "description", content: "Discover trusted houses, apartments and rooms across Rwanda. Connect directly with landlords on Smart Rent." },
    { property: "og:title", content: "Smart Rent | Find a place. Feel at home." },
    { property: "og:description", content: "Search quality rental homes and connect directly with landlords across Rwanda." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}), component: HomePage,
});

const locations = [
  { name: "Kigali", count: 128, image: properties[1].image, className: "location-wide" },
  { name: "Musanze", count: 34, image: properties[2].image },
  { name: "Huye", count: 27, image: properties[0].image },
  { name: "Rubavu", count: 19, image: properties[2].image },
];

function SearchPanel() {
  const navigate = useNavigate();
  const [where, setWhere] = useState("");
  const [type, setType] = useState("");
  return <form className="search-panel" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/explore", search: { location: where, type } }); }}>
    <label><span>Where?</span><input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Kigali, Kicukiro..." /></label>
    <label><span>Property type</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="">House, apartment or room</option><option>House</option><option>Apartment</option><option>Room</option></select></label>
    <label><span>Price</span><select><option>Any price</option><option>Under 300,000 RWF</option><option>300,000 – 600,000 RWF</option><option>600,000+ RWF</option></select></label>
    <label><span>Bedrooms</span><select><option>Any</option><option>1+</option><option>2+</option><option>3+</option></select></label>
    <button className="button button-primary search-submit" type="submit"><Search size={18} />Search homes</button>
  </form>;
}

function HomePage() {
  return <PageShell><section className="hero"><img src={heroImage} alt="A modern home overlooking Kigali's green hills" width="1920" height="1080" /><div className="hero-shade" /><div className="hero-content"><p className="hero-kicker"><ShieldCheck size={17} />Rental homes across Rwanda</p><h1>Find a place you’ll<br />love to call home.</h1><p>Discover homes and apartments across Rwanda and connect directly with the people who rent them.</p></div><div className="hero-search"><SearchPanel /></div></section>
    <section className="section section-properties"><SectionHeading eyebrow="Fresh on Smart Rent" title="Homes worth seeing" copy="Explore some of the latest places available on Smart Rent." action={<Link to="/explore" className="text-link">View all homes <ArrowRight size={17} /></Link>} /><div className="property-grid">{properties.slice(0,3).map((property) => <PropertyCard property={property} key={property.id} />)}</div></section>
    <section className="section location-section"><SectionHeading eyebrow="From the city to the hills" title="Explore Rwanda" copy="Find your next neighbourhood, wherever life is taking you." /><div className="location-grid">{locations.map((location) => <Link to="/explore" search={{ location: location.name, type: "" }} className={`location-card ${location.className ?? ""}`} key={location.name}><img src={location.image} alt={`Homes in ${location.name}`} loading="lazy" /><span className="location-overlay" /><div><strong>{location.name}</strong><span>{location.count} properties</span></div><ArrowRight /></Link>)}</div></section>
    <section className="steps" id="how-it-works"><div className="section"><SectionHeading eyebrow="Simple, direct, local" title="From search to front door" copy="A clearer way to find and rent your next home." /><div className="steps-grid"><Step number="01" icon={<Search />} title="Search" copy="Find homes based on location, price and property type." /><Step number="02" icon={<Handshake />} title="Connect" copy="Ask questions and chat directly with the landlord." /><Step number="03" icon={<Home />} title="Move in" copy="Send a rental request and arrange your move." /></div></div></section>
    <section className="section"><div className="landlord-cta"><div className="landlord-icon"><Building2 /></div><div><p className="eyebrow">For property owners</p><h2>Have a property to rent?</h2><p>List your property on Smart Rent for <strong>FREE</strong> and connect directly with people looking for a home.</p></div><Link to="/landlord" className="button button-light">List my property — It’s free <ArrowRight size={18} /></Link></div></section>
  </PageShell>;
}

function Step({ number, icon, title, copy }: { number: string; icon: React.ReactNode; title: string; copy: string }) { return <article className="step"><div className="step-top"><span>{number}</span>{icon}</div><h3>{title}</h3><p>{copy}</p></article>; }