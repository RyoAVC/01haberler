export interface EditorTextDraft { title: string; excerpt: string; contentHtml: string; metaTitle: string; metaDescription: string }
export interface StoredEditorDraft { value: EditorTextDraft; savedAt: string }
export function parseEditorDraft(raw: string | null, now = Date.now()): StoredEditorDraft | null {
  if (!raw || raw.length > 600000) return null;
  try {
    const data = JSON.parse(raw) as StoredEditorDraft;
    const time = Date.parse(data.savedAt);
    if (!Number.isFinite(time) || time > now + 60000 || now - time > 86400000) return null;
    for (const key of ["title", "excerpt", "contentHtml", "metaTitle", "metaDescription"] as const) if (typeof data.value?.[key] !== "string") return null;
    return data;
  } catch { return null; }
}
