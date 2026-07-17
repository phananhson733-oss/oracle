// INPUT: LifePoint（选中年渲染点）+ currentAge + TimelineMarker[]（../../../types）+ LifeKlineCopy 双语文案；lifeKlineDerived 的阈值 key 函数族 + lifeKlineCopy 的 fmt。
// OUTPUT: LifeKlinePanels 纯展示组件（React.memo 包裹，无 aria-live——显式动作播报由 Section 的 toast role=status 承担）——below 双栏：左 soft 节点面板（meta[当前年龄追加 youAreHere 标注]/headline[纯数据驱动]/能量 pill/makeNodeCopy 等价拼接/三格 mini-grid），右 cream 简要解读面板（三条 pattern）。
// POS: lifekline 呈现层的选中态文案面板，由 LifeKlineSection.tsx 编排渲染；结构/类名 1:1 对照 v7 artifact 行 75-96 与 398-442。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import type { TimelineMarker } from "../../../types";
import { fmt, type LifeKlineCopy } from "./lifeKlineCopy";
import {
  adviceHintKey,
  bestUseKey,
  cycleCueKey,
  eventHintKey,
  headlineKey,
  interpretationKey,
  type LifePoint,
  phaseKey,
  watchOutKey,
} from "./lifeKlineDerived";

export interface LifeKlinePanelsProps {
  point: LifePoint;
  currentAge: number;
  markers: TimelineMarker[];
  copy: LifeKlineCopy;
}

// makeNodeCopy 等价拼接（artifact 行 411-413）：解读句 + notableLabel 前缀的事件提示 + suggestedLabel 前缀的建议提示；标签与句子全部取自 copy。
function buildNodeCopy(point: LifePoint, copy: LifeKlineCopy): string {
  const interpretation = copy.interpretation[interpretationKey(point)];
  const notable = `${copy.tooltip.notableLabel}: ${copy.eventHint[eventHintKey(point)]}`;
  const suggested = `${copy.tooltip.suggestedLabel}: ${copy.adviceHint[adviceHintKey(point)]}`;
  return `${interpretation} ${notable} ${suggested}`;
}

// 左侧 soft 节点面板：meta（年龄/年份/阶段，当前年龄追加 "You are here" 数据化标注）+ headline + 能量 pill + 拼接解读 + 三格 mini-grid。
function NodePanel({
  point,
  currentAge,
  markers,
  copy,
}: LifeKlinePanelsProps): React.ReactElement {
  const phase = copy.stages[phaseKey(point.age)].full;
  const metaBase = fmt(copy.nodePanel.metaFmt, {
    age: point.age,
    year: point.year,
    phase,
  });
  // "你在这里"改为 meta 行数据化标注（headline 的 current 短路已删，headline 纯数据驱动）。
  const meta =
    point.age === currentAge
      ? `${metaBase} · ${copy.nodePanel.youAreHere}`
      : metaBase;
  const minis = [
    {
      label: copy.nodePanel.bestUseLabel,
      value: copy.bestUse[bestUseKey(point)],
    },
    {
      label: copy.nodePanel.watchOutLabel,
      value: copy.watchOut[watchOutKey(point)],
    },
    {
      label: copy.nodePanel.cycleCueLabel,
      value: copy.cycleCue[cycleCueKey(point.age, markers)],
    },
  ];
  return (
    <article className="lk-panel lk-soft">
      <div className="lk-node-top">
        <div>
          <p className="lk-muted" style={{ margin: "0 0 5px" }}>
            {meta}
          </p>
          <h3 className="lk-node-title">{copy.headline[headlineKey(point)]}</h3>
        </div>
        <div className="lk-score-pill">
          <b>{point.close}</b>
          <span>{copy.nodePanel.energyPillLabel}</span>
        </div>
      </div>
      <p className="lk-node-copy">{buildNodeCopy(point, copy)}</p>
      <div className="lk-mini-grid">
        {minis.map((mini) => (
          <div className="lk-mini" key={mini.label}>
            <span>{mini.label}</span>
            <strong>{mini.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

// 右侧 cream 简要解读面板：标题 + 说明 + 三条 pattern（整体形态 / 当年 K 线涨跌 / 付费深度）。
function PatternsPanel({
  point,
  copy,
}: Pick<LifeKlinePanelsProps, "point" | "copy">): React.ReactElement {
  const patterns = [
    { title: copy.patterns.shapeTitle, body: copy.patterns.shapeBody },
    {
      title: copy.patterns.candleTitle,
      // 三态：delta=0（含首根 doji）是"持平"事实，不得复用上涨文案。
      body:
        point.delta === 0
          ? copy.patterns.candleFlat
          : point.up
            ? copy.patterns.candleRising
            : copy.patterns.candleFalling,
    },
    { title: copy.patterns.depthTitle, body: copy.patterns.depthBody },
  ];
  return (
    <article className="lk-panel lk-cream">
      <h3>{copy.patterns.panelTitle}</h3>
      <p className="lk-muted" style={{ margin: "7px 0 0", lineHeight: 1.5 }}>
        {copy.patterns.panelNote}
      </p>
      <div className="lk-pattern-list">
        {patterns.map((item, index) => (
          <div className="lk-pattern-item" key={item.title}>
            <div className="lk-pattern-num">{index + 1}</div>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

// below 双栏容器：左节点面板 + 右 cream 面板（artifact .below → .lk-below）。
export const LifeKlinePanels = React.memo(function LifeKlinePanels(
  props: LifeKlinePanelsProps,
): React.ReactElement {
  return (
    <div className="lk-below">
      <NodePanel {...props} />
      <PatternsPanel point={props.point} copy={props.copy} />
    </div>
  );
});
