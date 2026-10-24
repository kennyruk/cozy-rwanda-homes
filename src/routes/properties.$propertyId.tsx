import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bath, BedDouble, Check, ChevronLeft, ImageOff, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "../components/smart-rent/layout";
import { EmptyState } from "../components/smart-rent/ui";
import { useAuth } from "../lib/auth";
import { fetchListing, formatPrice, openConversation } from "../lib/listings";

export const Route = createFileRoute("/properties/$propertyId")({
  head: () => ({
    meta: [
      { title: "Rental home | Smart Rent" },
      { name: "description", content: "See photos, price and details of this rental home and message the landlord directly." },
      { property: "og:title", content: "Rental home | Smart Rent" },
      { property: "og:description", content: "See this rental home and message the landlord on Smart Rent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { propertyId } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["listing", propertyId], queryFn: () => fetchListing(propertyId) });
  const listing = q.data;

  async function message() {
    if (!listing) return;
    if (!user) { navigate({ to: "/auth", search: { as: "tenant", redirect: `/properties/${listing.id}` } }); return; }
    setBusy(true);
    try {
      const id = await openConversation(listing, user.id);
      navigate({ to: "/messages", search: { c: id } });
    } catch {
      toast.error("Couldn't start the conversation. Please try again.");
      setBusy(false);
    }
  }

  if (q.isLoading) return <PageShell><div className="detail-shell"><div className="gallery-main skeleton-block" /></div></PageShell>;
  if (!listing) return <PageShell><div className="detail-shell"><EmptyState title="Home not found" copy="This listing may have been removed." action={<Link to="/explore" className="button button-primary">Browse homes</Link>} /></div></PageShell>;

  const isOwner = user?.id === listing.owner_id;
  const images = listing.imageUrls;
  return (
    <PageShell>
      <div className="detail-shell">
        <Link to="/explore" className="back-link"><ChevronLeft size={18} />All homes</Link>
        <div className="gallery">
          <div className="gallery-main">{images[active] ? <img src={images[active]} alt={listing.title} /> : <div className="photo-empty"><ImageOff /></div>}</div>
          {images.length > 1 && <div className="thumbs">{images.map((src, i) => <button key={src} className={i === active ? "active" : ""} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}><img src={src} alt="" /></button>)}</div>}
        </div>
        <div className="detail-grid">
          <article className="detail-main">
            <div className="property-location"><MapPin size={15} />{[listing.neighbourhood, listing.district].filter(Boolean).join(", ")}</div>
            <h1>{listing.title}</h1>
            <div className="detail-facts"><span>{listing.property_type}</span><span><BedDouble size={17} />{listing.bedrooms} bedrooms</span><span><Bath size={17} />{listing.bathrooms} bathrooms</span></div>
            {listing.description && <section className="detail-section"><h2>About this home</h2><p>{listing.description}</p></section>}
            {listing.amenities.length > 0 && <section className="detail-section"><h2>Amenities</h2><div className="amenities">{listing.amenities.map((a) => <span key={a}><Check size={16} />{a}</span>)}</div></section>}
          </article>
          <aside className="rent-card">
            <p className="price"><strong>{formatPrice(listing.price)} RWF</strong><span>/ month</span></p>
            <div className="landlord-mini"><div className="avatar">{(listing.owner?.full_name || "L").slice(0, 1).toUpperCase()}</div><div><small>Listed by</small><strong>{listing.owner?.full_name || "Landlord"}</strong></div></div>
            {!listing.available && <p className="notice">This home is currently marked as rented.</p>}
            {isOwner
              ? <Link to="/dashboard" className="button button-ghost">Manage your listing</Link>
              : role === "landlord"
                ? <p className="notice">You're signed in as a landlord. Use a tenant account to message landlords.</p>
                : <button className="button button-primary" onClick={message} disabled={busy}><MessageCircle size={18} />{user ? "Message landlord" : "Sign in to message"}</button>}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
