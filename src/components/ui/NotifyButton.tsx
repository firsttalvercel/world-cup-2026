"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2 } from "lucide-react";

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
function base64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

type Status = "idle" | "loading" | "subscribed" | "unavailable";

export function NotifyButton({ matchId }: { matchId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    // Only hide if Notification API is completely absent (very old browser)
    if (!("Notification" in window)) {
      setStatus("unavailable");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("unavailable");
      return;
    }
    if (getSavedSubs().includes(matchId)) setStatus("subscribed");
  }, [matchId]);

  if (status === "unavailable") return null;

  async function subscribe() {
    setStatus("loading");
    try {
      // Request permission first
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("idle");
        return;
      }

      // Push subscription (requires service worker + PushManager)
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // Permission granted but no push support — save locally so bell turns on
        saveSub(matchId);
        setStatus("subscribed");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        saveSub(matchId);
        setStatus("subscribed");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let pushSub = await reg.pushManager.getSubscription();
      if (!pushSub) {
        pushSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToBuffer(publicKey),
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

      if (res.ok) { saveSub(matchId); setStatus("subscribed"); }
      else { saveSub(matchId); setStatus("subscribed"); } // still mark locally
    } catch (e) {
      console.error("Push error:", e);
      setStatus("idle");
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
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
    } catch {
      setStatus("subscribed");
    }
  }

  return (
    <button
      onClick={() => {
        if (status === "loading") return;
        if (status === "subscribed") unsubscribe();
        else subscribe();
      }}
      disabled={status === "loading"}
      title={status === "subscribed" ? "Remove notification" : "Get match notifications"}
      className={`p-1.5 rounded-lg transition-all active:scale-95 ${
        status === "subscribed"
          ? "text-brand-500 bg-brand-500/10 hover:bg-brand-500/20"
          : "text-gray-400 hover:text-brand-500 hover:bg-brand-500/10"
      }`}
    >
      {status === "loading"
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Bell className={`w-4 h-4 ${status === "subscribed" ? "fill-brand-500" : ""}`} />
      }
    </button>
  );
}
