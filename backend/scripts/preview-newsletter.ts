// INPUT: emailService.buildNewsletterHtml + (可选 --live) newsletterWeekly(buildPeriodSky+周期助手) + generateAIContent。
// OUTPUT: 把富周报/月报邮件 HTML 渲染到 /tmp/newsletter-preview/*.html（不发信、不写库），打印 file:// 路径供浏览器预览。
// POS: 周报/月报邮件可视化预览 CLI（纯渲染）。属 backend/scripts；更新请同步本头注释。
//
// 用法：
//   静态富样例(默认，快/免费/确定)：  cd backend && npx tsx scripts/preview-newsletter.ts
//   真实 AI 内容(需 DeepSeek key)：    cd backend && npx tsx scripts/preview-newsletter.ts --live
//   注入示例 hero 图：                 ... --hero https://www.astrologywiki.com/newsletter/2026-W26.png

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  emailService,
  type WeeklyIssueEmail,
} from "../src/services/emailService.js";

const OUT_DIR = "/tmp/newsletter-preview";
const UNSUB =
  "https://www.astrologywiki.com/api/newsletter/unsubscribe/EXAMPLE_TOKEN";

const heroArgIdx = process.argv.indexOf("--hero");
const heroUrl =
  heroArgIdx >= 0 && process.argv[heroArgIdx + 1]
    ? process.argv[heroArgIdx + 1]
    : null;

// The rich content shape the AI/prompt produces (snake_case).
interface RawContent {
  subject_line: string;
  overview_title: string;
  overview: string;
  sky_events?: Array<{ date_label: string; title: string; guidance: string }>;
  moon_moments?: Array<{ date_label: string; phase: string; note: string }>;
  lens: string;
  practice: string;
  reflection: string;
  featured: { title: string; blurb: string };
}

function mapContent(raw: RawContent): WeeklyIssueEmail {
  return {
    subject: raw.subject_line,
    heroImageUrl: heroUrl,
    overviewTitle: raw.overview_title,
    overview: raw.overview,
    skyEvents: (raw.sky_events ?? []).map((e) => ({
      dateLabel: e.date_label,
      title: e.title,
      guidance: e.guidance,
    })),
    moonMoments: (raw.moon_moments ?? []).map((m) => ({
      dateLabel: m.date_label,
      phase: m.phase,
      note: m.note,
    })),
    lens: raw.lens,
    practice: raw.practice,
    reflection: raw.reflection,
    featured: raw.featured,
  };
}

const SAMPLE_WEEKLY: RawContent = {
  subject_line: "A softer current, then a spark of nerve",
  overview_title: "Let tenderness lead the way",
  overview:
    "This week opens with the mind drifting toward feeling as Mercury settles into Cancer, so conversations may run gentler and more personal than usual. Midweek, Venus warms into Leo while a Full Moon in Capricorn invites an honest look at what you have been building, and by the weekend Mars finds fresh nerve in Aries. It is a stretch that tends to move from quiet care to open-hearted warmth to a clean burst of momentum.",
  sky_events: [
    {
      date_label: "Jun 23",
      title: "Mercury slips into Cancer",
      guidance:
        "Thinking and feeling sit closer together now, so words may carry more warmth and memory than precision. A good few days to write the message you have been putting off, or to simply say the kind thing out loud.",
    },
    {
      date_label: "Jun 25",
      title: "Venus warms into Leo",
      guidance:
        "Affection tends to grow more generous and a little theatrical, drawn to color, play, and being seen. Let yourself make something beautiful for no reason, or tell someone plainly what you appreciate about them.",
    },
    {
      date_label: "Jun 27",
      title: "Sun sextiles Uranus",
      guidance:
        "A small spark of curiosity and openness to the unexpected tends to color the day. Try saying yes to one thing slightly outside your usual routine.",
    },
    {
      date_label: "Jun 28",
      title: "Mars charges into Aries",
      guidance:
        "Drive and courage tend to sharpen, and stalled plans can suddenly want to move. Pick the one task you have been circling and take the first concrete step before the weekend ends.",
    },
  ],
  moon_moments: [
    {
      date_label: "Jun 26",
      phase: "Full Moon in Capricorn",
      note: "Full Moons illuminate what has quietly come to a head. This Capricorn culmination invites an honest look at the balance between work and rest, and lets one small thing be finished or released rather than carried forward.",
    },
  ],
  lens: "The week's inner theme is the pull between tenderness and resolve. The early Cancer and Leo tones invite you to lead with warmth and care, while the Capricorn Full Moon and Mars in Aries ask for honesty about what you are building and the nerve to act on it. Holding both at once, soft heart and steady spine, is where the real movement tends to happen.",
  practice:
    "Each morning this week, name one thing you genuinely appreciate and one small action that moves a stuck goal forward, then do just that action.",
  reflection:
    "Where in my life am I being invited to be both kinder and braver at the same time?",
  featured: {
    title: "Understanding the Full Moon",
    blurb:
      "What culminations really mean, and why release matters more than results, explained on AstrologyWiki.",
  },
};

