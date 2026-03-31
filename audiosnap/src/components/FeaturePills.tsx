const pills = [
  { icon: '✓', label: 'Free', color: '#10b981' },
  { icon: '⚡', label: 'Fast', color: '#f59e0b' },
  { icon: '🎵', label: '320kbps', color: '#3b82f6' },
];

export default function FeaturePills() {
  return (
    <div className="feature-pills">
      {pills.map((p, i) => (
        <span key={p.label} className="feature-pills__pill" style={{ animationDelay: `${i * 80}ms` }}>
          <span className="feature-pills__dot" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}66` }} />
          {p.label}
        </span>
      ))}
    </div>
  );
}
