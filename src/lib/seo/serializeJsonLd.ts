/** Keep editorial text inside the JSON script element, even if it contains HTML. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
