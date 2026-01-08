// INPUT: 后端 API 调用与 prompt key 映射（单语言 payload）。
// OUTPUT: 导出内容生成函数（含问答类别透传与单语言解析）。
// POS: AI 内容服务层。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Language } from '../types';
import {
  fetchAskAnswer,
  fetchCycleNaming,
  fetchDailyDetail,
  fetchDailyForecast,
  fetchNatalCoreThemes,
  fetchNatalDimension,
  fetchNatalOverview,
  fetchNatalTechnical,
  fetchSynastry,
} from './apiClient';

/**
 * This service now delegates to backend APIs.
 * The backend handles AI generation via DeepSeek.
 */
export const generateContent = async <T>(
  promptKey: string,
  data: Record<string, unknown>,
  language: Language = 'zh'
): Promise<T | null> => {
  try {
    const pickContent = (result?: { content?: T; lang?: Language }) => {
      if (!result?.content) return null;
      return result.content;
    };

    // Map prompt keys to API calls
    if (promptKey === 'NATAL_OVERVIEW' && data.profile) {
      const result = await fetchNatalOverview(data.profile as Parameters<typeof fetchNatalOverview>[0], language);
      return pickContent(result);
    }

    if (promptKey === 'CORE_THEMES' && data.profile) {
      const result = await fetchNatalCoreThemes(data.profile as Parameters<typeof fetchNatalCoreThemes>[0], language);
      return pickContent(result);
    }

    if (promptKey === 'DIMENSION_REPORT' && data.profile && (data.dimension || data.dimension_key)) {
      const result = await fetchNatalDimension(
        data.profile as Parameters<typeof fetchNatalDimension>[0],
        String(data.dimension || data.dimension_key),
        language
      );
      return pickContent(result);
    }

    if (promptKey === 'NATAL_TECHNICAL' && data.profile) {
      const result = await fetchNatalTechnical(data.profile as Parameters<typeof fetchNatalTechnical>[0], language);
      return pickContent(result);
    }

    if (promptKey === 'DAILY_FORECAST' && data.profile && data.date) {
      const result = await fetchDailyForecast(
        data.profile as Parameters<typeof fetchDailyForecast>[0],
        data.date as string,
        language
      );
      return pickContent(result);
    }

    if (promptKey === 'DAILY_PUBLIC' && data.profile && data.date) {
      const result = await fetchDailyForecast(
        data.profile as Parameters<typeof fetchDailyForecast>[0],
        data.date as string,
        language
      );
      return pickContent(result);
    }

    if (promptKey === 'DAILY_DETAIL' && data.profile && data.date) {
      const result = await fetchDailyDetail(
        data.profile as Parameters<typeof fetchDailyDetail>[0],
        data.date as string,
        language
      );
      return pickContent(result);
    }

    if (promptKey === 'CYCLE_CARD_NAMING' && (data.cycle || data.input_json)) {
      const cycle = (data.cycle || data.input_json) as Parameters<typeof fetchCycleNaming>[0];
      const result = await fetchCycleNaming(cycle, language);
      return pickContent(result);
    }

    if (promptKey === 'SYNASTRY_OVERVIEW' && data.profile && data.partner) {
      const result = await fetchSynastry(
        data.profile as Parameters<typeof fetchSynastry>[0],
        data.partner as Parameters<typeof fetchSynastry>[1],
        language,
        data.relationship_type as string | undefined
      );
      return pickContent(result);
    }

    if (promptKey === 'ASK_ANSWER' && data.profile && data.question) {
      const category = data.category as string | undefined;
      const result = await fetchAskAnswer(
        data.profile as Parameters<typeof fetchAskAnswer>[0],
        data.question as string,
        (data.context as string | undefined) ?? (data.context_json as string | undefined),
        language,
        category
      );
      return pickContent(result);
    }

    console.warn(`[AstroMind] Unhandled prompt key: ${promptKey}`);
    return null;
  } catch (error) {
    console.error('Error generating content', error);
    return null;
  }
};
