import { z } from "zod";

export const sourceInputSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).regex(/^[a-z0-9-]+$/),
  homepageUrl: z.string().url(),
  description: z.string().max(500).optional().nullable(),
  licenseNote: z.string().min(5, "Lisans/kullanim kosulu notu zorunludur").max(1000),
  isTrustedForAutoPublish: z.boolean().default(false),
  defaultCategoryId: z.string().optional().nullable(),
  defaultCity: z.string().max(80).optional().nullable(),
  onDeleteAction: z.enum(["KEEP_ARTICLES", "ARCHIVE_ARTICLES", "DELETE_ARTICLES"]).default("KEEP_ARTICLES"),
  isActive: z.boolean().default(true),
});

export const feedInputSchema = z.object({
  sourceId: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["RSS", "ATOM", "API"]).default("RSS"),
  categoryId: z.string().optional().nullable(),
  fetchIntervalMinutes: z.number().int().min(5).max(1440).default(15),
  isActive: z.boolean().default(true),
});

export type SourceInput = z.infer<typeof sourceInputSchema>;
export type FeedInput = z.infer<typeof feedInputSchema>;
