// INPUT: sunSign（ZodiacSign 类型）。
// OUTPUT: 名人数据集（CELEBRITIES）+ 可选 chart dossier + 分组助手（celebritiesBySign）+ 职业标签（FIELD_LABELS）。
// POS: Celebrity Astro Twins 计算器（#19）的数据层。仅记录公开、被广泛记载的出生「日期」（不含出生时间——
//      故只断言太阳星座，不碰上升/宫位精度，见 [[feedback_html_lang_zh_breaks_astro_glyphs]] 无关）。
//      所有日期取星座中段以保证不依赖出生时间即无歧义；一致性由 tests/unit/sunSign.test.ts 守护。
//      `chart` 为逐人可选的公开数据补充；未知出生时间时不得填上升/宫位/宫主星，避免伪造精度。
//      若更新此文件，务必更新 calculators/FOLDER.md，并确保新条目的 sign 与 sunSignFromDate 一致。

import type { ZodiacSign } from "./sunSign";

export type Field =
  | "artist"
  | "musician"
  | "actor"
  | "writer"
  | "athlete"
  | "scientist"
  | "leader"
  | "entrepreneur"
  | "designer"
  | "royal"
  | "humanitarian";

export const FIELD_LABELS: Record<Field, { en: string; zh: string }> = {
  artist: { en: "Artist", zh: "艺术家" },
  musician: { en: "Musician", zh: "音乐人" },
  actor: { en: "Actor", zh: "演员" },
  writer: { en: "Writer", zh: "作家" },
  athlete: { en: "Athlete", zh: "运动员" },
  scientist: { en: "Scientist", zh: "科学家" },
  leader: { en: "Leader", zh: "领袖" },
  entrepreneur: { en: "Entrepreneur", zh: "企业家" },
  designer: { en: "Designer", zh: "设计师" },
  royal: { en: "Royal", zh: "王室" },
  humanitarian: { en: "Humanitarian", zh: "人道主义者" },
};

export interface Celebrity {
  name: string;
  field: Field;
  knownFor?: {
    en: string;
    zh: string;
  };
  birthMonth: number; // 1-12
  birthDay: number; // 1-31
  birthYear: number;
  sign: ZodiacSign;
  chart?: CelebrityChartDossier;
}

export interface CelebrityPlacement {
  name: string;
  sign: ZodiacSign;
  degree: number; // 0-29
  minute: number; // 0-59
  isRetrograde?: boolean;
}

export interface CelebrityAspectData {
  planet1: string;
  planet2: string;
  type: "conjunction" | "opposition" | "square" | "trine" | "sextile";
  degree: number;
  minute: number;
}

export interface CelebrityChartPattern {
  name: string;
  mode?: string;
  focus?: string;
  bodies: string[];
}

export interface CelebrityChartDossier {
  sourceNote: {
    en: string;
    zh: string;
  };
  time: {
    en: string;
    zh: string;
  };
  place: {
    en: string;
    zh: string;
  };
  timezone: string;
  planets: CelebrityPlacement[];
  points: CelebrityPlacement[];
  aspects: CelebrityAspectData[];
  patterns: CelebrityChartPattern[];
  signature: {
    elements: Record<"Fire" | "Earth" | "Air" | "Water", number>;
    modalities: Record<"Cardinal" | "Fixed" | "Mutable", number>;
    shape?: {
      en: string;
      zh: string;
    };
    commonAspect?: {
      en: string;
      zh: string;
    };
  };
}

