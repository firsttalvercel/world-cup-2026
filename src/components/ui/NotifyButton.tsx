"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, BellOff } from "lucide-react";

const SESSION_KEY = "wc2026_session_id";
const SUBS_KEY = "wc2026_notify_subs";

function getSessionId(): string {
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

function getSavedSubs(): string[] {
  try {
    const s = localStorage.getItem(SUBS_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveSub(matchId: string) {
  try {
    const subs = getSavedSubs();
    if (!subs.includes(matchId)) {
      localStorage.setItem(SUBS_KEY, JSON.stringify([...subs, matchId]));
    }
  } catch {}
}

function removeSub(matchId: string) {
  try {
    const subs = getSavedSubs().filter((id) => id !== matchId);
    localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
  } catch {}
}

type Status = "idle" | "loading" | "subscribed" | "denied" | "unsupported" | "error";

export function NotifyButton({ matchId }: { matchId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    const subs = getSavedSubs();
    if (subs.includes(matchId)) setStatus("subscribed");
  }, [matchId]);

  if (status === "unsupported") return null;

  async function toggle() {
    if (status === "loading") return;
    setStatus("loading");

    try {
      if (status === "subscribed") {
        // Unsubscribe
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (sub) {
          await fetch("/api/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint, matchId }),
          });
        }
        removeSub(matchId);
        setStatus("idle");
        return;
      }

      // Register SW
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === "denied") { setStatus("denied"); return; }
      if (permission !== "granted") { setStatus("idle"); return; }

      // Subscribe
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { setStatus("error"); return; }

      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = atob(base64);
      const arr = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);

      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: arr.buffer,
      });

      const json = pushSub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          matchId,
          sessionId: getSessionId(),
        }),
      });

      if (res.ok) {
        saveSub(matchId);
        setStatus("subscribed");
      } else {
        setStatus("error");
      }
    } catch (e) {
      console.error("Push subscription error:", e);
      setStatus("error");
    }
  }

  const titles: Record<Status, string> = {
    idle: "Notify me 30 min before kickoff",
    subscribed: "Subscribed — click to remove",
    denied: "Notifications blocked in browser settings",
    error: "Failed — click to retry",
    loading: "...",
    unsupported: "",
  };

  return (
    <button
      onClick={toggle}
      disabled={status === "loading" || status === "denied"}
      title={titles[status]}
      className={`p-1.5 rounded-lg transition-all ${
        status === "subscribed"
          ? "text-brand-500 bg-brand-500/10 hover:bg-brand-500/20"
          : status === "denied"
          ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          : status === "error"
          ? "text-red-400 hover:bg-red-500/10"
          : "text-gray-400 hover:text-brand-500 hover:bg-brand-500/10"
      }`}
    >
      {status === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === "subscribed" ? (
        <Bell className="w-4 h-4 fill-brand-500" />
      ) : status === "denied" ? (
        <BellOff className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
    </button>
  );
}
