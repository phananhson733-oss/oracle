// INPUT: Daily API 路由。
// OUTPUT: 导出 daily 路由（含 detail 与单语言输出）。
// POS: Daily 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from 'express';
import type { BirthInput, DailyResponse, DailyDetailResponse, Language } from '../types/api.js';
import { ephemerisService } from '../services/ephemeris.js';
import { AIUnavailableError, generateAIContent } from '../services/ai.js';
import { resolveLocation } from '../services/geocoding.js';

export const dailyRouter = Router();

async function parseBirthInput(query: Record<string, unknown>): Promise<BirthInput> {
  const city = query.city as string;
  const geo = await resolveLocation(city);
  const latParam = query.lat;
  const lonParam = query.lon;
  return {
    date: query.birthDate as string,
    time: query.birthTime as string | undefined,
    city: geo.city,
    lat: latParam === undefined || latParam === '' ? geo.lat : Number(latParam),
    lon: lonParam === undefined || lonParam === '' ? geo.lon : Number(lonParam),
    timezone: query.timezone as string || geo.timezone,
    accuracy: (query.accuracy as BirthInput['accuracy']) || 'exact',
  };
}

function resolveLang(value: unknown): Language {
  return value === 'en' ? 'en' : 'zh';
}

// GET /api/daily - 每日运势
dailyRouter.get('/', async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const date = new Date(req.query.date as string || new Date().toISOString().split('T')[0]);

    const [chart, transits] = await Promise.all([
      ephemerisService.calculateNatalChart(birth),
      ephemerisService.calculateTransits(birth, date),
    ]);

    const result = await generateAIContent({
      promptId: 'daily-forecast',
      context: { chart, transits, date: date.toISOString().split('T')[0] },
      lang,
    });

    res.json({ transits, lang: result.lang, content: result.content } as DailyResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/daily/detail - 详细日运
dailyRouter.get('/detail', async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const date = new Date(req.query.date as string || new Date().toISOString().split('T')[0]);

    const [chart, transits] = await Promise.all([
      ephemerisService.calculateNatalChart(birth),
      ephemerisService.calculateTransits(birth, date),
    ]);

    const result = await generateAIContent({
      promptId: 'daily-detail',
      context: { chart, transits, date: date.toISOString().split('T')[0] },
      lang,
    });

    res.json({ transits, lang: result.lang, content: result.content } as DailyDetailResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});
