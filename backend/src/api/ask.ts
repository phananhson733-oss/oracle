// INPUT: Ask API 路由。
// OUTPUT: 导出 ask 路由（含类别上下文与单语言输出）。
// POS: Ask 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from 'express';
import type { AskRequest, AskResponse, AskChartType, Language, TransitData } from '../types/api.js';
import { ephemerisService } from '../services/ephemeris.js';
import { AIUnavailableError, generateAIContentWithMeta } from '../services/ai.js';

export const askRouter = Router();

// Determine chart type based on category
// time_cycles questions need transit chart (includes natal + current transits)
const getChartType = (category?: string): AskChartType => {
  if (category === 'time_cycles') return 'transit';
  return 'natal';
};

// POST /api/ask - 问答
askRouter.post('/', async (req, res) => {
  try {
    const { birth, question, context, category, lang: langInput } = req.body as AskRequest;
    const lang: Language = langInput === 'en' ? 'en' : 'zh';
    const chartType = getChartType(category);

    // Calculate natal chart (always needed)
    const chart = await ephemerisService.calculateNatalChart(birth);

    // Calculate transits if needed for time_cycles questions
    let transits: TransitData | undefined;
    if (chartType === 'transit') {
      transits = await ephemerisService.calculateTransits(birth, new Date());
    }

    const { content, meta } = await generateAIContentWithMeta({
      promptId: 'ask-answer',
      context: { chart, transits, question, context, category },
      lang,
    });

    res.json({
      lang: content.lang,
      content: content.content,
      meta,
      chart,
      transits,
      chartType,
    } as AskResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});
