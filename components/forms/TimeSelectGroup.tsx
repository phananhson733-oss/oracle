// INPUT: value（24 小时制 HH:mm 或空串）、onChange 回调、可选 i18n labels 与 CSS class。
// OUTPUT: 受控的三 `<select>`（小时 / 分钟 / 上下午）时间选择器，不依赖操作系统 locale
//         （原生 `<input type="time">` 依赖）。onChange(value, isPartial)：三段齐全时
//         emit 24 小时制 "HH:mm" 且 isPartial=false；一段都没选时 emit "" 且 isPartial=false
//         （= 真正的「时间未知」）；只选了一部分时 emit "" 且 **isPartial=true**，让调用方
//         能拦住提交并提示用户，而不是把半填状态静默当成「未提供」。
// POS: 与 DateSelectGroup 配对的共享表单原语，供所有采集出生时间的表单使用。
//      存在的理由：原生 `<input type="time">` 在 en-US 等 12 小时制 locale 下渲染成
//      hh:mm AM/PM 三段，用户只填 hh:mm 不选 AM/PM 时 `e.target.value` 返回**空串**，
//      于是 accuracyLevel 落成 time_unknown、后端按正午 12:00 出盘，却照样给出精确到分的
//      上升与宫位——用户填了时间，结果页却显示 "Time: Not provided"。真实 KOC 踩到过。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const pad2 = (n: number) => String(n).padStart(2, "0");

// 静态选项表提到模块级，避免每次渲染重建（rendering-hoist-jsx）。
const HOUR_OPTIONS: readonly number[] = Array.from(
  { length: 12 },
  (_, i) => i + 1,
);
const MINUTE_OPTIONS: readonly number[] = Array.from(
  { length: 60 },
  (_, i) => i,
);

export type Meridiem = "AM" | "PM";

type Parts = {
  hour12: number | null;
  minute: number | null;
  meridiem: Meridiem | null;
};

const EMPTY_PARTS: Parts = { hour12: null, minute: null, meridiem: null };

// "HH:mm"（24 小时制）→ 12 小时制三段。非法/空串一律回落到全空占位。
const parse24 = (value: string): Parts => {
  if (!value) return EMPTY_PARTS;
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return EMPTY_PARTS;
  const h24 = Number(m[1]);
  const minute = Number(m[2]);
  if (h24 < 0 || h24 > 23 || minute < 0 || minute > 59) return EMPTY_PARTS;
  // 00 点显示为 12 AM，12 点显示为 12 PM——这两个边界是 12 小时制最常写错的地方。
  const meridiem: Meridiem = h24 < 12 ? "AM" : "PM";
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour12, minute, meridiem };
};

// 12 小时制三段 → "HH:mm"（24 小时制）。
const compose24 = (hour12: number, minute: number, meridiem: Meridiem) => {
  const h24 =
    meridiem === "AM" ? (hour12 === 12 ? 0 : hour12) : hour12 === 12 ? 12 : hour12 + 12;
  return `${pad2(h24)}:${pad2(minute)}`;
};

export interface TimeSelectGroupLabels {
  /** aria-label / 占位符：小时。默认 "Hour" */
  hour?: string;
  /** aria-label / 占位符：分钟。默认 "Minute" */
  minute?: string;
  /** aria-label：上下午。默认 "AM or PM" */
  meridiem?: string;
  /** 上下午占位符。默认 "AM/PM" */
  meridiemPlaceholder?: string;
  /** 上午显示文案。默认 "AM" */
  am?: string;
  /** 下午显示文案。默认 "PM" */
  pm?: string;
  /** role=group 的 aria-label。默认 "Birth time" */
  groupLabel?: string;
}

export interface TimeSelectGroupProps {
  /** 24 小时制 "HH:mm"，未选择时为空串。 */
  value: string;
  /**
   * (value, isPartial) —— value 仅在三段齐全时非空。
   * isPartial=true 表示用户选了一部分但没选完：调用方**必须**拦住提交并提示补齐，
   * 否则就退回成了原生控件那个「用户填了时间却被记成未知」的 bug。
   */
  onChange: (value: string, isPartial: boolean) => void;
  /** 同页多组时用于生成稳定且不冲突的 select id。 */
  idPrefix: string;
  className?: string;
  selectClassName?: string;
  labels?: TimeSelectGroupLabels;
}

