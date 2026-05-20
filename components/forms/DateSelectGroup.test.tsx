// INPUT: DateSelectGroup component + vitest + React 18 createRoot + jsdom.
// OUTPUT: Unit tests covering the 10 behavioural contracts of DateSelectGroup
//         (empty state, prefill, partial-selection retention, clear, leap-year
//         clamp, day-count variance, external reset, idPrefix, monthNames,
//         labels).
// POS: Colocated test for components/forms/DateSelectGroup.tsx. Requires a
//      jsdom environment and the include glob to cover components/**. Neither
//      is configured today (2026-05-20); tests are structurally complete and
//      will run once the project adds:
//        1. `@vitest-environment jsdom` support (install jsdom or happy-dom)
//        2. `components/**/*.test.{ts,tsx}` in vitest.config.ts include list
//      No @testing-library/react dependency is used; only React 18 + jsdom
//      native APIs so the blast radius of adding infra is minimal.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

// @vitest-environment jsdom

import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DateSelectGroup,
  DEFAULT_MONTH_NAMES_EN,
} from "./DateSelectGroup";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mount a React element into a fresh div, return the container. */
function mount(element: React.ReactElement): HTMLDivElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    createRoot(container).render(element);
  });
  return container;
}

/** Re-render a new element tree into the same container/root. */
function rerender(
  root: ReturnType<typeof createRoot>,
  element: React.ReactElement,
): void {
  act(() => {
    root.render(element);
  });
}

