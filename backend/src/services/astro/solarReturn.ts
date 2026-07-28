// INPUT: 注入的 sunLongitudeAt（任意 UTC 时刻的太阳黄经取数函数，便于单测）。纯求解逻辑，无直接 IO。
// OUTPUT: solveReturnInstant —— 求太阳回到本命黄经的精确时刻（返照盘 Solar Return 的核心）。
// POS: Solar Return 返照时刻求解器。生日窗口内对带符号夹角二分到分钟精度，窗口不够时自扩。
//      若更新此文件，务必同步 solarReturn.test.ts 与 astro/FOLDER.md。

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

// 带符号最短夹角 (lon - target) ∈ [-180,180)；生日附近太阳经度≈本命经度，不跨 360 翻转。
const signedDiff = (lon: number, target: number): number =>
  ((((lon - target) % 360) + 540) % 360) - 180;

export interface SolveReturnOptions {
  windowDays?: number; // 初始半窗（天），默认 ±2
  toleranceMs?: number; // 收敛精度，默认 1 分钟
  maxExpand?: number; // 窗口自扩次数上限
}

// 求 `year` 年里、(month,day) 生日附近，太阳黄经回到 natalLongitude 的 UTC 时刻。
// sunLongitudeAt(date) 返回该 UTC 时刻的太阳黄经 [0,360)。
export async function solveReturnInstant(
  natalLongitude: number,
  year: number,
  month: number,
  day: number,
  sunLongitudeAt: (date: Date) => Promise<number>,
  options: SolveReturnOptions = {},
): Promise<Date> {
  const halfWindow = (options.windowDays ?? 2) * DAY_MS;
  const tolerance = options.toleranceMs ?? MINUTE_MS;
  const maxExpand = options.maxExpand ?? 6;

  const birthday = Date.UTC(year, month - 1, day, 0, 0, 0);
  let lo = birthday - halfWindow;
  let hi = birthday + halfWindow;

  const f = async (t: number): Promise<number> => {
    const lon = await sunLongitudeAt(new Date(t));
    return signedDiff(lon, natalLongitude);
  };

  let flo = await f(lo);
  let fhi = await f(hi);

  // 自扩窗口直到 f(lo) <= 0 <= f(hi)（太阳过境前为负、过境后为正）。
  let expand = 0;
  while (flo > 0 && expand < maxExpand) {
    lo -= halfWindow;
    flo = await f(lo);
    expand += 1;
  }
  expand = 0;
  while (fhi < 0 && expand < maxExpand) {
    hi += halfWindow;
    fhi = await f(hi);
    expand += 1;
  }

  // 窗口扩展后仍未把根夹住（太阳真实数据下不可达——太阳只进不退、年内必回归一次；
  // 仅当注入的取数函数异常/退化时才可能）。宁可抛错让上层 500，也不返回伪造时刻。
  if (flo > 0 || fhi < 0) {
    throw new Error(
      `solar_return_bracket_failed: could not bracket natal longitude ${natalLongitude} near ${year}-${month}-${day}`,
    );
  }

  // 二分到 tolerance。
  while (hi - lo > tolerance) {
    const mid = Math.floor((lo + hi) / 2);
    const fm = await f(mid);
    if (fm < 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return new Date(Math.floor((lo + hi) / 2));
}
