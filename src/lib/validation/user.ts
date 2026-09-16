import { z } from "zod";

export const userInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(200),
  role: z.enum(["SUPER_ADMIN", "EDITOR", "AUTHOR"]),
});

export type UserInput = z.infer<typeof userInputSchema>;
