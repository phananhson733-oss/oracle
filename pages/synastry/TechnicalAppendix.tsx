// INPUT: props（技术数据 + onDetailClick 回调 + sectionTitle 样式串 + personA/B 名称 + technical）；shared SectionHeader/useLanguage + 懒加载 TechSpecs 表（ElementalTable/AspectMatrix/PlanetTable/HouseRulerTable/SynastryAspectMatrix）。
// OUTPUT: ExtendedAppendix（单盘技术附录：元素/相位/行星/小行星/宫主星）+ ComparisonAppendix（合盘对比附录：相位矩阵 + 双人行星/小行星/宫主星表）。
// POS: SynastryReportView 各 tab 技术附录区的展示组件。5 个懒加载表在此 import，保持各自分 chunk。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React, { lazy } from "react";
import { SectionHeader, useLanguage } from "../../components/UIComponents";
import * as T from "../../types";

const ElementalTable = lazy(() =>
  import("../../components/TechSpecsComponents").then((m) => ({
    default: m.ElementalTable,
  })),
);
const AspectMatrix = lazy(() =>
  import("../../components/TechSpecsComponents").then((m) => ({
    default: m.AspectMatrix,
  })),
);
const PlanetTable = lazy(() =>
  import("../../components/TechSpecsComponents").then((m) => ({
    default: m.PlanetTable,
  })),
);
const HouseRulerTable = lazy(() =>
  import("../../components/TechSpecsComponents").then((m) => ({
    default: m.HouseRulerTable,
  })),
);
const SynastryAspectMatrix = lazy(() =>
  import("../../components/TechSpecsComponents").then((m) => ({
    default: m.SynastryAspectMatrix,
  })),
);

export const ExtendedAppendix: React.FC<{
  data: T.ExtendedNatalData;
  context: T.DetailContext;
  sectionTitle: string;
  onDetailClick: (
    type: T.DetailType,
    context: T.DetailContext,
    chartData: Record<string, unknown>,
    customNames?: { nameA: string; nameB: string },
  ) => void;
}> = ({ data, context, sectionTitle, onDetailClick }) => {
  const { t, language } = useLanguage();
  return (
    <div className="space-y-10">
      <div>
        <SectionHeader
          title={t.me.tech_elements}
          detailLabel={t.detail.view_detail}
          onDetailClick={() =>
            onDetailClick("elements", context, {
              elements: data.elements,
            })
          }
          className={sectionTitle}
        />
        <ElementalTable data={data.elements} language={language} />
      </div>
      <div>
        <SectionHeader
          title={t.me.tech_aspects}
          detailLabel={t.detail.view_detail}
          onDetailClick={() =>
            onDetailClick("aspects", context, {
              aspects: data.aspects,
            })
          }
          className={sectionTitle}
        />
        <AspectMatrix aspects={data.aspects} language={language} />
      </div>
      <div>
        <SectionHeader
          title={t.me.tech_planets}
          detailLabel={t.detail.view_detail}
          onDetailClick={() =>
            onDetailClick("planets", context, {
              planets: data.planets,
            })
          }
          className={sectionTitle}
        />
        <PlanetTable
          planets={data.planets}
          language={language}
          labels={{
            body: t.me.table_body,
            sign: t.me.table_sign,
            house: t.me.table_house,
            retro: t.me.table_retro,
          }}
        />
      </div>
      <div>
        <SectionHeader
          title={t.me.tech_asteroids}
          detailLabel={t.detail.view_detail}
          onDetailClick={() =>
            onDetailClick("asteroids", context, {
              asteroids: data.asteroids,
            })
          }
          className={sectionTitle}
        />
        <PlanetTable
          planets={data.asteroids}
          language={language}
          labels={{
            body: t.me.table_body,
            sign: t.me.table_sign,
            house: t.me.table_house,
            retro: t.me.table_retro,
          }}
        />
      </div>
      <div>
        <SectionHeader
          title={t.me.tech_rulers}
          detailLabel={t.detail.view_detail}
          onDetailClick={() =>
            onDetailClick("rulers", context, {
              houseRulers: data.houseRulers,
            })
          }
          className={sectionTitle}
        />
        <HouseRulerTable
          rulers={data.houseRulers}
          language={language}
          labels={{
            house: t.me.table_house,
            sign: t.me.table_sign,
            ruler: t.me.table_ruler,
            flies_to: t.me.table_flies_to,
          }}
        />
      </div>
    </div>
  );
};

