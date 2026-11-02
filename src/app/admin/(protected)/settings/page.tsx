import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { SettingsEditor } from "@/components/admin";
export default async function Settings() {
  const user = await currentUser();
  if (user?.role !== "owner") redirect("/admin");
  const s = await getSettings();
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">THE DETAILS BEHIND YOUR BRAND</p>
          <h1>Business settings</h1>
          <p>Changes appear across the website as soon as they are saved.</p>
        </div>
      </div>
      <SettingsEditor settings={s} />
    </>
  );
}