const SAMPLE_MONTHLY: RawContent = {
  subject_line: "Give happiness a place in your heart",
  overview_title: "Give happiness a place in your heart",
  overview:
    "June opens with the mind turning toward home and belonging as Mercury enters Cancer, then warms into one of the year's most fortunate meetings when Venus joins Jupiter. As the month unfolds, Venus steps into bold Leo, Chiron settles into earthy Taurus to touch what asks for tenderness, and the New and Full Moons bracket the weeks with fresh starts and honest reckonings. By month's end, Jupiter strides into Leo and generosity of the heart takes center stage. It is a month that tends to move from quiet feeling toward open, creative warmth.",
  sky_events: [
    {
      date_label: "Jun 1",
      title: "Mercury enters Cancer",
      guidance:
        "Thinking and feeling are now closer than usual, and the mind leans toward memory, home, and belonging. A good time to leaf through an old journal, call someone who knew you young, or let your decisions be a little more guided by the heart.",
    },
    {
      date_label: "Jun 9",
      title: "Venus meets Jupiter in Cancer",
      guidance:
        "This warm, fortunate meeting tends to widen the heart and soften the room, an easy yes to connection and beauty. An excellent window for a generous gesture, a tender reunion, or the gentle start of something you care about.",
    },
    {
      date_label: "Jun 12",
      title: "Venus warms into Leo",
      guidance:
        "Affection grows brighter and more playful, drawn to color, creativity, and being seen. Let yourself enjoy something purely for the pleasure of it, and say the appreciation you usually keep quiet.",
    },
    {
      date_label: "Jun 18",
      title: "Mars squares Saturn",
      guidance:
        "Effort can meet resistance, and frustration with slow progress is common around now. Rather than forcing it, hold the friction gently and channel the energy into one steady, patient task.",
    },
    {
      date_label: "Jun 19",
      title: "Chiron enters Taurus",
      guidance:
        "This slow shift turns attention toward what feels tender around security, money, the body, and our bond with nature. Rather than fixing anything, notice gently where you long for steadier ground, and offer yourself a little patience there.",
    },
    {
      date_label: "Jun 21",
      title: "Sun enters Cancer",
      guidance:
        "The season turns and the light tilts toward home and care. Mark the threshold simply, a meal made slowly or an evening outdoors, and let yourself settle into the rhythm of the new season.",
    },
    {
      date_label: "Jun 26",
      title: "Mercury enters Leo",
      guidance:
        "Words grow warmer, bolder, and more expressive. A fitting time to speak up for an idea you believe in, or to put your name on creative work you have been keeping quiet.",
    },
    {
      date_label: "Jun 30",
      title: "Jupiter enters Leo",
      guidance:
        "Jupiter's year-shaping shift into Leo puts generosity of the heart, creativity, and quiet confidence center stage for the months ahead. Begin treating one bold, joyful intention as worth growing, and give it a little room to expand.",
    },
  ],
  moon_moments: [
    {
      date_label: "Jun 15",
      phase: "New Moon in Gemini",
      note: "New Moons are for small, sincere beginnings. Under this curious Gemini lunation, set one light intention around learning or connection and let it stay flexible rather than fixed.",
    },
    {
      date_label: "Jun 24",
      phase: "Full Moon in Capricorn",
      note: "Full Moons illuminate what has come to a head. This Capricorn culmination invites an honest look at your commitments, finishing or releasing one thing rather than piling on another.",
    },
  ],
  lens: "June's inner theme is letting warmth take up more space. The Venus-Jupiter meeting and the slow turn of Jupiter into Leo invite open-heartedness and creative confidence, while Chiron in Taurus quietly asks you to be tender with the places that feel unsteady. The month tends to reward those who lead with generosity without abandoning their need for solid ground.",
  practice:
    "Once a week this month, do one small thing purely because it brings you joy, and notice without judgment how easy or hard that is to allow.",
  reflection:
    "What would change if I treated my own happiness as something worth making room for, rather than something to earn?",
  featured: {
    title: "Venus and Jupiter: the great benefics",
    blurb:
      "Why astrology's two most generous planets feel so good when they meet, explained on AstrologyWiki.",
  },
};

