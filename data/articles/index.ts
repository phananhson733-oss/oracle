// Article index - exports all articles for static import
import type {
  WikiArticle,
  WikiArticleSummary,
  ArticleHotword,
  Language,
} from "../../types";
import {
  trackMoodAstrologyEn,
  trackMoodAstrologyZh,
} from "./track-mood-astrology";
import {
  mercuryRetrogradeMoonAnxietyEn,
  mercuryRetrogradeMoonAnxietyZh,
} from "./mercury-retrograde-vs-moon-anxiety";
import {
  marsAngerTriggersEn,
  marsAngerTriggersZh,
} from "./mars-anger-triggers";
import {
  bestAstrologyAppsEn,
  bestAstrologyAppsZh,
} from "./best-astrology-mental-health-apps";
import {
  howToReadBirthChartEn,
  howToReadBirthChartZh,
} from "./how-to-read-birth-chart";

// v8 aura batch (2026-05-22) — EN-only, sourced from gengrowth-flow-mvp _staging/
import { auraColorsPillarEn } from "./aura-colors-pillar";
import { blueAuraMeaningEn } from "./blue-aura-meaning";
import { yellowAuraMeaningEn } from "./yellow-aura-meaning";
import { purpleAuraMeaningEn } from "./purple-aura-meaning";
import { whiteAuraMeaningEn } from "./white-aura-meaning";
import { redAuraMeaningEn } from "./red-aura-meaning";
import { orangeAuraMeaningEn } from "./orange-aura-meaning";
import { greenAuraMeaningEn } from "./green-aura-meaning";
import { chakraSystemOverviewEn } from "./chakra-system-overview";
import { fourElementFrameworkEn } from "./four-element-framework";
// tool-led prove-chain：aura→Moon/Venus/Rising 桥页（EN-only，noindex 转化实验，
// 带北交点迷你计算器 + 强制安全 footer）。不进 sitemap（见 article.seo）。
import { auraMoonVenusRisingBridgeEn } from "./aura-moon-venus-rising-bridge";

