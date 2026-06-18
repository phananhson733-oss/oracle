// INPUT: React、useLanguage（UIComponents）、useCalculatorTheme、EmbedCodeBox、react-router-dom（Link）、
//        sunSign（sunSignFromDate/signElement/signModality）、celebrities（celebritiesBySign/CELEBRITIES/FIELD_LABELS）。
// OUTPUT: Celebrity Astro Twins 计算器——出生月/日 → 太阳星座 → 同星座名人 + 同元素名人；cusp 日引导到完整星盘。
// POS: 计算器矩阵（D）名人配对工具，路由 /:lang/celebrity-twins。纯客户端（无后端、无 PII、无出生数据存储）；
//      仅用出生日期判定太阳星座，名人仅用公开出生日期。文案中性、非命运断言。若更新此文件，务必更新 calculators/FOLDER.md。

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Language } from "../../types";
import { useLanguage } from "../UIComponents";
import { useCalculatorTheme } from "./useCalculatorTheme";
import { EmbedCodeBox } from "./embed";
import {
  sunSignFromDate,
  signElement,
  signModality,
  ZODIAC,
  type ZodiacSign,
  type Element,
  type Modality,
} from "./sunSign";
import {
  celebritiesBySign,
  CELEBRITIES,
  FIELD_LABELS,
  type Celebrity,
} from "./celebrities";

const SIGN_LABEL: Record<ZodiacSign, { en: string; zh: string }> = {
  Aries: { en: "Aries", zh: "白羊座" },
  Taurus: { en: "Taurus", zh: "金牛座" },
  Gemini: { en: "Gemini", zh: "双子座" },
  Cancer: { en: "Cancer", zh: "巨蟹座" },
  Leo: { en: "Leo", zh: "狮子座" },
  Virgo: { en: "Virgo", zh: "处女座" },
  Libra: { en: "Libra", zh: "天秤座" },
  Scorpio: { en: "Scorpio", zh: "天蝎座" },
  Sagittarius: { en: "Sagittarius", zh: "射手座" },
  Capricorn: { en: "Capricorn", zh: "摩羯座" },
  Aquarius: { en: "Aquarius", zh: "水瓶座" },
  Pisces: { en: "Pisces", zh: "双鱼座" },
};

const ELEMENT_LABEL: Record<Element, { en: string; zh: string }> = {
  fire: { en: "Fire", zh: "火象" },
  earth: { en: "Earth", zh: "土象" },
  air: { en: "Air", zh: "风象" },
  water: { en: "Water", zh: "水象" },
};

const MODALITY_LABEL: Record<Modality, { en: string; zh: string }> = {
  cardinal: { en: "Cardinal", zh: "基本" },
  fixed: { en: "Fixed", zh: "固定" },
  mutable: { en: "Mutable", zh: "变动" },
};

// 中性星座原型——"倾向 / 常被联系到"措辞，无命运断言（撞 AI 安全红线 NO_FATE_CERTAINTY）。
const SIGN_BLURB: Record<ZodiacSign, { en: string; zh: string }> = {
  Aries: {
    en: "Aries is often associated with initiative and a direct, pioneering streak.",
    zh: "白羊座常被联系到行动力，以及直接、开拓的一面。",
  },
  Taurus: {
    en: "Taurus is often associated with steadiness, the senses, and a love of comfort.",
    zh: "金牛座常被联系到稳定、感官体验与对舒适的偏好。",
  },
  Gemini: {
    en: "Gemini is often associated with curiosity, conversation, and quick wit.",
    zh: "双子座常被联系到好奇心、表达欲与敏捷的思维。",
  },
  Cancer: {
    en: "Cancer is often associated with care, memory, and a strong sense of home.",
    zh: "巨蟹座常被联系到关怀、记忆，以及对家的归属感。",
  },
  Leo: {
    en: "Leo is often associated with warmth, creativity, and a flair for expression.",
    zh: "狮子座常被联系到热情、创造力与表达的天赋。",
  },
  Virgo: {
    en: "Virgo is often associated with attention to detail, craft, and a wish to be useful.",
    zh: "处女座常被联系到对细节的关注、对技艺的打磨与务实的心意。",
  },
  Libra: {
    en: "Libra is often associated with balance, fairness, and a feel for relationships.",
    zh: "天秤座常被联系到平衡、公正，以及对关系的敏感。",
  },
  Scorpio: {
    en: "Scorpio is often associated with depth, focus, and a taste for the meaningful.",
    zh: "天蝎座常被联系到深度、专注，以及对深刻事物的偏好。",
  },
  Sagittarius: {
    en: "Sagittarius is often associated with exploration, optimism, and big-picture thinking.",
    zh: "射手座常被联系到探索、乐观与宏观的思考。",
  },
  Capricorn: {
    en: "Capricorn is often associated with discipline, patience, and long-term goals.",
    zh: "摩羯座常被联系到自律、耐心与长期目标。",
  },
  Aquarius: {
    en: "Aquarius is often associated with originality, ideas, and a humanitarian streak.",
    zh: "水瓶座常被联系到独创性、理念，以及关怀群体的一面。",
  },
  Pisces: {
    en: "Pisces is often associated with imagination, empathy, and a dreamy sensibility.",
    zh: "双鱼座常被联系到想象力、共情，以及富有诗意的感受力。",
  },
};

