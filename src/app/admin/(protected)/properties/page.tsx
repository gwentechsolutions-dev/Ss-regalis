import Link from "next/link";
import { queryProperties } from "@/lib/db";
import { BulkActions, DemoListingActions } from "@/components/admin";
export default async function AdminProperties({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const p = await searchParams;
  const r = await queryProperties(p, true);
  const pageLink = (page: number) => {
    const q = new URLSearchParams(p);
    q.set("page", String(page));
    return `/admin/properties?${q}`;
  };
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">YOUR PROPERTY COLLECTION</p>
          <h1>Properties</h1>
          <p>{r.total} listings · Manage the details that matter.</p>
        </div>
        <Link href="/admin/properties/new" className="button maroon-button">
          + Add property
        </Link>
      </div>
      <DemoListingActions />
      <form className="admin-search">
        <input
          name="q"
          aria-label="Search properties"
          placeholder="Search title or location"
          defaultValue={p.q}
        />
        <select name="status" aria-label="Status" defaultValue={p.status || ""}>
          <option value="">All statuses</option>
          {["Available", "Reserved", "Sold", "Hidden"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select name="sort" aria-label="Sort" defaultValue={p.sort || "newest"}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
        </select>
        <select
          name="archived"
          aria-label="Archive status"
          defaultValue={p.archived || "false"}
        >
          <option value="false">Active records</option>
          <option value="true">Archived records</option>
        </select>
        <button className="button maroon-button">Search</button>
      </form>
      <section className="admin-panel">
        <BulkActions
          properties={r.properties}
          archived={p.archived === "true"}
        />
        {!r.total && (
          <p className="empty-state">
            No matching properties. Add a listing or change your search.
          </p>
        )}
      </section>
      {r.pages > 1 && (
        <nav className="pagination">
          {r.page > 1 && <Link href={pageLink(r.page - 1)}>← Previous</Link>}
          <span>
            Page {r.page} of {r.pages}
          </span>
          {r.page < r.pages && <Link href={pageLink(r.page + 1)}>Next →</Link>}
        </nav>
      )}
    </>
  );
}
