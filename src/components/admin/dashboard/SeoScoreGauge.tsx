import type { SeoIssue } from "@/server/services/seoScoreService";

export function SeoScoreGauge({ score, issues }: { score: number; issues: SeoIssue[] }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const label = score >= 80 ? "İyi" : score >= 50 ? "Orta" : "Düşük";

  return (
    <section className="border border-line p-4 dark:border-line-dark">
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" width={72} height={72} role="img" aria-label={`SEO skoru ${score}`}>
          <circle cx={50} cy={50} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={10} />
          <circle
            cx={50}
            cy={50}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform="rotate(-90 50 50)"
            className="text-brand-red"
          />
          <text x={50} y={55} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily="var(--font-mono)" className="fill-current">
            {score}
          </text>
        </svg>
        <div>
          <p className="font-serif text-headline-m">SEO Skoru</p>
          <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{label}</p>
        </div>
      </div>
      {issues.length > 0 && (
        <div className="mt-4">
          <p className="text-meta font-semibold uppercase tracking-wide text-ink-secondary dark:text-ink-dark-secondary">
            İyileştirme Alanları
          </p>
          <ul className="mt-2 space-y-1 text-headline-s">
            {issues.map((issue) => (
              <li key={issue.label} className="flex items-center justify-between">
                <span>{issue.label}</span>
                <span className="text-brand-red">{issue.count} adet</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
