/** Unknown and future source timestamps require editorial review. */
export function validSourceDate(date: Date | null, now = new Date()): Date | null {
  return date && Number.isFinite(date.getTime()) && date.getTime() <= now.getTime() && date.getUTCFullYear() >= 1990 ? date : null;
}
export function isFeedDue(
  feed: { lastFetchedAt: Date | null; fetchIntervalMinutes: number; consecutiveFailures?: number },
  now = Date.now()
) {
  if (!feed.lastFetchedAt) return true;
  // Ust uste hatalarda ustel backoff (en fazla 8x): surekli hata veren kirik
  // kaynagi her turda zorlamak yerine daha seyrek dener.
  const failures = Math.max(0, feed.consecutiveFailures ?? 0);
  const multiplier = Math.min(8, 2 ** failures);
  const effectiveMs = Math.max(1, feed.fetchIntervalMinutes) * multiplier * 60000;
  return now - feed.lastFetchedAt.getTime() >= effectiveMs;
}
