// INPUT: 读 SENTRY_DSN / NODE_ENV env。复用 utils/sanitize-log 的 sanitizeForLog/SENSITIVE_FIELDS 与 utils/logger。
// OUTPUT: initMonitoring()（DSN 未设即 no-op 且不动态 import）/ captureError(err, ctx) / scrubEvent（beforeSend 脱敏）/ isMonitoringActive。
// POS: 后端错误监控接线（backlog #10b）。Sentry SDK 仅在配置 DSN 时动态加载，避免冷启动负重；
//      所有出站事件经 sanitizeForLog 脱敏（隐私红线 #3）。无 DSN 时生产不初始化、不 mock；监控失败绝不拖垮请求。

import { sanitizeForLog, SENSITIVE_FIELDS } from "../utils/sanitize-log.js";
import { logger } from "../utils/logger.js";

/** Sentry 事件里可能携带 PII 的子集——只声明我们要清洗的字段。 */
export interface ScrubbableEvent {
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  request?: {
    data?: unknown;
    cookies?: unknown;
    headers?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

type SentryModule = typeof import("@sentry/node");

let sentry: SentryModule | null = null;
let active = false;

/**
 * beforeSend 钩子：事件离开进程前剥离 PII。
 * - extra/contexts 深度过 sanitizeForLog（birth/question/name… → [redacted]）。
 * - request.data（请求体，可能含出生数据/提问）、cookies、authorization/cookie 头整体丢弃。
 * 不可变：返回新对象，不改入参。
 */
export function scrubEvent<E extends ScrubbableEvent>(event: E): E {
  const scrubbed: ScrubbableEvent = { ...event };
  if (scrubbed.extra) {
    scrubbed.extra = sanitizeForLog(scrubbed.extra, SENSITIVE_FIELDS);
  }
  if (scrubbed.contexts) {
    scrubbed.contexts = sanitizeForLog(scrubbed.contexts, SENSITIVE_FIELDS);
  }
  if (scrubbed.request) {
    const safeRequest: Record<string, unknown> = { ...scrubbed.request };
    delete safeRequest.data;
    delete safeRequest.cookies;
    if (safeRequest.headers && typeof safeRequest.headers === "object") {
      const safeHeaders = {
        ...(safeRequest.headers as Record<string, unknown>),
      };
      delete safeHeaders.authorization;
      delete safeHeaders.cookie;
      safeRequest.headers = safeHeaders;
    }
    scrubbed.request = safeRequest;
  }
  return scrubbed as E;
}

/**
 * 初始化错误监控。SENTRY_DSN 未设 → no-op 且**不动态 import** SDK（零冷启动成本）。
 * 设了才动态加载 @sentry/node 并最小化初始化（仅错误捕获，tracesSampleRate=0，无 APM）。
 * 任何失败都被吞掉并记 warn，绝不让监控初始化拖垮服务冷启动。
 */
export async function initMonitoring(): Promise<boolean> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info("Error monitoring disabled (SENTRY_DSN not set)");
    return false;
  }
  try {
    sentry = await import("@sentry/node");
    sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0,
      beforeSend: (event) =>
        scrubEvent(
          event as unknown as ScrubbableEvent,
        ) as unknown as typeof event,
    });
    active = true;
    logger.info("Error monitoring initialized", {
      environment: process.env.NODE_ENV || "development",
    });
    return true;
  } catch (error) {
    sentry = null;
    active = false;
    logger.warn("Error monitoring init failed; continuing without it", {
      error,
    });
    return false;
  }
}

/**
 * 上报异常。监控未激活 → no-op。context 经 sanitizeForLog 脱敏后作为 extra。
 * 自身永不抛出——监控不得破坏请求路径。
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!active || !sentry) return;
  try {
    sentry.captureException(
      error,
      context
        ? { extra: sanitizeForLog(context, SENSITIVE_FIELDS) }
        : undefined,
    );
  } catch {
    // 监控失败不得影响业务
  }
}

export function isMonitoringActive(): boolean {
  return active;
}
