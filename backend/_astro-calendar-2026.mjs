// _astro-calendar-2026.mjs — compute the REAL full-year 2026 astrology calendar via
// Swiss Ephemeris (same engine as the site's ephemeris service). A 00:00-UT daily scan
// DETECTS each event (planetary sign ingress excl. Moon, retrograde/direct station,
// new/full lunation); each is then BISECTED to the exact UT moment (minute precision).
// Eclipses come from swe_sol/lun_eclipse_when_*. NO fabricated data — all computed.
// Output: JSON to stdout for the "2026 astrology calendar" article. Reproducible/auditable.
//   Run: cd backend && node _astro-calendar-2026.mjs > /tmp/cal2026.json
import swe from 'swisseph';
import { join } from 'node:path';
swe.swe_set_ephe_path(join(process.cwd(), 'node_modules/swisseph/ephe'));

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const BODIES = [
  ['Sun', swe.SE_SUN], ['Mercury', swe.SE_MERCURY], ['Venus', swe.SE_VENUS],
  ['Mars', swe.SE_MARS], ['Jupiter', swe.SE_JUPITER], ['Saturn', swe.SE_SATURN],
  ['Uranus', swe.SE_URANUS], ['Neptune', swe.SE_NEPTUNE], ['Pluto', swe.SE_PLUTO],
];
const MOON = swe.SE_MOON, SUN = swe.SE_SUN;
const FLAG = swe.SEFLG_SPEED | swe.SEFLG_SWIEPH;
const norm = (x) => ((x % 360) + 360) % 360;
const signOf = (lon) => SIGNS[Math.floor(norm(lon) / 30)];
const degIn = (lon) => (norm(lon) % 30);
const lonOf = (jd, id) => norm(swe.swe_calc_ut(jd, id, FLAG).longitude);
const spdOf = (jd, id) => swe.swe_calc_ut(jd, id, FLAG).longitudeSpeed;
const jdOf = (y, m, d) => swe.swe_julday(y, m, d, 0, swe.SE_GREG_CAL);
const pad = (n) => String(n).padStart(2, '0');
const stamp = (jd) => {
  const r = swe.swe_revjul(jd, swe.SE_GREG_CAL);
  const hh = Math.floor(r.hour), mm = Math.round((r.hour - hh) * 60);
  const carry = mm === 60;
  return { date: `${r.year}-${pad(r.month)}-${pad(r.day)}`, time: `${pad(carry ? hh + 1 : hh)}:${pad(carry ? 0 : mm)}` };
};
// bisect jd in [lo,hi] (1-day bracket) for the moment test(jd) flips value. 40 iters ≈ sub-second.
const bisect = (lo, hi, test) => {
  const base = test(lo);
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (test(mid) === base) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};

const DAYS_IN = [31,28,31,30,31,30,31,31,30,31,30,31]; // 2026 not a leap year
const days = [];
for (let m = 1; m <= 12; m++) for (let d = 1; d <= DAYS_IN[m-1]; d++) days.push([2026, m, d]);

const ingresses = [], stations = [], lunations = [];
let prevJd = null, prevSign = {}, prevSpd = {}, prevEl = null;
const elong = (jd) => norm(lonOf(jd, MOON) - lonOf(jd, SUN));
for (const [y, m, d] of days) {
  const jd = jdOf(y, m, d);
  if (prevJd !== null) {
    for (const [name, id] of BODIES) {
      const curSign = signOf(lonOf(jd, id));
      if (prevSign[name] !== curSign) {
        const exact = bisect(prevJd, jd, (t) => signOf(lonOf(t, id)) === curSign);
        ingresses.push({ ...stamp(exact), body: name, into: curSign });
      }
      const curSpd = spdOf(jd, id);
      if (Math.sign(prevSpd[name]) !== Math.sign(curSpd)) {
        const exact = bisect(prevJd, jd, (t) => spdOf(t, id) < 0);
        const lon = lonOf(exact, id);
        stations.push({ ...stamp(exact), body: name, type: curSpd < 0 ? 'Retrograde' : 'Direct', at: `${degIn(lon).toFixed(1)}° ${signOf(lon)}` });
      }
    }
    const el = elong(jd);
    const sgn = (e) => (e > 180 ? e - 360 : e); // signed elongation, 0 = new
    if (sgn(prevEl) < 0 && sgn(el) >= 0) {
      const exact = bisect(prevJd, jd, (t) => sgn(elong(t)) >= 0);
      const lon = lonOf(exact, SUN);
      lunations.push({ ...stamp(exact), type: 'New Moon', sign: signOf(lon), deg: degIn(lon).toFixed(1) });
    }
    if (prevEl < 180 && el >= 180) {
      const exact = bisect(prevJd, jd, (t) => elong(t) >= 180);
      const lon = lonOf(exact, MOON);
      lunations.push({ ...stamp(exact), type: 'Full Moon', sign: signOf(lon), deg: degIn(lon).toFixed(1) });
    }
  }
  prevJd = jd; prevEl = elong(jd);
  for (const [name, id] of BODIES) { prevSign[name] = signOf(lonOf(jd, id)); prevSpd[name] = spdOf(jd, id); }
}

// Eclipses (global) via swe_*_eclipse_when_* — already exact (returns moment of greatest eclipse).
const eclipses = [];
const jdEnd = jdOf(2026, 12, 31) + 1;
const eclType = (rflag) => {
  if (rflag & swe.SE_ECL_TOTAL) return 'Total';
  if (rflag & swe.SE_ECL_ANNULAR_TOTAL) return 'Hybrid';
  if (rflag & swe.SE_ECL_ANNULAR) return 'Annular';
  if (rflag & swe.SE_ECL_PARTIAL) return 'Partial';
  if (rflag & swe.SE_ECL_PENUMBRAL) return 'Penumbral';
  return '';
};
for (const [kind, fn, lum] of [['Solar', swe.swe_sol_eclipse_when_glob, SUN], ['Lunar', swe.swe_lun_eclipse_when, MOON]]) {
  let jd = jdOf(2026, 1, 1);
  for (let guard = 0; guard < 30; guard++) {
    let r;
    try { r = fn.call(swe, jd, swe.SEFLG_SWIEPH, 0, false); } catch (e) { break; }
    const maxJd = r && (typeof r.maximum === 'number' ? r.maximum : (r.tret && r.tret[0]));
    if (typeof maxJd !== 'number' || maxJd >= jdEnd) break;
    const lon = lonOf(maxJd, lum);
    eclipses.push({ ...stamp(maxJd), kind, eclipseType: eclType(r.rflag ?? r.return ?? 0), sign: signOf(lon), deg: degIn(lon).toFixed(1) });
    jd = maxJd + 2;
  }
}
eclipses.sort((a, b) => a.date.localeCompare(b.date));

console.log(JSON.stringify({ ingresses, stations, lunations, eclipses }, null, 2));
