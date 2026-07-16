// INPUT: Approved English Saturn Return landing-page brief and exact-pass calculator contract.
// OUTPUT: One content model for the SPA, static SEO page, FAQPage, WebApplication, BreadcrumbList, and HowTo schema.
// POS: Saturn Return landing source of truth; do not duplicate this copy in components or generators.

const SITE_URL = "https://www.astrologywiki.com";
const CANONICAL_PATH = "/en/saturn-return-calculator";

const birthChartLink = {
  label: "free birth chart calculator",
  href: "/en/birth-chart-calculator",
};

export const saturnReturnLandingContent = {
  language: "en",
  // SEO adds the site suffix once. The final document title is exactly:
  // “Saturn Return Calculator – Free Saturn Return Dates | AstrologyWiki”.
  title: "Saturn Return Calculator – Free Saturn Return Dates",
  h1: "Saturn Return Calculator — Free Saturn Return Dates",
  heroSubtitle:
    "Enter your birth date to calculate your personal Saturn Return window. Discover when your first, second, and third returns fall, how long each lasts, and what it means for this chapter of your life.",
  trustLine: "Free · No sign-up required · Instant results",
  description:
    "Calculate your Saturn Return dates free. Enter your birth date to find your exact return window — first, second, and third returns included. No sign-up required.",
  keywords: [
    "saturn return calculator",
    "saturn return dates",
    "when is my saturn return",
    "saturn return meaning",
    "exact saturn return date",
  ],
  sections: [
    {
      heading: "How to Use the Saturn Return Calculator",
      intro: [
        "The calculator requires only one input — your birth date — and returns your complete Saturn Return timeline in seconds.",
        "Your result separates the full return window from its closest or exact conjunction dates, so you can see both the broader active period and the points where Saturn revisits your natal degree. Date-only results remain clearly marked as estimates; adding birth time and city unlocks the calculator's exact-pass precision.",
        "Use the timeline as an educational timing reference, then place it beside your actual circumstances, responsibilities, and available support. A return window can help organize reflection and planning, but it does not guarantee a particular career, relationship, financial, health, or personal outcome.",
      ],
      items: [
        {
          heading: "Step 1 — Enter Your Birth Date",
          paragraphs: [
            "Type your full birth date (day, month, and year) into the calculator. A birth time is not required for an estimated return window. Saturn moves slowly enough that date-only results are accurate to within a few weeks.",
            "If you want to pair your Saturn Return dates with house placements for a deeper reading, use the free birth chart calculator alongside this tool.",
          ],
          links: [{ paragraph: 1, ...birthChartLink }],
        },
        {
          heading: "Step 2 — Read Your Return Window",
          paragraphs: [
            "Your results show a date range, not a single day. This is intentional: Saturn retrogrades — moving forward, then backward, then forward again — which means it can cross your natal position two or three times. The window shows the full active period of your return.",
          ],
        },
        {
          heading: "Step 3 — Identify Your Peak Date",
          paragraphs: [
            "Within the window, there is typically a peak date when Saturn is exactly conjunct its natal position. This is the point of highest intensity. Use the window for broader planning; use the peak date for specific timing decisions.",
            "For exact conjunction passes and UTC timestamps, add your birth time and city. Without both, the calculator labels the closest date as an estimate rather than presenting false precision.",
          ],
        },
        {
          heading: "Tips for More Accurate Results",
          bullets: [
            "Use your legal birth date, not an estimated one",
            "If you were born near midnight, double-check whether your date falls on the day before or after",
            "For house-specific timing, add a birth chart reading via the birth chart calculator",
          ],
          links: [{ bullet: 2, label: "birth chart calculator", href: "/en/birth-chart-calculator" }],
        },
      ],
    },
    {
      heading: "What Your Saturn Return Results Mean",
      intro: [
        "Saturn takes 29.5 years to complete one orbit of the Sun. When it returns to the exact degree it occupied at your birth, the transit activates a concentrated period of structural reassessment — what astrologers call a Saturn Return. The calculator returns all three returns in your lifetime.",
      ],
      items: [
        {
          heading: "First Saturn Return — Ages 27 to 30",
          paragraphs: [
            "The first return is typically the most disruptive. Career choices made at 21 are tested, relationships formed in early adulthood are examined, and the scaffolding of your 20s either holds or needs rebuilding. Saturn asks: are you building something real, or moving by default?",
            "Common first return themes: career pivots, ending long-term relationships, relocating, taking on adult financial responsibility for the first time.",
          ],
        },
        {
          heading: "Second Saturn Return — Ages 56 to 60",
          paragraphs: [
            "The second return surfaces questions about legacy and authenticity. Mid-career shifts, reassessment of what you built in your 30s and 40s, and questions about what the second half of life should look like are common. Saturn asks: what is actually worth continuing?",
            "Common second return themes: early retirement consideration, career reinvention, relationship renegotiation, health-driven lifestyle changes.",
          ],
        },
        {
          heading: "Third Saturn Return — Ages 85 to 90",
          paragraphs: [
            "The third return is a period of final integration. Less disruptive in the structural sense, it tends to bring reflection on what was built and what can now be released. Saturn asks: what is the through-line of your life?",
            "Common third return themes: releasing long-held roles or identities, reconciling past decisions, a deepened sense of what was genuinely meaningful versus what was pursued out of obligation.",
          ],
        },
        {
          heading: "Your Saturn Return Window — Start and End Dates",
          paragraphs: [
            "The window represents the full duration of the transit. Most people feel the effects begin before the exact peak date and taper off in the months after. Planning major decisions for the window's midpoint — rather than its edges — gives the most accurate timing context.",
            "The start date marks when Saturn first enters within a few degrees of its natal position. The end date marks when Saturn has moved sufficiently past that point for the transit to lose its concentrated pressure. Between those two dates, the return is considered active — even if the most intense experiences tend to cluster around the peak.",
          ],
        },
        {
          heading: "Saturn Return by Zodiac Sign",
          paragraphs: [
            "Your natal Saturn sign shapes the domain where the return plays out. Each sign corresponds to a specific life theme:",
            "The table above is a quick reference. Each sign's return themes, typical timelines, and what to watch for are explored in full in the Saturn Return by Sign guides — see the Saturn Return wiki series →",
          ],
          links: [
            {
              paragraph: 1,
              label: "Saturn Return wiki series →",
              href: "/en/wiki/saturn-return-in-scorpio",
            },
          ],
          table: {
            columns: ["Saturn Sign", "Return Domain"],
            rows: [
              ["Aries", "Identity, self-direction, breaking inherited patterns"],
              ["Taurus", "Financial structure, values, material security"],
              ["Gemini", "Communication, learning commitments, mental frameworks"],
              ["Cancer", "Family, home, emotional foundations"],
              ["Leo", "Creative output, recognition, self-expression"],
              ["Virgo", "Health, daily structure, work integrity"],
              ["Libra", "Partnership, fairness, relational commitments"],
              ["Scorpio", "Power, transformation, what you've been avoiding"],
              ["Sagittarius", "Belief systems, direction, philosophical rebuilding"],
              ["Capricorn", "Career structure, authority, long-term ambition"],
              ["Aquarius", "Community, independence, systemic thinking"],
              ["Pisces", "Boundaries, spirituality, what needs releasing"],
            ],
          },
        },
        {
          heading: "Saturn Return Retrograde Periods",
          paragraphs: [
            "During a Saturn Return, Saturn typically retrogrades at least once across its natal position. This creates multiple passes: a direct pass, a retrograde pass, and a final direct pass. The retrograde period often brings internalization — what felt clear on the direct pass becomes more nuanced. The final direct pass usually brings resolution.",
            "This three-pass structure is why many people experience the Saturn Return as having distinct phases: an initial disruption, a period of reconsideration, and a final consolidation. If you notice the calculator shows a wide date range, a retrograde is almost always the reason.",
            "Read the direct and retrograde labels as descriptions of planetary motion, not as good-or-bad judgments. One return can have one, two, or three exact passes, and the calculator displays each detected pass in chronological order so that the timing remains transparent rather than collapsing a complex transit into one misleading date.",
          ],
        },
        {
          heading: "Reading the Peak Conjunction Date",
          paragraphs: [
            "The peak date is when Saturn is at 0° orb from its natal position — the tightest alignment. If you're using the return for planning, the 3–6 months surrounding the peak date are the most active period for decisions, transitions, and reassessment.",
          ],
        },
      ],
    },
    {
      heading: "Who Should Use the Saturn Return Calculator",
      items: [
        {
          heading: "You're in Your Late 20s and Feeling Stuck",
          paragraphs: [
            "If you're between 27 and 30 and sensing that the direction you've been heading no longer fits — career, relationship, location, or identity — you may be in your first Saturn Return window. The calculator confirms whether Saturn is actively transiting its natal position, which gives that instinct a timing framework.",
          ],
        },
        {
          heading: "You Want to Understand a Major Life Transition",
          paragraphs: [
            "If a significant change happened in your late 20s, late 50s, or mid-80s and you want to understand the astrological context, enter your birth date to see whether that period aligns with a Saturn Return window.",
          ],
        },
        {
          heading: "You're Preparing for a Career or Relationship Decision",
          paragraphs: [
            "Saturn Return dates function as timing context — not predictions. Knowing that a major transit is active can help you be more intentional about decisions rather than reactive. The return window is a planning tool, not a deterministic forecast.",
          ],
        },
        {
          heading: "You're a Practitioner Reading for Clients",
          paragraphs: [
            "If you're doing astrology readings professionally or as a student, this calculator gives you a fast Saturn Return window based on birth date alone, without requiring full chart software. Add a birth time and city when a client needs exact conjunction passes rather than the date-only estimate.",
          ],
        },
      ],
    },
    {
      heading: "Frequently Asked Questions",
      items: [],
    },
  ],
  faqs: [
    {
      question: "Can I calculate my Saturn Return without a birth time?",
      answer:
        "Yes. Saturn moves slowly enough that a birth date alone produces an accurate return window. Your exact birth time is not required for the date-only estimate. If you want the calculator to list exact conjunction passes and UTC timestamps, add both birth time and city; house placements also require a full birth chart calculation.",
    },
    {
      question: "What birth information do I need?",
      answer:
        "Only your birth date (day, month, year) is needed for an estimated Saturn Return window. No birth time or birth location is required for that result. For exact conjunction passes, add your birth time and city. For Saturn's house position, use the birth chart calculator with your time and location.",
      links: [{ label: "birth chart calculator", href: "/en/birth-chart-calculator" }],
    },
    {
      question: "Why does my Saturn Return show a date range instead of one day?",
      answer:
        "Saturn retrogrades — it moves forward, then backward, then forward again across the same degree. This means it crosses your natal Saturn position more than once, creating a window rather than a single date. The full window represents the active period of the transit; the peak date within it represents the tightest alignment.",
    },
    {
      question: "How many Saturn Returns does the calculator show?",
      answer:
        "The calculator shows all three: your first return (ages 27–30), second return (ages 56–60), and third return (ages 85–90). Each appears as a separate date window in your results. Their precise timing depends on your natal Saturn degree, so entering your details is more useful than relying on an age range alone.",
    },
    {
      question: "What does it mean if I'm in two Saturn Return windows at once?",
      answer:
        "This doesn't happen. Each of the three Saturn Returns is separated by approximately 29.5 years. If your results show overlapping windows, check that your birth date was entered correctly and submit again. Multiple exact passes can occur within one return window because of retrograde motion, but they remain part of that single return.",
    },
    {
      question: "Is this Saturn Return calculator accurate?",
      answer:
        "The calculator uses Saturn's ephemeris data to identify when Saturn transits its natal position based on your birth date. Date-only results are accurate to within a few weeks for most birth dates. Adding birth time and city lets the calculator resolve the natal moment and calculate exact conjunction passes instead of an estimated closest date.",
    },
    {
      question: "Is the Saturn Return calculator free?",
      answer:
        "Yes. The AstrologyWiki Saturn Return Calculator is completely free to use. No account, no sign-up, and no payment are required. You can calculate an estimated return window from your birth date, or add birth time and city for exact-pass precision, without changing that free-access policy.",
    },
    {
      question: "How is a Saturn Return different from other Saturn transits?",
      answer:
        "Saturn transits happen continuously as Saturn moves through each sign — everyone born in a given year experiences the same general Saturn transits. A Saturn Return is personal: it only occurs when Saturn returns to the exact degree it held at your birth, which happens approximately every 29.5 years. That personalization is why it carries a different weight than generalized transits.",
    },
    {
      question: "What should I do during a Saturn Return?",
      answer:
        "Use the dates as a framework for intentional reflection rather than a forecast of what will happen. The return tends to surface structural questions — about what you're building, who you're building it with, and whether the direction still fits. Decisions made during this window often carry long-term weight, so deliberate planning is more useful than reactive pivoting. For deeper reading, explore the Saturn Return guides in the wiki →",
      links: [
        {
          label: "Saturn Return guides in the wiki →",
          href: "/en/wiki/saturn-return-complete-guide",
        },
      ],
    },
    {
      question: "Can a Saturn Return affect me before the exact window dates?",
      answer:
        "Yes. Most people report feeling a build-up 6–12 months before Saturn's first exact conjunction. The approach phase, with Saturn moving toward its natal position, often brings the initial surfacing of the return's themes before the peak date confirms them. Treat that timing as an invitation to reflect, not a prediction of a specific event.",
    },
  ],
  relatedToolsHeading: "Other Free Astrology Calculators",
  relatedTools: [
    {
      label: "Free Birth Chart Calculator",
      description:
        "Generate your complete natal chart — planet positions, house placements, and rising sign — from your birth date, time, and location.",
      cta: "Calculate your birth chart",
      href: "/en/birth-chart-calculator",
    },
    {
      label: "Compatibility Calculator",
      description:
        "Enter two birth dates to see planetary compatibility, aspect patterns, and relationship dynamics.",
      cta: "Check compatibility",
      href: "/en/compatibility-calculator",
    },
    {
      label: "Moon Sign Calculator",
      description:
        "Find your natal Moon sign and understand how it shapes your emotional patterns and instinctive responses.",
      cta: "Find your Moon sign",
      href: "/en/moon-sign-calculator",
    },
  ],
  // Explicit product decision: articles are hidden until the four planned posts publish.
  relatedArticles: [],
};

