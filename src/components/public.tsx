import Link from "next/link";
import {
  ArrowUpRight,
  MapPin,
  BedDouble,
  MoveUpRight,
  Phone,
  ArrowRight,
  LandPlot,
} from "lucide-react";
import {
  type Settings,
  type Property,
  categories,
  isHome,
  money,
  whatsappUrl,
} from "@/lib/domain";
import { MobileMenu, TrackedLink } from "./widgets";
import { responsiveSources } from "@/lib/images";
import { WhatsAppIcon } from './whatsapp-icon';
export function Brand({
  settings,
  large = false,
}: {
  settings: Settings;
  large?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`brand ${large ? "large" : ""}`}
      aria-label={`${settings.name} home`}
    >
      <img
        src={settings.logo || "/logo-hd.png"}
        alt="Original SS Regalis Realty logo"
      />
      <span>
        SS REGALIS
        <small>
          {settings.name
            .replace(/ss regalis/i, "")
            .trim()
            .toUpperCase()}
        </small>
      </span>
    </Link>
  );
}
export function Header({ settings }: { settings: Settings }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand settings={settings} />
        <nav aria-label="Main navigation" className="desktop-nav">
          <Link href="/">Home</Link>
          <Link href="/properties">Properties</Link>
          <Link href="/about">Our story</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link className="button header-cta" href="/contact">
          Let’s talk <ArrowUpRight size={16} />
        </Link>
        <MobileMenu />
      </div>
    </header>
  );
}
export function Footer({ settings: s }: { settings: Settings }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Brand settings={s} large />
          <p className="gold">{s.tagline}</p>
          <p>{s.description}</p>
        </div>
        <div>
          <h3>Discover</h3>
          <Link href="/">Home</Link>
          <Link href="/about">Our story</Link>
          <Link href="/properties">All properties</Link>
          <Link href="/properties?featured=true">Featured properties</Link>
          <Link href="/contact">Contact us</Link>
        </div>
        <div>
          <h3>Find your space</h3>
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c}
              href={`/properties?category=${encodeURIComponent(c)}`}
            >
              {c}
            </Link>
          ))}
        </div>
        <div>
          <h3>Visit. Talk. Explore.</h3>
          <p>
            <MapPin size={15} /> Based in Kanchipuram, Tamil Nadu
          </p>
          {s.address && <p>{s.address}</p>}
          {s.phone && <a href={`tel:${s.phone}`}>{s.phone}</a>}
          {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
          {s.mapsUrl && (
            <a href={s.mapsUrl} target="_blank" rel="noreferrer">
              Get directions ↗
            </a>
          )}
          <div className="socials">
            {(["instagram", "facebook", "twitter", "youtube"] as const)
              .filter((k) => s[k])
              .map((k) => (
                <a key={k} href={s[k]} target="_blank" rel="noreferrer">
                  {k === "twitter" ? "X" : k} ↗
                </a>
              ))}
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {s.name}. All rights reserved.
        </span>
        <div>
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/disclaimer">Property disclaimer</Link>
        </div>
      </div>
    </footer>
  );
}
export function FloatingContact({ settings: s }: { settings: Settings }) {
  return (
    <div className="floating-contact">
      {s.phone && (
        <TrackedLink
          kind="phone"
          href={`tel:${s.phone}`}
          className="float-phone"
          label="Call SS Regalis"
        >
          <Phone size={20} />
        </TrackedLink>
      )}
      {s.whatsapp && (
        <TrackedLink
          kind="whatsapp"
          href={whatsappUrl(s)}
          className="float-whatsapp"
          label="Chat with us on WhatsApp"
        >
          <span>Chat with us!</span>
          <WhatsAppIcon size={27} />
        </TrackedLink>
      )}
    </div>
  );
}
export function PropertyCard({
  property: p,
  settings: s,
}: {
  property: Property;
  settings: Settings;
}) {
  return (
    <article className="property-card">
      <Link href={`/properties/${p.slug}`} className="property-image">
        {p.images[0] ? (
          <img
            src={p.images[0].url}
            srcSet={responsiveSources(p.images[0].url)}
            alt={p.images[0].alt}
            loading="lazy"
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        ) : (
          <div className="image-placeholder">
            <LandPlot size={48} />
            <span>Photography coming soon</span>
          </div>
        )}
        <div className="card-badges">
          <span>{p.category}</span>
          <span
            className={
              p.status === "Sold"
                ? "sold"
                : p.status === "Reserved"
                  ? "reserved"
                  : ""
            }
          >
            {p.status}
          </span>
        </div>
        {p.demo && (
          <span className="demo-label">DEMONSTRATION · NOT FOR SALE</span>
        )}
        <span className="image-arrow">
          <ArrowUpRight size={21} />
        </span>
      </Link>
      <div className="property-content">
        <p className="property-location">
          <MapPin size={13} />
          {p.location}
        </p>
        <h3>
          <Link href={`/properties/${p.slug}`}>{p.title}</Link>
        </h3>
        <div className="property-specs">
          <span>
            <LandPlot size={15} />
            {p.area.toLocaleString("en-IN")} {p.unit}
          </span>
          {isHome(p.category) && (
            <span>
              <BedDouble size={15} />
              {p.bedrooms} beds · {p.bathrooms} baths
            </span>
          )}
        </div>
        <div className="property-bottom">
          <strong>
            {money(p.price)}
            {p.negotiable && <small>Negotiable</small>}
          </strong>
          <Link href={`/properties/${p.slug}`}>
            View property <ArrowUpRight size={15} />
          </Link>
          {s.whatsapp && (
            <TrackedLink
              kind="whatsapp"
              propertyId={p.id}
              href={whatsappUrl(s, p, process.env.SITE_URL)}
              label={`Enquire about ${p.title}`}
            >
              <WhatsAppIcon size={19} />
            </TrackedLink>
          )}
        </div>
      </div>
    </article>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  href,
  label = "View all properties",
}: {
  eyebrow: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {label}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function ContactCTA() {
  return (
    <section className="contact-cta">
      <div className="container">
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h2>
            Let’s find a place
            <br />
            you can call <em>yours.</em>
          </h2>
        </div>
        <div>
          <p>
            A home, an investment, a fresh beginning.
            <br />
            Tell us what you have in mind.
          </p>
          <Link className="button gold-button" href="/contact">
            Start a conversation <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

