import { z } from "zod";

export const articleStatusEnum = z.enum([
  "FETCHED",
  "PENDING_REVIEW",
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

export const articleInputSchema = z.object({
  title: z.string().min(5, "Baslik en az 5 karakter olmali").max(200),
  excerpt: z.string().min(10, "Spot en az 10 karakter olmali").max(500),
  contentHtml: z.string().min(20, "Icerik cok kisa"),
  categoryId: z.string().min(1, "Kategori secin"),
  tagIds: z.array(z.string()).default([]),
  authorId: z.string().optional().nullable(),
  coverMediaId: z.string().optional().nullable(),
  coverImageAlt: z.string().max(200).optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  district: z.string().max(80).optional().nullable(),
  status: articleStatusEnum.default("DRAFT"),
  isBreaking: z.boolean().default(false),
  breakingStartAt: z.coerce.date().optional().nullable(),
  breakingEndAt: z.coerce.date().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isEditorsPick: z.boolean().default(false),
  scheduledAt: z.coerce.date().optional().nullable(),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
