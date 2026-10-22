import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "../components/smart-rent/layout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works | Smart Rent" },
      { name: "description", content: "How landlords list homes and tenants find and message them on Smart Rent." },
      { property: "og:title", content: "How it works | Smart Rent" },
      { property: "og:description", content: "List, browse and talk directly — in three steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <PageShell>
      <div className="page-head">
        <p className="eyebrow">How it works</p>
        <h1>Three simple steps.</h1>
      </div>
      <section className="section how">
        <h2>For landlords</h2>
        <div className="how-grid">
          <div><span>1</span><h3>Create an account</h3><p>Sign up with your email in a minute.</p></div>
          <div><span>2</span><h3>List your home</h3><p>Add photos, the location, the price and the essentials. It's free.</p></div>
          <div><span>3</span><h3>Reply to tenants</h3><p>Interested tenants message you directly in Smart Rent.</p></div>
        </div>
      </section>
      <section className="section how">
        <h2>For tenants</h2>
        <div className="how-grid">
          <div><span>1</span><h3>Browse homes</h3><p>Search by area, type, budget and bedrooms.</p></div>
          <div><span>2</span><h3>Sign in</h3><p>Create a free account to contact landlords.</p></div>
          <div><span>3</span><h3>Message the landlord</h3><p>Ask questions and arrange a visit for the home you like.</p></div>
        </div>
      </section>
      <section className="section">
        <div className="cta-band">
          <div><h2>Find your next home</h2><p>New homes are listed every day.</p></div>
          <Link to="/explore" className="button button-light">Explore homes</Link>
        </div>
      </section>
    </PageShell>
  );
}
