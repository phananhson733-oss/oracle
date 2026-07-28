// INPUT: React、记录数据与主题（含 1280px 弹窗布局）。
// OUTPUT: 导出记录详情弹窗（居中弹窗、1280px 限宽、浅色模式对比度优化）。
// POS: CBT 详情组件。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。

import React from 'react';
import { CBTRecord } from './types';
import { X } from 'lucide-react';
import ReportDashboard from './ReportDashboard';
import { useLanguage, useTheme } from '../UIComponents';

interface RecordDetailModalProps {
  record: CBTRecord;
  onClose: () => void;
  onUpdate: (updated: CBTRecord) => void;
}

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose, onUpdate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (!record.analysis) return null;

  const overlayTone = isLight ? 'bg-paper-200/80' : 'bg-space-950/80';
  const containerTone = isLight ? 'bg-paper-100 border-paper-300' : 'bg-space-900 border-gold-500/20';
  const headerTone = isLight ? 'bg-paper-100 border-paper-200' : 'bg-space-900 border-gold-500/10';
  const closeBtnTone = isLight
    ? 'text-star-200 hover:text-gold-700 hover:bg-paper-200'
    : 'text-star-400 hover:text-gold-400 hover:bg-space-800';
  const dateTone = isLight ? 'text-gold-600' : 'text-gold-400';

  return (
    <div
      className={`fixed inset-0 z-[150] backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 ${overlayTone}`}
      onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-[1280px] border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${containerTone}`}>
        {/* 顶部导航 */}
        <div className={`sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b ${headerTone}`}>
          <div className={`text-sm font-medium ${dateTone}`}>
            {new Date(record.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-all ${closeBtnTone}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-8">
          <div className="max-w-4xl mx-auto">
            <ReportDashboard record={record} report={record.analysis} onUpdate={onUpdate} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailModal;
