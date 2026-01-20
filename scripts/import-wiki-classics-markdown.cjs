const fs = require('fs/promises');
const path = require('path');

const SOURCE_DIR = '/Users/wzb/Documents/genwiki';
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'src', 'data', 'wiki-classics-markdown.js');

const CATEGORY_GROUPS = {
  Foundation: [
    'contemporary-astrologers-handbook-analysis',
    'aspects-in-astrology-analysis',
    'the-twelve-houses-analysis',
    'astrology-psychology-and-the-four-elements-analysis',
    'chart-interpretation-handbook-analysis',
    'the-inner-sky-analysis',
    'the-astrology-of-self-discovery-analysis',
  ],
  Deepening: [
    'saturn-a-new-look-at-an-old-devil-analysis',
    'the-astrological-neptune-analysis',
    'pluto-the-evolutionary-journey-of-the-soul-analysis',
    'chiron-and-the-healing-journey-analysis',
    'family-astrology-analysis',
    'astrology-karma-transformation-analysis',
    'relationships-and-life-cycles-analysis',
    'the-gods-of-change-analysis',
  ],
  Techniques: [
    'planets-in-transit-analysis',
    'predictive-astrology-the-eagle-and-the-lark-analysis',
    'solar-arcs-analysis',
    'planets-in-composite-analysis',
    'synastry-analysis',
    'the-progressed-moon-around-the-zodiac-analysis',
  ],
  'Classical & Hellenistic': [
    'hellenistic-astrology-the-study-of-fate-and-fortune-analysis',
    'ancient-astrology-in-theory-and-practice-analysis',
    'christian-astrology-analysis',
    'carmen-astrologicum-analysis',
    'tetrabiblos-analysis',
    'traditional-astrology-for-today-analysis',
    'the-horary-textbook-analysis',
    'the-real-astrology-applied-analysis',
  ],
  'Expert & Specialized': [
    'bradys-book-of-fixed-stars-analysis',
    'the-combination-of-stellar-influences-analysis',
    'electional-astrology-analysis',
    'mundane-astrology-analysis',
    'medical-astrology-a-guide-to-planetary-pathology-analysis',
    'vocational-astrology-analysis',
    'the-sabian-symbols-in-astrology-analysis',
    'visual-astrology-the-lost-light-analysis',
    'retrograde-planets-analysis',
    'the-book-of-the-moon-analysis',
    'the-anthology-analysis',
    'bonatti-on-astrology-liber-astronomiae-analysis',
    'the-houses-temples-of-the-sky-analysis',
    'planetary-cycles-analysis',
    'astrology-for-the-soul-analysis',
    'dynamics-of-aspect-analysis-analysis',
    'financial-astrology-analysis',
    'consulting-with-astrology-analysis',
  ],
  Philosophy: [
    'cosmos-and-psyche-intimations-of-a-new-world-view-analysis',
    'the-pulse-of-life-analysis',
    'jung-and-astrology-analysis',
    'astronomica-analysis',
  ],
};

const CATEGORY_ORDER = Object.keys(CATEGORY_GROUPS);
const CATEGORY_MAP = new Map(
  CATEGORY_ORDER.flatMap((category) => CATEGORY_GROUPS[category].map((id) => [id, category])),
);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isDecorativeLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length < 6) return false;
  return /^[\-=—–_─━═~•·●■▪█]+$/.test(trimmed);
};

const isDisclaimerLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/报告完成|字数统计|总字数/.test(trimmed)) return true;
  if (/免责声明|仅供参考|不构成.*建议/.test(trimmed)) return true;
  return /(?:AI|人工智能|模型).*(?:生成|撰写|编写|仅供参考|不构成|免责声明)/i.test(trimmed);
};

const stripHeadingNoise = (text) => {
  let result = text;
  result = result.replace(/\*\*/g, '').replace(/__/g, '');
  result = result.replace(/【[^】]*(深度|强化|核心|模块|章节)[^】]*】/g, '');
  result = result.replace(/\[[^\]]*(ENHANCED|CORE|CORE SECTION|CORE MODULE)[^\]]*\]/gi, '');
  result = result.replace(/[（(]\s*(?:约|~|about)?\s*\d+(?:\s*[-–~]\s*\d+)?\s*(?:字|words?|条|quotes?|items?)\s*[)）]/gi, '');
  result = result.replace(/\s{2,}/g, ' ').trim();
  return result;
};

