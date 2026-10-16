import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageShell } from "../components/smart-rent/layout";
import { CardSkeletons, EmptyState, PropertyCard } from "../components/smart-rent/ui";
import { fetchListings, PROPERTY_TYPES } from "../lib/listings";

type SearchParams = { location?: string; type?: string; maxPrice?: number; beds?: number };

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    location: typeof s["location"] === "string" ? s["location"] : undefined,
    type: typeof s["type"] === "string" && s["type"] ? s["type"] : undefined,
    maxPrice: Number(s["maxPrice"]) > 0 ? Number(s["maxPrice"]) : undefined,
    beds: Number(s["beds"]) > 0 ? Number(s["beds"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore rental homes | Smart Rent" },
      { name: "description", content: "Browse rental homes across Rwanda by location, price, type and bedrooms." },
      { property: "og:title", content: "Explore rental homes | Smart Rent" },
      { property: "og:description", content: "Browse rental homes listed by landlords across Rwanda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const [location, setLocation] = useState(search.location ?? "");
  useEffect(() => setLocation(search.location ?? ""), [search.location]);

  const listings = useQuery({
    queryKey: ["listings", "explore", search],
    queryFn: () => fetchListings({ location: search.location, type: search.type, maxPrice: search.maxPrice, minBeds: search.beds }),
  });
  const set = (patch: Partial<SearchParams>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <PageShell>
      <div className="page-head">
        <h1>Explore homes</h1>
        <form className="filters" onSubmit={(e) => { e.preventDefault(); set({ location: location || undefined }); }}>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search district or neighbourhood" aria-label="Location" />
          <select value={search.type ?? ""} onChange={(e) => set({ type: e.target.value || undefined })} aria-label="Property type">
            <option value="">All types</option>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={search.maxPrice ?? ""} onChange={(e) => set({ maxPrice: Number(e.target.value) || undefined })} aria-label="Maximum price">
            <option value="">Any price</option><option value="200000">Up to 200,000</option><option value="400000">Up to 400,000</option><option value="700000">Up to 700,000</option><option value="1000000">Up to 1,000,000</option>
          </select>
          <select value={search.beds ?? ""} onChange={(e) => set({ beds: Number(e.target.value) || undefined })} aria-label="Bedrooms">
            <option value="">Any beds</option><option value="1">1+ beds</option><option value="2">2+ beds</option><option value="3">3+ beds</option><option value="4">4+ beds</option>
          </select>
          <button className="button button-primary">Search</button>
        </form>
      </div>
      <section className="section section-tight">
        {listings.data && <p className="result-count">{listings.data.length} {listings.data.length === 1 ? "home" : "homes"}{search.location ? ` matching “${search.location}”` : ""}</p>}
        {listings.isError ? <EmptyState title="Couldn't load homes" copy="Please try again in a moment." />
          : listings.data?.length === 0 ? <EmptyState title="No homes match" copy="Try another area or loosen a filter." action={<button className="button button-ghost" onClick={() => navigate({ search: {} })}>Clear filters</button>} />
          : <div className="property-grid">{listings.data ? listings.data.map((l) => <PropertyCard listing={l} key={l.id} />) : <CardSkeletons count={6} />}</div>}
      </section>
    </PageShell>
  );
}
