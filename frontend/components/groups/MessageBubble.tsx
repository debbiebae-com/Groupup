import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/types/api";

export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 ${isOwn ? "rounded-br-md bg-[#e74d6d] text-white" : "rounded-bl-md bg-[#f4f1ef] text-[#49423e]"}`}>
        <p className="whitespace-pre-wrap break-words text-xs leading-5">{message.content}</p>
        <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${isOwn ? "text-white/70" : "text-[#a29a96]"}`}>
          <span>{time}</span>{isOwn && <CheckCheck className="h-3 w-3" />}{!isOwn && <Check className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}
