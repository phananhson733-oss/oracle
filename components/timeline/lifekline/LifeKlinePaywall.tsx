// INPUT: LifeKlineCopy 文案字典（./lifeKlineCopy）+ 父级 LifeKlineSection 传入的展示状态与回调（open/bodyText/includedOpen/demo/message 及各 on* 事件）。
// OUTPUT: 命名导出三个纯展示组件：LifeKlinePaywallPanel（paywall 面板，React.memo）、LifeKlineModal（fake-door 弹窗，createPortal
//         + document 级 Tab trap/Escape/焦点还原/body 滚动锁/included 切换）、LifeKlineToast（常驻 portal status 节点，aria-live）。
// POS: lifekline 付费转化展示层；状态机与埋点全在 LifeKlineSection.tsx，本文件零内部状态。若更新此文件，务必更新本头注释与本目录 FOLDER.md。

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { LifeKlineCopy } from "./lifeKlineCopy";

// ---- 内部工具：锁图标（内联 SVG，不用 emoji；内联 style 与 Modules 版一致，防全局 svg 宽度规则误伤，双保险） ----

function LockIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      style={{ width: 16, height: 16, display: "inline-block" }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// ---- 内部工具：简版 focus trap（open 期间 document 级 keydown 捕获 Tab，焦点循环留在 modal 内；
//      点击非聚焦文本后焦点落 body 也不逃逸） ----

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function trapTabKey(event: KeyboardEvent, modal: HTMLDivElement | null): void {
  if (event.key !== "Tab" || !modal) return;
  const focusable = Array.from(
    modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const inside = active instanceof HTMLElement && modal.contains(active);
  if (event.shiftKey) {
    if (!inside || active === first) {
      event.preventDefault();
      last.focus();
    }
    return;
  }
  if (!inside || active === last) {
    event.preventDefault();
    first.focus();
  }
}

// ---- 内部 hooks：open 时聚焦 primary、close 时把焦点还给 open 前元素（StrictMode 挂/卸对称） ----

function useModalFocus(
  open: boolean,
  primaryRef: React.RefObject<HTMLButtonElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    primaryRef.current?.focus();
    return () => {
      previous?.focus();
    };
  }, [open, primaryRef]);
}

function useEscapeToClose(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose]);
}

// open 期间 document 级 Tab trap（作用域不依赖 modal 内焦点），关闭/卸载对称移除。
function useTrapTabKey(
  open: boolean,
  modalRef: React.RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent): void => {
      trapTabKey(event, modalRef.current);
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, modalRef]);
}

// open 期间锁定 body 滚动，close/卸载恢复 open 前原值。
function useBodyScrollLock(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}

// ---- paywall 面板（artifact 行 120-134 的 1:1 结构，类名 .lk- 前缀） ----

export interface LifeKlinePaywallPanelProps {
  copy: LifeKlineCopy;
  onUnlock: () => void;
  onIncluded: () => void;
}

export const LifeKlinePaywallPanel = React.memo(function LifeKlinePaywallPanel(
  props: LifeKlinePaywallPanelProps,
): React.ReactElement {
  const { copy, onUnlock, onIncluded } = props;
  return (
    <article className="lk-panel lk-paywall">
      <h2>{copy.paywall.title}</h2>
      <p className="lk-muted" style={{ margin: "7px 0 0" }}>
        {copy.paywall.body}
      </p>
      <div className="lk-pay-list">
        {copy.paywall.items.map((item) => (
          <div className="lk-pay-item" key={item.title}>
            <span>
              <LockIcon />
            </span>
            <div>
              <b>{item.title}</b>
              <small>{item.sub}</small>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="lk-primary" onClick={onUnlock}>
          {copy.paywall.unlockCta}
        </button>
        <button type="button" className="lk-secondary" onClick={onIncluded}>
          {copy.paywall.includedCta}
        </button>
      </div>
    </article>
  );
});

// ---- fake-door modal（artifact 行 141-156；portal 到 body，wrapper 自带 .lk-scope） ----

export interface LifeKlineModalProps {
  open: boolean;
  bodyText: string;
  includedOpen: boolean;
  demo: boolean;
  copy: LifeKlineCopy;
  onToggleIncluded: () => void;
  onRegisterInterest: () => void;
  onCreateYourOwn?: () => void;
  onClose: () => void;
}

export function LifeKlineModal(
  props: LifeKlineModalProps,
): React.ReactPortal | null {
  const {
    open,
    bodyText,
    includedOpen,
    demo,
    copy,
    onToggleIncluded,
    onRegisterInterest,
    onCreateYourOwn,
    onClose,
  } = props;
  const modalRef = useRef<HTMLDivElement | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  // backdrop 误关防护：仅当 pointerdown 起点也在 backdrop 上时 click 才关闭
  //（modal 内选择文本拖到 backdrop 释放不算）。
  const backdropPointerDownRef = useRef(false);
  useModalFocus(open, primaryRef);
  useEscapeToClose(open, onClose);
  useTrapTabKey(open, modalRef);
  useBodyScrollLock(open);

  if (!open) return null;

  const handleBackdropPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    backdropPointerDownRef.current = event.target === event.currentTarget;
  };

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ): void => {
    if (
      backdropPointerDownRef.current &&
      event.target === event.currentTarget
    ) {
      onClose();
    }
    backdropPointerDownRef.current = false;
  };

  return createPortal(
    <div className="lk-scope" style={{ background: "transparent", padding: 0 }}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape/Tab 由 document 级 keydown listener 承担 */}
      <div
        className="lk-modal-backdrop lk-open"
        role="presentation"
        onPointerDown={handleBackdropPointerDown}
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="lk-modal"
          role="dialog"
          aria-modal="true"
          aria-label={copy.modal.title}
        >
          <h2>{copy.modal.title}</h2>
          <p>{bodyText}</p>
          {includedOpen ? (
            <div className="lk-included lk-open">
              {copy.paywall.items.map((item) => (
                <div key={item.title}>{item.title}</div>
              ))}
            </div>
          ) : null}
          {demo ? (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="lk-tiny-btn"
                onClick={onCreateYourOwn}
              >
                {copy.modal.createYourOwn}
              </button>
            </div>
          ) : null}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="lk-tiny-btn"
              onClick={onToggleIncluded}
            >
              {copy.paywall.includedCta}
            </button>
          </div>
          <div className="lk-modal-actions">
            <button type="button" className="lk-secondary" onClick={onClose}>
              {copy.modal.close}
            </button>
            <button
              ref={primaryRef}
              type="button"
              className="lk-primary"
              onClick={onRegisterInterest}
            >
              {copy.modal.primaryCta}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---- toast（artifact 行 140；status 节点常驻渲染保证 SR 播报首条消息；
//      显隐与计时全由父级控制 message，本组件无计时器） ----

export function LifeKlineToast(props: {
  message: string | null;
}): React.ReactPortal {
  const { message } = props;
  return createPortal(
    <div className="lk-scope" style={{ background: "transparent", padding: 0 }}>
      <div
        className={"lk-toast" + (message ? " lk-show" : "")}
        role="status"
        aria-live="polite"
        style={message ? undefined : { visibility: "hidden" }}
      >
        {message ?? ""}
      </div>
    </div>,
    document.body,
  );
}
