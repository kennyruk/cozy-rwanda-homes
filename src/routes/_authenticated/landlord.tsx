import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/smart-rent/layout";
import { EmptyState } from "@/components/smart-rent/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AMENITIES, BUCKET, DISTRICTS, fetchListing, MAX_PHOTOS, PROPERTY_TYPES, type Photo } from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/landlord")({
  validateSearch: (s: Record<string, unknown>): { edit?: string | undefined } => ({ edit: typeof s["edit"] === "string" ? s["edit"] : undefined }),
  head: () => ({
    meta: [
      { title: "List a property | Smart Rent" },
      { name: "description", content: "List your rental home on Smart Rent for free and hear from tenants directly." },
      { property: "og:title", content: "List a property | Smart Rent" },
      { property: "og:description", content: "List your rental home in Rwanda for free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandlordPage,
});

type NewPhoto = { file: File; preview: string };
type Form = { title: string; property_type: string; district: string; neighbourhood: string; price: string; bedrooms: string; bathrooms: string; description: string; amenities: string[]; available: boolean };
const EMPTY: Form = { title: "", property_type: "Apartment", district: "Gasabo", neighbourhood: "", price: "", bedrooms: "1", bathrooms: "1", description: "", amenities: [], available: true };

function LandlordPage() {
  const { edit } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [kept, setKept] = useState<Photo[]>([]);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  const [busy, setBusy] = useState(false);

  const existing = useQuery({ queryKey: ["listing", edit], queryFn: () => fetchListing(edit ?? ""), enabled: !!edit });
  useEffect(() => {
    const l = existing.data;
    if (!l) return;
    setForm({ title: l.title, property_type: l.property_type, district: l.district, neighbourhood: l.neighbourhood, price: String(l.price), bedrooms: String(l.bedrooms), bathrooms: String(l.bathrooms), description: l.description, amenities: l.amenities, available: l.available });
    setKept(l.photos);
  }, [existing.data]);
  useEffect(() => () => added.forEach((p) => URL.revokeObjectURL(p.preview)), [added]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const total = kept.length + added.length;

  function pick(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - total;
    const ok = Array.from(files).filter((f) => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024);
    if (ok.length < files.length) toast.error("Some files were skipped. Use images under 8 MB.");
    setAdded((a) => [...a, ...ok.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) { toast.error("Enter a monthly price in RWF."); return; }
    if (total === 0) { toast.error("Add at least one photo."); return; }
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const p of added) {
        const ext = (p.file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, p.file, { contentType: p.file.type });
        if (error) throw error;
        uploaded.push(path);
      }
      const row = {
        title: form.title.trim(), property_type: form.property_type, district: form.district, neighbourhood: form.neighbourhood.trim(),
        price: Math.round(price), bedrooms: Number(form.bedrooms) || 0, bathrooms: Number(form.bathrooms) || 0,
        description: form.description.trim(), amenities: form.amenities, available: form.available,
        images: [...kept.map((k) => k.path), ...uploaded],
      };
      let id = edit;
      if (edit) {
        const { error } = await supabase.from("properties").update(row).eq("id", edit);
        if (error) throw error;
        const removed = (existing.data?.images ?? []).filter((p) => !row.images.includes(p));
        if (removed.length) await supabase.storage.from(BUCKET).remove(removed);
      } else {
        const { data, error } = await supabase.from("properties").insert({ ...row, owner_id: user.id }).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      await qc.invalidateQueries({ queryKey: ["listings"] });
      await qc.invalidateQueries({ queryKey: ["listing", id] });
      toast.success(edit ? "Listing updated" : "Your home is now listed");
      if (id) navigate({ to: "/properties/$propertyId", params: { propertyId: id } });
    } catch {
      toast.error("Couldn't save the listing. Please check the details and try again.");
      setBusy(false);
    }
  }

  if (edit && existing.isLoading) return <PageShell><div className="form-shell"><div className="skeleton-block form-skeleton" /></div></PageShell>;
  if (edit && (!existing.data || existing.data.owner_id !== user?.id)) {
    return <PageShell><div className="form-shell"><EmptyState title="Listing not found" copy="You can only edit homes you listed." action={<Link to="/dashboard" className="button button-primary">My listings</Link>} /></div></PageShell>;
  }

  return (
    <PageShell>
      <div className="form-shell">
        <Link to="/dashboard" className="back-link"><ChevronLeft size={18} />My listings</Link>
        <h1>{edit ? "Edit listing" : "List a property"}</h1>
        <p className="muted">{edit ? "Update the details tenants see." : "Free to list. Tenants will message you directly through Smart Rent."}</p>
        <form className="listing-form" onSubmit={submit}>
          <fieldset>
            <legend>The basics</legend>
            <label className="field">Title<input required minLength={3} maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Two-bedroom apartment near Kimironko market" /></label>
            <div className="field-row">
              <label className="field">Type<select value={form.property_type} onChange={(e) => set("property_type", e.target.value)}>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="field">Monthly rent (RWF)<input required type="number" min={1} step={1000} inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="350000" /></label>
            </div>
            <div className="field-row">
              <label className="field">District<select value={form.district} onChange={(e) => set("district", e.target.value)}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></label>
              <label className="field">Neighbourhood<input value={form.neighbourhood} maxLength={80} onChange={(e) => set("neighbourhood", e.target.value)} placeholder="e.g. Kimironko" /></label>
            </div>
            <div className="field-row">
              <label className="field">Bedrooms<input type="number" min={0} max={20} value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} /></label>
              <label className="field">Bathrooms<input type="number" min={0} max={20} value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Photos <small>{total}/{MAX_PHOTOS}</small></legend>
            <div className="photo-grid">
              {kept.map((p) => <div className="photo-tile" key={p.path}><img src={p.url} alt="" /><button type="button" aria-label="Remove photo" onClick={() => setKept((k) => k.filter((x) => x.path !== p.path))}><X size={15} /></button></div>)}
              {added.map((p) => <div className="photo-tile" key={p.preview}><img src={p.preview} alt="" /><button type="button" aria-label="Remove photo" onClick={() => setAdded((a) => a.filter((x) => x.preview !== p.preview))}><X size={15} /></button></div>)}
              {total < MAX_PHOTOS && <label className="photo-add"><ImagePlus size={22} /><span>Add photos</span><input type="file" accept="image/*" multiple onChange={(e) => { pick(e.target.files); e.target.value = ""; }} /></label>}
            </div>
          </fieldset>

          <fieldset>
            <legend>Details</legend>
            <label className="field">Description<textarea rows={5} maxLength={3000} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What makes this home good to live in? Mention water, power, transport, rules…" /></label>
            <div className="check-grid">
              {AMENITIES.map((a) => <label key={a} className="check"><input type="checkbox" checked={form.amenities.includes(a)} onChange={(e) => set("amenities", e.target.checked ? [...form.amenities, a] : form.amenities.filter((x) => x !== a))} />{a}</label>)}
            </div>
            <label className="check"><input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} />Show this home to tenants now</label>
          </fieldset>

          <div className="form-actions">
            <Link to="/dashboard" className="button button-quiet">Cancel</Link>
            <button className="button button-primary" disabled={busy}>{busy ? "Saving…" : edit ? "Save changes" : "Publish listing"}</button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
