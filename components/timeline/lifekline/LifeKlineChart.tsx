// INPUT: ./lifeKlineDerived 的 LifePoint/BubbleSpec/CHART/MAX_AGE/xForAge/yForValue、./lifeKlineCopy 的 LifeKlineCopy/fmt 与父级回调 onHover/onLeave/onSelect。
// OUTPUT: LifeKlineChart 命名导出（React.memo 包裹）——v7 人生 K 线 SVG 主图（网格/轴标签/阶段线/R-S/MA10/蜡烛/选中态/事件气泡/命中层），Pointer Events tap 判定 + 键盘 ←/→ 浏览、Enter/Space 锁定。
// POS: lifekline 呈现层主视图（纯受控，无业务 state），结构与类名对照 v7 artifact drawChart 行 262-313（类名加 .lk- 前缀）；阶段竖线/标签已改为 phaseKey 数据对齐（有意偏离 artifact 装饰值）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useMemo, useRef } from "react";
import type { LifeKlineCopy, LifeKlinePhaseKey } from "./lifeKlineCopy";
import { fmt } from "./lifeKlineCopy";
import type { BubbleSpec, LifePoint } from "./lifeKlineDerived";
import { CHART, MAX_AGE, xForAge, yForValue } from "./lifeKlineDerived";

export interface LifeKlineChartProps {
  points: LifePoint[];
  selectedAge: number;
  bubbles: BubbleSpec[];
  rs: { r: number; s: number } | null;
  copy: LifeKlineCopy;
  onHover: (age: number, clientX: number, clientY: number) => void;
  onLeave: () => void;
  onSelect: (
    age: number,
    opts: { lock: boolean; viaKeyboard?: boolean },
  ) => void;
}

// ---- 几何与交互常量（artifact drawChart 同源，全部编译期定值）----

const STEP = (CHART.right - CHART.left) / MAX_AGE;
const BODY_W = Math.min(10.5, Math.max(7, STEP * 0.72));
const OUTLINE_W = Math.min(13, Math.max(8, STEP * 0.9));
const GRID_VALUES = [0, 20, 40, 60, 80, 100] as const;
// 阶段竖线 = phaseKey 真实边界（12/20/30/43/58/70/88；首尾不画线，图框即边界）——
// 由 artifact 装饰性等距值改为数据对齐（有意偏离）。
const STAGE_LINE_AGES = [12, 20, 30, 43, 58, 70, 88] as const;
const AGE_TICKS = [
  0, 1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 99,
] as const;
// 阶段标签置于各 phase 区间中心（如 roots 0-11 → 6、reset 30-42 → 36.5）。
const STAGE_LABELS: ReadonlyArray<readonly [number, LifeKlinePhaseKey]> = [
  [6, "roots"],
  [16, "identity"],
  [25, "launch"],
  [36.5, "reset"],
  [50.5, "rebuild"],
  [64, "transition"],
  [79, "expansion"],
  [93.5, "legacy"],
];
const TAP_MOVE_THRESHOLD_PX = 8;
const TOUCH_SUPPRESS_MS = 300;

// ---- 纯 helper ----

function candleColor(p: LifePoint): string {
  return p.up ? "var(--lk-green)" : "var(--lk-red)";
}

function candleBodyGeometry(p: LifePoint): { bodyTop: number; bodyH: number } {
  const yOpen = yForValue(p.open);
  const yClose = yForValue(p.close);
  return {
    bodyTop: Math.min(yOpen, yClose),
    bodyH: Math.max(5.5, Math.abs(yOpen - yClose)),
  };
}

// 命中层 rect 的 data-age → number；缺失/非有限 → null（调用方直接短路）。
function ageFromEvent(e: React.SyntheticEvent<SVGRectElement>): number | null {
  const age = Number(e.currentTarget.dataset.age);
  return Number.isFinite(age) ? age : null;
}

