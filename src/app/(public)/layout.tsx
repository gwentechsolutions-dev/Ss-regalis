import { getSettings } from "@/lib/db";
import { Header, Footer, FloatingContact } from "@/components/public";
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
    </>
  );
}