/**
 * 与 DateSelectGroup 同构的时间选择原语：内部持有 hour/minute/meridiem 三个
 * `number | null` 槽位，只在组合结果变化时向上 emit，避免部分选择经由父级的 ""
 * 哨兵值回灌导致三个 select 被一起重置（DateSelectGroup 头注释记录的 PR #29 回归）。
 */
export const TimeSelectGroup: React.FC<TimeSelectGroupProps> = ({
  value,
  onChange,
  idPrefix,
  className,
  selectClassName,
  labels,
}) => {
  const seed = useMemo(() => parse24(value), [value]);
  const [hour12, setHour12] = useState<number | null>(seed.hour12);
  const [minute, setMinute] = useState<number | null>(seed.minute);
  const [meridiem, setMeridiem] = useState<Meridiem | null>(seed.meridiem);

  // 区分「父级回灌我们刚 emit 的值」与「父级真的换了值（预填 / 重置）」。
  const lastEmittedRef = useRef<string>(value);
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    const next = parse24(value);
    setHour12(next.hour12);
    setMinute(next.minute);
    setMeridiem(next.meridiem);
    lastEmittedRef.current = value;
  }, [value]);

  // 三段齐全才组合；否则 emit 空串，并用 isPartial 区分「一段没选」和「选了一半」。
  const filledCount =
    (hour12 !== null ? 1 : 0) +
    (minute !== null ? 1 : 0) +
    (meridiem !== null ? 1 : 0);
  const isPartial = filledCount > 0 && filledCount < 3;
  const composed =
    hour12 !== null && minute !== null && meridiem !== null
      ? compose24(hour12, minute, meridiem)
      : "";

  // partial 状态下 composed 恒为 ""，仅靠 composed 做去重会漏掉 partial 标记的翻转，
  // 所以把 isPartial 一起编进去重键。
  const emitKeyRef = useRef<string>(`${value}|false`);
  useEffect(() => {
    const key = `${composed}|${isPartial}`;
    if (key === emitKeyRef.current) return;
    emitKeyRef.current = key;
    lastEmittedRef.current = composed;
    onChange(composed, isPartial);
  }, [composed, isPartial, onChange]);

  const handleHour = useCallback((raw: string) => {
    setHour12(raw ? Number(raw) : null);
  }, []);
  const handleMinute = useCallback((raw: string) => {
    setMinute(raw ? Number(raw) : null);
  }, []);
  const handleMeridiem = useCallback((raw: string) => {
    setMeridiem(raw === "AM" || raw === "PM" ? raw : null);
  }, []);

  const hourLabel = labels?.hour ?? "Hour";
  const minuteLabel = labels?.minute ?? "Minute";
  const meridiemLabel = labels?.meridiem ?? "AM or PM";
  const meridiemPlaceholder = labels?.meridiemPlaceholder ?? "AM/PM";
  const amLabel = labels?.am ?? "AM";
  const pmLabel = labels?.pm ?? "PM";
  const groupLabel = labels?.groupLabel ?? "Birth time";

  return (
    <div
      className={className ?? "grid grid-cols-[1fr_1fr_1fr] gap-2"}
      role="group"
      aria-label={groupLabel}
    >
      <select
        id={`${idPrefix}-time-hour`}
        value={hour12 !== null ? String(hour12) : ""}
        onChange={(e) => handleHour(e.target.value)}
        aria-label={hourLabel}
        className={selectClassName}
      >
        <option value="">{hourLabel}</option>
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={String(h)}>
            {h}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-time-minute`}
        value={minute !== null ? String(minute) : ""}
        onChange={(e) => handleMinute(e.target.value)}
        aria-label={minuteLabel}
        className={selectClassName}
      >
        <option value="">{minuteLabel}</option>
        {MINUTE_OPTIONS.map((m) => (
          <option key={m} value={String(m)}>
            {pad2(m)}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-time-meridiem`}
        value={meridiem ?? ""}
        onChange={(e) => handleMeridiem(e.target.value)}
        aria-label={meridiemLabel}
        className={selectClassName}
      >
        <option value="">{meridiemPlaceholder}</option>
        <option value="AM">{amLabel}</option>
        <option value="PM">{pmLabel}</option>
      </select>
    </div>
  );
};

export default TimeSelectGroup;
