// INPUT: CalculatorConfig（每个计算器的 compute/copy/needsTime）、useLanguage、useCalculatorTheme、useCityAutocomplete、
//        DateSelectGroup、services/apiClient（searchCities）、services/analytics（trackEvent）、
//        共享原语 ToolPageShell / ToolResultCard / PlacementList / ElementBalanceBar / ToolFunnelCTA / GlyphBadge。
// OUTPUT: 配置驱动的出生数据计算器外壳——出生日期(+可选时间/城市)表单 → config.compute(birth)
//         → 品牌化富结果卡；Birth Chart 可切到专用数据结果页（轮盘/行星/相位/宫位，数据展示，无 AI 解读）。
//         所有 sign 类计算器(Moon Sign / Rising / Big Three / Birth Chart …)复用此壳，仅传不同 config。
// POS: 计算器矩阵(D)共享脚手架。匿名计算(fetchNatalChart skipCache→不缓存明文出生数据，隐私红线 #2)。
//      静态 SEO 正文在 scripts/generate-seo-pages.mjs 的 stub 里，本组件水合后接管交互。若更新此文件，务必更新 calculators/FOLDER.md。

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ExtendedNatalData, Language, UserProfile } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { useCityAutocomplete } from "../../hooks/useCityAutocomplete";
import { DateSelectGroup } from "../forms/DateSelectGroup";
import { searchCities } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";
import { ToolPageShell } from "./ToolPageShell";
import { ToolResultCard, PlacementList, PlacementRow } from "./ToolResultCard";
import { GlyphBadge } from "./GlyphBadge";
import { ElementBalanceBar } from "./ElementBalanceBar";
import type { ElementCounts, ModalityCounts } from "./ElementBalanceBar";
import { ToolFunnelCTA } from "./ToolFunnelCTA";
import type { OnboardingPrefill, FunnelSecondaryLink } from "./ToolFunnelCTA";
import { BirthChartResultView } from "./BirthChartResultView";

export interface GeoResult {
  city: string;
  admin1?: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
}

// 计算器需要的最小出生数据（喂给 fetchNatalChart）。城市+坐标必填（后端 /natal/chart 要求城市或坐标，
// 见 birthInput CITY_REQUIRED）；提交前已在 handleSubmit 校验选定城市，故此处非可选。accuracyLevel 用后端已知值。
export interface CalculatorBirth {
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  lat: number;
  lon: number;
  timezone: string;
  accuracyLevel: "exact" | "time_unknown";
}

// 富结果里的单条行星/角度落座（外壳渲染为 PlacementRow：字形 + 标签 + 度数 + 逆行 + wiki 链接）。
export interface CalculatorPlacement {
  planet?: string; // 字形 + 默认标签（英文体名，如 "Sun" / "Ascendant"）
  sign: string; // 英文星座名（用于字形）
  label: string; // 本地化标签
  value: string; // 本地化星座展示值
  degree?: number;
  minute?: number;
  house?: number;
  retrograde?: boolean;
  href?: string; // wiki 深链（裸路径，shell 内 langPath）
}

// 结果区导流配置（外壳渲染为 ToolFunnelCTA）。
export interface CalculatorFunnel {
  label: string;
  href?: string;
  prefill?: OnboardingPrefill;
  secondaryLinks?: FunnelSecondaryLink[];
  note?: string;
  sign?: string; // categorical sign，仅供 analytics（隐私安全）
}

export interface BirthChartWheelPoint extends CalculatorPlacement {
  name: string;
  longitude: number;
}

export interface BirthChartAspectDatum {
  planet1: string;
  planet2: string;
  planet1Label: string;
  planet2Label: string;
  type: string;
  typeLabel: string;
  orb: number;
  isApplying: boolean;
}

export interface BirthChartHouseDatum {
  number: number;
  title: string;
  cusp?: BirthChartWheelPoint;
  occupants: BirthChartWheelPoint[];
}

export interface BirthChartMoonPhaseDatum {
  name: string;
  label: string;
  angle: number;
  age: number;
  illumination: number;
}

export interface BirthChartSignatureDatum {
  label: string;
  value: string;
}

export interface BirthChartDetails {
  birth: {
    date: string;
    time?: string;
    city: string;
    timezone: string;
    lat: number;
    lon: number;
    houseSystem: string;
    zodiac: string;
  };
  profile: UserProfile;
  technical: ExtendedNatalData;
  core: BirthChartWheelPoint[];
  planets: BirthChartWheelPoint[];
  points: BirthChartWheelPoint[];
  wheelPoints: BirthChartWheelPoint[];
  aspects: BirthChartAspectDatum[];
  houses: BirthChartHouseDatum[];
  moonPhase?: BirthChartMoonPhaseDatum;
  signature: BirthChartSignatureDatum[];
  houseCusps: number[];
}

