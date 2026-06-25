// INPUT: React、useLanguage（UIComponents）、services/apiClient（fetchNatalChart）、analytics、useCalculatorTheme、
//        astroDisplay（planetLabel/signLabel/formatDegMin）、sunSign（signElement/signModality）、PersonBirthFields（共享双人表单）、
//        compositeChart（纯引擎）、共享原语 ToolPageShell / ToolResultCard / PlacementList / PlacementRow / GlyphBadge /
//        ElementBalanceBar / ToolFunnelCTA。
// OUTPUT: 合成盘（Composite）计算器——两人出生表单 → 两次匿名 natal → 客户端中点合成盘 → 落座一览 + 客户端元素/三模态平衡 + 导流 CTA。
// POS: 计算器矩阵（D）Composite，路由 /:lang/composite-calculator（与 wiki 文章 composite-chart-calculator 区分）。
//      客户端算中点+元素分布（不碰付费端点/无 AI）；姓名仅本地（隐私 #4）；中性叙事。若更新此文件，务必更新 calculators/FOLDER.md。

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Language, PlanetPosition } from "../../types";
import { useLanguage } from "../UIComponents";
import { fetchNatalChart } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { planetLabel, signLabel, formatDegMin } from "./astroDisplay";
import { signElement, signModality, type ZodiacSign } from "./sunSign";
import {
  PersonBirthFields,
  emptyPerson,
  personToBirth,
  MONTH_FALLBACK_EN,
  type PersonState,
  type FieldsTheme,
} from "./PersonBirthFields";
import { compositeChart, type CompositePlacement } from "./compositeChart";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard, PlacementList, PlacementRow } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import {
  ElementBalanceBar,
  type ElementCounts,
  type ModalityCounts,
} from "./ElementBalanceBar";
import { ToolFunnelCTA } from "./ToolFunnelCTA";

// 合成盘纳入 10 大行星（关系盘里行星全相关）。
const COMPOSITE_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

// 三大焦点落座的中性、静态含义——非命运断言，纯客户端数据（无 AI）。
const FOCUS_MEANING: Record<string, { en: string; zh: string }> = {
  Sun: {
    en: "the relationship's core purpose and shared identity",
    zh: "这段关系的核心目的与共同身份",
  },
  Moon: {
    en: "the emotional needs and felt safety between you",
    zh: "你们之间的情绪需求与安全感",
  },
  Ascendant: {
    en: "the public face the relationship shows the world",
    zh: "这段关系向外界呈现的样貌",
  },
};

const signHref = (sign: string): string => `/wiki/${sign.toLowerCase()}`;

// 客户端统计合成盘落座的元素/三模态分布（与 /api/natal/chart 的 dominance 同形，但本地算）。
function tallyBalance(placements: CompositePlacement[]): {
  elements: ElementCounts;
  modalities: ModalityCounts;
} {
  const elements: ElementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities: ModalityCounts = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const p of placements) {
    const sign = p.sign as ZodiacSign;
    elements[signElement(sign)] += 1;
    modalities[signModality(sign)] += 1;
  }
  return { elements, modalities };
}

type State = "idle" | "loading" | "result" | "error";

