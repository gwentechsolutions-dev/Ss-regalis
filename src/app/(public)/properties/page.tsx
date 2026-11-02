import Link from "next/link";
import { Suspense } from "react";
import { queryProperties, getSettings } from "@/lib/db";
import { PropertyCard } from "@/components/public";
import Filters from "@/components/filters";
export const metadata = {
  title: "Explore properties",
  description:
    "Find residential plots, homes, villas, farmland and commercial property across Tamil Nadu.",
  alternates: { canonical: "/properties" },
};
export default async function Properties({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const [result, s] = await Promise.all([queryProperties(p), getSettings()]);
  const pageLink = (page: number) => {
    const q = new URLSearchParams(
      Object.entries(p).filter(
        (e): e is [string, string] => typeof e[1] === "string",
      ),
    );
    q.set("page", String(page));
    return `/properties?${q}`;
  };
  return (
    <>
      <section className="page-hero container">
        <p className="eyebrow">THE PROPERTY COLLECTION</p>
        <h1>
          Find your <em>place.</em>
        </h1>
        <p>Thoughtfully chosen spaces. Possibilities that feel like you.</p>
      </section>
      <section className="container directory">
        <Suspense>
          <Filters total={result.total} />
        </Suspense>
        {result.properties.length ? (
          <div
            className={`property-grid ${p.view === "list" ? "list-view" : ""}`}
          >
            {result.properties.map((x) => (
              <PropertyCard key={x.id} property={x} settings={s} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>A different search, a new possibility.</h2>
            <p>
              No published properties match these filters. Try broadening your
              search or tell us what you need.
            </p>
            <Link className="button maroon-button" href="/properties">
              Clear filters
            </Link>{" "}
            <Link className="text-link" href="/contact">
              Speak with us ↗
            </Link>
          </div>
        )}
        {result.pages > 1 && (
          <nav className="pagination" aria-label="Property pages">
            {result.page > 1 && (
              <Link href={pageLink(result.page - 1)}>← Previous</Link>
            )}
            <span>
              Page {result.page} of {result.pages}
            </span>
            {result.page < result.pages && (
              <Link href={pageLink(result.page + 1)}>Next →</Link>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
