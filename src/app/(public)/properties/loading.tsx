export default function Loading() {
  return (
    <div
      className="container section"
      role="status"
      aria-label="Loading properties"
    >
      <div className="skeleton skeleton-heading" />
      <div className="property-grid">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div className="skeleton skeleton-card" key={n} />
        ))}
      </div>
    </div>
  );
}
