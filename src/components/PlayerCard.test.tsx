import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerCard } from "./PlayerCard";

describe("PlayerCard", () => {
  it("renders cleanly with name only when no number exists", () => {
    render(
      <PlayerCard
        player={{ id: "p01", name: "Reid Alcaraz" }}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Reid Alcaraz")).toBeInTheDocument();
    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("shows a number when one is later supplied", () => {
    render(
      <PlayerCard
        player={{ id: "p01", name: "Reid Alcaraz", number: "12" }}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("#12")).toBeInTheDocument();
  });

  it("carries its source position when an assigned occurrence is dragged", () => {
    const view = render(
      <PlayerCard
        player={{ id: "p01", name: "Reid Alcaraz" }}
        selected={false}
        sourcePositionId="def-bandit"
        onSelect={vi.fn()}
      />,
    );
    const dataTransfer = { effectAllowed: "none", setData: vi.fn() };

    fireEvent.dragStart(view.container.querySelector("button") as HTMLButtonElement, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith("text/player-id", "p01");
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/from-position-id", "def-bandit");
  });
});
