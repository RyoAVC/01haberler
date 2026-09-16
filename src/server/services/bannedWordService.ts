import { prisma } from "@/lib/db";

/**
 * BLOCK siddetindeki yasakli kelimeler haberin yayinlanmasini engeller;
 * FLAG siddetindekiler yalniza denetim kaydina not dusup kaydetmeye izin verir.
 */
export async function findBannedWordMatches(
  text: string
): Promise<{ blocking: string[]; flagged: string[] }> {
  const words = await prisma.bannedWord.findMany();
  if (words.length === 0) return { blocking: [], flagged: [] };

  const normalized = text.toLowerCase();
  const blocking: string[] = [];
  const flagged: string[] = [];

  for (const entry of words) {
    const pattern = new RegExp(`\\b${escapeRegExp(entry.word.toLowerCase())}\\b`);
    if (pattern.test(normalized)) {
      if (entry.severity === "BLOCK") blocking.push(entry.word);
      else flagged.push(entry.word);
    }
  }

  return { blocking, flagged };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
