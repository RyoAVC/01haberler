import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { getModuleFlags, MODULE_LABELS, type ModuleKey } from "@/server/services/moduleFlagsService";
import { updateModuleFlags } from "@/server/actions/moduleFlagsActions";
import Link from "next/link";
import { newsroomModules } from "@/lib/softwareRelease";

export default async function AdminModulesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "modules:manage")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const flags = await getModuleFlags();
  const keys = Object.keys(MODULE_LABELS) as ModuleKey[];

  return (
    <div>
      <h1 className="font-serif text-headline-l">Modüller</h1>
      <section className="my-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Kurulu haber merkezi modülleri">{newsroomModules.map((module, i) => <Link href={module.href} key={module.title} className="module-card"><span className="eyebrow">{String(i + 1).padStart(2, "0")}</span><h2 className="my-2 font-serif text-headline-m">{module.title}</h2><p className="text-caption">{module.detail}</p></Link>)}</section>
      <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Aşağıdaki modülleri açıp kapatarak sitenin hangi ek özellikleri kullandığını kontrol edin.
      </p>

      <form action={updateModuleFlags} className="mt-6 max-w-md space-y-4">
        {keys.map((key) => (
          <label key={key} className="flex items-center justify-between border border-line px-4 py-3 dark:border-line-dark">
            <span className="text-headline-s">{MODULE_LABELS[key]}</span>
            <input type="checkbox" name={key} defaultChecked={flags[key]} className="h-5 w-5" />
          </label>
        ))}
        <button type="submit" className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
          Kaydet
        </button>
      </form>
    </div>
  );
}
