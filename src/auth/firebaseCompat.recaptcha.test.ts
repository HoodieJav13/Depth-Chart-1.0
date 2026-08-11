import { afterEach, describe, expect, it, vi } from "vitest";
import { createFirebaseAuthClient } from "./firebaseCompat";

const installFirebaseStub = (clearVerifier: () => void) => {
  const confirmation = {
    confirm: vi.fn(async () => ({
      user: { uid: "coach-1", phoneNumber: "+15055550123" },
    })),
  };

  const signInWithPhoneNumber = vi.fn(async () => confirmation);
  const authInstance = {
    languageCode: null,
    onAuthStateChanged: vi.fn(() => () => undefined),
    signInWithPhoneNumber,
    signOut: vi.fn(async () => undefined),
  };

  class RecaptchaVerifierStub {
    clear(): void {
      clearVerifier();
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
      firestore: () => ({
        collection: vi.fn(),
        runTransaction: vi.fn(),
      }),
    },
  });

  return { signInWithPhoneNumber };
};

afterEach(() => {
  Object.defineProperty(window, "firebase", {
    configurable: true,
    value: undefined,
  });
});

describe("Firebase phone reCAPTCHA lifecycle", () => {
  it("destroys the invisible verifier after the SMS confirmation session is created", async () => {
    const clearVerifier = vi.fn();
    const { signInWithPhoneNumber } = installFirebaseStub(clearVerifier);
    const client = createFirebaseAuthClient();

    const session = await client.requestCode("+15055550123", "send-code-button");

    expect(signInWithPhoneNumber).toHaveBeenCalledTimes(1);
    expect(clearVerifier).toHaveBeenCalledTimes(1);
    await expect(session.confirm("123456")).resolves.toEqual({
      uid: "coach-1",
      phoneNumber: "+15055550123",
    });
  });
});