// 键盘可达性 aria 文本：全部取自 copy，不写死语言。
function hitAriaLabel(p: LifePoint, copy: LifeKlineCopy): string {
  const agePart = fmt(copy.tooltip.ageFmt, { age: p.age });
  return `${p.year} ${agePart} · ${copy.header.axisEnergy} ${p.close}`;
}

// ---- 静态图层（artifact drawChart 顺序）----

function GridLayer(): React.ReactElement {
  return (
    <>
      {GRID_VALUES.map((v) => (
        <React.Fragment key={v}>
          <line
            className="lk-grid"
            x1={CHART.left}
            y1={yForValue(v)}
            x2={CHART.right}
            y2={yForValue(v)}
          />
          <text
            className="lk-axis"
            x={CHART.left - 22}
            y={yForValue(v) + 5}
            textAnchor="end"
          >
            {v}
          </text>
        </React.Fragment>
      ))}
    </>
  );
}

function AxisLabels({ copy }: { copy: LifeKlineCopy }): React.ReactElement {
  const midY = (CHART.top + CHART.bottom) / 2;
  return (
    <>
      <text
        className="lk-axis-label"
        x={22}
        y={midY}
        textAnchor="middle"
        transform={`rotate(-90 22 ${midY})`}
      >
        {copy.header.axisEnergy}
      </text>
      <text
        className="lk-axis-label"
        x={CHART.right + 6}
        y={CHART.bottom + 44}
        textAnchor="start"
      >
        {copy.header.axisAge}
      </text>
    </>
  );
}

function StageLayer({ copy }: { copy: LifeKlineCopy }): React.ReactElement {
  return (
    <>
      {STAGE_LINE_AGES.map((age) => (
        <line
          key={age}
          className="lk-stage-line"
          x1={xForAge(age)}
          y1={CHART.top}
          x2={xForAge(age)}
          y2={CHART.bottom}
        />
      ))}
      {STAGE_LABELS.map(([age, key]) => (
        <text
          key={key}
          className="lk-stage-label"
          x={xForAge(age)}
          y={CHART.top - 12}
          textAnchor="middle"
        >
          {copy.stages[key].short}
        </text>
      ))}
    </>
  );
}

function RsLayer({
  rs,
}: {
  rs: { r: number; s: number } | null;
}): React.ReactElement | null {
  if (!rs) return null;
  return (
    <>
      <line
        className="lk-support"
        x1={CHART.left}
        y1={yForValue(rs.r)}
        x2={CHART.right}
        y2={yForValue(rs.r)}
      />
      <line
        className="lk-support"
        x1={CHART.left}
        y1={yForValue(rs.s)}
        x2={CHART.right}
        y2={yForValue(rs.s)}
      />
      <text
        className="lk-rs-label"
        x={CHART.right - 5}
        y={yForValue(rs.r) - 8}
        textAnchor="end"
      >
        {`R: ${rs.r}`}
      </text>
      <text
        className="lk-rs-label"
        x={CHART.right - 5}
        y={yForValue(rs.s) - 8}
        textAnchor="end"
      >
        {`S: ${rs.s}`}
      </text>
    </>
  );
}

function AgeTicks(): React.ReactElement {
  return (
    <>
      {AGE_TICKS.map((age) => (
        <text
          key={age}
          className="lk-axis"
          x={xForAge(age)}
          y={CHART.bottom + 24}
          textAnchor="middle"
        >
          {age}
        </text>
      ))}
    </>
  );
}

// ---- 数据图层 ----

function MaPath({
  points,
}: {
  points: LifePoint[];
}): React.ReactElement | null {
  const d = useMemo(
    () =>
      points
        .map(
          (p, i) =>
            `${i ? "L" : "M"}${xForAge(p.age).toFixed(2)} ${yForValue(p.ma10).toFixed(2)}`,
        )
        .join(" "),
    [points],
  );
  if (points.length === 0) return null;
  return <path className="lk-ma-line" d={d} />;
}

