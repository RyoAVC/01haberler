"use client";

import { useEffect } from "react";

export function ArticleViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    navigator.sendBeacon?.(`/api/articles/${articleId}/view`);
  }, [articleId]);

  return null;
}
