interface Slice {
  name: string;
  count: number;
}

const COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d",
];

export function CategoryDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Henüz veri yok.</p>;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 160 160" width={140} height={140} role="img" aria-label="Kategori dağılımı">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={radius} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={20} />
          {data.map((d, i) => {
            const fraction = d.count / total;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={d.name}
                r={radius}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={20}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return circle;
          })}
        </g>
      </svg>
      <ul className="space-y-1 text-headline-s">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span>{d.name}</span>
            <span className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
              %{Math.round((d.count / total) * 100)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
