// INPUT: LifePoint/anchor 指针坐标/TimelineMarker[]/LifeKlineCopy（由父级 LifeKlineSection 传入）+ lifeKlineDerived 的阈值 key 函数族与 clampTooltip。
// OUTPUT: LifeKlineTooltip 组件——createPortal 到 document.body 的 fixed 富 tooltip（头部/OHLC/能量条/解读/chips/脚注，结构 1:1 对照 v7 artifact 行 480-515）。
// POS: lifekline 呈现层的 hover 解读卡；内容按 point.age memo 避免每帧重渲，定位经 clampTooltip 视口避让（首帧 430 兜底、useLayoutEffect 实测修正）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TimelineMarker } from "../../../types";
import { fmt, type LifeKlineCopy } from "./lifeKlineCopy";
import {
  adviceHintKey,
  clampTooltip,
  cycleCueKey,
  eventHintKey,
  interpretationKey,
  type LifePoint,
  type LkStatusKey,
  moduleState,
  modulesInFocus,
  phaseKey,
  statusKey,
  statusLabelKey,
  watchHintKey,
} from "./lifeKlineDerived";

export interface LifeKlineTooltipProps {
  point: LifePoint | null;
  anchor: { x: number; y: number } | null;
  markers: TimelineMarker[];
  copy: LifeKlineCopy;
}

// 首帧未实测时的兜底尺寸（artifact showTooltip 行 517-518 的 || 430 兜底同源）。
const FALLBACK_TOOLTIP_WIDTH = 430;
const FALLBACK_TOOLTIP_HEIGHT = 430;

// statusKey → 徽章配色类（artifact statusClass 行 330-334）。
const STATUS_BADGE_CLASS: Record<LkStatusKey, string> = {
  high: "lk-good",
  low: "lk-bad",
  mixed: "lk-neutral",
};

interface TipSectionProps {
  point: LifePoint;
  copy: LifeKlineCopy;
}

interface TipHeadProps extends TipSectionProps {
  markers: TimelineMarker[];
}

// 头部：年份 + 年龄 + 阶段/窗口行（命中 marker 类 cycle cue 时追加）+ 状态徽章。
function TipHead({ point, markers, copy }: TipHeadProps) {
  const status = statusKey(point);
  const cue = cycleCueKey(point.age, markers);
  const base = `${copy.stages[phaseKey(point.age)].full} · ${copy.statusLabel[statusLabelKey(point)]}`;
  const cycleText = cue === "window" ? base : `${base} · ${copy.cycleCue[cue]}`;
  return (
    <div className="lk-tip-head">
      <div>
        <div className="lk-tip-year">
          {point.year}
          <span className="lk-tip-age">
            {fmt(copy.tooltip.ageFmt, { age: point.age })}
          </span>
        </div>
        <div className="lk-tip-cycle">{cycleText}</div>
      </div>
      <div
        className={`lk-tip-badge ${STATUS_BADGE_CLASS[status]}`}
        style={{ fontSize: 16 }}
      >
        {copy.status[status]}
      </div>
    </div>
  );
}

// OHLC 四格：开盘/收盘/最高（lk-hi）/最低（lk-lo）。
function TipOhlc({ point, copy }: TipSectionProps) {
  return (
    <div className="lk-tip-ohlc">
      <div>
        <span>{copy.tooltip.openLabel}</span>
        <strong>{point.open}</strong>
      </div>
      <div>
        <span>{copy.tooltip.closeLabel}</span>
        <strong>{point.close}</strong>
      </div>
      <div className="lk-hi">
        <span>{copy.tooltip.highLabel}</span>
        <strong>{point.high}</strong>
      </div>
      <div className="lk-lo">
        <span>{copy.tooltip.lowLabel}</span>
        <strong>{point.low}</strong>
      </div>
    </div>
  );
}

// 能量行 + 进度条（宽度 = close%）。
function TipScore({ point, copy }: TipSectionProps) {
  return (
    <div className="lk-tip-score">
      <div className="lk-tip-score-row">
        <span>{copy.tooltip.energyRowLabel}</span>
        <b>{point.close} / 100</b>
      </div>
      <div className="lk-tip-bar">
        <div className="lk-tip-fill" style={{ width: `${point.close}%` }} />
      </div>
    </div>
  );
}

