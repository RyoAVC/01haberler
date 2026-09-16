import { describe, it, expect } from "vitest";
import { assertPublicHttpUrl, UnsafeUrlError } from "@/lib/security/ssrf";

describe("assertPublicHttpUrl", () => {
  it("rejects localhost", async () => {
    await expect(assertPublicHttpUrl("http://localhost:5432/")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects loopback IP addresses", async () => {
    await expect(assertPublicHttpUrl("http://127.0.0.1/admin")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects private network ranges", async () => {
    await expect(assertPublicHttpUrl("http://10.0.0.5/")).rejects.toThrow(UnsafeUrlError);
    await expect(assertPublicHttpUrl("http://192.168.1.1/")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects the cloud metadata address", async () => {
    await expect(assertPublicHttpUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects non-http(s) protocols", async () => {
    await expect(assertPublicHttpUrl("file:///etc/passwd")).rejects.toThrow(UnsafeUrlError);
    await expect(assertPublicHttpUrl("ftp://example.com/feed")).rejects.toThrow(UnsafeUrlError);
  });

  it("rejects malformed URLs", async () => {
    await expect(assertPublicHttpUrl("not a url")).rejects.toThrow(UnsafeUrlError);
  });

  it("allows a public IP address", async () => {
    await expect(assertPublicHttpUrl("http://8.8.8.8/feed.xml")).resolves.toBeInstanceOf(URL);
  });
});
