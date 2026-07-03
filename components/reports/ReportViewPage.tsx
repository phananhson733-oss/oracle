// INPUT: React、报告客户端与 UI 组件依赖（含纸感映射、报告卡片左侧强调样式与对比度修正）。
// OUTPUT: 导出报告详情页面组件（含统一左侧色带、分段展开与主题化分隔线）。
// POS: 报告详情页面组件（含纸感映射与分隔线对比度修正）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, useLanguage, Container, Card, ActionButton } from '../UIComponents';
import { getReport, generateReport, Report, ReportSection, REPORT_DISPLAY } from '../../services/reportClient';
import { ArrowLeft, Download, Share2, RefreshCw, ChevronDown, ChevronUp, Star, Lightbulb } from 'lucide-react';

const ReportViewPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const translations = {
    zh: {
      loading: '加载中...',
      generating: '正在生成报告...',
      notFound: '报告未找到',
      back: '返回',
      download: '下载 PDF',
      share: '分享',
      regenerate: '重新生成',
      highlights: '要点',
      advice: '建议',
      generatedAt: '生成于',
    },
    en: {
      loading: 'Loading...',
      generating: 'Generating report...',
      notFound: 'Report not found',
      back: 'Back',
      download: 'Download PDF',
      share: 'Share',
      regenerate: 'Regenerate',
      highlights: 'Key Points',
      advice: 'Advice',
      generatedAt: 'Generated',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getReport(reportId);
      setReport(data);

      // Auto-expand first 3 sections
      if (data.content?.sections) {
        const firstThree = data.content.sections.slice(0, 3).map(s => s.id);
        setExpandedSections(new Set(firstThree));
      }
    } catch (err) {
      setError(tr.notFound);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!report) return;
    setGenerating(true);

    try {
      const newReport = await generateReport(report.type, lang);
      setReport(newReport);
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-gold-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className={isDark ? 'text-star-300' : 'text-paper-500'}>{tr.loading}</p>
        </div>
      </Container>
    );
  }

  if (error || !report) {
    return (
      <Container>
        <div className="text-center py-20">
          <p className={`text-lg mb-4 ${isDark ? 'text-star-300' : 'text-paper-500'}`}>{error || tr.notFound}</p>
          <ActionButton variant="secondary" onClick={() => navigate('/reports')}>
            {tr.back}
          </ActionButton>
        </div>
      </Container>
    );
  }

  const display = REPORT_DISPLAY[report.type];
  const sections = report.content?.sections || [];

  return (
    <Container>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/reports')}
          className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-star-400 hover:text-star-200' : 'text-paper-500 hover:text-paper-700'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {tr.back}
        </button>

        {/* Report header card */}
        <Card className="overflow-hidden border-l border-l-gold-500/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{display.icon}</span>
              <div>
                <h1 className={`text-2xl md:text-3xl font-serif font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                  {report.title || (lang === 'zh' ? display.nameZh : display.nameEn)}
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
                  {tr.generatedAt} {new Date(report.generatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-2">
              {report.pdfUrl && (
                <ActionButton variant="secondary" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  {tr.download}
                </ActionButton>
              )}
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={handleRegenerate}
                disabled={generating}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                {tr.regenerate}
              </ActionButton>
            </div>
          </div>
        </Card>
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 bg-space-950/50 flex items-center justify-center z-50">
          <Card className="max-w-sm mx-4 text-center border-l border-l-gold-500/40">
            <div className="w-12 h-12 border-3 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={isDark ? 'text-star-200' : 'text-paper-700'}>{tr.generating}</p>
          </Card>
        </div>
      )}

      {/* Report sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            index={index}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            isDark={isDark}
            lang={lang}
            tr={tr}
          />
        ))}
      </div>

      {/* Mobile actions */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-space-950 to-transparent">
        <div className="flex gap-2">
          {report.pdfUrl && (
            <ActionButton variant="secondary" className="flex-1">
              <Download className="w-4 h-4 mr-1" />
              {tr.download}
            </ActionButton>
          )}
          <ActionButton
            variant="primary"
            onClick={handleRegenerate}
            disabled={generating}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
            {tr.regenerate}
          </ActionButton>
        </div>
      </div>
    </Container>
  );
};

// Section card component
const ReportSectionCard: React.FC<{
  section: ReportSection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
  lang: string;
  tr: Record<string, string>;
}> = ({ section, index, isExpanded, onToggle, isDark, lang, tr }) => {
  return (
    <Card className="overflow-hidden border-l border-l-gold-500/40">
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isDark ? 'bg-space-700 text-star-200' : 'bg-paper-200 text-paper-600'
          }`}>
            {index + 1}
          </span>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
            {section.title}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-5 h-5 ${isDark ? 'text-star-400' : 'text-paper-400'}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${isDark ? 'text-star-400' : 'text-paper-400'}`} />
        )}
      </button>

      {/* Section content */}
          {isExpanded && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gold-500/15' : 'border-paper-300'}`}>
              {/* Rating if available */}
          {section.rating !== undefined && (
            <div className="flex items-center gap-2 mb-4">
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < section.rating!
                      ? 'text-gold-500 fill-gold-500'
                      : isDark
                      ? 'text-space-600'
                      : 'text-paper-300'
                  }`}
                />
              ))}
              <span className={`text-sm ml-2 ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
                {section.rating}/10
              </span>
            </div>
          )}

          {/* Main content */}
          <div className={`prose prose-sm max-w-none font-reading ${isDark ? 'prose-invert' : ''}`}>
            <p className={`leading-relaxed ${isDark ? 'text-star-200' : 'text-paper-600'}`}>
              {section.content}
            </p>
          </div>

          {/* Highlights - 移除外框，直接显示内容 */}
          {section.highlights && section.highlights.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-gold-500" />
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-gold-400' : 'text-gold-700'}`}>
                  {tr.highlights}
                </span>
              </div>
              <div className="space-y-1.5">
                {section.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className={`mt-2 w-1 h-1 rounded-full shrink-0 ${isDark ? 'bg-gold-400' : 'bg-gold-600'}`} />
                    <span className={isDark ? 'text-star-200' : 'text-paper-700'}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advice - 移除外框，使用字色突出 */}
          {section.advice && section.advice.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-accent" />
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-accent' : 'text-gold-700'}`}>
                  {tr.advice}
                </span>
              </div>
              <div className="space-y-1.5">
                {section.advice.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className={`font-mono text-xs mt-0.5 ${isDark ? 'text-space-600' : 'text-paper-400'}`}>0{i + 1}</span>
                    <span className={isDark ? 'text-star-200' : 'text-paper-700'}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ReportViewPage;
