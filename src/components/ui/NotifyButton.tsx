"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { subscribeToPush, unsubscribeFromMatch, getMatchSubscriptions } from "@/lib/pushClient";

export function NotifyButton({ matchId }: { matchId: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    // Check if already subscribed
    getMatchSubscriptions().then((matchIds) => {
      setSubscribed(matchIds.includes(matchId));
    });
  }, [matchId]);

  if (!supported) return null;

  async function toggle() {
    setLoading(true);
    try {
      if (subscribed) {
        const ok = await unsubscribeFromMatch(matchId);
        if (ok) setSubscribed(false);
      } else {
        const ok = await subscribeToPush(matchId);
        if (ok) setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={subscribed ? "Remove notification" : "Notify me 30 min before kickoff"}
      className={`p-1.5 rounded-lg transition-all ${
        subscribed
          ? "text-brand-500 bg-brand-500/10 hover:bg-brand-500/20"
          : "text-gray-400 hover:text-brand-500 hover:bg-brand-500/10"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="w-4 h-4 fill-brand-500" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
    </button>
  );
}
