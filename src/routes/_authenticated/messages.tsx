import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/smart-rent/layout";
import { EmptyState } from "@/components/smart-rent/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (s: Record<string, unknown>): { c?: string | undefined } => ({ c: typeof s["c"] === "string" ? s["c"] : undefined }),
  head: () => ({
    meta: [
      { title: "Messages | Smart Rent" },
      { name: "description", content: "Your conversations with landlords and tenants on Smart Rent." },
      { property: "og:title", content: "Messages | Smart Rent" },
      { property: "og:description", content: "Talk directly with landlords and tenants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

async function fetchConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, tenant_id, landlord_id, last_message_at, property:properties(id, title, price, district, neighbourhood), tenant:profiles!conversations_tenant_id_fkey(full_name), landlord:profiles!conversations_landlord_id_fkey(full_name)")
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase.from("messages").select("id, body, sender_id, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
function when(iso: string) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? timeFmt.format(d) : dayFmt.format(d);
}

function MessagesPage() {
  const { c } = Route.useSearch();
  const { user, role } = useAuth();
  const navigate = useNavigate({ from: "/messages" });
  const qc = useQueryClient();
  const uid = user?.id;
  const convs = useQuery({ queryKey: ["conversations", uid], queryFn: fetchConversations, enabled: !!uid });
  const msgs = useQuery({ queryKey: ["messages", c], queryFn: () => fetchMessages(c ?? ""), enabled: !!c && !!uid });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`inbox-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const conv = (payload.new as { conversation_id?: string }).conversation_id;
        if (conv) qc.invalidateQueries({ queryKey: ["messages", conv] });
        qc.invalidateQueries({ queryKey: ["conversations", uid] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [uid, qc]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.data?.length, c]);

  const list = convs.data ?? [];
  const active = list.find((x) => x.id === c);
  const otherName = (x: (typeof list)[number]) => (x.tenant_id === uid ? x.landlord?.full_name : x.tenant?.full_name) || (x.tenant_id === uid ? "Landlord" : "Tenant");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !c || !uid) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ conversation_id: c, sender_id: uid, body });
    setSending(false);
    if (error) { toast.error("Message not sent. Please try again."); return; }
    setDraft("");
    qc.invalidateQueries({ queryKey: ["messages", c] });
    qc.invalidateQueries({ queryKey: ["conversations", uid] });
  }

  return (
    <PageShell footer={false}>
      <div className={c ? "inbox has-active" : "inbox"}>
        <aside className="inbox-list">
          <h1>Messages</h1>
          {convs.isError ? <p className="muted">Couldn't load conversations.</p>
            : convs.isLoading ? <div className="skeleton-block inbox-skeleton" />
            : list.length === 0 ? <div className="inbox-empty"><p>No conversations yet.</p>{role === "landlord" ? <p className="muted">When tenants message you about your homes, their messages appear here.</p> : <><p className="muted">Open a home you like and choose “Message landlord”.</p><Link to="/explore" className="button button-primary button-small">Browse homes</Link></>}</div>
            : list.map((x) => (
              <button key={x.id} className={x.id === c ? "inbox-item active" : "inbox-item"} onClick={() => navigate({ to: ".", search: { c: x.id } })}>
                <div className="avatar">{otherName(x).slice(0, 1).toUpperCase()}</div>
                <div className="inbox-item-text">
                  <div className="inbox-item-top"><strong>{otherName(x)}</strong><time>{when(x.last_message_at)}</time></div>
                  <span>{x.property?.title ?? "Listing removed"}</span>
                  <small>{x.tenant_id === uid ? "You're renting" : "Your listing"}</small>
                </div>
              </button>
            ))}
        </aside>
        <section className="chat">
          {!c ? <EmptyState title="Select a conversation" copy="Your messages with landlords and tenants appear here." />
            : !active && !convs.isLoading ? <EmptyState title="Conversation not found" copy="It may have been removed with its listing." />
            : <>
              <header className="chat-head">
                <button className="icon-button chat-back" aria-label="Back to conversations" onClick={() => navigate({ to: ".", search: {} })}><ChevronLeft size={18} /></button>
                <div>
                  <strong>{active ? otherName(active) : ""}</strong>
                  {active?.property && <Link to="/properties/$propertyId" params={{ propertyId: active.property.id }} className="chat-listing">{active.property.title} · {formatPrice(active.property.price)} RWF / month</Link>}
                </div>
              </header>
              <div className="chat-body">
                {msgs.data?.length === 0 && <p className="chat-hint">Say hello and ask about the home — viewing times, deposit, move-in date.</p>}
                {msgs.data?.map((m) => (
                  <div key={m.id} className={m.sender_id === uid ? "bubble mine" : "bubble"}>
                    <p>{m.body}</p><time>{when(m.created_at)}</time>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form className="chat-form" onSubmit={send}>
                <textarea rows={1} value={draft} maxLength={4000} placeholder="Write a message…" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} aria-label="Message" />
                <button className="button button-primary" disabled={sending || !draft.trim()} aria-label="Send"><Send size={17} /></button>
              </form>
            </>}
        </section>
      </div>
    </PageShell>
  );
}
