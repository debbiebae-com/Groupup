"use client";

import { CallControls } from "./CallControls";

export function CallModal({
  groupName,
  callStatus,
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onHangUp,
  localRef,
  remoteRef,
}: {
  groupName: string;
  callStatus: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onHangUp: () => void;
  localRef: React.RefObject<HTMLVideoElement | null>;
  remoteRef: React.RefObject<HTMLVideoElement | null>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="font-medium">{groupName}</p>
            <p className="text-xs opacity-70">Verified Student ✓ · {callStatus}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="aspect-video w-full rounded-lg bg-zinc-800"
          />
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full rounded-lg bg-zinc-800"
          />
        </div>

        <div className="mt-6">
          <CallControls
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            onHangUp={onHangUp}
          />
        </div>
      </div>
    </div>
  );
}