import { parsePublicationSchedule } from "./publicationSchedule";
export type HeadlineWindow = { startAt: string | null; endAt: string | null };
export function headlineWindow(start: string, end: string): HeadlineWindow {
  const startAt = parsePublicationSchedule(start), endAt = parsePublicationSchedule(end);
  if (startAt && endAt && endAt <= startAt) throw new Error("Bitiş zamanı başlangıçtan sonra olmalı.");
  return { startAt: startAt?.toISOString() ?? null, endAt: endAt?.toISOString() ?? null };
}
export function activeHeadlineIds(ids: string[], windows: HeadlineWindow[] = [], now = Date.now()) {
  return ids.map((id, i) => {
    const w = windows[i];
    if (!w) return id;
    if (w.startAt && !(Date.parse(w.startAt) <= now)) return "";
    if (w.endAt && !(Date.parse(w.endAt) > now)) return "";
    return id;
  });
}
