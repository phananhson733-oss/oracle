// INPUT: TimelineCandle[] / TimelineMarker[]（来自 /api/transit/timeline）、useLanguage、点选回调。
// OUTPUT: 自绘 SVG 蜡烛图组件（区间摘要语义：wick=dip..peak、body=start..end）；自适应但有尺寸上限——窄于容器时居中、整月不裁切、候选过多才横滚。
// POS: 月度 K 线主视图。蜡烛体按方向红/绿着色（end≥start=涨=绿、end<start=跌=红，近平=中性灰；
//      西方蜡烛惯例，产品方决定）；能量质量(harmony/tension)在当日卡里数值呈现。纵轴=中性能量强度，仅与自身比较。

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineCandle, TimelineMarker } from "../../types";
import { useLanguage } from "../UIComponents";

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
}

// 蜡烛体方向着色（股票式红/绿，产品方决定）：end≥start=能量走强=绿、end<start=能量回落=红、
// 近乎持平=中性灰（doji）。"非好坏"的中性框架由 onboarding/图例/文案承载，不再靠颜色。
const COLOR_UP = "#22C55E"; // green-500 — energy rose through the day
const COLOR_DOWN = "#EF4444"; // red-500 — energy eased through the day
const COLOR_FLAT = "#94A3B8"; // slate-400 — roughly unchanged (doji)
const COLOR_MA = "#A855F7"; // mystic-500 — smoothing line (distinct from red/green)
const COLOR_SELECTED = "#2563EB"; // psycho-600 — selection ring
const COLOR_MOOD = "#0D9488"; // teal-600 — CBT 情绪叠加层（与红/绿/紫均区分，自我觉察非因果）

const FLAT_EPS = 1.5; // |end-start| 在此内视为持平

const H = 200; // plot height（#168 后偏高，回收到更紧凑的占比）
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_LEFT = 26; // room for y-axis labels
const PAD_RIGHT = 10;
// 每根蜡烛的横向槽位：低于 MIN_SLOT 则横滚（候选过多，如手机看整月）；
// 高于 MAX_SLOT 则封顶，避免宽桌面屏上蜡烛被拉得又宽又大（用户反馈"大小太大了"）。
const MIN_SLOT = 16;
const MAX_SLOT = 22;
const DEFAULT_WIDTH = 720;

function candleColor(c: TimelineCandle): string {
  const delta = c.end - c.start;
  if (delta > FLAT_EPS) return COLOR_UP;
  if (delta < -FLAT_EPS) return COLOR_DOWN;
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
}) => {
  const { language } = useLanguage();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [availWidth, setAvailWidth] = useState(DEFAULT_WIDTH);

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
  const slot = Math.min(
    MAX_SLOT,
    Math.max(MIN_SLOT, (availWidth - PAD_LEFT - PAD_RIGHT) / n),
  );
  const bodyW = Math.max(5, Math.min(12, slot * 0.62));
  const chartWidth = PAD_LEFT + PAD_RIGHT + candles.length * slot;
  const plotBottom = PAD_TOP + H;

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
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          ))}

          {/* MA smoothing line */}
          {candles.length > 1 && (
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
            const top = Math.min(c.start, c.end);
            const bot = Math.max(c.start, c.end);
            const bodyTop = yOf(bot);
            const bodyH = Math.max(2, yOf(top) - yOf(bot));
            const ckey = keyOf(c);
            const isSel = selectedDate && ckey === selectedDate;
            const mk = ckey ? markerByKey.get(ckey) : undefined;
            const color = candleColor(c);
            return (
              <g
                key={ckey || i}
                onClick={() => ckey && onSelectDate?.(ckey)}
                style={{ cursor: onSelectDate ? "pointer" : "default" }}
              >
                {/* hit area */}
                <rect
                  x={cx - slot / 2}
                  y={PAD_TOP}
                  width={slot}
                  height={H}
                  fill={isSel ? "#EFF6FF" : "transparent"}
                />
                {/* wick: dip..peak (full intraday range), body-colored for the candlestick look */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={yOf(c.peak)}
                  y2={yOf(c.dip)}
                  stroke={color}
                  strokeOpacity={0.7}
                  strokeWidth={1.5}
                />
                {/* body: start..end interval summary */}
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
                {/* marker dot */}
                {mk && (
                  <circle cx={cx} cy={yOf(c.peak) - 6} r={3} fill={COLOR_MA}>
                    <title>{mk.label}</title>
                  </circle>
                )}
              </g>
            );
          })}

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
              fill="#94A3B8"
            >
              {g}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
