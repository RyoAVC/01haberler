import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { checkLicense } from "@/server/services/licenseService";
import { saveLicenseAction } from "@/server/actions/licenseActions";

export default async function AdminLicenseDetailPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "license:view-hidden")) {
    return <p className="text-headline-s text-brand-red">Bu sayfayı görüntüleme yetkiniz yok.</p>;
  }

  const { license } = await checkLicense();

  return (
    <div>
      <h1 className="font-serif text-headline-l">Lisans Detayı</h1>
      <p className="mt-1 max-w-measure text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Bu sayfa yalnızca SUPER_ADMIN için görünürdür ve navigasyonda linki yoktur. Lisans doğrulaması şu an pasiftir; kayıt burada tutulur ama hiçbir sayfayı kısıtlamaz.
      </p>

      <form action={saveLicenseAction.bind(null, license?.id ?? null)} className="mt-6 grid max-w-lg gap-3">
        <label className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Lisans Anahtarı
          <input name="licenseKey" defaultValue={license?.licenseKey} required className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
        <label className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Lisans Sahibi (yasal)
          <input name="ownerLegalName" defaultValue={license?.ownerLegalName} required className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
        <label className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Ürün Adı
          <input name="productName" defaultValue={license?.productName ?? "AvcHaberSoft"} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
        <label className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Verildiği Kişi/Kurum
          <input name="issuedTo" defaultValue={license?.issuedTo ?? ""} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
        <label className="text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Domain
          <input name="domain" defaultValue={license?.domain ?? ""} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
        <label className="flex items-center gap-2 text-headline-s">
          <input type="checkbox" name="isActive" defaultChecked={license?.isActive} className="h-4 w-4" /> Aktif (şu an hiçbir kontrol noktasından okunmuyor)
        </label>
        <button type="submit" className="bg-brand-red px-4 py-2 text-white hover:bg-brand-red-dark sm:w-fit">Kaydet</button>
      </form>
    </div>
  );
}
