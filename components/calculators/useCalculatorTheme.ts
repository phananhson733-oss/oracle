// INPUT: components/UIComponents 的 useTheme。
// OUTPUT: useCalculatorTheme —— 返回计算器系列共用的明暗主题 class token（与 BirthDataCalculator 对齐）。
// POS: 计算器矩阵（D）天象工具的共享主题层；token 来源 COLOR_SYSTEM_GUIDE。若更新此文件，务必更新 calculators/FOLDER.md。

import { useTheme } from "../UIComponents";

export interface CalculatorThemeTokens {
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
}

export function useCalculatorTheme(): CalculatorThemeTokens {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    isDark,
    cardBg: isDark ? "bg-space-900/60" : "bg-white",
    cardBorder: isDark ? "border-gold-500/20" : "border-paper-300",
    textPrimary: isDark ? "text-star-50" : "text-paper-900",
    textSecondary: isDark ? "text-star-200" : "text-paper-600",
    inputBg: isDark ? "bg-space-800" : "bg-paper-50",
    inputText: isDark ? "text-star-50" : "text-paper-900",
    inputBorder: isDark ? "border-gold-500/20" : "border-paper-300",
  };
}
