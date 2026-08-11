import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaveStatus } from "./SaveStatus";

describe("SaveStatus", () => {
  it("shows a retry action after a failed save", () => {
    const onRetry = vi.fn();
    render(
      <SaveStatus
        status={{ phase: "error", canUndo: true, canRetry: true }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Save failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
