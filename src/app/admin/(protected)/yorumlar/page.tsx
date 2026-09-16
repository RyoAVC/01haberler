import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { formatDateTr } from "@/lib/utils/formatDate";
import { listCommentsForModeration } from "@/server/services/commentService";
import { moderateComment, deleteCommentAction } from "@/server/actions/commentActions";

export default async function AdminCommentsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "comments:moderate")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const comments = await listCommentsForModeration();

  return (
    <div>
      <h1 className="font-serif text-headline-l">Yorumlar</h1>
      <div className="mt-6 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border border-line p-4 dark:border-line-dark">
            <div className="flex items-center justify-between">
              <p className="text-headline-s font-semibold">
                {comment.authorName} <span className="text-caption text-ink-secondary">({comment.authorEmail})</span>
              </p>
              <span className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{comment.status}</span>
            </div>
            <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
              {comment.article.title} — {formatDateTr(comment.createdAt)}
            </p>
            <p className="mt-2 text-body">{comment.body}</p>
            <div className="mt-3 flex gap-3 text-headline-s">
              {comment.status !== "APPROVED" && (
                <form action={moderateComment.bind(null, comment.id, "APPROVED")}>
                  <button type="submit" className="text-brand-red hover:underline">Onayla</button>
                </form>
              )}
              {comment.status !== "REJECTED" && (
                <form action={moderateComment.bind(null, comment.id, "REJECTED")}>
                  <button type="submit" className="hover:underline">Reddet</button>
                </form>
              )}
              <form action={deleteCommentAction.bind(null, comment.id)}>
                <button type="submit" className="text-ink-secondary hover:underline dark:text-ink-dark-secondary">Sil</button>
              </form>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-ink-secondary dark:text-ink-dark-secondary">Henüz yorum yok.</p>}
      </div>
    </div>
  );
}
