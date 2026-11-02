import { notFound } from "next/navigation";
import { getSettings } from "@/lib/db";
const copy: Record<string, { title: string; sections: [string, string][] }> = {
  "privacy-policy": {
    title: "Privacy notice",
    sections: [
      [
        "Information you share",
        "When you submit an enquiry, we collect your name, phone number, email if provided, property preferences, message and requested visit date. We use these details to respond and coordinate your enquiry. A site visit request is not a confirmed booking.",
      ],
      [
        "How information is handled",
        "Enquiries are available only to authorized staff. Hosting, database, image storage and email providers process information necessary to operate this website. We do not sell your enquiry information.",
      ],
      [
        "Cookies and measurement",
        "Admin login uses an essential, HTTP-only session cookie. The introduction uses local storage to remember that it has played. We count property views and phone or WhatsApp clicks without recording personal enquiry details in analytics. Security rate limits use temporary hashed request identifiers.",
      ],
      [
        "External services",
        "WhatsApp, Google Maps and social links take you to external services with their own privacy practices. Embedded maps and remote stock imagery may transmit your IP address to those providers.",
      ],
      [
        "Retention and your choices",
        "Authorized owners can remove closed enquiries through retention controls. Contact the business to request access, correction or deletion, or to withdraw permission for further contact. Operational retention periods and provider details must be finalized by the site owner before public launch.",
      ],
    ],
  },
  terms: {
    title: "Terms of use",
    sections: [
      [
        "Using this website",
        "This website helps you discover property information and contact SS Regalis. Browsing or submitting an enquiry does not create a sale agreement, agency agreement or confirmed appointment.",
      ],
      [
        "Property information",
        "Availability, pricing, measurements and specifications can change. Confirm all details, ownership, permissions and documentation directly before committing to a transaction.",
      ],
      [
        "Responsible use",
        "Do not attempt unauthorized access, upload malicious content, scrape private information or misuse enquiry forms. External service links are provided for convenience.",
      ],
      [
        "Transactions",
        "Any transaction must be documented separately by the relevant parties. These website terms do not replace independent professional advice or a property contract. The business must review these terms for its actual operations before launch.",
      ],
    ],
  },
  disclaimer: {
    title: "Property information disclaimer",
    sections: [
      [
        "Verify before you decide",
        "Property descriptions, prices, measurements, maps and availability are informational. Independently verify title, boundaries, access, planning permissions, taxes, approvals and suitability before a purchase.",
      ],
      [
        "Images and illustrations",
        "Demonstration listings are explicitly labelled and are not offers for sale. Stock photography and conceptual architectural scenes are illustrative. Actual property images and supporting documents should be requested from the team.",
      ],
      [
        "Approval information",
        "Approval classifications appear only when the record is marked verified by an authorized administrator. Review original supporting documents; a website badge is not a substitute for due diligence.",
      ],
      [
        "Heritage inspiration",
        "Our architectural introduction is inspired by the idea of moving from heritage to new beginnings. The default gateway is conceptual and is not an accurate temple reconstruction. No association with Sri Kanchi Kamakshi Amman Temple or any religious institution is implied.",
      ],
    ],
  },
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const key = (await params).legal;
  return {
    title: copy[key]?.title || "Not found",
    alternates: { canonical: `/${key}` },
  };
}
export default async function Legal({
  params,
}: {
  params: Promise<{ legal: string }>;
}) {
  const c = copy[(await params).legal];
  if (!c) notFound();
  const s = await getSettings();
  return (
    <article className="container legal-page">
      <p className="eyebrow">{s.name}</p>
      <h1>{c.title}</h1>
      {c.sections.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
      <p>
        For questions, <a href="/contact">contact our team</a>
        {s.email && (
          <>
            {" "}
            at <a href={`mailto:${s.email}`}>{s.email}</a>
          </>
        )}
        .
      </p>
    </article>
  );
}
