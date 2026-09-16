import { prisma } from "@/lib/db";

export async function getActivePoll() {
  const now = new Date();
  const poll = await prisma.poll.findFirst({
    where: {
      isActive: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    include: { options: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { votes: true } } } } },
  });
  return poll;
}

export async function castVote(pollId: string, optionId: string, ipHash: string): Promise<{ error?: string }> {
  try {
    await prisma.pollVote.create({ data: { pollId, optionId, ipHash } });
    return {};
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
      return { error: "Bu ankete zaten oy kullandınız" };
    }
    throw err;
  }
}
