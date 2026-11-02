import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  House,
  MessageSquare,
  Settings,
  ArrowUpRight,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { Logout } from "@/components/admin";
export default async function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await currentUser();
  if (!u) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <img src="/logo-hd.png" alt="SS Regalis Realty" />
          <span>
            SS REGALIS<small>PROPERTY MANAGEMENT</small>
          </span>
        </Link>
        <nav>
          {[
            ["/admin", "Overview", LayoutDashboard],
            ["/admin/properties", "Properties", House],
            ["/admin/enquiries", "Enquiries", MessageSquare],
            ...(u.role === "owner"
              ? [["/admin/settings", "Business settings", Settings]]
              : []),
          ].map(([href, label, Icon]) => {
            const I = Icon as typeof House;
            return (
              <Link key={String(href)} href={String(href)}>
                <I size={18} />
                {String(label)}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/">
            View website <ArrowUpRight size={16} />
          </Link>
          <small>{u.email}</small>
          <Logout />
        </div>
      </aside>
      <main id="main" className="admin-main">
        {children}
      </main>
    </div>
  );
}

