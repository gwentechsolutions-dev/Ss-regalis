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
      <section className="page-hero container story-opening">
        <p className="eyebrow">OUR ROOTS. YOUR FUTURE.</p>
        <h1>
          <span className="story-title-line">Built around a place.</span>
          <em className="story-title-line">Grounded in people.</em>
        </h1>
        <p>{s.tagline}</p>
      </section>
      <section className="container about-layout section story-opening-body">
        <img
          src="/images/ss-regalis-office.webp"
          alt="SS Regalis Realty office illustration with burgundy and gold signage"
          className="about-office-image"
          width={1672}
          height={941}
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
