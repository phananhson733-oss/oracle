// INPUT: TimelineCandle[]/TimelineMarker[]（真实 life 数据）+ birthYear/currentAge/demo/onUpsell；lifeKlineDerived 纯函数、lifeKlineCopy 双语字典、lifeKline.css、五个呈现组件、trackEvent。
// OUTPUT: LifeKlineSection —— life 模式整块编排：header/图例、SVG 主图、hover tooltip（hover/浏览选中/离开同帧 rAF 合流）、选中年份双面板、6 领域卡与模块详情、fake-door paywall/modal/toast、空数据可见空态、全部埋点（零 PII）。真 pin 语义：点击/Enter 锁定后 hover 只驱动 tooltip、面板锁定；再点其它蜡烛重 pin，Escape 解锁恢复浏览。
// POS: /timeline life 模式的唯一入口组件（artifact v7 1:1 复刻的组装层）。状态全部内聚于此，TimelinePage 只传数据。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TimelineCandle, TimelineMarker } from "../../../types";
import { trackEvent } from "../../../services/analytics";
import { useLanguage } from "../../UIComponents";
import {
  buildLifePoints,
  MAX_AGE,
  pickBubbles,
  supportResistance,
  type LifePoint,
  type LkModuleKey,
} from "./lifeKlineDerived";
import { fmt, getLifeKlineCopy } from "./lifeKlineCopy";
import { LifeKlineChart } from "./LifeKlineChart";
import { LifeKlineTooltip } from "./LifeKlineTooltip";
import { LifeKlinePanels } from "./LifeKlinePanels";
import {
  LifeKlineModuleDetail,
  LifeKlineModulesGrid,
} from "./LifeKlineModules";
import {
  LifeKlineModal,
  LifeKlinePaywallPanel,
  LifeKlineToast,
} from "./LifeKlinePaywall";
import "./lifeKline.css";

export interface LifeKlineSectionProps {
  candles: TimelineCandle[];
  markers: TimelineMarker[];
  birthYear: number;
  currentAge: number;
  demo?: boolean;
  onUpsell?: () => void;
}

type UnlockSource = "paywall" | "module_card" | "module_detail";

interface ModalState {
  open: boolean;
  source: UnlockSource | null;
  includedOpen: boolean;
  bodyText: string;
}

const CLOSED_MODAL: ModalState = {
  open: false,
  source: null,
  includedOpen: false,
  bodyText: "",
};

const TOAST_MS = 1800;

function clampAge(age: number): number {
  return Math.max(0, Math.min(MAX_AGE, age));
}

