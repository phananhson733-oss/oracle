// INPUT: 后端 crisis_detected 响应（含 helpline + 双语 message）与语言/主题上下文。
// OUTPUT: 求助热线卡片组件（双语标题、抚慰文案、tel: 链接、外部 URL）。
// POS: CBT 危机短路 UI；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import { CBTCrisisResponse } from './types';
import { useLanguage, useTheme } from '../UIComponents';
import { Phone, ExternalLink, LifeBuoy, ArrowLeft } from 'lucide-react';

interface CrisisCardProps {
  crisis: CBTCrisisResponse;
  onClose?: () => void;
}

/**
 * 在分析端点命中危机关键词时渲染。绝不展示原 LLM 分析结果。
 * 数据由后端注入（区域化热线 + 双语文案），前端按当前 UI 语言选择文案分支。
 */
const CrisisCard: React.FC<CrisisCardProps> = ({ crisis, onClose }) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const lang = language === 'zh' ? 'zh' : 'en';
  const supportiveMessage = lang === 'zh' ? crisis.message_zh : crisis.message_en;
  const helplineName =
    lang === 'zh' ? crisis.helpline.name_zh : crisis.helpline.name_en;

  // i18n fallback (constants.ts may not yet include cbt.crisis keys; provide safe defaults).
  const cbtT = (t as { cbt?: { crisis?: Record<string, string> } }).cbt?.crisis;
  const title =
    cbtT?.title ??
    (lang === 'zh' ? '如果你正在经历困难' : 'If you are going through a hard time');
  const callLabel =
    cbtT?.cta_call ?? (lang === 'zh' ? '立即拨打' : 'Call now');
  const moreLabel =
    cbtT?.cta_more ?? (lang === 'zh' ? '了解更多支持资源' : 'More support resources');
  const backLabel =
    cbtT?.cta_back ??
    (lang === 'zh' ? '我安全，返回日记' : "I'm safe, back to journal");

  const surfaceTone = isLight
    ? 'bg-paper-100 border-gold-600/40'
    : 'bg-space-900/90 border-gold-500/30';
  const headingTone = isLight ? 'text-gold-800' : 'text-gold-200';
  const bodyTone = isLight ? 'text-star-200' : 'text-star-50';
  const helplineBoxTone = isLight
    ? 'bg-paper-50 border-paper-300'
    : 'bg-space-800/40 border-gold-500/15';
  const phoneButtonTone = isLight
    ? 'bg-gold-600 text-paper-50 hover:bg-gold-700'
    : 'bg-gold-500 text-space-950 hover:bg-gold-400';
  const linkTone = isLight
    ? 'text-gold-700 hover:text-gold-800'
    : 'text-gold-300 hover:text-gold-200';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`max-w-xl mx-auto rounded-2xl border p-8 ${surfaceTone} shadow-xl`}
    >
      <div className="flex items-center gap-3 mb-4">
        <LifeBuoy
          size={28}
          className={isLight ? 'text-gold-700' : 'text-gold-300'}
          aria-hidden
        />
        <h2 className={`text-xl font-bold ${headingTone}`}>{title}</h2>
      </div>

      <p className={`mb-6 leading-relaxed ${bodyTone}`}>{supportiveMessage}</p>

      <div className={`rounded-xl border p-4 mb-6 ${helplineBoxTone}`}>
        <div className={`text-sm uppercase tracking-widest mb-1 ${linkTone}`}>
          {crisis.helpline.region}
        </div>
        <div className={`text-lg font-semibold mb-3 ${bodyTone}`}>
          {helplineName}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {crisis.helpline.phone ? (
            <a
              href={`tel:${crisis.helpline.phone.replace(/\s+/g, '')}`}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors ${phoneButtonTone}`}
            >
              <Phone size={18} aria-hidden />
              <span>
                {callLabel} {crisis.helpline.phone}
              </span>
            </a>
          ) : null}
          <a
            href={crisis.helpline.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${linkTone} ${
              isLight ? 'border-gold-600/40' : 'border-gold-500/30'
            }`}
          >
            <ExternalLink size={16} aria-hidden />
            <span>{moreLabel}</span>
          </a>
        </div>
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${linkTone}`}
        >
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </button>
      ) : null}
    </div>
  );
};

export default CrisisCard;
