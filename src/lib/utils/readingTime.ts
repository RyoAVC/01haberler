const WORDS_PER_MINUTE = 200;

export function estimateReadingTimeMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