async function liveContent(): Promise<{
  weekly: WeeklyIssueEmail;
  monthly: WeeklyIssueEmail;
} | null> {
  try {
    const { buildPeriodSky } = await import("../src/services/newsletterSky.js");
    const { periodStart, periodEnd, periodRange } =
      await import("../src/services/newsletterWeekly.js");
    const { generateAIContent } = await import("../src/services/ai.js");
    const now = new Date();

    const gen = async (
      cadence: "weekly" | "monthly",
      promptId: string,
    ): Promise<WeeklyIssueEmail> => {
      const sky = await buildPeriodSky(
        periodStart(cadence, now),
        periodEnd(cadence, now),
      );
      const res = await generateAIContent<RawContent>({
        promptId,
        lang: "en",
        context: { period_range: periodRange(cadence, now), cadence, sky },
      });
      return mapContent(res.content);
    };

    return {
      weekly: await gen("weekly", "newsletter-weekly"),
      monthly: await gen("monthly", "newsletter-monthly"),
    };
  } catch (err) {
    console.error(
      "--live 生成失败，回退静态样例：",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function main(): Promise<void> {
  const live = process.argv.includes("--live");
  let weekly = mapContent(SAMPLE_WEEKLY);
  let monthly = mapContent(SAMPLE_MONTHLY);
  if (live) {
    const got = await liveContent();
    if (got) {
      weekly = got.weekly;
      monthly = got.monthly;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const files: Array<[string, string]> = [
    [
      "weekly.html",
      emailService.buildNewsletterHtml(
        weekly,
        UNSUB,
        "Your week ahead · June 22 – June 28, 2026",
      ),
    ],
    [
      "monthly.html",
      emailService.buildNewsletterHtml(
        monthly,
        UNSUB,
        "Your month ahead · June 2026",
      ),
    ],
  ];

  console.log("-".repeat(72));
  console.log(`Newsletter 邮件预览  (${live ? "LIVE AI" : "静态富样例"})`);
  console.log("-".repeat(72));
  for (const [name, html] of files) {
    const path = join(OUT_DIR, name);
    writeFileSync(path, html, "utf8");
    console.log(`file://${path}`);
  }
  console.log("\n在浏览器打开上面的 file:// 链接即可预览（未发信、未写库）。");
}

// Explicit exit: --live imports the AI service which opens a Redis handle that
// would otherwise keep the process alive after rendering completes.
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("预览脚本异常：", err instanceof Error ? err.message : err);
    process.exit(1);
  });
