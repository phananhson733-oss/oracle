// INPUT: CalculatorConfig（每个计算器的 compute/copy/needsTime）、useLanguage/useTheme、useCityAutocomplete、
//        DateSelectGroup、services/apiClient（searchCities）、services/analytics（trackEvent）。
// OUTPUT: 配置驱动的出生数据计算器外壳——出生日期(+可选时间/城市)表单 → config.compute(birth) → 结果卡。
//         所有 sign 类计算器(Moon Sign / Rising / Big Three / Birth Chart …)复用此壳，仅传不同 config。
// POS: 计算器矩阵(#9-14 / D)共享脚手架。匿名计算(fetchNatalChart skipCache→不缓存明文出生数据，隐私红线 #2)。
//      静态 SEO 正文在 scripts/generate-seo-pages.mjs 的 stub 里，本组件水合后接管交互。若更新此文件，务必更新 calculators/FOLDER.md。

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Language } from "../../types";
import { useLanguage, useTheme } from "../UIComponents";
import { useCityAutocomplete } from "../../hooks/useCityAutocomplete";
import { DateSelectGroup } from "../forms/DateSelectGroup";
import { searchCities } from "../../services/apiClient";
import { trackEvent } from "../../services/analytics";

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

// compute 的返回：展示就绪的结果（外壳不懂占星，只渲染）。
export interface CalculatorResult {
  headline: string; // 主结论，如 "Your Moon is in Cancer"
  items?: Array<{ label: string; value: string }>; // 可选明细行（Big Three 用）
  body?: string; // 一段中性解读
}

export interface CalculatorCopy {
  title: string;
  subtitle: string;
  submit: string;
}

export interface CalculatorConfig {
  idPrefix: string;
  needsTime: boolean; // 上升/宫位敏感的计算器需要出生时间
  event: string; // analytics 事件名
  copy: { en: CalculatorCopy; zh: CalculatorCopy };
  // 从出生数据算出展示结果；抛错则进 error 态。
  compute: (
    birth: CalculatorBirth,
    lang: Language,
  ) => Promise<CalculatorResult>;
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const lang: Language = language === "zh" ? "zh" : "en";
  const c = config.copy[lang];

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

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

  const cardBg = isDark ? "bg-space-900/60" : "bg-white";
  const cardBorder = isDark ? "border-gold-500/20" : "border-paper-300";
  const textPrimary = isDark ? "text-star-50" : "text-paper-900";
  const textSecondary = isDark ? "text-star-200" : "text-paper-600";
  const inputBg = isDark ? "bg-space-800" : "bg-paper-50";
  const inputText = isDark ? "text-star-50" : "text-paper-900";
  const inputBorder = isDark ? "border-gold-500/20" : "border-paper-300";
  const optional = lang === "zh" ? "可选" : "optional";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${textPrimary}`}>
          {c.title}
        </h1>
        <p className={`text-lg ${textSecondary}`}>{c.subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`${cardBg} border ${cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
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
          className="w-full rounded-lg bg-gold-500 py-3 font-semibold text-space-950 hover:bg-gold-400 disabled:opacity-60 min-h-[44px]"
        >
          {state === "loading"
            ? lang === "zh"
              ? "计算中…"
              : "Calculating…"
            : c.submit}
        </button>
      </form>

      {state === "error" && (
        <div className="mb-8 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center">
          <p className={textPrimary}>{errorMessage}</p>
        </div>
      )}

      {state === "result" && result && (
        <div
          ref={resultRef}
          tabIndex={-1}
          className={`${cardBg} border ${cardBorder} rounded-xl p-6 sm:p-8 outline-none`}
        >
          <h2 className={`text-2xl font-bold mb-3 ${textPrimary}`}>
            {result.headline}
          </h2>
          {result.items && result.items.length > 0 && (
            <ul className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {result.items.map((it) => (
                <li
                  key={it.label}
                  className={`rounded-lg border ${cardBorder} p-3 text-center`}
                >
                  <div
                    className={`text-xs uppercase tracking-wide ${textSecondary}`}
                  >
                    {it.label}
                  </div>
                  <div className={`mt-1 font-semibold ${textPrimary}`}>
                    {it.value}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {result.body && (
            <p className={`leading-relaxed ${textSecondary}`}>{result.body}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BirthDataCalculator;
