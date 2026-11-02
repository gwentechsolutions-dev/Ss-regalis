import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="empty-state">
      <p className="eyebrow">404 · A DIFFERENT DIRECTION</p>
      <h1>This space isn’t available.</h1>
      <p>
        The page may have moved, or the property may no longer be published.
      </p>
      <Link className="button maroon-button" href="/properties">
        Explore properties ↗
      </Link>
    </main>
  );
}
