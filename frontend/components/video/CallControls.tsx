"use client";

import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

export function CallControls({
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onHangUp,
}: {
  audioEnabled: boolean;
  videoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onHangUp: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button onClick={onToggleAudio} aria-label="Toggle audio" className={`grid h-12 w-12 place-items-center rounded-full border transition ${audioEnabled ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-white bg-white text-[#403637]"}`}>
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
      <button onClick={onToggleVideo} aria-label="Toggle video" className={`grid h-12 w-12 place-items-center rounded-full border transition ${videoEnabled ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-white bg-white text-[#403637]"}`}>
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>
      <button onClick={onHangUp} aria-label="Hang up" className="grid h-12 w-12 place-items-center rounded-full bg-[#ea5268] text-white shadow-lg transition hover:bg-[#d83c58]">
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}
