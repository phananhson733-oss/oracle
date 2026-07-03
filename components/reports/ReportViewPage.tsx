// INPUT: React、报告客户端（getReport/generateReport/REPORT_DISPLAY）、UI 组件（Container/Card/ActionButton）与 LlmDoc 文档式排版原语。
// OUTPUT: 导出报告详情页面组件（分节展开走单列文档流：发丝线分隔 + mono 眉标 + LlmProse/LlmList 内容）。
// POS: 报告详情页面组件；LLM 报告正文统一走文档式排版。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, useLanguage, Container, Card, ActionButton } from '../UIComponents';
import { getReport, generateReport, Report, ReportSection, REPORT_DISPLAY } from '../../services/reportClient';
import { ArrowLeft, Download, Share2, RefreshCw, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { LlmDoc, LlmProse, LlmList, LLM_EYEBROW_CLASS } from '../llm/LlmDoc';

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

      {/* Report sections — single-column document flow, hairline-separated */}
      <LlmDoc>
        {sections.map((section, index) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            index={index}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            isDark={isDark}
            tr={tr}
          />
        ))}
      </LlmDoc>

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

// Section as a document-flow accordion row: hairline top border, mono index +
// serif title toggle, then LlmProse / LlmList content when expanded.
const ReportSectionCard: React.FC<{
  section: ReportSection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
  tr: Record<string, string>;
}> = ({ section, index, isExpanded, onToggle, isDark, tr }) => {
  return (
    <section className={index === 0 ? 'pb-2' : 'border-t border-paper-900/10 dark:border-star-50/10 pt-6 pb-2'}>
      {/* Section header (accordion toggle) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="shrink-0 font-mono text-[11px] font-medium tracking-[0.14em] text-paper-500 dark:text-star-400">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={`text-lg font-medium tracking-[-0.01em] ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
            {section.title}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-5 h-5 shrink-0 ${isDark ? 'text-star-400' : 'text-paper-400'}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 shrink-0 ${isDark ? 'text-star-400' : 'text-paper-400'}`} />
        )}
      </button>

      {/* Section content */}
      {isExpanded && (
        <div className="mt-4 space-y-5">
          {/* Rating — kept as visualization, converged to one mono row */}
          {section.rating !== undefined && (
            <div className="flex items-center gap-1.5">
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < section.rating!
                      ? 'text-accent fill-accent'
                      : isDark
                      ? 'text-space-600'
                      : 'text-paper-300'
                  }`}
                />
              ))}
              <span className={`${LLM_EYEBROW_CLASS} ml-2`}>{section.rating}/10</span>
            </div>
          )}

          {/* Main content — restore paragraphs from the collapsed single field */}
          <LlmProse text={section.content} className="font-reading" />

          {/* Highlights — unframed accent-dot list */}
          {section.highlights && section.highlights.length > 0 && (
            <div>
              <p className={`${LLM_EYEBROW_CLASS} mb-1.5`}>{tr.highlights}</p>
              <LlmList items={section.highlights} />
            </div>
          )}

          {/* Advice — unframed ordered list */}
          {section.advice && section.advice.length > 0 && (
            <div>
              <p className={`${LLM_EYEBROW_CLASS} mb-1.5`}>{tr.advice}</p>
              <LlmList items={section.advice} ordered />
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ReportViewPage;
