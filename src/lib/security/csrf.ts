import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_COOKIE = "01h_csrf";

export async function ensureCsrfCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE)?.value;
  if (existing) return existing;

  const token = randomBytes(24).toString("hex");
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
  });
  return token;
}

export async function verifyCsrf(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;
  const a = Buffer.from(headerToken);
  const b = Buffer.from(cookieToken);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
