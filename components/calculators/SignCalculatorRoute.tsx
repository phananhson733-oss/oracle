// INPUT: sign calculator kind、BirthDataCalculator、signConfigs。
// OUTPUT: 懒加载的 sign 类计算器路由组件，把 Moon/Rising/Big Three/Birth Chart 的配置映射给共享外壳。
// POS: 计算器矩阵(D)的路由级拆包边界；用于避免 App.tsx 静态导入 signConfigs 而把 BirthDataCalculator 拉进首页主包。若更新此文件，务必更新 calculators/FOLDER.md。

import React from "react";
import BirthDataCalculator from "./BirthDataCalculator";
import type { CalculatorConfig } from "./BirthDataCalculator";
import {
  bigThreeConfig,
  birthChartConfig,
  moonSignConfig,
  risingSignConfig,
} from "./signConfigs";

export type SignCalculatorKind =
  | "moon"
  | "rising"
  | "big-three"
  | "birth-chart";

const configByKind: Record<SignCalculatorKind, CalculatorConfig> = {
  moon: moonSignConfig,
  rising: risingSignConfig,
  "big-three": bigThreeConfig,
  "birth-chart": birthChartConfig,
};

export const SignCalculatorRoute: React.FC<{ kind: SignCalculatorKind }> = ({
  kind,
}) => <BirthDataCalculator config={configByKind[kind]} />;
