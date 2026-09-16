import sanitizeHtml from "sanitize-html";

/** Suppress only an entire duplicate summary; never trim substantive paragraphs or media. */
export function bodyWithoutDuplicateSummary(html: string, excerpt: string): string {
  if (/<(?:img|figure|video|audio|iframe|table|a)\b/i.test(html)) return html;
  const normalize = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
  const summary = normalize(excerpt);
  return summary && normalize(html) === summary ? "" : html;
}
