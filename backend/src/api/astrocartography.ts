// INPUT: ephemeris（getEclipticForBirth）、birthInput 校验机、services/astro/acg（assembleAcgChart）、data/sources（PLANETS）。
// OUTPUT: POST /api/astrocartography —— 占星地图：出生数据 → 10 大行星的 4 条角线（MC/IC 子午线 + AC/DC 升落曲线）经纬度几何。
// POS: Astrocartography 端点。出生数据走 POST body（PII 不进 URL/日志），需出生时间（角线随 GMST 每小时转 ~15°）；
//      天文走 Swiss Ephemeris（mock 兜底则 503，拒伪数据），无 LLM。若更新此文件，务必更新本头注释 + FOLDER.md + docs/PRD.md 4.3。

import { Router, type Request, type Response } from "express";
import { ephemerisService } from "../services/ephemeris.js";
import {
  withValidatedBirth,
  handleBirthInputError,
  send500,
} from "./birthInput.js";
import { assembleAcgChart } from "../services/astro/acg.js";

export const astrocartographyRouter = Router();

// ACG 标准用 10 大行星（不含小行星/虚点）。
const ACG_BODIES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

const LAT_STEP_DEG = 3; // 升落曲线采样步长；3° 足够平滑且控制 payload。
const MAX_LAT_DEG = 78; // 避开极区等距投影极端拉伸。

const round2 = (n: number): number => Number(n.toFixed(2));

const degraded = (res: Response): void => {
  res.status(503).json({
    error: "Sky data is currently degraded; try again shortly.",
    code: "EPHEMERIS_DEGRADED",
  });
};

async function handleAstrocartography(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const birth = await withValidatedBirth(req, res);
    if (!birth) return;

    // ACG 角线依赖出生「时刻」（GMST 每小时推进 ~15°）；无时间则无意义。
    if (!birth.time) {
      res.status(400).json({
        error: "Birth time is required for an astrocartography map.",
        code: "TIME_REQUIRED",
      });
      return;
    }

    const { ecliptic, jd, mockedPlanets } =
      await ephemerisService.getEclipticForBirth(birth, ACG_BODIES);

    // 任一大行星 mock 兜底 → 拒绝服务伪数据（同 /today 完整性门哲学）。
    // 这里查 mockedPlanets.length 而非 usedMockFallback：ACG 请求的 10 体都是大行星，
    // 只要 swisseph 不可用就全体落 mock，mockedPlanets 必非空，等价且更直接。
    if (Array.isArray(mockedPlanets) && mockedPlanets.length > 0) {
      degraded(res);
      return;
    }

    const chart = assembleAcgChart(ecliptic, jd, ACG_BODIES, {
      latStepDeg: LAT_STEP_DEG,
      maxLatDeg: MAX_LAT_DEG,
    });

    if (chart.planets.length === 0) {
      degraded(res);
      return;
    }

    const planets = chart.planets.map((p) => ({
      name: p.name,
      raDeg: round2(p.raDeg),
      decDeg: round2(p.decDeg),
      mcLon: round2(p.lines.mcLon),
      icLon: round2(p.lines.icLon),
      ascending: p.lines.ascending.map((pt) => ({
        lat: round2(pt.lat),
        lon: round2(pt.lon),
      })),
      descending: p.lines.descending.map((pt) => ({
        lat: round2(pt.lat),
        lon: round2(pt.lon),
      })),
    }));

    res.json({
      gmstDeg: round2(chart.gmstDeg),
      obliquityDeg: round2(chart.obliquityDeg),
      planets,
    });
  } catch (error) {
    // 出生校验错误用 helper 的脱敏响应；其余统一 500（不记录 birth 明文，隐私 #3）。
    if (handleBirthInputError(error, res)) return;
    send500(res);
  }
}

astrocartographyRouter.post("/", handleAstrocartography);
