// INPUT: props（weatherForecast 数据、panelTone/labelClass 兼容保留）；shared UI（useLanguage）+ WeatherMoodIcon + llm 排版原语。
// OUTPUT: WeatherForecastBody —— overview tab「关系天气预报」展开内容（周脉搏 7 日卡 + 季度展望 + 关键日期），文档式排版。
// POS: OverviewTab 的子展示组件，仅在 weatherForecast 数据就绪时渲染。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React from "react";
import { useLanguage } from "../../components/UIComponents";
import * as T from "../../types";
import { WeatherMoodIcon } from "../../components/shared/WeatherMoodIcon";
import { LlmDoc, LlmSection, LlmProse, LlmList } from "../../components/llm/LlmDoc";

// panelTone/labelClass 保留签名兼容 OverviewTab 调用；文档式排版不再使用。
export const WeatherForecastBody: React.FC<{
  weatherForecast: T.SynastryWeatherForecastContent;
  panelTone?: string;
  labelClass?: string;
}> = ({ weatherForecast }) => {
  const { t } = useLanguage();

  return (
    <LlmDoc className="space-y-8">
      {/* Weekly Pulse — 保留波形条 + 7 日卡数据可视化，配纸墨 token */}
      <LlmSection
        first
        title={t.us.weekly_pulse_title}
        intro={t.us.weekly_pulse_subtitle}
      >
        <p className="mb-4 font-serif text-lg text-paper-900 dark:text-star-50">
          {weatherForecast.weekly_pulse.headline}
        </p>

        <div className="mb-4 flex h-12 items-end justify-between px-2">
          {weatherForecast.weekly_pulse.wave_trend.map((trend, i) => {
            const height =
              trend === "up" ? "h-10" : trend === "down" ? "h-4" : "h-6";
            const color =
              trend === "up"
                ? "bg-success"
                : trend === "down"
                  ? "bg-danger/60"
                  : "bg-accent/40";
            return (
              <div key={i} className={`w-6 rounded-full ${height} ${color}`} />
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {weatherForecast.weekly_pulse.days.map((day, i) => {
            const today = new Date().toISOString().split("T")[0];
            const isToday = day.date === today;
            const energyBars = Array(5)
              .fill(0)
              .map((_, j) => j < day.energy);
            return (
              <div
                key={i}
                className={`rounded-sm p-2 text-center ${
                  isToday
                    ? "ring-1 ring-accent bg-accent/10"
                    : "bg-paper-100 dark:bg-space-800/60"
                }`}
              >
                {isToday && (
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-accent">
                    {t.us.today_label}
                  </div>
                )}
                <div className="text-xs font-medium text-paper-600 dark:text-star-300">
                  {day.day_label}
                </div>
                <div className="my-1 flex justify-center">
                  <WeatherMoodIcon emoji={day.emoji} />
                </div>
                <div className="mb-1 flex justify-center gap-0.5">
                  {energyBars.map((filled, j) => (
                    <div
                      key={j}
                      className={`h-2 w-1 rounded-full ${
                        filled
                          ? day.energy >= 4
                            ? "bg-success"
                            : day.energy <= 2
                              ? "bg-danger"
                              : "bg-accent"
                          : "bg-current opacity-20"
                      }`}
                    />
                  ))}
                </div>
                <div className="line-clamp-2 text-xs text-paper-600 dark:text-star-300">
                  {day.vibe}
                </div>
              </div>
            );
          })}
        </div>
      </LlmSection>

      {/* Season Ahead — 周期与关键日期文档流 */}
      <LlmSection
        title={t.us.season_ahead_title}
        intro={t.us.season_ahead_subtitle}
      >
        <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
          {weatherForecast.periods.map((period, i) => {
            const label =
              period.type === "high_intensity"
                ? t.us.period_high
                : period.type === "sweet_spot"
                  ? t.us.period_sweet
                  : t.us.period_deep;
            return (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-paper-500 dark:text-star-400">
                  <span className="text-paper-900 dark:text-star-50">
                    {label}
                  </span>
                  <span>
                    {period.start_date} &rarr; {period.end_date}
                  </span>
                </div>
                <LlmProse text={period.description} />
                {period.advice && (
                  <p className="mt-2 font-serif italic text-paper-600 dark:text-star-300">
                    {period.advice}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper-500 dark:text-star-400">
            {t.us.critical_dates_title}
          </p>
          <div className="divide-y divide-paper-900/[0.08] dark:divide-star-50/[0.08]">
            {weatherForecast.critical_dates.map((date, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-sm text-accent">
                    {date.date}
                  </span>
                  <span className="text-[0.9375rem] text-paper-900 dark:text-star-50">
                    {date.event}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-success">
                      {t.us.dates_dos}
                    </p>
                    <LlmList items={date.dos} />
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-danger">
                      {t.us.dates_donts}
                    </p>
                    <LlmList items={date.donts} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </LlmSection>
    </LlmDoc>
  );
};
