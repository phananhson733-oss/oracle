// INPUT: None (pure constants and utility functions).
// OUTPUT: Planet/zodiac glyph constants, label-parsing helpers, CSS class constant.
// POS: Shared astro-glyph utilities extracted from App.tsx for reuse across page components.

/** Unicode glyphs for the most commonly displayed planets / points. */
export const PLANET_GLYPHS: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  rising: '↑',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  saturn: '♄',
  pluto: '♇',
  chiron: '⚷',
  north_node: '☊',
};

/** Regex→glyph pairs for the 12 zodiac signs (supports both English and Chinese names). */
export const ZODIAC_GLYPHS: Array<[RegExp, string]> = [
  [/Aries|白羊座/iu, '♈'],
  [/Taurus|金牛座/iu, '♉'],
  [/Gemini|双子座/iu, '♊'],
  [/Cancer|巨蟹座/iu, '♋'],
  [/Leo|狮子座/iu, '♌'],
  [/Virgo|处女座/iu, '♍'],
  [/Libra|天秤座/iu, '♎'],
  [/Scorpio|天蝎座/iu, '♏'],
  [/Sagittarius|射手座/iu, '♐'],
  [/Capricorn|摩羯座/iu, '♑'],
  [/Aquarius|水瓶座/iu, '♒'],
  [/Pisces|双鱼座/iu, '♓'],
];

/**
 * Split a label like `"Main (Sub)"` or `"Main（Sub）"` into its parts.
 * Returns `{ main, sub }` where `sub` may be an empty string.
 */
export const splitLabelParts = (label: string) => {
  const match = label.match(/^(.+?)\s*[（(](.+)[)）]\s*$/);
  if (!match) return { main: label.trim(), sub: '' };
  return { main: match[1].trim(), sub: match[2].trim() };
};

/** Return the zodiac Unicode glyph for a value that contains a zodiac sign name, or `''`. */
export const getZodiacGlyph = (value: string) => {
  for (const [pattern, glyph] of ZODIAC_GLYPHS) {
    if (pattern.test(value)) return glyph;
  }
  return '';
};

/** Prepend the zodiac glyph (if any) to the raw sign/house string. */
export const formatSignHouse = (value?: string) => {
  if (!value) return '';
  const glyph = getZodiacGlyph(value);
  return glyph ? `${glyph} ${value}` : value;
};

/** Reusable Tailwind class string for small detail labels. */
export const DETAIL_LABEL_CLASS = "text-xs uppercase tracking-widest opacity-80";