import { greenAuraMeaningZh } from "./green-aura-meaning";
import { orangeAuraMeaningZh } from "./orange-aura-meaning";
import { astrologyHousesEn } from "./astrology-houses";
import { astrologyHousesZh } from "./astrology-houses";
import { eighthHouseMeaningEn } from "./8th-house-meaning";
import { eighthHouseMeaningZh } from "./8th-house-meaning";
import { twelfthHouseAstrologyEn } from "./12th-house-astrology";
import { twelfthHouseAstrologyZh } from "./12th-house-astrology";
import { ninthHouseAstrologyEn } from "./9th-house-astrology";
import { ninthHouseAstrologyZh } from "./9th-house-astrology";
import { eleventhHouseEn } from "./11th-house";
import { eleventhHouseZh } from "./11th-house";
import { northNodeVsSouthNodeEn } from "./north-node-vs-south-node";
import { northNodeVsSouthNodeZh } from "./north-node-vs-south-node";
import { northNodeInScorpioEn } from "./north-node-in-scorpio";
import { northNodeInScorpioZh } from "./north-node-in-scorpio";
import { northNodeInTaurusEn } from "./north-node-in-taurus";
import { northNodeInTaurusZh } from "./north-node-in-taurus";
// 5/29 batch — chakra spokes + astrology-terms glossary cluster
import {
  heartChakraMeaningEn,
  heartChakraMeaningZh,
} from "./heart-chakra-meaning";
import {
  throatChakraMeaningEn,
  throatChakraMeaningZh,
} from "./throat-chakra-meaning";
import { ajnaChakraEn, ajnaChakraZh } from "./ajna-chakra";
import {
  crystalsForEachChakraEn,
  crystalsForEachChakraZh,
} from "./crystals-for-each-chakra";
import { astrologyTermsEn, astrologyTermsZh } from "./astrology-terms";
import { sextileAstrologyEn, sextileAstrologyZh } from "./sextile-astrology";
import { trineInAstrologyEn, trineInAstrologyZh } from "./trine-in-astrology";
import { squareAstrologyEn, squareAstrologyZh } from "./square-astrology";
import {
  descendantAstrologyEn,
  descendantAstrologyZh,
} from "./descendant-astrology";
import { icAstrologyEn, icAstrologyZh } from "./ic-astrology";
import { transitsEn } from "./transits";
import { transitsZh } from "./transits";
import { natalChartTransitsEn } from "./natal-chart-transits";
import { natalChartTransitsZh } from "./natal-chart-transits";
import { june2026PlanetaryTransitsEn } from "./june-2026-planetary-transits";
import { june2026PlanetaryTransitsZh } from "./june-2026-planetary-transits";
import { july2026PlanetaryTransitsEn } from "./july-2026-planetary-transits";
import { july2026PlanetaryTransitsZh } from "./july-2026-planetary-transits";
// 6/2 EMPATH/HSP cluster
import { highlySensitivePersonEn } from "./highly-sensitive-person";
import { highlySensitivePersonZh } from "./highly-sensitive-person";
import { signsOfAHighlySensitivePersonEn } from "./signs-of-a-highly-sensitive-person";
import { signsOfAHighlySensitivePersonZh } from "./signs-of-a-highly-sensitive-person";
import { highlySensitivePersonVsAutismEn } from "./highly-sensitive-person-vs-autism";
import { highlySensitivePersonVsAutismZh } from "./highly-sensitive-person-vs-autism";
// 6/2 MAHADASHA cluster
import { mahadashaEn } from "./mahadasha";
import { mahadashaZh } from "./mahadasha";
import { rahuMahadashaEn } from "./rahu-mahadasha";
import { rahuMahadashaZh } from "./rahu-mahadasha";
import { ketuMahadashaEn } from "./ketu-mahadasha";
import { ketuMahadashaZh } from "./ketu-mahadasha";
import { saturnMahadashaEn } from "./saturn-mahadasha";
import { saturnMahadashaZh } from "./saturn-mahadasha";
import { venusMahadashaEn } from "./venus-mahadasha";
import { venusMahadashaZh } from "./venus-mahadasha";
import { solarReturnChartEn } from "./solar-return-chart";
import { solarReturnChartZh } from "./solar-return-chart";
import { whatIsAFullMoonRitualEn } from "./what-is-a-full-moon-ritual";
import { fullMoonEnergyEn } from "./full-moon-energy";
import { whatToDoOnAFullMoonSpirituallyEn } from "./what-to-do-on-a-full-moon-spiritually";
import { anuradhaNakshatraEn } from "./anuradha-nakshatra";
import { bharaniNakshatraEn } from "./bharani-nakshatra";
import { chironInTaurusEn } from "./chiron-in-taurus";
import { ashleshaNakshatraEn } from "./ashlesha-nakshatra";
import { rohiniNakshatraEn } from "./rohini-nakshatra";
import { southNodeEn } from "./south-node";
import { northNodeInGeminiEn } from "./north-node-in-gemini";
import { northNodeInSagittariusEn } from "./north-node-in-sagittarius";
import { cancerNorthNodeEn } from "./cancer-north-node";
import { junoAstrologyEn } from "./juno-astrology";
import { howToBalanceVataDoshaEn } from "./how-to-balance-vata-dosha";
import { solarReturnEn } from "./solar-return";
import { n3GunasEn } from "./3-gunas";
import { famousHighlySensitivePersonEn } from "./famous-highly-sensitive-person";
import { famousHighlySensitivePersonZh } from "./famous-highly-sensitive-person";
import { pushyaNakshatraEn } from "./pushya-nakshatra";
import { nakshatraEn } from "./nakshatra";
import { aiAstrologyAppEn } from "./ai-astrology-app";
import { sattvaRajasTamasEn } from "./sattva-rajas-tamas";
import { libraRisingHousesEn } from "./libra-rising-houses";
import { leoRisingHousesEn } from "./leo-rising-houses";
import { scorpioRisingHousesEn } from "./scorpio-rising-houses";
import { fullMoonJune2026En } from "./full-moon-june-2026";
import { fullMoonJuly2026En } from "./full-moon-july-2026";
import { moonJournalEn } from "./moon-journal";
import { fullMoonJournalPromptsEn } from "./full-moon-journal-prompts";
import { newMoonJournalPromptsEn } from "./new-moon-journal-prompts";
import { journalPromptsEn } from "./journal-prompts";
import { shadowWorkJournalPromptsEn } from "./shadow-work-journal-prompts";
import { blackMoonLilithEn } from "./black-moon-lilith";
import { compositeChartCalculatorEn } from "./composite-chart-calculator";
import { synastryChartCompatibilityEn } from "./synastry-chart-compatibility";
import { mrigashiraNakshatraEn } from "./mrigashira-nakshatra";
import { swatiNakshatraEn } from "./swati-nakshatra";
// All articles organized by language