// 公开、被广泛记载的出生日期。全部取星座中段（不依赖出生时间即太阳星座无歧义）。
export const CELEBRITIES: ReadonlyArray<Celebrity> = [
  // Aries (Mar 21 – Apr 19)
  {
    name: "Emma Watson",
    field: "actor",
    birthMonth: 4,
    birthDay: 15,
    birthYear: 1990,
    sign: "Aries",
  },
  {
    name: "Lady Gaga",
    field: "musician",
    birthMonth: 3,
    birthDay: 28,
    birthYear: 1986,
    sign: "Aries",
  },
  {
    name: "Robert Downey Jr.",
    field: "actor",
    birthMonth: 4,
    birthDay: 4,
    birthYear: 1965,
    sign: "Aries",
  },
  {
    name: "Vincent van Gogh",
    field: "artist",
    birthMonth: 3,
    birthDay: 30,
    birthYear: 1853,
    sign: "Aries",
  },
  {
    name: "Maya Angelou",
    field: "writer",
    birthMonth: 4,
    birthDay: 4,
    birthYear: 1928,
    sign: "Aries",
  },

  // Taurus (Apr 20 – May 20)
  {
    name: "William Shakespeare",
    field: "writer",
    birthMonth: 4,
    birthDay: 23,
    birthYear: 1564,
    sign: "Taurus",
  },
  {
    name: "Adele",
    field: "musician",
    birthMonth: 5,
    birthDay: 5,
    birthYear: 1988,
    sign: "Taurus",
  },
  {
    name: "David Beckham",
    field: "athlete",
    birthMonth: 5,
    birthDay: 2,
    birthYear: 1975,
    sign: "Taurus",
  },
  {
    name: "Audrey Hepburn",
    field: "actor",
    birthMonth: 5,
    birthDay: 4,
    birthYear: 1929,
    sign: "Taurus",
  },
  {
    name: "Sigmund Freud",
    field: "scientist",
    birthMonth: 5,
    birthDay: 6,
    birthYear: 1856,
    sign: "Taurus",
  },

  // Gemini (May 21 – Jun 20)
  {
    name: "Marilyn Monroe",
    field: "actor",
    birthMonth: 6,
    birthDay: 1,
    birthYear: 1926,
    sign: "Gemini",
  },
  {
    name: "Johnny Depp",
    field: "actor",
    birthMonth: 6,
    birthDay: 9,
    birthYear: 1963,
    sign: "Gemini",
  },
  {
    name: "Angelina Jolie",
    field: "actor",
    birthMonth: 6,
    birthDay: 4,
    birthYear: 1975,
    sign: "Gemini",
  },
  {
    name: "Bob Dylan",
    field: "musician",
    birthMonth: 5,
    birthDay: 24,
    birthYear: 1941,
    sign: "Gemini",
  },
  {
    name: "Morgan Freeman",
    field: "actor",
    birthMonth: 6,
    birthDay: 1,
    birthYear: 1937,
    sign: "Gemini",
  },

  // Cancer (Jun 21 – Jul 22)
  {
    name: "Tom Hanks",
    field: "actor",
    birthMonth: 7,
    birthDay: 9,
    birthYear: 1956,
    sign: "Cancer",
  },
  {
    name: "Frida Kahlo",
    field: "artist",
    birthMonth: 7,
    birthDay: 6,
    birthYear: 1907,
    sign: "Cancer",
  },
  {
    name: "Princess Diana",
    field: "royal",
    birthMonth: 7,
    birthDay: 1,
    birthYear: 1961,
    sign: "Cancer",
  },
  {
    name: "Elon Musk",
    field: "entrepreneur",
    birthMonth: 6,
    birthDay: 28,
    birthYear: 1971,
    sign: "Cancer",
  },
  {
    name: "Nelson Mandela",
    field: "leader",
    birthMonth: 7,
    birthDay: 18,
    birthYear: 1918,
    sign: "Cancer",
  },

  // Leo (Jul 23 – Aug 22)
  {
    name: "Barack Obama",
    field: "leader",
    birthMonth: 8,
    birthDay: 4,
    birthYear: 1961,
    sign: "Leo",
  },
  {
    name: "Madonna",
    field: "musician",
    birthMonth: 8,
    birthDay: 16,
    birthYear: 1958,
    sign: "Leo",
  },
  {
    name: "Coco Chanel",
    field: "designer",
    birthMonth: 8,
    birthDay: 19,
    birthYear: 1883,
    sign: "Leo",
  },
  {
    name: "Carl Jung",
    field: "scientist",
    birthMonth: 7,
    birthDay: 26,
    birthYear: 1875,
    sign: "Leo",
  },
  {
    name: "Napoleon Bonaparte",
    field: "leader",
    birthMonth: 8,
    birthDay: 15,
    birthYear: 1769,
    sign: "Leo",
  },

  // Virgo (Aug 23 – Sep 22)
  {
    name: "Beyoncé",
    field: "musician",
    birthMonth: 9,
    birthDay: 4,
    birthYear: 1981,
    sign: "Virgo",
  },
  {
    name: "Michael Jackson",
    field: "musician",
    birthMonth: 8,
    birthDay: 29,
    birthYear: 1958,
    sign: "Virgo",
  },
  {
    name: "Mother Teresa",
    field: "humanitarian",
    birthMonth: 8,
    birthDay: 26,
    birthYear: 1910,
    sign: "Virgo",
  },
  {
    name: "Keanu Reeves",
    field: "actor",
    birthMonth: 9,
    birthDay: 2,
    birthYear: 1964,
    sign: "Virgo",
  },
  {
    name: "Freddie Mercury",
    field: "musician",
    birthMonth: 9,
    birthDay: 5,
    birthYear: 1946,
    sign: "Virgo",
  },

  // Libra (Sep 23 – Oct 22)
  {
    name: "Mahatma Gandhi",
    field: "leader",
    birthMonth: 10,
    birthDay: 2,
    birthYear: 1869,
    sign: "Libra",
  },
  {
    name: "John Lennon",
    field: "musician",
    birthMonth: 10,
    birthDay: 9,
    birthYear: 1940,
    sign: "Libra",
  },
  {
    name: "Will Smith",
    field: "actor",
    birthMonth: 9,
    birthDay: 25,
    birthYear: 1968,
    sign: "Libra",
  },
  {
    name: "Serena Williams",
    field: "athlete",
    birthMonth: 9,
    birthDay: 26,
    birthYear: 1981,
    sign: "Libra",
  },
  {
    name: "Oscar Wilde",
    field: "writer",
    birthMonth: 10,
    birthDay: 16,
    birthYear: 1854,
    sign: "Libra",
  },

  // Scorpio (Oct 23 – Nov 21)
  {
    name: "Pablo Picasso",
    field: "artist",
    birthMonth: 10,
    birthDay: 25,
    birthYear: 1881,
    sign: "Scorpio",
  },
  {
    name: "Marie Curie",
    field: "scientist",
    birthMonth: 11,
    birthDay: 7,
    birthYear: 1867,
    sign: "Scorpio",
  },
  {
    name: "Leonardo DiCaprio",
    field: "actor",
    birthMonth: 11,
    birthDay: 11,
    birthYear: 1974,
    sign: "Scorpio",
  },
  {
    name: "Bill Gates",
    field: "entrepreneur",
    birthMonth: 10,
    birthDay: 28,
    birthYear: 1955,
    sign: "Scorpio",
  },
  {
    name: "Julia Roberts",
    field: "actor",
    birthMonth: 10,
    birthDay: 28,
    birthYear: 1967,
    sign: "Scorpio",
  },

  // Sagittarius (Nov 22 – Dec 21)
  {
    name: "Walt Disney",
    field: "entrepreneur",
    birthMonth: 12,
    birthDay: 5,
    birthYear: 1901,
    sign: "Sagittarius",
  },
  {
    name: "Taylor Swift",
    field: "musician",
    birthMonth: 12,
    birthDay: 13,
    birthYear: 1989,
    sign: "Sagittarius",
  },
  {
    name: "Bruce Lee",
    field: "actor",
    birthMonth: 11,
    birthDay: 27,
    birthYear: 1940,
    sign: "Sagittarius",
  },
  {
    name: "Winston Churchill",
    field: "leader",
    birthMonth: 11,
    birthDay: 30,
    birthYear: 1874,
    sign: "Sagittarius",
  },
  {
    name: "Mark Twain",
    field: "writer",
    birthMonth: 11,
    birthDay: 30,
    birthYear: 1835,
    sign: "Sagittarius",
  },
  {
    name: "Lei Jun",
    field: "entrepreneur",
    knownFor: {
      en: "Entrepreneur; Xiaomi, Kingsoft, Shunwei Capital",
      zh: "企业家；小米、金山软件、顺为资本",
    },
    birthMonth: 12,
    birthDay: 16,
    birthYear: 1969,
    sign: "Sagittarius",
    chart: {
      sourceNote: {
        en: "Public chart data with unknown birth time. Angles, houses, and house rulers are intentionally omitted.",
        zh: "公开星盘资料，出生时间未知；因此不展示上升、宫位与宫主星。",
      },
      time: { en: "Unknown", zh: "未知" },
      place: {
        en: "Xiantao, Hubei, China",
        zh: "中国湖北仙桃",
      },
      timezone: "UTC +8:00",
      planets: [
        {
          name: "Sun",
          sign: "Sagittarius",
          degree: 24,
          minute: 2,
        },
        { name: "Moon", sign: "Pisces", degree: 25, minute: 31 },
        { name: "Mercury", sign: "Capricorn", degree: 10, minute: 3 },
        { name: "Venus", sign: "Sagittarius", degree: 14, minute: 32 },
        { name: "Mars", sign: "Pisces", degree: 0, minute: 25 },
        { name: "Jupiter", sign: "Libra", degree: 29, minute: 55 },
        {
          name: "Saturn",
          sign: "Taurus",
          degree: 2,
          minute: 23,
          isRetrograde: true,
        },
        { name: "Uranus", sign: "Libra", degree: 8, minute: 25 },
        { name: "Neptune", sign: "Scorpio", degree: 29, minute: 22 },
        { name: "Pluto", sign: "Virgo", degree: 27, minute: 20 },
      ],
      points: [
        {
          name: "North Node",
          sign: "Pisces",
          degree: 16,
          minute: 8,
          isRetrograde: true,
        },
        { name: "Chiron", sign: "Aries", degree: 2, minute: 22 },
      ],
      aspects: [
        {
          planet1: "Sun",
          planet2: "Moon",
          type: "square",
          degree: 1,
          minute: 29,
        },
        {
          planet1: "Mars",
          planet2: "Jupiter",
          type: "trine",
          degree: 0,
          minute: 30,
        },
        {
          planet1: "Moon",
          planet2: "Pluto",
          type: "opposition",
          degree: 1,
          minute: 49,
        },
        {
          planet1: "Mars",
          planet2: "Neptune",
          type: "square",
          degree: 1,
          minute: 3,
        },
        {
          planet1: "Mercury",
          planet2: "Uranus",
          type: "square",
          degree: 1,
          minute: 37,
        },
        {
          planet1: "Mars",
          planet2: "Saturn",
          type: "sextile",
          degree: 1,
          minute: 57,
        },
        {
          planet1: "Moon",
          planet2: "Neptune",
          type: "trine",
          degree: 3,
          minute: 51,
        },
        {
          planet1: "Jupiter",
          planet2: "Saturn",
          type: "opposition",
          degree: 2,
          minute: 28,
        },
        {
          planet1: "Venus",
          planet2: "North Node",
          type: "square",
          degree: 1,
          minute: 36,
        },
        {
          planet1: "Neptune",
          planet2: "Pluto",
          type: "sextile",
          degree: 2,
          minute: 2,
        },
        {
          planet1: "Neptune",
          planet2: "Chiron",
          type: "trine",
          degree: 3,
          minute: 1,
        },
        {
          planet1: "Moon",
          planet2: "Chiron",
          type: "conjunction",
          degree: 6,
          minute: 51,
        },
      ],
      patterns: [
        {
          name: "T-Square",
          mode: "Mutable",
          bodies: ["Moon", "Pluto", "Sun"],
        },
        {
          name: "Wedge",
          focus: "Neptune",
          bodies: ["Chiron", "Moon", "Neptune", "Pluto"],
        },
        {
          name: "Wedge",
          focus: "Mars",
          bodies: ["Jupiter", "Mars", "Saturn"],
        },
      ],
      signature: {
        elements: { Fire: 3, Earth: 1, Air: 1, Water: 3 },
        modalities: { Cardinal: 2, Fixed: 0, Mutable: 6 },
        shape: {
          en: "Locomotive shape",
          zh: "Locomotive 盘型",
        },
        commonAspect: {
          en: "Square is the most frequent major aspect",
          zh: "刑相是出现最多的主要相位",
        },
      },
    },
  },

  // Capricorn (Dec 22 – Jan 19)
  {
    name: "Martin Luther King Jr.",
    field: "leader",
    birthMonth: 1,
    birthDay: 15,
    birthYear: 1929,
    sign: "Capricorn",
  },
  {
    name: "Michelle Obama",
    field: "leader",
    birthMonth: 1,
    birthDay: 17,
    birthYear: 1964,
    sign: "Capricorn",
  },
  {
    name: "Muhammad Ali",
    field: "athlete",
    birthMonth: 1,
    birthDay: 17,
    birthYear: 1942,
    sign: "Capricorn",
  },
  {
    name: "Stephen Hawking",
    field: "scientist",
    birthMonth: 1,
    birthDay: 8,
    birthYear: 1942,
    sign: "Capricorn",
  },
  {
    name: "Denzel Washington",
    field: "actor",
    birthMonth: 12,
    birthDay: 28,
    birthYear: 1954,
    sign: "Capricorn",
  },

  // Aquarius (Jan 20 – Feb 18)
  {
    name: "Oprah Winfrey",
    field: "entrepreneur",
    birthMonth: 1,
    birthDay: 29,
    birthYear: 1954,
    sign: "Aquarius",
  },
  {
    name: "Abraham Lincoln",
    field: "leader",
    birthMonth: 2,
    birthDay: 12,
    birthYear: 1809,
    sign: "Aquarius",
  },
  {
    name: "Charles Darwin",
    field: "scientist",
    birthMonth: 2,
    birthDay: 12,
    birthYear: 1809,
    sign: "Aquarius",
  },
  {
    name: "Bob Marley",
    field: "musician",
    birthMonth: 2,
    birthDay: 6,
    birthYear: 1945,
    sign: "Aquarius",
  },
  {
    name: "Cristiano Ronaldo",
    field: "athlete",
    birthMonth: 2,
    birthDay: 5,
    birthYear: 1985,
    sign: "Aquarius",
  },

  // Pisces (Feb 19 – Mar 20)
  {
    name: "Albert Einstein",
    field: "scientist",
    birthMonth: 3,
    birthDay: 14,
    birthYear: 1879,
    sign: "Pisces",
  },
  {
    name: "Steve Jobs",
    field: "entrepreneur",
    birthMonth: 2,
    birthDay: 24,
    birthYear: 1955,
    sign: "Pisces",
  },
  {
    name: "Justin Bieber",
    field: "musician",
    birthMonth: 3,
    birthDay: 1,
    birthYear: 1994,
    sign: "Pisces",
  },
  {
    name: "George Washington",
    field: "leader",
    birthMonth: 2,
    birthDay: 22,
    birthYear: 1732,
    sign: "Pisces",
  },
  {
    name: "Michelangelo",
    field: "artist",
    birthMonth: 3,
    birthDay: 6,
    birthYear: 1475,
    sign: "Pisces",
  },
];

export function celebritiesBySign(sign: ZodiacSign): Celebrity[] {
  return CELEBRITIES.filter((c) => c.sign === sign);
}
