import { prisma } from "@/lib/db";
import type { AdPlacement, Prisma } from "@prisma/client";

export type ActiveAd = Prisma.AdvertisementGetPayload<{ include: { imageMedia: true } }>;

export async function getActiveAdForPlacement(
  placement: AdPlacement,
  categorySlug?: string
): Promise<ActiveAd | null> {
  const now = new Date();
  const ads = await prisma.advertisement.findMany({
    where: {
      placement,
      isActive: true,
      OR: [{ startAt: null }, { startAt: { lte: now } }],
      AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    include: { imageMedia: true },
    orderBy: { priority: "desc" },
  });

  if (ads.length === 0) return null;

  const scoped = categorySlug
    ? ads.filter((ad) => !ad.categoryScope || ad.categoryScope === categorySlug)
    : ads.filter((ad) => !ad.categoryScope);

  return scoped[0] ?? ads.find((ad) => !ad.categoryScope) ?? null;
}
