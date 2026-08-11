import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoachSessionMenu } from "./CoachSessionMenu";

describe("CoachSessionMenu", () => {
  it("keeps the full phone hidden and exposes workflow actions", async () => {
    const onOpenSnapshots = vi.fn();
    const onOpenPrint = vi.fn();
    const onSignOut = vi.fn(async () => undefined);

    render(
      <CoachSessionMenu
        displayName="Coach Chavez"
        phoneNumber="+15057307634"
        onOpenSnapshots={onOpenSnapshots}
        onOpenPrint={onOpenPrint}
        onSignOut={onSignOut}
      />,
    );

    expect(screen.queryByText("+15057307634")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", {
      name: "Coach Chavez account",
    });
    fireEvent.click(trigger);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Ending in 7634")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Saved snapshots" }),
    );
    expect(onOpenSnapshots).toHaveBeenCalledTimes(1);

    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Print depth chart" }),
    );
    expect(onOpenPrint).toHaveBeenCalledTimes(1);

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
