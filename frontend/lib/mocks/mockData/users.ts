import type { User } from "@/types/api";

export const mockCurrentUser: User = {
  id: "u_me",
  email: "jordan@nationaluniversity.edu",
  displayName: "Jordan Lee",
  verificationStatus: "VERIFIED",
  badges: ["verified_student"],
  tier: 3,
};
