// INPUT: pure keyboard-navigation helper from useCityAutocomplete.
// OUTPUT: vitest coverage for nextActiveIndex — the rest of the hook (debounce,
//         a11y prop wiring) is exercised end-to-end by tests/e2e/landing-birth-chart.spec.ts.
// POS: Unit test for the headless combobox reducer. Kept pure to avoid pulling
//      @testing-library/react into the project just for one hook.

import { describe, expect, it } from "vitest";
import { nextActiveIndex } from "./useCityAutocomplete";

describe("nextActiveIndex", () => {
  it("returns -1 when the list is empty", () => {
    expect(nextActiveIndex("ArrowDown", -1, 0)).toBe(-1);
    expect(nextActiveIndex("ArrowUp", 0, 0)).toBe(-1);
    expect(nextActiveIndex("Home", 0, 0)).toBe(-1);
    expect(nextActiveIndex("End", 0, 0)).toBe(-1);
  });

  it("ArrowDown advances from -1 to 0", () => {
    expect(nextActiveIndex("ArrowDown", -1, 3)).toBe(0);
  });

  it("ArrowDown advances within range", () => {
    expect(nextActiveIndex("ArrowDown", 0, 3)).toBe(1);
    expect(nextActiveIndex("ArrowDown", 1, 3)).toBe(2);
  });

  it("ArrowDown wraps from last to first", () => {
    expect(nextActiveIndex("ArrowDown", 2, 3)).toBe(0);
  });

  it("ArrowUp from -1 jumps to last item", () => {
    expect(nextActiveIndex("ArrowUp", -1, 3)).toBe(2);
  });

  it("ArrowUp retreats within range", () => {
    expect(nextActiveIndex("ArrowUp", 2, 3)).toBe(1);
    expect(nextActiveIndex("ArrowUp", 1, 3)).toBe(0);
  });

  it("ArrowUp wraps from first to last", () => {
    expect(nextActiveIndex("ArrowUp", 0, 3)).toBe(2);
  });

  it("Home always returns 0 (for non-empty lists)", () => {
    expect(nextActiveIndex("Home", -1, 5)).toBe(0);
    expect(nextActiveIndex("Home", 3, 5)).toBe(0);
  });

  it("End returns count - 1", () => {
    expect(nextActiveIndex("End", 0, 5)).toBe(4);
    expect(nextActiveIndex("End", -1, 1)).toBe(0);
  });

  it("Enter / Escape leave the active index unchanged", () => {
    expect(nextActiveIndex("Enter", 1, 3)).toBe(1);
    expect(nextActiveIndex("Escape", 2, 3)).toBe(2);
  });

  it("handles a single-item list", () => {
    expect(nextActiveIndex("ArrowDown", -1, 1)).toBe(0);
    expect(nextActiveIndex("ArrowDown", 0, 1)).toBe(0);
    expect(nextActiveIndex("ArrowUp", 0, 1)).toBe(0);
  });
});
