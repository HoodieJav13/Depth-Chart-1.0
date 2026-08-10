import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  AuthClient,
  AuthStateListener,
  CoachAccessProfile,
  PhoneCodeSession,
} from "./AuthClient";
import { AuthGate } from "./AuthGate";

class PointerDiagnosticAuthClient implements AuthClient {
  readonly requestCode = vi.fn(async (): Promise<PhoneCodeSession> => ({
    confirm: () => new Promise(() => undefined),
  }));
  readonly checkCoachAccess = vi.fn(async (): Promise<CoachAccessProfile | null> => ({
    displayName: "Coach",
  }));
  readonly signOut = vi.fn(async () => undefined);

  subscribe(listener: AuthStateListener): () => void {
    listener(null);
    return () => undefined;
  }
}

describe("AuthGate verify button diagnostics", () => {
  it("acknowledges the physical verify-button press before form submission", async () => {
    const authClient = new PointerDiagnosticAuthClient();
    render(<AuthGate authClient={authClient}>{() => <div>Signed in</div>}</AuthGate>);

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "5055550123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByLabelText("Verification code");
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });

    const verify = screen.getByRole("button", { name: "Verify code" });
    fireEvent.pointerDown(verify);

    expect(verify).toHaveTextContent("Press received");
  });
});
