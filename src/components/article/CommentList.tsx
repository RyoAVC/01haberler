import { formatDateTr } from "@/lib/utils/formatDate";
import { getApprovedCommentsForArticle } from "@/server/services/commentService";

export async function CommentList({ articleId }: { articleId: string }) {
  const comments = await getApprovedCommentsForArticle(articleId);

  if (comments.length === 0) {
    return <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Henüz yorum yapılmamış.</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="border-t border-line pt-4 dark:border-line-dark">
          <p className="text-headline-s font-semibold">{comment.authorName}</p>
          <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{formatDateTr(comment.createdAt)}</p>
          <p className="mt-2 text-body">{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}
