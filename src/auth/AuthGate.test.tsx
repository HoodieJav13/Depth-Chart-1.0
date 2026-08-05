import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  AuthClient,
  AuthStateListener,
  AuthUser,
  PhoneCodeSession,
} from "./AuthClient";
import { AuthGate } from "./AuthGate";

class FakeAuthClient implements AuthClient {
  private listener: AuthStateListener | null = null;
  readonly requestCode = vi.fn(async (): Promise<PhoneCodeSession> => ({
    confirm: async () => {
      this.emit({ uid: "coach-1", phoneNumber: "+15057307634" });
    },
  }));
  readonly signOut = vi.fn(async () => this.emit(null));

  constructor(private readonly initialUser: AuthUser | null = null) {}

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

describe("AuthGate", () => {
  it("requests a code and admits the approved coach after confirmation", async () => {
    const authClient = new FakeAuthClient();
    render(
      <AuthGate authClient={authClient}>
        {({ phoneNumber }) => <div>Signed in as {phoneNumber}</div>}
      </AuthGate>,
    );

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "(505) 730-7634" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));

    await screen.findByLabelText("Verification code");
    expect(authClient.requestCode).toHaveBeenCalledWith(
      "+15057307634",
      "recaptcha-container",
    );

    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));

    expect(await screen.findByText("Signed in as +15057307634")).toBeInTheDocument();
  });

  it("restores an approved existing session", async () => {
    const authClient = new FakeAuthClient({
      uid: "coach-1",
      phoneNumber: "+15057307634",
    });

    render(
      <AuthGate authClient={authClient}>
        {({ phoneNumber }) => <div>Welcome {phoneNumber}</div>}
      </AuthGate>,
    );

    expect(await screen.findByText("Welcome +15057307634")).toBeInTheDocument();
  });

  it("signs out a verified number that is not approved", async () => {
    const authClient = new FakeAuthClient({
      uid: "other",
      phoneNumber: "+15055550134",
    });

    render(
      <AuthGate authClient={authClient}>
        {() => <div>Private chart</div>}
      </AuthGate>,
    );

    expect(
      await screen.findByText("This phone number is not approved for coach access."),
    ).toBeInTheDocument();
    await waitFor(() => expect(authClient.signOut).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Private chart")).not.toBeInTheDocument();
  });
});