const normalizeParagraph = (text) => text.replace(/\s+/g, ' ').trim();

const collapseRepeatingBlocks = (paragraphs) => {
  const normalized = paragraphs.map(normalizeParagraph);
  const result = [];
  let i = 0;

  while (i < paragraphs.length) {
    let collapsed = false;
    const remaining = paragraphs.length - i;
    const maxLen = Math.min(12, Math.floor(remaining / 2));

    for (let len = 1; len <= maxLen; len += 1) {
      const slice = normalized.slice(i, i + len);
      let count = 1;

      while (i + len * (count + 1) <= paragraphs.length) {
        const nextSlice = normalized.slice(i + len * count, i + len * (count + 1));
        if (nextSlice.length !== slice.length) break;
        if (nextSlice.some((value, idx) => value !== slice[idx])) break;
        count += 1;
      }

      if (count > 1) {
        result.push(...paragraphs.slice(i, i + len));
        i += len * count;
        collapsed = true;
        break;
      }
    }

    if (!collapsed) {
      result.push(paragraphs[i]);
      i += 1;
    }
  }

  return result;
};

const dedupeParagraphs = (content) => {
  const rawParagraphs = content.split(/\n{2,}/);
  const paragraphs = rawParagraphs.map((paragraph) => paragraph.trim()).filter(Boolean);
  const collapsed = collapseRepeatingBlocks(paragraphs);
  const result = [];
  let lastKey = null;
  const seen = new Set();

  for (const paragraph of collapsed) {
    const key = normalizeParagraph(paragraph);
    if (key === lastKey) continue;
    if (key.length > 40 && seen.has(key)) continue;
    result.push(paragraph);
    lastKey = key;
    if (key.length > 40) seen.add(key);
  }

  return result.join('\n\n');
};

const parseMeta = (content) => {
  const titleMatch = content.match(/\*\*(?:Title|书名)\*\*\s*[:：]\s*(.+)/);
  const authorMatch = content.match(/\*\*(?:Author|作者)\*\*\s*[:：]\s*(.+)/);

  const meta = {
    titleEn: null,
    titleZh: null,
    authorEn: null,
    authorZh: null,
  };

  if (titleMatch) {
    const raw = titleMatch[1].trim();
    const parenMatch = raw.match(/[（(]([^）)]+)[）)]/);
    if (parenMatch) {
      meta.titleZh = parenMatch[1].trim();
      meta.titleEn = raw.replace(/[（(][^）)]+[）)]/g, '').trim();
    } else {
      meta.titleEn = raw;
    }
  }

  if (authorMatch) {
    const raw = authorMatch[1].trim();
    const parenMatch = raw.match(/[（(]([^）)]+)[）)]/);
    if (parenMatch) {
      meta.authorZh = parenMatch[1].trim();
      meta.authorEn = raw.replace(/[（(][^）)]+[）)]/g, '').trim();
    } else {
      meta.authorEn = raw;
    }
  }

  if (!meta.titleZh) {
    const zhTitleMatch = content.match(/《([^》]+)》/);
    if (zhTitleMatch) meta.titleZh = zhTitleMatch[1].trim();
  }

  if (!meta.authorEn) {
    const authorLine = content.split(/\r?\n/).find((line) => /Author:/i.test(line));
    if (authorLine) {
      meta.authorEn = authorLine.replace(/.*Author:\s*/i, '').trim();
    }
  }

  return meta;
};

