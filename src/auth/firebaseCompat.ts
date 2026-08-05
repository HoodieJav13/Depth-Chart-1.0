import type { AuthClient, AuthUser, PhoneCodeSession } from "./AuthClient";
import { firebaseConfig } from "./firebaseConfig";

interface FirebaseCompatUser {
  uid: string;
  phoneNumber: string | null;
}

interface FirebaseCompatConfirmationResult {
  confirm(code: string): Promise<{ user: FirebaseCompatUser }>;
}

interface FirebaseCompatRecaptchaVerifier {
  clear(): void;
  render(): Promise<number>;
}

interface FirebaseCompatAuth {
  languageCode: string | null;
  onAuthStateChanged(
    listener: (user: FirebaseCompatUser | null) => void,
    onError?: (error: Error) => void,
  ): () => void;
  signInWithPhoneNumber(
    phoneNumber: string,
    verifier: FirebaseCompatRecaptchaVerifier,
  ): Promise<FirebaseCompatConfirmationResult>;
  signOut(): Promise<void>;
}

interface FirebaseCompatAuthFactory {
  (): FirebaseCompatAuth;
  RecaptchaVerifier: new (
    containerId: string,
    parameters?: {
      size?: "normal" | "compact" | "invisible";
      callback?: () => void;
      "expired-callback"?: () => void;
    },
  ) => FirebaseCompatRecaptchaVerifier;
}

interface FirebaseCompatNamespace {
  apps: readonly unknown[];
  initializeApp(config: Record<string, string>): unknown;
  auth: FirebaseCompatAuthFactory;
}

declare global {
  interface Window {
    firebase?: FirebaseCompatNamespace;
  }
}

const toAuthUser = (user: FirebaseCompatUser): AuthUser => ({
  uid: user.uid,
  phoneNumber: user.phoneNumber,
});

class FirebaseAuthClient implements AuthClient {
  private verifier: FirebaseCompatRecaptchaVerifier | null = null;

  constructor(
    private readonly firebase: FirebaseCompatNamespace,
    private readonly auth: FirebaseCompatAuth,
  ) {}

  subscribe(
    listener: (user: AuthUser | null) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return this.auth.onAuthStateChanged(
      (user) => listener(user ? toAuthUser(user) : null),
      onError,
    );
  }

  async requestCode(
    phoneNumber: string,
    recaptchaContainerId: string,
  ): Promise<PhoneCodeSession> {
    this.clearVerifier();
    this.verifier = new this.firebase.auth.RecaptchaVerifier(
      recaptchaContainerId,
      { size: "normal" },
    );

    try {
      await this.verifier.render();
      const confirmation = await this.auth.signInWithPhoneNumber(
        phoneNumber,
        this.verifier,
      );
      return {
        confirm: async (code: string) => {
          await confirmation.confirm(code);
        },
      };
    } catch (error) {
      this.clearVerifier();
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.clearVerifier();
    await this.auth.signOut();
  }

  private clearVerifier(): void {
    this.verifier?.clear();
    this.verifier = null;
  }
}

export const createFirebaseAuthClient = (): AuthClient => {
  const firebase = window.firebase;
  if (!firebase) {
    throw new Error("Firebase failed to load. Check your connection and reload.");
  }

  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig as Record<string, string>);
  }

  const auth = firebase.auth();
  auth.languageCode = "en";
  return new FirebaseAuthClient(firebase, auth);
};
