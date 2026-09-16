import { prisma } from "@/lib/db";

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function incrementTodayViewCount(): Promise<void> {
  const date = startOfDay(new Date());
  await prisma.dailyStat.upsert({
    where: { date },
    update: { viewCount: { increment: 1 } },
    create: { date, viewCount: 1 },
  });
}

export async function getLastNDaysStats(days: number): Promise<{ date: Date; viewCount: number }[]> {
  const since = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));
  const rows = await prisma.dailyStat.findMany({ where: { date: { gte: since } }, orderBy: { date: "asc" } });

  const byDate = new Map(rows.map((r) => [r.date.getTime(), r.viewCount]));
  const result: { date: Date; viewCount: number }[] = [];
  for (let i = 0; i < days; i++) {
    const date = startOfDay(new Date(since.getTime() + i * 24 * 60 * 60 * 1000));
    result.push({ date, viewCount: byDate.get(date.getTime()) ?? 0 });
  }
  return result;
}

export async function getTodayViewCount(): Promise<number> {
  const date = startOfDay(new Date());
  const row = await prisma.dailyStat.findUnique({ where: { date } });
  return row?.viewCount ?? 0;
}
