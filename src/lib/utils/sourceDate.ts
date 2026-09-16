/** Unknown and future source timestamps require editorial review. */
export function validSourceDate(date: Date | null, now = new Date()): Date | null {
  return date && Number.isFinite(date.getTime()) && date.getTime() <= now.getTime() && date.getUTCFullYear() >= 1990 ? date : null;
}
export function isFeedDue(feed: { lastFetchedAt: Date | null; fetchIntervalMinutes: number }, now = Date.now()) {
  return !feed.lastFetchedAt || now - feed.lastFetchedAt.getTime() >= Math.max(1, feed.fetchIntervalMinutes) * 60000;
}