const cleanMarkdown = (content) => {
  let lines = content.split(/\r?\n/);
  const firstHeadingIndex = lines.findIndex((line) => /^#{1,6}\s+\S/.test(line.trim()));
  if (firstHeadingIndex > -1) {
    lines = lines.slice(firstHeadingIndex);
  }

  const cleaned = [];
  let blankCount = 0;
  let metaBlock = false;
  const metaHeading = /(基本信息|Basic Information)/i;

  const isTableSeparator = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (!trimmed.includes('|')) return false;
    return /^[\s|:-]+$/.test(trimmed);
  };

  const formatTableRow = (line) => {
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (!cells.length) return null;
    return `- ${cells.join(' - ')}`;
  };

  let inTable = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith('```')) continue;
    if (isDecorativeLine(line)) continue;
    if (isDisclaimerLine(line)) continue;

    const nextLine = lines[i + 1] || '';
    const isTableLine = line.includes('|') && (inTable || isTableSeparator(nextLine) || isTableSeparator(line));

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1];
      const headingText = stripHeadingNoise(headingMatch[2].trim());
      if (headingText) {
        cleaned.push(`${level} ${headingText}`.trim());
        blankCount = 0;
      }
      metaBlock = metaHeading.test(headingText);
      continue;
    }

    if (isTableSeparator(line)) {
      inTable = true;
      continue;
    }

    let stripped = line.replace(/\*\*/g, '').replace(/__/g, '');
    stripped = stripped.replace(/^\s*>\s?/, '');
    const trimmed = stripped.trim();

    if (metaBlock && trimmed) {
      const metaMatch = trimmed.match(/^([^:：]{1,30})[:：]\s*(.+)$/);
      if (metaMatch) {
        const separator = trimmed.includes(':') ? ': ' : '：';
        cleaned.push(`- ${metaMatch[1].trim()}${separator}${metaMatch[2].trim()}`);
        blankCount = 0;
        continue;
      }
    }

    if (isTableLine) {
      const formatted = formatTableRow(stripped);
      if (formatted) {
        cleaned.push(formatted);
        blankCount = 0;
      }
      inTable = true;
      continue;
    }

    if (inTable && !line.includes('|')) {
      inTable = false;
    }

    if (!trimmed) {
      blankCount += 1;
      if (blankCount > 1) continue;
      cleaned.push('');
      continue;
    }

    blankCount = 0;
    if (metaBlock && trimmed) {
      const metaMatch = trimmed.match(/^([^:：]{1,30})[:：]\s*(.+)$/);
      if (!metaMatch) metaBlock = false;
    }
    cleaned.push(stripped.trimEnd());
  }

  const normalized = cleaned.join('\n').trim();
  return dedupeParagraphs(normalized);
};

const buildSummary = (content) => {
  const blocks = content.split(/\n{2,}/);
  const metadataMarkers = [
    '书名',
    '作者',
    'Title',
    'Author',
    'ISBN',
    '首版出版',
    'First Published',
    'Pages',
    '页数',
    '定位',
    'Positioning',
  ];

  const isMetadataBlock = (text) => {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return false;
    return lines.every((line) => metadataMarkers.some((marker) => line.startsWith(marker)));
  };

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s+/.test(trimmed)) continue;
    if (/^[-*+]\s+/.test(trimmed)) continue;
    if (/^\d+\.\s+/.test(trimmed)) continue;
    if (isMetadataBlock(trimmed)) continue;
    const normalized = trimmed.replace(/\s+/g, ' ');
    if (normalized.length <= 140) return normalized;
    return `${normalized.slice(0, 140)}...`;
  }
  return '';
};

const buildAliasIndex = (metaById, availableIds) => {
  const aliasEntries = [];
  const aliasMap = new Map();

  const addAlias = (alias, entry) => {
    if (!alias) return;
    const normalized = alias.trim();
    if (normalized.length < 4) return;
    if (aliasMap.has(normalized)) return;
    aliasMap.set(normalized, entry);
    aliasEntries.push(normalized);
  };

  for (const id of availableIds) {
    const meta = metaById.get(id);
    if (!meta) continue;
    const label = meta.title || id;

    addAlias(meta.title, { id, label });
    if (meta.titleShort && meta.titleShort !== meta.title) {
      addAlias(meta.titleShort, { id, label });
    }
    if (meta.titleDecorated) {
      addAlias(meta.titleDecorated, { id, label: meta.titleDecorated });
    }
    if (meta.altTitle && meta.altTitle !== meta.title) {
      addAlias(meta.altTitle, { id, label: meta.altTitle });
    }
  }

  const sortedAliases = aliasEntries.sort((a, b) => b.length - a.length);
  if (!sortedAliases.length) {
    return { regex: null, aliasMap };
  }

  const pattern = sortedAliases.map((alias) => escapeRegex(alias)).join('|');
  return { regex: new RegExp(pattern, 'g'), aliasMap };
};

