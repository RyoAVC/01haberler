import { getActiveAdForPlacement } from "@/server/services/adService";
import { AdUnit } from "@/components/ads/AdUnit";
import type { AdPlacement } from "@prisma/client";

export async function AdSlot({
  placement,
  categorySlug,
  eager = false,
}: {
  placement: AdPlacement;
  categorySlug?: string;
  eager?: boolean;
}) {
  const ad = await getActiveAdForPlacement(placement, categorySlug);
  if (!ad) return null;

  const adsenseEnabled = process.env.ADSENSE_ENABLED === "true";
  const publisherId = process.env.ADSENSE_PUBLISHER_ID ?? "";
  if (ad.provider === "ADSENSE" && (!adsenseEnabled || !publisherId || !ad.adUnitSlotId)) return null;
  if (ad.provider === "MANUAL" && !ad.imageMedia?.url && !ad.headline?.trim()) return null;

  const visibilityClass = [
    ad.showOnMobile ? "block" : "hidden",
    ad.showOnTablet ? "sm:block" : "sm:hidden",
    ad.showOnDesktop ? "lg:block" : "lg:hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`my-4 w-full ${visibilityClass}`}>
      <AdUnit ad={ad} adsenseEnabled={adsenseEnabled} publisherId={publisherId} eager={eager} />
    </div>
  );
}
