import Link from "next/link";
import { db, decode } from "@/lib/db";
import { BulkActions } from "@/components/admin";
export default async function Dashboard() {
  const k = await db();
  const counts = await k("properties")
    .where({ archived: false })
    .select("status")
    .count("* as count")
    .groupBy("status");
  const stats = Object.fromEntries(
    counts.map((x) => [x.status, Number(x.count)]),
  );
  const recent = (
    await k("properties")
      .where({ archived: false })
      .orderBy("createdAt", "desc")
      .limit(5)
  ).map(decode);
  const enquiries = await k("enquiries").orderBy("createdAt", "desc").limit(5);
  const events = await k("events")
    .select("kind")
    .count("* as count")
    .groupBy("kind");
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">YOUR BUSINESS AT A GLANCE</p>
          <h1>Welcome to your workspace.</h1>
          <p>A clear view of your properties and conversations.</p>
        </div>
        <Link className="button maroon-button" href="/admin/properties/new">
          + Add property
        </Link>
      </div>
      <div className="metric-grid">
        {[
          ["Total properties", Object.values(stats).reduce((a, b) => a + b, 0)],
          ...["Available", "Reserved", "Sold", "Hidden"].map((s) => [
            s,
            stats[s] || 0,
          ]),
        ].map(([label, count]) => (
          <div className="metric" key={String(label)}>
            <small>{label}</small>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <div className="section-heading">
          <h2>Recent listings</h2>
          <Link href="/admin/properties">Manage all ↗</Link>
        </div>
        <BulkActions properties={recent} />
      </div>
      <div className="admin-two-columns">
        <section className="admin-panel">
          <h2>Recent enquiries</h2>
          {enquiries.length ? (
            enquiries.map((e) => (
              <Link
                key={e.id}
                className="recent-enquiry"
                href="/admin/enquiries"
              >
                <span>
                  {e.name}
                  <small>{e.interest}</small>
                </span>
                <span className="status">{e.status}</span>
              </Link>
            ))
          ) : (
            <p>No enquiries yet. New website enquiries will appear here.</p>
          )}
        </section>
        <section className="admin-panel">
          <h2>Website activity</h2>
          <p>
            Anonymous event counts. Clicks are expressions of interest, not
            confirmed enquiries.
          </p>
          {["view", "phone", "whatsapp"].map((kind) => (
            <div className="activity-row" key={kind}>
              <span>
                {kind === "view"
                  ? "Property views"
                  : kind === "phone"
                    ? "Phone clicks"
                    : "WhatsApp clicks"}
              </span>
              <strong>
                {String(events.find((e) => e.kind === kind)?.count || 0)}
              </strong>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
