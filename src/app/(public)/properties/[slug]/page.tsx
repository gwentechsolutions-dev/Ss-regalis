import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, MessageCircle, ArrowUpRight } from "lucide-react";
import { getProperty, getSettings, queryProperties } from "@/lib/db";
import { isHome, money, whatsappUrl } from "@/lib/domain";
import { Gallery, EnquiryForm, TrackedLink } from "@/components/widgets";
import { PropertyCard, SectionTitle } from "@/components/public";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProperty(slug);
  return {
    title: p?.title || "Property not found",
    description: p?.description.slice(0, 160),
    alternates: { canonical: `/properties/${slug}` },
    robots: p?.demo ? { index: false, follow: false } : undefined,
    openGraph: { images: p?.images[0] ? [p.images[0].url] : [] },
  };
}
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await getProperty((await params).slug);
  if (!p) notFound();
  const s = await getSettings();
  const related = await queryProperties({
    category: p.category,
    status: "Available",
  });
  const specs = [
    ["Property type", p.category],
    ["Land area", `${p.area.toLocaleString("en-IN")} ${p.unit}`],
    ...(isHome(p.category)
      ? [
          ["Bedrooms", String(p.bedrooms)],
          ["Bathrooms", String(p.bathrooms)],
          ...(p.builtUp ? [["Built-up area", `${p.builtUp} sq ft`]] : []),
          ["Furnishing", p.furnishing],
          ["Construction", p.construction],
        ]
      : []),
    ["Facing", p.facing],
    ["Road access", p.road],
    ["Water", p.water ? "Available" : ""],
    ["Electricity", p.electricity ? "Available" : ""],
    ["Parking", p.parking ? "Available" : ""],
  ].filter(([, v]) => v);
  return (
    <div className="container detail-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/properties">Properties</Link>{" "}
        / <span>{p.title}</span>
      </nav>
      {p.demo && (
        <div className="notice">
          Demonstration listing. All prices and specifications are examples;
          stock images do not depict an actual property for sale.
        </div>
      )}
      <div className="detail-heading">
        <div>
          <p className="eyebrow">
            {p.category} · {p.status}
          </p>
          <h1>{p.title}</h1>
          <p>
            <MapPin size={16} /> {p.location}
            {p.address && ` · ${p.address}`}
          </p>
        </div>
        <div>
          <strong className="detail-price">{money(p.price)}</strong>
          <p>
            {money(Math.round(p.price / p.area))} / {p.unit}
            {p.negotiable ? " · Negotiable" : ""}
          </p>
        </div>
      </div>
      <Gallery property={p} />
      <div className="detail-columns">
        <div>
          <section>
            <p className="eyebrow">THE DETAILS</p>
            <h2>A closer look.</h2>
            <div className="spec-grid">
              {specs.map(([label, value]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2>About this property</h2>
            <p className="preserve-lines">{p.description}</p>
          </section>
          {p.amenities && (
            <section>
              <h2>Amenities</h2>
              <p className="preserve-lines">{p.amenities}</p>
            </section>
          )}
          {!!p.floorPlans?.length && <details open><summary>Floor plans & available sizes</summary><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Type</th><th>Area (sq ft)</th><th>Price</th><th>Plan</th></tr></thead><tbody>{p.floorPlans.map((plan,i) => <tr key={i}><td>{plan.type}</td><td>{plan.area.toLocaleString('en-IN')}</td><td>₹{plan.price.toLocaleString('en-IN')}</td><td>{plan.url ? <a href={plan.url} target="_blank" rel="noreferrer">View plan</a> : '—'}</td></tr>)}</tbody></table></div></details>}
          {p.specifications && <details open><summary>Specifications</summary><p className="preserve-lines">{p.specifications}</p></details>}
          {p.advantages && <details open><summary>Location advantages & nearby facilities</summary><p className="preserve-lines">{p.advantages}</p></details>}
          {p.approvalVerified && p.approvals && (
            <section>
              <h2>Approval information</h2>
              <p>{p.approvals}</p>
              <small>
                Ask to review the supporting documents before making a decision.
              </small>
            </section>
          )}
          <section>
            <h2>The neighbourhood</h2>
            <p>
              {p.location}, {p.city}, {p.district}
            </p>
            {p.landmarks && <p className="preserve-lines">{p.landmarks}</p>}
            {p.latitude !== null && p.longitude !== null && (
              <iframe
                title="Property location"
                loading="lazy"
                referrerPolicy="no-referrer"
                src={`https://www.google.com/maps?q=${p.latitude},${p.longitude}&z=14&output=embed`}
              />
            )}
            {p.mapsUrl ? (
              <a
                href={p.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                View location & get directions <ArrowUpRight size={16} />
              </a>
            ) : (
              <p className="muted">
                Request the verified location from our team.
              </p>
            )}
          </section>
          <small>
            Listing ID: {p.id} · Listed{" "}
            {new Date(p.createdAt).toLocaleDateString("en-IN")}
            <br />
            Information is subject to verification.{" "}
            <Link href="/disclaimer">Read the property disclaimer.</Link>
          </small>
        </div>
        <aside className="enquiry-panel">
          <p className="eyebrow">LET’S TALK ABOUT THIS SPACE</p>
          <h2>
            {p.status === "Sold"
              ? "Find a similar property."
              : "Could this be your next chapter?"}
          </h2>
          <p>
            {p.status === "Sold"
              ? "This property is sold. Contact us about other options."
              : p.status === "Reserved"
                ? "This property is reserved. Enquire about its status or similar opportunities."
                : "Get the details or request a personal site visit."}
          </p>
          <div className="contact-buttons">
            {s.phone && (
              <TrackedLink
                kind="phone"
                propertyId={p.id}
                href={`tel:${s.phone}`}
                className="button maroon-button"
              >
                <Phone size={16} /> Call now
              </TrackedLink>
            )}
            {s.whatsapp && (
              <TrackedLink
                kind="whatsapp"
                propertyId={p.id}
                href={whatsappUrl(s, p, process.env.SITE_URL)}
                className="button outline-button"
              >
                <MessageCircle size={17} /> WhatsApp
              </TrackedLink>
            )}
          </div>
          <EnquiryForm property={p} />
        </aside>
      </div>
      <section className="section">
        <SectionTitle
          eyebrow="KEEP EXPLORING"
          title="More possibilities."
          href="/properties"
        />
        <div className="property-grid">
          {related.properties
            .filter((x) => x.id !== p.id)
            .slice(0, 3)
            .map((x) => (
              <PropertyCard key={x.id} property={x} settings={s} />
            ))}
        </div>
      </section>
    </div>
  );
}
