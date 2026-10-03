import type { Group, Message, Profile, ProfileUpdatePayload, User } from "@/types/api";
import { db } from "./db";
import { mockCurrentUser } from "./mockData/users";

type MockOptions = {
  method?: string;
  body?: unknown;
};

const pause = (milliseconds = 90) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const code = "GROUPUP26";
const token = "groupup-demo-session";

function bodyAs<T>(body: unknown): T {
  if (typeof body === "string") return JSON.parse(body) as T;
  return (body ?? {}) as T;
}

function setUser(user: Partial<User> & Pick<User, "email" | "displayName">) {
  Object.assign(db.currentUser, { ...mockCurrentUser, ...user, badges: user.badges ?? [] });
  db.currentProfile.userId = db.currentUser.id;
  db.currentProfile.displayName = db.currentUser.displayName;
}

function profileFormDefaults(user: User): Profile {
  return {
    id: "p_me",
    userId: user.id,
    displayName: user.displayName,
    bio: "Tell your future roommates a little about the way you live.",
    avatarUrl: "/images/demo/people/portrait-01.jpg",
    cleanliness: 7,
    socialEnergy: 6,
    sleepSchedule: "FLEXIBLE",
    nonNegotiables: ["quiet study hours"],
    budget: { min: 600, max: 1000, currency: "USD" },
    groupIntent: "SOLO_NEW",
    university: "National University",
    campus: "Main Campus",
  };
}

function matchesForSearch(filters: URLSearchParams) {
  const q = (filters.get("q") ?? "").trim().toLowerCase();
  const intent = filters.get("group_intent");
  const campus = filters.get("campus");
  const budgetMax = Number(filters.get("budget_max") ?? 0);
  return db.profiles.filter((profile) => {
    if (profile.userId === db.currentUser.id) return false;
    if (q && !`${profile.displayName} ${profile.university} ${profile.campus} ${profile.bio}`.toLowerCase().includes(q)) return false;
    if (intent && profile.groupIntent !== intent) return false;
    if (campus && profile.campus !== campus) return false;
    if (budgetMax && profile.budget.max > budgetMax) return false;
    return true;
  });
}

function makeMessage(groupId: string, content: string): Message {
  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    groupId,
    senderId: db.currentUser.id,
    content,
    createdAt: new Date().toISOString(),
  };
}

