// INPUT: CBT 记录与后端分析接口（snake_case 输出，单语言 payload）。
// OUTPUT: 导出 CBT 分析调用函数（失败时上抛，前端提示）。
// POS: CBT 内容分析服务（后端代理）。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { CBTRecord, AnalysisReport } from '../../components/cbt/types';
import { UserProfile } from '../../types';
import { fetchCBTAnalysis } from '../apiClient';

export const analyzeCBTRecord = async (record: CBTRecord, profile: UserProfile): Promise<AnalysisReport> => {
  const lang = (localStorage.getItem('astro_lang') as 'zh' | 'en') || 'zh';
  const result = await fetchCBTAnalysis(
    profile,
    {
      situation: record.situation,
      moods: record.moods,
      automaticThoughts: record.automaticThoughts,
      hotThought: record.hotThought,
      evidenceFor: record.evidenceFor,
      evidenceAgainst: record.evidenceAgainst,
      balancedEntries: record.balancedEntries,
    },
    lang
  );
  if (!result?.content) {
    throw new Error('AI unavailable');
  }
  return result.content;
};
