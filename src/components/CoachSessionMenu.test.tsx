import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoachSessionMenu } from "./CoachSessionMenu";

describe("CoachSessionMenu", () => {
  it("keeps the full phone number hidden and signs out from the account menu", async () => {
    const onSignOut = vi.fn(async () => undefined);

    render(
      <CoachSessionMenu
        displayName="Coach Chavez"
        phoneNumber="+15057307634"
        onSignOut={onSignOut}
      />,
    );

    expect(screen.queryByText("+15057307634")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Coach Chavez account" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Ending in 7634")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
