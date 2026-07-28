// INPUT: a `query` string + an async `search` function + `onSelect` callback supplied by the consumer.
// OUTPUT: a generic, headless combobox controller. Debounces the search, holds suggestions,
//         tracks the keyboard-focused option (Arrow/Enter/Esc/Home/End), and returns a11y prop bundles
//         (combobox/listbox/option) ready to spread onto JSX. The consumer still owns its own query
//         state and decides what to do when an item is selected (lat/lon capture etc.).
// POS: Shared by all 5 city-autocomplete call sites — OnboardingPage, landing/BirthChartSection,
//      SynastryPage (×2), SaturnReturnCalculator. Replaces hand-rolled debounce+suggestion state in each.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export type NavigationKey =
  | "ArrowDown"
  | "ArrowUp"
  | "Enter"
  | "Escape"
  | "Home"
  | "End";

// Pure index reducer — exported so the keyboard logic can be unit-tested
// without mounting a React tree (project does not currently depend on
// @testing-library/react; adding it for one hook is out of scope here).
// Returns -1 when there are no items, the new active index otherwise.
export function nextActiveIndex(
  key: NavigationKey,
  current: number,
  count: number,
): number {
  if (count <= 0) return -1;
  switch (key) {
    case "ArrowDown":
      if (current < 0 || current >= count - 1) return 0;
      return current + 1;
    case "ArrowUp":
      if (current <= 0) return count - 1;
      return current - 1;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return current;
  }
}

export interface UseCityAutocompleteOptions<T> {
  // The current text in the input. The hook does NOT own this — consumers
  // manage their own form state to fit existing data shapes (UserProfile,
  // SynastryProfile, etc.).
  query: string;
  // Async search function. The hook is agnostic to the result type so this
  // works with both `searchCitiesWithFallback` (returns local-or-remote
  // `City[]`) and `apiClient.searchCities` (returns raw `GeoResult[]`).
  search: (query: string) => Promise<readonly T[]>;
  // Called after a selection (mouse or Enter). The consumer decides how to
  // map the picked item back into its form state.
  onSelect: (item: T) => void;
  // Either a fixed minimum query length or a function that derives it from
  // the (trimmed) query — e.g. CJK queries match at length 1, latin at 2.
  // Defaults to 2.
  minLength?: number | ((q: string) => number);
  debounceMs?: number;
  // When false, the hook stops searching (used by BirthChartSection where
  // birthCoords.lat being set means the query already matches a canonical
  // label and a fresh search would just re-fetch the same row).
  enabled?: boolean;
  // Distinct id prefix per hook instance so two comboboxes on the same page
  // (e.g. SynastryPage Person A + Person B) don't share aria-controls /
  // aria-activedescendant targets. Defaults to "city-ac".
  idPrefix?: string;
}

export interface CityAutocompleteApi<T> {
  suggestions: readonly T[];
  isSearching: boolean;
  isOpen: boolean;
  activeIndex: number;
  open: () => void;
  close: () => void;
  // Imperative select-by-index (used by mouse handlers in consumers).
  selectIndex: (index: number) => void;
  // Spread onto the <input> element.
  inputProps: {
    role: "combobox";
    "aria-expanded": boolean;
    "aria-autocomplete": "list";
    "aria-controls": string | undefined;
    "aria-activedescendant": string | undefined;
    onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  };
  // Spread onto the listbox container (works for <div> or <ul>).
  listboxProps: {
    id: string;
    role: "listbox";
  };
  // Per-option a11y props. Consumers handle the click/mousedown themselves
  // because BirthChartSection needs onMouseDown to fire before input.onBlur.
  getOptionProps: (index: number) => {
    id: string;
    role: "option";
    "aria-selected": boolean;
  };
}

function resolveMinLength(
  trimmed: string,
  minLength: UseCityAutocompleteOptions<unknown>["minLength"],
): number {
  if (typeof minLength === "function") return minLength(trimmed);
  if (typeof minLength === "number") return minLength;
  return 2;
}

export function useCityAutocomplete<T>(
  options: UseCityAutocompleteOptions<T>,
): CityAutocompleteApi<T> {
  const {
    query,
    search,
    onSelect,
    minLength,
    debounceMs = 300,
    enabled = true,
    idPrefix = "city-ac",
  } = options;

  const [suggestions, setSuggestions] = useState<readonly T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Keep the latest search function in a ref so the debounce effect doesn't
  // re-fire every render when consumers pass an inline closure.
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const listboxId = useMemo(() => `${idPrefix}-listbox`, [idPrefix]);
  const optionIdFor = useCallback(
    (index: number) => `${idPrefix}-option-${index}`,
    [idPrefix],
  );

  // Debounced search. Cancels stale in-flight responses via a `cancelled`
  // flag — we deliberately do NOT call setIsSearching in the cleanup branch
  // because the component may be unmounting (React 18 warns on state updates
  // during unmount).
  useEffect(() => {
    const trimmed = query.trim();
    const min = resolveMinLength(trimmed, minLength);
    if (!enabled || trimmed.length < min) {
      setSuggestions([]);
      setIsSearching(false);
      setActiveIndex(-1);
      return;
    }
    setIsSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await searchRef.current(trimmed);
        if (cancelled) return;
        setSuggestions(results);
        setActiveIndex(-1);
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setActiveIndex(-1);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled, debounceMs, minLength]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const item = suggestions[index];
      if (item === undefined) return;
      onSelect(item);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSelect, suggestions],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      const count = suggestions.length;
      const navKeys: ReadonlySet<string> = new Set([
        "ArrowDown",
        "ArrowUp",
        "Home",
        "End",
      ]);
      if (navKeys.has(event.key)) {
        if (count === 0) return;
        event.preventDefault();
        if (!isOpen) setIsOpen(true);
        setActiveIndex((prev) =>
          nextActiveIndex(event.key as NavigationKey, prev, count),
        );
        return;
      }
      if (event.key === "Enter") {
        if (!isOpen || activeIndex < 0 || activeIndex >= count) return;
        event.preventDefault();
        selectIndex(activeIndex);
        return;
      }
      if (event.key === "Escape") {
        if (!isOpen) return;
        event.preventDefault();
        close();
      }
    },
    [activeIndex, close, isOpen, selectIndex, suggestions.length],
  );

  const inputProps: CityAutocompleteApi<T>["inputProps"] = useMemo(
    () => ({
      role: "combobox",
      "aria-expanded": isOpen,
      "aria-autocomplete": "list",
      "aria-controls": isOpen ? listboxId : undefined,
      "aria-activedescendant":
        isOpen && activeIndex >= 0 ? optionIdFor(activeIndex) : undefined,
      onKeyDown,
    }),
    [activeIndex, isOpen, listboxId, onKeyDown, optionIdFor],
  );

  const listboxProps: CityAutocompleteApi<T>["listboxProps"] = useMemo(
    () => ({ id: listboxId, role: "listbox" }),
    [listboxId],
  );

  const getOptionProps = useCallback(
    (index: number) => ({
      id: optionIdFor(index),
      role: "option" as const,
      "aria-selected": index === activeIndex,
    }),
    [activeIndex, optionIdFor],
  );

  return {
    suggestions,
    isSearching,
    isOpen,
    activeIndex,
    open,
    close,
    selectIndex,
    inputProps,
    listboxProps,
    getOptionProps,
  };
}
