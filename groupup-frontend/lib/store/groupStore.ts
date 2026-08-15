"use client";

import { create } from "zustand";
import type { Group } from "@/types/api";

interface GroupState {
  activeGroup: Group | null;
  members: Group["members"];
  setActiveGroup: (group: Group | null) => void;
  addMember: (userId: string) => void;
  clearGroup: () => void;
}

export const useGroupStore = create<GroupState>()((set, get) => ({
  activeGroup: null,
  members: [],
  setActiveGroup: (group) =>
    set({ activeGroup: group, members: group?.members ?? [] }),
  addMember: (userId) =>
    set({
      members: [
        ...get().members,
        { userId, joinedAt: new Date().toISOString() },
      ],
    }),
  clearGroup: () => set({ activeGroup: null, members: [] }),
}));
