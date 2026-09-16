import { z } from "zod";

export const adInputSchema = z.object({
  name: z.string().min(2).max(120),
  slotKey: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  provider: z.enum(["ADSENSE", "GOOGLE_AD_MANAGER", "MANUAL"]),
  placement: z.enum([
    "HEADER_BELOW",
    "HOME_BELOW_HERO",
    "IN_FEED",
    "ARTICLE_AFTER_LEAD",
    "ARTICLE_MID_BODY",
    "ARTICLE_END",
    "SIDEBAR",
    "FOOTER_ABOVE",
    "STICKY_BOTTOM",
  ]),
  publisherId: z.string().max(60).optional().nullable(),
  adUnitSlotId: z.string().max(60).optional().nullable(),
  isResponsive: z.boolean().default(true),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  targetUrl: z.string().url().optional().nullable(),
  headline: z.string().max(120).optional().nullable(),
  showOnDesktop: z.boolean().default(true),
  showOnTablet: z.boolean().default(true),
  showOnMobile: z.boolean().default(true),
  categoryScope: z.string().optional().nullable(),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(false),
});

export type AdInput = z.infer<typeof adInputSchema>;
