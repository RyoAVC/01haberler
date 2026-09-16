import { slugify } from "./slug";

const STOPWORDS = new Set([
  "ve", "veya", "ile", "bir", "bu", "su", "da", "de", "ki", "mi", "mu", "mı", "mü",
  "icin", "gibi", "olan", "olarak", "cok", "daha", "en", "ama", "fakat", "ancak",
  "ise", "diye", "kadar", "sonra", "once", "yeni", "eski", "tum", "her", "hic",
]);

function significantTokens(title: string): Set<string> {
  return new Set(
    slugify(title)
      .split("-")
      .filter((token) => token.length >= 4 && !STOPWORDS.has(token))
  );
}

/**
 * Iki başlığın Jaccard benzerligini dondurur (0-1). Ayni gercek olayi
 * kapsayan farkli kaynak basliklarini eslestirmek icin kullanilir.
 */
export function titleSimilarity(a: string, b: string): { score: number; sharedTokens: number } {
  const tokensA = significantTokens(a);
  const tokensB = significantTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return { score: 0, sharedTokens: 0 };

  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared += 1;
  }

  const union = tokensA.size + tokensB.size - shared;
  return { score: union === 0 ? 0 : shared / union, sharedTokens: shared };
}
