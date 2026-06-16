// INPUT: TimelineCandle[] / TimelineMarker[]（来自 /api/transit/timeline）、useLanguage、点选回调。
// OUTPUT: 自绘 SVG 蜡烛图组件（区间摘要语义：wick=dip..peak、body=start..end），移动优先可横滚。
// POS: 月度 K 线主视图。颜色走 psycho(harmony)/mystic(tension) token，禁 success/danger；纵轴=中性能量强度。

import React, { useMemo, useRef } from "react";
import type { TimelineCandle, TimelineMarker } from "../../types";
import { useLanguage } from "../UIComponents";

interface TimelineChartProps {
  candles: TimelineCandle[];
  markers?: TimelineMarker[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

// 设计 F-D4：harmony=psycho(蓝)、tension=mystic(紫)，同一明度档（tension 饱和度不高于
// harmony），低强度=中性 slate（"平静期"），禁用 success/danger/warning。
const COLOR_QUIET = "#CBD5E1"; // slate-300 — a steady, quiet stretch
const COLOR_FLOW = "#60A5FA"; // psycho-400 — harmony-leaning
const COLOR_FRICTION = "#C084FC"; // mystic-400 — tension-leaning
const COLOR_MIXED = "#94A3B8"; // slate-400 — active, balanced
const COLOR_WICK = "#CBD5E1";
const COLOR_MA = "#A855F7"; // mystic-500 — smoothing line
const COLOR_SELECTED = "#2563EB"; // psycho-600

const QUIET_THRESHOLD = 12;
const LEAN_DELTA = 0.15;

const SLOT = 26; // px per candle column
const BODY_W = 14;
const H = 240; // plot height
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;

function candleColor(c: TimelineCandle): string {
  if (c.intensity < QUIET_THRESHOLD) return COLOR_QUIET;
  const total = c.intensity || 1;
  const hShare = c.harmony / total;
  const tShare = c.tension / total;
  if (hShare - tShare > LEAN_DELTA) return COLOR_FLOW;
  if (tShare - hShare > LEAN_DELTA) return COLOR_FRICTION;
  return COLOR_MIXED;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const width = PAD_LEFT + PAD_RIGHT + candles.length * SLOT;
  const plotBottom = PAD_TOP + H;

  const yOf = (v: number) => PAD_TOP + (1 - Math.max(0, Math.min(100, v)) / 100) * H;
  const xOf = (i: number) => PAD_LEFT + i * SLOT + SLOT / 2;

  const maPoints = useMemo(() => {
    const ma = movingAverage(candles.map((c) => c.intensity));
    return ma.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
  }, [candles]);

  const markerByDate = useMemo(() => {
    const m = new Map<string, TimelineMarker>();
    for (const mk of markers) if (mk.date) m.set(mk.date, mk);
    return m;
  }, [markers]);

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="w-full">
      <div ref={scrollRef} className="overflow-x-auto">
        <svg
          width={Math.max(width, 320)}
          height={plotBottom + PAD_BOTTOM}
          viewBox={`0 0 ${Math.max(width, 320)} ${plotBottom + PAD_BOTTOM}`}
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
              x2={width - PAD_RIGHT}
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
              strokeOpacity={0.45}
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
            return (
              <g
                key={c.date ?? i}
                onClick={() => c.date && onSelectDate?.(c.date)}
                style={{ cursor: onSelectDate ? "pointer" : "default" }}
              >
                {/* hit area */}
                <rect
                  x={cx - SLOT / 2}
                  y={PAD_TOP}
                  width={SLOT}
                  height={H}
                  fill={isSel ? "#EFF6FF" : "transparent"}
                />
                {/* wick: dip..peak (full intraday range) */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={yOf(c.peak)}
                  y2={yOf(c.dip)}
                  stroke={COLOR_WICK}
                  strokeWidth={1.5}
                />
                {/* body: start..end interval summary */}
                <rect
                  x={cx - BODY_W / 2}
                  y={bodyTop}
                  width={BODY_W}
                  height={bodyH}
                  rx={2}
                  fill={candleColor(c)}
                  stroke={isSel ? COLOR_SELECTED : "none"}
                  strokeWidth={isSel ? 2 : 0}
                />
                {/* marker dot */}
                {mk && (
                  <circle
                    cx={cx}
                    cy={yOf(c.peak) - 6}
                    r={3}
                    fill={COLOR_MA}
                  >
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
              x={PAD_LEFT}
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