import {
  rootChakraMeaningEn,
  rootChakraMeaningZh,
} from "./root-chakra-meaning";

import { firstHouseMeaningEn, firstHouseMeaningZh } from "./1st-house-meaning";

import { auraReadingEn, auraReadingZh } from "./aura-reading";

import {
  crownChakraMeaningEn,
  crownChakraMeaningZh,
} from "./crown-chakra-meaning";

import {
  vedicVsWesternAstrologyEn,
  vedicVsWesternAstrologyZh,
} from "./vedic-vs-western-astrology";

import {
  secondHouseAstrologyEn,
  secondHouseAstrologyZh,
} from "./2nd-house-astrology";

import { chakraTestEn, chakraTestZh } from "./chakra-test";

import {
  howToFindNorthNodeEn,
  howToFindNorthNodeZh,
} from "./how-to-find-north-node";

import {
  sacralChakraMeaningEn,
  sacralChakraMeaningZh,
} from "./sacral-chakra-meaning";

import {
  fourthHouseMeaningEn,
  fourthHouseMeaningZh,
} from "./4th-house-meaning";

import {
  vedicBirthChartCalculatorEn,
  vedicBirthChartCalculatorZh,
} from "./vedic-birth-chart-calculator";

import {
  solarPlexusChakraAffirmationsEn,
  solarPlexusChakraAffirmationsZh,
} from "./solar-plexus-chakra-affirmations";

import {
  thirdHouseAstrologyEn,
  thirdHouseAstrologyZh,
} from "./3rd-house-astrology";

import { fifthHouseEn, fifthHouseZh } from "./5th-house";

import {
  sixthHouseAstrologyEn,
  sixthHouseAstrologyZh,
} from "./6th-house-astrology";

import {
  seventhHouseAstrologyEn,
  seventhHouseAstrologyZh,
} from "./7th-house-astrology";

import {
  tenthHouseAstrologyEn,
  tenthHouseAstrologyZh,
} from "./10th-house-astrology";

// 5/30 batch — healing_placements (pillar + spokes) + saturn-in-pisces transit + persephone myth
import {
  healingYourInnerWoundEn,
  healingYourInnerWoundZh,
} from "./healing-your-inner-wound";
import {
  chironIn12thHouseEn,
  chironIn12thHouseZh,
} from "./chiron-in-12th-house";
import { marsIn12thHouseEn, marsIn12thHouseZh } from "./mars-in-12th-house";
import { saturnInPiscesEn, saturnInPiscesZh } from "./saturn-in-pisces";
import { persephoneGoddessEn, persephoneGoddessZh } from "./persephone-goddess";

