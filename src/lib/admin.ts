import { supabase } from "@/integrations/supabase/client";
import { BUCKET, signPaths } from "@/lib/listings";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const fmtDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const fmtTime = (iso: string | null | undefined) => (iso ? timeFmt.format(new Date(iso)) : "—");

export function ago(iso: string | null | undefined) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : fmtDate(iso);
}

async function count(table: "properties" | "conversations" | "messages", f?: (q: any) => any) {
  let q: any = supabase.from(table).select("id", { count: "exact", head: true });
  if (f) q = f(q);
  const { count: n, error } = await q;
  if (error) throw error;
  return (n as number | null) ?? 0;
}

export async function fetchAdminStats() {
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const [listings, live, conversations, messages, messagesWeek, listingsWeek] = await Promise.all([
    count("properties"),
    count("properties", (q) => q.eq("available", true)),
    count("conversations"),
    count("messages"),
    count("messages", (q) => q.gte("created_at", weekAgo)),
    count("properties", (q) => q.gte("created_at", weekAgo)),
  ]);
  return { listings, live, hidden: listings - live, conversations, messages, messagesWeek, listingsWeek };
}

export type AdminListing = Awaited<ReturnType<typeof fetchAdminListings>>[number];

export async function fetchAdminListings(limit?: number) {
  let q = supabase.from("properties").select("id, title, district, neighbourhood, property_type, price, bedrooms, available, created_at, images, owner_id, owner:profiles(full_name)").order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  const map = await signPaths(rows.flatMap((r) => r.images.slice(0, 1)));
  return rows.map((r) => ({ ...r, cover: r.images[0] ? map.get(r.images[0]) ?? null : null }));
}

export async function deleteListingAsAdmin(l: { id: string; images: string[] }) {
  const { error } = await supabase.from("properties").delete().eq("id", l.id);
  if (error) throw error;
  if (l.images.length) await supabase.storage.from(BUCKET).remove(l.images);
}

export type AdminConversation = Awaited<ReturnType<typeof fetchAdminConversations>>[number];

export async function fetchAdminConversations(limit?: number) {
  let q = supabase
    .from("conversations")
    .select("id, tenant_id, landlord_id, last_message_at, created_at, property:properties(id, title, price, district), tenant:profiles!conversations_tenant_id_fkey(full_name), landlord:profiles!conversations_landlord_id_fkey(full_name), messages(count)")
    .order("last_message_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((c) => ({ ...c, messageCount: (c.messages as unknown as { count: number }[])[0]?.count ?? 0 }));
}

export async function fetchAdminThread(conversationId: string) {
  const { data, error } = await supabase.from("messages").select("id, body, sender_id, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