const MONTHS: Array<{ en: string; zh: string }> = [
  { en: "January", zh: "1月" },
  { en: "February", zh: "2月" },
  { en: "March", zh: "3月" },
  { en: "April", zh: "4月" },
  { en: "May", zh: "5月" },
  { en: "June", zh: "6月" },
  { en: "July", zh: "7月" },
  { en: "August", zh: "8月" },
  { en: "September", zh: "9月" },
  { en: "October", zh: "10月" },
  { en: "November", zh: "11月" },
  { en: "December", zh: "12月" },
];

const MONTH_ABBR_EN = [
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

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function formatBirthday(c: Celebrity, lang: Language): string {
  if (lang === "zh") {
    return `${c.birthYear}年${c.birthMonth}月${c.birthDay}日`;
  }
  return `${MONTH_ABBR_EN[c.birthMonth - 1]} ${c.birthDay}, ${c.birthYear}`;
}

export const CelebrityTwinsTool: React.FC = () => {
  const { language } = useLanguage();
  const lang: Language = language === "zh" ? "zh" : "en";
  const th = useCalculatorTheme();

  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  // 选定月份后把超出当月天数的日期回正。
  useEffect(() => {
    if (month !== "" && day !== "" && day > DAYS_IN_MONTH[month - 1]) {
      setDay(DAYS_IN_MONTH[month - 1]);
    }
  }, [month, day]);

  const result = useMemo(() => {
    if (month === "" || day === "") return null;
    const { sign, onCusp } = sunSignFromDate(month, day);
    const element = signElement(sign);
    const modality = signModality(sign);
    const twins = celebritiesBySign(sign);
    const elementMates = CELEBRITIES.filter(
      (c) => signElement(c.sign) === element && c.sign !== sign,
    ).slice(0, 8);
    return { sign, onCusp, element, modality, twins, elementMates };
  }, [month, day]);

  const dayOptions = useMemo(() => {
    const max = month === "" ? 31 : DAYS_IN_MONTH[month - 1];
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [month]);

  const renderCeleb = (c: Celebrity) => (
    <li
      key={c.name}
      className={`flex items-center justify-between gap-3 py-2.5 ${th.textPrimary}`}
    >
      <div className="min-w-0">
        <div className="font-medium truncate">{c.name}</div>
        <div className={`text-xs ${th.textSecondary}`}>
          {FIELD_LABELS[c.field][lang]} · {formatBirthday(c, lang)}
        </div>
      </div>
      <span
        className={`shrink-0 text-xs rounded-full border ${th.cardBorder} px-2.5 py-1 ${th.textSecondary}`}
      >
        {SIGN_LABEL[c.sign][lang]}
      </span>
    </li>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${th.textPrimary}`}>
          {lang === "zh" ? "名人星座配对" : "Celebrity Astro Twins"}
        </h1>
        <p className={`text-lg ${th.textSecondary}`}>
          {lang === "zh"
            ? "输入你的出生月日，看看哪些名人和你同一个太阳星座——只用公开的出生日期，无需出生时间。"
            : "Enter your birth month and day to see which famous figures share your Sun sign — from public birth dates, no birth time needed."}
        </p>
      </div>

      <div
        className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8 mb-8`}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="twins-month"
              className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
            >
              {lang === "zh" ? "出生月份" : "Birth month"}
            </label>
            <select
              id="twins-month"
              value={month}
              onChange={(e) =>
                setMonth(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            >
              <option value="">{lang === "zh" ? "选择月份" : "Month"}</option>
              {MONTHS.map((m, i) => (
                <option key={m.en} value={i + 1}>
                  {m[lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="twins-day"
              className={`block text-sm font-medium mb-1.5 ${th.textPrimary}`}
            >
              {lang === "zh" ? "出生日" : "Birth day"}
            </label>
            <select
              id="twins-day"
              value={day}
              onChange={(e) =>
                setDay(e.target.value === "" ? "" : Number(e.target.value))
              }
              className={`w-full px-4 py-3 rounded-lg border ${th.inputBorder} ${th.inputBg} ${th.inputText} focus:outline-none focus:ring-2 focus:ring-gold-500/50 min-h-[44px]`}
            >
              <option value="">{lang === "zh" ? "选择日期" : "Day"}</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-8" aria-live="polite" aria-atomic="true">
          <div
            className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8`}
          >
            <div className="text-center">
              <div
                className={`text-sm uppercase tracking-wide ${th.textSecondary}`}
              >
                {lang === "zh" ? "你的太阳星座" : "Your Sun sign"}
              </div>
              <div className="text-3xl font-bold text-gold-500 my-1">
                {SIGN_LABEL[result.sign][lang]}
              </div>
              <div className={`text-sm ${th.textSecondary}`}>
                {MODALITY_LABEL[result.modality][lang]}{" "}
                {ELEMENT_LABEL[result.element][lang]}
                {lang === "zh" ? "星座" : " sign"}
              </div>
            </div>
            <p
              className={`mt-4 text-sm leading-relaxed text-center ${th.textSecondary}`}
            >
              {SIGN_BLURB[result.sign][lang]}
            </p>
            {result.onCusp && (
              <p
                className={`mt-4 text-sm leading-relaxed rounded-lg border ${th.cardBorder} p-3 ${th.textSecondary}`}
              >
                {lang === "zh" ? (
                  <>
                    你的生日靠近星座边界。太阳过宫的精确时刻逐年不同，若你出生在交界附近，
                    太阳可能落在相邻星座。用{" "}
                    <Link
                      to={`/${lang}/birth-chart-calculator`}
                      className="text-gold-500 underline"
                    >
                      完整出生星盘计算器
                    </Link>{" "}
                    加上出生时间即可确认。
                  </>
                ) : (
                  <>
                    Your birthday falls near a sign boundary. The exact moment
                    the Sun changes sign shifts a little each year, so if you
                    were born close to the cusp your Sun could be in the
                    neighbouring sign. Confirm it with the{" "}
                    <Link
                      to={`/${lang}/birth-chart-calculator`}
                      className="text-gold-500 underline"
                    >
                      full birth chart calculator
                    </Link>
                    .
                  </>
                )}
              </p>
            )}
          </div>

          <div
            className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8`}
          >
            <h2 className={`text-lg font-semibold mb-1 ${th.textPrimary}`}>
              {lang === "zh"
                ? `与你同为${SIGN_LABEL[result.sign][lang]}的名人`
                : `Famous ${SIGN_LABEL[result.sign].en} figures`}
            </h2>
            <p className={`text-sm mb-3 ${th.textSecondary}`}>
              {lang === "zh"
                ? "他们和你共享同一个太阳星座。"
                : "These figures share your Sun sign."}
            </p>
            <ul className="divide-y divide-gold-500/10">
              {result.twins.map(renderCeleb)}
            </ul>
          </div>

          {result.elementMates.length > 0 && (
            <div
              className={`${th.cardBg} border ${th.cardBorder} rounded-xl p-6 sm:p-8`}
            >
              <h2 className={`text-lg font-semibold mb-1 ${th.textPrimary}`}>
                {lang === "zh"
                  ? `同为${ELEMENT_LABEL[result.element][lang]}星座的名人`
                  : `Others in your ${ELEMENT_LABEL[result.element].en} element`}
              </h2>
              <p className={`text-sm mb-3 ${th.textSecondary}`}>
                {lang === "zh"
                  ? "不同星座，但共享同一元素的能量基调。"
                  : "Different signs, but the same elemental temperament."}
              </p>
              <ul className="divide-y divide-gold-500/10">
                {result.elementMates.map(renderCeleb)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className={`text-lg font-semibold mb-2 ${th.textPrimary}`}>
          {lang === "zh"
            ? "太阳星座是怎么算的？"
            : "How is the Sun sign worked out?"}
        </h2>
        <p className={`text-sm leading-relaxed ${th.textSecondary}`}>
          {lang === "zh"
            ? "太阳星座只取决于你出生那天太阳所在的黄道星座，所以只需要出生日期就能判定，不需要出生时间。每个星座的日期段逐年会有约一天的浮动；若你的生日刚好在交界附近，用完整出生星盘加出生时间最稳妥。这是一个趣味与教育工具，星座描述是中性的倾向，不预测命运。"
            : "Your Sun sign depends only on which zodiac sign the Sun was in on the day you were born, so the date alone is enough — no birth time required. The date ranges shift by about a day from year to year, so if your birthday sits near a boundary, a full birth chart with a birth time is the surest check. This is a fun, educational tool; the descriptions are neutral tendencies, not predictions of destiny."}
        </p>
      </div>

      <EmbedCodeBox slug="celebrity-twins" />
    </div>
  );
};

export default CelebrityTwinsTool;