function CandleLayer({
  points,
  selectedAge,
}: {
  points: LifePoint[];
  selectedAge: number;
}): React.ReactElement {
  return (
    <>
      {points.map((p) => {
        const cx = xForAge(p.age);
        const color = candleColor(p);
        const { bodyTop, bodyH } = candleBodyGeometry(p);
        return (
          <React.Fragment key={p.age}>
            <line
              className="lk-wick"
              x1={cx}
              x2={cx}
              y1={yForValue(p.high)}
              y2={yForValue(p.low)}
              stroke={color}
            />
            <rect
              className="lk-candle-body"
              x={cx - BODY_W / 2}
              y={bodyTop}
              width={BODY_W}
              height={bodyH}
              fill={color}
              opacity={p.age === selectedAge ? 1 : 0.94}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

function SelectedLayer({ point }: { point: LifePoint }): React.ReactElement {
  const cx = xForAge(point.age);
  const { bodyTop, bodyH } = candleBodyGeometry(point);
  return (
    <>
      <line
        className="lk-marker-line"
        x1={cx}
        y1={CHART.top - 8}
        x2={cx}
        y2={CHART.bottom}
      />
      <rect
        className="lk-selected-outline"
        x={cx - OUTLINE_W / 2}
        y={bodyTop - 3}
        width={OUTLINE_W}
        height={Math.max(9, bodyH + 6)}
        rx={4}
      />
      <circle
        className="lk-score-dot"
        cx={cx}
        cy={yForValue(point.close)}
        r={5.2}
      />
    </>
  );
}

function BubbleLayer({
  bubbles,
  pointByAge,
}: {
  bubbles: BubbleSpec[];
  pointByAge: ReadonlyMap<number, LifePoint>;
}): React.ReactElement {
  return (
    <>
      {bubbles.map((b) => {
        const point = pointByAge.get(b.age);
        if (!point) return null;
        const bx = xForAge(b.age);
        const by = yForValue(point.close) + (b.above ? -50 : 50);
        const baseY = by + (b.above ? 15 : -15);
        const tipY = by + (b.above ? 29 : -29);
        return (
          <g key={b.age} className="lk-bubble">
            <rect
              x={bx - 31}
              y={by - 17}
              width={62}
              height={34}
              rx={18}
              fill={b.color}
            />
            <path
              d={`M${bx - 8},${baseY} L${bx + 8},${baseY} L${bx},${tipY} Z`}
              fill={b.color}
            />
            <text
              className="lk-bubble-text"
              x={bx}
              y={by + 5}
              textAnchor="middle"
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </>
  );
}

// ---- 交互 hooks（仅 tap/抑制用 ref，无业务 state）----

interface HoverPointerHandlers {
  onPointerEnter: (e: React.PointerEvent<SVGRectElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGRectElement>) => void;
  onPointerLeave: () => void;
}

interface TapPointerHandlers {
  onPointerDown: (e: React.PointerEvent<SVGRectElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGRectElement>) => void;
}

// 悬停族：仅 mouse 指针响应；touch tap 后 300ms 内合成 mouse enter/move 被抑制。
function useHoverPointerHandlers(
  onHover: LifeKlineChartProps["onHover"],
  onLeave: LifeKlineChartProps["onLeave"],
  onSelect: LifeKlineChartProps["onSelect"],
  suppressMouseUntilRef: React.RefObject<number>,
): HoverPointerHandlers {
  const onPointerEnter = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const age = ageFromEvent(e);
      if (age == null || e.pointerType !== "mouse") return;
      if (Date.now() < suppressMouseUntilRef.current) return;
      onSelect(age, { lock: false });
    },
    [onSelect, suppressMouseUntilRef],
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const age = ageFromEvent(e);
      if (age == null || e.pointerType !== "mouse") return;
      if (Date.now() < suppressMouseUntilRef.current) return;
      onHover(age, e.clientX, e.clientY);
    },
    [onHover, suppressMouseUntilRef],
  );
  const onPointerLeave = useCallback(() => {
    onLeave();
  }, [onLeave]);
  return { onPointerEnter, onPointerMove, onPointerLeave };
}

// tap 判定：pointerdown 记起点，pointerup 同 age 且位移 <8px 才算 tap（锁定选中）；
// touch tap 写入抑制时间戳供悬停族忽略后续合成 mouse 事件，且不触发 onHover。
function useTapPointerHandlers(
  onSelect: LifeKlineChartProps["onSelect"],
  suppressMouseUntilRef: React.RefObject<number>,
): TapPointerHandlers {
  const tapStartRef = useRef<{
    x: number;
    y: number;
    age: number;
    t: number;
  } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent<SVGRectElement>) => {
    // 仅主键：右键/中键（打开菜单、滚动）不得触发 pin 与埋点。
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const age = ageFromEvent(e);
    if (age == null) return;
    tapStartRef.current = { x: e.clientX, y: e.clientY, age, t: Date.now() };
  }, []);
  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const tapStart = tapStartRef.current;
      tapStartRef.current = null;
      const age = ageFromEvent(e);
      if (tapStart == null || age == null || tapStart.age !== age) return;
      const moved = Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y);
      if (moved >= TAP_MOVE_THRESHOLD_PX) return;
      if (e.pointerType !== "mouse") {
        suppressMouseUntilRef.current = Date.now() + TOUCH_SUPPRESS_MS;
      }
      onSelect(age, { lock: true });
    },
    [onSelect, suppressMouseUntilRef],
  );
  return { onPointerDown, onPointerUp };
}

// 键盘导航：←/→ 浏览相邻存在的年份并移焦（lock:false，不弹 toast 不发 pin 埋点）；Enter/Space 显式锁定当前；preventDefault 防滚动。
function useKeyboardNav(
  sortedPoints: LifePoint[],
  onSelect: LifeKlineChartProps["onSelect"],
  hitRectsRef: React.RefObject<Map<number, SVGRectElement>>,
): (e: React.KeyboardEvent<SVGRectElement>) => void {
  return useCallback(
    (e: React.KeyboardEvent<SVGRectElement>) => {
      const age = ageFromEvent(e);
      if (age == null) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(age, { lock: true });
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const index = sortedPoints.findIndex((p) => p.age === age);
      if (index < 0) return;
      const next = sortedPoints[index + (e.key === "ArrowRight" ? 1 : -1)];
      if (!next) return;
      // viaKeyboard：键盘没有独立的 hover/tooltip 链，pinned 时父级据此移动 pin 本身
      // （面板跟随），否则键盘用户在 pinned 下毫无反馈（对抗评审 #7）。
      onSelect(next.age, { lock: false, viaKeyboard: true });
      hitRectsRef.current.get(next.age)?.focus();
    },
    [sortedPoints, onSelect, hitRectsRef],
  );
}

// 命中 rect 注册表：键盘导航移焦用（age → 元素）。
function useHitRectRegistry(): {
  hitRectsRef: React.RefObject<Map<number, SVGRectElement>>;
  registerHitRect: (age: number, el: SVGRectElement | null) => void;
} {
  const hitRectsRef = useRef<Map<number, SVGRectElement>>(new Map());
  const registerHitRect = useCallback(
    (age: number, el: SVGRectElement | null) => {
      if (el) {
        hitRectsRef.current.set(age, el);
      } else {
        hitRectsRef.current.delete(age);
      }
    },
    [],
  );
  return { hitRectsRef, registerHitRect };
}

// ---- 命中层（最后渲染，覆盖全高；透明 rect 承载全部交互与可达性）----

interface HitLayerProps {
  points: LifePoint[];
  copy: LifeKlineCopy;
  registerHitRect: (age: number, el: SVGRectElement | null) => void;
  hoverHandlers: HoverPointerHandlers;
  tapHandlers: TapPointerHandlers;
  onKeyDown: (e: React.KeyboardEvent<SVGRectElement>) => void;
}

function HitLayer(props: HitLayerProps): React.ReactElement {
  const {
    points,
    copy,
    registerHitRect,
    hoverHandlers,
    tapHandlers,
    onKeyDown,
  } = props;
  return (
    <g role="group">
      {points.map((p) => (
        <rect
          key={p.age}
          className="lk-hit"
          data-age={p.age}
          x={xForAge(p.age) - STEP * 0.55}
          y={CHART.top - 20}
          width={STEP * 1.1}
          height={CHART.bottom - CHART.top + 50}
          role="button"
          tabIndex={0}
          aria-label={hitAriaLabel(p, copy)}
          ref={(el) => {
            registerHitRect(p.age, el);
          }}
          onKeyDown={onKeyDown}
          {...hoverHandlers}
          {...tapHandlers}
        />
      ))}
    </g>
  );
}

// 交互组装：命中 rect 注册表 + 悬停族 + tap 族 + 键盘导航一次接线。
function useChartInteractions(
  sortedPoints: LifePoint[],
  onHover: LifeKlineChartProps["onHover"],
  onLeave: LifeKlineChartProps["onLeave"],
  onSelect: LifeKlineChartProps["onSelect"],
): {
  registerHitRect: (age: number, el: SVGRectElement | null) => void;
  hoverHandlers: HoverPointerHandlers;
  tapHandlers: TapPointerHandlers;
  onKeyDown: (e: React.KeyboardEvent<SVGRectElement>) => void;
} {
  const { hitRectsRef, registerHitRect } = useHitRectRegistry();
  const suppressMouseUntilRef = useRef(0);
  const hoverHandlers = useHoverPointerHandlers(
    onHover,
    onLeave,
    onSelect,
    suppressMouseUntilRef,
  );
  const tapHandlers = useTapPointerHandlers(onSelect, suppressMouseUntilRef);
  const onKeyDown = useKeyboardNav(sortedPoints, onSelect, hitRectsRef);
  return { registerHitRect, hoverHandlers, tapHandlers, onKeyDown };
}

// ---- 主组件 ----

export const LifeKlineChart = React.memo(function LifeKlineChart(
  props: LifeKlineChartProps,
): React.ReactElement {
  const { points, selectedAge, bubbles, rs, copy, onHover, onLeave, onSelect } =
    props;
  const sortedPoints = useMemo(
    () => [...points].sort((a, b) => a.age - b.age),
    [points],
  );
  const pointByAge = useMemo(
    () => new Map(sortedPoints.map((p) => [p.age, p] as const)),
    [sortedPoints],
  );
  const { registerHitRect, hoverHandlers, tapHandlers, onKeyDown } =
    useChartInteractions(sortedPoints, onHover, onLeave, onSelect);
  const selectedPoint = pointByAge.get(selectedAge);
  return (
    <div className="lk-chart-wrap">
      <svg
        viewBox={`0 0 ${CHART.w} ${CHART.h}`}
        role="group"
        aria-label={copy.header.title}
      >
        <GridLayer />
        <AxisLabels copy={copy} />
        <StageLayer copy={copy} />
        <RsLayer rs={rs} />
        <AgeTicks />
        <MaPath points={sortedPoints} />
        <CandleLayer points={sortedPoints} selectedAge={selectedAge} />
        {selectedPoint ? <SelectedLayer point={selectedPoint} /> : null}
        <BubbleLayer bubbles={bubbles} pointByAge={pointByAge} />
        <HitLayer
          points={sortedPoints}
          copy={copy}
          registerHitRect={registerHitRect}
          hoverHandlers={hoverHandlers}
          tapHandlers={tapHandlers}
          onKeyDown={onKeyDown}
        />
      </svg>
      <div className="lk-chart-note">{copy.header.chartNote}</div>
    </div>
  );
});
