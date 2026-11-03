import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDown,
  LandPlot,
  House,
  Trees,
  Building2,
  ShieldCheck,
  MapPinned,
  Handshake,
  MoveUpRight,
} from "lucide-react";
import { getSettings, queryProperties } from "@/lib/db";
import { PropertyCard, SectionTitle, ContactCTA } from "@/components/public";
import Intro from "@/components/intro";
import HomeSearch from "@/components/home-search";

export async function generateMetadata() {
  const s = await getSettings();
  return {
    title: { absolute: s.seoTitle },
    description: s.seoDescription,
    alternates: { canonical: "/" },
  };
}
export default async function Home() {
  const s = await getSettings();
  const featured = await queryProperties({
    featured: "true",
    status: "Available",
  });
  const latest = await queryProperties({ status: "Available" });
  const cats = [
    ["Residential Plot", "Land to build your vision", LandPlot],
    ["House", "A place to call home", House],
    ["Villa", "Room for a little more", Building2],
    ["Farmland", "Closer to nature", Trees],
  ] as const;
  return (
    <>
      <Intro />
      <section className="heritage-hero" aria-labelledby="heritage-title">
        <div className="heritage-art">
          <img src="/images/tamilnadu-panorama.webp" alt="An artistic Tamil Nadu panorama of coastal landmarks, temple towers, classical dance and city skylines" fetchPriority="high" width="2304" height="768" />
        </div>
        <div className="container heritage-content">
          <p className="eyebrow"><span /> BASED IN KANCHIPURAM. SERVING TAMIL NADU.</p>
          <h1 id="heritage-title">Rooted in heritage.<br /><em>Find your future</em><br />across Tamil Nadu.</h1>
          <p className="heritage-copy">From a piece of land to a place to call home.<br />Explore homes and land across Tamil Nadu.</p>
          <div className="heritage-actions">
            <Link className="button maroon-button" href="/properties">Explore properties <ArrowUpRight size={18} /></Link>
            <Link className="text-link" href="/contact">Let’s talk <ArrowUpRight size={16} /></Link>
          </div>
          <p className="heritage-signature">{s.tagline}</p>
        </div>
        <div className="container heritage-footnote"><span>KANCHIPURAM <i /> TAMIL NADU</span><small>A celebration of place · Artistic interpretation</small></div>
      </section>
      <section id="discover" className="search-wrap container">
        <HomeSearch locations={latest.properties.flatMap(p => [p.location, p.city, p.district])} />
      </section>
      <section className="section container">
        <SectionTitle
          eyebrow="A SPACE FOR EVERY ASPIRATION"
          title="What does your next chapter look like?"
        />
        <div className="category-grid">
          {cats.map(([name, desc, Icon]) => (
            <Link
              href={`/properties?category=${encodeURIComponent(name)}`}
              key={name}
              className="category-card"
            >
              <Icon strokeWidth={1} size={35} />
              <div>
                <h3>
                  {name === "House"
                    ? "Independent houses"
                    : name === "Residential Plot"
                      ? "Residential plots"
                      : name === "Villa"
                        ? "Villas"
                        : "Farmland"}
                </h3>
                <p>{desc}</p>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="section featured-section">
        <div className="container">
          <SectionTitle
            eyebrow="A CONSIDERED SELECTION"
            title="Spaces worth discovering."
            href="/properties?featured=true"
          />
          {featured.properties.length ? (
            <>
              <div className="property-grid">
                {featured.properties.slice(0, 3).map((p) => (
                  <PropertyCard key={p.id} property={p} settings={s} />
                ))}
              </div>
              {featured.properties.some((p) => p.demo) && (
                <p className="sample-note">
                  A preview of the possibilities. These sample listings use
                  illustrative imagery and are not properties offered for sale.
                </p>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>Your next opportunity is taking shape.</h3>
              <p>
                Our verified property collection will appear here. Tell us what
                you’re looking for.
              </p>
              <Link href="/contact" className="text-link">
                Enquire with our team ↗
              </Link>
            </div>
          )}
        </div>
      </section>
      <section className="section container story-section">
        <div className="story-image">
          <img
            loading="lazy"
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85"
            alt="Illustrative interior with warm natural materials"
          />
          <div className="story-plaque">
            A sense of place.
            <br />
            <em>A foundation of trust.</em>
          </div>
        </div>
        <div className="story-copy">
          <p className="eyebrow">OUR ROOTS. YOUR FUTURE.</p>
          <h2>
            From our Kanchipuram roots,
            <br />
            find possibilities <em>statewide.</em>
          </h2>
          <p>
            Our company is based in Kanchipuram, a city shaped by heritage,
            craftsmanship, and a deep sense of belonging. Our property services
            extend across Tamil Nadu.
          </p>
          <p>
            At {s.name}, we help you explore the land and homes that can become
            part of your own story. With a personal approach, clear information,
            and your aspirations at the heart of every conversation.
          </p>
          <Link href="/about" className="text-link">
            Get to know SS Regalis <ArrowUpRight size={17} />
          </Link>
          <div className="story-signature">
            SS Regalis <small>{s.tagline}</small>
          </div>
        </div>
      </section>
      <section className="values-section">
        <div className="container">
          <SectionTitle
            eyebrow="THE SS REGALIS APPROACH"
            title="Good decisions begin with trust."
          />
          <div className="values-grid">
            {[
              [
                ShieldCheck,
                "Clarity at every step",
                "Understand the details, ask the right questions, and make a considered choice.",
              ],
              [
                MapPinned,
                "A local perspective",
                "Explore locations across Tamil Nadu with your everyday needs in mind.",
              ],
              [
                Handshake,
                "People before properties",
                "A personal conversation about your plans, your priorities, and your next chapter.",
              ],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <article key={String(title)}>
                  <I size={29} strokeWidth={1} />
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section container">
        <SectionTitle
          eyebrow="NEW POSSIBILITIES"
          title="The latest in our collection."
          href="/properties"
        />
        {latest.properties.length ? (
          <div className="property-grid">
            {latest.properties.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} property={p} settings={s} />
            ))}
          </div>
        ) : (
          <p>New listings will be published here when available.</p>
        )}
      </section>
      <section className="location-section container">
        <div>
          <p className="eyebrow">A PLACE TO BELONG</p>
          <h2>
            Across Tamil Nadu.
            <br />
            <em>A place for your next chapter.</em>
          </h2>
          <p>
            Based in Kanchipuram, we help you explore homes and land across Tamil Nadu.
            Search by the city, town or locality that matters to you.
          </p>
          <Link className="text-link" href="/properties">
            Explore by location <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="location-art">
          <span>TAMIL NADU</span>
          <MapPinned size={62} strokeWidth={0.7} />
          <p>BASED IN KANCHIPURAM · SERVING STATEWIDE</p>
        </div>
      </section>
      <ContactCTA />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            name: s.name,
            description: s.description,
            url: process.env.SITE_URL || "http://localhost:3000",
            areaServed: { "@type": "State", name: "Tamil Nadu" },
            ...(s.phone ? { telephone: s.phone } : {}),
          }).replaceAll("<", "\\u003c"),
        }}
      />
    </>
  );
}


