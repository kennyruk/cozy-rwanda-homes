import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Eye, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import apartment from "../../assets/type-apartment.jpg";
import house from "../../assets/type-house.jpg";
import room from "../../assets/type-room.jpg";
import { Button } from "../ui/button";
import { Brand } from "./brand";
import { CardSkeletons, EmptyState, PropertyCard } from "./ui";
import { fetchListingCounts, fetchListings, formatPrice } from "../../lib/listings";
import { useAuth } from "../../lib/auth";

const types = [
  { name: "Apartment", title: "Apartments", image: apartment, copy: "A space of your own, in the heart of it all." },
  { name: "House", title: "Houses", image: house, copy: "More room for the life you want to build." },
  { name: "Room", title: "Rooms", image: room, copy: "A fresh start. A place to call yours." },
];
const areas = [
  { name: "Gasabo", region: "Kigali" }, { name: "Kicukiro", region: "Kigali" },
  { name: "Nyarugenge", region: "Kigali" }, { name: "Musanze", region: "Northern" },
  { name: "Huye", region: "Southern" }, { name: "Rubavu", region: "Western" },
  { name: "Muhanga", region: "Southern" }, { name: "Rwamagana", region: "Eastern" },
];
const faqs = [
  { q: "Does Smart Rent cost anything?", a: "Browsing, messaging and listing a home are free. There is no commission on rent." },
  { q: "Who can list a home?", a: "Anyone with a landlord account can list a property. Add photos, the location and the monthly rent." },
  { q: "How do I contact a landlord?", a: "Create a tenant account, open a home you like and select Message landlord. Your conversation stays in Messages." },
  { q: "Can I be both a tenant and a landlord?", a: "Each account has one account type. Use a separate email address if you need both." },
];

