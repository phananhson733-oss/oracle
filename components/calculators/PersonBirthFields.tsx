// INPUT: React、types（Language）、useCityAutocomplete、DateSelectGroup、services/apiClient（searchCities）、BirthDataCalculator（GeoResult）。
// OUTPUT: PersonBirthFields 单人出生字段子组件 + PersonState/FieldsTheme 类型 + emptyPerson/personToBirth 助手。
// POS: 关系类计算器（Synastry / Composite）共享的"一个人的出生表单"。姓名仅本地（隐私 #4）；
//      各实例独立持 useCityAutocomplete。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useCallback, useEffect, useState } from "react";
import type { Language } from "../../types";
import { useCityAutocomplete } from "../../hooks/useCityAutocomplete";
import { DateSelectGroup } from "../forms/DateSelectGroup";
import { searchCities } from "../../services/apiClient";
import type { CalculatorBirth, GeoResult } from "./BirthDataCalculator";

export const MONTH_FALLBACK_EN = [
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

export interface PersonState {
  name: string;
  date: string;
  time: string;
  city: GeoResult | null;
}

export const emptyPerson = (): PersonState => ({
  name: "",
  date: "",
  time: "",
  city: null,
});

// PersonState → 喂给 fetchNatalChart 的最小出生数据；日期或城市缺失返回 null（提交前校验）。
export const personToBirth = (p: PersonState): CalculatorBirth | null => {
  if (!p.date || !p.city) return null;
  return {
    birthDate: p.date,
    birthTime: p.time || undefined,
    birthCity: p.city.city,
    lat: p.city.lat,
    lon: p.city.lon,
    timezone: p.city.timezone,
    accuracyLevel: p.time ? "exact" : "time_unknown",
  };
};

export interface FieldsTheme {
  textPrimary: string;
  textSecondary: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  cardBg: string;
  cardBorder: string;
}

// 单人出生字段（姓名仅本地 + 日期 + 可选时间 + 城市自动完成）。任一变化即把快照上抛父组件。
export const PersonBirthFields: React.FC<{
  idPrefix: string;
  label: string;
  lang: Language;
  th: FieldsTheme;
  monthNames: string[];
  onChange: (p: PersonState) => void;
  // 默认时间为可选；置 true 时（如 astrocartography 需精确时刻）标为必填，去掉「可选」提示。
  timeRequired?: boolean;
}> = ({
  idPrefix,
  label,
  lang,
  th,
  monthNames,
  onChange,
  timeRequired = false,
}) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null);

  useEffect(() => {
    onChange({ name, date, time, city: selectedCity });
  }, [name, date, time, selectedCity, onChange]);

  const citySearch = useCallback(
    async (q: string): Promise<readonly GeoResult[]> => {
      try {
        const res = await searchCities(q, 5, lang);
        return (res?.cities as GeoResult[] | undefined) ?? [];
      } catch {
        return [];
      }
    },
    [lang],
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
    suggestions,
    isOpen,
    open,
    close,
    selectIndex,
    inputProps,
    listboxProps,
    getOptionProps,
  } = useCityAutocomplete<GeoResult>({
    query: cityQuery,
    search: citySearch,
    onSelect: handleCitySelect,
    minLength: 2,
    idPrefix: `${idPrefix}-city`,
  });

  return (
    <div
      className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-5 sm:p-6`}
    >
      <h3 className={`text-lg font-bold mb-4 ${th.textPrimary}`}>{label}</h3>

      <div className="mb-4">
        <label
          htmlFor={`${idPrefix}-name`}
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
        >
          {lang === "zh" ? "名字" : "Name"}{" "}
          <span className={`text-xs ${th.textSecondary}`}>
            (
            {lang === "zh"
              ? "可选，仅本地显示"
              : "optional, stays on your device"}
            )
          </span>
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={lang === "zh" ? "如 Alex" : "e.g. Alex"}
          className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        />
      </div>

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
          htmlFor={`${idPrefix}-date-month`}
        >
          {lang === "zh" ? "出生日期" : "Birth Date"}{" "}
          <span className="text-red-400">*</span>
        </label>
        <DateSelectGroup
          value={date}
          onChange={setDate}
          idPrefix={idPrefix}
          required
          monthNames={monthNames}
          className="grid grid-cols-[1.4fr_1fr_1fr] gap-2"
          selectClassName={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
          labels={{ groupLabel: lang === "zh" ? "出生日期" : "Birth Date" }}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor={`${idPrefix}-time`}
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
        >
          {lang === "zh" ? "出生时间" : "Birth Time"}{" "}
          {timeRequired ? (
            <span className="text-rose-500">*</span>
          ) : (
            <span className={`text-xs ${th.textSecondary}`}>
              ({lang === "zh" ? "可选" : "optional"})
            </span>
          )}
        </label>
        <input
          id={`${idPrefix}-time`}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        />
      </div>

      <div className="relative">
        <label
          htmlFor={`${idPrefix}-city`}
          className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
        >
          {lang === "zh" ? "出生城市" : "Birth City"}{" "}
          <span className="text-red-400">*</span>
        </label>
        <input
          id={`${idPrefix}-city`}
          type="text"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setSelectedCity(null);
            open();
          }}
          onFocus={open}
          onBlur={() => setTimeout(close, 200)}
          placeholder={
            lang === "zh"
              ? "如 北京、纽约、伦敦"
              : "e.g. New York, London, Tokyo"
          }
          autoComplete="off"
          {...inputProps}
          className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
        />
        {isOpen && suggestions.length > 0 && (
          <ul
            {...listboxProps}
            className={`absolute z-10 w-full mt-1 ${th.cardBg} border ${th.cardBorder} rounded-lg shadow-lg max-h-48 overflow-y-auto`}
          >
            {suggestions.map((city, i) => {
              const optionProps = getOptionProps(i);
              const isActive = optionProps["aria-selected"];
              return (
                <li
                  key={`${city.city}-${city.lat}-${city.lon}`}
                  {...optionProps}
                  className={`px-4 py-2.5 cursor-pointer ${
                    isActive ? "bg-gold-500/20" : "hover:bg-gold-500/10"
                  } ${th.textPrimary} min-h-[44px] flex items-center`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    selectIndex(i);
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
    </div>
  );
};

export default PersonBirthFields;
