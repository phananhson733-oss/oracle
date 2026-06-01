// INPUT: types.ts 的 AuthorPersona / AuthorVertical / Language。
// OUTPUT: 集中式编辑作者人设注册表，导出 AUTHORS、getAuthorById、getAllAuthors、getAuthorBio。
// POS: 作者人设单一事实来源；文章 authorId 引用此处。纯数据，可被 SEO 脚本 TS loader 解析（不含 React/Vite import）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import type { AuthorPersona, Language } from "../../types";

// 编辑人设：去履历化 bio（editorial focus，不写 "X years of experience"）。
// 头像 monogram 渐变色按垂直主题调（aura=冷静、心理=暖信任、基础=中性数据）。
export const AUTHORS: AuthorPersona[] = [
  {
    id: "elena-vane",
    name: "Elena Vane",
    title: "Aura & Energy Columnist",
    vertical: "aura_energy",
    bio: {
      en: "Writes practical guides to aura colors and emotional energy, with a focus on everyday grounding over mysticism.",
    },
    topics: ["Aura Colors", "Chakras", "Energy & Mood"],
    avatarColors: ["#7FA8C9", "#C9A0B8"],
  },
  {
    id: "julian-thorne",
    name: "Julian Thorne",
    title: "Psychological Astrology Writer",
    vertical: "psychological_astrology",
    bio: {
      en: "Reads the birth chart as an objective frame for self-reflection, drawing on a counseling background. Focuses on growth themes, not predictions.",
      zh: "把出生星盘当作自我反思的客观框架，带心理辅导视角。关注成长课题，不做预测。",
    },
    topics: ["Houses", "Nodes", "Chiron", "Healing Placements"],
    avatarColors: ["#C7A66B", "#9A8FB8"],
  },
  {
    id: "marcus-orion",
    name: "Marcus Orion",
    title: "Foundations & Data Editor",
    vertical: "fundamentals",
    bio: {
      en: "Breaks down the mechanics of charts, transits, and aspects in plain, testable terms — the product manual for beginners.",
      zh: "用直白、可验证的方式拆解星盘、行运与相位的机制——写给初学者的说明书。",
    },
    topics: ["Astrology Basics & Terms", "Transits", "Aspects"],
    avatarColors: ["#C9B27F", "#8FA9A0"],
  },
  {
    id: "aditi-sharma",
    name: "Aditi Sharma",
    title: "Vedic Astrology Writer",
    vertical: "vedic",
    bio: {
      en: "Reads Vedic charts through their classical sources, translating sidereal placements and dasha timing into grounded, present-tense self-reflection rather than fixed fate.",
      zh: "以古典典籍为据解读吠陀星盘，把恒星黄道落点与大运周期译成当下、可自省的语言，而非既定命运。",
    },
    topics: ["Vedic Astrology", "Nakshatras", "Sidereal Chart"],
    avatarColors: ["#B58FC9", "#C9A06B"],
  },
];

const AUTHORS_BY_ID: Map<string, AuthorPersona> = new Map(
  AUTHORS.map((a) => [a.id, a]),
);

// 按 id 查作者。未命中返回 undefined（调用方负责降级，不抛错）。
export const getAuthorById = (id: string): AuthorPersona | undefined =>
  AUTHORS_BY_ID.get(id);

// 返回全部作者人设（首版顺序）。
export const getAllAuthors = (): AuthorPersona[] => AUTHORS;

// 取作者 bio，缺失语言回退 EN。
export const getAuthorBio = (persona: AuthorPersona, lang: Language): string =>
  persona.bio[lang] ?? persona.bio.en ?? "";