// compute 的返回：展示就绪的结果（外壳不懂占星，只渲染）。
export interface CalculatorResult {
  headline: string; // 主结论，如 "Your Moon is in Cancer"
  items?: Array<{ label: string; value: string }>; // 旧版简单明细行（向后兼容）
  placements?: CalculatorPlacement[]; // 富落座行（优先于 items 渲染）
  dominance?: { elements: ElementCounts; modalities?: ModalityCounts };
  heroGlyph?: { planet?: string; sign?: string }; // 单一落座工具的 hero 字形
  funnel?: CalculatorFunnel; // 导流 CTA
  body?: string; // 一段中性解读
  birthChart?: BirthChartDetails; // Birth Chart 专用数据结果页（仅结构化数据，无 AI 解读）
}

export interface CalculatorCopy {
  title: string;
  subtitle: string;
  submit: string;
}

export interface CalculatorConfig {
  idPrefix: string;
  slug: string; // 公开路由 slug（用于 embed iframe 代码 + canonical 回链）
  needsTime: boolean; // 上升/宫位敏感的计算器需要出生时间
  event: string; // analytics 事件名
  copy: { en: CalculatorCopy; zh: CalculatorCopy };
  // 从出生数据算出展示结果；抛错则进 error 态。
  compute: (
    birth: CalculatorBirth,
    lang: Language,
  ) => Promise<CalculatorResult>;
}

// 把计算器内部出生数据映射为 onboarding prefill envelope（与 BirthChartSection 一致）。
export function birthToPrefill(birth: CalculatorBirth): OnboardingPrefill {
  return {
    birthDate: birth.birthDate,
    birthTime: birth.birthTime,
    birthCity: birth.birthCity,
    lat: birth.lat,
    lon: birth.lon,
    timezone: birth.timezone,
    accuracyLevel: birth.accuracyLevel,
  };
}

const MONTH_FALLBACK_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type State = "idle" | "loading" | "result" | "error";

