import { z } from "zod";
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Adres yalnızca küçük Latin harfleri, sayı ve tire içerebilir.").max(100);
export const collectionSchema = z.object({
  kind: z.enum(["konu", "yerel", "canli"]), slug: slugSchema,
  title: z.string().trim().min(3).max(160), summary: z.string().trim().min(10).max(4000),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
  city: z.string().trim().max(80).default(""), district: z.string().trim().max(80).default(""),
  people: z.string().trim().max(1000).default(""),
  articleIds: z.array(z.string().min(1).max(100)).max(100).transform(ids => [...new Set(ids)]),
}).superRefine((v, ctx) => { if (v.kind === "yerel" && !v.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Yerel dosya için şehir gerekli." }); });
export type NewsCollection = z.infer<typeof collectionSchema>;
export const liveEntrySchema = z.object({
  collection: slugSchema, title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(3).max(6000), pinned: z.boolean(),
  sourceUrl: z.string().trim().max(2000).refine(v => !v || /^https?:\/\//i.test(v) && URL.canParse(v), "Geçerli bir http/https kaynak adresi girin."),
  correction: z.string().trim().max(500).default(""),
  publishedAt: z.string().datetime(),
});
export type LiveEntry = z.infer<typeof liveEntrySchema>;
export const submissionSchema = z.object({
  kind: z.enum(["TIP", "CORRECTION"]), name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254), title: z.string().trim().min(5).max(180),
  message: z.string().trim().min(20).max(5000),
  articleUrl: z.string().trim().max(2000).refine(v => !v || /^https?:\/\//i.test(v) && URL.canParse(v), "Geçersiz haber bağlantısı."),
  consent: z.literal(true, { errorMap: () => ({ message: "İletişim verilerinin işlenmesine ilişkin açıklamayı onaylayın." }) }),
});
export function lines(value: FormDataEntryValue | null) { return String(value ?? "").split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean); }
export const COLLECTION_PREFIX = "newsroom.collection.";
export const ENTRY_PREFIX = "newsroom.entry.";
