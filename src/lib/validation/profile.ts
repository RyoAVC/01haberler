import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().min(2).max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut parolanızı girin"),
    newPassword: z.string().min(8, "Yeni parola en az 8 karakter olmalı"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Yeni parola ve tekrarı eşleşmiyor",
    path: ["confirmPassword"],
  });
