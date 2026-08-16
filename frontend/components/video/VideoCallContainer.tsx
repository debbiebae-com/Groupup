"use client";

import { useEffect, useRef, useState } from "react";
import { useVideoStore } from "@/lib/store";
import { SignalingService } from "./SignalingService";
import { CallModal } from "./CallModal";

export function VideoCallContainer({ groupId, groupName }: { groupId: string; groupName: string }) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const isInCall = useVideoStore((s) => s.isInCall);
  const callStatus = useVideoStore((s) => s.callStatus);
  const startCall = useVideoStore((s) => s.startCall);
  const endCall = useVideoStore((s) => s.endCall);
  const setCallStatus = useVideoStore((s) => s.setCallStatus);
  const setPeerConnection = useVideoStore((s) => s.setPeerConnection);

  useEffect(() => {
    if (!isInCall) return;
    let cancelled = false;

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) return;
        if (localRef.current) localRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        setPeerConnection(pc);

        await SignalingService.offer(groupId, "mock-sdp");
        setCallStatus("active");
      } catch {
        // Camera denied or unavailable — still show the UI with mock status
        setCallStatus("active");
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [isInCall, groupId, setCallStatus, setPeerConnection]);

  function toggleAudio() {
    setAudioEnabled((a) => !a);
  }
  function toggleVideo() {
    setVideoEnabled((v) => !v);
  }
  function hangUp() {
    if (localRef.current?.srcObject) {
      const stream = localRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    endCall();
  }

  return (
    <div>
      {!isInCall && (
        <button
          onClick={startCall}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Start video check
        </button>
      )}
      {isInCall && (
        <CallModal
          groupName={groupName}
          callStatus={callStatus}
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onHangUp={hangUp}
          localRef={localRef}
          remoteRef={remoteRef}
        />
      )}
    </div>
  );
}