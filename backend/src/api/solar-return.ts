// INPUT: ephemeris（calculateNatalChart/getLongitudes/getPlanetPositions）、birthInput 校验机、
//        services/astro/solarReturn（solveReturnInstant）、data/sources（PLANETS/SIGNS）。
// OUTPUT: POST /api/solar-return —— 返照盘（Solar Return）：本命太阳经度 → 目标年返照时刻 → 该时刻 10 大行星落座。
// POS: Solar Return 端点。出生数据走 POST body（PII 不进 URL/日志）；返照盘行星落座，无 LLM。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md 与 docs/PRD.md 4.3。

import { Router, type Request, type Response } from "express";
import { ephemerisService } from "../services/ephemeris.js";
import {
  withValidatedBirth,
  handleBirthInputError,
  send500,
} from "./birthInput.js";
import { solveReturnInstant } from "../services/astro/solarReturn.js";
import { PLANETS, SIGNS } from "../data/sources.js";
import type { PlanetPosition } from "../types/api.js";

export const solarReturnRouter = Router();

const MAJORS = new Set<string>(PLANETS);

// PlanetPosition（sign + 座内度 + 分）→ 绝对黄经 [0,360)；未知星座返回 null。
const toLongitude = (p: PlanetPosition): number | null => {
  const idx = SIGNS.indexOf(p.sign as (typeof SIGNS)[number]);
  if (idx < 0) return null;
  return idx * 30 + (p.degree ?? 0) + (p.minute ?? 0) / 60;
};

const degraded = (res: Response): void => {
  res.status(503).json({
    error: "Sky data is currently degraded; try again shortly.",
    code: "EPHEMERIS_DEGRADED",
  });
};

async function handleSolarReturn(req: Request, res: Response): Promise<void> {
  try {
    // 校验 + 解析出生数据（失败时 helper 已发响应并返回 null）。
    const birth = await withValidatedBirth(req, res);
    if (!birth) return;

    const yearRaw = (req.body as { year?: unknown })?.year ?? req.query.year;
    const year = Number(yearRaw);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      res.status(400).json({
        error: "year must be an integer between 1900 and 2100",
        code: "INVALID_YEAR",
      });
      return;
    }

    // 本命太阳经度——calculateNatalChart 负责本地→UTC 时区换算（复用而非重写）。
    const natal = await ephemerisService.calculateNatalChart(birth);
    const natalSun = natal.positions.find((p) => p.name === "Sun");
    const natalSunLon = natalSun ? toLongitude(natalSun) : null;
    if (natalSunLon == null) {
      degraded(res);
      return;
    }

    const [, monthStr, dayStr] = birth.date.split("-");
    const month = Number(monthStr);
    const day = Number(dayStr);

    // 二分求太阳回到本命经度的精确时刻。
    const sunLongitudeAt = async (date: Date): Promise<number> => {
      const { longitudes } = await ephemerisService.getLongitudes(["Sun"], date);
      return longitudes["Sun"];
    };
    const srInstant = await solveReturnInstant(
      natalSunLon,
      year,
      month,
      day,
      sunLongitudeAt,
    );

    // 返照盘：返照时刻 + 出生地（行星落座与地点无关，宫位/上升才依赖；本工具仅展示行星落座）。
    const sr = await ephemerisService.getPlanetPositions(
      srInstant,
      birth.lat ?? 0,
      birth.lon ?? 0,
    );
    // 任一大行星 mock 兜底 → 拒绝服务伪数据（同 /today 哲学）。
    const mockedMajor =
      Array.isArray(sr.mockedPlanets) &&
      sr.mockedPlanets.some((n) => MAJORS.has(n));
    if (mockedMajor) {
      degraded(res);
      return;
    }

    const positions = sr.positions
      .filter((p) => MAJORS.has(p.name))
      .map((p) => ({
        name: p.name,
        sign: p.sign,
        degree: Number(((p.degree ?? 0) + (p.minute ?? 0) / 60).toFixed(4)),
        retrograde: !!p.isRetrograde,
      }));
    if (positions.length === 0) {
      degraded(res);
      return;
    }

    const iso = srInstant.toISOString();
    res.json({
      year,
      returnInstantUtc: iso,
      returnDate: iso.slice(0, 10),
      returnTimeUtc: iso.slice(11, 16),
      positions,
    });
  } catch (error) {
    // 出生数据校验错误用 helper 的脱敏响应；其余统一 500（不记录 birth 明文，隐私 #3）。
    if (handleBirthInputError(error, res)) return;
    send500(res);
  }
}

solarReturnRouter.post("/", handleSolarReturn);
