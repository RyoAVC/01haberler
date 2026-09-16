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

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("subscribed");
    if (Notification.permission === "denied") setStatus("denied");
  }, []);

  async function handleSubscribe() {
    if (!vapidPublicKey) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    await subscribeToPushAction(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }, navigator.userAgent);
    setStatus("subscribed");
  }

  if (status === "subscribed" || status === "unsupported" || !vapidPublicKey) return null;

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      className="fixed bottom-4 right-4 z-40 bg-brand-red px-4 py-2 text-headline-s text-white shadow-lg hover:bg-brand-red-dark print:hidden"
    >
      Bildirimlere İzin Ver
    </button>
  );
}
