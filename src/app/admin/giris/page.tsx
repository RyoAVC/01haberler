"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AvcHaberSoftBrand } from "@/components/ui/BrandMark";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Giriş başarısız");
      return;
    }

    const next = searchParams.get("next") || "/admin";
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm border border-line p-8 dark:border-line-dark">
      <h1 className="font-serif text-headline-l">01 Haberler — Yönetim</h1>
      <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
        Devam etmek için giriş yapın.
      </p>

      {error && (
        <p role="alert" className="mt-4 border border-brand-red px-3 py-2 text-headline-s text-brand-red">
          {error}
        </p>
      )}

      <label className="mt-6 block text-headline-s">
        E-posta
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        />
      </label>

      <label className="mt-4 block text-headline-s">
        Parola
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full bg-brand-red px-4 py-2.5 text-headline-s text-white hover:bg-brand-red-dark disabled:opacity-60"
      >
        {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="admin-shell dark">
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-surface p-4 text-ink dark:bg-surface-dark dark:text-ink-dark">
        <Suspense>
          <LoginForm />
        </Suspense>
        <AvcHaberSoftBrand />
      </div>
    </div>
  );
}
