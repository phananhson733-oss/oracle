// INPUT: React、记录数据与主题（含 1280px 解读布局扩展）。
// OUTPUT: 导出记录详情弹窗（含浅色模式对比度优化）。
// POS: CBT 详情组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React from 'react';
import { CBTRecord } from './types';
import { ArrowLeft } from 'lucide-react';
import ReportDashboard from './ReportDashboard';
import { useLanguage, useTheme } from '../UIComponents';

interface RecordDetailModalProps {
  record: CBTRecord;
  onClose: () => void;
  onUpdate: (updated: CBTRecord) => void;
}

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose, onUpdate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (!record.analysis) return null;

  return (
    <div className={`fixed inset-0 z-[150] flex flex-col overflow-hidden animate-fade-in ${isLight ? 'bg-paper-100' : 'bg-space-950'}`}>
      {/* 简化的顶部导航 */}
      <div className={`sticky top-0 z-20 px-6 py-4 flex items-center justify-between ${isLight ? 'bg-paper-100/95 backdrop-blur' : 'bg-space-950/95 backdrop-blur'}`}>
        <button onClick={onClose} className={`flex items-center gap-2 transition-all ${isLight ? 'text-paper-600 hover:text-gold-700' : 'text-star-400 hover:text-gold-400'}`}>
          <ArrowLeft size={18} />
          <span className="text-sm">{t.journal.back_btn}</span>
        </button>
        <div className={`text-xs ${isLight ? 'text-gold-600' : 'text-gold-400'}`}>
          {new Date(record.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* 内容区域 - 单列布局 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* 报告仪表盘 */}
          <section className="animate-in slide-in-from-bottom-4 duration-700">
            <ReportDashboard record={record} report={record.analysis} onUpdate={onUpdate} onClose={onClose} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailModal;
