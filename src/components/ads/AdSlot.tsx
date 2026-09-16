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

  const visibilityClass = [
    !ad.showOnMobile && "hidden sm:block",
    !ad.showOnTablet && "sm:hidden lg:block",
    !ad.showOnDesktop && "lg:hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`my-4 w-full ${visibilityClass}`}>
      <AdUnit ad={ad} adsenseEnabled={adsenseEnabled} publisherId={publisherId} eager={eager} />
    </div>
  );
}
