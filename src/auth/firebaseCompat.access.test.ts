import { afterEach, describe, expect, it, vi } from "vitest";
import { createFirebaseAuthClient } from "./firebaseCompat";

const installFirebaseStub = (snapshot: {
  exists: boolean;
  data?: () => Record<string, unknown>;
}) => {
  const doc = vi.fn(() => ({
    get: vi.fn(async () => snapshot),
  }));
  const collection = vi.fn(() => ({ doc }));
  const authInstance = {
    languageCode: null,
    onAuthStateChanged: vi.fn(() => () => undefined),
    signInWithPhoneNumber: vi.fn(),
    signOut: vi.fn(async () => undefined),
  };
  class RecaptchaVerifierStub {
    clear(): void {
      // No-op in this focused access-check test.
    }
  }
  const authFactory = Object.assign(() => authInstance, {
    RecaptchaVerifier: RecaptchaVerifierStub,
  });

  Object.defineProperty(window, "firebase", {
    configurable: true,
    value: {
      apps: [{}],
      initializeApp: vi.fn(),
      auth: authFactory,
      firestore: () => ({ collection, runTransaction: vi.fn() }),
    },
  });
};

afterEach(() => {
  Object.defineProperty(window, "firebase", {
    configurable: true,
    value: undefined,
  });
});

describe("Firebase coach access diagnostics", () => {
  it("reports the exact Firestore document path when the approval document is missing", async () => {
    installFirebaseStub({ exists: false, data: () => ({}) });
    const client = createFirebaseAuthClient();

    await expect(
      client.checkCoachAccess({ uid: "coach-1", phoneNumber: "+15055550123" }),
    ).rejects.toThrow("approvedCoaches/+15055550123");
  });

  it("reports the actual active value and type when approval is not Boolean true", async () => {
    installFirebaseStub({ exists: true, data: () => ({ active: "true" }) });
    const client = createFirebaseAuthClient();

    await expect(
      client.checkCoachAccess({ uid: "coach-1", phoneNumber: "+15055550123" }),
    ).rejects.toThrow('active is "true" (string); expected Boolean true');
  });
});
