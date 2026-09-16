interface Point {
  date: Date;
  viewCount: number;
}

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];

export function TrafficChart({ data }: { data: Point[] }) {
  const width = 560;
  const height = 160;
  const padding = 24;
  const max = Math.max(1, ...data.map((d) => d.viewCount));

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.viewCount / max) * (height - padding * 2);
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-brand-red" role="img" aria-label="7 günlük görüntülenme trendi">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.15} />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
      {points.map((p) => (
        <circle key={p.date.toISOString()} cx={p.x} cy={p.y} r={3} fill="currentColor" />
      ))}
      {points.map((p) => (
        <text
          key={`label-${p.date.toISOString()}`}
          x={p.x}
          y={height - 6}
          textAnchor="middle"
          fontSize={10}
          className="fill-current text-ink-secondary dark:text-ink-dark-secondary"
        >
          {DAY_LABELS[p.date.getDay()]}
        </text>
      ))}
    </svg>
  );
}
