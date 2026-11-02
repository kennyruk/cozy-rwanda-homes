import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ago, fetchAdminConversations, fetchAdminThread, fmtTime } from "@/lib/admin";
import { formatPrice } from "@/lib/listings";

type MsgSearch = { c?: string | undefined; user?: string | undefined };

export const Route = createFileRoute("/_authenticated/admin/messages")({
  validateSearch: (s: Record<string, unknown>): MsgSearch => ({
    c: typeof s["c"] === "string" ? s["c"] : undefined,
    user: typeof s["user"] === "string" ? s["user"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All messages | Smart Rent admin" },
      { name: "description", content: "Read every conversation between tenants and landlords on Smart Rent." },
      { property: "og:title", content: "All messages | Smart Rent admin" },
      { property: "og:description", content: "Smart Rent conversations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMessages,
});

function AdminMessages() {
  const { c, user } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/messages" });
  const qc = useQueryClient();
  const convs = useQuery({ queryKey: ["admin", "conversations", "all"], queryFn: () => fetchAdminConversations() });
  const thread = useQuery({ queryKey: ["admin", "thread", c], queryFn: () => fetchAdminThread(c ?? ""), enabled: !!c });
  const [q, setQ] = useState("");

  useEffect(() => {
    const channel = supabase
      .channel("admin-all-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => { qc.invalidateQueries({ queryKey: ["admin"] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const delMsg = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("messages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Message removed"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: () => toast.error("Couldn't remove the message."),
  });
  const delConv = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("conversations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Conversation deleted"); navigate({ search: (s) => ({ ...s, c: undefined }) }); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: () => toast.error("Couldn't delete the conversation."),
  });

  const all = convs.data ?? [];
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((x) =>
      (!user || x.tenant_id === user || x.landlord_id === user) &&
      (!term || [x.tenant?.full_name, x.landlord?.full_name, x.property?.title].some((v) => (v ?? "").toLowerCase().includes(term))));
  }, [all, q, user]);
  const active = all.find((x) => x.id === c);
  const userName = user ? all.find((x) => x.tenant_id === user)?.tenant?.full_name ?? all.find((x) => x.landlord_id === user)?.landlord?.full_name : undefined;

  return (
    <>
      <header className="adm-head">
        <div><p className="adm-kicker">Monitor</p><h1>All messages</h1></div>
        <p className="adm-stamp">{convs.data ? `${rows.length} conversation${rows.length === 1 ? "" : "s"}` : "Loading…"} · read-only</p>
      </header>

      <div className={c ? "adm-inbox has-active" : "adm-inbox"}>
        <aside className="adm-inbox-list">
          <label className="adm-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people or home" aria-label="Search conversations" /></label>
          {user && <Link to="/admin/messages" search={{}} className="adm-chip-filter">Person: {userName || "selected"} <X size={13} /></Link>}
          {convs.isError ? <p className="adm-empty">Couldn't load conversations.</p>
            : !convs.data ? <div className="adm-skel" />
            : rows.length === 0 ? <p className="adm-empty">No conversations{user || q ? " match" : " yet"}.</p>
            : rows.map((x) => (
              <button key={x.id} type="button" className={x.id === c ? "adm-conv active" : "adm-conv"} onClick={() => navigate({ search: (s) => ({ ...s, c: x.id }) })}>
                <div className="adm-conv-top"><strong>{x.tenant?.full_name || "Tenant"} → {x.landlord?.full_name || "Landlord"}</strong><time>{ago(x.last_message_at)}</time></div>
                <span>{x.property?.title ?? "Listing removed"}</span>
                <small>{x.messageCount} message{x.messageCount === 1 ? "" : "s"}</small>
              </button>
            ))}
        </aside>

        <section className="adm-thread">
          {!c ? <div className="adm-thread-empty"><p>Pick a conversation to read it.</p><small>Admins can read and remove messages but don't take part in chats.</small></div>
            : !active && convs.data ? <div className="adm-thread-empty"><p>Conversation not found.</p></div>
            : <>
              <header className="adm-thread-head">
                <button type="button" className="adm-icon adm-back" aria-label="Back to conversations" onClick={() => navigate({ search: (s) => ({ ...s, c: undefined }) })}><ChevronLeft size={16} /></button>
                <div>
                  <strong>{active?.tenant?.full_name || "Tenant"} <span className="adm-role">tenant</span> ↔ {active?.landlord?.full_name || "Landlord"} <span className="adm-role">landlord</span></strong>
                  {active?.property && <Link to="/properties/$propertyId" params={{ propertyId: active.property.id }} className="adm-link">{active.property.title} · {formatPrice(active.property.price)} RWF / month</Link>}
                </div>
                <button type="button" className="button button-small adm-danger" disabled={delConv.isPending} onClick={() => { if (active && window.confirm("Delete this whole conversation for both people? This can't be undone.")) delConv.mutate(active.id); }}><Trash2 size={14} />Delete chat</button>
              </header>
              <ol className="adm-log">
                {thread.isError ? <li className="adm-empty">Couldn't load messages.</li>
                  : !thread.data ? <li><div className="adm-skel" /></li>
                  : thread.data.length === 0 ? <li className="adm-empty">No messages in this conversation.</li>
                  : thread.data.map((m) => {
                    const fromTenant = m.sender_id === active?.tenant_id;
                    return (
                      <li key={m.id} className={fromTenant ? "from-tenant" : "from-landlord"}>
                        <div className="adm-log-meta">
                          <strong>{fromTenant ? active?.tenant?.full_name || "Tenant" : active?.landlord?.full_name || "Landlord"}</strong>
                          <span className="adm-role">{fromTenant ? "tenant" : "landlord"}</span>
                          <time>{fmtTime(m.created_at)}</time>
                          <button type="button" className="adm-log-del" aria-label="Remove message" title="Remove message" disabled={delMsg.isPending} onClick={() => { if (window.confirm("Remove this message for both people?")) delMsg.mutate(m.id); }}><Trash2 size={13} /></button>
                        </div>
                        <p>{m.body}</p>
                      </li>
                    );
                  })}
              </ol>
            </>}
        </section>
      </div>
    </>
  );
}
