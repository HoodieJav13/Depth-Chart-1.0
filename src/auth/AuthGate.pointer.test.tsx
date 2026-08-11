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

class DirectVerifyAuthClient implements AuthClient {
  readonly confirm = vi.fn(async (): Promise<AuthUser> => ({
    uid: "coach-1",
    phoneNumber: "+15057307634",
  }));
  readonly requestCode = vi.fn(async (): Promise<PhoneCodeSession> => ({
    confirm: this.confirm,
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

describe("AuthGate verify button", () => {
  it("verifies directly from the button even if form submission is blocked", async () => {
    const authClient = new DirectVerifyAuthClient();
    render(
      <AuthGate authClient={authClient}>
        {({ displayName }) => <div>Welcome {displayName}</div>}
      </AuthGate>,
    );

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "5057307634" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    const codeInput = await screen.findByLabelText("Verification code");
    fireEvent.change(codeInput, { target: { value: "123456" } });

    const form = codeInput.closest("form");
    expect(form).not.toBeNull();
    form?.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      { capture: true },
    );

    const verify = screen.getByRole("button", { name: "Verify code" });
    fireEvent.click(verify);

    await waitFor(() => expect(authClient.confirm).toHaveBeenCalledWith("123456"));
    expect(await screen.findByText("Welcome Coach Chavez")).toBeInTheDocument();
  });
});