const ARTICLES_EN: WikiArticle[] = [
  tenthHouseAstrologyEn,
  seventhHouseAstrologyEn,
  sixthHouseAstrologyEn,
  fifthHouseEn,
  thirdHouseAstrologyEn,
  solarPlexusChakraAffirmationsEn,
  vedicBirthChartCalculatorEn,
  fourthHouseMeaningEn,
  sacralChakraMeaningEn,
  howToFindNorthNodeEn,
  chakraTestEn,
  secondHouseAstrologyEn,
  vedicVsWesternAstrologyEn,
  crownChakraMeaningEn,
  auraReadingEn,
  firstHouseMeaningEn,
  rootChakraMeaningEn,
  trackMoodAstrologyEn,
  mercuryRetrogradeMoonAnxietyEn,
  marsAngerTriggersEn,
  bestAstrologyAppsEn,
  howToReadBirthChartEn,
  auraColorsPillarEn,
  blueAuraMeaningEn,
  yellowAuraMeaningEn,
  purpleAuraMeaningEn,
  whiteAuraMeaningEn,
  redAuraMeaningEn,
  orangeAuraMeaningEn,
  greenAuraMeaningEn,
  chakraSystemOverviewEn,
  fourElementFrameworkEn,
  auraMoonVenusRisingBridgeEn,
  astrologyHousesEn,
  eighthHouseMeaningEn,
  twelfthHouseAstrologyEn,
  ninthHouseAstrologyEn,
  eleventhHouseEn,
  northNodeVsSouthNodeEn,
  northNodeInScorpioEn,
  northNodeInTaurusEn,
  heartChakraMeaningEn,
  throatChakraMeaningEn,
  ajnaChakraEn,
  crystalsForEachChakraEn,
  astrologyTermsEn,
  sextileAstrologyEn,
  trineInAstrologyEn,
  squareAstrologyEn,
  descendantAstrologyEn,
  icAstrologyEn,
  healingYourInnerWoundEn,
  chironIn12thHouseEn,
  marsIn12thHouseEn,
  saturnInPiscesEn,
  persephoneGoddessEn,
  transitsEn,
  natalChartTransitsEn,
  june2026PlanetaryTransitsEn,
  july2026PlanetaryTransitsEn,
  highlySensitivePersonEn,
  signsOfAHighlySensitivePersonEn,
  highlySensitivePersonVsAutismEn,
  mahadashaEn,
  rahuMahadashaEn,
  ketuMahadashaEn,
  saturnMahadashaEn,
  venusMahadashaEn,
  solarReturnChartEn,
  whatIsAFullMoonRitualEn,
  fullMoonEnergyEn,
  whatToDoOnAFullMoonSpirituallyEn,
  anuradhaNakshatraEn,
  bharaniNakshatraEn,
  chironInTaurusEn,
  ashleshaNakshatraEn,
  rohiniNakshatraEn,
  southNodeEn,
  northNodeInGeminiEn,
  northNodeInSagittariusEn,
  cancerNorthNodeEn,
  junoAstrologyEn,
  howToBalanceVataDoshaEn,
  solarReturnEn,
  n3GunasEn,
  famousHighlySensitivePersonEn,
  pushyaNakshatraEn,
  nakshatraEn,
  aiAstrologyAppEn,
  sattvaRajasTamasEn,
  libraRisingHousesEn,
  leoRisingHousesEn,
  scorpioRisingHousesEn,
  fullMoonJune2026En,
  fullMoonJuly2026En,
  moonJournalEn,
  fullMoonJournalPromptsEn,
  newMoonJournalPromptsEn,
  journalPromptsEn,
  shadowWorkJournalPromptsEn,
  blackMoonLilithEn,
  compositeChartCalculatorEn,
  synastryChartCompatibilityEn,
  mrigashiraNakshatraEn,
  swatiNakshatraEn,
];

