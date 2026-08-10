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

class AutofillAuthClient implements AuthClient {
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

describe("AuthGate SMS autofill", () => {
  it("submits a visibly autofilled six-digit code even when React change state did not update", async () => {
    const authClient = new AutofillAuthClient();
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
    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeValueSetter?.call(codeInput, "123456");

    const verifyButton = screen.getByRole("button", { name: "Verify code" });
    expect(codeInput).toHaveValue("123456");
    expect(verifyButton).toBeEnabled();
    fireEvent.click(verifyButton);

    await waitFor(() => expect(authClient.confirm).toHaveBeenCalledWith("123456"));
    expect(await screen.findByText("Welcome Coach Chavez")).toBeInTheDocument();
  });
});
