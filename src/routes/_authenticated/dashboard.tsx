import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, ImageOff, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/smart-rent/layout";
import { EmptyState } from "@/components/smart-rent/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BUCKET, fetchListings, formatPrice, type Listing } from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My listings | Smart Rent" },
      { name: "description", content: "Manage the homes you rent out on Smart Rent." },
      { property: "og:title", content: "My listings | Smart Rent" },
      { property: "og:description", content: "Manage your rental listings on Smart Rent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const listings = useQuery({ queryKey: ["listings", "mine", uid], queryFn: () => fetchListings({ ownerId: uid }), enabled: !!uid && role === "landlord" });

  const toggle = useMutation({
    mutationFn: async (l: Listing) => {
      const { error } = await supabase.from("properties").update({ available: !l.available }).eq("id", l.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
    onError: () => toast.error("Couldn't update the listing."),
  });

  const remove = useMutation({
    mutationFn: async (l: Listing) => {
      const { error } = await supabase.from("properties").delete().eq("id", l.id);
      if (error) throw error;
      if (l.images.length) await supabase.storage.from(BUCKET).remove(l.images);
    },
    onSuccess: () => { toast.success("Listing deleted"); qc.invalidateQueries({ queryKey: ["listings"] }); },
    onError: () => toast.error("Couldn't delete the listing."),
  });

  const rows = listings.data;
  if (role !== "landlord") {
    return <PageShell><section className="section"><EmptyState title="Landlord accounts only" copy="Tenant accounts can browse homes and message landlords. Your conversations are in Messages." action={<Link to="/messages" className="button button-primary">Open messages</Link>} /></section></PageShell>;
  }
  return (
    <PageShell>
      <div className="page-head page-head-row">
        <div>
          <p className="eyebrow">Landlord</p>
          <h1>My listings</h1>
          <p className="muted">{rows ? `${rows.length} ${rows.length === 1 ? "home" : "homes"} listed` : "Loading your homes…"}</p>
        </div>
        <div className="head-actions">
          <Link to="/messages" className="button button-ghost"><MessageCircle size={17} />Messages</Link>
          <Link to="/account" className="button button-quiet">My account</Link>
          <Link to="/landlord" className="button button-primary"><Plus size={17} />New listing</Link>
        </div>
      </div>
      <section className="section section-tight">
        {listings.isError ? <EmptyState title="Couldn't load your listings" copy="Please try again in a moment." />
          : rows && rows.length === 0 ? <EmptyState title="You haven't listed a home yet" copy="Add photos, a price and the essentials. Tenants can message you as soon as it's live." action={<Link to="/landlord" className="button button-primary"><Plus size={17} />List a property</Link>} />
          : !rows ? <div className="manage-list"><div className="manage-row skeleton-block" /><div className="manage-row skeleton-block" /></div>
          : <div className="manage-list">
            {rows.map((l) => (
              <article className="manage-row" key={l.id}>
                <div className="manage-photo">{l.imageUrls[0] ? <img src={l.imageUrls[0]} alt="" /> : <div className="photo-empty"><ImageOff /></div>}</div>
                <div className="manage-info">
                  <span className={l.available ? "status status-live" : "status status-off"}>{l.available ? "Available" : "Rented"}</span>
                  <h2>{l.title}</h2>
                  <p className="muted">{[l.neighbourhood, l.district].filter(Boolean).join(", ")} · {l.property_type} · {l.bedrooms} bed</p>
                  <p className="price"><strong>{formatPrice(l.price)} RWF</strong><span>/ month</span></p>
                </div>
                <div className="manage-actions">
                  <label className="switch-toggle">
                    <input type="checkbox" checked={l.available} onChange={() => toggle.mutate(l)} disabled={toggle.isPending} />
                    <span>{l.available ? "Listed" : "Hidden"}</span>
                  </label>
                  <Link to="/properties/$propertyId" params={{ propertyId: l.id }} className="icon-button" aria-label="View listing"><Eye size={17} /></Link>
                  <Link to="/landlord" search={{ edit: l.id }} className="icon-button" aria-label="Edit listing"><Pencil size={17} /></Link>
                  <button className="icon-button danger" aria-label="Delete listing" disabled={remove.isPending} onClick={() => { if (window.confirm(`Delete “${l.title}”? This can't be undone.`)) remove.mutate(l); }}><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
          </div>}
      </section>
    </PageShell>
  );
}
