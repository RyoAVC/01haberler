import { expect, it } from "vitest";
import { isRetryableStatus } from "@/lib/utils/aiRetry";

it("retries on rate limit and server errors", () => {
  expect(isRetryableStatus(429)).toBe(true);
  expect(isRetryableStatus(500)).toBe(true);
  expect(isRetryableStatus(503)).toBe(true);
});

it("does not retry on permanent client errors", () => {
  expect(isRetryableStatus(400)).toBe(false); // invalid request
  expect(isRetryableStatus(401)).toBe(false); // invalid key
  expect(isRetryableStatus(403)).toBe(false); // API not enabled
  expect(isRetryableStatus(404)).toBe(false); // unknown model
});
