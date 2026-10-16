import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, ImageOff, MapPin } from "lucide-react";
import { formatPrice, type Listing } from "@/lib/listings";

export function PropertyCard({ listing }: { listing: Listing }) {
  const cover = listing.imageUrls[0];
  return (
    <Link to="/properties/$propertyId" params={{ propertyId: listing.id }} className="property-card">
      <div className="property-photo">
        {cover ? <img src={cover} alt={listing.title} loading="lazy" /> : <div className="photo-empty"><ImageOff /></div>}
        <span className="type-tag">{listing.property_type}</span>
      </div>
      <div className="property-body">
        <div className="property-location"><MapPin size={13} />{[listing.neighbourhood, listing.district].filter(Boolean).join(", ")}</div>
        <h3 className="property-title">{listing.title}</h3>
        <div className="property-foot">
          <p className="price"><strong>{formatPrice(listing.price)} RWF</strong><span>/ month</span></p>
          <div className="property-meta"><span><BedDouble size={15} />{listing.bedrooms}</span><span><Bath size={15} />{listing.bathrooms}</span></div>
        </div>
      </div>
    </Link>
  );
}

export function CardSkeletons({ count = 3 }: { count?: number }) {
  return <>{Array.from({ length: count }, (_, i) => <div className="property-card skeleton" key={i}><div className="property-photo" /><div className="property-body"><span /><span /></div></div>)}</>;
}

export function EmptyState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return <div className="empty-state"><h2>{title}</h2><p>{copy}</p>{action}</div>;
}
