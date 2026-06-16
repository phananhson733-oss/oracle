import { describe, it, expect } from "vitest";
import { longitudeOfPosition, matchTransitAspects } from "./aspects.js";
import type { PlanetPosition } from "../../types/api.js";

describe("longitudeOfPosition", () => {
  it("converts sign + degree + minute into absolute ecliptic longitude", () => {
    const pos: PlanetPosition = {
      name: "Sun",
      sign: "Cancer", // index 3 → 90°
      degree: 10,
      minute: 30,
      isRetrograde: false,
    };
    expect(longitudeOfPosition(pos)).toBeCloseTo(100.5, 6);
  });

  it("treats missing minute as zero", () => {
    const pos: PlanetPosition = {
      name: "Sun",
      sign: "Aries", // 0°
      degree: 15,
      isRetrograde: false,
    };
    expect(longitudeOfPosition(pos)).toBeCloseTo(15, 6);
  });
});

describe("matchTransitAspects", () => {
  it("emits a conjunction with T-/N- labels for coincident longitudes", () => {
    const aspects = matchTransitAspects({ Saturn: 10 }, { Sun: 10 });
    expect(aspects).toHaveLength(1);
    expect(aspects[0]).toMatchObject({
      planet1: "T-Saturn",
      planet2: "N-Sun",
      type: "conjunction",
    });
    expect(aspects[0].orb).toBeCloseTo(0, 6);
  });

  it("detects a square at 90 degrees of separation", () => {
    const [aspect] = matchTransitAspects({ Mars: 10 }, { Moon: 100 });
    expect(aspect.type).toBe("square");
    expect(aspect.orb).toBeCloseTo(0, 6);
  });

  it("returns no aspect when the separation falls outside every orb", () => {
    // 40° apart: not within orb of conjunction/sextile(60)/square(90)/trine/opp.
    expect(matchTransitAspects({ Mars: 10 }, { Moon: 50 })).toHaveLength(0);
  });

  it("reports the orb as the deviation from the exact aspect angle", () => {
    const [aspect] = matchTransitAspects({ Venus: 10 }, { Mercury: 11 });
    expect(aspect.type).toBe("conjunction");
    expect(aspect.orb).toBeCloseTo(1, 6);
  });

  it("handles the 0/360 wrap-around when measuring separation", () => {
    const [aspect] = matchTransitAspects({ Sun: 2 }, { Saturn: 358 });
    expect(aspect.type).toBe("conjunction");
    expect(aspect.orb).toBeCloseTo(4, 6);
  });

  it("produces the cross product of transit and natal bodies", () => {
    const aspects = matchTransitAspects(
      { Saturn: 10, Mars: 100 },
      { Sun: 10, Moon: 100 },
    );
    // T-Saturn conj N-Sun, T-Saturn square N-Moon, T-Mars square N-Sun, T-Mars conj N-Moon
    expect(aspects.length).toBeGreaterThanOrEqual(4);
  });
});
