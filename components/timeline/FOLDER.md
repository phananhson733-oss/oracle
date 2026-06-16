<!-- INPUT: /api/transit/timeline 响应（TimelineResponse）、useLanguage/useTheme、fetchDailyDetail、FrameworkDisclaimer。 -->
<!-- OUTPUT: 月度能量时间轴（月度 K 线）的前端组件群（蜡烛图 / 图例 / 安全 onboarding / 当日解读抽屉 / 文案）。 -->
<!-- POS: components/timeline 子目录索引；若更新此目录文件，务必更新本 FOLDER.md 与各文件头注释。 -->
一旦我所属的文件夹有所变化，请更新我。

# 文件夹：components/timeline

架构概要
- 月度 K 线主视图与交互组件。页面编排在 `pages/TimelinePage.tsx`。
- 蜡烛=区间摘要（start/peak/dip/end），非金融 OHLC；纵轴=中性能量强度，仅与自身比较。
- 安全叙事（Empowerment over Fatalism）：onboarding + 图例 + 文案均无吉凶/确定性语言。

文件清单
- FOLDER.md｜地位：目录索引文档｜功能：记录 timeline 组件结构。
- copy.ts｜地位：i18n 文案字典｜功能：getTimelineCopy(language) 双语文案（含安全叙事），集中于此避免触碰并行修改中的 constants.ts。
- TimelineChart.tsx｜地位：主图｜功能：自绘 SVG 蜡烛图（wick=dip..peak、body=start..end）+ MA 平滑 + 节点气泡；psycho(harmony)/mystic(tension) 配色，禁 success/danger。
- TimelineLegend.tsx｜地位：图例｜功能：能量=loud/quiet 非好坏、flow/friction/quiet 三色说明、仅与自身比较。
- TimelineOnboarding.tsx｜地位：安全 onboarding｜功能：首访 3 屏（loud vs quiet / 两种能量 / 节奏非命运），localStorage 标记一次。
- TimelineDetailDrawer.tsx｜地位：当日解读抽屉｜功能：点天后 fetchDailyDetail 复用 daily/detail 流并渲染。

近期更新
- 2026-06-16 新建：#3 蜡烛主视图 + #4 点天抽屉 + #5 安全叙事（onboarding/图例/disclaimer）。vite build 通过。
