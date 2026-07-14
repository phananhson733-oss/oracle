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
// A2 linkable asset (2026-06-18) — EN-only, data computed via backend/_astro-calendar-2026.mjs
import { astrologyCalendar2026En } from "./2026-astrology-calendar";
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
import { hastaNakshatraEn } from "./hasta-nakshatra";
import { krittikaNakshatraEn } from "./krittika-nakshatra";
import { ashwiniNakshatraEn } from "./ashwini-nakshatra";
import { neptuneInPiscesEn } from "./neptune-in-pisces";
import { worldCup2026AstrologyPredictionEn } from "./world-cup-2026-astrology-prediction";
import { worldCup2026AstrologyPredictionZh } from "./world-cup-2026-astrology-prediction";
import { mbappeBirthChartEn } from "./mbappe-birth-chart";
import { mbappeBirthChartZh } from "./mbappe-birth-chart";
import { lionelMessiZodiacSignEn } from "./lionel-messi-zodiac-sign";
import { lionelMessiZodiacSignZh } from "./lionel-messi-zodiac-sign";
import { cristianoRonaldoZodiacSignEn } from "./cristiano-ronaldo-zodiac-sign";
import { lamineYamalBirthChartEn } from "./lamine-yamal-birth-chart";
import { viniciusJrZodiacSignEn } from "./vinicius-jr-zodiac-sign";
import { argentinaWorldCup2026AstrologyEn } from "./argentina-world-cup-2026-astrology";
import { zodiacSignsAsWorldCup2026TeamsEn } from "./zodiac-signs-as-world-cup-2026-teams";
import { bestSoccerPlayersZodiacSignEn } from "./best-soccer-players-zodiac-sign";
import { worldCup2026JuneAstrologyEn } from "./world-cup-2026-june-astrology";
import { cristianoRonaldoZodiacSignZh } from "./cristiano-ronaldo-zodiac-sign";
import { lamineYamalBirthChartZh } from "./lamine-yamal-birth-chart";
import { viniciusJrZodiacSignZh } from "./vinicius-jr-zodiac-sign";
import { argentinaWorldCup2026AstrologyZh } from "./argentina-world-cup-2026-astrology";
import { zodiacSignsAsWorldCup2026TeamsZh } from "./zodiac-signs-as-world-cup-2026-teams";
import { bestSoccerPlayersZodiacSignZh } from "./best-soccer-players-zodiac-sign";
import { worldCup2026JuneAstrologyZh } from "./world-cup-2026-june-astrology";
import { moonRisingSignEn } from "./moon-rising-sign";
import { northNodeInLeoEn } from "./north-node-in-leo";
import { emotionJournalEn } from "./emotion-journal";
import { blueNodeAstrologyEn } from "./blue-node-astrology";
import { rahuAndKetuAstrologyEn } from "./rahu-and-ketu-astrology";
import { uttaraBhadrapadaNakshatraEn } from "./uttara-bhadrapada-nakshatra";
import { uttaraPhalguniNakshatraEn } from "./uttara-phalguni-nakshatra";
import { purvaBhadrapadaNakshatraEn } from "./purva-bhadrapada-nakshatra";
import { revatiNakshatraEn } from "./revati-nakshatra";
import { punarvasuNakshatraEn } from "./punarvasu-nakshatra";
import { maghaNakshatraEn } from "./magha-nakshatra";
import { ardraNakshatraEn } from "./ardra-nakshatra";
import { dhanishtaNakshatraEn } from "./dhanishta-nakshatra";
import { saturnInAries2026En } from "./saturn-in-aries-2026";
import { uranusOppositionEn } from "./uranus-opposition";
import { marsReturnAstrologyEn } from "./mars-return-astrology";
import { ascendantMeaningEn } from "./ascendant-meaning";
import { cancerRisingEn } from "./cancer-rising";
import { virgoRisingEn } from "./virgo-rising";
import { geminiRisingEn } from "./gemini-rising";
import { emotionJournalZh } from "./emotion-journal";
import { blueNodeAstrologyZh } from "./blue-node-astrology";
import { northNodeInLeoZh } from "./north-node-in-leo";
import { rahuAndKetuAstrologyZh } from "./rahu-and-ketu-astrology";
import { uttaraBhadrapadaNakshatraZh } from "./uttara-bhadrapada-nakshatra";
import { uttaraPhalguniNakshatraZh } from "./uttara-phalguni-nakshatra";
import { purvaBhadrapadaNakshatraZh } from "./purva-bhadrapada-nakshatra";
import { revatiNakshatraZh } from "./revati-nakshatra";
import { punarvasuNakshatraZh } from "./punarvasu-nakshatra";
import { maghaNakshatraZh } from "./magha-nakshatra";
import { ardraNakshatraZh } from "./ardra-nakshatra";
import { dhanishtaNakshatraZh } from "./dhanishta-nakshatra";
import { saturnInAries2026Zh } from "./saturn-in-aries-2026";
import { uranusOppositionZh } from "./uranus-opposition";
import { marsReturnAstrologyZh } from "./mars-return-astrology";
import { ascendantMeaningZh } from "./ascendant-meaning";
import { cancerRisingZh } from "./cancer-rising";
import { virgoRisingZh } from "./virgo-rising";
import { geminiRisingZh } from "./gemini-rising";
import { moonRisingSignZh } from "./moon-rising-sign";
import { vozinhaBirthChartEn } from "./vozinha-birth-chart";
import { germanyWorldCupPlayersBirthChart2026En } from "./germany-world-cup-players-birth-chart-2026";
import { germanyWorldCup2026AstrologyTeamEn } from "./germany-world-cup-2026-astrology-team";
import { viniciusJrBirthChartAstrologyEn } from "./vinicius-jr-birth-chart-astrology";
import { scotlandWorldCup2026AstrologySaturnReturnEn } from "./scotland-world-cup-2026-astrology-saturn-return";
import { vozinhaBirthChartZh } from "./vozinha-birth-chart";
import { germanyWorldCupPlayersBirthChart2026Zh } from "./germany-world-cup-players-birth-chart-2026";
import { germanyWorldCup2026AstrologyTeamZh } from "./germany-world-cup-2026-astrology-team";
import { viniciusJrBirthChartAstrologyZh } from "./vinicius-jr-birth-chart-astrology";
import { scotlandWorldCup2026AstrologySaturnReturnZh } from "./scotland-world-cup-2026-astrology-saturn-return";
import { judeBellinghamBirthChartEn } from "./jude-bellingham-birth-chart";
import { judeBellinghamBirthChartZh } from "./jude-bellingham-birth-chart";
import { erlingHaalandBirthChartEn } from "./erling-haaland-birth-chart";
import { erlingHaalandBirthChartZh } from "./erling-haaland-birth-chart";
import { messiWorldCupRecordAstrologyEn } from "./messi-world-cup-record-astrology";
import { messiWorldCupRecordAstrologyZh } from "./messi-world-cup-record-astrology";
import { harryKaneBirthChartEn } from "./harry-kane-birth-chart";
import { harryKaneBirthChartZh } from "./harry-kane-birth-chart";
import { cancerZodiacWorldCup2026En } from "./cancer-zodiac-world-cup-2026";
import { cancerZodiacWorldCup2026Zh } from "./cancer-zodiac-world-cup-2026";
import { jamesRodriguezBirthChartEn } from "./james-rodriguez-birth-chart";
import { jamesRodriguezBirthChartZh } from "./james-rodriguez-birth-chart";
import { luisDiazBirthChartEn } from "./luis-diaz-birth-chart";
import { luisDiazBirthChartZh } from "./luis-diaz-birth-chart";
import { christianPulisicBirthChartEn } from "./christian-pulisic-birth-chart";
import { christianPulisicBirthChartZh } from "./christian-pulisic-birth-chart";
import { yoaneWissaBirthChartEn } from "./yoane-wissa-birth-chart";
import { yoaneWissaBirthChartZh } from "./yoane-wissa-birth-chart";
import { englandWorldCup2026AstrologyEn } from "./england-world-cup-2026-astrology";
import { englandWorldCup2026AstrologyZh } from "./england-world-cup-2026-astrology";
import { spainWorldCup2026AstrologyEn } from "./spain-world-cup-2026-astrology";
import { spainWorldCup2026AstrologyZh } from "./spain-world-cup-2026-astrology";
import { matheusCunhaBirthChartEn } from "./matheus-cunha-birth-chart";
import { matheusCunhaBirthChartZh } from "./matheus-cunha-birth-chart";
import { chironInTaurus2026AstrologyEn } from "./chiron-in-taurus-2026-astrology";
import { chironInTaurus2026AstrologyZh } from "./chiron-in-taurus-2026-astrology";
import { toyStory5ZodiacSignsEn } from "./toy-story-5-zodiac-signs";
import { toyStory5ZodiacSignsZh } from "./toy-story-5-zodiac-signs";
import { scotlandBrazilWorldCupAstrologyEn } from "./scotland-brazil-world-cup-astrology";
import { scotlandBrazilWorldCupAstrologyZh } from "./scotland-brazil-world-cup-astrology";
import { nikoBirthChartEn } from "./niko-birth-chart";
import { princeWilliamBirthChartEn } from "./prince-william-birth-chart";
import { moSalahBirthChartEn } from "./mo-salah-birth-chart";
import { jeremyDokuBirthChartEn } from "./jeremy-doku-birth-chart";
import { fatherSDayAstrology2026En } from "./father-s-day-astrology-2026";
import { bukayoSakaZodiacSignEn } from "./bukayo-saka-zodiac-sign";
import { lukaModricZodiacSignEn } from "./luka-modric-zodiac-sign";
import { brunoFernandesZodiacSignEn } from "./bruno-fernandes-zodiac-sign";
import { cancerSeason2026AstrologyEn } from "./cancer-season-2026-astrology";
import { rhaenyraTargaryenZodiacSignEn } from "./rhaenyra-targaryen-zodiac-sign";
import { bukayoSakaZodiacSignZh } from "./bukayo-saka-zodiac-sign";
import { lukaModricZodiacSignZh } from "./luka-modric-zodiac-sign";
import { brunoFernandesZodiacSignZh } from "./bruno-fernandes-zodiac-sign";
import { rhaenyraTargaryenZodiacSignZh } from "./rhaenyra-targaryen-zodiac-sign";
import { cancerSeason2026AstrologyZh } from "./cancer-season-2026-astrology";
import { kylieJennerZodiacSignEn } from "./kylie-jenner-zodiac-sign";
import { gretaLeeZodiacSignEn } from "./greta-lee-zodiac-sign";
import { sharonOsbourneZodiacSignEn } from "./sharon-osbourne-zodiac-sign";
import { thomasParteyZodiacSignEn } from "./thomas-partey-zodiac-sign";
import { marcusRashfordZodiacSignEn } from "./marcus-rashford-zodiac-sign";
import { mariahCareyZodiacSignEn } from "./mariah-carey-zodiac-sign";
import { emmaWatsonZodiacSignEn } from "./emma-watson-zodiac-sign";
import { darwinNunezZodiacSignEn } from "./darwin-nunez-zodiac-sign";
import { folarinBalogunBirthChartEn } from "./folarin-balogun-birth-chart";
import { rickyGervaisZodiacSignEn } from "./ricky-gervais-zodiac-sign";
import { reeseWitherspoonOliverHaarmannCompatibilityAstrologyEn } from "./reese-witherspoon-oliver-haarmann-compatibility-astrology";
import { jwowwZackCarpinelloWeddingSynastryEn } from "./jwoww-zack-carpinello-wedding-synastry";
import { jordanVsArgentinaEn } from "./jordan-vs-argentina";
import { colombiaVsPortugalEn } from "./colombia-vs-portugal";
import { taylorSwiftAndTravisKelceEn } from "./taylor-swift-and-travis-kelce";
import { harryStylesAndZoKravitzEn } from "./harry-styles-and-zo-kravitz";
import { serenaWilliamsBirthChartEn } from "./serena-williams-birth-chart";
import { jannikSinnerZodiacSignEn } from "./jannik-sinner-zodiac-sign";
import { teyanaTaylorBirthChartEn } from "./teyana-taylor-birth-chart";
import { benSheltonZodiacSignEn } from "./ben-shelton-zodiac-sign";
import { moroccoWorldCup2026AstrologyEn } from "./morocco-world-cup-2026-astrology";
import { carlosAlcarazBirthChartEn } from "./carlos-alcaraz-birth-chart";
import { usaPlutoReturnAstrologyEn } from "./usa-pluto-return-astrology";
import { cardiBBirthChartEn } from "./cardi-b-birth-chart";
import { prideMonthAstrologyEn } from "./pride-month-astrology";
import { totalSolarEclipse2026En } from "./total-solar-eclipse-2026";
import { lebronJamesBirthChartEn } from "./lebron-james-birth-chart";
import { mayaJointBirthChartEn } from "./maya-joint-birth-chart";
import { bellaHadidBirthChartEn } from "./bella-hadid-birth-chart";
import { elliotPageBirthChartEn } from "./elliot-page-birth-chart";
import { thylaneBlondeauBirthChartEn } from "./thylane-blondeau-birth-chart";
import { angelaNikolauBirthChartEn } from "./angela-nikolau-birth-chart";
import { johnDenverBirthChartEn } from "./john-denver-birth-chart";
import { veraWangBirthChartEn } from "./vera-wang-birth-chart";
import { cocoGauffBirthChartEn } from "./coco-gauff-birth-chart";
import { jaylenBrownBirthChartEn } from "./jaylen-brown-birth-chart";
import { penLopeCruzBirthChartEn } from "./pen-lope-cruz-birth-chart";
import { tobeyMaguireBirthChartEn } from "./tobey-maguire-birth-chart";
import { travisKelceBirthChartEn } from "./travis-kelce-birth-chart";
import { diogoJotaBirthChartEn } from "./diogo-jota-birth-chart";
import { achrafHakimiBirthChartEn } from "./achraf-hakimi-birth-chart";
import { maliaObamaBirthChartEn } from "./malia-obama-birth-chart";
import { rayanCherkiBirthChartEn } from "./rayan-cherki-birth-chart";
import { kylianMbappBirthChartEn } from "./kylian-mbapp-birth-chart";
import { colePalmerBirthChartEn } from "./cole-palmer-birth-chart";
import { erlingHaalandGirlfriendBirthChartEn } from "./erling-haaland-girlfriend-birth-chart";
import { jessicaPegulaBirthChartEn } from "./jessica-pegula-birth-chart";
import { englandVsNorwayAstrologyEn } from "./england-vs-norway-astrology";
import { anneHathawayBirthChartEn } from "./anne-hathaway-birth-chart";
import { kevinDeBruyneBirthChartEn } from "./kevin-de-bruyne-birth-chart";
import { arthurFeryBirthChartEn } from "./arthur-fery-birth-chart";
import { alexanderZverevBirthChartEn } from "./alexander-zverev-birth-chart";
import { kaiCenatZodiacSignEn } from "./kai-cenat-zodiac-sign";
import { egyptWorldCup2026AstrologyEn } from "./egypt-world-cup-2026-astrology";
import { lamineYamalZodiacSignEn } from "./lamine-yamal-zodiac-sign";
import { kylianMbappeBirthChartEn } from "./kylian-mbappe-birth-chart";
import { novakDjokovicZodiacSignEn } from "./novak-djokovic-zodiac-sign";
import { cocoGauffZodiacSignEn } from "./coco-gauff-zodiac-sign";
import { moSalahZodiacSignEn } from "./mo-salah-zodiac-sign";
import { justinVerlanderBirthChartEn } from "./justin-verlander-birth-chart";
import { jackAntonoffBirthChartEn } from "./jack-antonoff-birth-chart";
import { kateUptonBirthChartEn } from "./kate-upton-birth-chart";
import { ayoEdebiriBirthChartEn } from "./ayo-edebiri-birth-chart";
import { zendayaBirthChartEn } from "./zendaya-birth-chart";
import { quintaBrunsonBirthChartEn } from "./quinta-brunson-birth-chart";
import { karolinaMuchovaBirthChartEn } from "./karolina-muchova-birth-chart";
import { antoineGriezmannBirthChartEn } from "./antoine-griezmann-birth-chart";
import { mexicoVsEnglandAstrologyPredictionEn } from "./mexico-vs-england-astrology-prediction";
import { spainVsFranceWorldCup2026AstrologyEn } from "./spain-vs-france-world-cup-2026-astrology";
import { mikelMerinoBirthChartEn } from "./mikel-merino-birth-chart";
import { priyankaChopraBirthChartEn } from "./priyanka-chopra-birth-chart";
import { rodriBirthChartEn } from "./rodri-birth-chart";
import { sinnerVsZverevWimbledonFinalAstrologyEn } from "./sinner-vs-zverev-wimbledon-final-astrology";
import { samNeillBirthChartEn } from "./sam-neill-birth-chart";
import { jeffBezosBirthChartEn } from "./jeff-bezos-birth-chart";
import { paigeBueckersBirthChartEn } from "./paige-bueckers-birth-chart";
import { franceVsSpainWorldCup2026AstrologyPredictionEn } from "./france-vs-spain-world-cup-2026-astrology-prediction";
import { englandVsArgentinaWorldCup2026AstrologyPredictionEn } from "./england-vs-argentina-world-cup-2026-astrology-prediction";
import { whyDoIAttractToxicPeopleEn } from "./why-do-i-attract-toxic-people";
import { whatIsMyLifePurposeEn } from "./what-is-my-life-purpose";
import { whyAmIStillSingleEn } from "./why-am-i-still-single";
import { lindaNoskovaBirthChartEn } from "./linda-noskova-birth-chart";
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
  astrologyCalendar2026En,
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
  hastaNakshatraEn,
  krittikaNakshatraEn,
  ashwiniNakshatraEn,
  neptuneInPiscesEn,
  worldCup2026AstrologyPredictionEn,
  mbappeBirthChartEn,
  lionelMessiZodiacSignEn,
  cristianoRonaldoZodiacSignEn,
  lamineYamalBirthChartEn,
  viniciusJrZodiacSignEn,
  argentinaWorldCup2026AstrologyEn,
  zodiacSignsAsWorldCup2026TeamsEn,
  bestSoccerPlayersZodiacSignEn,
  worldCup2026JuneAstrologyEn,
  moonRisingSignEn,
  northNodeInLeoEn,
  emotionJournalEn,
  blueNodeAstrologyEn,
  rahuAndKetuAstrologyEn,
  uttaraBhadrapadaNakshatraEn,
  uttaraPhalguniNakshatraEn,
  purvaBhadrapadaNakshatraEn,
  revatiNakshatraEn,
  punarvasuNakshatraEn,
  maghaNakshatraEn,
  ardraNakshatraEn,
  dhanishtaNakshatraEn,
  saturnInAries2026En,
  uranusOppositionEn,
  marsReturnAstrologyEn,
  ascendantMeaningEn,
  cancerRisingEn,
  virgoRisingEn,
  geminiRisingEn,
  vozinhaBirthChartEn,
  germanyWorldCupPlayersBirthChart2026En,
  germanyWorldCup2026AstrologyTeamEn,
  viniciusJrBirthChartAstrologyEn,
  scotlandWorldCup2026AstrologySaturnReturnEn,
  judeBellinghamBirthChartEn,
  erlingHaalandBirthChartEn,
  messiWorldCupRecordAstrologyEn,
  harryKaneBirthChartEn,
  cancerZodiacWorldCup2026En,
  jamesRodriguezBirthChartEn,
  luisDiazBirthChartEn,
  christianPulisicBirthChartEn,
  yoaneWissaBirthChartEn,
  englandWorldCup2026AstrologyEn,
  spainWorldCup2026AstrologyEn,
  matheusCunhaBirthChartEn,
  chironInTaurus2026AstrologyEn,
  toyStory5ZodiacSignsEn,
  scotlandBrazilWorldCupAstrologyEn,
  nikoBirthChartEn,
  princeWilliamBirthChartEn,
  moSalahBirthChartEn,
  jeremyDokuBirthChartEn,
  fatherSDayAstrology2026En,
  bukayoSakaZodiacSignEn,
  lukaModricZodiacSignEn,
  brunoFernandesZodiacSignEn,
  cancerSeason2026AstrologyEn,
  rhaenyraTargaryenZodiacSignEn,
  kylieJennerZodiacSignEn,
  gretaLeeZodiacSignEn,
  sharonOsbourneZodiacSignEn,
  thomasParteyZodiacSignEn,
  marcusRashfordZodiacSignEn,
  mariahCareyZodiacSignEn,
  emmaWatsonZodiacSignEn,
  darwinNunezZodiacSignEn,
  folarinBalogunBirthChartEn,
  rickyGervaisZodiacSignEn,
  reeseWitherspoonOliverHaarmannCompatibilityAstrologyEn,
  jwowwZackCarpinelloWeddingSynastryEn,
  jordanVsArgentinaEn,
  colombiaVsPortugalEn,
  taylorSwiftAndTravisKelceEn,
  harryStylesAndZoKravitzEn,
  serenaWilliamsBirthChartEn,
  jannikSinnerZodiacSignEn,
  teyanaTaylorBirthChartEn,
  benSheltonZodiacSignEn,
  moroccoWorldCup2026AstrologyEn,
  carlosAlcarazBirthChartEn,
  usaPlutoReturnAstrologyEn,
  cardiBBirthChartEn,
  prideMonthAstrologyEn,
  totalSolarEclipse2026En,
  lebronJamesBirthChartEn,
  mayaJointBirthChartEn,
  bellaHadidBirthChartEn,
  elliotPageBirthChartEn,
  thylaneBlondeauBirthChartEn,
  angelaNikolauBirthChartEn,
  johnDenverBirthChartEn,
  veraWangBirthChartEn,
  cocoGauffBirthChartEn,
  jaylenBrownBirthChartEn,
  penLopeCruzBirthChartEn,
  tobeyMaguireBirthChartEn,
  travisKelceBirthChartEn,
  diogoJotaBirthChartEn,
  achrafHakimiBirthChartEn,
  maliaObamaBirthChartEn,
  rayanCherkiBirthChartEn,
  kylianMbappBirthChartEn,
  colePalmerBirthChartEn,
  erlingHaalandGirlfriendBirthChartEn,
  jessicaPegulaBirthChartEn,
  englandVsNorwayAstrologyEn,
  anneHathawayBirthChartEn,
  kevinDeBruyneBirthChartEn,
  arthurFeryBirthChartEn,
  alexanderZverevBirthChartEn,
  kaiCenatZodiacSignEn,
  egyptWorldCup2026AstrologyEn,
  lamineYamalZodiacSignEn,
  kylianMbappeBirthChartEn,
  novakDjokovicZodiacSignEn,
  cocoGauffZodiacSignEn,
  moSalahZodiacSignEn,
  justinVerlanderBirthChartEn,
  jackAntonoffBirthChartEn,
  kateUptonBirthChartEn,
  ayoEdebiriBirthChartEn,
  zendayaBirthChartEn,
  quintaBrunsonBirthChartEn,
  karolinaMuchovaBirthChartEn,
  antoineGriezmannBirthChartEn,
  mexicoVsEnglandAstrologyPredictionEn,
  spainVsFranceWorldCup2026AstrologyEn,
  mikelMerinoBirthChartEn,
  priyankaChopraBirthChartEn,
  rodriBirthChartEn,
  sinnerVsZverevWimbledonFinalAstrologyEn,
  samNeillBirthChartEn,
  jeffBezosBirthChartEn,
  paigeBueckersBirthChartEn,
  franceVsSpainWorldCup2026AstrologyPredictionEn,
  englandVsArgentinaWorldCup2026AstrologyPredictionEn,
  whyDoIAttractToxicPeopleEn,
  whatIsMyLifePurposeEn,
  whyAmIStillSingleEn,
  lindaNoskovaBirthChartEn,
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
  worldCup2026AstrologyPredictionZh,
  mbappeBirthChartZh,
  lionelMessiZodiacSignZh,
  cristianoRonaldoZodiacSignZh,
  lamineYamalBirthChartZh,
  viniciusJrZodiacSignZh,
  argentinaWorldCup2026AstrologyZh,
  zodiacSignsAsWorldCup2026TeamsZh,
  bestSoccerPlayersZodiacSignZh,
  worldCup2026JuneAstrologyZh,
  emotionJournalZh,
  blueNodeAstrologyZh,
  northNodeInLeoZh,
  rahuAndKetuAstrologyZh,
  uttaraBhadrapadaNakshatraZh,
  uttaraPhalguniNakshatraZh,
  purvaBhadrapadaNakshatraZh,
  revatiNakshatraZh,
  punarvasuNakshatraZh,
  maghaNakshatraZh,
  ardraNakshatraZh,
  dhanishtaNakshatraZh,
  saturnInAries2026Zh,
  uranusOppositionZh,
  marsReturnAstrologyZh,
  ascendantMeaningZh,
  cancerRisingZh,
  virgoRisingZh,
  geminiRisingZh,
  moonRisingSignZh,
  vozinhaBirthChartZh,
  germanyWorldCupPlayersBirthChart2026Zh,
  germanyWorldCup2026AstrologyTeamZh,
  viniciusJrBirthChartAstrologyZh,
  scotlandWorldCup2026AstrologySaturnReturnZh,
  judeBellinghamBirthChartZh,
  erlingHaalandBirthChartZh,
  messiWorldCupRecordAstrologyZh,
  harryKaneBirthChartZh,
  cancerZodiacWorldCup2026Zh,
  jamesRodriguezBirthChartZh,
  luisDiazBirthChartZh,
  christianPulisicBirthChartZh,
  yoaneWissaBirthChartZh,
  englandWorldCup2026AstrologyZh,
  spainWorldCup2026AstrologyZh,
  matheusCunhaBirthChartZh,
  chironInTaurus2026AstrologyZh,
  toyStory5ZodiacSignsZh,
  scotlandBrazilWorldCupAstrologyZh,
  bukayoSakaZodiacSignZh,
  lukaModricZodiacSignZh,
  brunoFernandesZodiacSignZh,
  rhaenyraTargaryenZodiacSignZh,
  cancerSeason2026AstrologyZh,
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
      seoTitle,
      description,
      seoDescription,
      authorId,
      date,
      image,
      image_alt,
      keywords,
    }) => ({
      slug,
      title,
      seoTitle,
      description,
      seoDescription,
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
