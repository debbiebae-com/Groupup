"use client";

import { useEffect, useState } from "react";
import type { Message } from "@/types/api";
import { getMessages, sendMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { MessageBubble } from "./MessageBubble";

export function GroupChat({ groupId }: { groupId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    getMessages(groupId).then((res) => setMessages(res.messages));
  }, [groupId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const res = await sendMessage({ groupId, content: draft.trim() });
    setMessages((m) => [...m, res.message]);
    setDraft("");
  }

  return (
    <div className="flex flex-col">
      <div className="h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isOwn={m.senderId === userId} />
          ))
        )}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Send
        </button>
      </form>
    </div>
  );
}