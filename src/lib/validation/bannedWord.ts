import { z } from "zod";

export const bannedWordInputSchema = z.object({
  word: z.string().min(2).max(80).toLowerCase(),
  severity: z.enum(["BLOCK", "FLAG"]).default("FLAG"),
});

export type BannedWordInput = z.infer<typeof bannedWordInputSchema>;