export const saturnReturnFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: saturnReturnLandingContent.language,
  mainEntity: saturnReturnLandingContent.faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export const saturnReturnWebApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Saturn Return Calculator",
  url: SITE_URL + CANONICAL_PATH,
  description: saturnReturnLandingContent.description,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  provider: {
    "@type": "Organization",
    name: "AstrologyWiki",
    url: SITE_URL,
  },
};

export const saturnReturnBreadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL + "/en",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Saturn Return Calculator",
      item: SITE_URL + CANONICAL_PATH,
    },
  ],
};

export const saturnReturnHowToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use the Saturn Return Calculator",
  description:
    "Enter your birth date to calculate your Saturn Return window, then read the full active period and peak date.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Enter Your Birth Date",
      text: "Enter your full birth date. Add birth time and city when you need exact conjunction passes.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Read Your Return Window",
      text: "Review the start and end dates for the full active period, including any retrograde passes.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Identify Your Peak Date",
      text: "Use the closest or exact conjunction date as the peak timing reference within the return window.",
    },
  ],
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInlineLink = (text, link) => {
  const safeText = escapeHtml(text);
  if (!link) return safeText;
  const label = escapeHtml(link.label);
  return safeText.replace(
    label,
    '<a href="' + escapeHtml(link.href) + '">' + label + "</a>",
  );
};

