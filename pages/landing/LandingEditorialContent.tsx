// INPUT: landingContent 的语言化长内容/FAQ、主题与 React Router。
// OUTPUT: 导出首页可见的工具说明、阅读方法、隐私说明、内部链接与同源 FAQ 区块。
// POS: 首页首屏外的轻量编辑内容层，不依赖重型交互 chunk；若更新此文件，务必更新本头注释与 pages/landing/FOLDER.md。

import React from "react";
import { Link } from "react-router-dom";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { landingFaqs } from "./landingContent";

const LandingEditorialContent: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const lang = language === "zh" ? "zh" : "en";
  const isDark = theme === "dark";
  const text = isDark ? "text-star-300" : "text-paper-700";
  const border = isDark ? "border-gold-500/20" : "border-paper-300";
  const linkClass =
    "font-semibold text-gold-500 underline decoration-gold-500/40 underline-offset-4 hover:decoration-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

  return (
    <div
      className={`border-y ${border} ${isDark ? "bg-space-900" : "bg-paper-100"}`}
    >
      <section className="mx-auto max-w-5xl px-6 py-20 md:px-12 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
          {lang === "zh" ? "从数据到理解" : "From data to understanding"}
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-3xl font-semibold md:text-5xl">
          {lang === "zh"
            ? "如何使用免费出生星盘"
            : "How to use your free birth chart"}
        </h2>
        <div className={`mt-10 grid gap-8 text-base leading-8 md:grid-cols-3 ${text}`}>
          <div>
            <h3 className="mb-3 font-serif text-xl font-semibold text-current">
              {lang === "zh" ? "一、生成准确数据" : "1. Calculate accurate data"}
            </h3>
            <p>
              {lang === "zh"
                ? "输入出生日期，并尽可能补充准确时间与地点。计算器会展示行星落座、角度、宫位和主要相位；时间未知时，不会把依赖时间的数据包装成确定事实。"
                : "Enter your birth date and, when available, an accurate time and place. The calculator lays out planetary signs, angles, houses, and major aspects while keeping time-sensitive positions clearly qualified when the time is unknown."}
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-xl font-semibold text-current">
              {lang === "zh" ? "二、先看结构" : "2. Read the structure first"}
            </h3>
            <p>
              {lang === "zh"
                ? "从太阳、月亮与上升开始，再观察元素、模式与重复主题。不要把单个落点当成整个人；星盘的意义来自多项配置如何共同出现。"
                : "Start with the Sun, Moon, and Ascendant, then notice element balance, modalities, and repeated themes. Avoid treating one placement as the whole person; a chart becomes useful through the way several factors qualify one another."}
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-xl font-semibold text-current">
              {lang === "zh" ? "三、把象征带回生活" : "3. Bring symbols back to life"}
            </h3>
            <p>
              {lang === "zh"
                ? "把解读当作提问，而不是判决：什么情境会触发这种模式？它何时有帮助，何时会受限？用记录和真实经验检验它。"
                : "Treat interpretation as a question rather than a verdict: which situations evoke this pattern, when does it help, and where does it become limiting? Test the language against observation, journaling, and lived experience."}
            </p>
          </div>
        </div>
        <p className={`mt-10 max-w-3xl leading-8 ${text}`}>
          {lang === "zh" ? "准备开始？使用" : "Ready to begin? Open the "}
          <Link to={`/${lang}/birth-chart-calculator`} className={linkClass}>
            {lang === "zh" ? "免费出生星盘计算器" : "free birth chart calculator"}
          </Link>
          {lang === "zh" ? "，或先阅读" : ", or first read the "}
          <Link to={`/${lang}/wiki/how-to-read-birth-chart`} className={linkClass}>
            {lang === "zh" ? "出生星盘入门指南" : "step-by-step birth chart guide"}
          </Link>
          {lang === "zh" ? "。" : "."}
        </p>
      </section>

      <section
        id="homepage-faq"
        aria-labelledby="homepage-faq-heading"
        className={`mx-auto max-w-5xl border-t px-6 py-20 md:px-12 md:py-24 ${border}`}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-500">
          {lang === "zh" ? "常见问题" : "Common questions"}
        </p>
        <h2
          id="homepage-faq-heading"
          className="mt-4 font-serif text-3xl font-semibold md:text-5xl"
        >
          {lang === "zh" ? "出生星盘与工具 FAQ" : "Birth chart and tools FAQ"}
        </h2>
        <div className={`mt-10 divide-y ${border}`}>
          {landingFaqs[lang].map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500">
                {faq.question}
              </summary>
              <p className={`max-w-3xl pt-4 leading-8 ${text}`}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingEditorialContent;
