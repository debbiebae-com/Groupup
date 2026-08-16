"use client";

import { create } from "zustand";

export type CallStatus = "idle" | "connecting" | "active" | "ended";

interface VideoState {
  isInCall: boolean;
  peerConnection: RTCPeerConnection | null;
  remoteStream: MediaStream | null;
  callStatus: CallStatus;
  setCallStatus: (status: CallStatus) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  startCall: () => void;
  endCall: () => void;
}

export const useVideoStore = create<VideoState>()((set) => ({
  isInCall: false,
  peerConnection: null,
  remoteStream: null,
  callStatus: "idle",

  setCallStatus: (callStatus) =>
    set({
      callStatus,
      isInCall: callStatus === "connecting" || callStatus === "active",
    }),

  setPeerConnection: (peerConnection) => set({ peerConnection }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),

  startCall: () => set({ isInCall: true, callStatus: "connecting" }),
  endCall: () =>
    set({
      isInCall: false,
      callStatus: "ended",
      remoteStream: null,
      peerConnection: null,
    }),
}));
