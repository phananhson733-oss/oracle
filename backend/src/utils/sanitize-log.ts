// INPUT: 无外部依赖（纯函数）。调用方传入待写日志的 payload。
// OUTPUT: SENSITIVE_FIELDS（PII 键名集合）+ sanitizeForLog(payload, fields)——返回深克隆副本，
//         把敏感键的值替换为 [redacted]，原对象不变（不可变）。
// POS: 隐私红线 #3「服务端日志不写原文」的机械执行原语。API endpoint 的 console.error/logger
//      在写出含 PII 的 payload 前必须先过 sanitizeForLog。若改本文件同步 utils/FOLDER.md。

/** 替换敏感字段值的占位文本。 */
export const REDACTED = '[redacted]';

/**
 * 隐私红线列出的高敏感字段键名（CLAUDE.md §隐私红线 #3）。
 * - CBT：question / situation / moods / automaticThoughts / hotThought / balancedEntries
 * - Synastry：nameA / nameB
 * - 出生数据：birth（整树）+ 常见子字段 + lat/lon（含 latitude/longitude 别名）
 * 按「键名」在任意嵌套深度匹配；命中即把该键的值整体替换为 [redacted]。
 */
export const SENSITIVE_FIELDS: ReadonlySet<string> = new Set([
  'question',
  'situation',
  'moods',
  'automaticThoughts',
  'hotThought',
  'balancedEntries',
  'nameA',
  'nameB',
  'birth',
  'birthDate',
  'birthTime',
  'birthCity',
  'birthCoordinates',
  'lat',
  'lon',
  'latitude',
  'longitude',
]);

/**
 * 仅对「纯对象」（Object.prototype 或 null 原型）递归，避免把 Date / Map / 类实例
 * 拆成丢失语义的空对象——它们作为叶子原样保留。
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 返回 `payload` 的深克隆副本：任意嵌套深度上，键名命中 `fields` 的字段其值被替换为
 * [redacted]；其余字段原样保留。**不可变**——原 `payload` 不被修改。
 *
 * - 数组：逐元素递归。
 * - 纯对象：重建新对象，命中键 redact、其余递归。
 * - null / undefined / 原始值 / Date 等类实例：原样返回（不递归）。
 *
 * 默认用 {@link SENSITIVE_FIELDS}；调用方可传自定义键集（如脱敏鉴权 token）。
 */
export function sanitizeForLog<T>(
  payload: T,
  fields: ReadonlySet<string> = SENSITIVE_FIELDS,
): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeForLog(item, fields)) as unknown as T;
  }
  if (isPlainObject(payload)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      out[key] = fields.has(key) ? REDACTED : sanitizeForLog(value, fields);
    }
    return out as unknown as T;
  }
  return payload;
}
