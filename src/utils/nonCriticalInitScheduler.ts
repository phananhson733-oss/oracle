// INPUT: browser window timer/idle/event APIs and a non-critical initialization callback.
// OUTPUT: scheduleNonCriticalInit(), which delays analytics/performance initialization until well after first paint or user interaction.
// POS: PageSpeed runtime scheduling helper; keeps index.tsx side effects testable and prevents third-party scripts from entering the PageSpeed measurement window. 若更新此文件，务必更新 src/utils/FOLDER.md。

export const NON_CRITICAL_DELAY_MS = 12000;
export const INTERACTION_DELAY_MS = 1200;
export const IDLE_TIMEOUT_MS = 2500;

export const NON_CRITICAL_INTERACTION_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
] as const;

export interface NonCriticalSchedulerWindow {
  setTimeout: Window["setTimeout"];
  clearTimeout: Window["clearTimeout"];
  addEventListener: Window["addEventListener"];
  removeEventListener: Window["removeEventListener"];
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
}

export interface NonCriticalInitScheduleOptions {
  delayMs?: number;
  interactionDelayMs?: number;
  idleTimeoutMs?: number;
  interactionEvents?: readonly string[];
}

export interface NonCriticalInitScheduleHandle {
  cancel: () => void;
}

export const scheduleNonCriticalInit = (
  win: NonCriticalSchedulerWindow,
  initNonCritical: () => void,
  {
    delayMs = NON_CRITICAL_DELAY_MS,
    interactionDelayMs = INTERACTION_DELAY_MS,
    idleTimeoutMs = IDLE_TIMEOUT_MS,
    interactionEvents = NON_CRITICAL_INTERACTION_EVENTS,
  }: NonCriticalInitScheduleOptions = {},
): NonCriticalInitScheduleHandle => {
  let nonCriticalStarted = false;
  let cancelled = false;
  let delayedInitTimer: number | undefined;
  let interactionTimer: number | undefined;

  const cleanupInteractionListeners = () => {
    interactionEvents.forEach((eventName) => {
      win.removeEventListener(eventName, scheduleAfterInteraction);
    });
  };

  const runNonCriticalOnce = () => {
    if (cancelled || nonCriticalStarted) return;
    nonCriticalStarted = true;
    cleanupInteractionListeners();
    initNonCritical();
  };

  const scheduleIdleInit = () => {
    if (cancelled || nonCriticalStarted) return;
    if (typeof win.requestIdleCallback === "function") {
      win.requestIdleCallback(runNonCriticalOnce, { timeout: idleTimeoutMs });
    } else {
      win.setTimeout(runNonCriticalOnce, 0);
    }
  };

  function scheduleAfterInteraction() {
    if (cancelled || nonCriticalStarted) return;
    if (delayedInitTimer !== undefined) win.clearTimeout(delayedInitTimer);
    if (interactionTimer !== undefined) win.clearTimeout(interactionTimer);
    interactionTimer = win.setTimeout(scheduleIdleInit, interactionDelayMs);
  }

  delayedInitTimer = win.setTimeout(scheduleIdleInit, delayMs);
  interactionEvents.forEach((eventName) => {
    win.addEventListener(eventName, scheduleAfterInteraction, {
      once: true,
      passive: true,
    });
  });

  return {
    cancel: () => {
      cancelled = true;
      if (delayedInitTimer !== undefined) win.clearTimeout(delayedInitTimer);
      if (interactionTimer !== undefined) win.clearTimeout(interactionTimer);
      cleanupInteractionListeners();
    },
  };
};
