import './Skeleton.css';

/**
 * Lightweight skeleton block. Use as standalone `<Skeleton h={200} />`
 * or compose row/grid layouts (see helpers below).
 */
export function Skeleton({ w = '100%', h = 16, r = 8, style, className = '' }) {
  return (
    <span
      className={`sk ${className}`}
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="sk-card">
      <Skeleton h={140} r={12} />
      <Skeleton w="80%" h={14} style={{ marginTop: 10 }} />
      <Skeleton w="40%" h={14} style={{ marginTop: 6 }} />
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="sk-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="sk-row">
      <Skeleton w={56} h={56} r="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton w="60%" h={14} />
        <Skeleton w="40%" h={12} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="sk-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
