// INPUT: 后端报告 API 客户端。
// OUTPUT: 导出报告相关 API 调用函数。
// POS: 前端报告 API 客户端；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { authFetch } from './authClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

export type ReportType = 'monthly' | 'annual' | 'career' | 'wealth' | 'love' | 'saturn_return' | 'synastry_deep';

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  highlights?: string[];
  advice?: string[];
  rating?: number;
}

export interface ReportContent {
  title: string;
  subtitle?: string;
  generatedAt: string;
  sections: ReportSection[];
  summary?: string;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  content?: ReportContent;
  pdfUrl?: string;
  generatedAt: string;
  createdAt: string;
}

export interface ReportInfo {
  type: ReportType;
  name: string;
  description: string;
  price: number;
}

export interface ReportAccess {
  hasAccess: boolean;
  existingReport: { id: string; generatedAt: string } | null;
  price: number;
}

// Get available report types
export async function getAvailableReports(): Promise<{ reports: ReportInfo[] }> {
  const res = await fetch(`${API_BASE}/reports/available`);
  if (!res.ok) throw new Error('Failed to get available reports');
  return res.json();
}

// Get user's reports
export async function getUserReports(): Promise<{ reports: Report[] }> {
  const res = await authFetch(`${API_BASE}/reports`);
  if (!res.ok) throw new Error('Failed to get reports');
  return res.json();
}

// Get a specific report
export async function getReport(reportId: string): Promise<Report> {
  const res = await authFetch(`${API_BASE}/reports/${reportId}`);
  if (!res.ok) throw new Error('Failed to get report');
  return res.json();
}

// Check access to a report type
export async function checkReportAccess(reportType: ReportType): Promise<ReportAccess> {
  const res = await authFetch(`${API_BASE}/reports/access/${reportType}`);
  if (!res.ok) throw new Error('Failed to check access');
  return res.json();
}

// Generate a report
export async function generateReport(
  reportType: ReportType,
  language: 'en' | 'zh' = 'en'
): Promise<Report & { alreadyGenerated?: boolean }> {
  const res = await authFetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType, language }),
  });

  if (!res.ok) {
    const error = await res.json();
    if (error.requiresPurchase) {
      throw new Error('REQUIRES_PURCHASE');
    }
    throw new Error(error.error || 'Failed to generate report');
  }

  return res.json();
}

// Purchase a report
export async function purchaseReport(
  reportType: ReportType
): Promise<{ success: boolean; price: number }> {
  const res = await authFetch(`${API_BASE}/reports/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to purchase report');
  }

  return res.json();
}

// Delete a report
export async function deleteReport(reportId: string): Promise<{ success: boolean }> {
  const res = await authFetch(`${API_BASE}/reports/${reportId}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error('Failed to delete report');
  return res.json();
}

// Report type display info
export const REPORT_DISPLAY: Record<ReportType, {
  icon: string;
  color: string;
  nameEn: string;
  nameZh: string;
  descEn: string;
  descZh: string;
}> = {
  monthly: {
    icon: '🌙',
    color: 'from-blue-400 to-indigo-500',
    nameEn: 'Monthly Forecast',
    nameZh: '月度运势',
    descEn: 'Detailed month-ahead predictions',
    descZh: '详细的月度预测分析',
  },
  annual: {
    icon: '🌟',
    color: 'from-gold-400 to-amber-500',
    nameEn: 'Annual Forecast',
    nameZh: '年度运势',
    descEn: 'Comprehensive year overview',
    descZh: '全面的年度运势展望',
  },
  career: {
    icon: '💼',
    color: 'from-emerald-400 to-teal-500',
    nameEn: 'Career & Profession',
    nameZh: '事业职业',
    descEn: 'Career aptitude and guidance',
    descZh: '事业潜力与职业指导',
  },
  wealth: {
    icon: '💰',
    color: 'from-yellow-400 to-orange-500',
    nameEn: 'Wealth & Finance',
    nameZh: '财富理财',
    descEn: 'Financial astrology insights',
    descZh: '财运分析与理财建议',
  },
  love: {
    icon: '💕',
    color: 'from-pink-400 to-rose-500',
    nameEn: 'Love & Relationships',
    nameZh: '爱情关系',
    descEn: 'Romantic patterns and timing',
    descZh: '感情模式与桃花运势',
  },
  saturn_return: {
    icon: '🪐',
    color: 'from-purple-400 to-violet-500',
    nameEn: 'Saturn Return',
    nameZh: '土星回归',
    descEn: 'Navigate your Saturn Return',
    descZh: '土星回归期深度解读',
  },
  synastry_deep: {
    icon: '💫',
    color: 'from-rose-400 to-pink-500',
    nameEn: 'Synastry Deep Report',
    nameZh: '合盘深度报告',
    descEn: 'Comprehensive compatibility analysis',
    descZh: '双人命盘深度兼容分析',
  },
};
