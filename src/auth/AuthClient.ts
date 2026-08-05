export interface AuthUser {
  uid: string;
  phoneNumber: string | null;
}

export interface PhoneCodeSession {
  confirm(code: string): Promise<void>;
}

export type AuthStateListener = (user: AuthUser | null) => void;
export type AuthErrorListener = (error: Error) => void;

export interface AuthClient {
  subscribe(listener: AuthStateListener, onError?: AuthErrorListener): () => void;
  requestCode(
    phoneNumber: string,
    recaptchaContainerId: string,
  ): Promise<PhoneCodeSession>;
  signOut(): Promise<void>;
}
