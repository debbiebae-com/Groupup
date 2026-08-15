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
    <div className="flex justify-center gap-4">
      <button
        onClick={onToggleAudio}
        aria-label="Toggle audio"
        className={`flex h-12 w-12 items-center justify-center rounded-full border ${
          audioEnabled ? "border-border" : "border-swipe-reject text-swipe-reject"
        }`}
      >
        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
      <button
        onClick={onToggleVideo}
        aria-label="Toggle video"
        className={`flex h-12 w-12 items-center justify-center rounded-full border ${
          videoEnabled ? "border-border" : "border-swipe-reject text-swipe-reject"
        }`}
      >
        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>
      <button
        onClick={onHangUp}
        aria-label="Hang up"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-swipe-reject bg-swipe-reject text-white"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}