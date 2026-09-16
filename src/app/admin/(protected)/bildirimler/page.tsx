import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendManualPushAction } from "@/server/actions/pushActions";

export default async function AdminPushPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "push:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const subscriberCount = await prisma.pushSubscription.count();
  const vapidConfigured = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

  return (
    <div>
      <h1 className="font-serif text-headline-l">Push Bildirimleri</h1>
      <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
        {subscriberCount} abone. {!vapidConfigured && "VAPID anahtarları ayarlanmadığı için gönderim çalışmaz."}
      </p>

      <form action={sendManualPushAction} className="mt-6 grid max-w-md gap-3">
        <input name="title" placeholder="Başlık" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        <textarea name="body" placeholder="Mesaj" required rows={3} className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        <input name="url" placeholder="Bağlantı (opsiyonel, /haber/...)" className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        <button type="submit" disabled={!vapidConfigured} className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark disabled:opacity-50 sm:w-fit">
          Gönder
        </button>
      </form>
    </div>
  );
}
