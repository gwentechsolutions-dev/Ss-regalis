import { getSettings } from "@/lib/db";
import { Header, Footer, FloatingContact } from "@/components/public";
import ScrollMotion from '@/components/scroll-motion';
export const dynamic = "force-dynamic";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSettings();
  return (
    <>
      <Header settings={s} />
      <main id="main">{children}</main>
      <Footer settings={s} />
      <FloatingContact settings={s} />
      <ScrollMotion />
    </>
  );
}
