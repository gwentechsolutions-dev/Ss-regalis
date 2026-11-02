import Link from "next/link";
import { LoginForm } from "@/components/admin";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const p = await searchParams;
  return (
    <main id="main" className="login-page">
      <div className="login-brand">
        <Link href="/">
          <img src="/logo-hd.png" alt="SS Regalis Realty" />
        </Link>
        <p>Building Trust, Creating Value.</p>
        <Link href="/">← Back to website</Link>
      </div>
      <div className="login-content">
        <p className="eyebrow">SS REGALIS · ADMINISTRATION</p>
        <LoginForm resetToken={p.reset} />
      </div>
    </main>
  );
}

