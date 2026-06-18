// INPUT: types（Language）。纯展示工具，无 IO。
// OUTPUT: 天象工具的文字化显示助手——星座/行星中英名映射、度数（度·分）格式化。
// POS: 计算器矩阵（D）天象工具共享展示层。刻意用文字名而非占星 Unicode 符号——
//      运行时 zh locale 会把 ☉♀☿ 等字形回退成彩色 emoji（见 memory）。若更新此文件，务必更新 calculators/FOLDER.md。

import type { Language } from "../../types";

export const SIGN_ZH: Record<string, string> = {
  Aries: "白羊",
  Taurus: "金牛",
  Gemini: "双子",
  Cancer: "巨蟹",
  Leo: "狮子",
  Virgo: "处女",
  Libra: "天秤",
  Scorpio: "天蝎",
  Sagittarius: "射手",
  Capricorn: "摩羯",
  Aquarius: "水瓶",
  Pisces: "双鱼",
};

export const PLANET_ZH: Record<string, string> = {
  Sun: "太阳",
  Moon: "月亮",
  Mercury: "水星",
  Venus: "金星",
  Mars: "火星",
  Jupiter: "木星",
  Saturn: "土星",
  Uranus: "天王星",
  Neptune: "海王星",
  Pluto: "冥王星",
};

export const SIGN_ABBR: Record<string, string> = {
  Aries: "Ari",
  Taurus: "Tau",
  Gemini: "Gem",
  Cancer: "Can",
  Leo: "Leo",
  Virgo: "Vir",
  Libra: "Lib",
  Scorpio: "Sco",
  Sagittarius: "Sag",
  Capricorn: "Cap",
  Aquarius: "Aqu",
  Pisces: "Pis",
};

export const signLabel = (sign: string, lang: Language): string =>
  lang === "zh" ? `${SIGN_ZH[sign] ?? sign}座` : sign;

// 表格紧凑用：英文 3 字母缩写，中文用 2 字 SIGN_ZH（不带「座」）。
export const signAbbr = (sign: string, lang: Language): string =>
  lang === "zh" ? (SIGN_ZH[sign] ?? sign) : (SIGN_ABBR[sign] ?? sign);

export const planetLabel = (name: string, lang: Language): string =>
  lang === "zh" ? (PLANET_ZH[name] ?? name) : name;

// 把座内度数（0..29.999）格式化成占星惯用的「度·分」，如 27.5 → "27°30'"。
export const formatDegMin = (degree: number): string => {
  const safe = Number.isFinite(degree)
    ? Math.max(0, Math.min(29.999, degree))
    : 0;
  const deg = Math.floor(safe);
  let min = Math.round((safe - deg) * 60);
  let outDeg = deg;
  if (min >= 60) {
    min = 0;
    outDeg += 1;
  }
  return `${outDeg}°${min.toString().padStart(2, "0")}'`;
};