/** Local, in-memory demo API. It never sends a request to a backend. */
export async function demoApiRequest<T>(path: string, options: MockOptions = {}): Promise<T> {
  await pause();
  const url = new URL(path, "http://groupup.local");
  const route = url.pathname.replace(/^\/api(?=\/)/, "");
  const method = (options.method ?? "GET").toUpperCase();

  if (route === "/auth/me" && method === "GET") return { user: db.currentUser } as T;

  if (route === "/auth/register" && method === "POST") {
    const input = bodyAs<{ email?: string; password?: string; displayName?: string }>(options.body);
    if (!input.email || !/\.edu$/i.test(input.email)) throw new Error("Use a valid .edu email address.");
    if (!input.password || input.password.length < 8) throw new Error("Choose a password with at least 8 characters.");
    if (!input.displayName?.trim()) throw new Error("Add the name you go by.");
    setUser({ id: "u_me", email: input.email.toLowerCase(), displayName: input.displayName.trim(), verificationStatus: "UNVERIFIED", tier: 1, badges: [] });
    db.currentProfile = profileFormDefaults(db.currentUser);
    return { token, user: db.currentUser } as T;
  }

  if (route === "/auth/login" && method === "POST") {
    const input = bodyAs<{ email?: string; password?: string }>(options.body);
    if (!input.email || !/\.edu$/i.test(input.email) || !input.password) throw new Error("Enter a .edu email and password.");
    const email = input.email.toLowerCase();
    const demoAccount = ["jordan@nationaluniversity.edu", "demo@university.edu"].includes(email);
    if (demoAccount) {
      setUser({ ...mockCurrentUser, email });
    } else {
      const displayName = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      setUser({ id: "u_me", email, displayName, verificationStatus: "UNVERIFIED", tier: 1, badges: [] });
      db.currentProfile = profileFormDefaults(db.currentUser);
    }
    return { token, user: db.currentUser } as T;
  }

  if (route === "/auth/verify" && method === "POST") {
    const input = bodyAs<{ email?: string }>(options.body);
    if (!input.email || !/\.edu$/i.test(input.email)) throw new Error("Enter a valid .edu email address.");
    return { message: "Your local demo code is ready.", expiresInMinutes: 15, devToken: code } as T;
  }

  if (route === "/auth/verify/confirm" && method === "POST") {
    const input = bodyAs<{ email?: string; token?: string }>(options.body);
    if (input.email?.toLowerCase() !== db.currentUser.email.toLowerCase() || input.token !== code) throw new Error("That code doesn't match this demo account.");
    db.currentUser.verificationStatus = "VERIFIED";
    db.currentUser.tier = Math.max(db.currentUser.tier, 2) as User["tier"];
    db.currentUser.badges = ["verified_student"];
    return { user: db.currentUser } as T;
  }

  if (route === "/profiles/me" && method === "GET") return { profile: db.currentProfile } as T;

  if (route === "/profiles/me" && method === "PUT") {
    const input = bodyAs<ProfileUpdatePayload>(options.body);
    db.currentProfile = { ...db.currentProfile, ...input, userId: db.currentUser.id, budget: { ...input.budget }, nonNegotiables: [...input.nonNegotiables] };
    db.currentUser.displayName = input.displayName;
    db.currentProfile.displayName = input.displayName;
    if (db.currentUser.verificationStatus === "VERIFIED") db.currentUser.tier = 3;
    return { profile: db.currentProfile } as T;
  }

  if (route === "/profiles" && method === "GET") {
    const profiles = matchesForSearch(url.searchParams);
    return { profiles, total: profiles.length } as T;
  }

  const profileDetail = route.match(/^\/profiles\/([^/]+)$/);
  if (profileDetail && method === "GET") {
    const profile = db.profiles.find((candidate) => candidate.id === profileDetail[1]);
    if (!profile) throw new Error("Profile not found.");
    return { profile } as T;
  }

  if (route === "/swipe" && method === "POST") {
    const input = bodyAs<{ targetProfileId?: string; action?: "LIKE" | "PASS" }>(options.body);
    if (!input.targetProfileId || !input.action) throw new Error("Choose a profile and an action.");
    db.swipes.push({ swiperId: db.currentUser.id, targetProfileId: input.targetProfileId, action: input.action });
    const mutual = input.action === "LIKE" ? db.matches.find((match) => match.profileId === input.targetProfileId) : undefined;
    return { isMatch: !!mutual, ...(mutual ? { matchId: mutual.id } : {}) } as T;
  }

  if (route === "/matches" && method === "GET") return { matches: db.matches } as T;

  if (route === "/groups" && method === "GET") {
    const groups = db.groups.filter((group) => group.members.some((member) => member.userId === db.currentUser.id));
    return { groups } as T;
  }

  if (route === "/groups" && method === "POST") {
    const input = bodyAs<{ name?: string; memberUserIds?: string[] }>(options.body);
    const userIds = [...new Set([db.currentUser.id, ...(input.memberUserIds ?? [])])];
    if (userIds.length < 2) throw new Error("Choose at least one mutual match to start your circle.");
    const createdAt = new Date().toISOString();
    const group: Group = {
      id: `g_${Date.now()}`,
      name: input.name?.trim() || "Our new circle",
      intent: "SOLO_NEW",
      members: userIds.map((userId) => ({ userId, joinedAt: createdAt })),
      createdAt,
    };
    db.groups.unshift(group);
    return { group } as T;
  }

  const groupDetail = route.match(/^\/groups\/([^/]+)$/);
  if (groupDetail && method === "GET") {
    const group = db.groups.find((candidate) => candidate.id === groupDetail[1]);
    if (!group) throw new Error("Group not found.");
    return { group } as T;
  }

  if (route === "/messages" && method === "GET") {
    const groupId = url.searchParams.get("groupId");
    return { messages: db.messages.filter((message) => message.groupId === groupId) } as T;
  }

  if (route === "/messages" && method === "POST") {
    const input = bodyAs<{ groupId?: string; content?: string }>(options.body);
    if (!input.groupId || !input.content?.trim()) throw new Error("Write a message before sending.");
    const message = makeMessage(input.groupId, input.content.trim());
    db.messages.push(message);
    return { message } as T;
  }

  if (route === "/signaling/offer" || route === "/signaling/answer") return { ok: true } as T;

  throw new Error(`The local demo doesn't have a handler for ${method} ${route}.`);
}
