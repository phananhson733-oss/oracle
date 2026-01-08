// INPUT: Natal API 路由。
// OUTPUT: 导出 natal 路由（含 overview/core/dimension/technical 与单语言输出）。
// POS: Natal 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from 'express';
import type {
  BirthInput,
  Language,
  NatalChartResponse,
  NatalOverviewResponse,
  NatalCoreThemesResponse,
  NatalDimensionResponse,
  NatalTechnicalResponse,
} from '../types/api.js';
import { ephemerisService } from '../services/ephemeris.js';
import { AIUnavailableError, generateAIContent } from '../services/ai.js';
import { resolveLocation } from '../services/geocoding.js';

export const natalRouter = Router();

async function parseBirthInput(query: Record<string, unknown>): Promise<BirthInput> {
  const city = query.city as string;
  const geo = await resolveLocation(city);
  const latParam = query.lat;
  const lonParam = query.lon;
  return {
    date: query.date as string,
    time: query.time as string | undefined,
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

// GET /api/natal/chart - 仅返回 Real Data
natalRouter.get('/chart', async (req, res) => {
  try {
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const chart = await ephemerisService.calculateNatalChart(birth);
    res.json({ chart } as NatalChartResponse);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/natal/overview - Real Data + AI 内容
natalRouter.get('/overview', async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const chart = await ephemerisService.calculateNatalChart(birth);
    const result = await generateAIContent({
      promptId: 'natal-overview',
      context: { chart },
      lang,
    });
    res.json({ chart, lang: result.lang, content: result.content } as NatalOverviewResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/natal/core-themes
natalRouter.get('/core-themes', async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const chart = await ephemerisService.calculateNatalChart(birth);
    const result = await generateAIContent({
      promptId: 'natal-core-themes',
      context: { chart },
      lang,
    });
    res.json({ chart, lang: result.lang, content: result.content } as NatalCoreThemesResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/natal/dimension
natalRouter.get('/dimension', async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const dimension = req.query.dimension as string;
    const chart = await ephemerisService.calculateNatalChart(birth);
    const result = await generateAIContent({
      promptId: 'natal-dimension',
      context: { chart, dimension },
      lang,
    });
    res.json({ chart, lang: result.lang, content: result.content } as NatalDimensionResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/natal/technical
natalRouter.get('/technical', async (req, res) => {
  try {
    const lang = resolveLang(req.query.lang);
    const birth = await parseBirthInput(req.query as Record<string, unknown>);
    const chart = await ephemerisService.calculateNatalChart(birth);
    const result = await generateAIContent({
      promptId: 'natal-technical',
      context: { chart },
      lang,
    });
    res.json({ chart, lang: result.lang, content: result.content } as NatalTechnicalResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});
