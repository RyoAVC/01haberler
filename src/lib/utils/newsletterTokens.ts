import { createHmac, timingSafeEqual } from "node:crypto";
export function newsletterToken(key: string, nonce: string, intent: "confirm" | "unsubscribe", secret: string) {
  return createHmac("sha256", secret).update(`${intent}:${key}:${nonce}`).digest("hex");
}
export function validNewsletterToken(token: string, expected: string) {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(expected)) return false;
  return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
}
