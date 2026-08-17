import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const names = [
  "Alex", "Sam", "Riley", "Casey", "Morgan", "Taylor", "Jordan", "Avery",
  "Quinn", "Skyler", "Rowan", "Parker", "Drew", "Hayden", "Reese", "Cameron",
  "Dana", "Elliot", "Finley", "Harper", "Jules", "Kai", "Logan", "Marlow",
  "Nico", "Oakley", "Perry", "Remy", "Sasha", "Tatum", "Blair", "Emerson",
  "Sage", "River", "Lennon", "Micah", "Noa", "Phoenix", "Wren", "Ari",
  "Casey", "Devon", "Jamie", "Robin", "Shiloh", "Tate", "Vaughn", "Yael",
  "Zion", "Amari",
];

const intents = ["SOLO_NEW", "PAIR_ADD", "SOLO_JOIN"] as const;
const schedules = ["EARLY_BIRD", "NIGHT_OWL", "FLEXIBLE"] as const;
const campuses = ["Main Campus", "North Campus", "East Campus", "South Campus"];
const allTags = ["smoking", "pets", "dietary", "noise_tolerance", "guest_policy"];

const bios = [
  "Looking for a calm, clean place for my final year.",
  "Early riser, big on quiet study hours and shared meals.",
  "Sociable but respectful — love a good group dinner.",
  "Grad student, mostly in the lab, need a quiet home base.",
  "Fitness-focused, meal-prep person, tidy by nature.",
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  // --- Demo user (easy login) ---
  const demo = await prisma.user.upsert({
    where: { email: "demo@university.edu" },
    update: {},
    create: {
      email: "demo@university.edu",
      passwordHash,
      displayName: "Demo Student",
      verificationStatus: "VERIFIED",
      tier: 3,
      badges: ["verified_student", "id_checked"],
    },
  });

  await prisma.profile.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      displayName: "Demo Student",
      bio: "Your demo account — swipe around and form a group!",
      cleanliness: 7,
      socialEnergy: 7,
      sleepSchedule: "FLEXIBLE",
      nonNegotiables: ["no_smoking"],
      budgetMin: 450,
      budgetMax: 950,
      budgetCurrency: "USD",
      groupIntent: "SOLO_NEW",
      university: "National University",
      campus: "Main Campus",
    },
  });

  // --- 50 varied profiles ---
  for (let i = 0; i < 50; i++) {
    const email = `seed${i + 1}@university.edu`;
    const name = names[i % names.length];
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        displayName: name,
        verificationStatus: "VERIFIED",
        tier: 3,
        badges: ["verified_student"],
      },
    });

    const clean = (i % 10) + 1;
    const energy = ((i * 3) % 10) + 1;
    const min = 300 + (i % 6) * 100;
    const max = min + 400 + (i % 3) * 200;
    const tags = [allTags[i % allTags.length], allTags[(i + 2) % allTags.length]];

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: name,
        bio: bios[i % bios.length],
        cleanliness: clean,
        socialEnergy: energy,
        sleepSchedule: schedules[i % schedules.length],
        nonNegotiables: [...new Set(tags)],
        budgetMin: min,
        budgetMax: max,
        budgetCurrency: "USD",
        groupIntent: intents[i % intents.length],
        university: "National University",
        campus: campuses[i % campuses.length],
      },
    });
  }

  console.log("Seed complete: 1 demo user + 50 profiles.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Seed failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});