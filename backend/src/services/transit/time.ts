// INPUT: 无运行时依赖（Intl 时区 API）。../../types/timeline.js 的 DominantPhase。
// OUTPUT: 纯函数日期/时区工具（enumerateDays / zonedHourToUtc / localDayInstants / phaseRelativeToPeak）。
// POS: transit timeline 的时区锚与日期枚举层（按 viewer 本地「日」分桶，设计 B7）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import type { DominantPhase } from "../../types/timeline.js";

const MS_PER_DAY = 86_400_000;
const MAX_DAYS = 4000; // 安全上限，防 range 异常导致 runaway

// 枚举 [from, to] 闭区间内的所有 YYYY-MM-DD（UTC 推进，无 DST 抖动）。to 早于 from 时返回空。
export function enumerateDays(from: string, to: string): string[] {
  const out: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  let cur = Date.parse(`${from}T00:00:00Z`);
  if (Number.isNaN(cur) || Number.isNaN(end)) return out;
  while (cur <= end && out.length < MAX_DAYS) {
    out.push(new Date(cur).toISOString().slice(0, 10));
    cur += MS_PER_DAY;
  }
  return out;
}

// 给定 UTC 时刻，返回某 IANA 时区在该时刻的偏移（本地墙钟 - UTC，毫秒）。
function tzOffsetMs(utcDate: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(utcDate)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - utcDate.getTime();
}

// 把「某 IANA 时区本地日 dateStr 的 hour 时」转换为对应的 UTC 时刻。
// 两步法（先按 UTC 猜测、再用该时刻偏移校正）；DST 切换附近可能有 ≤1h 偏差，
// 对日级能量曲线（月亮 ~0.5°/h）影响可忽略。hour 可为 24（区间末），Date.UTC 自动进位。
export function zonedHourToUtc(
  dateStr: string,
  hour: number,
  tz: string,
): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, 0, 0);
  const offset = tzOffsetMs(new Date(guess), tz);
  return new Date(guess - offset);
}

// 在 viewer 本地日内按 0/6/12/18/24h 采样的 5 个 UTC 时刻（蜡烛区间摘要的样本）。
export function localDayInstants(dateStr: string, tz: string): Date[] {
  return [0, 6, 12, 18, 24].map((h) => zonedHourToUtc(dateStr, h, tz));
}

// 相位运动方向：相对 episode 的最接近（exact）日。peak 前=逼近(applying)、当天=exact、之后=分离(separating)。
export function phaseRelativeToPeak(
  date: string,
  peakDate: string,
): DominantPhase {
  if (date < peakDate) return "applying";
  if (date > peakDate) return "separating";
  return "exact";
}
