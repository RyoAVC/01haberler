import { expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/seo/serializeJsonLd";
it("prevents editorial text from closing a JSON-LD script without changing its value", () => {
  const input = { headline: '</script><script>alert("x")</script> Türkçe haber' };
  const output = serializeJsonLd(input);
  expect(output).not.toContain("<"); expect(JSON.parse(output)).toEqual(input);
});
