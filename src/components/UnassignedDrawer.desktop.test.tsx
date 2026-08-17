import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UnassignedDrawer } from "./UnassignedDrawer";

const props = {
  players: [{ id: "p01", name: "Malachi", number: "7" }],
  selectedPlayerId: null,
  mobileOpen: false,
  onMobileOpenChange: vi.fn(),
  onSelectPlayer: vi.fn(),
  onUnassignPlayer: vi.fn(),
  onRequestAddPlayer: vi.fn(),
  onEditPlayer: vi.fn(),
  onArchivePlayer: vi.fn(),
};

describe("UnassignedDrawer desktop rail", () => {
  it("renders a narrow collapsed handle with icon semantics and count", () => {
    const onDesktopOpenChange = vi.fn();
    const view = render(
      <UnassignedDrawer
        {...props}
        desktopOpen={false}
        onDesktopOpenChange={onDesktopOpenChange}
        onDesktopDrop={vi.fn()}
      />,
    );

    const desktop = view.container.querySelector(".desktop-drawer");
    expect(desktop).toHaveClass("collapsed");
    expect(
      within(desktop as HTMLElement).getByRole("button", {
        name: "Open unassigned players, 1 player",
      }),
    ).toBeInTheDocument();
    expect(within(desktop as HTMLElement).queryByText("Roster")).toBeNull();
    expect(desktop?.querySelector(".rail-chevron")).toBeInTheDocument();
    expect(within(desktop as HTMLElement).queryByRole("searchbox")).toBeNull();

    fireEvent.click(
      within(desktop as HTMLElement).getByRole("button", {
        name: "Open unassigned players, 1 player",
      }),
    );
    expect(onDesktopOpenChange).toHaveBeenCalledWith(true);
  });

  it("renders the current roster tools when expanded and supports collapse", () => {
    const onDesktopOpenChange = vi.fn();
    const view = render(
      <UnassignedDrawer
        {...props}
        desktopOpen
        onDesktopOpenChange={onDesktopOpenChange}
        onDesktopDrop={vi.fn()}
      />,
    );
    const desktop = view.container.querySelector(".desktop-drawer") as HTMLElement;

    expect(desktop).toHaveClass("expanded");
    expect(within(desktop).getByRole("searchbox")).toBeInTheDocument();
    expect(within(desktop).getByRole("button", { name: "Add player" })).toBeInTheDocument();

    fireEvent.click(
      within(desktop).getByRole("button", { name: "Collapse unassigned players" }),
    );
    expect(onDesktopOpenChange).toHaveBeenCalledWith(false);
  });

  it("unassigns a dropped starter and reports a committed desktop drop", () => {
    const onUnassignPlayer = vi.fn();
    const onDesktopDrop = vi.fn();
    const view = render(
      <UnassignedDrawer
        {...props}
        desktopOpen
        onDesktopOpenChange={vi.fn()}
        onDesktopDrop={onDesktopDrop}
        onUnassignPlayer={onUnassignPlayer}
      />,
    );
    const desktop = view.container.querySelector(".desktop-drawer") as HTMLElement;
    const dataTransfer = {
      getData: vi.fn((type: string) => type === "text/player-id" ? "p01" : "off-q"),
    };

    fireEvent.drop(desktop, { dataTransfer });

    expect(onUnassignPlayer).toHaveBeenCalledWith("p01", "off-q");
    expect(onDesktopDrop).toHaveBeenCalled();
  });
});