/** Fire a native change event on a <select>, setting its value first. */
function changeSelect(select: HTMLSelectElement, value: string): void {
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

/** Query the month/day/year selects within a container by their aria-label. */
function getSelects(container: HTMLDivElement) {
  const month = container.querySelector<HTMLSelectElement>(
    'select[aria-label="Month"]',
  )!;
  const day = container.querySelector<HTMLSelectElement>(
    'select[aria-label="Day"]',
  )!;
  const year = container.querySelector<HTMLSelectElement>(
    'select[aria-label="Year"]',
  )!;
  return { month, day, year };
}

// ---------------------------------------------------------------------------
// Setup / teardown — one createRoot per test via `mount`, cleaned via afterEach
// ---------------------------------------------------------------------------

const roots: ReturnType<typeof createRoot>[] = [];
const containers: HTMLDivElement[] = [];

beforeEach(() => {
  roots.length = 0;
  containers.length = 0;
});

afterEach(() => {
  act(() => {
    for (const root of roots) {
      root.unmount();
    }
  });
  for (const c of containers) {
    c.remove();
  }
});

/** Mount helper that tracks roots/containers for teardown. */
function mountTracked(element: React.ReactElement): {
  container: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  roots.push(root);
  return { container, root };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DateSelectGroup", () => {
  // 1. Empty initial state
  it("renders all three selects on placeholder when value is empty", () => {
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup value="" onChange={onChange} idPrefix="t1" />,
    );

    const { month, day, year } = getSelects(container);

    expect(month.value).toBe("");
    expect(day.value).toBe("");
    expect(year.value).toBe("");
    // onChange must NOT fire during initial render
    expect(onChange).not.toHaveBeenCalled();
  });

  // 2. Prefill
  it("pre-selects month/day/year from a YYYY-MM-DD value on first paint", () => {
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup
        value="1990-05-20"
        onChange={onChange}
        idPrefix="t2"
      />,
    );

    const { month, day, year } = getSelects(container);

    expect(month.value).toBe("5");   // May = 5
    expect(day.value).toBe("20");
    expect(year.value).toBe("1990");
    // Prefill must not trigger an onChange call (value already equals emitted)
    expect(onChange).not.toHaveBeenCalled();
  });

  // 3. Partial selection retention — the P0 fix
  it("retains partial picks across steps and only emits when all three are filled", () => {
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup value="" onChange={onChange} idPrefix="t3" />,
    );

    const { month, day, year } = getSelects(container);

    // Step 1: pick Month = March (3)
    changeSelect(month, "3");
    expect(onChange).not.toHaveBeenCalled();
    // Month select retains "3"
    expect(month.value).toBe("3");

    // Step 2: pick Year = 1990
    changeSelect(year, "1990");
    expect(onChange).not.toHaveBeenCalled();
    // Both picks retained
    expect(month.value).toBe("3");
    expect(year.value).toBe("1990");

    // Step 3: pick Day = 15 — now all three are set
    changeSelect(day, "15");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("1990-03-15");
  });

  // 4. Clearing one part emits ""
  it('emits "" when a previously complete date has one select cleared', () => {
    const onChange = vi.fn();
    const { container, root } = mountTracked(
      <DateSelectGroup
        value="1990-05-20"
        onChange={onChange}
        idPrefix="t4"
      />,
    );

    const { month } = getSelects(container);

    // Simulate parent storing the echoed value (controlled component pattern)
    // then user clears Month back to placeholder
    onChange.mockClear();
    changeSelect(month, "");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("");
  });

  // 5. Leap-year clamp on year change
  it("clamps day to 28 and emits updated date when switching from leap to non-leap year", () => {
    const onChange = vi.fn();

    // Controlled wrapper so we can push a new value prop in
    function Wrapper() {
      const [val, setVal] = useState("2024-02-29");
      return (
        <DateSelectGroup
          value={val}
          onChange={(iso) => {
            onChange(iso);
            setVal(iso);
          }}
          idPrefix="t5"
        />
      );
    }

    const { container } = mountTracked(<Wrapper />);
    const { day, year } = getSelects(container);

    // Verify initial prefill
    expect(day.value).toBe("29");

    onChange.mockClear();

    // Change year to 2025 (non-leap) — Feb has only 28 days
    changeSelect(year, "2025");

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toBe("2025-02-28");
    expect(day.value).toBe("28");
  });

  // 6a. Day options: Feb 1990 → 28 options
  it("shows 28 day options for February in a non-leap year (1990)", () => {
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup
        value="1990-02-01"
        onChange={onChange}
        idPrefix="t6a"
      />,
    );

    const { day } = getSelects(container);
    // +1 for the placeholder option
    const valueOptions = Array.from(day.options).filter((o) => o.value !== "");
    expect(valueOptions).toHaveLength(28);
  });

  // 6b. Day options: Feb 2024 → 29 options (leap year)
  it("shows 29 day options for February in a leap year (2024)", () => {
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup
        value="2024-02-01"
        onChange={onChange}
        idPrefix="t6b"
      />,
    );

    const { day } = getSelects(container);
    const valueOptions = Array.from(day.options).filter((o) => o.value !== "");
    expect(valueOptions).toHaveLength(29);
  });

  // 6c. Day options: April 2024 → 30 options
  it("shows 30 day options for April (a 30-day month)", () => {
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup
        value="2024-04-01"
        onChange={onChange}
        idPrefix="t6c"
      />,
    );

    const { day } = getSelects(container);
    const valueOptions = Array.from(day.options).filter((o) => o.value !== "");
    expect(valueOptions).toHaveLength(30);
  });

  // 7. External reset — tests the echo-guard ref logic
  it("resets all selects to placeholder when parent passes value='' after a full date", () => {
    const onChange = vi.fn();

    function Wrapper() {
      const [val, setVal] = useState("1990-05-20");
      return (
        <>
          <button
            data-testid="reset"
            onClick={() => setVal("")}
          >
            reset
          </button>
          <DateSelectGroup
            value={val}
            onChange={(iso) => {
              onChange(iso);
              setVal(iso);
            }}
            idPrefix="t7"
          />
        </>
      );
    }

    const { container } = mountTracked(<Wrapper />);
    const { month, day, year } = getSelects(container);

    // Verify prefill
    expect(month.value).toBe("5");
    expect(day.value).toBe("20");
    expect(year.value).toBe("1990");

    onChange.mockClear();

    // Parent pushes reset
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="reset"]',
    )!;
    act(() => {
      btn.click();
    });

    expect(month.value).toBe("");
    expect(day.value).toBe("");
    expect(year.value).toBe("");
  });

  // 8. idPrefix produces unique, non-colliding IDs
  it("generates correct IDs from idPrefix and two instances do not collide", () => {
    const onChange = vi.fn();
    const { container: c1 } = mountTracked(
      <DateSelectGroup value="" onChange={onChange} idPrefix="syn-a" />,
    );
    const { container: c2 } = mountTracked(
      <DateSelectGroup value="" onChange={onChange} idPrefix="syn-b" />,
    );

    expect(c1.querySelector("#syn-a-date-month")).not.toBeNull();
    expect(c1.querySelector("#syn-a-date-day")).not.toBeNull();
    expect(c1.querySelector("#syn-a-date-year")).not.toBeNull();

    expect(c2.querySelector("#syn-b-date-month")).not.toBeNull();
    expect(c2.querySelector("#syn-b-date-day")).not.toBeNull();
    expect(c2.querySelector("#syn-b-date-year")).not.toBeNull();

    // IDs from one instance must not exist in the other container
    expect(c1.querySelector("#syn-b-date-month")).toBeNull();
    expect(c2.querySelector("#syn-a-date-month")).toBeNull();
  });

  // 9. monthNames override
  it("renders option labels from the monthNames override array", () => {
    const shortNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup
        value=""
        onChange={onChange}
        idPrefix="t9"
        monthNames={shortNames}
      />,
    );

    const { month } = getSelects(container);
    const valueOptions = Array.from(month.options).filter(
      (o) => o.value !== "",
    );

    expect(valueOptions).toHaveLength(12);
    expect(valueOptions[0].textContent).toBe("Jan");
    expect(valueOptions[1].textContent).toBe("Feb");
    expect(valueOptions[11].textContent).toBe("Dec");

    // Verify the default English names are NOT used
    expect(valueOptions[0].textContent).not.toBe("January");
  });

  // 10. labels prop — aria-labels and placeholder texts
  it("applies custom aria-labels and placeholder texts from the labels prop", () => {
    const customLabels = {
      month: "Mois",
      day: "Jour",
      year: "Année",
      monthPlaceholder: "Sélectionnez le mois",
      dayPlaceholder: "Sélectionnez le jour",
      yearPlaceholder: "Sélectionnez l'année",
      groupLabel: "Date de naissance",
    };
    const onChange = vi.fn();
    const { container } = mountTracked(
      <DateSelectGroup
        value=""
        onChange={onChange}
        idPrefix="t10"
        labels={customLabels}
      />,
    );

    // aria-labels on selects
    expect(
      container.querySelector('select[aria-label="Mois"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('select[aria-label="Jour"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('select[aria-label="Année"]'),
    ).not.toBeNull();

    // group wrapper aria-label
    const group = container.querySelector('[role="group"]');
    expect(group?.getAttribute("aria-label")).toBe("Date de naissance");

    // Placeholder option text
    const monthSelect = container.querySelector<HTMLSelectElement>(
      'select[aria-label="Mois"]',
    )!;
    const placeholder = Array.from(monthSelect.options).find(
      (o) => o.value === "",
    );
    expect(placeholder?.textContent).toBe("Sélectionnez le mois");
  });
});
