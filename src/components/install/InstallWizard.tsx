"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvcHaberSoftBrand } from "@/components/ui/BrandMark";
import { completeInstallation, type CompleteInstallationInput } from "@/server/actions/installActions";

const STEPS = ["Hoş Geldiniz", "Site Ayarları", "Yönetici Hesabı", "Tamamlandı"] as const;

export function InstallWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CompleteInstallationInput>({
    siteName: "",
    siteMetaDescription: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    const result = await completeInstallation(form);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep(3);
  }

  return (
    <div className="border border-line p-6 dark:border-line-dark">
      <div className="mb-6 flex justify-center">
        <AvcHaberSoftBrand size="lg" />
      </div>
      <p className="text-center text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Adım {step + 1} / {STEPS.length} — {STEPS[step]}
      </p>

      {step === 0 && (
        <div className="mt-6 space-y-4 text-center">
          <p className="text-headline-s">Kurulum sihirbazına hoş geldiniz. Birkaç adımda siteniz kullanıma hazır olacak.</p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="bg-brand-red px-5 py-2.5 text-headline-s text-white hover:bg-brand-red-dark"
          >
            Başla
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-6 space-y-4">
          <label className="block text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Site Adı
            <input
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              required
              className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
            />
          </label>
          <label className="block text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Site Açıklaması (SEO)
            <textarea
              value={form.siteMetaDescription}
              onChange={(e) => setForm({ ...form, siteMetaDescription: e.target.value })}
              rows={3}
              className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
            />
          </label>
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!form.siteName}
            className="bg-brand-red px-5 py-2.5 text-headline-s text-white hover:bg-brand-red-dark disabled:opacity-50"
          >
            Devam Et
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-4">
          <label className="block text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Ad Soyad
            <input
              value={form.adminName}
              onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              required
              className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
            />
          </label>
          <label className="block text-caption text-ink-secondary dark:text-ink-dark-secondary">
            E-posta
            <input
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              required
              className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
            />
          </label>
          <label className="block text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Şifre (en az 8 karakter)
            <input
              type="password"
              value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              required
              minLength={8}
              className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
            />
          </label>
          {error && <p className="text-caption text-brand-red">{error}</p>}
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting || !form.adminName || !form.adminEmail || form.adminPassword.length < 8}
            className="bg-brand-red px-5 py-2.5 text-headline-s text-white hover:bg-brand-red-dark disabled:opacity-50"
          >
            {submitting ? "Kuruluyor..." : "Kurulumu Tamamla"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 space-y-4 text-center">
          <p className="text-headline-s">Kurulum tamamlandı. Yönetici hesabınızla giriş yapabilirsiniz.</p>
          <button
            type="button"
            onClick={() => router.push("/admin/giris")}
            className="bg-brand-red px-5 py-2.5 text-headline-s text-white hover:bg-brand-red-dark"
          >
            Giriş Sayfasına Git
          </button>
        </div>
      )}
    </div>
  );
}
