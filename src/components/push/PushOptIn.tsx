"use client";

import { useEffect, useState } from "react";
import { subscribeToPushAction } from "@/server/actions/pushActions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushOptIn({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(localStorage.getItem("01h-push-dismissed") === "1"); } catch { /* Storage may be unavailable. */ }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.getRegistration("/sw.js").then(registration => registration?.pushManager.getSubscription()).then(subscription => {
      if (subscription) setStatus("subscribed");
    }).catch(() => setError("Bildirim durumu şu anda kontrol edilemiyor."));
    if (Notification.permission === "denied") setStatus("denied");
  }, []);

  async function handleSubscribe() {
    if (!vapidPublicKey || busy) return;
    setBusy(true); setError("");
    try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus(permission === "denied" ? "denied" : "idle");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    await subscribeToPushAction(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }, navigator.userAgent);
    setStatus("subscribed");
    } catch { setError("Abonelik tamamlanamadı. Lütfen yeniden deneyin."); }
    finally { setBusy(false); }
  }

  if (status === "unsupported" || !vapidPublicKey) return null;

  return (
    <section id="bildirim-tercihleri" className="container-page py-6 print:hidden" aria-label="Bildirim tercihleri">
      <details open={!dismissed} className="rounded-xl border border-line p-5 dark:border-line-dark">
        <summary className="cursor-pointer text-headline-s">Haber bildirimleri · Tercihlerinizi yönetin</summary>
        <p className="mt-3 text-caption text-ink-secondary dark:text-ink-dark-secondary">Önemli haberler için bu tarayıcıda bildirim alabilirsiniz. İzin yalnızca aşağıdaki düğmeye bastığınızda istenir.</p>
        {status === "denied" ? <p className="mt-3 text-caption">Bildirimler tarayıcınızda engelli. İsterseniz site izinlerinden değiştirebilirsiniz.</p>
          : status === "subscribed" ? <p className="mt-3 text-caption">Bu tarayıcıda bildirim aboneliğiniz var. Kapatmak için tarayıcınızın site izinlerini kullanabilirsiniz.</p>
          : <button type="button" onClick={handleSubscribe} disabled={busy} className="mt-4 rounded-full bg-brand-red px-5 py-2 text-caption text-white disabled:opacity-50">{busy ? "Abonelik hazırlanıyor…" : "Bildirimleri aç"}</button>}
        {error && <p role="alert" className="mt-2 text-caption text-brand-red">{error}</p>}
        <button type="button" className="ml-4 mt-4 text-caption underline" onClick={e => { setDismissed(true); try { localStorage.setItem("01h-push-dismissed", "1"); } catch { /* Preference remains for this view. */ } e.currentTarget.closest("details")?.removeAttribute("open"); }}>Şimdilik kapat</button>
      </details>
    </section>
  );
}
