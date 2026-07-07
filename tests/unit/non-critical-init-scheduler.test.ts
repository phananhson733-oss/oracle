// @vitest-environment jsdom
// INPUT: scheduleNonCriticalInit helper plus fake browser timer/event APIs.
// OUTPUT: Verifies analytics/performance initialization stays delayed, can be moved after user interaction, and only runs once.
// POS: PageSpeed regression tests for index.tsx non-critical analytics/web-vitals scheduling.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  INTERACTION_DELAY_MS,
  NON_CRITICAL_DELAY_MS,
  scheduleNonCriticalInit,
  type NonCriticalSchedulerWindow,
} from "../../src/utils/nonCriticalInitScheduler";

type Listener = (event?: Event) => void;

const createFakeWindow = ({
  idle = true,
}: { idle?: boolean } = {}): NonCriticalSchedulerWindow & {
  emit: (eventName: string) => void;
  listenerCount: (eventName: string) => number;
  idleCalls: Array<{ timeout: number | undefined }>;
} => {
  const listeners = new Map<string, Set<Listener>>();
  const idleCalls: Array<{ timeout: number | undefined }> = [];

  const win: NonCriticalSchedulerWindow & {
    emit: (eventName: string) => void;
    listenerCount: (eventName: string) => number;
    idleCalls: Array<{ timeout: number | undefined }>;
  } = {
    setTimeout: ((callback: TimerHandler, timeout?: number) =>
      window.setTimeout(callback, timeout)) as Window["setTimeout"],
    clearTimeout: ((id?: number) =>
      window.clearTimeout(id)) as Window["clearTimeout"],
    addEventListener: ((
      eventName: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      const set = listeners.get(eventName) ?? new Set<Listener>();
      const callback =
        typeof listener === "function"
          ? listener
          : listener.handleEvent.bind(listener);
      set.add(callback as Listener);
      listeners.set(eventName, set);
    }) as Window["addEventListener"],
    removeEventListener: ((
      eventName: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      const set = listeners.get(eventName);
      if (!set) return;
      const callback =
        typeof listener === "function"
          ? listener
          : listener.handleEvent.bind(listener);
      set.delete(callback as Listener);
    }) as Window["removeEventListener"],
    emit: (eventName: string) => {
      listeners
        .get(eventName)
        ?.forEach((listener) => listener(new Event(eventName)));
    },
    listenerCount: (eventName: string) => listeners.get(eventName)?.size ?? 0,
    idleCalls,
  };

  if (idle) {
    win.requestIdleCallback = (callback, options) => {
      idleCalls.push({ timeout: options?.timeout });
      window.setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => 50,
        });
      }, 0);
      return idleCalls.length;
    };
  }

  return win;
};

describe("scheduleNonCriticalInit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for the default post-first-paint delay before using idle time", () => {
    const init = vi.fn();
    const win = createFakeWindow();

    scheduleNonCriticalInit(win, init);

    vi.advanceTimersByTime(NON_CRITICAL_DELAY_MS - 1);
    expect(init).not.toHaveBeenCalled();
    expect(win.idleCalls).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(win.idleCalls).toHaveLength(1);
    expect(init).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("moves initialization earlier after user interaction but still waits briefly and idles", () => {
    const init = vi.fn();
    const win = createFakeWindow();

    scheduleNonCriticalInit(win, init);
    win.emit("pointerdown");

    vi.advanceTimersByTime(INTERACTION_DELAY_MS - 1);
    expect(init).not.toHaveBeenCalled();
    expect(win.idleCalls).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(win.idleCalls).toHaveLength(1);

    vi.runOnlyPendingTimers();
    expect(init).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(NON_CRITICAL_DELAY_MS);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("falls back to setTimeout when requestIdleCallback is unavailable", () => {
    const init = vi.fn();
    const win = createFakeWindow({ idle: false });

    scheduleNonCriticalInit(win, init);
    vi.advanceTimersByTime(NON_CRITICAL_DELAY_MS);
    expect(init).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("removes interaction listeners after initialization or cancellation", () => {
    const init = vi.fn();
    const win = createFakeWindow();

    const handle = scheduleNonCriticalInit(win, init);
    expect(win.listenerCount("pointerdown")).toBe(1);

    vi.advanceTimersByTime(NON_CRITICAL_DELAY_MS);
    vi.runOnlyPendingTimers();
    expect(init).toHaveBeenCalledTimes(1);
    expect(win.listenerCount("pointerdown")).toBe(0);

    const second = scheduleNonCriticalInit(win, init);
    expect(win.listenerCount("pointerdown")).toBe(1);
    second.cancel();
    win.emit("pointerdown");
    vi.runOnlyPendingTimers();
    expect(init).toHaveBeenCalledTimes(1);
    expect(win.listenerCount("pointerdown")).toBe(0);

    handle.cancel();
  });
});
