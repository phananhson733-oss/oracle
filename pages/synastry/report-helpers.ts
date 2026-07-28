// INPUT: 无外部依赖（纯函数 + 常量）。
// OUTPUT: 合盘报告渲染用的纯展示 helper：SECTION_TITLE_CLASS 常量、clampScore、getRadarTone、getCoreDynamicsTone、fillTemplate。
// POS: SynastryReportView / OverviewTab / CompositeTab 共用的无状态格式化逻辑。若更新此文件，务必更新本头注释与所属 FOLDER.md。

export const SECTION_TITLE_CLASS =
  "text-sm font-bold uppercase text-gold-500 mb-4 tracking-widest border-b border-gold-500/20 pb-2";

export const clampScore = (score: number) =>
  Math.max(0, Math.min(100, Math.round(score)));

export const getRadarTone = (dim: string) => {
  const key = dim.toLowerCase();
  if (key.includes("safety") || key.includes("安全")) {
    return {
      bar: "bg-blue-500",
      text: "text-blue-500",
      border: "border-l-blue-500/40",
      soft: "",
    };
  }
  if (key.includes("communication") || key.includes("沟通")) {
    return {
      bar: "bg-accent",
      text: "text-accent",
      border: "border-l-accent/40",
      soft: "",
    };
  }
  if (key.includes("intimacy") || key.includes("亲密")) {
    return {
      bar: "bg-pink-500",
      text: "text-pink-500",
      border: "border-l-pink-500/40",
      soft: "",
    };
  }
  if (key.includes("values") || key.includes("价值")) {
    return {
      bar: "bg-gold-500",
      text: "text-gold-500",
      border: "border-l-gold-500/40",
      soft: "",
    };
  }
  if (key.includes("rhythm") || key.includes("节奏")) {
    return {
      bar: "bg-purple-500",
      text: "text-purple-500",
      border: "border-l-purple-500/40",
      soft: "",
    };
  }
  return {
    bar: "bg-star-200",
    text: "text-star-200",
    border: "border-l-star-200/40",
    soft: "",
  };
};

export const getCoreDynamicsTone = (key: string) => {
  const normalized = key.toLowerCase();
  if (normalized.includes("emotional")) {
    return { border: "border-l-blue-500/40", text: "text-blue-500", bg: "" };
  }
  if (normalized.includes("communication")) {
    return { border: "border-l-accent/40", text: "text-accent", bg: "" };
  }
  if (normalized.includes("intimacy")) {
    return { border: "border-l-pink-500/40", text: "text-pink-500", bg: "" };
  }
  if (normalized.includes("values")) {
    return { border: "border-l-gold-500/40", text: "text-gold-500", bg: "" };
  }
  if (normalized.includes("rhythm")) {
    return {
      border: "border-l-purple-500/40",
      text: "text-purple-500",
      bg: "",
    };
  }
  return { border: "border-l-star-200/40", text: "text-star-200", bg: "" };
};

export const fillTemplate = (template: string, self: string, other: string) =>
  template.replace(/\{self\}/g, self).replace(/\{other\}/g, other);
