import { getSettings } from "@/lib/db";
import { ContactCTA } from "@/components/public";
export const metadata = {
  title: "Our story",
  alternates: { canonical: "/about" },
};
export default async function About() {
  const s = await getSettings();
  return (
    <>
      <section className="page-hero container">
        <p className="eyebrow">OUR ROOTS. YOUR FUTURE.</p>
        <h1>
          Built around a place.
          <br />
          <em>Grounded in people.</em>
        </h1>
        <p>{s.tagline}</p>
      </section>
      <section className="container about-layout section">
        <img
          src="/images/demo/reference-1.webp"
          alt="Reference photograph of a home in Tirunelveli, Tamil Nadu"
        />
        <div>
          <p className="eyebrow">KANCHIPURAM ROOTS · TAMIL NADU REACH</p>
          <h2>A place for your story.</h2>
          <p className="preserve-lines">{s.about}</p>
          <p>
            From residential plots and farmland to independent homes and villas,
            our purpose is to make the search thoughtful, transparent, and
            personal.
          </p>
          <p>
            Our visual story draws inspiration from Kanchipuram’s heritage. We
            are not affiliated with any temple or religious institution.
          </p>
        </div>
      </section>
      <ContactCTA />
    </>
  );
}
