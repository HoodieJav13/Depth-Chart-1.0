import type {
  AuthClient,
  AuthUser,
  CoachAccessProfile,
  PhoneCodeSession,
} from "./AuthClient";
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
    buttonId: string,
    parameters?: {
      size?: "normal" | "compact" | "invisible";
      callback?: () => void;
      "expired-callback"?: () => void;
    },
  ) => FirebaseCompatRecaptchaVerifier;
}

export interface FirebaseCompatDocumentSnapshot {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}

export interface FirebaseCompatQuerySnapshot {
  docs: FirebaseCompatDocumentSnapshot[];
}

export interface FirebaseCompatDocumentReference {
  get(options?: { source?: "server" | "cache" | "default" }): Promise<FirebaseCompatDocumentSnapshot>;
  set(value: unknown): Promise<void>;
  delete(): Promise<void>;
  collection(path: string): FirebaseCompatCollectionReference;
  onSnapshot(
    listener: (snapshot: FirebaseCompatDocumentSnapshot) => void,
    onError?: (error: Error) => void,
  ): () => void;
}

export interface FirebaseCompatCollectionReference {
  doc(documentId: string): FirebaseCompatDocumentReference;
  get(): Promise<FirebaseCompatQuerySnapshot>;
}

export interface FirebaseCompatTransaction {
  get(reference: FirebaseCompatDocumentReference): Promise<FirebaseCompatDocumentSnapshot>;
  set(reference: FirebaseCompatDocumentReference, value: unknown): void;
}

export interface FirebaseCompatFirestore {
  collection(path: string): FirebaseCompatCollectionReference;
  runTransaction<T>(
    updateFunction: (transaction: FirebaseCompatTransaction) => Promise<T>,
  ): Promise<T>;
}

interface FirebaseCompatNamespace {
  apps: readonly unknown[];
  initializeApp(config: object): unknown;
  auth: FirebaseCompatAuthFactory;
  firestore(): FirebaseCompatFirestore;
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
    private readonly firestore: FirebaseCompatFirestore,
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
    recaptchaButtonId: string,
  ): Promise<PhoneCodeSession> {
    this.clearVerifier();
    this.verifier = new this.firebase.auth.RecaptchaVerifier(
      recaptchaButtonId,
      { size: "invisible" },
    );
    try {
      const confirmation = await this.auth.signInWithPhoneNumber(phoneNumber, this.verifier);
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

  async checkCoachAccess(user: AuthUser): Promise<CoachAccessProfile | null> {
    if (!user.phoneNumber) return null;
    const snapshot = await this.firestore
      .collection("approvedCoaches")
      .doc(user.phoneNumber)
      .get({ source: "server" });
    if (!snapshot.exists) return null;
    const data = snapshot.data() ?? {};
    if (data.active !== true) return null;
    const displayName =
      typeof data.displayName === "string" && data.displayName.trim()
        ? data.displayName.trim()
        : "Coach";
    return { displayName };
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

const getFirebaseNamespace = (): FirebaseCompatNamespace => {
  const firebase = window.firebase;
  if (!firebase) throw new Error("Firebase failed to load. Check your connection and reload.");
  if (firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);
  return firebase;
};

export const createFirebaseAuthClient = (): AuthClient => {
  const firebase = getFirebaseNamespace();
  const auth = firebase.auth();
  auth.languageCode = "en";
  return new FirebaseAuthClient(firebase, auth, firebase.firestore());
};

export const getFirebaseFirestore = (): FirebaseCompatFirestore =>
  getFirebaseNamespace().firestore();
