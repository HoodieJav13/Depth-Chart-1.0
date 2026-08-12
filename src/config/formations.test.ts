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
      { id: "def-le", label: "LE", x: 39, y: 30, listOrder: 1 },
      { id: "def-ldt", label: "LDT", x: 46, y: 30, listOrder: 2 },
      { id: "def-rdt", label: "RDT", x: 54, y: 30, listOrder: 3 },
      { id: "def-re", label: "RE", x: 61, y: 30, listOrder: 4 },
      { id: "def-will", label: "W", x: 44, y: 41, listOrder: 5 },
      { id: "def-mike", label: "M", x: 56, y: 41, listOrder: 6 },
      { id: "def-alpha", label: "A", x: 28, y: 40, listOrder: 7 },
      { id: "def-bandit", label: "B", x: 70, y: 40, listOrder: 8 },
      { id: "def-lc", label: "LC", x: 11, y: 38, listOrder: 9 },
      { id: "def-rc", label: "RC", x: 89, y: 38, listOrder: 10 },
      { id: "def-fs", label: "FS", x: 50, y: 56, listOrder: 11 },
    ]);
  });
});
