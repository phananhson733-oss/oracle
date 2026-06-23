// INPUT: TimelineCandle[] / TimelineMarker[]（来自 /api/transit/timeline）、useLanguage、点选回调；buildOhlcSeries（派生连续 OHLC）。
// OUTPUT: 自绘 SVG 蜡烛图组件（**连续 OHLC 游走**：close=本根强度、open=上一根 close → body=跨周期能量变化、wick=本期波动范围；参考 oracle_CN 真 K 线观感）；**fit 一页**（蜡烛多则自动变窄填满容器、不横滚，zoom>1 才横滚平移）。
//         A3 响应式图高(mobile/desktop)；A10 nowKey→「You are here」竖线+点+aria；A8 nowKey 后仅显示前 5 个未来 marker；**hover→浮动解读卡**（活跃度/跨期变化/区间/倾向，中性文案）。
// POS: 月度/年/长程 K 线主视图。蜡烛体按方向**实心**红/绿着色（这期比上期更活跃=绿、更平静=红、近平=中性灰；描述性非预测/命运）；
//      body 因连续游走天然短而均匀（不再用按粒度 clamp 的魔法数）；色盲冗余由 grey-flat + 趋势线 + hover 数值承载。纵轴=中性能量强度，仅与自身比较。

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineCandle, TimelineMarker } from "../../types";
import { useLanguage, useTheme } from "../UIComponents";
import { buildOhlcSeries, type OhlcDir } from "./derived";

export interface TimelineMoodPoint {
  date: string;
  intensity: number; // 0-100（CBT 情绪强度，与能量纵轴同刻度叠加）
}

interface TimelineChartProps {
  candles: TimelineCandle[];
  markers?: TimelineMarker[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  // CBT 情绪叠加层（#23）：按 date 对齐叠到能量曲线上（仅月度日级）。自我觉察非因果。
  moodPoints?: TimelineMoodPoint[];
  // A8/A10：当前时点的候选 key（月度=今日 YYYY-MM-DD、长程=age-N）。
  // 用于 "You are here" 指示线(A10) + 仅显示其后的未来 marker(A8)。不在视图内则两者退化。
  nowKey?: string | null;
  // B6：趋势线（MA）显示开关（默认 true）。关掉只看蜡烛、不看平滑趋势。
  showTrend?: boolean;
  // B6：横向缩放系数（默认 1）。>1 放大（蜡烛更宽、配合容器横滚平移）；平移=既有 overflow-x 滚动。
  zoomFactor?: number;
}

// 蜡烛体方向着色（连续 OHLC 游走，参考 oracle_CN）：close≥open=这期比上期更活跃=绿、
// close<open=更平静=红、近乎持平=中性灰（doji）。描述性非预测；"非好坏"的中性框架由 onboarding/图例/文案承载。
const COLOR_UP = "#10B981"; // emerald-500 — 能量较上期走强（更沉稳，参考 oracle_CN）
const COLOR_DOWN = "#EF4444"; // red-500 — 能量较上期回落
const COLOR_FLAT = "#94A3B8"; // slate-400 — 与上期大致持平 (doji)
const COLOR_MA = "#A855F7"; // mystic-500 — smoothing line (distinct from red/green)
const COLOR_SELECTED = "#2563EB"; // psycho-600 — selection ring
const COLOR_MOOD = "#0D9488"; // teal-600 — CBT 情绪叠加层（与红/绿/紫均区分，自我觉察非因果）

// A3：响应式图高——窄屏(mobile)更矮、宽屏(desktop)更高（总高 = H + PAD_TOP + PAD_BOTTOM）。
const H_MOBILE = 300; // 总 ~344，落在 280-360
const H_DESKTOP = 440; // 总 ~484，落在 420-520
const H_BREAKPOINT = 640; // px：容器宽度切换点
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_LEFT = 26; // room for y-axis labels
const PAD_RIGHT = 10;
// 蜡烛横向槽位上限：fit 一页（蜡烛多则自动变窄填满容器，不再因过多候选横滚）；封顶防少蜡烛在宽屏过大。
const MAX_SLOT = 22;
const DEFAULT_WIDTH = 720;

// OHLC 方向 → 颜色（连续游走着色，描述性非预测）。
function colorOf(dir: OhlcDir): string {
  if (dir === "up") return COLOR_UP;
  if (dir === "down") return COLOR_DOWN;
  return COLOR_FLAT;
}

// 简单 7 点移动平均，平滑主曲线（设计 §7 MA 平滑）。
function movingAverage(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const lo = Math.max(0, i - Math.floor(window / 2));
    const hi = Math.min(values.length - 1, i + Math.floor(window / 2));
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += values[j];
    return sum / (hi - lo + 1);
  });
}

