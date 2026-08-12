import { describe, expect, it } from "vitest";
import type { FormationAssignments, FormationConfig } from "./types";
import { buildPlayerAssignmentSummaries } from "./assignmentSummary";

const formations: FormationConfig[] = [
  {
    id: "offense-base",
    name: "Offense",
    unit: "offense",
    positions: [{ id: "off-t", label: "RB", x: 50, y: 54, listOrder: 1 }],
  },
  {
    id: "defense-base",
    name: "Defense",
    unit: "defense",
    positions: [{ id: "def-fs", label: "FS", x: 50, y: 56, listOrder: 1 }],
  },
];

describe("buildPlayerAssignmentSummaries", () => {
  it("derives offense and defense labels entirely from existing assignments", () => {
    const assignments: FormationAssignments = {
      "offense-base": { "off-t": ["p01"], },
      "defense-base": { "def-fs": ["p01", "p02"] },
    };

    const summaries = buildPlayerAssignmentSummaries(formations, assignments);

    expect(summaries.get("p01")).toEqual({ offense: ["RB"], defense: ["FS"] });
    expect(summaries.get("p02")).toEqual({ offense: [], defense: ["FS"] });
  });
});