const applyInternalLinks = (content, aliasIndex, currentId) => {
  const { regex, aliasMap } = aliasIndex;
  if (!regex) return content;

  return content.replace(regex, (match) => {
    const entry = aliasMap.get(match);
    if (!entry || entry.id === currentId) return match;
    return `[[classics:${entry.id}|${entry.label}]]`;
  });
};

const buildMetaIndex = (rawByLang) => {
  const metaById = new Map();

  for (const [lang, entries] of Object.entries(rawByLang)) {
    for (const [id, content] of entries.entries()) {
      const meta = parseMeta(content);
      if (!metaById.has(id)) {
        metaById.set(id, {
          id,
          titleEn: null,
          titleZh: null,
          authorEn: null,
          authorZh: null,
        });
      }

      const stored = metaById.get(id);
      if (meta.titleEn) stored.titleEn = meta.titleEn;
      if (meta.titleZh) stored.titleZh = meta.titleZh;
      if (meta.authorEn) stored.authorEn = meta.authorEn;
      if (meta.authorZh) stored.authorZh = meta.authorZh;
    }
  }

  const normalized = new Map();
  for (const [id, meta] of metaById.entries()) {
    const titleEn = meta.titleEn || meta.titleZh || id;
    const titleZh = meta.titleZh || meta.titleEn || id;
    const authorEn = meta.authorEn || meta.authorZh || '';
    const authorZh = meta.authorZh || meta.authorEn || '';

    const titleEnShort = titleEn.includes(':') ? titleEn.split(':')[0].trim() : null;
    const titleZhShort = titleZh.includes('：') ? titleZh.split('：')[0].trim() : null;

    normalized.set(id, {
      id,
      titleByLang: {
        en: titleEn,
        zh: titleZh,
      },
      authorByLang: {
        en: authorEn,
        zh: authorZh,
      },
      titleShortByLang: {
        en: titleEnShort,
        zh: titleZhShort,
      },
      decoratedTitleZh: titleZh ? `《${titleZh}》` : null,
    });
  }

  return normalized;
};

const buildEntries = ({ lang, rawByLang, metaIndex, aliasIndex }) => {
  const orderedIds = CATEGORY_ORDER.flatMap((category) => CATEGORY_GROUPS[category]);
  const available = rawByLang[lang];
  const entries = [];

  for (const id of orderedIds) {
    const raw = available.get(id);
    if (!raw) continue;
    const meta = metaIndex.get(id);
    const title = meta?.titleByLang?.[lang] || id;
    const author = meta?.authorByLang?.[lang] || '';
    const titleShort = meta?.titleShortByLang?.[lang];
    const altTitle = lang === 'zh' ? meta?.titleByLang?.en : meta?.titleByLang?.zh;
    const decoratedTitle = lang === 'zh' ? meta?.decoratedTitleZh : null;

    const cleaned = cleanMarkdown(raw);
    const summary = buildSummary(cleaned);
    const linked = applyInternalLinks(
      cleaned,
      aliasIndex,
      id,
    );

    entries.push({
      id,
      title,
      author,
      summary: summary || undefined,
      cover_url: null,
      keywords: [],
      category: CATEGORY_MAP.get(id) || 'Foundation',
      content: linked,
    });

    if (meta) {
      meta.title = title;
      meta.titleShort = titleShort;
      meta.altTitle = altTitle;
      meta.titleDecorated = decoratedTitle;
    }
  }

  return entries;
};

