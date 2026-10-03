"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Video } from "lucide-react";
import { useVideoStore } from "@/lib/store";
import { SignalingService } from "./SignalingService";
import { CallModal } from "./CallModal";

export function VideoCallContainer({ groupId, groupName }: { groupId: string; groupName: string }) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const isInCall = useVideoStore((state) => state.isInCall);
  const callStatus = useVideoStore((state) => state.callStatus);
  const startCall = useVideoStore((state) => state.startCall);
  const endCall = useVideoStore((state) => state.endCall);
  const setCallStatus = useVideoStore((state) => state.setCallStatus);
  const setPeerConnection = useVideoStore((state) => state.setPeerConnection);

  useEffect(() => {
    if (!isInCall) return;
    let cancelled = false;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;

        const connection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        stream.getTracks().forEach((track) => connection.addTrack(track, stream));
        setPeerConnection(connection);
        await SignalingService.offer(groupId, "mock-sdp");
        setCallStatus("active");
      } catch {
        // Keep the local demo UI usable if the browser has no camera or microphone.
        setCallStatus("active");
      }
    }

    void setup();
    return () => {
      cancelled = true;
    };
  }, [isInCall, groupId, setCallStatus, setPeerConnection]);

  function toggleAudio() {
    setAudioEnabled((enabled) => {
      streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !enabled; });
      return !enabled;
    });
  }

  function toggleVideo() {
    setVideoEnabled((enabled) => {
      streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !enabled; });
      return !enabled;
    });
  }

  function hangUp() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    useVideoStore.getState().peerConnection?.close();
    endCall();
  }

  return (
    <div>
      {!isInCall && (
        <button onClick={startCall} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#272023] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#42353a]">
          <Video className="h-4 w-4" /> Start video check
        </button>
      )}
      {isInCall && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#f8f5f3] p-3 text-[10px] leading-4 text-[#7f7772]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#df496b]"><Camera className="h-4 w-4" /></span>
          Camera preview is ready when your browser allows it. This local demo doesn&apos;t connect a remote caller yet.
          <CallModal groupName={groupName} callStatus={callStatus} audioEnabled={audioEnabled} videoEnabled={videoEnabled} onToggleAudio={toggleAudio} onToggleVideo={toggleVideo} onHangUp={hangUp} localRef={localRef} remoteRef={remoteRef} />
        </div>
      )}
    </div>
  );
}