export const CompositeCalculator: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const personA = useRef<PersonState>(emptyPerson());
  const personB = useRef<PersonState>(emptyPerson());
  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [placements, setPlacements] = useState<CompositePlacement[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const monthNames = useMemo<string[]>(() => MONTH_FALLBACK_EN.slice(), []);

  const onChangeA = useCallback((p: PersonState) => {
    personA.current = p;
  }, []);
  const onChangeB = useCallback((p: PersonState) => {
    personB.current = p;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const birthA = personToBirth(personA.current);
    const birthB = personToBirth(personB.current);
    if (!birthA || !birthB) {
      setErrorMessage(
        lang === "zh"
          ? "请为两个人都填写出生日期并从下拉中选择城市。"
          : "Please enter a birth date and pick a city for both people.",
      );
      setState("error");
      return;
    }
    setState("loading");
    setErrorMessage("");
    // 姓名只用于本地标签，绝不进入任何请求（隐私 #4）。
    setLabelA(personA.current.name || (lang === "zh" ? "甲方" : "Person A"));
    setLabelB(personB.current.name || (lang === "zh" ? "乙方" : "Person B"));
    try {
      const [chartA, chartB] = await Promise.all([
        fetchNatalChart(
          birthA as unknown as Parameters<typeof fetchNatalChart>[0],
          { skipCache: true },
        ),
        fetchNatalChart(
          birthB as unknown as Parameters<typeof fetchNatalChart>[0],
          { skipCache: true },
        ),
      ]);
      const posA = (chartA.positions ?? []) as PlanetPosition[];
      const posB = (chartB.positions ?? []) as PlanetPosition[];
      const composite = compositeChart(posA, posB, COMPOSITE_BODIES);
      if (composite.length === 0) {
        throw new Error("empty composite");
      }
      setPlacements(composite);
      setState("result");
      trackEvent("composite_calculated", {
        has_time_a: !!personA.current.time,
        has_time_b: !!personB.current.time,
        placement_count: composite.length,
      });
      setTimeout(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      setErrorMessage(
        lang === "zh"
          ? "出了点问题，请检查出生信息后重试。"
          : "Something went wrong. Check the birth details and try again.",
      );
      setState("error");
    }
  };

  const balance = useMemo(() => tallyBalance(placements), [placements]);

  // 三大焦点（合成 太阳/月亮 + 可选上升）——各配一行静态中性含义。
  const focusRows = useMemo(
    () =>
      ["Sun", "Moon", "Ascendant"]
        .map((name) => ({
          name,
          placement: placements.find((p) => p.name === name),
        }))
        .filter(
          (f): f is { name: string; placement: CompositePlacement } =>
            !!f.placement && !!FOCUS_MEANING[f.name],
        ),
    [placements],
  );

  const fieldsTheme: FieldsTheme = {
    textPrimary: th.textPrimary,
    textSecondary: th.textSecondary,
    inputBg: th.inputBg,
    inputText: th.inputText,
    inputBorder: th.inputBorder,
    cardBg: th.cardBg,
    cardBorder: th.cardBorder,
  };

  return (
    <ToolPageShell
      title={lang === "zh" ? "组合盘计算器" : "Composite Chart Calculator"}
      subtitle={
        lang === "zh"
          ? "用两个人星盘的中点，生成代表「这段关系本身」的组合盘——基于真实天文，不做命运断言。"
          : "Build the midpoint chart that represents the relationship itself — from two charts, on real astronomy."
      }
      slug="composite-calculator"
      maxWidth="6xl"
    >
      <form
        onSubmit={handleSubmit}
        className={`${th.cardBg} border ${th.cardBorder} mb-8 rounded-2xl p-6 transition-all duration-300 ease-in-out sm:p-8`}
        noValidate
      >
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <PersonBirthFields
            idPrefix="comp-a"
            label={lang === "zh" ? "第一个人" : "Person A"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChangeA}
          />
          <PersonBirthFields
            idPrefix="comp-b"
            label={lang === "zh" ? "第二个人" : "Person B"}
            lang={lang}
            th={fieldsTheme}
            monthNames={monthNames}
            onChange={onChangeB}
          />
        </div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="min-h-[44px] w-full rounded-xl bg-gradient-primary py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 motion-reduce:transition-none"
        >
          {state === "loading"
            ? lang === "zh"
              ? "计算中…"
              : "Calculating…"
            : lang === "zh"
              ? "生成组合盘"
              : "Build composite chart"}
        </button>
      </form>

      {state === "error" && (
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={th.textPrimary}>{errorMessage}</p>
        </div>
      )}

      {state === "result" && (
        <ToolResultCard
          innerRef={resultRef}
          tabIndex={-1}
          headline={
            lang === "zh"
              ? `${labelA} 与 ${labelB} 的组合盘`
              : `${labelA} & ${labelB} — Composite`
          }
          sub={
            lang === "zh"
              ? "每颗行星取两盘的中点，描绘关系本身的性格——这是反思的镜子，不是结果的预测。"
              : "Each planet is the midpoint of the two charts — a portrait of the relationship itself, not a prediction."
          }
          footer={
            <ToolFunnelCTA
              tool="composite-calculator"
              label={
                lang === "zh"
                  ? "想要完整的关系解读吗？"
                  : "Want the full relationship reading?"
              }
              href="/us"
              note={
                lang === "zh"
                  ? "这些中点呈现的是关系的几何骨架。完整解读会诠释它对你们俩意味着什么。"
                  : "These midpoints show the relationship's skeleton. The full reading interprets what it means for you two."
              }
              secondaryLinks={[
                {
                  label:
                    lang === "zh"
                      ? "组合盘是什么"
                      : "What a composite chart means",
                  href: "/wiki/composite-chart",
                },
              ]}
            />
          }
        >
          {/* 三大焦点：合成 太阳/月亮（+ 上升若有），各配一行静态中性含义 */}
          {focusRows.length > 0 && (
            <div className="space-y-3">
              {focusRows.map(({ name, placement }) => (
                <div key={name} className="flex items-start gap-3">
                  <GlyphBadge planet={name} sign={placement.sign} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-paper-900 dark:text-star-50">
                      {lang === "zh"
                        ? `组合${planetLabel(name, lang)}在${signLabel(placement.sign, lang)}`
                        : `Composite ${planetLabel(name, lang)} in ${placement.sign}`}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-paper-500 dark:text-star-400">
                      {lang === "zh"
                        ? FOCUS_MEANING[name].zh
                        : FOCUS_MEANING[name].en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 10 个中点落座：扁平分隔行，深链到 /wiki/{sign} */}
          <div className={focusRows.length > 0 ? "mt-8" : ""}>
            <h3 className="mb-3 font-serif text-lg font-bold text-paper-900 dark:text-star-50">
              {lang === "zh" ? "组合盘落座" : "Composite placements"}
            </h3>
            <PlacementList>
              {placements.map((p) => (
                <PlacementRow
                  key={p.name}
                  planet={p.name}
                  sign={p.sign}
                  label={planetLabel(p.name, lang)}
                  value={signLabel(p.sign, lang)}
                  detail={formatDegMin(p.degree)}
                  href={signHref(p.sign)}
                />
              ))}
            </PlacementList>
          </div>

          <ElementBalanceBar
            elements={balance.elements}
            modalities={balance.modalities}
            lang={lang}
            className="mt-8"
          />
        </ToolResultCard>
      )}

      <p className="mt-8 text-sm leading-relaxed text-paper-600 dark:text-star-200">
        {lang === "zh"
          ? "组合盘把两张星盘的中点合成一张，象征关系本身的样貌——它是反思的镜子，不是对关系结果的预测。名字只留在你的设备上，不会上传。想看两人之间的相位连接，可用合盘计算器。"
          : "A composite chart merges the midpoints of two charts into one, symbolising the relationship itself — a mirror for reflection, not a prediction of how it will unfold. Names stay on your device and are never uploaded. To see the aspects between two people, try the synastry calculator."}
      </p>
    </ToolPageShell>
  );
};

export default CompositeCalculator;
