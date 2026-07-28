// INPUT: localStorage（键 astro_theme_v2）；无其他依赖。
// OUTPUT: THEME_STORAGE_KEY / THEME_META_COLORS 常量与 readStoredTheme / writeStoredTheme 安全读写（严格归一化 + storage 禁用防护）。
// POS: 主题持久化唯一入口，index.html pre-paint 脚本是本模块的镜像（不可 import，改动需双向同步）。若更新此文件，务必更新本头注释与 services/FOLDER.md。

export type StoredTheme = "light" | "dark";

// 键升级 astro_theme -> astro_theme_v2：旧键是暗色默认时代自动持久化的值，
// 不代表用户主动选择，故被刻意忽略（编辑部改版后 light 是品牌默认）。
export const THEME_STORAGE_KEY = "astro_theme_v2";

// 浏览器 chrome 颜色（paper / night-sky），与 index.html 静态 meta 及 pre-paint 脚本保持一致。
export const THEME_META_COLORS: Record<StoredTheme, string> = {
  light: "#F4EFE4",
  dark: "#16130F",
};

// 严格归一化：localStorage 可被污染为任意字符串（"dark injected"、"system"…），
// 只有精确的 "dark" 才生效；storage 被禁用（Safari 严格隐私 / sandboxed iframe /
// 企业策略会在访问时抛 SecurityError）一律回退品牌默认 light，绝不让主题读写炸掉 React 挂载。
export const readStoredTheme = (): StoredTheme => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

// 只在用户显式切换时调用（ThemeProvider 的 toggle 路径）；不要在挂载 effect 里
// 无条件持久化，否则首访即写入 "light"，摧毁 v2 键「显式选择」的语义。
export const writeStoredTheme = (theme: StoredTheme): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    // 顺带清理旧键：它已无任何读者，留着只是永久的死数据。
    localStorage.removeItem("astro_theme");
  } catch {
    // storage 不可用时静默降级：主题仍在本次会话内生效，只是不持久化。
  }
};
