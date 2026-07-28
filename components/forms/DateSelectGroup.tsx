// INPUT: value (YYYY-MM-DD or empty), onChange callback, optional labels and
//        month-name override for i18n, optional year range, optional CSS classes.
// OUTPUT: A controlled three-`<select>` (Month / Day / Year) date picker that
//         does NOT depend on the operating-system locale (unlike native
//         `<input type="date">`). Emits a composed YYYY-MM-DD string via
//         onChange when all three parts are selected, or "" when any part is
//         unselected. Day options clamp to the selected month/year (Feb 29
//         only in leap years, etc.) and pre-selected day clamps live when
//         month/year change into a shorter month.
// POS: Shared form primitive used by Landing's BirthChartSection, Onboarding,
//      Synastry, and the standalone Saturn Return Calculator. Extracted to
//      stop four sites from drifting on the same "OS-locale leaks
//      placeholders" problem (BC01) AND to centralise the split-state
//      protocol that prevents the "any partial selection resets all three
//      selects" bug fixed in PR #29.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const DEFAULT_MONTH_NAMES_EN: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

// Days-in-month for given (year, monthIndex 0-11). Handles Gregorian leap years
// via Date(y, m+1, 0).getDate(). Falls back to 31 for malformed inputs.
const daysInMonth = (year: number, monthIndex: number): number => {
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return 31;
  return new Date(year, monthIndex + 1, 0).getDate();
};

// Parse YYYY-MM-DD into typed parts. Returns nulls on empty/malformed so the
// three selects render their placeholder option.
const parseIsoDate = (
  iso: string,
): { year: number | null; month: number | null; day: number | null } => {
  if (!iso) return { year: null, month: null, day: null };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return { year: null, month: null, day: null };
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  };
};

export interface DateSelectGroupLabels {
  /** aria-label on the Month select. Default: "Month" */
  month?: string;
  /** aria-label on the Day select. Default: "Day" */
  day?: string;
  /** aria-label on the Year select. Default: "Year" */
  year?: string;
  /** Placeholder option text for Month. Default: "Month" */
  monthPlaceholder?: string;
  /** Placeholder option text for Day. Default: "Day" */
  dayPlaceholder?: string;
  /** Placeholder option text for Year. Default: "Year" */
  yearPlaceholder?: string;
  /** aria-label on the role=group wrapper. Default: "Birth date" */
  groupLabel?: string;
}

export interface DateSelectGroupProps {
  /** ISO YYYY-MM-DD or empty string when no date is selected. */
  value: string;
  /**
   * Called with a composed YYYY-MM-DD when all three parts are populated, or
   * with "" when any part is cleared. Day is clamped to the month/year's
   * actual length (Feb 29 → Feb 28 in non-leap years) before composition.
   */
  onChange: (iso: string) => void;
  /**
   * Unique-per-form prefix for stable `<select>` IDs. Required so multiple
   * groups on the same page (e.g. Synastry person A + person B) don't collide.
   */
  idPrefix: string;
  /** className for the wrapping <div role="group">. */
  className?: string;
  /** className applied to each of the three <select> controls. */
  selectClassName?: string;
  /** Optional localised labels. English fallbacks otherwise. */
  labels?: DateSelectGroupLabels;
  /**
   * Optional 12-string array of localised month names. If omitted, English
   * month names are used. Each consumer that has a translation dictionary
   * should pass its localised array.
   */
  monthNames?: readonly string[];
  /** Mark all three selects required (used for native form validation). */
  required?: boolean;
  /** Earliest selectable year. Default: 1900. */
  minYear?: number;
  /** Latest selectable year. Default: current calendar year. */
  maxYear?: number;
}

/**
 * Locale-stable three-select date input. Internally owns `year/month/day:
 * number | null` state slots — emitting a composed ISO string up to the
 * parent only when all three are populated. A naïve "compose-and-emit on
 * every change" implementation would round-trip through the parent's `""`
 * sentinel during partial selections and reset all three selects, which is
 * the regression PR #29 fixed and this component generalises across
 * BirthChart / Onboarding / Synastry / SaturnReturn.
 */
