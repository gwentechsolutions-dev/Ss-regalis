import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { EnquiryEditor, RetentionControl } from "@/components/admin";
export default async function Enquiries({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const p = await searchParams;
  const k = await db();
  const user = await currentUser();
  const q = k("enquiries");
  if (p.status) q.where({ status: p.status });
  if (p.q)
    q.where((b) =>
      b
        .whereLike("name", `%${p.q.slice(0, 100)}%`)
        .orWhereLike("phone", `%${p.q.slice(0, 100)}%`),
    );
  const [{ count }] = await q.clone().count("* as count");
  const pages = Math.ceil(Number(count) / 20);
  const page = Math.max(1, Math.min(Number(p.page) || 1, Math.max(1, pages)));
  const rows = await q
    .orderBy("createdAt", "desc")
    .limit(20)
    .offset((page - 1) * 20);
  const pageLink = (n: number) => {
    const s = new URLSearchParams(p);
    s.set("page", String(n));
    return `/admin/enquiries?${s}`;
  };
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">TURN INTEREST INTO CONVERSATIONS</p>
          <h1>Enquiries</h1>
          <p>{String(count)} enquiries · Customer information is private.</p>
        </div>
      </div>
      <form className="admin-search">
        <input
          aria-label="Search enquiries"
          name="q"
          defaultValue={p.q}
          placeholder="Search name or phone"
        />
        <select
          aria-label="Enquiry status"
          name="status"
          defaultValue={p.status || ""}
        >
          <option value="">All statuses</option>
          {["New", "Contacted", "Follow-up", "Closed"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="button maroon-button">Search</button>
      </form>
      <section className="admin-panel">
        {rows.map((e) => (
          <EnquiryEditor key={e.id} enquiry={e} />
        ))}
        {!rows.length && <p>No enquiries match your search.</p>}
      </section>
      {pages > 1 && (
        <nav className="pagination">
          {page > 1 && <Link href={pageLink(page - 1)}>← Previous</Link>}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages && <Link href={pageLink(page + 1)}>Next →</Link>}
        </nav>
      )}
      {user?.role === "owner" && <RetentionControl />}
    </>
  );
}
