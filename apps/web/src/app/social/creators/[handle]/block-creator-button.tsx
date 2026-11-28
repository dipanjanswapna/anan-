"use client";

import { useEffect, useState } from "react";

export default function BlockCreatorButton({ handle }: { handle: string }) {
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/social/creators/${encodeURIComponent(handle)}`, { cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Sign in to manage blocked creators."); return response.json(); })
      .then(data => { if (active) setBlocked(Boolean(data.blocked)); })
      .catch(() => { if (active) setMessage("Sign in to block or unblock this creator."); });
    return () => { active = false; };
  }, [handle]);

  async function toggle() {
    setBusy(true);
    const response = await fetch(`/api/social/creators/${encodeURIComponent(handle)}`, {
      method: blocked ? "PATCH" : "POST",
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setBlocked(Boolean(data.blocked));
      setMessage(data.blocked ? "Creator blocked. Their posts will be hidden from your feed." : "Creator unblocked.");
    } else {
      setMessage(data.message ?? "Could not update block settings.");
    }
    setBusy(false);
  }

  return <div className="mt-5">
    <button type="button" disabled={busy} onClick={() => void toggle()} className="rounded-xl border border-[#e7dff0] px-4 py-2 text-sm font-bold text-[#75435e] disabled:opacity-50">
      {busy ? "Please wait…" : blocked ? "Unblock creator" : "Block creator"}
    </button>
    {message && <p role="status" className="mt-2 text-xs text-[#81758f]">{message}</p>}
  </div>;
}
