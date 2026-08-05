import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthGate } from "./auth/AuthGate";
import { createFirebaseAuthClient } from "./auth/firebaseCompat";
import { LocalStorageDepthChartStore } from "./store/LocalStorageDepthChartStore";
import "./styles.css";
import "./auth.css";

const store = new LocalStorageDepthChartStore();

const root = createRoot(document.getElementById("root")!);

try {
  const authClient = createFirebaseAuthClient();
  root.render(
    <StrictMode>
      <AuthGate authClient={authClient}>
        {({ phoneNumber, signOut }) => (
          <App
            store={store}
            signedInPhoneNumber={phoneNumber}
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
            <span>E</span>
            <div>
              <p>Eldorado Football</p>
              <h1>Setup required</h1>
            </div>
          </div>
          <p className="auth-error">{message}</p>
        </section>
      </main>
    </StrictMode>,
  );
}
