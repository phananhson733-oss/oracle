// INPUT: CBT 记录的最小子集（timestamp + moods 的强度数值；故意不接收任何自由文本字段）。
// OUTPUT: projectMoodPoints —— 把 CBT 记录投影成按 viewer 本地日聚合的情绪强度点（供时间轴叠加层）。
// POS: CBT 情绪叠加层（#23）的服务端数据最小化投影（设计 §10）。隐私红线 #1：仅出 {date,intensity,moodCount}，
//      绝不出 situation/automaticThoughts/hotThought/balancedEntries 等原文。若更新此文件，务必更新所属 FOLDER.md。

// 故意只声明需要的字段：函数在类型层就无法访问任何自由文本（数据最小化的结构性保证）。
export interface MoodPointInput {
  timestamp: number; // ms epoch
  moods: Array<{ initialIntensity: number; finalIntensity?: number }>;
}

export interface MoodPoint {
  date: string; // YYYY-MM-DD（viewer 本地日）
  intensity: number; // 0-100，当日各记录代表强度的均值
  moodCount: number; // 当日累计 mood 条目数（诚实计数，不泄内容）
}

// 在给定时区把 epoch 毫秒格式化为本地日 YYYY-MM-DD（en-CA 输出 ISO 风格）。无效时区回退 UTC。
function localDay(timestampMs: number, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toISOString().slice(0, 10);
  }
}

// 单条记录的代表强度 = 各 mood 的 (finalIntensity ?? initialIntensity) 均值（设计 §10 聚合规则）。
function recordIntensity(moods: MoodPointInput["moods"]): number | null {
  const vals = moods
    .map((m) => (typeof m.finalIntensity === "number" ? m.finalIntensity : m.initialIntensity))
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function projectMoodPoints(
  records: MoodPointInput[],
  tz: string,
  cutoffMs: number,
): MoodPoint[] {
  const byDay = new Map<string, { sum: number; n: number; moodCount: number }>();
  for (const r of records) {
    if (!(r.timestamp > cutoffMs)) continue; // TTL：丢弃过期记录
    const intensity = recordIntensity(r.moods);
    if (intensity === null) continue;
    const day = localDay(r.timestamp, tz);
    const acc = byDay.get(day) ?? { sum: 0, n: 0, moodCount: 0 };
    acc.sum += intensity;
    acc.n += 1;
    acc.moodCount += r.moods.length;
    byDay.set(day, acc);
  }
  return [...byDay.entries()]
    .map(([date, a]) => ({
      date,
      intensity: Math.max(0, Math.min(100, a.sum / a.n)),
      moodCount: a.moodCount,
    }))
    .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}
