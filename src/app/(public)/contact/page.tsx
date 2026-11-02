import { getSettings } from "@/lib/db";
import { EnquiryForm, TrackedLink } from "@/components/widgets";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  ArrowUpRight,
} from "lucide-react";
export const metadata = {
  title: "Contact us",
  alternates: { canonical: "/contact" },
};
export default async function Contact() {
  const s = await getSettings();
  return (
    <>
      <section className="page-hero container">
        <p className="eyebrow">A CONVERSATION IS A GOOD BEGINNING</p>
        <h1>
          Let’s find your
          <br />
          <em>perfect property.</em>
        </h1>
        <p>
          Share your plans. Ask your questions. We’re here to help you take the
          next step.
        </p>
      </section>
      <section className="container contact-layout">
        <div className="contact-info">
          <h2>Let’s connect.</h2>
          <p>Based in Kanchipuram. Here for your next chapter, anywhere in Tamil Nadu.</p>
          {s.phone && (
            <div>
              <Phone />
              <span>
                <small>CALL OUR TEAM</small>
                <TrackedLink kind="phone" href={`tel:${s.phone}`}>
                  {s.phone}
                </TrackedLink>
              </span>
            </div>
          )}
          {s.whatsapp && (
            <div>
              <MessageCircle />
              <span>
                <small>WHATSAPP</small>
                <TrackedLink
                  kind="whatsapp"
                  href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`Hi ${s.name}, I would like to enquire about your real estate services.`)}`}
                >
                  Start a conversation ↗
                </TrackedLink>
              </span>
            </div>
          )}
          {s.email && (
            <div>
              <Mail />
              <span>
                <small>EMAIL US</small>
                <a href={`mailto:${s.email}`}>{s.email}</a>
              </span>
            </div>
          )}
          <div>
            <MapPin />
            <span>
              <small>OUR OFFICE LOCATION</small>
              {s.address || "Kanchipuram, Tamil Nadu"}
              {s.mapsUrl && (
                <a href={s.mapsUrl} target="_blank" rel="noreferrer">
                  Get directions ↗
                </a>
              )}
            </span>
          </div>
          {s.hours && (
            <div>
              <Clock />
              <span>
                <small>OFFICE HOURS</small>
                {s.hours}
              </span>
            </div>
          )}
          <div className="socials">
            {(["instagram", "facebook", "twitter", "youtube"] as const)
              .filter((k) => s[k])
              .map((k) => (
                <a href={s[k]} key={k} target="_blank" rel="noreferrer">
                  {k === "twitter" ? "X" : k} ↗
                </a>
              ))}
          </div>
          <blockquote>
            “Building Trust,
            <br />
            Creating Value.”
          </blockquote>
        </div>
        <div className="contact-form-card">
          <p className="eyebrow">TELL US WHAT YOU HAVE IN MIND</p>
          <h2>Your next chapter starts here.</h2>
          <EnquiryForm />
        </div>
      </section>
    </>
  );
}
