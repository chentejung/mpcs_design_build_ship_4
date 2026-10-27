import { describe, expect, test } from "vitest";
import { checkSystem, contrast, pulp } from "./pulp";

describe("contrast", () => {
  test("matches WCAG's reference ratios", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#ffffff", "#ffffff")).toBe(1);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2); // the lightest grey that passes 4.5:1 on white
  });

  test("doesn't depend on which color is the text", () => {
    expect(contrast("#dc2a24", "#f2eddd")).toBe(contrast("#f2eddd", "#dc2a24"));
  });
});

describe("the Pulp system", () => {
  test("meets every contrast target it is checked against", () => {
    expect(() => checkSystem(pulp)).not.toThrow();
  });

  test("fails the check when a text pairing is too faint", () => {
    const faint = { ...pulp, colors: { ...pulp.colors, muted: 0.2 } }; // Muted barely darker than Newsprint
    expect(() => checkSystem(faint)).toThrow(/Muted on Background/);
  });
});