export function HomeSections() {
  const { user, role } = useAuth();
  const latest = useQuery({ queryKey: ["listings", "latest"], queryFn: () => fetchListings({ limit: 6 }) });
  const counts = useQuery({ queryKey: ["listings", "counts"], queryFn: fetchListingCounts });
  const listHref = !user ? { to: "/auth" as const, search: { as: "landlord" as const, redirect: "/landlord" } } : role === "landlord" ? { to: "/landlord" as const } : null;
  return (
    <div className="estate-sections">
      <div className="estate-values estate-container">
        <span><Check />Free to list. Free to find.</span>
        <span><MessageCircle />Direct to the landlord.</span>
        <span><ShieldCheck />Monthly rent, shown upfront.</span>
      </div>

      <section className="estate-section estate-container">
        <div className="estate-heading"><div><p className="estate-kicker">// &nbsp;02 A space for every chapter</p><h2>Find your kind of home.</h2></div><Link to="/explore" className="estate-link">Explore all homes <ArrowRight /></Link></div>
        <div className="estate-types">{types.map((type) => <Link key={type.name} to="/explore" search={{ type: type.name }} className="estate-type"><div className="estate-type-image"><img src={type.image} alt={`${type.name} architecture and interior`} loading="lazy" /><span className="estate-type-arrow"><ArrowRight /></span></div><div className="estate-type-title"><h3>{type.title}</h3><span>{counts.data?.byType[type.name] ? `${counts.data.byType[type.name]} homes` : "Explore"}</span></div><p>{type.copy}</p></Link>)}</div>
      </section>

      <section className="estate-latest">
        <div className="estate-section estate-container">
          <div className="estate-heading"><div><p className="estate-kicker">// &nbsp;03 Just listed</p><h2>Your next address.</h2></div><Link to="/explore" className="estate-link">View all listings <ArrowRight /></Link></div>
          {latest.isError ? <EmptyState title="Couldn't load homes" copy="Please check your connection and try again." action={<Button variant="outline" onClick={() => latest.refetch()}>Try again</Button>} /> : latest.data?.length === 0 ? <EmptyState title="A new chapter starts here." copy="No homes are listed yet. Landlords can list their properties for free." action={listHref ? <Button asChild><Link {...listHref}>List a property <ArrowRight /></Link></Button> : <Button asChild variant="outline"><Link to="/explore">Explore homes <ArrowRight /></Link></Button>} /> : <div className="property-grid">{latest.data ? latest.data.map((listing) => <PropertyCard key={listing.id} listing={listing} />) : <CardSkeletons />}</div>}
        </div>
      </section>

      <section className="estate-section estate-container estate-areas">
        <div><p className="estate-kicker">// &nbsp;04 Somewhere that feels right</p><h2>Rooted in Rwanda.</h2><p className="estate-description">City mornings or a quieter pace. Discover a neighbourhood that feels like you.</p><Link to="/explore" className="estate-link">Discover all areas <ArrowRight /></Link></div>
        <div className="estate-area-list">{areas.map((area) => <Link key={area.name} to="/explore" search={{ location: area.name }}><div><small>{area.region}</small><h3>{area.name}</h3></div><span>{counts.data?.byDistrict[area.name] ? `${counts.data.byDistrict[area.name]} homes` : "Explore"}</span><ArrowRight /></Link>)}</div>
      </section>

      <section className="estate-budget-band"><div className="estate-container estate-section"><div className="estate-heading"><div><p className="estate-kicker">// &nbsp;05 Room for your budget</p><h2>A home within reach.</h2></div><p className="estate-description">Monthly rent in RWF. No hidden listing fees.</p></div><div className="estate-budgets">{[200_000, 400_000, 700_000, 1_000_000].map((price, i) => <Link key={price} to="/explore" search={{ maxPrice: price }}><small>0{i + 1} / Up to</small><strong>{formatPrice(price)}</strong><span>RWF / month <ArrowRight /></span></Link>)}</div></div></section>

      <section className="estate-section estate-container">
        <div className="estate-heading"><div><p className="estate-kicker">// &nbsp;06 A simpler way to rent</p><h2>Less between you and home.</h2></div><Link to="/how-it-works" className="estate-link">How it works <ArrowRight /></Link></div>
        <div className="estate-steps">{[{ title: "Find your space.", copy: "Explore homes by area, property type, budget and bedrooms." }, { title: "Make a connection.", copy: "Create a tenant account and message the landlord about a home you like." }, { title: "See it for yourself.", copy: "Arrange a visit, meet the owner and agree the details directly." }].map((step, i) => <div key={step.title}><span>0{i + 1}</span><h3>{step.title}</h3><p>{step.copy}</p></div>)}</div>
      </section>

      <section className="estate-audiences"><div className="estate-container"><div><p className="estate-kicker">For tenants</p><h2>A place for your<br />next chapter.</h2><p>Explore the photos. Ask your questions. Find a home that fits your life.</p><Button asChild className="estate-cta"><Link to={user ? "/explore" : "/auth"} search={user ? {} : { as: "tenant" }}>Find a home <ArrowRight /></Link></Button></div><div><p className="estate-kicker">For landlords</p><h2>Your property.<br />Their new beginning.</h2><p>List your home for free, add photos and hear directly from interested tenants.</p><Button asChild variant="outline" className="estate-cta">{listHref ? <Link {...listHref}>List your property <ArrowRight /></Link> : <Link to="/how-it-works">Discover more <ArrowRight /></Link>}</Button></div></div></section>

      <section className="estate-section estate-container estate-safety"><div><p className="estate-kicker">// &nbsp;07 Peace of mind</p><h2>Rent with care.</h2></div><div className="estate-safety-items"><div><Eye /><h3>Visit before you pay.</h3><p>See the home in person before sending any money.</p></div><div><ShieldCheck /><h3>Know who you’re renting from.</h3><p>Meet the landlord and confirm they own or manage the home.</p></div><div><FileText /><h3>Put it in writing.</h3><p>Agree the rent, deposit and dates in a signed contract.</p></div></div></section>

      <section className="estate-section estate-container estate-faq"><div><p className="estate-kicker">// &nbsp;08 Good to know</p><h2>A few answers.</h2><Link to="/about" className="estate-link">About Smart Rent <ArrowRight /></Link></div><div>{faqs.map((faq) => <details key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div></section>

      <footer className="estate-footer"><div className="estate-container"><Link to="/" aria-label="Smart Rent home"><Brand light /></Link><p>Connecting landlords and tenants across Rwanda.</p><nav aria-label="Footer navigation"><Link to="/explore">Explore</Link><Link to="/how-it-works">How it works</Link><Link to="/about">About us</Link></nav><small>© {new Date().getFullYear()} Smart Rent</small></div></footer>
    </div>
  );
}