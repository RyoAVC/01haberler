import { expect, it } from "vitest";
import { resolveIngestedArticleStatus } from "@/lib/utils/ingestPublish";

const base = { autoPublishEligible: true, hasValidSourceDate: true, aiEditSucceeded: true };

it("publishes directly when the source is eligible, dated, and AI-edited", () => {
  expect(resolveIngestedArticleStatus(base)).toBe("PUBLISHED");
});

it("keeps articles in review when the source is not auto-publish eligible", () => {
  expect(resolveIngestedArticleStatus({ ...base, autoPublishEligible: false })).toBe("PENDING_REVIEW");
});

it("keeps articles in review when the source date is missing or invalid", () => {
  expect(resolveIngestedArticleStatus({ ...base, hasValidSourceDate: false })).toBe("PENDING_REVIEW");
});

it("keeps articles in review when the AI edit did not succeed (or was blocked)", () => {
  expect(resolveIngestedArticleStatus({ ...base, aiEditSucceeded: false })).toBe("PENDING_REVIEW");
});
