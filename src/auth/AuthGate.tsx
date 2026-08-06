import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type {
  AuthClient,
  AuthUser,
  CoachAccessProfile,
  PhoneCodeSession,
} from "./AuthClient";
import {
  formatE164PhoneNumber,
  formatUsPhoneInput,
  normalizeUsPhoneNumber,
} from "./phoneNumber";

interface AuthenticatedCoachSession {
  displayName: string;
  phoneNumber: string;
  signOut: () => Promise<void>;
}

interface AuthGateProps {
  authClient: AuthClient;
  children: (session: AuthenticatedCoachSession) => ReactNode;
}

type GateStatus =
  | "loading"
  | "checkingAccess"
  | "signedOut"
  | "codeSent"
  | "signedIn"
  | "denied";

const errorCodeFor = (error: unknown): string =>
  typeof error === "object" && error && "code" in error ? String(error.code) : "";

const errorMessageFor = (error: unknown): string => {
  switch (errorCodeFor(error)) {
    case "auth/invalid-phone-number":
    case "auth/missing-phone-number":
      return "Enter a valid 10-digit US phone number.";
    case "auth/invalid-verification-code":
      return "That verification code is not correct.";
    case "auth/code-expired":
    case "auth/session-expired":
      return "That code expired. Request a new code.";
    case "auth/too-many-requests":
    case "auth/quota-exceeded":
      return "Too many attempts were made. Try again later.";
    case "auth/unauthorized-domain":
      return "This site is not authorized in Firebase yet.";
    case "auth/captcha-check-failed":
    case "auth/missing-app-credential":
      return "Firebase could not verify this request. Try again.";
    case "permission-denied":
    case "firestore/permission-denied":
      return "Coach access could not be verified. Check the Firestore access setup.";
    case "unavailable":
    case "firestore/unavailable":
      return "Coach access is temporarily unavailable. Check your connection and retry.";
    default:
      return error instanceof Error
        ? error.message
        : "Sign-in could not be completed. Try again.";
  }
};

export const AuthGate = ({ authClient, children }: AuthGateProps) => {
  const [status, setStatus] = useState<GateStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<CoachAccessProfile | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSession, setCodeSession] = useState<PhoneCodeSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let denied = false;
    let accessRequest = 0;

    const unsubscribe = authClient.subscribe(
      (nextUser) => {
        const requestId = ++accessRequest;

        if (!nextUser) {
          if (!active) return;
          setUser(null);
          setProfile(null);
          setStatus(denied ? "denied" : "signedOut");
          return;
        }

        setStatus("checkingAccess");
        setErrorMessage(null);

        void authClient
          .checkCoachAccess(nextUser)
          .then((nextProfile) => {
            if (!active || requestId !== accessRequest) return;

            if (!nextProfile) {
              denied = true;
              setUser(null);
              setProfile(null);
              setStatus("denied");
              void authClient.signOut();
              return;
            }

            denied = false;
            setUser(nextUser);
            setProfile(nextProfile);
            setStatus("signedIn");
          })
          .catch((error) => {
            if (!active || requestId !== accessRequest) return;
            denied = false;
            setUser(null);
            setProfile(null);
            setStatus("signedOut");
            setErrorMessage(errorMessageFor(error));
            void authClient.signOut();
          });
      },
      (error) => {
        if (!active) return;
        setStatus("signedOut");
        setErrorMessage(errorMessageFor(error));
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authClient]);

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phoneNumber = normalizeUsPhoneNumber(phoneInput);
    if (!phoneNumber) {
      setErrorMessage("Enter a valid 10-digit US phone number.");
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    try {
      const session = await authClient.requestCode(phoneNumber, "send-code-button");
      setNormalizedPhone(phoneNumber);
      setCodeSession(session);
      setVerificationCode("");
      setStatus("codeSent");
    } catch (error) {
      setErrorMessage(errorMessageFor(error));
    } finally {
      setIsBusy(false);
    }
  };

  const confirmCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!codeSession || verificationCode.length !== 6) return;

    setIsBusy(true);
    setErrorMessage(null);
    try {
      await codeSession.confirm(verificationCode);
    } catch (error) {
      setErrorMessage(errorMessageFor(error));
    } finally {
      setIsBusy(false);
    }
  };

  const resetSignIn = () => {
    setStatus("signedOut");
    setNormalizedPhone(null);
    setCodeSession(null);
    setVerificationCode("");
    setErrorMessage(null);
  };

  if (status === "signedIn" && user?.phoneNumber && profile) {
    return children({
      displayName: profile.displayName,
      phoneNumber: user.phoneNumber,
      signOut: () => authClient.signOut(),
    });
  }

  if (status === "loading" || status === "checkingAccess") {
    return (
      <main className="auth-shell">
        <div className="auth-loading">
          {status === "checkingAccess" ? "Verifying coach access…" : "Checking sign-in…"}
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <p>Eldorado Football</p>
          <h1 id="auth-title">Coach Access</h1>
        </div>

        {status === "denied" ? (
          <div className="auth-denied" role="alert">
            <h2>Access not approved</h2>
            <p>This phone number is not approved for coach access.</p>
            <button type="button" onClick={resetSignIn}>
              Use another number
            </button>
          </div>
        ) : status === "codeSent" ? (
          <form className="auth-form" onSubmit={(event) => void confirmCode(event)}>
            <p className="auth-intro">
              Enter the six-digit code sent to{" "}
              <strong>
                {normalizedPhone ? formatE164PhoneNumber(normalizedPhone) : "your phone"}
              </strong>
              .
            </p>
            <label htmlFor="verification-code">Verification code</label>
            <input
              id="verification-code"
              className="verification-code-input"
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="123456"
            />
            {errorMessage ? (
              <p className="auth-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button
              className="auth-primary"
              type="submit"
              disabled={verificationCode.length !== 6 || isBusy}
            >
              {isBusy ? "Verifying…" : "Verify code"}
            </button>
            <button className="auth-secondary" type="button" onClick={resetSignIn}>
              Use a different number
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(event) => void requestCode(event)}>
            <p className="auth-intro">
              Enter an approved coach phone number to continue.
            </p>
            <label htmlFor="phone-number">Phone number</label>
            <input
              id="phone-number"
              value={phoneInput}
              onChange={(event) => setPhoneInput(formatUsPhoneInput(event.target.value))}
              inputMode="tel"
              autoComplete="tel"
              placeholder="(505) 555-0123"
              autoFocus
            />
            {errorMessage ? (
              <p className="auth-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button
              id="send-code-button"
              className="auth-primary"
              type="submit"
              disabled={isBusy}
            >
              {isBusy ? "Sending…" : "Continue"}
            </button>
            <p className="auth-disclaimer">
              We’ll text a verification code. Standard SMS rates may apply.
            </p>
          </form>
        )}
      </section>
    </main>
  );
};
