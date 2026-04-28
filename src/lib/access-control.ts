import type { UserStatus } from "@/types/domain";

export function resolveAccessDecision(decision: "approve" | "reject"): {
  profileStatus: UserStatus;
  requestStatus: UserStatus;
} {
  if (decision === "approve") {
    return { profileStatus: "active", requestStatus: "active" };
  }
  return { profileStatus: "rejected", requestStatus: "rejected" };
}
