import { PropertyEditor } from "@/components/admin";
export default function New() {
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">GROW YOUR COLLECTION</p>
          <h1>Add a property</h1>
          <p>
            Start with the essentials. Save a draft until you’re ready to
            publish.
          </p>
        </div>
      </div>
      <PropertyEditor />
    </>
  );
}
