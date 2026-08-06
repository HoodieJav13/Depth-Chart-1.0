import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthenticatedApp } from "./AuthenticatedApp";
import { AuthGate } from "./auth/AuthGate";
import { createFirebaseAuthClient } from "./auth/firebaseCompat";
import "./styles.css";
import "./auth.css";

const root = createRoot(document.getElementById("root")!);

try {
  const authClient = createFirebaseAuthClient();
  root.render(
    <StrictMode>
      <AuthGate authClient={authClient}>
        {({ displayName, phoneNumber, signOut }) => (
          <AuthenticatedApp
            displayName={displayName}
            phoneNumber={phoneNumber}
            onSignOut={signOut}
          />
        )}
      </AuthGate>
    </StrictMode>,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Firebase failed to start.";
  root.render(
    <StrictMode>
      <main className="auth-shell">
        <section className="auth-card" role="alert">
          <div className="auth-brand">
            <p>Eldorado Football</p>
            <h1>Setup required</h1>
          </div>
          <div className="auth-form">
            <p className="auth-error">{message}</p>
          </div>
        </section>
      </main>
    </StrictMode>,
  );
}