const ARTICLES_ZH: WikiArticle[] = [
  tenthHouseAstrologyZh,
  seventhHouseAstrologyZh,
  sixthHouseAstrologyZh,
  fifthHouseZh,
  thirdHouseAstrologyZh,
  solarPlexusChakraAffirmationsZh,
  vedicBirthChartCalculatorZh,
  fourthHouseMeaningZh,
  sacralChakraMeaningZh,
  howToFindNorthNodeZh,
  chakraTestZh,
  secondHouseAstrologyZh,
  vedicVsWesternAstrologyZh,
  crownChakraMeaningZh,
  auraReadingZh,
  firstHouseMeaningZh,
  rootChakraMeaningZh,
  trackMoodAstrologyZh,
  mercuryRetrogradeMoonAnxietyZh,
  marsAngerTriggersZh,
  bestAstrologyAppsZh,
  howToReadBirthChartZh,
  greenAuraMeaningZh,
  orangeAuraMeaningZh,
  astrologyHousesZh,
  eighthHouseMeaningZh,
  twelfthHouseAstrologyZh,
  ninthHouseAstrologyZh,
  eleventhHouseZh,
  northNodeVsSouthNodeZh,
  northNodeInScorpioZh,
  northNodeInTaurusZh,
  heartChakraMeaningZh,
  throatChakraMeaningZh,
  ajnaChakraZh,
  crystalsForEachChakraZh,
  astrologyTermsZh,
  sextileAstrologyZh,
  trineInAstrologyZh,
  squareAstrologyZh,
  descendantAstrologyZh,
  icAstrologyZh,
  healingYourInnerWoundZh,
  chironIn12thHouseZh,
  marsIn12thHouseZh,
  saturnInPiscesZh,
  persephoneGoddessZh,
  transitsZh,
  natalChartTransitsZh,
  june2026PlanetaryTransitsZh,
  july2026PlanetaryTransitsZh,
  highlySensitivePersonZh,
  signsOfAHighlySensitivePersonZh,
  highlySensitivePersonVsAutismZh,
  mahadashaZh,
  rahuMahadashaZh,
  ketuMahadashaZh,
  saturnMahadashaZh,
  venusMahadashaZh,
  solarReturnChartZh,
  famousHighlySensitivePersonZh,
];

// Get all articles for a language
export const getArticles = (lang: Language): WikiArticle[] => {
  return lang === "zh" ? ARTICLES_ZH : ARTICLES_EN;
};

// Get article summaries for list display
export const getArticleSummaries = (lang: Language): WikiArticleSummary[] => {
  const articles = getArticles(lang);
  return articles.map(
    ({
      slug,
      title,
      description,
      authorId,
      date,
      image,
      image_alt,
      keywords,
    }) => ({
      slug,
      title,
      description,
      authorId,
      date,
      image,
      image_alt,
      keywords,
    }),
  );
};

// Get article summaries written by a specific author (for author profile page).
// EN-only authors return an empty list under zh — caller renders empty state.
export const getArticlesByAuthor = (
  authorId: string,
  lang: Language,
): WikiArticleSummary[] =>
  getArticleSummaries(lang).filter((a) => a.authorId === authorId);

// Get single article by slug
export const getArticleBySlug = (
  slug: string,
  lang: Language,
): WikiArticle | null => {
  const articles = getArticles(lang);
  return articles.find((a) => a.slug === slug) || null;
};

// Check if a slug is an article (used for routing)
export const isArticleSlug = (slug: string): boolean => {
  // Check both language versions
  return (
    ARTICLES_EN.some((a) => a.slug === slug) ||
    ARTICLES_ZH.some((a) => a.slug === slug)
  );
};

// Seeded random number generator for consistent shuffling
const seededRandom = (seed: number): (() => number) => {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
};

// Get today's date as seed (changes daily, consistent within a day)
const getDailySeed = (): number => {
  const today = new Date();
  return (
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  );
};

// Generate article hotwords from keywords with stable daily shuffle
export const getArticleHotwords = (
  lang: Language,
  count: number = 5,
): ArticleHotword[] => {
  const articles = getArticles(lang);
  const hotwords: ArticleHotword[] = [];

  for (const article of articles) {
    for (const keyword of article.keywords) {
      hotwords.push({
        label: keyword,
        article_slug: article.slug,
      });
    }
  }

  // Use seeded random for consistent daily shuffle (prevents hydration mismatch)
  const random = seededRandom(getDailySeed());
  const shuffled = [...hotwords].sort(() => random() - 0.5);
  return shuffled.slice(0, count);
};

// Get all article slugs (for routing)
export const getAllArticleSlugs = (): string[] => {
  const slugs = new Set<string>();
  for (const article of ARTICLES_EN) {
    slugs.add(article.slug);
  }
  for (const article of ARTICLES_ZH) {
    slugs.add(article.slug);
  }
  return Array.from(slugs);
};
