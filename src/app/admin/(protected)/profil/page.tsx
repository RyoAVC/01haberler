import { getCurrentUser } from "@/lib/auth/session";
import { NameForm, PasswordForm } from "@/components/admin/ProfileForms";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Süper Yönetici",
  EDITOR: "Editör",
  AUTHOR: "Yazar",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="font-serif text-headline-l">Profilim</h1>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          {user.email} · {ROLE_LABEL[user.role] ?? user.role}
        </p>
      </div>

      <section>
        <h2 className="font-serif text-headline-m">Ad Soyad</h2>
        <div className="mt-3">
          <NameForm currentName={user.name} />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-headline-m">Parola Değiştir</h2>
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Parolanızı değiştirdiğinizde diğer tüm oturumlarınız (varsa) sonlandırılır.
        </p>
        <div className="mt-3">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
