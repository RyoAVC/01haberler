import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/AdminNav";
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Süper Yönetici",
  EDITOR: "Editör",
  AUTHOR: "Yazar",
};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/giris");

  return (
    <div className="admin-shell dark">
      <div className="flex min-h-screen flex-col bg-surface text-ink md:flex-row dark:bg-surface-dark dark:text-ink-dark">
        <AdminNav userName={user.name} userRole={ROLE_LABEL[user.role] ?? user.role} />
        <div className="min-w-0 flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
