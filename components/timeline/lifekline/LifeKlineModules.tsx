// INPUT: LifePoint/LkModuleKey 与 modulesInFocus/moduleTierKey/trendKey（./lifeKlineDerived）、LifeKlineCopy/fmt（./lifeKlineCopy）、父级回调（选卡/解锁）。
// OUTPUT: LifeKlineModulesGrid（6 生命领域卡网格 + 定性 In focus/Background 徽章，无数字评分）与 LifeKlineModuleDetail（当前模块预览面板），均 React.memo。
// POS: lifekline 呈现层的模块区，结构/类名 1:1 对照 v7 artifact 行 99-118 与 renderModules/renderModuleDetail；纯受控组件，状态与埋点归 LifeKlineSection。若更新此文件，务必更新本头注释与本目录 FOLDER.md。

import React from "react";
import type { LifeKlineCopy } from "./lifeKlineCopy";
import { fmt } from "./lifeKlineCopy";
import type { LifePoint, LkModuleKey } from "./lifeKlineDerived";
import { modulesInFocus, moduleTierKey, trendKey } from "./lifeKlineDerived";

export interface LifeKlineModulesGridProps {
  point: LifePoint;
  activeModule: LkModuleKey;
  sectionTitle: string;
  sectionBody: string;
  onSelectModule: (m: LkModuleKey) => void;
  onUnlockClick: (source: "module_card", moduleKey: LkModuleKey) => void;
  copy: LifeKlineCopy;
}

export interface LifeKlineModuleDetailProps {
  point: LifePoint;
  activeModule: LkModuleKey;
  onUnlockClick: (source: "module_detail") => void;
  copy: LifeKlineCopy;
}

// 6 张卡的固定渲染顺序（对照 artifact moduleMeta 行 173-180）。
const MODULE_ORDER: readonly LkModuleKey[] = [
  "love",
  "self",
  "work",
  "money",
  "home",
  "energy",
];

// 定性徽章配色：In focus 紫调 / Background slate（替代 artifact 数字分的绿调，
// 文字较长故内联 fontSize 12 防溢出；.lk-module-score 其余样式沿用）。
const IN_FOCUS_BADGE_STYLE: React.CSSProperties = {
  backgroundColor: "#f5f2ff",
  color: "#6c55ea",
  fontSize: 12,
};
const BACKGROUND_BADGE_STYLE: React.CSSProperties = {
  backgroundColor: "#f3f6f7",
  color: "#56656d",
  fontSize: 12,
};

// 内联 SVG 小锁（artifact 用 🔒 emoji，生产替换为字形图标）；
// 显式内联宽高覆盖 .lk-scope svg 的 width:100% 全局规则。
function LockIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 12, height: 12, display: "inline-block" }}
    >
      <rect x={4} y={11} width={16} height={10} rx={2} />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

interface ModuleCardProps {
  moduleKey: LkModuleKey;
  point: LifePoint;
  active: boolean;
  inFocus: boolean;
  copy: LifeKlineCopy;
  onSelectModule: (m: LkModuleKey) => void;
  onUnlockClick: (source: "module_card", moduleKey: LkModuleKey) => void;
}

