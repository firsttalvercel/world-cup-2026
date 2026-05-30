"use client";

const SESSION_KEY = "wc2026_session_id";

export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "anon";
  }
}

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function subscribeToPush(matchId: string): Promise<boolean> {
  try {
    const reg = await registerServiceWorker();
    if (!reg) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        matchId,
        sessionId: getSessionId(),
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function unsubscribeFromMatch(matchId: string): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker?.getRegistration("/sw.js");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;

    const res = await fetch("/api/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, matchId }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function getMatchSubscriptions(): Promise<string[]> {
  try {
    const reg = await navigator.serviceWorker?.getRegistration("/sw.js");
    if (!reg) return [];
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return [];

    const res = await fetch(`/api/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.matchIds ?? [];
  } catch {
    return [];
  }
}
