import type { AuthUser, CoachAccessProfile } from "./AuthClient";

export interface CoachAccessVerifier {
  checkCoachAccess(user: AuthUser): Promise<CoachAccessProfile | null>;
}
