import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageShell } from "../components/smart-rent/layout";
import { PickSelect } from "../components/smart-rent/pickers";
import { CardSkeletons, EmptyState, PropertyCard } from "../components/smart-rent/ui";
import { fetchListings, PROPERTY_TYPES } from "../lib/listings";

const TYPE_ITEMS = [{ value: "", label: "All types" }, ...PROPERTY_TYPES.map((t) => ({ value: t, label: t }))];
const PRICE_ITEMS = [{ value: "", label: "Any price" }, ...[200000, 400000, 700000, 1000000].map((n) => ({ value: String(n), label: `Up to ${n.toLocaleString("en-US")}` }))];
const BED_ITEMS = [{ value: "", label: "Any beds" }, ...[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}+ beds` }))];

type SearchParams = { location?: string | undefined; type?: string | undefined; maxPrice?: number | undefined; beds?: number | undefined };

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
          <PickSelect variant="field" ariaLabel="Property type" value={search.type ?? ""} onChange={(v) => set({ type: v || undefined })} items={TYPE_ITEMS} />
          <PickSelect variant="field" ariaLabel="Maximum price" value={search.maxPrice ? String(search.maxPrice) : ""} onChange={(v) => set({ maxPrice: Number(v) || undefined })} items={PRICE_ITEMS} />
          <PickSelect variant="field" ariaLabel="Bedrooms" value={search.beds ? String(search.beds) : ""} onChange={(v) => set({ beds: Number(v) || undefined })} items={BED_ITEMS} />
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
