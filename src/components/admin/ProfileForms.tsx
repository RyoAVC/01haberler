"use client";

import { useState } from "react";
import { updateOwnName, changeOwnPassword } from "@/server/actions/profileActions";

export function NameForm({ currentName }: { currentName: string }) {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await updateOwnName(formData);
    if (result.error) setMessage({ type: "error", text: result.error });
    else if (result.success) setMessage({ type: "success", text: result.success });
  }

  return (
    <form action={handleSubmit} className="max-w-sm space-y-3">
      <label className="block text-headline-s">
        Ad Soyad
        <input
          name="name"
          defaultValue={currentName}
          required
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        />
      </label>
      {message && (
        <p className={message.type === "error" ? "text-headline-s text-brand-red" : "text-headline-s text-ink-secondary dark:text-ink-dark-secondary"}>
          {message.text}
        </p>
      )}
      <button type="submit" className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
        Kaydet
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await changeOwnPassword(formData);
    if (result.error) setMessage({ type: "error", text: result.error });
    else if (result.success) {
      setMessage({ type: "success", text: result.success });
      (document.getElementById("password-form") as HTMLFormElement | null)?.reset();
    }
  }

  return (
    <form id="password-form" action={handleSubmit} className="max-w-sm space-y-3">
      <label className="block text-headline-s">
        Mevcut Parola
        <input name="currentPassword" type="password" required autoComplete="current-password" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>
      <label className="block text-headline-s">
        Yeni Parola
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>
      <label className="block text-headline-s">
        Yeni Parola (Tekrar)
        <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>
      {message && (
        <p className={message.type === "error" ? "text-headline-s text-brand-red" : "text-headline-s text-ink-secondary dark:text-ink-dark-secondary"}>
          {message.text}
        </p>
      )}
      <button type="submit" className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark">
        Parolayı Güncelle
      </button>
    </form>
  );
}
