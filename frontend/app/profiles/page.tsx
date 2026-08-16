import { ProfileSearchClient } from "@/components/profiles/ProfileSearchClient";
import { db } from "@/lib/mocks/db";

export default function ProfilesPage() {
  return <ProfileSearchClient initialProfiles={db.profiles} />;
}