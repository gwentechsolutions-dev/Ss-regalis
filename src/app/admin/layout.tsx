export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  if (databaseFreeDemo()) return <main className="container section"><h1>Demo website</h1><p>Admin editing is unavailable in this demonstration. Listings are sample content.</p><Link href="/">Back to website</Link></main>;
  return children;
}
import Link from 'next/link';
import { databaseFreeDemo } from '@/lib/demo';