export const ComparisonAppendix: React.FC<{
  comparison: T.SynastryComparisonTechnicalData;
  isAB: boolean;
  technical: T.SynastryTechnicalData | null;
  personALabel: string;
  personBLabel: string;
  sectionTitle: string;
  onDetailClick: (
    type: T.DetailType,
    context: T.DetailContext,
    chartData: Record<string, unknown>,
    customNames?: { nameA: string; nameB: string },
  ) => void;
}> = ({
  comparison,
  isAB,
  technical,
  personALabel,
  personBLabel,
  sectionTitle,
  onDetailClick,
}) => {
  const { t, language } = useLanguage();
  const subjectName = isAB ? personALabel : personBLabel;
  const objectName = isAB ? personBLabel : personALabel;

  const subjectNatal = isAB ? technical?.natal_a : technical?.natal_b;
  const objectNatal = isAB ? technical?.natal_b : technical?.natal_a;

  return (
      <div className="space-y-10">
        <div>
          <SectionHeader
            title={t.me.tech_aspects}
            detailLabel={t.detail.view_detail}
            onDetailClick={() =>
              onDetailClick(
                "aspects",
                "synastry",
                {
                  aspects: comparison.aspects,
                  houseOverlays: comparison.houseOverlays,
                },
                { nameA: subjectName, nameB: objectName },
              )
            }
            className={sectionTitle}
          />
          <SynastryAspectMatrix
            aspects={comparison.aspects}
            language={language}
            personALabel={subjectName}
            personBLabel={objectName}
          />
        </div>

        <div>
          <SectionHeader
            title={t.me.tech_planets}
            detailLabel={t.detail.view_detail}
            onDetailClick={() =>
              onDetailClick(
                "planets",
                "synastry",
                {
                  planetsA: subjectNatal?.planets,
                  planetsB: objectNatal?.planets,
                  houseOverlays: comparison.houseOverlays,
                  aspects: comparison.aspects,
                },
                { nameA: subjectName, nameB: objectName },
              )
            }
            className={sectionTitle}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">
                {subjectName}
              </div>
              <PlanetTable
                planets={subjectNatal?.planets || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">
                {objectName}
              </div>
              <PlanetTable
                planets={objectNatal?.planets || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeader
            title={t.me.tech_asteroids}
            detailLabel={t.detail.view_detail}
            onDetailClick={() =>
              onDetailClick(
                "asteroids",
                "synastry",
                {
                  asteroidsA: subjectNatal?.asteroids,
                  asteroidsB: objectNatal?.asteroids,
                  aspects: comparison.aspects,
                },
                { nameA: subjectName, nameB: objectName },
              )
            }
            className={sectionTitle}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">
                {subjectName}
              </div>
              <PlanetTable
                planets={subjectNatal?.asteroids || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">
                {objectName}
              </div>
              <PlanetTable
                planets={objectNatal?.asteroids || []}
                language={language}
                labels={{
                  body: t.me.table_body,
                  sign: t.me.table_sign,
                  house: t.me.table_house,
                  retro: t.me.table_retro,
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeader
            title={t.me.tech_rulers}
            detailLabel={t.detail.view_detail}
            onDetailClick={() =>
              onDetailClick(
                "rulers",
                "synastry",
                {
                  rulersA: subjectNatal?.houseRulers,
                  rulersB: objectNatal?.houseRulers,
                },
                { nameA: subjectName, nameB: objectName },
              )
            }
            className={sectionTitle}
          />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">
                {subjectName}
              </div>
              <HouseRulerTable
                rulers={subjectNatal?.houseRulers || []}
                language={language}
                labels={{
                  house: t.me.table_house,
                  sign: t.me.table_sign,
                  ruler: t.me.table_ruler,
                  flies_to: t.me.table_flies_to,
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-2">
                {objectName}
              </div>
              <HouseRulerTable
                rulers={objectNatal?.houseRulers || []}
                language={language}
                labels={{
                  house: t.me.table_house,
                  sign: t.me.table_sign,
                  ruler: t.me.table_ruler,
                  flies_to: t.me.table_flies_to,
                }}
              />
            </div>
          </div>
        </div>
      </div>
  );
};
