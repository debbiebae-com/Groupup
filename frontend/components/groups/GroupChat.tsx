"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, LoaderCircle, MessageCircle, Smile } from "lucide-react";
import type { Message } from "@/types/api";
import { getMessages, sendMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { getSocket } from "@/lib/socket/client";
import { MessageBubble } from "./MessageBubble";

export function GroupChat({ groupId }: { groupId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.user?.id);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function load() {
      try {
        const response = await getMessages(groupId);
        if (!cancelled) setMessages(response.messages);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Messages couldn't load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const socket = getSocket(useAuthStore.getState().token);
    if (socket) {
      socket.on("message", (event: { groupId: string }) => {
        if (event.groupId === groupId) void load();
      });
      socket.connect();
      void load();
    } else {
      void load();
      interval = setInterval(() => void load(), 5000);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (socket) socket.off("message");
    };
  }, [groupId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await sendMessage({ groupId, content: draft.trim() });
      setMessages((current) => [...current, response.message]);
      setDraft("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your message couldn't be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[390px] flex-col">
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[#faf8f6] px-3.5 py-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0f2] text-[#d94368]"><MessageCircle className="h-4 w-4" /></span>
        <div><p className="text-[11px] font-bold text-[#514a46]">A private space for your group</p><p className="mt-0.5 text-[9px] text-[#98908b]">Say hi, share a link, make a plan.</p></div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-[#f0ece9] bg-[#fffdfc] p-3.5 sm:p-4">
        {loading ? (
          <div className="flex h-full min-h-[130px] items-center justify-center text-xs text-[#928b87]"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading the conversation…</div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f6efff] text-[#8e5ac3]"><Smile className="h-5 w-5" /></span><p className="mt-3 text-xs font-bold text-[#5a534f]">A fresh little corner.</p><p className="mt-1 text-[10px] text-[#98908b]">Send the first hello to your group.</p></div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} isOwn={message.senderId === userId} />)
        )}
        <div ref={endRef} />
      </div>
      {error && <p role="alert" className="mt-2 text-[10px] text-[#b8424e]">{error}</p>}
      <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-full border border-[#eee8e4] bg-white p-1.5 pl-4 shadow-sm focus-within:border-[#e9a0ae]">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Write a little something…" className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none placeholder:text-[#aaa29e]" />
        <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e74d6d] text-white transition hover:bg-[#d63e60] disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
