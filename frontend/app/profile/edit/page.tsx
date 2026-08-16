import { ProfileForm } from "@/components/profile/ProfileForm";

export default function EditProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-semibold">Your roommate profile</h1>
      <ProfileForm />
    </div>
  );
}