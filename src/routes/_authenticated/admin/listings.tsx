import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ImageOff, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteListingAsAdmin, fetchAdminListings, fmtDate, type AdminListing } from "@/lib/admin";
import { formatPrice } from "@/lib/listings";

type ListingSearch = { owner?: string | undefined; status?: "live" | "hidden" | undefined };

export const Route = createFileRoute("/_authenticated/admin/listings")({
  validateSearch: (s: Record<string, unknown>): ListingSearch => ({
    owner: typeof s["owner"] === "string" ? s["owner"] : undefined,
    status: s["status"] === "live" || s["status"] === "hidden" ? s["status"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Listings | Smart Rent admin" },
      { name: "description", content: "Every home listed on Smart Rent, with tools to hide or remove them." },
      { property: "og:title", content: "Listings | Smart Rent admin" },
      { property: "og:description", content: "Manage Smart Rent listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ListingsPage,
});

function ListingsPage() {
  const { owner, status } = Route.useSearch();
  const qc = useQueryClient();
  const listings = useQuery({ queryKey: ["admin", "listings", "all"], queryFn: () => fetchAdminListings() });
  const [q, setQ] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const toggle = useMutation({
    mutationFn: async (l: AdminListing) => {
      const { error } = await supabase.from("properties").update({ available: !l.available }).eq("id", l.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error("Couldn't update the listing."),
  });
  const remove = useMutation({
    mutationFn: deleteListingAsAdmin,
    onSuccess: () => { toast.success("Listing deleted"); refresh(); qc.invalidateQueries({ queryKey: ["listings"] }); },
    onError: () => toast.error("Couldn't delete the listing."),
  });

  const all = listings.data ?? [];
  const ownerName = owner ? all.find((l) => l.owner_id === owner)?.owner?.full_name : undefined;
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((l) =>
      (!owner || l.owner_id === owner) &&
      (!status || (status === "live") === l.available) &&
      (!term || [l.title, l.district, l.neighbourhood, l.owner?.full_name ?? ""].some((v) => v.toLowerCase().includes(term))));
  }, [all, q, owner, status]);

  return (
    <>
      <header className="adm-head">
        <div><p className="adm-kicker">Manage</p><h1>Listings</h1></div>
        <p className="adm-stamp">{listings.data ? `${rows.length} of ${all.length} homes` : "Loading…"}</p>
      </header>

      <div className="adm-toolbar">
        <label className="adm-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, area or landlord" aria-label="Search listings" /></label>
        <div className="adm-chips">
          <Link to="/admin/listings" search={{ owner }} className={!status ? "active" : ""}>All</Link>
          <Link to="/admin/listings" search={{ owner, status: "live" }} className={status === "live" ? "active" : ""}>Live</Link>
          <Link to="/admin/listings" search={{ owner, status: "hidden" }} className={status === "hidden" ? "active" : ""}>Hidden</Link>
          {owner && <Link to="/admin/listings" search={{ status }} className="adm-chip-filter">Landlord: {ownerName || "selected"} <X size={13} /></Link>}
        </div>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Home</th><th>Landlord</th><th className="num">Rent / month</th><th>Listed</th><th>Status</th><th className="right">Actions</th></tr></thead>
          <tbody>
            {listings.isError ? <tr><td colSpan={6} className="adm-empty">Couldn't load listings.</td></tr>
              : !listings.data ? <tr><td colSpan={6}><div className="adm-skel" /></td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="adm-empty">No listings match.</td></tr>
              : rows.map((l) => (
                <tr key={l.id} className={l.available ? "" : "is-off"}>
                  <td>
                    <div className="adm-home">
                      <div className="adm-thumb">{l.cover ? <img src={l.cover} alt="" /> : <ImageOff size={16} />}</div>
                      <div><strong>{l.title}</strong><small>{[l.neighbourhood, l.district].filter(Boolean).join(", ")} · {l.property_type} · {l.bedrooms} bed</small></div>
                    </div>
                  </td>
                  <td><Link to="/admin/listings" search={{ owner: l.owner_id, status }} className="adm-link" title="Only this landlord's homes">{l.owner?.full_name || "Landlord"}</Link></td>
                  <td className="num adm-num">{formatPrice(l.price)} RWF</td>
                  <td>{fmtDate(l.created_at)}</td>
                  <td><span className={l.available ? "adm-dot live" : "adm-dot off"}>{l.available ? "Live" : "Hidden"}</span></td>
                  <td className="right">
                    <div className="adm-actions">
                      <Link to="/properties/$propertyId" params={{ propertyId: l.id }} className="adm-icon" title="Open listing" aria-label="Open listing"><Eye size={15} /></Link>
                      <button className="adm-icon" title={l.available ? "Hide from site" : "Show on site"} aria-label={l.available ? "Hide from site" : "Show on site"} disabled={toggle.isPending} onClick={() => toggle.mutate(l)}>{l.available ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                      <button className="adm-icon danger" title="Delete listing" aria-label="Delete listing" disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete “${l.title}”? Its photos and conversations go too. This can't be undone.`)) remove.mutate(l); }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
