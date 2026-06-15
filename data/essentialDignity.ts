// INPUT: 行星英文名（Sun/Moon/...）与星座英文名（Aries/...，对齐 TECH_DATA 与 PlanetPosition）。
// OUTPUT: getEssentialDignity(planet, sign) -> 'domicile'|'exaltation'|'detriment'|'fall'|null + DIGNITY_LABEL 双语标签。
// POS: 古典 + 现代行星的必然尊贵（庙旺落陷）查表，供星盘分享卡行星表标注。若更新此文件，务必更新本头注释与所属 FOLDER.md。

export type Dignity = "domicile" | "exaltation" | "detriment" | "fall";

// 庙（本位）：行星入主星座（古典七星 + 现代三星现代守护）。
const DOMICILE: Record<string, string[]> = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mercury: ["Gemini", "Virgo"],
  Venus: ["Taurus", "Libra"],
  Mars: ["Aries", "Scorpio"],
  Jupiter: ["Sagittarius", "Pisces"],
  Saturn: ["Capricorn", "Aquarius"],
  Uranus: ["Aquarius"],
  Neptune: ["Pisces"],
  Pluto: ["Scorpio"],
};

// 旺（得势）：古典七星的旺宫（现代三星旺位有争议，从略）。
const EXALTATION: Record<string, string[]> = {
  Sun: ["Aries"],
  Moon: ["Taurus"],
  Mercury: ["Virgo"],
  Venus: ["Pisces"],
  Mars: ["Capricorn"],
  Jupiter: ["Cancer"],
  Saturn: ["Libra"],
};

// 对宫表：陷=庙的对宫、落=旺的对宫。
const OPPOSITE: Record<string, string> = {
  Aries: "Libra",
  Taurus: "Scorpio",
  Gemini: "Sagittarius",
  Cancer: "Capricorn",
  Leo: "Aquarius",
  Virgo: "Pisces",
  Libra: "Aries",
  Scorpio: "Taurus",
  Sagittarius: "Gemini",
  Capricorn: "Cancer",
  Aquarius: "Leo",
  Pisces: "Virgo",
};

/**
 * 计算行星在某星座的必然尊贵（庙旺落陷）。无则返回 null（peregrine，分享卡留空）。
 * 优先级：庙 > 旺 > 陷 > 落（同宫不会同时命中多类）。
 */
export const getEssentialDignity = (
  planet: string,
  sign: string,
): Dignity | null => {
  if (DOMICILE[planet]?.includes(sign)) return "domicile";
  if (EXALTATION[planet]?.includes(sign)) return "exaltation";
  if (DOMICILE[planet]?.some((s) => OPPOSITE[s] === sign)) return "detriment";
  if (EXALTATION[planet]?.some((s) => OPPOSITE[s] === sign)) return "fall";
  return null;
};

export const DIGNITY_LABEL: Record<Dignity, { zh: string; en: string }> = {
  domicile: { zh: "本位", en: "Domicile" },
  exaltation: { zh: "得势", en: "Exaltation" },
  detriment: { zh: "失势", en: "Detriment" },
  fall: { zh: "落陷", en: "Fall" },
};
