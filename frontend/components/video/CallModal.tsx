"use client";

import { BadgeCheck, MoreHorizontal, Signal } from "lucide-react";
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#171113]/90 p-3 backdrop-blur-xl sm:p-6">
      <div className="w-full max-w-[950px] overflow-hidden rounded-[28px] border border-white/10 bg-[#272023] shadow-[0_35px_120px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between px-5 py-4 sm:px-7">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/45">Roommate check-in</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em] text-white">{groupName}</h2></div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-white/70"><Signal className="h-3.5 w-3.5 text-[#72d8aa]" /> {callStatus}</div>
        </div>
        <div className="grid gap-3 px-3 sm:grid-cols-[1.35fr_0.65fr] sm:px-5">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#171315]">
            <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
            <div className="absolute inset-0 grid place-items-center text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-white/65"><BadgeCheck className="h-6 w-6" /></span><p className="mt-3 text-xs font-semibold text-white/70">Waiting for someone to join</p><p className="mt-1 text-[10px] text-white/35">Your group will appear here.</p></div></div>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">Group room</span>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#45383d] sm:aspect-auto">
            <video ref={localRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="absolute inset-0 grid place-items-center"><div className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-2xl font-bold text-white/75">You</div></div>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">You</span>
            <button aria-label="More call options" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 px-5 pb-5 pt-5 sm:pb-7"><CallControls audioEnabled={audioEnabled} videoEnabled={videoEnabled} onToggleAudio={onToggleAudio} onToggleVideo={onToggleVideo} onHangUp={onHangUp} /><p className="text-[9px] text-white/35">Demo call experience · Remember, you can always leave whenever you like.</p></div>
      </div>
    </div>
  );
}