const linksFor = (item, field, index) =>
  item.links?.find((link) => link[field] === index);

/** Render static HTML without adding FAQ questions to the approved H3 structure. */
export const renderSaturnReturnLandingHtml = () => {
  const sections = saturnReturnLandingContent.sections
    .map((section) => {
      const intro = (section.intro ?? [])
        .map((paragraph) => "<p>" + escapeHtml(paragraph) + "</p>")
        .join("");
      const items = section.items
        .map((item) => {
          const paragraphs = (item.paragraphs ?? [])
            .map(
              (paragraph, index) =>
                "<p>" +
                renderInlineLink(paragraph, linksFor(item, "paragraph", index)) +
                "</p>",
            )
            .join("");
          const bullets = item.bullets?.length
            ? "<ul>" +
              item.bullets
                .map(
                  (bullet, index) =>
                    "<li>" +
                    renderInlineLink(bullet, linksFor(item, "bullet", index)) +
                    "</li>",
                )
                .join("") +
              "</ul>"
            : "";
          const table = item.table
            ? '<div class="saturn-sign-table"><table><thead><tr>' +
              item.table.columns
                .map((column) => '<th scope="col">' + escapeHtml(column) + "</th>")
                .join("") +
              "</tr></thead><tbody>" +
              item.table.rows
                .map(
                  (row) =>
                    "<tr>" +
                    row
                      .map((cell) => "<td>" + escapeHtml(cell) + "</td>")
                      .join("") +
                    "</tr>",
                )
                .join("") +
              "</tbody></table></div>"
            : "";
          return "<h3>" + escapeHtml(item.heading) + "</h3>" + paragraphs + bullets + table;
        })
        .join("");
      const faqs =
        section.heading === "Frequently Asked Questions"
          ? '<div class="saturn-faqs">' +
            saturnReturnLandingContent.faqs
              .map(
                (faq) =>
                  "<details><summary>" +
                  escapeHtml(faq.question) +
                  "</summary><p>" +
                  renderInlineLink(faq.answer, faq.links?.[0]) +
                  "</p></details>",
              )
              .join("") +
            "</div>"
          : "";
      return (
        "<section><h2>" +
        escapeHtml(section.heading) +
        "</h2>" +
        intro +
        items +
        faqs +
        "</section>"
      );
    })
    .join("");
  const relatedTools = saturnReturnLandingContent.relatedTools
    .map(
      (tool) =>
        '<li><a href="' +
        escapeHtml(tool.href) +
        '"><strong>' +
        escapeHtml(tool.label) +
        "</strong><span>" +
        escapeHtml(tool.description) +
        "</span><em>" +
        escapeHtml(tool.cta) +
        " →</em></a></li>",
    )
    .join("");

  return (
    '<nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/en">Home</a></li><li aria-current="page">Saturn Return Calculator</li></ol></nav>' +
    sections +
    "<section><h2>" +
    escapeHtml(saturnReturnLandingContent.relatedToolsHeading) +
    '</h2><nav class="saturn-related-tools" aria-label="Other free astrology calculators"><ul>' +
    relatedTools +
    "</ul></nav></section>"
  );
};
