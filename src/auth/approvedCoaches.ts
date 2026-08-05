const APPROVED_COACH_NUMBERS = new Set(["+15057307634"]);

export const isApprovedCoach = (phoneNumber: string | null): boolean =>
  phoneNumber !== null && APPROVED_COACH_NUMBERS.has(phoneNumber);