export function LifeKlineSection({
  candles,
  markers,
  birthYear,
  currentAge,
  demo = false,
  onUpsell,
}: LifeKlineSectionProps): React.ReactElement {
  const { language } = useLanguage();
  const copy = useMemo(() => getLifeKlineCopy(language), [language]);

  const points = useMemo(
    () => buildLifePoints(candles, birthYear),
    [candles, birthYear],
  );
  // age → point 查找表：hover/选中的精确命中用 Map.get 替代逐次 find。
  const pointByAge = useMemo(
    () => new Map(points.map((p) => [p.age, p] as const)),
    [points],
  );
  const rs = useMemo(() => supportResistance(points), [points]);
  const bubbles = useMemo(
    () => pickBubbles(markers, points, clampAge(currentAge), birthYear),
    [markers, points, currentAge, birthYear],
  );

  const [selectedAge, setSelectedAge] = useState<number>(() =>
    clampAge(currentAge),
  );
  // 真 pin：null=面板跟随 hover 浏览；非 null=面板锁定在该年龄（hover 仍照常驱动 tooltip）。
  const [pinnedAge, setPinnedAge] = useState<number | null>(null);
  const [activeModule, setActiveModule] = useState<LkModuleKey>("love");
  const [hover, setHover] = useState<{
    age: number;
    x: number;
    y: number;
  } | null>(null);
  const [modal, setModal] = useState<ModalState>(CLOSED_MODAL);
  const [toast, setToast] = useState<string | null>(null);

  // rAF 合流批：hover 更新/置空与浏览型选中共用同一帧提交（undefined 哨兵 = 本帧无 hover 变更）。
  const pendingHoverRef = useRef<
    { age: number; x: number; y: number } | null | undefined
  >(undefined);
  const pendingSelectRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewSentRef = useRef(false);

  // 首次挂载且数据就绪时发一次 view 事件（ref 防 StrictMode 双发；零 PII）。
  useEffect(() => {
    if (points.length > 0 && !viewSentRef.current) {
      viewSentRef.current = true;
      trackEvent("lifekline_view", { demo: demo ? "true" : "false" });
    }
  }, [points, demo]);

  // 卸载清理：rAF 与 toast 计时器。
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (toastTimerRef.current != null) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current != null) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  // 统一帧提交：相邻蜡烛 leave→enter 在同一帧合并（消除 tooltip 闪烁），浏览型选中随帧合流。
  const flushOnNextFrame = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingHoverRef.current !== undefined) {
        setHover(pendingHoverRef.current);
        pendingHoverRef.current = undefined;
      }
      if (pendingSelectRef.current != null) {
        setSelectedAge(clampAge(pendingSelectRef.current));
        pendingSelectRef.current = null;
      }
    });
  }, []);

  const handleHover = useCallback(
    (age: number, x: number, y: number) => {
      pendingHoverRef.current = { age, x, y };
      flushOnNextFrame();
    },
    [flushOnNextFrame],
  );

  // 离开不再立即置空：经 rAF 调度、与相邻 enter 同帧合并；卸载时由 cleanup 取消 rAF。
  const handleLeave = useCallback(() => {
    pendingHoverRef.current = null;
    flushOnNextFrame();
  }, [flushOnNextFrame]);

  const handleSelect = useCallback(
    (age: number, opts: { lock: boolean; viaKeyboard?: boolean }) => {
      if (!opts.lock) {
        // 浏览型选中（hover / 键盘 ←/→）：仅在未 pin 时驱动面板（与 hover 同一 rAF 批，
        // 不弹 toast 不发 pin 埋点）；pinned 时 hover 浏览忽略——hover 链独立，tooltip
        // 仍照常跟随。键盘 ←/→ 无 tooltip 链可用，pinned 下改为静默移动 pin 本身
        // （面板跟随，不弹 toast 不发埋点），否则键盘用户零反馈。
        if (pinnedAge != null) {
          if (opts.viaKeyboard) {
            setPinnedAge(clampAge(age));
            setSelectedAge(clampAge(age));
          }
          return;
        }
        pendingSelectRef.current = age;
        flushOnNextFrame();
        return;
      }
      pendingSelectRef.current = null;
      setPinnedAge(clampAge(age));
      setSelectedAge(clampAge(age));
      showToast(fmt(copy.toast.pinnedFmt, { age }));
      trackEvent("lifekline_candle_pin", {
        age_bucket: `${Math.floor(age / 10) * 10}s`,
      });
    },
    [copy, showToast, flushOnNextFrame, pinnedAge],
  );

  // Escape 解锁真 pin：仅 pinned 且 modal 未开时挂 document listener（modal 打开时让位于
  // modal 自身的 Escape 关闭，不抢按键）；挂/卸对称，依赖变化即重挂。
  useEffect(() => {
    if (pinnedAge == null || modal.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinnedAge(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pinnedAge, modal.open]);

  const openModal = useCallback(
    (source: UnlockSource, includedOpen = false, moduleKey?: LkModuleKey) => {
      // includedOpen（"See what's planned"）不是解锁意图：不发 unlock_click，modal_open 照发。
      if (!includedOpen) trackEvent("lifekline_unlock_click", { source });
      const moduleTitle = copy.modules[moduleKey ?? activeModule].title;
      const bodyText =
        source === "paywall"
          ? copy.modal.comingSoonBody
          : `${fmt(copy.modal.moduleFmt, { title: moduleTitle })} ${copy.modal.comingSoonBody}`;
      if (!modal.open) trackEvent("lifekline_modal_open", { source });
      setModal({ open: true, source, includedOpen, bodyText });
    },
    [copy, activeModule, modal.open],
  );

  const handleToggleIncluded = useCallback(() => {
    trackEvent("lifekline_included_toggle", {});
    setModal((prev) => ({ ...prev, includedOpen: !prev.includedOpen }));
  }, []);

  const handleRegisterInterest = useCallback(() => {
    trackEvent("lifekline_register_interest", {
      source: modal.source ?? "unknown",
    });
    setModal(CLOSED_MODAL);
    showToast(copy.modal.thanksToast);
  }, [modal.source, copy, showToast]);

  const handleCreateYourOwn = useCallback(() => {
    setModal(CLOSED_MODAL);
    onUpsell?.();
  }, [onUpsell]);

  const handleCloseModal = useCallback(() => setModal(CLOSED_MODAL), []);

  // memo 化子组件（ModulesGrid/PaywallPanel）的稳定回调：避免 inline 箭头令 React.memo 失效。
  const handleModuleCardUnlock = useCallback(
    (source: "module_card", moduleKey: LkModuleKey) =>
      openModal(source, false, moduleKey),
    [openModal],
  );
  const handlePaywallUnlock = useCallback(
    () => openModal("paywall"),
    [openModal],
  );
  const handlePaywallIncluded = useCallback(
    () => openModal("paywall", true),
    [openModal],
  );

  // 选中点：优先 Map 精确命中，缺失年龄回退最近可用点（数据缺口时面板仍可用）。
  const selectedPoint: LifePoint | undefined = useMemo(() => {
    if (points.length === 0) return undefined;
    const exact = pointByAge.get(selectedAge);
    if (exact) return exact;
    return points.reduce((best, p) =>
      Math.abs(p.age - selectedAge) < Math.abs(best.age - selectedAge)
        ? p
        : best,
    );
  }, [points, pointByAge, selectedAge]);

  // 内容只依赖 hover 的 age（位置不参与内容计算）；anchor 仍取 hover.x/y 原样传 Tooltip。
  const hoverAge = hover?.age;
  const hoverPoint: LifePoint | null = useMemo(() => {
    if (hoverAge == null) return null;
    return pointByAge.get(hoverAge) ?? null;
  }, [pointByAge, hoverAge]);

  // 空数据渲染可见空态（不再静默 return null）；emptyNote 文案键由 lifeKlineCopy 提供。
  if (points.length === 0 || !selectedPoint) {
    return (
      <div className="lk-scope">
        <div className="lk-shell">
          <p className="lk-footer">{copy.footer.emptyNote}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lk-scope">
      <div className="lk-shell">
        <section className="lk-kline-card" aria-label={copy.header.title}>
          <div className="lk-chart-head">
            <div className="lk-brandline">
              <div>
                <h2 className="lk-title">{copy.header.title}</h2>
                <p className="lk-subhead">{copy.header.subhead}</p>
              </div>
            </div>
            <div className="lk-legend">
              <span className="lk-good">
                <i
                  className="lk-dot"
                  style={{ background: "var(--lk-green)" }}
                />
                {copy.header.legendUp}
              </span>
              <span className="lk-bad">
                <i className="lk-dot" style={{ background: "var(--lk-red)" }} />
                {copy.header.legendDown}
              </span>
              <span className="lk-ma">
                <i className="lk-dash" />
                {copy.header.legendMa}
              </span>
              <span className="lk-sr">
                <i className="lk-dash lk-dashed" />
                {copy.header.legendSr}
              </span>
            </div>
          </div>
          <LifeKlineChart
            points={points}
            selectedAge={selectedPoint.age}
            bubbles={bubbles}
            rs={rs}
            copy={copy}
            onHover={handleHover}
            onLeave={handleLeave}
            onSelect={handleSelect}
          />
          <LifeKlinePanels
            point={selectedPoint}
            currentAge={clampAge(currentAge)}
            markers={markers}
            copy={copy}
          />
        </section>

        <LifeKlineModulesGrid
          point={selectedPoint}
          activeModule={activeModule}
          sectionTitle={copy.modulesSection.title}
          sectionBody={copy.modulesSection.body}
          onSelectModule={setActiveModule}
          onUnlockClick={handleModuleCardUnlock}
          copy={copy}
        />

        <section className="lk-wide-row">
          <LifeKlineModuleDetail
            point={selectedPoint}
            activeModule={activeModule}
            onUnlockClick={openModal}
            copy={copy}
          />
          <LifeKlinePaywallPanel
            copy={copy}
            onUnlock={handlePaywallUnlock}
            onIncluded={handlePaywallIncluded}
          />
        </section>

        <p className="lk-footer">
          {copy.footer.disclaimer} {copy.footer.calendarNote}
        </p>
      </div>

      <LifeKlineTooltip
        point={hoverPoint}
        anchor={hover ? { x: hover.x, y: hover.y } : null}
        markers={markers}
        copy={copy}
      />
      <LifeKlineModal
        open={modal.open}
        bodyText={modal.bodyText}
        includedOpen={modal.includedOpen}
        demo={demo}
        copy={copy}
        onToggleIncluded={handleToggleIncluded}
        onRegisterInterest={handleRegisterInterest}
        onCreateYourOwn={demo ? handleCreateYourOwn : undefined}
        onClose={handleCloseModal}
      />
      <LifeKlineToast message={toast} />
    </div>
  );
}
