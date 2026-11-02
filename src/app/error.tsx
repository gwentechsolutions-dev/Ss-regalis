"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-state">
      <h1>We couldn’t load this page.</h1>
      <p>Please try again in a moment.</p>
      <button className="button maroon-button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
