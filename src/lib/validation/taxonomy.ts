import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Sadece kucuk harf, rakam ve tire"),
  description: z.string().max(300).optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
});

export const tagInputSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;
