"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, BellOff } from "lucide-react";

const SESSION_KEY = "wc2026_session_id";
const SUBS_KEY = "wc2026_notify_subs";
const ENDPOINT_KEY = "wc2026_push_endpoint";

function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch { return "anon"; }
}

function getSavedSubs(): string[] {
  try { return JSON.parse(localStorage.getItem(SUBS_KEY) ?? "[]"); }
  catch { return []; }
}
function saveSub(matchId: string) {
  try {
    const s = getSavedSubs();
    if (!s.includes(matchId)) localStorage.setItem(SUBS_KEY, JSON.stringify([...s, matchId]));
  } catch {}
}
function removeSub(matchId: string) {
  try { localStorage.setItem(SUBS_KEY, JSON.stringify(getSavedSubs().filter((id) => id !== matchId))); }
  catch {}
}
function getStoredEndpoint(): string | null {
  try { return localStorage.getItem(ENDPOINT_KEY); } catch { return null; }
}
function storeEndpoint(endpoint: string) {
  try { localStorage.setItem(ENDPOINT_KEY, endpoint); } catch {}
}

function base64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

type Status = "idle" | "loading" | "subscribed" | "denied" | "unsupported" | "error";

export function NotifyButton({ matchId }: { matchId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (!("Notification" in window)) { setStatus("unsupported"); return; }
    if (Notification.permission === "denied") { setStatus("denied"); return; }
    if (getSavedSubs().includes(matchId)) setStatus("subscribed");
  }, [matchId]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(t);
  }, [message]);

  if (status === "unsupported") return null;

  async function toggle() {
    if (status === "loading") return;

    if (status === "denied") {
      const isIOS = /iphone|ipad/i.test(navigator.userAgent);
      const isAndroid = /android/i.test(navigator.userAgent);
      if (isIOS) {
        setMessage("iOS: Settings → Safari → Advanced → Website Data — or add this site to your Home Screen first.");
      } else if (isAndroid) {
        setMessage("Tap the lock icon in your browser address bar → Notifications → Allow, then try again.");
      } else {
        setMessage("Click the lock icon in the address bar → Notifications → Allow, then try again.");
      }
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      // --- Unsubscribe ---
      if (status === "subscribed") {
        const endpoint = getStoredEndpoint();
        if (endpoint) {
          await fetch("/api/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint, matchId }),
          });
        }
        removeSub(matchId);
        setStatus("idle");
        setMessage("Notification removed.");
        return;
      }

      // --- Subscribe ---
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("denied");
        setMessage("Notifications blocked. Enable them in browser settings.");
        return;
      }
      if (permission !== "granted") {
        setStatus("idle");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { setStatus("error"); setMessage("Config error — please try again later."); return; }

      // Get or create push subscription
      let pushSub = await reg.pushManager.getSubscription();
      if (!pushSub) {
        pushSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(publicKey),
        });
      }

      const json = pushSub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      storeEndpoint(json.endpoint);

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
        setMessage("Done! You'll get notified for kickoff, goals, red cards and full time.");
      } else {
        setStatus("error");
        setMessage("Failed to subscribe. Tap to retry.");
      }
    } catch (e) {
      console.error("Push error:", e);
      setStatus("error");
      setMessage("Something went wrong. Tap to retry.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={status === "loading"}
        title={
          status === "subscribed" ? "Tap to remove notifications" :
          status === "denied" ? "Tap for help" :
          "Get notified: kickoff, goals, red cards, full time"
        }
        className={`p-1.5 rounded-lg transition-all active:scale-95 ${
          status === "subscribed"
            ? "text-brand-500 bg-brand-500/10 hover:bg-brand-500/20"
            : status === "denied"
            ? "text-amber-500 bg-amber-500/10"
            : status === "error"
            ? "text-red-400 bg-red-500/10"
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

      {message && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-[150px] text-right leading-tight animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}
