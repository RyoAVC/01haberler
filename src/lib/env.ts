import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("01 Haberler"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  COOKIE_NAME: z.string().default("01h_session"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  UPLOAD_DIR: z.string().default("./public/uploads"),
  MAX_UPLOAD_MB: z
    .string()
    .default("5")
    .transform((v) => Number(v)),
  IMAGE_ALLOWLIST_DOMAINS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  INGESTION_CONCURRENCY: z
    .string()
    .default("2")
    .transform((v) => Number(v)),
  INGESTION_DEFAULT_INTERVAL_MINUTES: z
    .string()
    .default("15")
    .transform((v) => Number(v)),
  INGESTION_REQUEST_TIMEOUT_MS: z
    .string()
    .default("10000")
    .transform((v) => Number(v)),
  INGESTION_USER_AGENT: z.string().default("01HaberlerBot/1.0"),
  ADSENSE_PUBLISHER_ID: z.string().default(""),
  ADSENSE_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  GAM_NETWORK_CODE: z.string().default(""),
  GA_MEASUREMENT_ID: z.string().default(""),
  AI_SUMMARY_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  AI_SUMMARY_PROVIDER: z.string().default(""),
  AI_SUMMARY_API_KEY: z.string().default(""),
  PEXELS_API_KEY: z.string().default(""),
  CRON_SECRET: z.string().min(16).optional(),
  VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default("mailto:admin@01haberler.com"),
});

export const env = envSchema.parse(process.env);
