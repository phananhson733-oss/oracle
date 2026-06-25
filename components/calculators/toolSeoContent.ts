// INPUT: none.
// OUTPUT: Per-tool landing copy for calculator SPA pages (summary, use cases, explainer sections, FAQs).
// POS: Calculator landing-content data used by ToolSeoLandingSections. Mirrors the public calculator SEO intent
//      from scripts/generate-seo-pages.mjs so hydrated tool pages show the same useful content humans expect.

export interface ToolSeoSection {
  heading: string;
  body: string;
}

export interface ToolSeoContent {
  title: string;
  summary: string;
  useCases: string[];
  sections: ToolSeoSection[];
  faqs: ToolSeoSection[];
}

export const TOOL_SEO_CONTENT: Record<string, ToolSeoContent> = {
  "moon-sign-calculator": {
    title: "Moon Sign Calculator",
    summary:
      "Use the Moon Sign Calculator when you want the emotional layer of a chart: instincts, comfort needs, and the inner rhythm behind a birth date.",
    useCases: [
      "You know a birth date and want a fast entry point into emotional astrology.",
      "You are comparing Sun, Moon, and rising placements before reading a full chart.",
      "You want to check whether a birth time is needed for a Moon sign near a sign-change day.",
    ],
    sections: [
      {
        heading: "What is a Moon sign?",
        body: "Your Moon sign is the zodiac sign the Moon occupied at the moment you were born. Where the Sun sign reflects your core identity, the Moon sign reflects your emotional instincts, what makes you feel safe, and how you process feelings. In modern psychological astrology it is one of the most personal points in your chart.",
      },
      {
        heading: "How to find your Moon sign",
        body: "Enter your birth date in the calculator above. The Moon moves quickly, changing sign roughly every two and a half days, so a birth time helps when the Moon changed signs on your birthday. A date alone is enough for most people. No account is required.",
      },
      {
        heading: "What your Moon sign means",
        body: "Your Moon sign describes your inner emotional landscape and how you instinctively seek comfort. It points to tendencies and needs, not fixed outcomes. Treat it as a mirror for self-reflection rather than a prediction, and pair it with your Sun and rising for a fuller picture.",
      },
      {
        heading: "Using the Moon sign calculator",
        body: "This free tool uses Swiss Ephemeris astronomy for accurate placements. For a deeper reading, explore your full birth chart and the psychological astrology articles in the AstrologyWiki wiki.",
      },
    ],
    faqs: [
      {
        heading: "What is a Moon sign?",
        body: "Your Moon sign is the zodiac sign the Moon was in when you were born. It reflects your emotional instincts, needs, and inner world.",
      },
      {
        heading: "Do I need my birth time for my Moon sign?",
        body: "Usually no. A birth date is enough. A birth time only matters if the Moon changed signs on your birthday, since the Moon moves about every 2.5 days.",
      },
      {
        heading: "Is the Moon sign more important than the Sun sign?",
        body: "Neither is more important. The Sun reflects core identity and the Moon reflects emotional life; both are part of your chart.",
      },
    ],
  },
  "rising-sign-calculator": {
    title: "Rising Sign Calculator",
    summary:
      "Use the Rising Sign Calculator when you have an exact birth time and want to understand the ascendant, first impressions, and chart house structure.",
    useCases: [
      "You know the birth time and city and want the ascendant.",
      "You are building the Big Three and need the outward-facing part of the chart.",
      "You want to understand why birth time changes houses and angles so quickly.",
    ],
    sections: [
      {
        heading: "What is a rising sign?",
        body: "Your rising sign, or ascendant, is the zodiac sign that was climbing over the eastern horizon at the exact moment and place you were born. It is often described as the mask you meet the world with, your outward style and first impressions, and it sets the layout of the houses in your chart.",
      },
      {
        heading: "Why birth time matters for the ascendant",
        body: "The ascendant changes roughly every two hours, so an accurate birth time and birth city are essential to calculate it correctly. Without a known time the rising sign cannot be determined reliably, and angle-sensitive placements become approximate.",
      },
      {
        heading: "What your rising sign means",
        body: "Your rising sign colours how others first experience you and how you instinctively approach new situations. It describes a tendency and a style, not a destiny. Read it alongside your Sun and Moon for the full Big Three.",
      },
      {
        heading: "Using the rising sign calculator",
        body: "Enter your birth date, exact time, and city above. This free tool uses Swiss Ephemeris astronomy. Explore the wiki for what each rising sign expresses.",
      },
    ],
    faqs: [
      {
        heading: "What is a rising sign?",
        body: "Your rising sign, or ascendant, is the zodiac sign on the eastern horizon at your birth moment. It reflects first impressions and how you approach the world.",
      },
      {
        heading: "Why do I need my exact birth time?",
        body: "The ascendant changes about every two hours, so an exact birth time and city are required to calculate it accurately.",
      },
      {
        heading: "What if I do not know my birth time?",
        body: "Without a birth time the rising sign cannot be reliably determined. You can still calculate your Sun and Moon signs.",
      },
    ],
  },
  "big-three-calculator": {
    title: "Big Three Calculator",
    summary:
      "Use the Big Three Calculator when you want the fastest useful chart overview: Sun, Moon, and rising in one place.",
    useCases: [
      "You want a quick chart identity snapshot before reading deeper placements.",
      "You have a birth date, time, and city and want the core trio together.",
      "You want to compare the difference between identity, emotional needs, and first impressions.",
    ],
    sections: [
      {
        heading: "What are the Big Three?",
        body: "Your Big Three are your Sun, Moon, and rising signs, the three placements astrologers reach for first. Together they sketch your identity, your emotional life, and the style others first meet you with.",
      },
      {
        heading: "Sun vs Moon vs rising",
        body: "The Sun is your core identity and will; the Moon is your emotional instincts and needs; the rising is your outward manner and first impressions. Most people are a blend, and the three rarely sit in the same sign, which is why a one-line horoscope never quite fits.",
      },
      {
        heading: "How to find your Big Three",
        body: "Enter your birth date, exact time, and city above. The Sun and Moon need only the date for most people, but the rising sign requires an accurate birth time and place.",
      },
      {
        heading: "Using the Big Three calculator",
        body: "This free tool uses Swiss Ephemeris astronomy. These placements describe tendencies, not predictions. Explore the wiki to read what each sign expresses.",
      },
    ],
    faqs: [
      {
        heading: "What are the Big Three in astrology?",
        body: "Your Big Three are your Sun, Moon, and rising signs: core identity, emotional life, and outward style.",
      },
      {
        heading: "Do I need my birth time for the Big Three?",
        body: "The Sun and Moon usually need only your date, but the rising sign requires an exact birth time and city.",
      },
      {
        heading: "Why are my three signs different?",
        body: "The Sun, Moon, and rising move at different speeds, so they usually fall in different signs. That mix is what makes a chart personal.",
      },
    ],
  },
  "birth-chart-calculator": {
    title: "Birth Chart Calculator",
    summary:
      "Use the Birth Chart Calculator when you want the full natal chart foundation: planets, signs, angles, and the placements that later readings build on.",
    useCases: [
      "You have birth date, time, and city and want the most complete free chart.",
      "You need a reliable base before using synastry, solar return, or timeline tools.",
      "You want to inspect planet placements directly instead of reading only a summary.",
    ],
    sections: [
      {
        heading: "What is a birth chart?",
        body: "A birth chart, or natal chart, is a snapshot of where the Sun, Moon, and planets sat in the sky at the exact moment and place you were born. In modern psychological astrology it is the starting point for reading personality patterns and developmental themes.",
      },
      {
        heading: "What is in your chart",
        body: "Your chart places each planet in a zodiac sign: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, and the outer planets, plus your ascendant and midheaven when a birth time is known. Each placement adds a layer to the picture.",
      },
      {
        heading: "How to read your birth chart",
        body: "Start with your Sun, Moon, and rising, then look at the personal planets. The chart describes tendencies and potentials to work with, not a fixed fate. It is a tool for self-knowledge, not prediction.",
      },
      {
        heading: "Using the birth chart calculator",
        body: "Enter your birth date above; add an exact time and city for ascendant, midheaven, and houses. This free tool uses Swiss Ephemeris astronomy. Explore the wiki for deeper readings.",
      },
    ],
    faqs: [
      {
        heading: "What is a birth chart?",
        body: "A birth chart is a snapshot of the Sun, Moon, and planets at the moment and place you were born, the basis for reading personality patterns in astrology.",
      },
      {
        heading: "Is the birth chart calculator free?",
        body: "Yes. You can calculate your natal placements for free, with no account required.",
      },
      {
        heading: "Do I need my birth time?",
        body: "A date gives you most planetary signs. An exact birth time and city are needed for your ascendant, midheaven, and house placements.",
      },
    ],
  },
  "current-planets": {
    title: "Current Planets",
    summary:
      "Use Current Planets when you want a live snapshot of the sky: planet signs, degrees, and retrograde status for today or another date.",
    useCases: [
      "You want to know where the planets are right now.",
      "You are checking a transit article and need the current sky as reference.",
      "You want astronomy facts first, before interpreting how the sky relates to a personal chart.",
    ],
    sections: [
      {
        heading: "What are the current planet positions?",
        body: "The current planets are where the Sun, Moon, and planets sit in the zodiac at this moment. This free tool shows each planet by sign and degree, updated for the current day, so you can see the sky as astrologers read it right now.",
      },
      {
        heading: "How to read the current sky",
        body: "Each row shows a planet, the sign it occupies, and the degree within that sign. Planets marked Rx are retrograde, meaning they appear to move backward from Earth. Sign positions are geocentric, so they are the same wherever you live.",
      },
      {
        heading: "Why the current planets matter",
        body: "The slow outer planets set the broad mood while the faster Moon, Mercury, Venus, and Mars shift the day-to-day texture. These positions describe the present sky as a tendency to reflect on, not a fixed prediction of events.",
      },
      {
        heading: "Using the current planets tool",
        body: "Pick any date to see the sky for that day, or leave it on today. This free tool uses Swiss Ephemeris astronomy. To see how the current sky meets your own chart, build your birth chart in the AstrologyWiki calculators.",
      },
    ],
    faqs: [
      {
        heading: "Where are the planets right now?",
        body: "This tool shows the current position of each planet by zodiac sign and degree, computed for today on real Swiss Ephemeris astronomy.",
      },
      {
        heading: "What does Rx mean?",
        body: "Rx marks a planet that is retrograde, appearing to move backward from Earth. It is an optical effect of orbital motion, not a planet actually reversing.",
      },
      {
        heading: "Do current planet positions depend on my location?",
        body: "No. Planetary sign positions are geocentric, so they are the same everywhere. Only the ascendant and houses depend on your location and time.",
      },
    ],
  },
  "moon-phase-calculator": {
    title: "Moon Phase Calculator",
    summary:
      "Use the Moon Phase Calculator when you want the lunar phase, illumination, and Moon sign for a specific date.",
    useCases: [
      "You want to check today's Moon phase or a date in the past or future.",
      "You are planning content or journaling around a lunar cycle.",
      "You want to distinguish the Moon phase from the Moon sign.",
    ],
    sections: [
      {
        heading: "What is a moon phase?",
        body: "A moon phase is the shape of the lit part of the Moon as seen from Earth, set by the angle between the Sun and Moon. The cycle runs from new Moon through waxing crescent, first quarter, waxing gibbous, full Moon, and back through the waning phases over about 29.5 days.",
      },
      {
        heading: "How the moon phase is calculated",
        body: "This calculator measures the angular distance between the Sun and Moon for the date you choose, then maps it to one of the eight phases and an illumination percentage. The numbers come from Swiss Ephemeris astronomy, so they match what you see in the sky.",
      },
      {
        heading: "Moon phase and the Moon sign",
        body: "Alongside the phase, the tool shows the zodiac sign and degree the Moon occupies that day. The phase describes the light; the sign describes the Moon position in the zodiac. Together they give a fuller picture of the lunar day.",
      },
      {
        heading: "Using the moon phase calculator",
        body: "Pick any date to see its phase, illumination, and Moon sign, past, present, or future. The phase is a description of the sky, not a forecast. For your personal Moon, try the Moon sign calculator.",
      },
    ],
    faqs: [
      {
        heading: "What moon phase is it today?",
        body: "Leave the date on today and the calculator shows the current phase, illumination percent, and the Moon sign on real astronomy.",
      },
      {
        heading: "What are the eight moon phases?",
        body: "New Moon, waxing crescent, first quarter, waxing gibbous, full Moon, waning gibbous, last quarter, and waning crescent. The cycle repeats about every 29.5 days.",
      },
      {
        heading: "What does illumination percent mean?",
        body: "It is the share of the visible Moon disc that is lit by the Sun, from zero at new Moon to fifty percent at the quarters and one hundred at full Moon.",
      },
    ],
  },
  "ephemeris-calculator": {
    title: "Ephemeris Calculator",
    summary:
      "Use the Ephemeris Calculator when you need a date range table of planet positions for transit work, sign changes, or retrograde checks.",
    useCases: [
      "You need daily, weekly, or monthly planet positions in a table.",
      "You are looking for sign changes, stations, or retrograde periods.",
      "You want source data before writing or reading a transit interpretation.",
    ],
    sections: [
      {
        heading: "What is an ephemeris?",
        body: "An ephemeris is a table that lists where each planet sits in the zodiac on a series of dates. Astronomers and astrologers have used ephemerides for centuries to track when planets change sign, turn retrograde, or form aspects. This free tool builds one for any range you choose.",
      },
      {
        heading: "How to use the ephemeris calculator",
        body: "Choose a start date, an end date, and an interval of daily, weekly, or monthly. The table then shows every major planet by sign and degree for each step, with a small R marking retrograde motion. Positions are computed for 00:00 UTC of each date.",
      },
      {
        heading: "Reading sign changes and retrogrades",
        body: "Scanning down a column shows when a planet moves from one sign to the next or slows to a retrograde station. These shifts are the backbone of transit work. The table reports astronomy as fact and does not predict outcomes.",
      },
      {
        heading: "Ephemeris accuracy and limits",
        body: "Positions use Swiss Ephemeris, the same engine professional software relies on. Very large ranges are capped to keep the table readable, so narrow the dates or widen the interval to cover a longer span. For your own chart, use the birth chart calculator.",
      },
    ],
    faqs: [
      {
        heading: "What is an ephemeris used for?",
        body: "An ephemeris tracks planet positions over time, so you can see when planets change sign, turn retrograde, or form aspects, which is the basis of transit astrology.",
      },
      {
        heading: "Can I generate an ephemeris for any year?",
        body: "Yes, within a broad range. Pick a start and end date; very long spans are capped for readability, so use a weekly or monthly interval to cover more time.",
      },
      {
        heading: "Are the positions accurate?",
        body: "Yes. The table uses Swiss Ephemeris astronomy, the same high-precision engine used by professional astrology software.",
      },
    ],
  },
  "electional-astrology": {
    title: "Electional Astrology",
    summary:
      "Use Electional Astrology when you want a neutral timing reference: Moon phase, Moon sign, and the aspect balance for upcoming days.",
    useCases: [
      "You want a day-by-day sky rhythm for planning.",
      "You need a neutral timing view without a prediction or guarantee.",
      "You want to compare the Moon phase, Moon sign, and aspect balance across a range.",
    ],
    sections: [
      {
        heading: "What is electional astrology?",
        body: "Electional astrology looks at the conditions of the sky over a span of days as context for planning. This free tool reads the Moon phase, the Moon sign, and the balance of supportive and challenging aspects for each upcoming day. It describes astronomy, not destiny, and never points to a single right day.",
      },
      {
        heading: "How the timing view works",
        body: "Pick a start date and how many days to view. For each day the tool computes the Moon phase from the Sun and Moon, the sign the Moon occupies, and the count of harmonious and challenging aspects among the classical planets. A neutral tone label of Flowing, Mixed, or Dynamic summarises that balance.",
      },
      {
        heading: "Reading the day tone",
        body: "Flowing means the sky holds more supportive aspects that day, Dynamic means more tension, and Mixed means the two are roughly even. The label only describes the aspect balance. It is not a good or bad rating, and what happens depends on you rather than on the sky.",
      },
      {
        heading: "Using electional timing well",
        body: "There is no rule that any sky tone suits any task; this tool simply gives you background context alongside your own plans and priorities, never an instruction. Treat it as rhythm to notice, not direction to follow. To see how these movements touch your own chart, build your birth chart.",
      },
    ],
    faqs: [
      {
        heading: "Does electional astrology predict the future?",
        body: "No. This tool describes the astronomical conditions of upcoming days as a reflection for planning. It does not predict outcomes or guarantee results.",
      },
      {
        heading: "What does the day tone mean?",
        body: "The tone summarises how many supportive versus challenging aspects the sky holds that day: Flowing for more supportive, Dynamic for more tension, and Mixed for a rough balance. It is not a good or bad rating.",
      },
      {
        heading: "How many days can I view?",
        body: "You can view seven, fourteen, or thirty days from your chosen start date, using Swiss Ephemeris astronomy for each day.",
      },
    ],
  },
  "rodden-rating": {
    title: "Rodden Rating",
    summary:
      "Use the Rodden Rating tool when you need to understand how reliable a birth time is before trusting ascendant, houses, or angle-based readings.",
    useCases: [
      "You are unsure whether a birth time comes from an official record, memory, or biography.",
      "You want to know which chart factors remain reliable when the time is approximate.",
      "You are preparing a chart reading and need to label data quality clearly.",
    ],
    sections: [
      {
        heading: "What is the Rodden Rating?",
        body: "The Rodden Rating is a system created by data astrologer Lois Rodden to record how trustworthy the source of a birth time is. AA means an official birth record, A means the person or family supplied it, B means a biography, C means there is no source so caution is needed, DD means sources conflict, and X means the time is unknown. It rates the data source, not whether a chart is good or bad.",
      },
      {
        heading: "Why birth time accuracy matters",
        body: "The Ascendant and the house cusps move quickly, about one degree every four minutes, so a rounded or missing time leaves them approximate. Planet signs and usually the Moon sign do not depend on an exact minute, so they stay reliable even when the time is rough. Knowing your rating tells you which parts of the chart to lean on.",
      },
      {
        heading: "How to use this calculator",
        body: "Choose how you know your birth time, from a hospital record down to unknown. The tool shows the matching Rodden code, a confidence level, and a simple breakdown of whether your Ascendant, houses, and Moon to the degree can be trusted, with a short note on what to do at that level.",
      },
      {
        heading: "What to do with a low rating",
        body: "A low or unknown rating does not make a chart useless. Planet signs still describe a great deal. For full house detail you can search for an original record, or ask an astrologer to attempt birth time rectification. A noon or solar chart is a common stand-in when the time is unknown.",
      },
    ],
    faqs: [
      {
        heading: "Does a low Rodden Rating mean my chart is wrong?",
        body: "No. It only means the birth time source is less certain, so the Ascendant and houses are approximate. Planet signs and usually the Moon sign remain reliable.",
      },
      {
        heading: "What is the best Rodden Rating?",
        body: "AA is the most reliable, meaning the time comes from an official birth record. A from the person or family is also strong.",
      },
      {
        heading: "Can I use astrology without a birth time?",
        body: "Yes. A noon or solar chart still gives reliable planet signs and many aspects; only the Ascendant, houses, and exact Moon need caution.",
      },
    ],
  },
  "synastry-calculator": {
    title: "Synastry Calculator",
    summary:
      "Use the Synastry Calculator when you want to compare two charts and see the aspects between one person's planets and another's.",
    useCases: [
      "You want a relationship chart comparison without reducing it to a score.",
      "You have two birth dates and cities and want the major cross-aspects.",
      "You want to compare synastry with a composite relationship chart.",
    ],
    sections: [
      {
        heading: "What is synastry?",
        body: "Synastry is the branch of astrology that compares two birth charts to study the connections between them. By measuring the aspects, the angles between the planets of one chart and the planets of the other, it maps where two people meet with ease and where they meet friction.",
      },
      {
        heading: "How the synastry calculator works",
        body: "Enter the birth date and city for two people, and a birth time if you have it to sharpen the Moon and the chart angles. The tool builds both charts on Swiss Ephemeris astronomy, then finds the major aspects between the two sets of planets, sorted by how exact each one is.",
      },
      {
        heading: "Reading the aspects between two charts",
        body: "Trines and sextiles tend to describe flow and ease; squares and oppositions describe tension that can drive growth; conjunctions blend two energies together. The mix is a portrait of a connection, not a score and not a verdict on whether a relationship will last.",
      },
      {
        heading: "Synastry and privacy",
        body: "This is a free tool with no account required. The names you enter stay in your browser and are never sent anywhere. Only the birth dates and cities are used to compute the charts. For a deeper written reading, explore the synastry articles in the AstrologyWiki wiki.",
      },
    ],
    faqs: [
      {
        heading: "What is a synastry chart?",
        body: "A synastry chart compares two birth charts to show the aspects between them, the angular connections between one set of planets and the other.",
      },
      {
        heading: "Do I need birth times for synastry?",
        body: "A date and city are enough for the planetary aspects. A birth time sharpens the Moon and the chart angles, making the comparison more precise.",
      },
      {
        heading: "Is the synastry calculator free?",
        body: "Yes. You can compare two charts for free with no account, and the names you enter never leave your device.",
      },
    ],
  },
  "composite-calculator": {
    title: "Composite Chart Calculator",
    summary:
      "Use the Composite Chart Calculator when you want one midpoint chart for the relationship itself, separate from each person's natal chart.",
    useCases: [
      "You want to study a partnership as its own symbolic chart.",
      "You already compared two charts and want a second relationship lens.",
      "You want midpoint placements without sending names or private notes anywhere.",
    ],
    sections: [
      {
        heading: "What is a composite chart?",
        body: "A composite chart is a single chart built from the midpoints between the planets of two birth charts. Where synastry compares two separate charts, a composite merges them into one symbolic chart that represents the relationship itself, treated as a third entity.",
      },
      {
        heading: "How the composite calculator works",
        body: "Enter the birth date and city for two people, and a birth time if you have it. The tool builds both charts on Swiss Ephemeris astronomy, then places each composite planet at the midpoint of the two original positions and shows the sign and degree for each.",
      },
      {
        heading: "Reading your composite chart",
        body: "Read the composite Sun, Moon, and planets the way you would read a birth chart, but as a portrait of the partnership rather than a person. It describes the character and themes of a connection, not a forecast of whether it will last.",
      },
      {
        heading: "Composite vs synastry",
        body: "Synastry studies the aspects between two charts; the composite condenses both into one relationship chart. Many astrologers use them together. For the aspect view, try the synastry calculator, and see the AstrologyWiki wiki for a deeper written guide.",
      },
    ],
    faqs: [
      {
        heading: "What is a composite chart?",
        body: "A composite chart is a single chart made from the midpoints of two birth charts, representing the relationship itself rather than either individual.",
      },
      {
        heading: "How is a composite chart different from synastry?",
        body: "Synastry compares the aspects between two separate charts; a composite merges them into one chart that symbolises the partnership.",
      },
      {
        heading: "Do I need birth times for a composite chart?",
        body: "A date and city give you the planetary midpoints. A birth time sharpens the Moon and is needed for the composite angles.",
      },
    ],
  },
  "solar-return-calculator": {
    title: "Solar Return Calculator",
    summary:
      "Use the Solar Return Calculator when you want the exact birthday return chart for a chosen year and the themes it highlights.",
    useCases: [
      "You want to calculate the exact moment the Sun returns to its natal degree.",
      "You are reading annual chart themes and need the return placements first.",
      "You want to compare the solar return chart with your natal chart.",
    ],
    sections: [
      {
        heading: "What is a solar return?",
        body: "A solar return is the moment each year when the transiting Sun returns to the exact zodiac position it held at your birth. It usually falls on or within a day of your birthday. The chart cast for that moment is your solar return chart, traditionally read as the themes of the year ahead.",
      },
      {
        heading: "How the solar return calculator works",
        body: "Enter your birth date, time, and city, then choose a year. The tool finds your natal Sun position on Swiss Ephemeris astronomy, solves for the exact instant the Sun returns to it that year, and shows the planetary placements at that moment.",
      },
      {
        heading: "Why birth time matters",
        body: "The Sun moves about one degree per day, so a precise birth time pins the natal Sun more exactly and sharpens the return moment. Without a time the return is computed from a midday estimate and is approximate.",
      },
      {
        heading: "Reading your solar return chart",
        body: "Read the solar return placements as a portrait of the year, the way you would read a birth chart for a person. It describes themes and emphases to reflect on, not fixed events. Pair it with your natal chart for context.",
      },
    ],
    faqs: [
      {
        heading: "What is a solar return chart?",
        body: "It is the chart cast for the exact moment the Sun returns to its natal position each year, traditionally read as the themes of the coming year.",
      },
      {
        heading: "Is the solar return on my birthday?",
        body: "It falls on or within about a day of your birthday, because the calendar and the solar year do not match exactly.",
      },
      {
        heading: "Do I need my birth time for a solar return?",
        body: "A birth time makes the return moment more precise. Without it the chart is computed from a midday estimate and is approximate.",
      },
    ],
  },
  "celebrity-twins": {
    title: "Celebrity Astro Twins",
    summary:
      "Use Celebrity Astro Twins when you want a lightweight, birth-date-only way to see famous people who share your Sun sign.",
    useCases: [
      "You only know a birth month and day.",
      "You want a low-friction astrology entry point before a full chart.",
      "You want to understand Sun signs, elements, modalities, and cusp notes through examples.",
    ],
    sections: [
      {
        heading: "What are celebrity astro twins?",
        body: "Celebrity astro twins are well known people who share your Sun sign, the zodiac sign the Sun was passing through on the day you were born. Because the Sun sign depends only on the date, you can find your matches from a birthday alone. This free tool lines you up with famous figures across the arts, science, sport, and history who were born under the same sign.",
      },
      {
        heading: "How the celebrity twins matcher works",
        body: "Choose your birth month and day. The tool reads the tropical Sun sign for that date and lists famous people who share it, drawn from a curated set of public birth dates. It also groups figures who share your element, so you can see the wider family of signs that carry a similar temperament. No birth time and no account are needed.",
      },
      {
        heading: "Sun signs, elements and modalities",
        body: "Every Sun sign belongs to one of four elements, fire, earth, air, or water, and to one of three modalities, cardinal, fixed, or mutable. These groupings describe a broad style rather than fixed traits. Sharing a sign or an element with someone is a point of common flavour, not a rule about character or destiny.",
      },
      {
        heading: "A note on cusps and birth times",
        body: "The date when the Sun moves from one sign to the next drifts by about a day from year to year. If your birthday sits right on a boundary, your Sun could be in the neighbouring sign, and only a full birth chart with your birth time can settle it. For most dates the Sun sign read from the date is reliable.",
      },
    ],
    faqs: [
      {
        heading: "Can I find my celebrity twins without a birth time?",
        body: "Yes. Your Sun sign depends only on your birth date, so the month and day are enough to match you with famous people who share it. A birth time is only needed near a sign boundary or for the rest of the chart.",
      },
      {
        heading: "How are the celebrity birth dates chosen?",
        body: "The figures are drawn from widely documented public birth dates, and each one is placed at a date that sits clearly within a single sign, so the match does not depend on a birth time.",
      },
      {
        heading: "Does sharing a Sun sign mean we are alike?",
        body: "Not on its own. A shared Sun sign is one point in common out of a whole chart. It is a fun starting point, not a verdict on personality or compatibility.",
      },
    ],
  },
  astrocartography: {
    title: "Astrocartography Map",
    summary:
      "Use Astrocartography when you want to project your birth chart onto a world map and explore where each planetary angle was emphasized.",
    useCases: [
      "You have an exact birth time and want a relocation-style map.",
      "You want to inspect AC, DC, MC, and IC lines for each planet.",
      "You want a reflective place-based lens, not a prediction about where to live.",
    ],
    sections: [
      {
        heading: "What is astrocartography?",
        body: "Astrocartography, also called relocation astrology, projects the sky at the moment of your birth onto a map of the world. For each planet it draws the places where that planet was angular at your birth: on the meridian overhead or below, and on the eastern or western horizon. It is a way to explore yourself through place rather than a forecast of any location.",
      },
      {
        heading: "How the astrocartography map works",
        body: "Enter your birth date, exact birth time, and city. The tool builds your chart on Swiss Ephemeris astronomy, converts each planet to its sky coordinates, and computes four lines per planet across the globe. A birth time is essential here, because the lines shift by about fifteen degrees of longitude for every hour of birth time.",
      },
      {
        heading: "Reading the planetary lines",
        body: "Each planet draws four lines. The MC line is the meridian where the planet was culminating, highest in the sky; the IC line is its opposite, the lower meridian. The AC line is the curve where the planet was rising on the eastern horizon, and the DC line is where it was setting in the west. Show or hide each planet to keep the map readable.",
      },
      {
        heading: "Using your astrocartography map",
        body: "A line passing near a place simply marks where one planetary theme from your own chart is emphasised. It is a prompt for reflection and curiosity, not a prediction that anything will happen there and not a guarantee of any outcome. Treat it as one lens among many, and pair it with your full birth chart for context.",
      },
    ],
    faqs: [
      {
        heading: "Does astrocartography predict what will happen if I move?",
        body: "No. The lines describe where each planet was angular at your birth. They are a reflective tool for exploring places, not a forecast of events and not a guarantee of any outcome.",
      },
      {
        heading: "Why do I need an exact birth time?",
        body: "The angle lines depend on the precise moment of birth and shift about fifteen degrees of longitude per hour. Without an accurate time the map cannot be placed correctly.",
      },
      {
        heading: "What do the MC, IC, AC and DC lines mean?",
        body: "MC is where a planet was culminating overhead, IC is the lower meridian opposite it, AC is where it was rising in the east, and DC is where it was setting in the west.",
      },
    ],
  },
  "saturn-return-calculator": {
    title: "Saturn Return Calculator",
    summary:
      "Use the Saturn Return Calculator when you want the personal dates for Saturn returning to its natal position and a grounded way to frame that life-cycle window.",
    useCases: [
      "You want to know when your first, second, or third Saturn Return begins, peaks, and ends.",
      "You know a birth date and want a timing window even if the exact birth time is missing.",
      "You want to pair Saturn Return timing with your full birth chart before reading deeper themes.",
    ],
    sections: [
      {
        heading: "What is a Saturn Return?",
        body: "A Saturn Return is the moment the planet Saturn comes back to the exact position it held in the sky when you were born. Because Saturn takes about 29.5 years to orbit the Sun, this homecoming happens at roughly ages 27-30, 56-60, and 85-90. Astrologers treat it as a threshold between life chapters: the end of one structure and the building of the next.",
      },
      {
        heading: "When is my Saturn Return?",
        body: "Your first Saturn Return usually begins between ages 27 and 30. Enter your birth date in the calculator above to get your personal Saturn Return dates, including when Saturn first enters its return and when it finishes. The exact timing depends on the year you were born, because Saturn does not move at a perfectly even pace.",
      },
      {
        heading: "How long does a Saturn Return last?",
        body: "A Saturn Return is not a single day. It is a transit that unfolds over roughly two to three years as Saturn moves across its birth position, often retrograding back and forth. Most people feel it most strongly in the year Saturn is exactly conjunct its natal point.",
      },
      {
        heading: "What does the Saturn Return mean?",
        body: "In modern psychological astrology, the Saturn Return is associated with maturity, responsibility, and realigning your life with your real values. It is not a prediction of fate. It tends to surface questions about career, relationships, and identity: a developmental checkpoint where you decide what to keep building and what to let go.",
      },
      {
        heading: "Using the Saturn Return Calculator",
        body: "This free calculator uses your birth date to estimate your Saturn Return window. No account or birth time is required. For a deeper reading, pair your Saturn Return dates with your full birth chart and the psychological astrology articles in the AstrologyWiki wiki.",
      },
    ],
    faqs: [
      {
        heading: "What is a Saturn Return?",
        body: "A Saturn Return is when the planet Saturn returns to the position it held at your birth, roughly every 29.5 years. It usually marks a transition between major life chapters.",
      },
      {
        heading: "When is my Saturn Return?",
        body: "Your first Saturn Return usually begins between ages 27 and 30. Enter your birth date in the Saturn Return Calculator to get your personal Saturn Return dates.",
      },
      {
        heading: "How long does a Saturn Return last?",
        body: "A Saturn Return unfolds over about two to three years as Saturn crosses its birth position, with the strongest effect in the year it is exactly conjunct its natal point.",
      },
      {
        heading: "Do I need my exact birth time?",
        body: "Exact birth time helps place Saturn in the houses, but Saturn moves slowly enough that date-based Saturn Return windows remain useful when the time is unknown.",
      },
    ],
  },
  "energy-timeline": {
    title: "Energy Timeline",
    summary:
      "Use the Energy Timeline when you want a visual rhythm of how active your transits are across days, months, or longer life-cycle views.",
    useCases: [
      "You want to see busier and quieter transit periods instead of reading a single daily horoscope.",
      "You want to inspect the themes behind peaks without treating them as good or bad days.",
      "You want a sample public timeline first, then create your own from birth details.",
    ],
    sections: [
      {
        heading: "What is the Energy Timeline?",
        body: "The Energy Timeline is a free astrology tool that turns your transits, how the moving planets relate to your birth chart, into a day-by-day candlestick chart of energy intensity. Instead of a single horoscope, you see a rhythm: stretches where a lot is moving in your sky, and quieter stretches where things settle. The height of each candle reflects how active the energy is, measured only against your own range.",
      },
      {
        heading: "How the transit candles work",
        body: "Each candle summarises one day. The thin line shows the full range the energy moved across that day; the bar shows where it started and where it ended. Start, peak, low, and end are an interval summary, not a stock chart open, high, low, and close, and they carry no buy, sell, or up-is-good meaning.",
      },
      {
        heading: "How to read your energy rhythm",
        body: "Read height as loud versus quiet, not good versus bad. A tall candle is a day with a lot of astrological movement, which can feel intense whether the theme is flowing or challenging. A flat candle is a calmer, more consolidating stretch. Tap any day to see what is active and which transit is driving it.",
      },
      {
        heading: "Is the Energy Timeline a prediction?",
        body: "No. The Energy Timeline maps tendencies in your transits for self-reflection and timing awareness. It does not predict events, outcomes, or fate, and it is not medical, psychological, or financial advice. Use it to plan when you might want to push or rest, not as a forecast of what will happen.",
      },
      {
        heading: "Using the Energy Timeline",
        body: "Open the timeline above to explore a public demo, then create your own from your birth date, time, and city to see your personal energy rhythm for any month. For a deeper day-by-day reading, pair your timeline with the AstrologyWiki birth chart and transit tools.",
      },
    ],
    faqs: [
      {
        heading: "What is an astrology energy timeline?",
        body: "It is a day-by-day candlestick chart of your transit energy intensity: how active the moving planets are relative to your birth chart.",
      },
      {
        heading: "Are the energy candles like a stock chart?",
        body: "No. The candlestick shape is only a familiar way to show a daily range. It carries no buy, sell, or up-is-good meaning.",
      },
      {
        heading: "Does a high bar mean a good day?",
        body: "No. Height means loud versus quiet, not good versus bad. A tall candle is a day with a lot of astrological movement.",
      },
      {
        heading: "Is the Energy Timeline fortune-telling?",
        body: "No. It maps tendencies in your transits for self-reflection and timing, and does not predict events, outcomes, or fate.",
      },
    ],
  },
};

export const getToolSeoContent = (
  slug: string | undefined,
): ToolSeoContent | null => {
  if (!slug) return null;
  return TOOL_SEO_CONTENT[slug] ?? null;
};
