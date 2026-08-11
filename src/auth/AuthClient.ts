export interface AuthUser {
  uid: string;
  phoneNumber: string | null;
}

export interface CoachAccessProfile {
  displayName: string;
}

export interface PhoneCodeSession {
  confirm(code: string): Promise<AuthUser>;
}

export type AuthStateListener = (user: AuthUser | null) => void;
export type AuthErrorListener = (error: Error) => void;

export interface AuthClient {
  subscribe(listener: AuthStateListener, onError?: AuthErrorListener): () => void;
  requestCode(
    phoneNumber: string,
    recaptchaButtonId: string,
  ): Promise<PhoneCodeSession>;
  checkCoachAccess(user: AuthUser): Promise<CoachAccessProfile | null>;
  signOut(): Promise<void>;
}
