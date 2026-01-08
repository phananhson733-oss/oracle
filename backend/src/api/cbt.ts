// INPUT: CBT API 路由。
// OUTPUT: 导出 cbt 路由（含 AI 分析与单语言输出）。
// POS: CBT 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from 'express';
import type { BirthInput, CBTAnalysisResponse, Language } from '../types/api.js';
import { ephemerisService } from '../services/ephemeris.js';
import { AIUnavailableError, generateAIContent } from '../services/ai.js';
import { cacheService } from '../cache/redis.js';
import { resolveLocation } from '../services/geocoding.js';

export const cbtRouter = Router();

// CBT 记录保留 3 个月（秒）
const CBT_RETENTION_TTL = 90 * 24 * 60 * 60;

interface CBTRecord {
  id: string;
  timestamp: number;
  situation: string;
  moods: Array<{ id: string; name: string; initialIntensity: number; finalIntensity?: number }>;
  automaticThoughts: string[];
  hotThought: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  balancedEntries: Array<{ id: string; text: string; belief: number }>;
  analysis?: unknown;
}

async function parseBirthInput(body: Record<string, unknown>): Promise<BirthInput> {
  const birth = body.birth as Record<string, unknown>;
  const city = birth.city as string;
  const geo = await resolveLocation(city);
  const latParam = birth.lat;
  const lonParam = birth.lon;
  return {
    date: birth.date as string,
    time: birth.time as string | undefined,
    city: geo.city,
    lat: latParam === undefined || latParam === '' ? geo.lat : Number(latParam),
    lon: lonParam === undefined || lonParam === '' ? geo.lon : Number(lonParam),
    timezone: birth.timezone as string || geo.timezone,
    accuracy: (birth.accuracy as BirthInput['accuracy']) || 'exact',
  };
}

// POST /api/cbt/analysis - CBT 分析
cbtRouter.post('/analysis', async (req, res) => {
  try {
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === 'en' ? 'en' : 'zh';
    const birth = await parseBirthInput(req.body);
    const { situation, moods, automaticThoughts, hotThought, evidenceFor, evidenceAgainst, balancedEntries } = req.body;

    const chart = await ephemerisService.calculateNatalChart(birth);

    // 计算当日行运盘
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);

    const result = await generateAIContent({
      promptId: 'cbt-analysis',
      context: { chart, transits, situation, moods, automaticThoughts, hotThought, evidenceFor, evidenceAgainst, balancedEntries },
      lang,
    });

    res.json({ lang: result.lang, content: result.content } as CBTAnalysisResponse);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/aggregate-analysis - CBT 聚合分析 (月度/阶段性)
cbtRouter.post('/aggregate-analysis', async (req, res) => {
  try {
    const langInput = (req.body as Record<string, unknown>).lang;
    const lang: Language = langInput === 'en' ? 'en' : 'zh';
    const birth = await parseBirthInput(req.body);
    const { period, somatic_stats, root_stats, mood_stats, competence_stats } = req.body;

    const chart = await ephemerisService.calculateNatalChart(birth);
    const now = new Date();
    const transits = await ephemerisService.calculateTransits(birth, now);

    const result = await generateAIContent({
      promptId: 'cbt-aggregate-analysis',
      context: { 
        chart, 
        transits, 
        period,
        somatic_stats,
        root_stats,
        mood_stats,
        competence_stats
      },
      lang,
    });

    res.json({ lang: result.lang, content: result.content });
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      res.status(503).json({ error: 'AI unavailable', reason: error.reason });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/cbt/records - 创建 CBT 记录
cbtRouter.post('/records', async (req, res) => {
  try {
    const { userId, record } = req.body as { userId: string; record: CBTRecord };
    const key = `cbt:records:${userId}`;

    // 获取现有记录
    const existing = await cacheService.get<CBTRecord[]>(key) || [];

    // 添加新记录
    existing.push(record);

    // 过滤过期记录（3 个月前）
    const cutoff = Date.now() - CBT_RETENTION_TTL * 1000;
    const filtered = existing.filter(r => r.timestamp > cutoff);

    // 保存（带 TTL）
    await cacheService.set(key, filtered, CBT_RETENTION_TTL);

    res.json({ success: true, count: filtered.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/cbt/records - 获取 CBT 记录列表
cbtRouter.get('/records', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const key = `cbt:records:${userId}`;

    const records = await cacheService.get<CBTRecord[]>(key) || [];

    // 过滤过期记录
    const cutoff = Date.now() - CBT_RETENTION_TTL * 1000;
    const filtered = records.filter(r => r.timestamp > cutoff);

    res.json({ records: filtered });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
