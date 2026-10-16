import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Listing = Tables<"properties"> & { owner: { full_name: string } | null; imageUrls: string[] };

export const PROPERTY_TYPES = ["Apartment", "House", "Room"] as const;
export const DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge", "Musanze", "Huye", "Rubavu", "Muhanga", "Rwamagana", "Nyagatare", "Rusizi"];
export const AMENITIES = ["Parking", "Furnished", "Wi-Fi", "Water tank", "Security", "Garden", "Backup power", "Hot water"];
export const BUCKET = "property-images";

export const formatPrice = (price: number) => new Intl.NumberFormat("en-RW").format(price);

const SELECT = "*, owner:profiles(full_name)";

async function withImages(rows: (Tables<"properties"> & { owner: { full_name: string } | null })[]): Promise<Listing[]> {
  const paths = Array.from(new Set(rows.flatMap((r) => r.images)));
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24);
    data?.forEach((d) => { if (d.path && d.signedUrl) map.set(d.path, d.signedUrl); });
  }
  return rows.map((r) => ({ ...r, imageUrls: r.images.map((p) => map.get(p)).filter((u): u is string => !!u) }));
}

export type ListingFilters = { location?: string | undefined; type?: string | undefined; maxPrice?: number | undefined; minBeds?: number | undefined; ownerId?: string | undefined; limit?: number | undefined };

export async function fetchListings(f: ListingFilters = {}): Promise<Listing[]> {
  let q = supabase.from("properties").select(SELECT).order("created_at", { ascending: false });
  if (f.ownerId) q = q.eq("owner_id", f.ownerId);
  else q = q.eq("available", true);
  if (f.type) q = q.eq("property_type", f.type);
  if (f.maxPrice) q = q.lte("price", f.maxPrice);
  if (f.minBeds) q = q.gte("bedrooms", f.minBeds);
  if (f.location) {
    const term = f.location.replace(/[%,()]/g, " ").trim();
    if (term) q = q.or(`district.ilike.%${term}%,neighbourhood.ilike.%${term}%,title.ilike.%${term}%`);
  }
  if (f.limit) q = q.limit(f.limit);
  const { data, error } = await q;
  if (error) throw error;
  return withImages(data ?? []);
}

export async function fetchListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase.from("properties").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [listing] = await withImages([data]);
  return listing ?? null;
}

/** Find or create the tenant's conversation with the landlord of a listing. */
export async function openConversation(listing: Pick<Listing, "id" | "owner_id">, tenantId: string): Promise<string> {
  const existing = await supabase.from("conversations").select("id").eq("property_id", listing.id).eq("tenant_id", tenantId).maybeSingle();
  if (existing.data) return existing.data.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ property_id: listing.id, tenant_id: tenantId, landlord_id: listing.owner_id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
