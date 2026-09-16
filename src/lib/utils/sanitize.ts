import sanitizeHtml from "sanitize-html";

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "blockquote", "ul", "ol", "li",
      "h2", "h3", "h4", "a", "img", "figure", "figcaption", "table", "thead",
      "tbody", "tr", "td", "th",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow ugc" }, true),
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
  });
}
