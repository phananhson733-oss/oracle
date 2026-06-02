// INPUT: recharts 雷达原语 + 由 WikiHomePage 算好的雷达数据与明暗主题色（经 props 传入）。
// OUTPUT: 默认导出 WikiEnergyRadar 组件，渲染每日能量雷达图（独占 recharts，供 React.lazy 懒加载）。
// POS: Wiki 首页雷达子组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export interface WikiEnergyRadarDatum {
  subject: string;
  value: number;
}

export interface WikiEnergyRadarProps {
  data: WikiEnergyRadarDatum[];
  gridColor: string;
  axisColor: string;
  strokeColor: string;
  fillColor: string;
}

// 纯展示组件：颜色与数据全部来自 props，不在此处推导主题或硬编码色值。
const WikiEnergyRadar: React.FC<WikiEnergyRadarProps> = ({
  data,
  gridColor,
  axisColor,
  strokeColor,
  fillColor,
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart data={data} outerRadius="80%">
      <PolarGrid stroke={gridColor} />
      <PolarAngleAxis
        dataKey="subject"
        tick={{ fill: axisColor, fontSize: 11 }}
      />
      <Radar
        dataKey="value"
        stroke={strokeColor}
        fill={fillColor}
        fillOpacity={0.6}
      />
    </RadarChart>
  </ResponsiveContainer>
);

export default WikiEnergyRadar;
