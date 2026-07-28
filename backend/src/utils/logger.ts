// INPUT: 调用方传入 message + 可选 context（Record）。读 LOG_LEVEL env（默认 info）。复用 sanitize-log 的 sanitizeForLog/SENSITIVE_FIELDS。
// OUTPUT: 轻量结构化 logger（error/warn/info/debug）——每条输出一行 JSON `{level,msg,ts,...ctx}` 到对应 console sink；createLogger 工厂 + 默认单例 logger。
// POS: 后端可观测性原语，取代 api/services 裸 console.*。PII 由 sanitizeForLog 在 logger 内部兜底脱敏（隐私红线 #3 双保险）；无新依赖、零冷启动崩溃。
//      若改本文件同步 utils/FOLDER.md 与 logger.test.ts。

import { sanitizeForLog, SENSITIVE_FIELDS } from "./sanitize-log.js";

/** 日志级别，从低到高（数值越大越严重）。 */
export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** 未配置 / 配置非法时的安全默认级别。 */
const DEFAULT_LEVEL: LogLevel = "info";

/** logger 调用方可传的结构化上下文。 */
export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export interface LoggerOptions {
  /** 显式级别；省略 / 非法时回退到 DEFAULT_LEVEL。 */
  level?: LogLevel | string;
}

/**
 * 把任意输入收敛为合法 {@link LogLevel}，非法值回退 {@link DEFAULT_LEVEL}。
 * 用于解析 LoggerOptions.level 与 LOG_LEVEL env，保证冷启动不崩。
 */
function resolveLevel(value: string | undefined): LogLevel {
  if (value && value in LEVEL_RANK) {
    return value as LogLevel;
  }
  return DEFAULT_LEVEL;
}

/**
 * Error 在 JSON.stringify 下序列化为 `{}`（message/stack/name 是非枚举属性），
 * 会丢失全部诊断信息。这里把 Error 展开为可读形状（name/message/stack）。
 * stack 不含用户原文，但仍经下游 sanitizeForLog 走一遍兜底。
 */
function normalizeErrors(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) {
    return value.map(normalizeErrors);
  }
  if (value && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = normalizeErrors(v);
      }
      return out;
    }
  }
  return value;
}

/** 级别 → 底层 console sink；error→stderr 语义，warn→stderr，info/debug→stdout。 */
const SINKS: Record<LogLevel, (line: string) => void> = {
  debug: (line) => console.debug(line),
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line),
};

/**
 * 构造一个结构化 logger。
 *
 * - 级别过滤：低于配置级别的调用被丢弃（默认 info，debug 仅显式开启时输出）。
 * - 结构化：每条输出一行 JSON `{ level, msg, ts, ...sanitizedContext }`。
 * - PII 兜底：context 在写出前必经 {@link sanitizeForLog}（隐私红线 #3 双保险）。
 *   调用点仍应对高危 payload 显式脱敏；本兜底是第二道防线，不是免责。
 * - 不可变：sanitizeForLog 返回深克隆，调用方的 context 对象不被修改。
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const minRank = LEVEL_RANK[resolveLevel(options.level)];

  function emit(level: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_RANK[level] < minRank) {
      return;
    }
    const record: Record<string, unknown> = {
      level,
      msg: message,
      ts: new Date().toISOString(),
    };
    if (context) {
      // 先展开 Error 为可读形状，再过 PII 脱敏（深克隆 + 不可变）。
      const normalized = normalizeErrors(context) as LogContext;
      const safe = sanitizeForLog(normalized, SENSITIVE_FIELDS);
      Object.assign(record, safe);
    }
    let line: string;
    try {
      line = JSON.stringify(record);
    } catch {
      // 循环引用等极端情况下不丢日志：退化为最小可诊断结构。
      line = JSON.stringify({ level, msg: message, ts: record.ts });
    }
    SINKS[level](line);
  }

  return {
    debug: (message, context) => emit("debug", message, context),
    info: (message, context) => emit("info", message, context),
    warn: (message, context) => emit("warn", message, context),
    error: (message, context) => emit("error", message, context),
  };
}

/**
 * 进程级默认 logger，级别来自 LOG_LEVEL env（默认 info）。
 * api/services 直接 `import { logger } from "../utils/logger.js"` 使用。
 */
export const logger: Logger = createLogger({ level: process.env.LOG_LEVEL });