export const DateSelectGroup: React.FC<DateSelectGroupProps> = ({
  value,
  onChange,
  idPrefix,
  className,
  selectClassName,
  labels,
  monthNames,
  required,
  minYear = 1900,
  maxYear,
}) => {
  // Internal parts state. Seed from incoming `value` so prefill (e.g.
  // Onboarding's `initialPrefill.birthDate`) renders correctly on first paint.
  const seed = useMemo(() => parseIsoDate(value), [value]);
  const [year, setYear] = useState<number | null>(seed.year);
  const [month, setMonth] = useState<number | null>(seed.month);
  const [day, setDay] = useState<number | null>(seed.day);

  // Track the last ISO we emitted so we can distinguish an external value
  // change (parent reset, prefill update) from our own echo (parent stored
  // what we just emitted and passed it back in). Echo: do nothing. External:
  // re-sync internal state to the new value.
  const lastEmittedRef = useRef<string>(value);
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    const next = parseIsoDate(value);
    setYear(next.year);
    setMonth(next.month);
    setDay(next.day);
    lastEmittedRef.current = value;
  }, [value]);

  // Live-clamp the day when month/year shrink the valid range (e.g. user
  // picked Feb 29 in 2024, then flipped to 2025).
  useEffect(() => {
    if (year === null || month === null || day === null) return;
    const maxDay = daysInMonth(year, month - 1);
    if (day > maxDay) setDay(maxDay);
  }, [year, month, day]);

  // Compose and emit to parent. When any part is missing, emit "".
  useEffect(() => {
    let next: string;
    if (year === null || month === null || day === null) {
      next = "";
    } else {
      const clampedDay = Math.min(day, daysInMonth(year, month - 1));
      next = `${year}-${pad2(month)}-${pad2(clampedDay)}`;
    }
    if (next === lastEmittedRef.current) return;
    lastEmittedRef.current = next;
    onChange(next);
  }, [year, month, day, onChange]);

  const handleMonthChange = useCallback((raw: string) => {
    setMonth(raw ? Number(raw) : null);
  }, []);
  const handleDayChange = useCallback((raw: string) => {
    setDay(raw ? Number(raw) : null);
  }, []);
  const handleYearChange = useCallback((raw: string) => {
    setYear(raw ? Number(raw) : null);
  }, []);

  const effectiveMaxYear = maxYear ?? new Date().getFullYear();
  const yearOptions = useMemo<number[]>(() => {
    const span = effectiveMaxYear - minYear + 1;
    if (span <= 0) return [];
    // Newest first so the common case (recent birth years) is reachable
    // without scrolling through 125 entries.
    return Array.from({ length: span }, (_, i) => effectiveMaxYear - i);
  }, [minYear, effectiveMaxYear]);

  const dayOptions = useMemo<number[]>(() => {
    const max =
      year !== null && month !== null ? daysInMonth(year, month - 1) : 31;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [year, month]);

  const names = monthNames ?? DEFAULT_MONTH_NAMES_EN;

  const monthLabel = labels?.month ?? "Month";
  const dayLabel = labels?.day ?? "Day";
  const yearLabel = labels?.year ?? "Year";
  const monthPlaceholder = labels?.monthPlaceholder ?? "Month";
  const dayPlaceholder = labels?.dayPlaceholder ?? "Day";
  const yearPlaceholder = labels?.yearPlaceholder ?? "Year";
  const groupLabel = labels?.groupLabel ?? "Birth date";

  return (
    <div
      className={
        className ?? "mt-2 grid grid-cols-[1.4fr_1fr_1fr] gap-2"
      }
      role="group"
      aria-label={groupLabel}
    >
      <select
        id={`${idPrefix}-date-month`}
        required={required}
        value={month !== null ? String(month) : ""}
        onChange={(e) => handleMonthChange(e.target.value)}
        aria-label={monthLabel}
        className={selectClassName}
      >
        <option value="" disabled>
          {monthPlaceholder}
        </option>
        {names.map((monthName, idx) => (
          <option key={idx + 1} value={String(idx + 1)}>
            {monthName}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-date-day`}
        required={required}
        value={day !== null ? String(day) : ""}
        onChange={(e) => handleDayChange(e.target.value)}
        aria-label={dayLabel}
        className={selectClassName}
      >
        <option value="" disabled>
          {dayPlaceholder}
        </option>
        {dayOptions.map((d) => (
          <option key={d} value={String(d)}>
            {d}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-date-year`}
        required={required}
        value={year !== null ? String(year) : ""}
        onChange={(e) => handleYearChange(e.target.value)}
        aria-label={yearLabel}
        className={selectClassName}
      >
        <option value="" disabled>
          {yearPlaceholder}
        </option>
        {yearOptions.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateSelectGroup;
