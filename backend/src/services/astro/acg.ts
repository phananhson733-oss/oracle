// INPUT: 无（纯函数）。
// OUTPUT: astrocartography 天文内核——meanObliquityDeg / gmstDeg / eclipticToEquatorial / acgLines / normLon。
// POS: Astrocartography（#20）的纯算法层。从黄道 (lon,lat)+JD 推出各行星的 4 条角线（MC/IC 子午线 +
//      AC/DC 升落曲线）的经纬度几何。标准 ACG（Jim Lewis）数学，可对手算参照值与 Swiss Ephemeris 赤道输出验证。
//      纯天文，无 IO、无命运叙事。若更新此文件，务必更新 astro/FOLDER.md。

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** 把经度归一化到 (-180, 180]。 */
export function normLon(deg: number): number {
  let d = ((((deg + 180) % 360) + 360) % 360) - 180;
  if (d <= -180) d += 360; // 把 -180 归到 +180，保持区间 (-180, 180]
  return d;
}

/** 平黄赤交角（度），Meeus / IAU 1980。jd 为 UT 儒略日。 */
export function meanObliquityDeg(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  // 23°26'21.448" - 46.8150"·T - 0.00059"·T² + 0.001813"·T³
  const seconds = 21.448 - 46.815 * t - 0.00059 * t * t + 0.001813 * t * t * t;
  return 23 + 26 / 60 + seconds / 3600;
}

/** 格林尼治平恒星时（度），IAU 1982。jd 为 UT 儒略日。 */
export function gmstDeg(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  const theta =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return ((theta % 360) + 360) % 360;
}

export interface Equatorial {
  raDeg: number; // 赤经，[0, 360)
  decDeg: number; // 赤纬，[-90, 90]
}

/**
 * 黄道坐标 → 赤道坐标。lonDeg=黄经 λ，latDeg=黄纬 β，oblDeg=黄赤交角 ε。
 * α = atan2(sinλ·cosε - tanβ·sinε, cosλ)；δ = asin(sinβ·cosε + cosβ·sinε·sinλ)。
 */
export function eclipticToEquatorial(
  lonDeg: number,
  latDeg: number,
  oblDeg: number,
): Equatorial {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const obl = oblDeg * DEG;
  const sinLon = Math.sin(lon);
  const ra = Math.atan2(
    sinLon * Math.cos(obl) - Math.tan(lat) * Math.sin(obl),
    Math.cos(lon),
  );
  const dec = Math.asin(
    Math.sin(lat) * Math.cos(obl) + Math.cos(lat) * Math.sin(obl) * sinLon,
  );
  return {
    raDeg: (((ra * RAD) % 360) + 360) % 360,
    decDeg: dec * RAD,
  };
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface AcgLines {
  mcLon: number; // 上中天子午线经度（垂直线）
  icLon: number; // 下中天子午线经度（垂直线）
  ascending: GeoPoint[]; // 上升（东地平）曲线，按纬度升序
  descending: GeoPoint[]; // 下降（西地平）曲线，按纬度升序
}

export interface AcgOptions {
  latStepDeg?: number; // 升落曲线采样步长，默认 1°
  maxLatDeg?: number; // 采样纬度上限，默认 85°（避开极点附近退化）
}

/**
 * 给定某天体的赤经 raDeg / 赤纬 decDeg 与格林尼治恒星时 gmstDeg，
 * 算出其 astrocartography 的 4 条角线几何。
 * - MC（culminating）：地方恒星时 = RA → 经度 = RA - GMST（垂直线）
 * - IC：MC + 180°
 * - AC（rising，东地平）/ DC（setting，西地平）：地平高度=0，cos(H0) = -tanφ·tanδ，
 *   升起 H = -H0 → 经度 = RA - H0 - GMST；落下 H = +H0 → 经度 = RA + H0 - GMST。
 *   |−tanφ·tanδ| > 1 的纬度处天体常显/常隐（circumpolar），该纬度无升落线。
 */
export function acgLines(
  raDeg: number,
  decDeg: number,
  gmst: number,
  opts: AcgOptions = {},
): AcgLines {
  const step = opts.latStepDeg ?? 1;
  const maxLat = opts.maxLatDeg ?? 85;
  const mcLon = normLon(raDeg - gmst);
  const icLon = normLon(raDeg - gmst + 180);

  const ascending: GeoPoint[] = [];
  const descending: GeoPoint[] = [];
  const tanDec = Math.tan(decDeg * DEG);

  for (let lat = -maxLat; lat <= maxLat + 1e-9; lat += step) {
    const cosH0 = -Math.tan(lat * DEG) * tanDec;
    if (cosH0 < -1 || cosH0 > 1) continue; // circumpolar：该纬度无升落
    const h0 = Math.acos(cosH0) * RAD; // 半日弧（度）
    ascending.push({ lat, lon: normLon(raDeg - h0 - gmst) });
    descending.push({ lat, lon: normLon(raDeg + h0 - gmst) });
  }

  return { mcLon, icLon, ascending, descending };
}

export interface PlanetAcg {
  name: string;
  raDeg: number;
  decDeg: number;
  lines: AcgLines;
}

/**
 * 装配整张 astrocartography 图：对每个天体把黄道 (lon,lat) 转赤道，再算 4 条角线。
 * 黄赤交角与 GMST 全图共用一次（同一 JD）。纯函数，无 IO。
 */
export function assembleAcgChart(
  ecliptic: Record<string, { lon: number; lat: number }>,
  jd: number,
  bodies: string[],
  opts: AcgOptions = {},
): { gmstDeg: number; obliquityDeg: number; planets: PlanetAcg[] } {
  const obliquityDeg = meanObliquityDeg(jd);
  const gmst = gmstDeg(jd);
  const planets: PlanetAcg[] = [];
  for (const name of bodies) {
    const ecl = ecliptic[name];
    if (!ecl) continue;
    const { raDeg, decDeg } = eclipticToEquatorial(
      ecl.lon,
      ecl.lat,
      obliquityDeg,
    );
    planets.push({
      name,
      raDeg,
      decDeg,
      lines: acgLines(raDeg, decDeg, gmst, opts),
    });
  }
  return { gmstDeg: gmst, obliquityDeg, planets };
}
