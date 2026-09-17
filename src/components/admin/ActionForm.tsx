"use client";
import { startTransition, useActionState, type ReactNode } from "react";
export type FormResult = { error?: string; success?: string };
export function ActionForm({ action, children, className = "module-form" }: { action: (state: FormResult, form: FormData) => Promise<FormResult>; children: ReactNode; className?: string }) {
  const [state, submit, pending] = useActionState(async (state: FormResult, form: FormData) => {
    try { return await action(state, form); } catch { return { error: "İşlem tamamlanamadı. Formunuz korunuyor; daha sonra tekrar deneyin." }; }
  }, {});
  return <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(() => submit(form)); }} className={className}><fieldset disabled={pending} className="min-w-0 space-y-4">{children}</fieldset>{pending && <p role="status">Kaydediliyor…</p>}{state.error && <p role="alert" className="text-brand-red">{state.error}</p>}{state.success && <p role="status">{state.success}</p>}</form>;
}