const buildAliasIndexForLang = (lang, metaIndex, rawByLang) => {
  const availableIds = Array.from(rawByLang[lang].keys());
  const metaById = new Map();

  for (const id of availableIds) {
    const meta = metaIndex.get(id);
    if (!meta) continue;
    metaById.set(id, {
      title: meta.titleByLang?.[lang],
      titleShort: meta.titleShortByLang?.[lang],
      altTitle: lang === 'zh' ? meta.titleByLang?.en : meta.titleByLang?.zh,
      titleDecorated: lang === 'zh' ? meta.decoratedTitleZh : null,
    });
  }

  return buildAliasIndex(metaById, availableIds);
};

const main = async () => {
  const files = await fs.readdir(SOURCE_DIR);
  const rawByLang = { zh: new Map(), en: new Map() };

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    if (file === 'astrology-book-analyzer.md') continue;
    const match = file.match(/-(zh|en)\.md$/);
    if (!match) continue;
    const lang = match[1];
    const id = file.replace(/-(zh|en)\.md$/, '');
    const fullPath = path.join(SOURCE_DIR, file);
    const content = await fs.readFile(fullPath, 'utf8');
    rawByLang[lang].set(id, content);
  }

  const metaIndex = buildMetaIndex(rawByLang);
  const aliasIndexZh = buildAliasIndexForLang('zh', metaIndex, rawByLang);
  const aliasIndexEn = buildAliasIndexForLang('en', metaIndex, rawByLang);

  const zhEntries = buildEntries({
    lang: 'zh',
    rawByLang,
    metaIndex,
    aliasIndex: aliasIndexZh,
  });

  const enEntries = buildEntries({
    lang: 'en',
    rawByLang,
    metaIndex,
    aliasIndex: aliasIndexEn,
  });

  const missingCategoryIds = [];
  for (const [lang, entries] of Object.entries({ zh: zhEntries, en: enEntries })) {
    for (const entry of entries) {
      if (!CATEGORY_MAP.has(entry.id)) missingCategoryIds.push(`${lang}:${entry.id}`);
    }
  }

  if (missingCategoryIds.length) {
    console.warn('Missing category assignment for:', missingCategoryIds.join(', '));
  }

  const header = [
    '// AUTO-GENERATED: Wiki classics markdown content',
    `// Generated at: ${new Date().toISOString()}`,
    `// Source: ${SOURCE_DIR}`,
    '',
  ].join('\n');

  const output = [
    header,
    `export const WIKI_CLASSICS_MARKDOWN_ZH = ${JSON.stringify(zhEntries, null, 2)};`,
    '',
    `export const WIKI_CLASSICS_MARKDOWN_EN = ${JSON.stringify(enEntries, null, 2)};`,
    '',
    'const WIKI_CLASSICS_MARKDOWN_ZH_BY_ID = Object.fromEntries(',
    '  WIKI_CLASSICS_MARKDOWN_ZH.map((item) => [item.id, item]),',
    ');',
    '',
    'const WIKI_CLASSICS_MARKDOWN_EN_BY_ID = Object.fromEntries(',
    '  WIKI_CLASSICS_MARKDOWN_EN.map((item) => [item.id, item]),',
    ');',
    '',
    'export const getWikiClassics = (lang) => (lang === \'en\' ? WIKI_CLASSICS_MARKDOWN_EN : WIKI_CLASSICS_MARKDOWN_ZH);',
    '',
    'export const getWikiClassicDetail = (id, lang) => {',
    '  const record = lang === \'en\' ? WIKI_CLASSICS_MARKDOWN_EN_BY_ID : WIKI_CLASSICS_MARKDOWN_ZH_BY_ID;',
    '  return record[id] || null;',
    '};',
    '',
    'export default {',
    '  WIKI_CLASSICS_MARKDOWN_ZH,',
    '  WIKI_CLASSICS_MARKDOWN_EN,',
    '  getWikiClassics,',
    '  getWikiClassicDetail,',
    '};',
    '',
  ].join('\n');

  await fs.writeFile(OUTPUT_FILE, output, 'utf8');

  console.log(`Saved ${zhEntries.length} zh entries and ${enEntries.length} en entries to ${OUTPUT_FILE}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