function ModuleCard(props: ModuleCardProps): React.ReactElement {
  const { moduleKey, point, active, inFocus, copy, onSelectModule } = props;
  const moduleCopy = copy.modules[moduleKey];
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelectModule(moduleKey);
  };
  const handleUnlock = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onSelectModule(moduleKey);
    props.onUnlockClick("module_card", moduleKey);
  };
  return (
    <article
      className={"lk-module-card" + (active ? " lk-active" : "")}
      role="button"
      tabIndex={0}
      onClick={() => onSelectModule(moduleKey)}
      onKeyDown={handleKeyDown}
    >
      <div className="lk-module-head">
        <div style={{ display: "flex", gap: 11 }}>
          <div className="lk-module-icon">{moduleCopy.icon}</div>
          <div>
            <h3 className="lk-module-title">{moduleCopy.title}</h3>
            <p className="lk-module-sub">{moduleCopy.sub}</p>
          </div>
        </div>
        <div
          className="lk-module-score"
          style={inFocus ? IN_FOCUS_BADGE_STYLE : BACKGROUND_BADGE_STYLE}
        >
          {inFocus ? copy.moduleBadge.inFocus : copy.moduleBadge.background}
        </div>
      </div>
      <p>{moduleCopy.copy[moduleTierKey(point.close)]}</p>
      <div className="lk-lock-row">
        <span className="lk-lock">
          <LockIcon />
          {copy.moduleDetail.fullTitle}
        </span>
        <button type="button" className="lk-tiny-btn" onClick={handleUnlock}>
          {copy.moduleDetail.unlockShort}
        </button>
      </div>
    </article>
  );
}

export const LifeKlineModulesGrid = React.memo(function LifeKlineModulesGrid(
  props: LifeKlineModulesGridProps,
): React.ReactElement {
  const {
    point,
    activeModule,
    sectionTitle,
    sectionBody,
    onSelectModule,
    onUnlockClick,
    copy,
  } = props;
  const focused = modulesInFocus(point.topAspects);
  return (
    <>
      <section className="lk-section-title">
        <div>
          <h2>{sectionTitle}</h2>
          <p>{sectionBody}</p>
          <p className="lk-muted">{copy.modulesCaption}</p>
        </div>
      </section>
      <section className="lk-module-grid" aria-label={sectionTitle}>
        {MODULE_ORDER.map((key) => (
          <ModuleCard
            key={key}
            moduleKey={key}
            point={point}
            active={key === activeModule}
            inFocus={focused.includes(key)}
            copy={copy}
            onSelectModule={onSelectModule}
            onUnlockClick={onUnlockClick}
          />
        ))}
      </section>
    </>
  );
});

// 预览面板正文：趋势词 + 当档模块 copy + 免费/付费深度说明（patterns.depthBody，
// 语义对应 artifact「当前仅展示简短预览；付费报告会展开…」尾句）；零 In-focus 年追加 broadYearNote。
function buildDetailCopy(
  point: LifePoint,
  activeModule: LkModuleKey,
  copy: LifeKlineCopy,
): string {
  const base = `${copy.trend[trendKey(point)]}. ${
    copy.modules[activeModule].copy[moduleTierKey(point.close)]
  } ${copy.patterns.depthBody}`;
  const broadYear = modulesInFocus(point.topAspects).length === 0;
  return broadYear ? `${base} ${copy.moduleDetail.broadYearNote}` : base;
}

export const LifeKlineModuleDetail = React.memo(function LifeKlineModuleDetail(
  props: LifeKlineModuleDetailProps,
): React.ReactElement {
  const { point, activeModule, onUnlockClick, copy } = props;
  const title = copy.modules[activeModule].title;
  return (
    <article className="lk-panel lk-module-detail">
      <p className="lk-muted" style={{ margin: "0 0 5px" }}>
        {copy.moduleDetail.kicker}
      </p>
      <h2>{fmt(copy.moduleDetail.previewFmt, { title, age: point.age })}</h2>
      <p className="lk-node-copy">
        {buildDetailCopy(point, activeModule, copy)}
      </p>
      <div className="lk-module-detail-body">
        <div className="lk-locked-line">
          <b>{copy.moduleDetail.basisTitle}</b>
          <span>{copy.moduleDetail.basisBody}</span>
        </div>
        <div className="lk-locked-line">
          <b>{copy.moduleDetail.fullTitle}</b>
          <span>{copy.moduleDetail.fullBody}</span>
        </div>
      </div>
      <button
        type="button"
        className="lk-tiny-btn"
        style={{ marginTop: 14 }}
        onClick={() => onUnlockClick("module_detail")}
      >
        {fmt(copy.moduleDetail.unlockFmt, { title })}
      </button>
    </article>
  );
});
