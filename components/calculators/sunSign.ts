// INPUT: 无（纯函数 + 常量）。
// OUTPUT: 太阳星座引擎——sunSignFromDate（按 tropical 日期分段，含 cusp 标注）、signElement/signModality（三分/四分类）、ZODIAC。
// POS: Celebrity Astro Twins 计算器（#19）的纯算法层。仅用出生日期判定太阳星座（不依赖出生时间），
//      cusp 日由 onCusp 标出引导用户用完整星盘核实。中性分类，无命运断言。若更新此文件，务必更新 calculators/FOLDER.md。

export type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

export const ZODIAC: readonly ZodiacSign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// 每个星座的起始日（tropical 常规分段；逐年可 ±1 天，故 cusp 日单独标注）。
// 所有起始日 >= 19 日，故"前一天"恒为同月 (month, day-1)。
const SIGN_STARTS: ReadonlyArray<{
  sign: ZodiacSign;
  month: number;
  day: number;
}> = [
  { sign: "Aries", month: 3, day: 21 },
  { sign: "Taurus", month: 4, day: 20 },
  { sign: "Gemini", month: 5, day: 21 },
  { sign: "Cancer", month: 6, day: 21 },
  { sign: "Leo", month: 7, day: 23 },
  { sign: "Virgo", month: 8, day: 23 },
  { sign: "Libra", month: 9, day: 23 },
  { sign: "Scorpio", month: 10, day: 23 },
  { sign: "Sagittarius", month: 11, day: 22 },
  { sign: "Capricorn", month: 12, day: 22 },
  { sign: "Aquarius", month: 1, day: 20 },
  { sign: "Pisces", month: 2, day: 19 },
];

const key = (month: number, day: number): number => month * 100 + day;

export interface SunSignResult {
  sign: ZodiacSign;
  onCusp: boolean;
}

/**
 * 从出生日期判定太阳星座。month 为 1-12。
 * onCusp = true 表示该日落在星座边界（边界起始日或其前一天），
 * 逐年太阳过宫时刻不同，cusp 日可能落到相邻星座——需出生时间/完整星盘才能确定。
 */
export function sunSignFromDate(month: number, day: number): SunSignResult {
  const k = key(month, day);
  let sign: ZodiacSign;
  if (k >= key(3, 21) && k <= key(4, 19)) sign = "Aries";
  else if (k >= key(4, 20) && k <= key(5, 20)) sign = "Taurus";
  else if (k >= key(5, 21) && k <= key(6, 20)) sign = "Gemini";
  else if (k >= key(6, 21) && k <= key(7, 22)) sign = "Cancer";
  else if (k >= key(7, 23) && k <= key(8, 22)) sign = "Leo";
  else if (k >= key(8, 23) && k <= key(9, 22)) sign = "Virgo";
  else if (k >= key(9, 23) && k <= key(10, 22)) sign = "Libra";
  else if (k >= key(10, 23) && k <= key(11, 21)) sign = "Scorpio";
  else if (k >= key(11, 22) && k <= key(12, 21)) sign = "Sagittarius";
  else if (k >= key(12, 22) || k <= key(1, 19)) sign = "Capricorn";
  else if (k >= key(1, 20) && k <= key(2, 18)) sign = "Aquarius";
  else sign = "Pisces"; // Feb 19 – Mar 20

  const onCusp = SIGN_STARTS.some(
    (s) => s.month === month && (s.day === day || s.day === day + 1),
  );

  return { sign, onCusp };
}

const ELEMENT_OF: Record<ZodiacSign, Element> = {
  Aries: "fire",
  Leo: "fire",
  Sagittarius: "fire",
  Taurus: "earth",
  Virgo: "earth",
  Capricorn: "earth",
  Gemini: "air",
  Libra: "air",
  Aquarius: "air",
  Cancer: "water",
  Scorpio: "water",
  Pisces: "water",
};

const MODALITY_OF: Record<ZodiacSign, Modality> = {
  Aries: "cardinal",
  Cancer: "cardinal",
  Libra: "cardinal",
  Capricorn: "cardinal",
  Taurus: "fixed",
  Leo: "fixed",
  Scorpio: "fixed",
  Aquarius: "fixed",
  Gemini: "mutable",
  Virgo: "mutable",
  Sagittarius: "mutable",
  Pisces: "mutable",
};

export const signElement = (sign: ZodiacSign): Element => ELEMENT_OF[sign];
export const signModality = (sign: ZodiacSign): Modality => MODALITY_OF[sign];
