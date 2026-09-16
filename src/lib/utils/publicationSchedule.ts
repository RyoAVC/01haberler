export function parsePublicationSchedule(value: string): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Geçerli bir yayın zamanı girin.");
  const date = new Date(`${value}:00+03:00`);
  if (!Number.isFinite(date.getTime()) || formatPublicationSchedule(date) !== value) throw new Error("Geçerli bir yayın zamanı girin.");
  return date;
}
export function formatPublicationSchedule(date: Date | null): string {
  return date ? new Date(date.getTime() + 3 * 3600000).toISOString().slice(0, 16) : "";
}
