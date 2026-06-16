// INPUT: TimelinePage（复用月度能量时间轴主体）、useLanguage/useAuth、固定示例出生盘 DEMO_PROFILE。
// OUTPUT: 公开（免登录）Energy Timeline 示例页 /:lang/energy-timeline——SEO 获客落点，渲染示例盘的真实时间轴 + 注册 CTA。
// POS: 受 isPublicRoute 白名单保护的可索引 SEO demo 页（设计 §13）。静态 stub（generate-seo-pages.mjs）供爬虫读关键词正文，
//      本组件水合后接管交互；纵轴=中性能量强度、无吉凶预测，与 /timeline 同一安全叙事。

import React from "react";
import type { UserProfile } from "../types";
import { useLanguage } from "../components/UIComponents";
import { useAuth } from "../contexts/AuthContext";
import TimelinePage from "./TimelinePage";

// 固定示例盘（中性、非真实在世人物）：用于公开 demo，让访客/爬虫看到一张真实的时间轴而非空态。
// 月度时间轴端点是匿名友好的纯计算接口，故无需登录即可取数。归一化按本盘自身分布，示例盘照样铺满 0-100。
export const DEMO_PROFILE: UserProfile = {
  userId: "demo",
  name: "Sample chart",
  birthDate: "1990-07-04",
  birthTime: "08:30",
  birthCity: "New York, USA",
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  accuracyLevel: "exact",
  focusTags: [],
};

const DEMO_COPY = {
  en: {
    badge: "Sample chart",
    line: "This is a live sample timeline for a fixed example chart. Build your own from your birth details — it's free.",
    cta: "Create your own timeline",
  },
  zh: {
    badge: "示例星盘",
    line: "这是一张固定示例盘的真实能量时间轴。用你自己的出生信息生成属于你的时间轴——免费。",
    cta: "生成我的时间轴",
  },
} as const;

const EnergyTimelineDemoPage: React.FC = () => {
  const { language } = useLanguage();
  const { openLoginModal } = useAuth();
  const d = DEMO_COPY[language === "zh" ? "zh" : "en"];

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-psycho-200 bg-psycho-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-block rounded-full bg-psycho-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            {d.badge}
          </span>
          <p className="mt-1.5 text-sm text-slate-600">{d.line}</p>
        </div>
        <button
          onClick={() => openLoginModal?.()}
          className="shrink-0 rounded-lg bg-psycho-600 px-4 py-2 text-sm font-medium text-white hover:bg-psycho-700"
        >
          {d.cta}
        </button>
      </div>

      {/* 复用完整月度时间轴主体（蜡烛 + 当日摘要 + 安全 onboarding）；demo 模式下当日解读改为注册 CTA。 */}
      <TimelinePage
        profile={DEMO_PROFILE}
        demo
        onUpsell={() => openLoginModal?.()}
      />
    </div>
  );
};

export default EnergyTimelineDemoPage;
