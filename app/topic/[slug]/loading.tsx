export default function Loading() {
  return (
    <div className="dossier" aria-busy="true" aria-label="Loading topic">
      <span className="skeleton-bar" style={{ width: 64, marginBottom: 56 }} />
      <span className="skeleton-bar" style={{ width: 60 }} />
      <span className="skeleton-bar skeleton-title" />
      {[100, 96, 100, 72].map((w, i) => (
        <span key={i} className="skeleton-bar skeleton-line" style={{ width: `${w}%` }} />
      ))}
      <div className="relations">
        <span className="skeleton-bar" style={{ width: 80 }} />
        <span className="skeleton-bar" style={{ width: 80 }} />
      </div>
    </div>
  );
}
