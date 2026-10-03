import type { Profile } from "@/types/api";

const photo = (number: number) => `/images/demo/people/portrait-${String(number).padStart(2, "0")}.jpg`;

export const mockProfiles: Profile[] = [
  {
    id: "p_1", userId: "u_1", displayName: "Amina Okafor",
    bio: "Third-year design student. I love Sunday markets, a tidy kitchen and people who are up for a shared dinner now and then.",
    avatarUrl: photo(3), cleanliness: 8, socialEnergy: 7, sleepSchedule: "FLEXIBLE",
    nonNegotiables: ["quiet study hours", "shared meals"], budget: { min: 650, max: 1000, currency: "USD" },
    groupIntent: "SOLO_NEW", university: "National University", campus: "Main Campus", compatibilityScore: 96,
  },
  {
    id: "p_2", userId: "u_2", displayName: "Ethan Cole",
    bio: "Computer science major, amateur cook. Focused during the week; weekends are for football, friends and trying new recipes.",
    avatarUrl: photo(9), cleanliness: 7, socialEnergy: 6, sleepSchedule: "EARLY_BIRD",
    nonNegotiables: ["no smoking", "clear chore rota"], budget: { min: 550, max: 900, currency: "USD" },
    groupIntent: "PAIR_ADD", university: "National University", campus: "North Campus", compatibilityScore: 92,
  },
  {
    id: "p_3", userId: "u_3", displayName: "Nia Carter",
    bio: "Psychology student who believes a home should feel calm, welcoming and a little bit silly. Plants and movie nights are a plus.",
    avatarUrl: photo(4), cleanliness: 9, socialEnergy: 5, sleepSchedule: "NIGHT_OWL",
    nonNegotiables: ["pets welcome", "low-noise evenings"], budget: { min: 700, max: 1100, currency: "USD" },
    groupIntent: "SOLO_NEW", university: "National University", campus: "Main Campus", compatibilityScore: 89,
  },
  {
    id: "p_4", userId: "u_4", displayName: "Luca Morgan",
    bio: "Grad student, runner and big breakfast person. I keep shared spaces clean and love a home where everyone can do their own thing.",
    avatarUrl: photo(6), cleanliness: 8, socialEnergy: 4, sleepSchedule: "EARLY_BIRD",
    nonNegotiables: ["early quiet hours", "shared groceries"], budget: { min: 600, max: 950, currency: "USD" },
    groupIntent: "SOLO_JOIN", university: "National University", campus: "East Campus", compatibilityScore: 87,
  },
  {
    id: "p_5", userId: "u_5", displayName: "Priya Nair",
    bio: "Architecture student, playlist maker and devoted plant parent. Looking for kind people who are down to make a place feel like home.",
    avatarUrl: photo(11), cleanliness: 6, socialEnergy: 8, sleepSchedule: "FLEXIBLE",
    nonNegotiables: ["vegetarian kitchen shelf", "guests with a heads-up"], budget: { min: 750, max: 1200, currency: "USD" },
    groupIntent: "PAIR_ADD", university: "National University", campus: "South Campus", compatibilityScore: 85,
  },
  {
    id: "p_6", userId: "u_6", displayName: "Kwame Boateng",
    bio: "Business student and basketball regular. I like a relaxed shared space, honest communication and the occasional group cook-up.",
    avatarUrl: photo(12), cleanliness: 7, socialEnergy: 8, sleepSchedule: "NIGHT_OWL",
    nonNegotiables: ["respectful guests", "no smoking indoors"], budget: { min: 500, max: 850, currency: "USD" },
    groupIntent: "SOLO_NEW", university: "National University", campus: "Main Campus", compatibilityScore: 84,
  },
  {
    id: "p_7", userId: "u_7", displayName: "Zoe Park",
    bio: "Film student who loves a quiet coffee morning and a good late-night conversation. My camera roll is mostly sunsets.",
    avatarUrl: photo(13), cleanliness: 9, socialEnergy: 6, sleepSchedule: "NIGHT_OWL",
    nonNegotiables: ["clean bathroom", "quiet mornings"], budget: { min: 700, max: 1050, currency: "USD" },
    groupIntent: "SOLO_JOIN", university: "National University", campus: "North Campus", compatibilityScore: 82,
  },
  {
    id: "p_8", userId: "u_8", displayName: "Felix Grant",
    bio: "Environmental science major. Big on biking, meal prep and leaving places better than I found them. Looking for an easygoing crew.",
    avatarUrl: photo(10), cleanliness: 8, socialEnergy: 5, sleepSchedule: "EARLY_BIRD",
    nonNegotiables: ["recycling", "shared cleaning plan"], budget: { min: 500, max: 800, currency: "USD" },
    groupIntent: "SOLO_NEW", university: "National University", campus: "East Campus", compatibilityScore: 81,
  },
  {
    id: "p_9", userId: "u_9", displayName: "Amara Diallo",
    bio: "Sociology student, bookshop browser and friend to every dog. I value open communication and a home that feels warm, not perfect.",
    avatarUrl: photo(1), cleanliness: 6, socialEnergy: 9, sleepSchedule: "FLEXIBLE",
    nonNegotiables: ["pets welcome", "shared dinners sometimes"], budget: { min: 650, max: 1050, currency: "USD" },
    groupIntent: "PAIR_ADD", university: "National University", campus: "Main Campus", compatibilityScore: 79,
  },
  {
    id: "p_10", userId: "u_10", displayName: "Theo Rivera",
    bio: "I study economics and spend too much time at the climbing gym. Clean, considerate and always happy to split a big pot of pasta.",
    avatarUrl: photo(7), cleanliness: 7, socialEnergy: 7, sleepSchedule: "FLEXIBLE",
    nonNegotiables: ["no indoor smoking", "share the fridge fairly"], budget: { min: 600, max: 950, currency: "USD" },
    groupIntent: "SOLO_JOIN", university: "National University", campus: "South Campus", compatibilityScore: 78,
  },
  {
    id: "p_11", userId: "u_11", displayName: "Sofia Bennett",
    bio: "Music student with a soft spot for house plants and low-key hangs. I practice with headphones and keep shared spaces peaceful.",
    avatarUrl: photo(5), cleanliness: 8, socialEnergy: 5, sleepSchedule: "NIGHT_OWL",
    nonNegotiables: ["quiet after 10", "guests with notice"], budget: { min: 700, max: 1100, currency: "USD" },
    groupIntent: "SOLO_NEW", university: "National University", campus: "North Campus", compatibilityScore: 76,
  },
  {
    id: "p_12", userId: "u_12", displayName: "Noah Williams",
    bio: "Sports journalism major. I love meeting new people, but I also respect a closed door and a very serious Sunday reset.",
    avatarUrl: photo(8), cleanliness: 7, socialEnergy: 8, sleepSchedule: "FLEXIBLE",
    nonNegotiables: ["shared chores", "respectful noise"], budget: { min: 550, max: 900, currency: "USD" },
    groupIntent: "PAIR_ADD", university: "National University", campus: "East Campus", compatibilityScore: 74,
  },
];