// chips：首枚年度整体（activation · lean），随后 In-focus 模块，零命中回落单枚宽泛年份。
function TipChips({ point, copy }: TipSectionProps) {
  const { activation, lean } = moduleState(point);
  const focused = modulesInFocus(point.topAspects);
  return (
    <div className="lk-tip-modules">
      <span className="lk-tip-chip">
        {copy.activationLabels[activation]} · {copy.leanLabels[lean]}
      </span>
      {focused.length === 0 ? (
        <span className="lk-tip-chip">{copy.tooltip.broadChip}</span>
      ) : (
        focused.map((m) => (
          <span key={m} className="lk-tip-chip">
            {copy.modules[m].icon} {copy.modules[m].title}
          </span>
        ))
      )}
    </div>
  );
}

// 正文：解读段 + 双列 mini（明显事件/建议）+ 单列 mini（需要留意）+ 模块 chips。
function TipBody({ point, copy }: TipSectionProps) {
  return (
    <div className="lk-tip-body">
      <p>
        <span className="lk-tip-kicker">{copy.tooltip.readingKicker}</span>
        {copy.interpretation[interpretationKey(point)]}
      </p>
      <div className="lk-tip-mini">
        <div>
          <b>{copy.tooltip.notableLabel}</b>
          <span>{copy.eventHint[eventHintKey(point)]}</span>
        </div>
        <div>
          <b>{copy.tooltip.suggestedLabel}</b>
          <span>{copy.adviceHint[adviceHintKey(point)]}</span>
        </div>
      </div>
      <div
        className="lk-tip-mini"
        style={{ gridTemplateColumns: "1fr", marginTop: 10 }}
      >
        <div>
          <b>{copy.tooltip.watchForLabel}</b>
          <span>{copy.watchHint[watchHintKey(point)]}</span>
        </div>
      </div>
      <TipChips point={point} copy={copy} />
    </div>
  );
}

interface TooltipContentProps {
  point: LifePoint;
  markers: TimelineMarker[];
  copy: LifeKlineCopy;
}

// 内容整体按 point.age（+ markers/copy 引用）memo：anchor 高频移动时只重算定位、不重渲文案。
const TooltipContent = React.memo(
  function TooltipContent({ point, markers, copy }: TooltipContentProps) {
    return (
      <>
        <TipHead point={point} markers={markers} copy={copy} />
        <div className="lk-tip-divider" />
        <TipOhlc point={point} copy={copy} />
        <TipScore point={point} copy={copy} />
        <TipBody point={point} copy={copy} />
        <div className="lk-tip-foot">{copy.tooltip.footNote}</div>
      </>
    );
  },
  (prev, next) =>
    prev.point.age === next.point.age &&
    prev.markers === next.markers &&
    prev.copy === next.copy,
);

// fixed portal 富 tooltip：point/anchor 任一为 null 即隐藏（返回 null，无遗留节点/计时器）。
export function LifeKlineTooltip(
  props: LifeKlineTooltipProps,
): React.ReactPortal | null {
  const { point, anchor, markers, copy } = props;
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({
    tw: FALLBACK_TOOLTIP_WIDTH,
    th: FALLBACK_TOOLTIP_HEIGHT,
  });
  const age = point?.age;
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const tw = el.offsetWidth || FALLBACK_TOOLTIP_WIDTH;
    const th = el.offsetHeight || FALLBACK_TOOLTIP_HEIGHT;
    setSize((prev) => (prev.tw === tw && prev.th === th ? prev : { tw, th }));
  }, [age, copy]);
  if (point === null || anchor === null) return null;
  const { left, top } = clampTooltip(
    anchor.x,
    anchor.y,
    size.tw,
    size.th,
    window.innerWidth,
    window.innerHeight,
  );
  return createPortal(
    // padding:0 防 .lk-scope 的移动端 padding 在 body 末尾产生幽灵空白条。
    <div className="lk-scope" style={{ background: "transparent", padding: 0 }}>
      <div
        ref={tooltipRef}
        className="lk-tooltip"
        style={{ display: "block", left, top }}
      >
        <TooltipContent point={point} markers={markers} copy={copy} />
      </div>
    </div>,
    document.body,
  );
}