export const BirthDataCalculator: React.FC<{ config: CalculatorConfig }> = ({
  config,
}) => {
  const { t, language } = useLanguage();
  const th = useCalculatorTheme();
  const {
    isDark,
    cardBg,
    cardBorder,
    textPrimary,
    textSecondary,
    inputBg,
    inputText,
    inputBorder,
  } = th;
  const lang: Language = language === "zh" ? "zh" : "en";
  const c = config.copy[lang];

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null);
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [dateError, setDateError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const monthNames = useMemo<string[]>(() => {
    const tRecord = t as unknown as Record<string, unknown>;
    const keys = [
      "month_jan",
      "month_feb",
      "month_mar",
      "month_apr",
      "month_may",
      "month_jun",
      "month_jul",
      "month_aug",
      "month_sep",
      "month_oct",
      "month_nov",
      "month_dec",
    ];
    return keys.map((k, i) => {
      const v = tRecord[k];
      return typeof v === "string" && v.length > 0 ? v : MONTH_FALLBACK_EN[i];
    });
  }, [t]);

  const citySearch = useCallback(
    async (q: string): Promise<readonly GeoResult[]> => {
      try {
        const res = await searchCities(q, 5, language);
        return (res?.cities as GeoResult[] | undefined) ?? [];
      } catch {
        return [];
      }
    },
    [language],
  );
  const handleCitySelect = useCallback((city: GeoResult) => {
    setSelectedCity(city);
    setCityQuery(
      city.admin1
        ? `${city.city}, ${city.admin1}, ${city.country}`
        : `${city.city}, ${city.country}`,
    );
  }, []);
  const {
    suggestions: citySuggestions,
    isOpen: showSuggestions,
    open: openSuggestions,
    close: closeSuggestions,
    selectIndex: selectCityIndex,
    inputProps: cityInputProps,
    listboxProps: cityListboxProps,
    getOptionProps: getCityOptionProps,
  } = useCityAutocomplete<GeoResult>({
    query: cityQuery,
    search: citySearch,
    onSelect: handleCitySelect,
    minLength: 2,
    idPrefix: `${config.idPrefix}-city`,
  });

  const validateDate = (value: string): boolean => {
    if (!value) {
      setDateError(
        lang === "zh" ? "请输入出生日期" : "Please enter your birth date",
      );
      return false;
    }
    const d = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) {
      setDateError(lang === "zh" ? "日期无效" : "Invalid date");
      return false;
    }
    if (d > new Date()) {
      setDateError(
        lang === "zh"
          ? "出生日期不能晚于今天"
          : "Birth date cannot be in the future",
      );
      return false;
    }
    setDateError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDate(birthDate)) return;
    // 后端 /natal/chart 要求城市或坐标（birthInput CITY_REQUIRED）；选一个城市再算，否则 400。
    if (!selectedCity) {
      setErrorMessage(
        lang === "zh"
          ? "请从下拉中选择出生城市"
          : "Please pick your birth city from the list",
      );
      setState("error");
      return;
    }
    // needsTime 的计算器（上升/日月升）必须有出生时间，否则上升/宫位无意义。
    if (config.needsTime && !birthTime) {
      setErrorMessage(
        lang === "zh"
          ? "该计算器需要精确出生时间"
          : "This calculator needs an exact birth time",
      );
      setState("error");
      return;
    }
    setState("loading");
    setErrorMessage("");
    const birth: CalculatorBirth = {
      birthDate,
      birthTime: birthTime || undefined,
      birthCity: selectedCity.city,
      lat: selectedCity.lat,
      lon: selectedCity.lon,
      timezone: selectedCity.timezone,
      accuracyLevel: birthTime ? "exact" : "time_unknown",
    };
    try {
      const data = await config.compute(birth, lang);
      setResult(data);
      setState("result");
      trackEvent(config.event, {
        has_time: !!birthTime,
        has_city: !!selectedCity,
      });
      setTimeout(() => {
        resultRef.current?.focus();
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : lang === "zh"
            ? "出了点问题，请重试。"
            : "Something went wrong. Please try again.",
      );
      setState("error");
    }
  };

  const optional = lang === "zh" ? "可选" : "optional";

  const formatDetail = (p: CalculatorPlacement): string | undefined => {
    if (p.degree === undefined) return undefined;
    const deg = Math.floor(p.degree);
    const min =
      p.minute !== undefined ? p.minute : Math.round((p.degree - deg) * 60);
    const base = `${deg}°${String(min).padStart(2, "0")}'`;
    return p.house ? `${base} · H${p.house}` : base;
  };

  return (
    <ToolPageShell title={c.title} subtitle={c.subtitle} slug={config.slug}>
      <form
        onSubmit={handleSubmit}
        className={`${cardBg} border ${cardBorder} rounded-2xl p-6 sm:p-8 mb-8 transition-all duration-300 ease-in-out`}
        noValidate
      >
        <div className="mb-5">
          <label
            htmlFor={`${config.idPrefix}-date-month`}
            className={`block text-sm font-medium mb-1.5 ${textPrimary}`}
          >
            {lang === "zh" ? "出生日期" : "Birth Date"}{" "}
            <span className="text-red-400">*</span>
          </label>
          <DateSelectGroup
            value={birthDate}
            onChange={(iso) => {
              setBirthDate(iso);
              if (dateError) validateDate(iso);
            }}
            idPrefix={config.idPrefix}
            required
            monthNames={monthNames}
            className="grid grid-cols-[1.4fr_1fr_1fr] gap-2"
            selectClassName={`w-full px-4 py-3 rounded-lg border ${
              dateError ? "border-red-400" : inputBorder
            } ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            labels={{ groupLabel: lang === "zh" ? "出生日期" : "Birth Date" }}
          />
          {dateError && (
            <p className="mt-1 text-sm text-red-400" role="alert">
              {dateError}
            </p>
          )}
        </div>

        <div className="mb-5">
          <label
            htmlFor={`${config.idPrefix}-time`}
            className={`block text-sm font-medium mb-1.5 ${textPrimary}`}
          >
            {lang === "zh" ? "出生时间" : "Birth Time"}{" "}
            <span className={`text-xs ${textSecondary}`}>
              (
              {config.needsTime
                ? lang === "zh"
                  ? "上升星座需要"
                  : "needed for rising"
                : optional}
              )
            </span>
          </label>
          <input
            id={`${config.idPrefix}-time`}
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${inputBorder} ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
          />
          {config.needsTime && (
            <p className={`mt-1 text-xs ${textSecondary}`}>
              {lang === "zh"
                ? "上升/宫位依赖精确出生时间，未填则结果近似。"
                : "Rising/houses depend on an exact birth time; results are approximate without it."}
            </p>
          )}
        </div>

        <div className="mb-6 relative">
          <label
            htmlFor={`${config.idPrefix}-city`}
            className={`block text-sm font-medium mb-1.5 ${textPrimary}`}
          >
            {lang === "zh" ? "出生城市" : "Birth City"}{" "}
            <span className="text-red-400">*</span>
          </label>
          <input
            id={`${config.idPrefix}-city`}
            type="text"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setSelectedCity(null);
              openSuggestions();
            }}
            onFocus={openSuggestions}
            onBlur={() => setTimeout(closeSuggestions, 200)}
            placeholder={
              lang === "zh"
                ? "如 北京、纽约、伦敦"
                : "e.g. New York, London, Tokyo"
            }
            autoComplete="off"
            {...cityInputProps}
            className={`w-full px-4 py-3 rounded-lg border ${inputBorder} ${inputBg} ${inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
          />
          {showSuggestions && citySuggestions.length > 0 && (
            <ul
              {...cityListboxProps}
              className={`absolute z-10 w-full mt-1 ${cardBg} border ${cardBorder} rounded-lg shadow-lg max-h-48 overflow-y-auto`}
            >
              {citySuggestions.map((city, i) => {
                const optionProps = getCityOptionProps(i);
                const isActive = optionProps["aria-selected"];
                return (
                  <li
                    key={`${city.city}-${city.lat}-${city.lon}`}
                    {...optionProps}
                    className={`px-4 py-2.5 cursor-pointer ${
                      isActive ? "bg-gold-500/20" : "hover:bg-gold-500/10"
                    } ${textPrimary} min-h-[44px] flex items-center`}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      selectCityIndex(i);
                    }}
                  >
                    {city.admin1
                      ? `${city.city}, ${city.admin1}, ${city.country}`
                      : `${city.city}, ${city.country}`}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full rounded-xl bg-gradient-primary py-3 font-semibold text-space-950 shadow-glow transition-all duration-300 ease-in-out hover:opacity-95 disabled:opacity-60 min-h-[44px] motion-reduce:transition-none"
        >
          {state === "loading"
            ? lang === "zh"
              ? "计算中…"
              : "Calculating…"
            : c.submit}
        </button>
      </form>

      {state === "error" && (
        <div className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={textPrimary}>{errorMessage}</p>
        </div>
      )}

      {state === "result" && result?.birthChart ? (
        <BirthChartResultView
          innerRef={resultRef}
          tabIndex={-1}
          result={result}
          lang={lang}
          tool={config.slug}
        />
      ) : state === "result" && result ? (
        <ToolResultCard
          innerRef={resultRef}
          tabIndex={-1}
          hero={
            result.heroGlyph ? (
              <GlyphBadge
                planet={result.heroGlyph.planet}
                sign={result.heroGlyph.sign}
                size="hero"
              />
            ) : undefined
          }
          headline={result.headline}
          footer={
            result.funnel ? (
              <ToolFunnelCTA
                tool={config.slug}
                label={result.funnel.label}
                href={result.funnel.href}
                prefill={result.funnel.prefill}
                secondaryLinks={result.funnel.secondaryLinks}
                note={result.funnel.note}
                sign={result.funnel.sign}
              />
            ) : undefined
          }
        >
          {result.placements && result.placements.length > 0 ? (
            <PlacementList>
              {result.placements.map((p) => (
                <PlacementRow
                  key={p.label}
                  planet={p.planet}
                  sign={p.sign}
                  label={p.label}
                  value={p.value}
                  detail={formatDetail(p)}
                  retrograde={p.retrograde}
                  retrogradeLabel={lang === "zh" ? "逆" : "Rx"}
                  href={p.href}
                />
              ))}
            </PlacementList>
          ) : result.items && result.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {result.items.map((it) => (
                <div key={it.label} className="text-center">
                  <div
                    className={`text-xs uppercase tracking-wide ${textSecondary}`}
                  >
                    {it.label}
                  </div>
                  <div className={`mt-1 font-semibold ${textPrimary}`}>
                    {it.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {result.dominance && (
            <ElementBalanceBar
              elements={result.dominance.elements}
              modalities={result.dominance.modalities}
              lang={lang}
              className="mt-6"
            />
          )}

          {result.body && (
            <p className={`mt-6 leading-relaxed ${textSecondary}`}>
              {result.body}
            </p>
          )}
        </ToolResultCard>
      ) : null}
    </ToolPageShell>
  );
};

export default BirthDataCalculator;
