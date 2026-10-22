import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/smart-rent/layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us | Smart Rent" },
      { name: "description", content: "Smart Rent connects landlords and tenants across Rwanda directly, with no agents in between." },
      { property: "og:title", content: "About us | Smart Rent" },
      { property: "og:description", content: "Why we built a simpler way to rent in Rwanda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <div className="page-head">
        <p className="eyebrow">About us</p>
        <h1>Renting in Rwanda, made direct.</h1>
        <p className="lede">Smart Rent is a simple marketplace that connects landlords and tenants. Landlords list their homes for free, tenants browse and message them directly — no agents and no middle fees.</p>
      </div>
      <section className="section how">
        <div className="how-grid">
          <div><span>1</span><h3>Our mission</h3><p>Make finding a home faster, fairer and more transparent for everyone.</p></div>
          <div><span>2</span><h3>For landlords</h3><p>Reach serious tenants across the country at no cost.</p></div>
          <div><span>3</span><h3>For tenants</h3><p>See real prices up front and talk to the owner yourself.</p></div>
        </div>
      </section>
      <section className="section">
        <div className="cta-band">
          <div><h2>Ready to start?</h2><p>Browse homes or list your own today.</p></div>
          <Link to="/explore" className="button button-light">Explore homes</Link>
        </div>
      </section>
    </PageShell>
  );
}
