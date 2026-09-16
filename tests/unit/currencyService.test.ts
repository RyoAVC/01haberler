import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
it("compares to the provider date's previous day and deduplicates requests", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ date: "2026-09-11", rates: { USD: 2, TRY: 100 } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ date: "2026-09-10", rates: { USD: 2, TRY: 80 } }) });
  vi.stubGlobal("fetch", fetcher);
  const { getCurrencyRates } = await import("@/server/services/currencyService");
  const [a, b] = await Promise.all([getCurrencyRates(), getCurrencyRates()]);
  expect(a).toEqual(b); expect(a?.usdTryChangePct).toBe(25);
  expect(fetcher.mock.calls[1]?.[0]).toContain("2026-09-10"); expect(fetcher).toHaveBeenCalledTimes(2);
});
it("does not represent same-date data as a daily change", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ date: "2026-09-11", rates: { USD: 2, TRY: 100 } }) }));
  const { getCurrencyRates } = await import("@/server/services/currencyService");
  expect((await getCurrencyRates())?.usdTryChangePct).toBeNull();
});
it("handles outages without fake zero prices or repeated provider requests", async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error("offline")); vi.stubGlobal("fetch", fetcher);
  const { getCurrencyRates } = await import("@/server/services/currencyService");
  expect(await getCurrencyRates()).toBeNull(); expect(await getCurrencyRates()).toBeNull(); expect(fetcher).toHaveBeenCalledTimes(1);
});
