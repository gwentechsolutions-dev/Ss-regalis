import { notFound } from "next/navigation";
import { getProperty } from "@/lib/db";
import { PropertyEditor } from "@/components/admin";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = await getProperty((await params).id, true);
  if (!p) notFound();
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">PROPERTY DETAILS</p>
          <h1>Edit property</h1>
          <p>
            {p.title} · Version {p.version}
          </p>
        </div>
      </div>
      <PropertyEditor property={p} />
    </>
  );
}
