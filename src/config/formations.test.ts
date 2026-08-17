import { describe, expect, it } from "vitest";
import formations from "./formations.json";

describe("formation persistence ids", () => {
  it("keeps every offensive id and installs the safety-gated 4-2-5 defensive ids", () => {
    const offense = formations.formations.find((item) => item.id === "offense-base");
    const defense = formations.formations.find((item) => item.id === "defense-base");

    expect(offense?.positions.map((item) => item.id)).toEqual([
      "off-lt", "off-lg", "off-c", "off-rg", "off-rt", "off-q",
      "off-t", "off-h", "off-y", "off-z", "off-x",
    ]);
    expect(defense?.positions).toEqual([
      { id: "def-le", label: "LE", x: 39, y: 30, listOrder: 1, roleName: "Left End" },
      { id: "def-ldt", label: "LDT", x: 46, y: 30, listOrder: 2, roleName: "Left Tackle" },
      { id: "def-rdt", label: "RDT", x: 54, y: 30, listOrder: 3, roleName: "Right Tackle" },
      { id: "def-re", label: "RE", x: 61, y: 30, listOrder: 4, roleName: "Right End" },
      { id: "def-will", label: "W", x: 44, y: 41, listOrder: 5, roleName: "Will" },
      { id: "def-mike", label: "M", x: 56, y: 41, listOrder: 6, roleName: "Mike" },
      { id: "def-alpha", label: "A", x: 28, y: 40, listOrder: 7, roleName: "Alpha" },
      { id: "def-bandit", label: "B", x: 70, y: 40, listOrder: 8, roleName: "Bandit" },
      { id: "def-lc", label: "LC", x: 11, y: 38, listOrder: 9, roleName: "Left Corner" },
      { id: "def-rc", label: "RC", x: 89, y: 38, listOrder: 10, roleName: "Right Corner" },
      { id: "def-fs", label: "FS", x: 50, y: 56, listOrder: 11, roleName: "Free Safety" },
    ]);
  });

  it("leaves x/y untouched as ordering data for the band layout", () => {
    // Bands order columns by ascending x; these values are also the football alignment
    // and must not be edited for presentation reasons.
    const defense = formations.formations.find((item) => item.id === "defense-base");
    const secondary = ["def-lc", "def-alpha", "def-fs", "def-bandit", "def-rc"];
    const xs = secondary.map(
      (id) => defense?.positions.find((item) => item.id === id)?.x ?? Number.NaN,
    );
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });
});
