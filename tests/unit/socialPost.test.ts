import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

async function load() {
  const mod = await import("@/server/services/socialPostService");
  return mod.postToPlatform;
}

it("pendingPlatforms skips platforms already posted successfully", async () => {
  const { pendingPlatforms } = await import("@/server/services/socialPostService");
  const configs = [{ platform: "X" }, { platform: "FACEBOOK" }, { platform: "TELEGRAM" }];
  expect(pendingPlatforms(configs, ["X", "TELEGRAM"])).toEqual([{ platform: "FACEBOOK" }]);
  expect(pendingPlatforms(configs, [])).toEqual(configs);
  expect(pendingPlatforms(configs, ["X", "FACEBOOK", "TELEGRAM"])).toEqual([]);
});

it("X: posts a tweet and returns the tweet id", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { id: "999" } }) });
  vi.stubGlobal("fetch", fetcher);
  const postToPlatform = await load();
  const res = await postToPlatform("X", "Başlık https://x/haber/a", { accessToken: "tok", accountRef: null });
  expect(res).toEqual({ ok: true, externalId: "999" });
  const [url, init] = fetcher.mock.calls[0]!;
  expect(url).toBe("https://api.twitter.com/2/tweets");
  expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer tok" });
  expect(JSON.parse(String((init as RequestInit).body)).text).toBe("Başlık https://x/haber/a");
});

it("X: truncates messages longer than 280 characters", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { id: "1" } }) });
  vi.stubGlobal("fetch", fetcher);
  const postToPlatform = await load();
  await postToPlatform("X", "a".repeat(300), { accessToken: "tok", accountRef: null });
  const text = JSON.parse(String((fetcher.mock.calls[0]![1] as RequestInit).body)).text as string;
  expect(text.length).toBe(280);
  expect(text.endsWith("…")).toBe(true);
});

it("X: fails without a fetch call when the access token is missing", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const postToPlatform = await load();
  const res = await postToPlatform("X", "hi", { accessToken: null, accountRef: null });
  expect(res.ok).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});

it("X: surfaces the API error detail on failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ detail: "Unauthorized" }) }));
  const postToPlatform = await load();
  const res = await postToPlatform("X", "hi", { accessToken: "tok", accountRef: null });
  expect(res).toEqual({ ok: false, error: "Unauthorized" });
});

it("FACEBOOK: posts to the page feed and returns the post id", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "page_123" }) });
  vi.stubGlobal("fetch", fetcher);
  const postToPlatform = await load();
  const res = await postToPlatform("FACEBOOK", "Başlık https://x/a", { accessToken: "pgtok", accountRef: "42" });
  expect(res).toEqual({ ok: true, externalId: "page_123" });
  const [url, init] = fetcher.mock.calls[0]!;
  expect(url).toBe("https://graph.facebook.com/v21.0/42/feed");
  const body = new URLSearchParams(String((init as RequestInit).body));
  expect(body.get("message")).toBe("Başlık https://x/a");
  expect(body.get("access_token")).toBe("pgtok");
});

it("FACEBOOK: requires a page id", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const postToPlatform = await load();
  const res = await postToPlatform("FACEBOOK", "hi", { accessToken: "pgtok", accountRef: null });
  expect(res.ok).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});

it("FACEBOOK: surfaces the graph error message on failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { message: "Invalid token" } }) }));
  const postToPlatform = await load();
  const res = await postToPlatform("FACEBOOK", "hi", { accessToken: "bad", accountRef: "42" });
  expect(res).toEqual({ ok: false, error: "Invalid token" });
});
