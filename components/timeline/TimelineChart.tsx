// INPUT: TimelineCandle[] / TimelineMarker[]（来自 /api/transit/timeline）、useLanguage、点选回调。
// OUTPUT: 自绘 SVG 蜡烛图组件（区间摘要语义：wick=dip..peak、body=start..end），自适应填满容器宽度。
// POS: 月度 K 线主视图。蜡烛体按方向红/绿着色（end≥start=涨=绿、end<start=跌=红，近平=中性灰；
//      西方蜡烛惯例，产品方决定）；能量质量(harmony/tension)在当日卡里数值呈现。纵轴=中性能量强度，仅与自身比较。

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineCandle, TimelineMarker } from "../../types";
import { useLanguage } from "../UIComponents";

interface TimelineChartProps {
  candles: TimelineCandle[];
  markers?: TimelineMarker[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

// 蜡烛体方向着色（股票式红/绿，产品方决定）：end≥start=能量走强=绿、end<start=能量回落=红、
// 近乎持平=中性灰（doji）。"非好坏"的中性框架由 onboarding/图例/文案承载，不再靠颜色。
const COLOR_UP = "#22C55E"; // green-500 — energy rose through the day
const COLOR_DOWN = "#EF4444"; // red-500 — energy eased through the day
const COLOR_FLAT = "#94A3B8"; // slate-400 — roughly unchanged (doji)
const COLOR_MA = "#A855F7"; // mystic-500 — smoothing line (distinct from red/green)
const COLOR_SELECTED = "#2563EB"; // psycho-600 — selection ring

const FLAT_EPS = 1.5; // |end-start| 在此内视为持平

const H = 260; // plot height
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_LEFT = 26; // room for y-axis labels
const PAD_RIGHT = 10;
const MIN_SLOT = 20; // 低于此宽度则横滚（候选项过多时）
const DEFAULT_WIDTH = 900;

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
}) => {
  const { language } = useLanguage();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [availWidth, setAvailWidth] = useState(DEFAULT_WIDTH);

  // 自适应：测量容器宽度，蜡烛铺满可用宽度（候选过多时回退到 MIN_SLOT + 横滚）。
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
  const slot = Math.max(MIN_SLOT, (availWidth - PAD_LEFT - PAD_RIGHT) / n);
  const bodyW = Math.max(6, Math.min(24, slot * 0.62));
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

  const markerByDate = useMemo(() => {
    const m = new Map<string, TimelineMarker>();
    for (const mk of markers) if (mk.date) m.set(mk.date, mk);
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
          className="block"
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
            const isSel = selectedDate && c.date === selectedDate;
            const mk = c.date ? markerByDate.get(c.date) : undefined;
            const color = candleColor(c);
            return (
              <g
                key={c.date ?? i}
                onClick={() => c.date && onSelectDate?.(c.date)}
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
