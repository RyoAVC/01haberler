"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AvcHaberSoftBrand } from "@/components/ui/BrandMark";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: "",
    items: [{ href: "/admin", label: "Genel Bakış" }],
  },
  {
    label: "İçerik",
    items: [
      { href: "/admin/haberler", label: "Haberler" },
      { href: "/admin/vitrin", label: "Ana Sayfa Vitrini" },
      { href: "/admin/medya", label: "Medya Merkezi" },
      { href: "/admin/dosyalar", label: "Konu / Yerel / Canlı" },
      { href: "/admin/yazarlar", label: "Yazar Profilleri" },
      { href: "/admin/basvurular", label: "İhbar ve Düzeltmeler" },
      { href: "/admin/kategoriler", label: "Kategoriler" },
      { href: "/admin/etiketler", label: "Etiketler" },
      { href: "/admin/yorumlar", label: "Yorumlar" },
      { href: "/admin/anketler", label: "Anketler" },
    ],
  },
  {
    label: "Otomasyon",
    items: [
      { href: "/admin/kaynaklar", label: "Kaynaklar" },
      { href: "/admin/operasyon", label: "Operasyon Merkezi" },
      { href: "/admin/bildirimler", label: "Bildirimler" },
      { href: "/admin/bulten", label: "E-posta Bülteni" },
      { href: "/admin/sosyal-otomasyon", label: "Sosyal Otomasyon" },
      { href: "/admin/yonlendirmeler", label: "Yönlendirmeler" },
      { href: "/admin/reklamlar", label: "Reklamlar" },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { href: "/admin/kullanicilar", label: "Kullanıcılar" },
      { href: "/admin/denetim-kaydi", label: "Denetim Kaydı" },
      { href: "/admin/yasakli-kelimeler", label: "Yasaklı Kelimeler" },
      { href: "/admin/menu", label: "Menü ve Footer" },
      { href: "/admin/moduller", label: "Modüller" },
      { href: "/admin/surumler", label: "Sürümler" },
      { href: "/admin/ayarlar", label: "Ayarlar" },
    ],
  },
];

export function AdminNav({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/giris");
    router.refresh();
  }

  return (
    <aside className="w-full shrink-0 border-line dark:border-line-dark md:w-56 md:border-r">
      <div className="p-4">
        <p className="font-serif text-headline-m">01 Haberler</p>
        <Link href="/admin/profil" className="block text-caption text-ink-secondary hover:text-brand-red dark:text-ink-dark-secondary">
          {userName} · {userRole}
        </Link>
      </div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="admin-navigation" className="mx-4 mb-4 rounded border border-line px-4 py-2 text-caption md:hidden">{open ? "Menüyü kapat" : "Yönetim menüsünü aç"}</button>
      <nav id="admin-navigation" className={`${open ? "flex" : "hidden"} flex-col border-t border-line dark:border-line-dark md:flex`}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label || "root"}>
            {group.label && (
              <p className="px-4 pt-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">{group.label}</p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block border-l-2 px-4 py-2.5 text-headline-s transition-colors ${
                    active
                      ? "border-brand-red bg-brand-red/10 text-brand-red"
                      : "border-transparent hover:bg-surface-dark-raised dark:hover:bg-surface-dark-raised"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 border-t border-line px-4 py-3 text-left text-headline-s text-brand-red dark:border-line-dark"
        >
          Çıkış Yap
        </button>
      </nav>
      <div className="border-t border-line p-4 dark:border-line-dark">
        <AvcHaberSoftBrand />
        <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">altyapısıyla çalışmaktadır</p>
      </div>
    </aside>
  );
}