export const TimelineChart: React.FC<TimelineChartProps> = ({
  candles,
  markers = [],
  selectedDate,
  onSelectDate,
  moodPoints = [],
  nowKey = null,
  showTrend = true,
  zoomFactor = 1,
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // Theme-aware chart chrome (grid / axis labels / selection wash); candle
  // hues stay semantic across themes.
  const gridStroke = isDark ? "#24314255" : "#E2E8F0";
  const labelFill = isDark ? "#7E8796" : "#94A3B8";
  const selWash = isDark ? "#1E293B66" : "#EFF6FF";
  const wrapRef = useRef<HTMLDivElement>(null);
  const [availWidth, setAvailWidth] = useState(DEFAULT_WIDTH);
  // hover 解读：悬停蜡烛下标（null=无），渲染浮动数值卡（竞品式 hover tooltip）。
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // 自适应：测量容器宽度，算每根蜡烛槽位（夹在 MIN/MAX_SLOT；过窄横滚，过宽封顶居中）。
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setAvailWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = Math.max(1, candles.length);
  // 槽位夹在 [MIN_SLOT, MAX_SLOT]：太多候选→收到 MIN_SLOT 触发横滚；宽屏→封顶在 MAX_SLOT
  // 而非铺满，于是图表比容器窄、靠 mx-auto 居中，不再被拉得过宽过大。
  // B6：缩放系数夹在 [1,3]；放大后槽位/蜡烛体可超出基础 MAX_SLOT 上限（配合容器横滚平移）。
  const zoom = Math.min(3, Math.max(1, zoomFactor));
  // 少蜡烛视图（年内 12 月 / 人生年级）放宽槽位与蜡烛体上限，避免在宽屏上挤在中间显得空旷瘦长。
  const fewCandles = n <= 16;
  const maxSlot = fewCandles ? 52 : MAX_SLOT;
  // fit 一页：slot = 可用宽/N（**不设下限**，蜡烛多则自动变窄填满容器、不横滚）；封顶 maxSlot 防少蜡烛过宽。
  // zoom>1 时 slot 放大 → chartWidth 超容器 → 保留横滚平移。
  const slot =
    Math.min(maxSlot, (availWidth - PAD_LEFT - PAD_RIGHT) / n) * zoom;
  const bodyW = Math.max(
    5,
    Math.min((fewCandles ? 22 : 12) * zoom, slot * 0.62),
  );
  const chartWidth = PAD_LEFT + PAD_RIGHT + candles.length * slot;
  // A3：按容器宽切换图高（窄屏更矮）。
  const H = availWidth < H_BREAKPOINT ? H_MOBILE : H_DESKTOP;
  const plotBottom = PAD_TOP + H;
  // wick 视觉延伸上限：月/年聚合的 peak-dip 可跨满量程，限制单端延伸避免一根影线贯穿全图。
  const maxWickExtent = H * 0.16;
  // 连续 OHLC 游走：body=open..close=跨周期变化，天然短而均匀——**不再需要按粒度 clamp body 的魔法数**
  // （旧 maxBodyExtent / isLongRange / isYearGrid 已删）。详见 derived.buildOhlcSeries。
  const bars = useMemo(() => buildOhlcSeries(candles), [candles]);

  const yOf = (v: number) =>
    PAD_TOP + (1 - Math.max(0, Math.min(100, v)) / 100) * H;
  const xOf = (i: number) => PAD_LEFT + i * slot + slot / 2;

  const maPoints = useMemo(() => {
    const ma = movingAverage(candles.map((c) => c.intensity));
    return ma.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, slot]);

  // CBT 情绪叠加：把 moodPoints 按 date 对齐到对应候选的 x 位置（无匹配候选则丢弃）。
  const moodPx = useMemo(() => {
    const idxByDate = new Map<string, number>();
    candles.forEach((c, i) => {
      if (c.date) idxByDate.set(c.date, i);
    });
    return moodPoints
      .map((p) => {
        const i = idxByDate.get(p.date);
        return i == null ? null : { x: xOf(i), y: yOf(p.intensity) };
      })
      .filter((p): p is { x: number; y: number } => p !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodPoints, candles, slot]);

  // 候选/标记的身份键：月度用日期，人生 K 线（年级）用 age（无 date）。
  const keyOf = (x: { date?: string; age?: number }): string =>
    x.date ?? (x.age != null ? `age-${x.age}` : "");
  const markerByKey = useMemo(() => {
    const m = new Map<string, TimelineMarker>();
    for (const mk of markers) {
      const k = mk.date ?? (mk.age != null ? `age-${mk.age}` : "");
      if (k) m.set(k, mk);
    }
    return m;
  }, [markers]);

  // A10：当前时点在视图内的候选下标（-1=不在视图，指示线退化）。
  const nowIdx = useMemo(
    () => (nowKey ? candles.findIndex((c) => keyOf(c) === nowKey) : -1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candles, nowKey],
  );

  // A8：marker 太多（如长程视图整段返照）会糊；nowIdx 已知时只显示其后的前 5 个未来 marker。
  // nowKey 不在视图（如查看非当前月）则退化为全显（月度 marker 本就少）。
  const visibleMarkerKeys = useMemo(() => {
    const withMarker = candles
      .map((c, i) => ({ k: keyOf(c), i }))
      .filter((x) => x.k && markerByKey.has(x.k));
    if (nowIdx < 0) return new Set(withMarker.map((x) => x.k));
    return new Set(
      withMarker
        .filter((x) => x.i > nowIdx)
        .slice(0, 5)
        .map((x) => x.k),
    );
  }, [candles, markerByKey, nowIdx]);

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div ref={wrapRef} className="w-full">
      <div className="overflow-x-auto">
        <svg
          width={Math.max(chartWidth, 320)}
          height={plotBottom + PAD_BOTTOM}
          viewBox={`0 0 ${Math.max(chartWidth, 320)} ${plotBottom + PAD_BOTTOM}`}
          role="img"
          aria-label={
            language === "zh"
              ? "月度能量强度蜡烛图"
              : "Monthly energy intensity chart"
          }
          className="block mx-auto"
        >
          {/* horizontal grid */}
          {gridLines.map((g) => (
            <line
              key={g}
              x1={PAD_LEFT}
              x2={chartWidth - PAD_RIGHT}
              y1={yOf(g)}
              y2={yOf(g)}
              stroke={gridStroke}
              strokeWidth={1}
              strokeDasharray="2 5"
              strokeOpacity={0.7}
            />
          ))}

          {/* MA smoothing line — B6：showTrend 关掉则只看蜡烛 */}
          {candles.length > 1 && showTrend && (
            <polyline
              points={maPoints}
              fill="none"
              stroke={COLOR_MA}
              strokeWidth={1.5}
              strokeOpacity={0.5}
              strokeLinejoin="round"
            />
          )}

          {candles.map((c, i) => {
            const cx = xOf(i);
            const bar = bars[i];
            // 连续 OHLC 游走：body=open..close=跨周期能量变化（天然短而均匀，无需 clamp）。
            // 顶=较高值、底=较低值（yOf 反向：值大→y 小）。
            const bodyTop = yOf(Math.max(bar.open, bar.close));
            const bodyH = Math.max(
              2,
              yOf(Math.min(bar.open, bar.close)) - bodyTop,
            );
            const bodyBot = bodyTop + bodyH;
            // wick=本期波动范围 low..high；保留单端 clamp，极端 peak/dip 不贯穿全图。
            const wickTopY = Math.max(yOf(bar.high), bodyTop - maxWickExtent);
            const wickBotY = Math.min(yOf(bar.low), bodyBot + maxWickExtent);
            const ckey = keyOf(c);
            const isSel = selectedDate && ckey === selectedDate;
            const mk = ckey ? markerByKey.get(ckey) : undefined;
            const color = colorOf(bar.dir);
            return (
              <g
                key={ckey || i}
                onClick={() => ckey && onSelectDate?.(ckey)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx((h) => (h === i ? null : h))}
                style={{ cursor: onSelectDate ? "pointer" : "default" }}
              >
                {/* hit area */}
                <rect
                  x={cx - slot / 2}
                  y={PAD_TOP}
                  width={slot}
                  height={H}
                  fill={isSel ? selWash : "transparent"}
                />
                {/* wick: low..high（本期波动范围）；clamp 单端延伸避免聚合极值贯穿全图 */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={wickTopY}
                  y2={wickBotY}
                  stroke={color}
                  strokeOpacity={0.4}
                  strokeWidth={1.2}
                />
                {/* body: open..close（跨周期能量变化，连续游走） */}
                <rect
                  x={cx - bodyW / 2}
                  y={bodyTop}
                  width={bodyW}
                  height={bodyH}
                  rx={2}
                  fill={color}
                  stroke={isSel ? COLOR_SELECTED : "none"}
                  strokeWidth={isSel ? 2 : 0}
                />
                {/* marker dot — A8：仅显示 visibleMarkerKeys（nowIdx 后的前 5 个未来 marker） */}
                {mk && visibleMarkerKeys.has(ckey) && (
                  <circle cx={cx} cy={wickTopY - 6} r={3} fill={COLOR_MA}>
                    <title>{mk.label}</title>
                  </circle>
                )}
              </g>
            );
          })}

          {/* A10：「You are here」当前时点指示——竖线 + 顶点 + aria-label（非仅辉光，低视力/读屏可感知）。 */}
          {nowIdx >= 0 && (
            <g
              role="img"
              aria-label={
                language === "zh" ? "你在这里（今天）" : "You are here (today)"
              }
            >
              <line
                x1={xOf(nowIdx)}
                x2={xOf(nowIdx)}
                y1={PAD_TOP}
                y2={plotBottom}
                stroke={COLOR_SELECTED}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeOpacity={0.8}
              />
              <circle
                cx={xOf(nowIdx)}
                cy={PAD_TOP}
                r={3}
                fill={COLOR_SELECTED}
              />
              <text
                x={xOf(nowIdx)}
                y={PAD_TOP - 5}
                fontSize={9}
                fontWeight={600}
                fill={COLOR_SELECTED}
                textAnchor="middle"
              >
                {language === "zh" ? "今天" : "Today"}
              </text>
            </g>
          )}

          {/* CBT 情绪叠加层（#23）：teal 折线 + 点，按日期叠到能量曲线上。自我觉察非因果。 */}
          {moodPx.length > 0 && (
            <g>
              {moodPx.length > 1 && (
                <polyline
                  points={moodPx.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={COLOR_MOOD}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  strokeOpacity={0.8}
                />
              )}
              {moodPx.map((p, i) => (
                <circle
                  key={`mood-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  fill={COLOR_MOOD}
                />
              ))}
            </g>
          )}

          {/* y-axis labels (relative scale, compared only to yourself) */}
          {gridLines.map((g) => (
            <text
              key={`lbl-${g}`}
              x={4}
              y={yOf(g) - 2}
              fontSize={9}
              fill={labelFill}
            >
              {g}
            </text>
          ))}

          {/* hover 解读卡：悬停蜡烛浮动数值卡——日期/年龄 + 活跃度 + 跨期变化 + 区间 + 倾向。
              中性占星文案（活跃度/倾向，描述性非预测/命运）。点蜡烛仍打开 detail drawer 看深度解读。 */}
          {hoveredIdx != null &&
            candles[hoveredIdx] &&
            (() => {
              const c = candles[hoveredIdx];
              const bar = bars[hoveredIdx];
              const zh = language === "zh";
              const r = (v: number) => Math.round(v);
              const cx = xOf(hoveredIdx);
              const tw = 168;
              const th = 98;
              const tx =
                cx + 12 + tw <= chartWidth - PAD_RIGHT
                  ? cx + 12
                  : Math.max(PAD_LEFT, cx - 12 - tw);
              const ty = PAD_TOP + 6;
              const act =
                c.intensity >= 66
                  ? zh
                    ? "强烈"
                    : "Intense"
                  : c.intensity >= 33
                    ? zh
                      ? "活跃"
                      : "Active"
                    : zh
                      ? "平静"
                      : "Quiet";
              const hd = c.harmony - c.tension;
              const lean =
                hd > 3
                  ? zh
                    ? "顺流"
                    : "Flow"
                  : hd < -3
                    ? zh
                      ? "摩擦"
                      : "Friction"
                    : zh
                      ? "平衡"
                      : "Mixed";
              const title =
                c.date ??
                (c.age != null ? (zh ? `${c.age} 岁` : `Age ${c.age}`) : "");
              const lines = [
                `${zh ? "活跃度" : "Activity"} ${act} · ${r(bar.close)}`,
                // 跨周期变化（上一根 close → 本根 close），描述性非预测。
                `${zh ? "较上期" : "Prev"} ${r(bar.open)} → ${zh ? "本期" : "Now"} ${r(bar.close)}`,
                `${zh ? "区间" : "Range"} ${r(bar.low)}–${r(bar.high)}`,
                `${zh ? "倾向" : "Leans"} ${lean}`,
              ];
              return (
                <g pointerEvents="none">
                  <rect
                    x={tx}
                    y={ty}
                    width={tw}
                    height={th}
                    rx={8}
                    fill={isDark ? "#0F172A" : "#FFFFFF"}
                    stroke={isDark ? "#334155" : "#E2E8F0"}
                    strokeWidth={1}
                    opacity={0.98}
                  />
                  <text
                    x={tx + 12}
                    y={ty + 22}
                    fontSize={12}
                    fontWeight={700}
                    fill={isDark ? "#F1F5F9" : "#0F172A"}
                  >
                    {title}
                  </text>
                  {lines.map((ln, k) => (
                    <text
                      key={k}
                      x={tx + 12}
                      y={ty + 41 + k * 15}
                      fontSize={10.5}
                      fill={isDark ? "#CBD5E1" : "#475569"}
                    >
                      {ln}
                    </text>
                  ))}
                </g>
              );
            })()}
        </svg>
      </div>
    </div>
  );
};
