// INPUT: props（weatherForecast 数据、panelTone/labelClass 样式串）；shared UI（useTheme/useLanguage）+ WeatherMoodIcon。
// OUTPUT: WeatherForecastBody —— overview tab「关系天气预报」手风琴的展开内容（周脉搏 7 日卡 + 季度展望 + 关键日期）。
// POS: OverviewTab 的子展示组件，仅在 weatherForecast 数据就绪时渲染。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { useTheme, useLanguage } from "../../components/UIComponents";
import * as T from "../../types";
import { WeatherMoodIcon } from "../../components/shared/WeatherMoodIcon";

export const WeatherForecastBody: React.FC<{
  weatherForecast: T.SynastryWeatherForecastContent;
  panelTone: string;
  labelClass: string;
}> = ({ weatherForecast, panelTone, labelClass }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
      <div className="space-y-6">
        {/* Weekly Pulse */}
        <div
          className={`rounded-xl p-5 border-l border-l-blue-500/40 ${panelTone}`}
        >
          <h4
            className={`${labelClass} text-blue-500 mb-1`}
          >
            {t.us.weekly_pulse_title}
          </h4>
          <p className="text-xs opacity-70 mb-4">
            {t.us.weekly_pulse_subtitle}
          </p>

          {/* Headline */}
          <div
            className={`p-3 rounded-lg mb-4 ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-500/5"}`}
          >
            <div className="font-serif text-lg">
              {weatherForecast.weekly_pulse.headline}
            </div>
          </div>

          {/* Wave Trend */}
          <div className="flex items-end justify-between h-12 mb-4 px-2">
            {weatherForecast.weekly_pulse.wave_trend.map(
              (trend, i) => {
                const height =
                  trend === "up"
                    ? "h-10"
                    : trend === "down"
                      ? "h-4"
                      : "h-6";
                const color =
                  trend === "up"
                    ? "bg-success"
                    : trend === "down"
                      ? "bg-danger/60"
                      : "bg-blue-500/40";
                return (
                  <div
                    key={i}
                    className={`w-6 rounded-full ${height} ${color}`}
                  />
                );
              },
            )}
          </div>

          {/* 7 Day Cards */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {weatherForecast.weekly_pulse.days.map((day, i) => {
              const today = new Date()
                .toISOString()
                .split("T")[0];
              const isToday = day.date === today;
              const energyBars = Array(5)
                .fill(0)
                .map((_, j) => j < day.energy);
              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-center ${
                    isToday
                      ? `ring-2 ring-blue-500 ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/10"}`
                      : theme === "dark"
                        ? "bg-space-700"
                        : "bg-paper-100"
                  }`}
                >
                  {isToday && (
                    <div className="text-xs font-bold text-blue-500 mb-1">
                      {t.us.today_label}
                    </div>
                  )}
                  <div className="text-xs font-medium opacity-70">
                    {day.day_label}
                  </div>
                  <div className="my-1 flex justify-center">
                    <WeatherMoodIcon emoji={day.emoji} />
                  </div>
                  <div className="flex justify-center gap-0.5 mb-1">
                    {energyBars.map((filled, j) => (
                      <div
                        key={j}
                        className={`w-1 h-2 rounded-full ${
                          filled
                            ? day.energy >= 4
                              ? "bg-success"
                              : day.energy <= 2
                                ? "bg-danger"
                                : "bg-gold-500"
                            : "bg-current opacity-20"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs opacity-80 line-clamp-2">
                    {day.vibe}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Season Ahead */}
        <div
          className={`rounded-xl p-5 border-l border-l-gold-500/40 ${panelTone}`}
        >
          <h4
            className={`${labelClass} text-gold-500 mb-1`}
          >
            {t.us.season_ahead_title}
          </h4>
          <p className="text-xs opacity-70 mb-4">
            {t.us.season_ahead_subtitle}
          </p>

          <div className="space-y-3 mb-6">
            {weatherForecast.periods.map((period, i) => {
              const periodStyle =
                period.type === "high_intensity"
                  ? {
                      color: "danger",
                      label: t.us.period_high,
                      emoji: "⚡",
                    }
                  : period.type === "sweet_spot"
                    ? {
                        color: "success",
                        label: t.us.period_sweet,
                        emoji: "🌿",
                      }
                    : {
                        color: "blue-500",
                        label: t.us.period_deep,
                        emoji: "🌊",
                      };
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-l ${theme === "dark" ? "bg-space-700" : "bg-paper-100"}`}
                  style={{
                    borderLeftColor: `var(--color-${periodStyle.color})`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-base"
                      aria-hidden="true"
                    >
                      {periodStyle.emoji}
                    </span>
                    <span className="text-xs font-bold uppercase">
                      {periodStyle.label}
                    </span>
                    <span className="text-xs opacity-70">
                      {period.start_date} → {period.end_date}
                    </span>
                  </div>
                  <p className="text-sm mb-2">
                    {period.description}
                  </p>
                  <p className="text-xs opacity-80 italic">
                    {period.advice}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Critical Dates */}
          <div className={labelClass}>
            {t.us.critical_dates_title}
          </div>
          <div className="space-y-3 mt-3">
            {weatherForecast.critical_dates.map((date, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${theme === "dark" ? "bg-space-700" : "bg-paper-100"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm text-star-200">
                    {date.date}
                  </span>
                  <span className="text-sm">{date.event}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-success font-bold">
                      {t.us.dates_dos}:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {date.dos.map((d, j) => (
                        <li key={j} className="opacity-90">
                          • {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-danger font-bold">
                      {t.us.dates_donts}:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {date.donts.map((d, j) => (
                        <li key={j} className="opacity-90">
                          • {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};
