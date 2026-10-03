import { http, HttpResponse, delay } from "msw";
import type { Profile, ProfileUpdatePayload, User } from "@/types/api";
import { db } from "./db";
import { mockCurrentUser } from "./mockData/users";

const LATENCY = 140;
const DEMO_VERIFY_CODE = "GROUPUP26";
const DEMO_TOKEN = "groupup-demo-session";

function copyProfile(profile: Profile): Profile {
  return { ...profile, budget: { ...profile.budget }, nonNegotiables: [...profile.nonNegotiables] };
}

function setDemoUser(user: Partial<User> & Pick<User, "email" | "displayName">) {
  Object.assign(db.currentUser, {
    ...mockCurrentUser,
    ...user,
    badges: user.badges ?? [],
  });
  db.currentProfile.userId = db.currentUser.id;
  db.currentProfile.displayName = db.currentUser.displayName;
}

export const handlers = [
  // Auth is intentionally relaxed in the local demo. The real backend still validates JWTs.
  http.get("/api/auth/me", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ user: db.currentUser });
  }),

  http.post("/api/auth/register", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { email?: string; password?: string; displayName?: string };
    if (!body.email || !/\.edu$/i.test(body.email)) {
      return HttpResponse.json({ error: "Use a valid .edu email address." }, { status: 400 });
    }
    if (!body.password || body.password.length < 8 || !body.displayName?.trim()) {
      return HttpResponse.json({ error: "Add your name and a password with at least 8 characters." }, { status: 400 });
    }

    setDemoUser({
      id: "u_me",
      email: body.email.toLowerCase(),
      displayName: body.displayName.trim(),
      verificationStatus: "UNVERIFIED",
      tier: 1,
      badges: [],
    });
    return HttpResponse.json({ token: DEMO_TOKEN, user: db.currentUser }, { status: 201 });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !/\.edu$/i.test(body.email) || !body.password) {
      return HttpResponse.json({ error: "Enter a .edu email and password." }, { status: 400 });
    }

    const isDemoAccount = ["jordan@nationaluniversity.edu", "demo@university.edu"].includes(body.email.toLowerCase());
    if (isDemoAccount) {
      setDemoUser({
        ...mockCurrentUser,
        email: body.email.toLowerCase(),
        verificationStatus: "VERIFIED",
        tier: 3,
      });
    } else {
      const displayName = body.email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      setDemoUser({
        id: "u_me",
        email: body.email.toLowerCase(),
        displayName,
        verificationStatus: "UNVERIFIED",
        tier: 1,
        badges: [],
      });
    }

    return HttpResponse.json({ token: DEMO_TOKEN, user: db.currentUser });
  }),

  http.post("/api/auth/verify", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { email?: string };
    if (!body.email || !/\.edu$/i.test(body.email)) {
      return HttpResponse.json({ error: "Enter a valid .edu email address." }, { status: 400 });
    }
    return HttpResponse.json({
      message: "Your local demo code is ready.",
      expiresInMinutes: 15,
      devToken: DEMO_VERIFY_CODE,
    });
  }),

  http.post("/api/auth/verify/confirm", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { email?: string; token?: string };
    if (body.email?.toLowerCase() !== db.currentUser.email.toLowerCase() || body.token !== DEMO_VERIFY_CODE) {
      return HttpResponse.json({ error: "That code doesn't match this demo account." }, { status: 400 });
    }
    db.currentUser.verificationStatus = "VERIFIED";
    db.currentUser.tier = Math.max(db.currentUser.tier, 2) as User["tier"];
    db.currentUser.badges = ["verified_student"];
    return HttpResponse.json({ user: db.currentUser });
  }),

  // Profiles
  http.get("/api/profiles/me", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ profile: copyProfile(db.currentProfile) });
  }),

  http.put("/api/profiles/me", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as Partial<ProfileUpdatePayload>;
    db.currentProfile = {
      ...db.currentProfile,
      ...body,
      userId: db.currentUser.id,
      budget: { ...db.currentProfile.budget, ...body.budget },
      nonNegotiables: body.nonNegotiables ?? db.currentProfile.nonNegotiables,
    };
    if (body.displayName) {
      db.currentUser.displayName = body.displayName;
      db.currentProfile.displayName = body.displayName;
    }
    db.currentUser.tier = 3;
    return HttpResponse.json({ profile: copyProfile(db.currentProfile) });
  }),

  http.get("/api/profiles", async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
    const intent = url.searchParams.get("group_intent");
    const budgetMax = Number(url.searchParams.get("budget_max") ?? 0);
    const campus = url.searchParams.get("campus");

    let list = db.profiles.filter((profile) => profile.userId !== db.currentUser.id);
    if (q) {
      list = list.filter((profile) =>
        `${profile.displayName} ${profile.university} ${profile.campus} ${profile.bio}`.toLowerCase().includes(q),
      );
    }
    if (intent) list = list.filter((profile) => profile.groupIntent === intent);
    if (budgetMax) list = list.filter((profile) => profile.budget.max <= budgetMax);
    if (campus) list = list.filter((profile) => profile.campus === campus);
    return HttpResponse.json({ profiles: list, total: list.length });
  }),

  http.get("/api/profiles/:id", async ({ params }) => {
    await delay(LATENCY);
    const profile = db.profiles.find((candidate) => candidate.id === params.id);
    if (!profile) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ profile });
  }),

  // Swipes and mutual matches
  http.post("/api/swipe", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { targetProfileId?: string; action?: "LIKE" | "PASS" };
    if (!body.targetProfileId || !body.action) {
      return HttpResponse.json({ error: "Choose a profile and an action." }, { status: 400 });
    }
    db.swipes.push({ swiperId: db.currentUser.id, targetProfileId: body.targetProfileId, action: body.action });
    const target = db.profiles.find((profile) => profile.id === body.targetProfileId);
    const match = body.action === "LIKE" ? db.matches.find((item) => item.profileId === body.targetProfileId) : undefined;
    return HttpResponse.json({ isMatch: !!match, ...(match ? { matchId: match.id } : {}), ...(target ? { targetProfileId: target.id } : {}) });
  }),

  http.get("/api/matches", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ matches: db.matches });
  }),

  // Groups
  http.post("/api/groups", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { name?: string; memberUserIds?: string[] };
    const members = [...new Set([db.currentUser.id, ...(body.memberUserIds ?? [])])];
    if (!body.name?.trim() || members.length < 2) {
      return HttpResponse.json({ error: "Give your group a name and choose at least one match." }, { status: 400 });
    }
    const createdAt = new Date().toISOString();
    const group = {
      id: `g_${Date.now()}`,
      name: body.name.trim(),
      intent: "SOLO_NEW",
      members: members.map((userId) => ({ userId, joinedAt: createdAt })),
      createdAt,
    };
    db.groups.unshift(group);
    return HttpResponse.json({ group }, { status: 201 });
  }),

  http.get("/api/groups", async () => {
    await delay(LATENCY);
    return HttpResponse.json({
      groups: db.groups.filter((group) => group.members.some((member) => member.userId === db.currentUser.id)),
    });
  }),

  http.get("/api/groups/:id", async ({ params }) => {
    await delay(LATENCY);
    const group = db.groups.find((candidate) => candidate.id === params.id);
    if (!group) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ group });
  }),

  // Group chat
  http.get("/api/messages", async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    return HttpResponse.json({ messages: db.messages.filter((message) => message.groupId === groupId) });
  }),

  http.post("/api/messages", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { groupId?: string; content?: string };
    if (!body.groupId || !body.content?.trim()) {
      return HttpResponse.json({ error: "Write a message before sending." }, { status: 400 });
    }
    const message = {
      id: `m_${Date.now()}`,
      groupId: body.groupId,
      senderId: db.currentUser.id,
      content: body.content.trim(),
      createdAt: new Date().toISOString(),
    };
    db.messages.push(message);
    return HttpResponse.json({ message }, { status: 201 });
  }),

  // Local demo signaling endpoints
  http.post("/api/signaling/offer", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true });
  }),
  http.post("/api/signaling/answer", async () => {
    await delay(LATENCY);
    return HttpResponse.json({ ok: true });
  }),
];
