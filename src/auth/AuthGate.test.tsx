import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  AuthClient,
  AuthStateListener,
  AuthUser,
  CoachAccessProfile,
  PhoneCodeSession,
} from "./AuthClient";
import { AuthGate } from "./AuthGate";

class FakeAuthClient implements AuthClient {
  private listener: AuthStateListener | null = null;
  readonly requestCode = vi.fn(async (): Promise<PhoneCodeSession> => ({
    confirm: async () => {
      const user = { uid: "coach-1", phoneNumber: "+15057307634" };
      this.emit(user);
      return user;
    },
  }));
  readonly checkCoachAccess = vi.fn(
    async (): Promise<CoachAccessProfile | null> => this.accessProfile,
  );
  readonly signOut = vi.fn(async () => this.emit(null));

  constructor(
    private readonly initialUser: AuthUser | null = null,
    private accessProfile: CoachAccessProfile | null = {
      displayName: "Coach Chavez",
    },
  ) {}

  setAccessProfile(profile: CoachAccessProfile | null): void {
    this.accessProfile = profile;
  }

  subscribe(listener: AuthStateListener): () => void {
    this.listener = listener;
    listener(this.initialUser);
    return () => {
      this.listener = null;
    };
  }

  emit(user: AuthUser | null): void {
    this.listener?.(user);
  }
}

class ConfirmWithoutObserverClient implements AuthClient {
  readonly requestCode = vi.fn(async (): Promise<PhoneCodeSession> => ({
    confirm: async () => ({ uid: "coach-1", phoneNumber: "+15057307634" }),
  }));
  readonly checkCoachAccess = vi.fn(async (): Promise<CoachAccessProfile | null> => ({
    displayName: "Coach Chavez",
  }));
  readonly signOut = vi.fn(async () => undefined);

  subscribe(listener: AuthStateListener): () => void {
    listener(null);
    return () => undefined;
  }
}

class PendingConfirmClient implements AuthClient {
  private resolveConfirm: ((user: AuthUser) => void) | null = null;

  readonly requestCode = vi.fn(async (): Promise<PhoneCodeSession> => ({
    confirm: () =>
      new Promise<AuthUser>((resolve) => {
        this.resolveConfirm = resolve;
      }),
  }));
  readonly checkCoachAccess = vi.fn(async (): Promise<CoachAccessProfile | null> => ({
    displayName: "Coach Chavez",
  }));
  readonly signOut = vi.fn(async () => undefined);

  subscribe(listener: AuthStateListener): () => void {
    listener(null);
    return () => undefined;
  }

  finishConfirmation(): void {
    this.resolveConfirm?.({ uid: "coach-1", phoneNumber: "+15057307634" });
  }
}

describe("AuthGate", () => {
  it("formats the phone, requests an invisible challenge, and verifies server access", async () => {
    const authClient = new FakeAuthClient();
    const { container } = render(
      <AuthGate authClient={authClient}>
        {({ displayName, phoneNumber }) => (
          <div>
            Signed in as {displayName} {phoneNumber}
          </div>
        )}
      </AuthGate>,
    );

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "5057307634" },
    });
    expect(screen.getByLabelText("Phone number")).toHaveValue("(505) 730-7634");

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByLabelText("Verification code");
    expect(screen.getByText(/\(505\) 730-7634/)).toBeInTheDocument();
    expect(authClient.requestCode).toHaveBeenCalledWith(
      "+15057307634",
      "send-code-button",
    );

    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    await waitFor(() =>
      expect(container).toHaveTextContent("Signed in as Coach Chavez +15057307634"),
    );
    expect(authClient.checkCoachAccess).toHaveBeenCalledWith({
      uid: "coach-1",
      phoneNumber: "+15057307634",
    });
  });

  it("continues after a successful code confirmation without waiting for an observer event", async () => {
    const authClient = new ConfirmWithoutObserverClient();
    const { container } = render(
      <AuthGate authClient={authClient}>
        {({ displayName }) => <div>Welcome {displayName}</div>}
      </AuthGate>,
    );

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "5057307634" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByLabelText("Verification code");
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    await waitFor(() => expect(container).toHaveTextContent("Welcome Coach Chavez"));
    expect(authClient.checkCoachAccess).toHaveBeenCalledWith({
      uid: "coach-1",
      phoneNumber: "+15057307634",
    });
  });

  it("shows which verification boundary is currently pending", async () => {
    const authClient = new PendingConfirmClient();
    const { container } = render(
      <AuthGate authClient={authClient}>
        {({ displayName }) => <div>Welcome {displayName}</div>}
      </AuthGate>,
    );

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "5057307634" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByLabelText("Verification code");
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    expect(screen.getByRole("status")).toHaveTextContent("Confirming code with Firebase");

    authClient.finishConfirmation();
    await waitFor(() => expect(container).toHaveTextContent("Welcome Coach Chavez"));
  });

  it("restores a session only after server access is verified", async () => {
    const user = { uid: "coach-1", phoneNumber: "+15057307634" };
    const authClient = new FakeAuthClient(user, { displayName: "Coach Chavez" });
    const { container } = render(
      <AuthGate authClient={authClient}>
        {({ displayName }) => <div>Welcome {displayName}</div>}
      </AuthGate>,
    );

    await waitFor(() => expect(container).toHaveTextContent("Welcome Coach Chavez"));
    expect(authClient.checkCoachAccess).toHaveBeenCalledWith(user);
  });

  it("keeps a verified but unapproved session and can retry access without another SMS", async () => {
    const user = { uid: "other", phoneNumber: "+15055550134" };
    const authClient = new FakeAuthClient(user, null);
    const { container } = render(
      <AuthGate authClient={authClient}>
        {({ displayName }) => <div>Private chart for {displayName}</div>}
      </AuthGate>,
    );

    expect(
      await screen.findByText("This phone number is not approved for coach access."),
    ).toBeInTheDocument();
    expect(authClient.signOut).not.toHaveBeenCalled();

    authClient.setAccessProfile({ displayName: "Coach Chavez" });
    fireEvent.click(screen.getByRole("button", { name: "Retry access" }));

    await waitFor(() => expect(container).toHaveTextContent("Private chart for Coach Chavez"));
    expect(authClient.requestCode).not.toHaveBeenCalled();
  });
});
