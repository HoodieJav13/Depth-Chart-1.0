import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { AuthClient, AuthUser, PhoneCodeSession } from "./AuthClient";
import { isApprovedCoach } from "./approvedCoaches";
import { normalizeUsPhoneNumber } from "./phoneNumber";

interface AuthenticatedCoachSession {
  phoneNumber: string;
  signOut: () => Promise<void>;
}

interface AuthGateProps {
  authClient: AuthClient;
  children: (session: AuthenticatedCoachSession) => ReactNode;
}

type GateStatus = "loading" | "signedOut" | "codeSent" | "signedIn" | "denied";

const errorMessageFor = (error: unknown): string => {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
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
      return "Complete the reCAPTCHA and try again.";
    default:
      return error instanceof Error
        ? error.message
        : "Sign-in could not be completed. Try again.";
  }
};

export const AuthGate = ({ authClient, children }: AuthGateProps) => {
  const [status, setStatus] = useState<GateStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSession, setCodeSession] = useState<PhoneCodeSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let denied = false;
    return authClient.subscribe(
      (nextUser) => {
        if (!nextUser) {
          setUser(null);
          setStatus(denied ? "denied" : "signedOut");
          return;
        }

        if (!isApprovedCoach(nextUser.phoneNumber)) {
          denied = true;
          setUser(null);
          setStatus("denied");
          void authClient.signOut();
          return;
        }

        denied = false;
        setUser(nextUser);
        setStatus("signedIn");
        setErrorMessage(null);
      },
      (error) => {
        setStatus("signedOut");
        setErrorMessage(errorMessageFor(error));
      },
    );
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
      const session = await authClient.requestCode(
        phoneNumber,
        "recaptcha-container",
      );
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

  if (status === "signedIn" && user?.phoneNumber) {
    return children({
      phoneNumber: user.phoneNumber,
      signOut: () => authClient.signOut(),
    });
  }

  if (status === "loading") {
    return (
      <main className="auth-shell">
        <div className="auth-loading">Checking coach access…</div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span>E</span>
          <div>
            <p>Eldorado Football</p>
            <h1 id="auth-title">Coach Access</h1>
          </div>
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
              Enter the six-digit code for <strong>{normalizedPhone}</strong>.
            </p>
            <label htmlFor="verification-code">Verification code</label>
            <input
              id="verification-code"
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
              {isBusy ? "Verifying…" : "Verify and continue"}
            </button>
            <button className="auth-secondary" type="button" onClick={resetSignIn}>
              Use a different number
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(event) => void requestCode(event)}>
            <p className="auth-intro">
              Sign in with an approved coach phone number to open the depth chart.
            </p>
            <label htmlFor="phone-number">Phone number</label>
            <input
              id="phone-number"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="(505) 555-0123"
              autoFocus
            />
            <div id="recaptcha-container" className="recaptcha-container" />
            {errorMessage ? (
              <p className="auth-error" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button className="auth-primary" type="submit" disabled={isBusy}>
              {isBusy ? "Sending…" : "Send code"}
            </button>
            <p className="auth-disclaimer">
              Standard SMS rates may apply. Phone numbers are processed by Firebase for
              verification and abuse prevention.
            </p>
          </form>
        )}
      </section>
    </main>
  );
};
