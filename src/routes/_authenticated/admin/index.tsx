import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";
import { adminListUsers } from "@/lib/admin.functions";
import { ago, fetchAdminConversations, fetchAdminListings, fetchAdminStats, fmtDate } from "@/lib/admin";
import { formatPrice } from "@/lib/listings";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview | Smart Rent" },
      { name: "description", content: "Activity across Smart Rent: people, listings and messages." },
      { property: "og:title", content: "Admin overview | Smart Rent" },
      { property: "og:description", content: "Smart Rent admin overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const listUsers = useServerFn(adminListUsers);
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => listUsers() });
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchAdminStats });
  const listings = useQuery({ queryKey: ["admin", "listings", "recent"], queryFn: () => fetchAdminListings(6) });
  const convs = useQuery({ queryKey: ["admin", "conversations", "recent"], queryFn: () => fetchAdminConversations(6) });

  const u = users.data ?? [];
  const landlords = u.filter((x) => x.role === "landlord").length;
  const tenants = u.filter((x) => x.role === "tenant").length;
  const suspended = u.filter((x) => x.suspended).length;
  const newThisWeek = u.filter((x) => Date.now() - new Date(x.createdAt).getTime() < 7 * 864e5).length;
  const s = stats.data;
  const n = (v: number | undefined) => (v === undefined ? "–" : v.toLocaleString("en-RW"));

  return (
    <>
      <header className="adm-head">
        <div><p className="adm-kicker">Overview</p><h1>Everything on Smart Rent</h1></div>
        <p className="adm-stamp">Updated {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
      </header>

      <section className="adm-stats">
        <Stat label="People" value={users.data ? n(u.length) : "–"} note={users.data ? `+${newThisWeek} this week${suspended ? ` · ${suspended} suspended` : ""}` : ""} to="/admin/users" />
        <Stat label="Landlords" value={users.data ? n(landlords) : "–"} note="List homes" to="/admin/users" search={{ type: "landlord" }} />
        <Stat label="Tenants" value={users.data ? n(tenants) : "–"} note="Message landlords" to="/admin/users" search={{ type: "tenant" }} />
        <Stat label="Listings" value={n(s?.listings)} note={s ? `${s.live} live · ${s.hidden} hidden` : ""} to="/admin/listings" />
        <Stat label="Conversations" value={n(s?.conversations)} note="Tenant ↔ landlord" to="/admin/messages" />
        <Stat label="Messages" value={n(s?.messages)} note={s ? `${s.messagesWeek} in the last 7 days` : ""} to="/admin/messages" />
      </section>

      <div className="adm-grid">
        <section className="adm-panel">
          <div className="adm-panel-head"><h2>Latest conversations</h2><Link to="/admin/messages" search={{}} className="adm-more">All messages <ArrowRight size={14} /></Link></div>
          {convs.isError ? <p className="adm-empty">Couldn't load conversations.</p>
            : !convs.data ? <div className="adm-skel" />
            : convs.data.length === 0 ? <p className="adm-empty">No one has messaged yet.</p>
            : <ul className="adm-rows">{convs.data.map((c) => (
              <li key={c.id}>
                <Link to="/admin/messages" search={{ c: c.id }} className="adm-row-link">
                  <span><strong>{c.tenant?.full_name || "Tenant"}</strong> → {c.landlord?.full_name || "Landlord"}</span>
                  <small>{c.property?.title ?? "Listing removed"} · {c.messageCount} msg</small>
                </Link>
                <time>{ago(c.last_message_at)}</time>
              </li>
            ))}</ul>}
        </section>

        <section className="adm-panel">
          <div className="adm-panel-head"><h2>Newest people</h2><Link to="/admin/users" search={{}} className="adm-more">All people <ArrowRight size={14} /></Link></div>
          {users.isError ? <p className="adm-empty">Couldn't load accounts.</p>
            : !users.data ? <div className="adm-skel" />
            : u.length === 0 ? <p className="adm-empty">No accounts yet.</p>
            : <ul className="adm-rows">{u.slice(0, 6).map((x) => (
              <li key={x.id}>
                <span><strong>{x.name || x.email}</strong><small>{x.email}</small></span>
                <span className={`adm-tag adm-tag-${x.isAdmin ? "admin" : x.role ?? "none"}`}>{x.isAdmin ? "Admin" : x.role ?? "No type"}</span>
                <time>{fmtDate(x.createdAt)}</time>
              </li>
            ))}</ul>}
        </section>

        <section className="adm-panel adm-panel-wide">
          <div className="adm-panel-head"><h2>Latest listings</h2><Link to="/admin/listings" search={{}} className="adm-more">All listings <ArrowRight size={14} /></Link></div>
          {listings.isError ? <p className="adm-empty">Couldn't load listings.</p>
            : !listings.data ? <div className="adm-skel" />
            : listings.data.length === 0 ? <p className="adm-empty">No homes listed yet.</p>
            : <ul className="adm-rows">{listings.data.map((l) => (
              <li key={l.id}>
                <Link to="/properties/$propertyId" params={{ propertyId: l.id }} className="adm-row-link">
                  <span><strong>{l.title}</strong></span>
                  <small>{l.owner?.full_name || "Landlord"} · {[l.neighbourhood, l.district].filter(Boolean).join(", ")}</small>
                </Link>
                <span className="adm-num">{formatPrice(l.price)} RWF</span>
                <span className={l.available ? "adm-dot live" : "adm-dot off"}>{l.available ? "Live" : "Hidden"}</span>
              </li>
            ))}</ul>}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, note, to, search }: { label: string; value: string; note: string; to: "/admin/users" | "/admin/listings" | "/admin/messages"; search?: { type?: "landlord" | "tenant" } }) {
  return (
    <Link to={to} search={search ?? {}} className="adm-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </Link>
  );
}
