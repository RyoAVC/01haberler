import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveAuthorProfile } from "@/server/actions/authorProfileActions";
export default async function AuthorsAdmin() {
  const user = await getCurrentUser(); if (!user) return null;
  const authors = await prisma.author.findMany({ where: hasPermission(user.role, "users:manage") ? {} : { userId: user.id }, orderBy: { name: "asc" }, take: 200 });
  const settings = await prisma.siteSetting.findMany({ where: { key: { in: authors.map(a => `author_expertise_${a.id}`) } } });
  return <div className="space-y-5"><h1 className="font-serif text-headline-l">Yazar profilleri</h1><p>Biyografi ve uzmanlıklar yazarın herkese açık sayfasında görünür. Hesap e-postası paylaşılmaz.</p>
    {[...authors, ...(!authors.some(a => a.userId === user.id) ? [null] : [])].map(a => <ActionForm key={a?.id ?? "new"} action={saveAuthorProfile}><h2 className="font-serif text-headline-m">{a?.name ?? "Kendi profilimi oluştur"}</h2><input name="id" type="hidden" value={a?.id ?? ""} /><input name="expected" type="hidden" value={a?.updatedAt.toISOString() ?? ""} /><label>Ad soyad<input name="name" required maxLength={120} defaultValue={a?.name ?? user.name} /></label><label>Adres<input name="slug" required readOnly={!!a} defaultValue={a?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} /></label><label>Biyografi<textarea name="bio" rows={4} defaultValue={a?.bio ?? ""} maxLength={4000} /></label><label>Uzmanlık alanları<input name="expertise" defaultValue={String(settings.find(s => s.key === `author_expertise_${a?.id}`)?.value ?? "")} maxLength={500} /></label><button className="module-button">Profili kaydet</button>{a && <Link className="ml-4 underline" href={`/yazar/${a.slug}`}>Yazar sayfası ↗</Link>}</ActionForm>)}
  </div>;
}
