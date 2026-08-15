import type { User } from "@/types/api";

export const mockCurrentUser: User = {
  id: "u_me",
  email: "jordan@nationaluniversity.edu",
  displayName: "Jordan",
  verificationStatus: "VERIFIED",
  badges: ["verified_student", "id_checked"],
  tier: 3,
};
