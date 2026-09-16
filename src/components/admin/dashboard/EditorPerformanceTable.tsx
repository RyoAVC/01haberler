interface Row {
  userId: string;
  name: string;
  role: string;
  editCount: number;
}

export function EditorPerformanceTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Son 30 günde düzenleme yok.</p>;
  }

  const max = Math.max(...rows.map((r) => r.editCount));

  return (
    <table className="w-full text-headline-s">
      <thead>
        <tr className="border-b border-line text-left text-meta uppercase text-ink-secondary dark:border-line-dark dark:text-ink-dark-secondary">
          <th className="py-2 pr-4">Editör</th>
          <th className="py-2 pr-4">Düzenleme</th>
          <th className="py-2 pr-4">Performans</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.userId} className="border-b border-line dark:border-line-dark">
            <td className="py-2 pr-4">
              {row.name}
              <span className="ml-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">{row.role}</span>
            </td>
            <td className="py-2 pr-4 font-mono">{row.editCount}</td>
            <td className="py-2 pr-4">
              <div className="h-2 w-24 bg-line dark:bg-line-dark">
                <div className="h-2 bg-brand-red" style={{ width: `${(row.editCount / max) * 100}%` }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
