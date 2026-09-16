import { prisma } from "@/lib/db";

export async function getReleaseNotes({ includeDrafts = false }: { includeDrafts?: boolean } = {}) {
  return prisma.releaseNote.findMany({
    where: includeDrafts ? undefined : { isDraft: false },
    orderBy: { releasedAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getReleaseNoteByVersion(version: string) {
  return prisma.releaseNote.findUnique({
    where: { version },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
}
