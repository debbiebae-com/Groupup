import { http, HttpResponse, delay } from "msw";
import type { Profile } from "@/types/api";
import { db } from "./db";

const LATENCY = 200;

export const handlers = [
  // AUTH
  http.get("/api/auth/me", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ user: db.currentUser });
  }),

  http.post("/api/auth/verify", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { email?: string };
    const email = body?.email ?? "";
    if (!/\.edu$/i.test(email)) {
      return HttpResponse.json({ error: "Not a .edu email" }, { status: 400 });
    }
    db.currentUser.verificationStatus = "VERIFIED";
    db.currentUser.tier = 2;
    return HttpResponse.json({
      token: `mock-jwt-${Date.now()}`,
      user: db.currentUser,
    });
  }),

  // PROFILES
  http.get("/api/profiles", async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const intent = url.searchParams.get("group_intent");
    const budgetMax = Number(url.searchParams.get("budget_max") ?? 0);
    const campus = url.searchParams.get("campus");

    let list = db.profiles;
    if (q) {
      list = list.filter((p) => p.displayName.toLowerCase().includes(q) || p.university.toLowerCase().includes(q));
    }
    if (intent) list = list.filter((p) => p.groupIntent === intent);
    if (budgetMax) list = list.filter((p) => p.budget.max <= budgetMax);
    if (campus) list = list.filter((p) => p.campus === campus);

    return HttpResponse.json({ profiles: list, total: list.length });
  }),

  http.get("/api/profiles/:id", async ({ params }) => {
    await delay(LATENCY);
    const profile = db.profiles.find((p) => p.id === params.id);
    if (!profile) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ profile });
  }),

  http.put("/api/profiles/me", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as Partial<Profile>;
    const idx = db.profiles.findIndex((p) => p.id === db.currentUser.id);
    const updated = { ...(idx >= 0 ? db.profiles[idx] : { id: db.currentUser.id }), ...body };
    if (idx >= 0) db.profiles[idx] = updated;
    else db.profiles.push(updated);
    return HttpResponse.json({ profile: updated });
  }),

  // SWIPE
  http.post("/api/swipe", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { targetProfileId?: string; action?: string };
    if (!body.targetProfileId || !body.action) {
      return HttpResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const isMatch = body.action === "LIKE" && Math.random() < 0.3;
    const matchId = isMatch ? `match_${Date.now()}` : undefined;
    if (isMatch) {
      const target = db.profiles.find((p) => p.id === body.targetProfileId);
      if (target) {
        db.matches.push({
          id: matchId!,
          profileId: target.id,
          matchedUserId: target.userId,
          createdAt: new Date().toISOString(),
          profile: target,
        });
      }
    }
    return HttpResponse.json({ isMatch, matchId });
  }),

  http.get("/api/matches", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ matches: db.matches });
  }),

  // GROUPS
  http.post("/api/groups", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { name?: string; memberUserIds?: string[] };
    const memberUserIds = body.memberUserIds ?? [];
    if (memberUserIds.length < 1) {
      return HttpResponse.json({ error: "Need at least 1 other member" }, { status: 400 });
    }
    const group = {
      id: `g_${Date.now()}`,
      name: body.name ?? "New Group",
      intent: "SOLO_NEW",
      members: [
        { userId: db.currentUser.id, joinedAt: new Date().toISOString() },
        ...memberUserIds.map((userId) => ({ userId, joinedAt: new Date().toISOString() })),
      ],
      createdAt: new Date().toISOString(),
    };
    db.groups.push(group);
    return HttpResponse.json({ group }, { status: 201 });
  }),

  http.get("/api/groups", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ groups: db.groups });
  }),

  // MESSAGES
  http.get("/api/messages", async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const list = db.messages.filter((m) => m.groupId === groupId);
    return HttpResponse.json({ messages: list });
  }),

  http.post("/api/messages", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { groupId?: string; content?: string };
    if (!body.groupId || !body.content) {
      return HttpResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const message = {
      id: `m_${Date.now()}`,
      groupId: body.groupId,
      senderId: db.currentUser.id,
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(message);
    return HttpResponse.json({ message }, { status: 201 });
  }),

  // SIGNALING
  http.post("/api/signaling/offer", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true });
  }),
  http.post("/api/signaling/answer", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true });
  }),
];
