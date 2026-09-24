import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, CheckCircle2, Heart, MapPin } from "lucide-react";
import { useState } from "react";
import type { Property } from "../../data/properties";
import { formatPrice } from "../../data/properties";

export function PropertyCard({ property, compact = false }: { property: Property; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="property-card">
      <Link to="/properties/$propertyId" params={{ propertyId: property.id }} className="property-photo">
        <img src={property.image} alt={property.title} loading="lazy" width="1200" height="900" />
        <span className={property.available ? "availability" : "availability availability-muted"}>
          {property.available ? "Available now" : "Available soon"}
        </span>
      </Link>
      <button className={saved ? "save-button is-saved" : "save-button"} onClick={() => setSaved(!saved)} aria-label={saved ? "Remove from saved homes" : "Save this home"}>
        <Heart size={19} fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="property-body">
        <div className="property-location"><MapPin size={14} />{property.location}</div>
        <Link to="/properties/$propertyId" params={{ propertyId: property.id }} className="property-title">{property.title}</Link>
        <div className="price"><strong>{formatPrice(property.price)} RWF</strong><span>/ month</span></div>
        {!compact && <div className="property-meta"><span><BedDouble size={16} />{property.beds} beds</span><span><Bath size={16} />{property.baths} baths</span>{property.verified && <span className="verified"><CheckCircle2 size={15} />Verified</span>}</div>}
      </div>
    </article>
  );
}

export function SectionHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>{action}</div>;
}