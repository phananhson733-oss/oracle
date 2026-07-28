#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const CLASSICS_REPORTS_DIR = path.join(__dirname, '..', 'backend', 'data', 'classics_reports');
const OUTPUT_FILE = path.join(__dirname, '..', 'backend', 'src', 'data', 'wiki-classics-markdown.js');

const CATEGORY_GROUPS = {
  Foundation: [
    'contemporary-astrologers-handbook',
    'aspects-in-astrology',
    'the-twelve-houses',
    'astrology-psychology-and-the-four-elements',
    'chart-interpretation-handbook',
    'the-inner-sky',
    'the-astrology-of-self-discovery',
  ],
  Deepening: [
    'saturn-a-new-look-at-an-old-devil',
    'the-astrological-neptune',
    'pluto-the-evolutionary-journey-of-the-soul',
    'chiron-and-the-healing-journey',
    'family-astrology',
    'astrology-karma-transformation',
    'relationships-and-life-cycles',
    'the-gods-of-change',
  ],
  Techniques: [
    'planets-in-transit',
    'predictive-astrology-the-eagle-and-the-lark',
    'solar-arcs',
    'planets-in-composite',
    'synastry',
    'the-progressed-moon-around-the-zodiac',
  ],
  'Classical & Hellenistic': [
    'hellenistic-astrology-the-study-of-fate-and-fortune',
    'ancient-astrology-in-theory-and-practice',
    'ancient-astrology-vol1',
    'ancient-astrology-vol2',
    'christian-astrology',
    'carmen-astrologicum',
    'tetrabiblos',
    'traditional-astrology-for-today',
    'the-horary-textbook',
    'the-real-astrology-applied',
  ],
  'Expert & Specialized': [
    'bradys-book-of-fixed-stars',
    'the-combination-of-stellar-influences',
    'combination-stellar-influences',
    'electional-astrology',
    'mundane-astrology',
    'medical-astrology-a-guide-to-planetary-pathology',
    'vocational-astrology',
    'the-sabian-symbols-in-astrology',
    'visual-astrology-the-lost-light',
    'retrograde-planets',
    'the-book-of-moon',
    'book-of-moon',
    'the-anthology',
    'bonatti-astrology',
    'the-houses-temples-of-the-sky',
    'planetary-cycles',
    'astrology-for-soul',
    'dynamics-aspect-analysis',
    'financial-astrology',
    'consulting-astrology',
  ],
  Philosophy: [
    'cosmos-psyche',
    'the-pulse-of-life',
    'jung-and-astrology',
    'astronomica',
  ],
};

async function main() {
  console.log('开始从 classics_reports 目录导入数据...');

  // 读取所有书籍目录
  const bookDirs = await fs.readdir(CLASSICS_REPORTS_DIR);
  console.log(`找到 ${bookDirs.length} 本书`);

  const zhBooks = [];
  const enBooks = [];

  for (const bookDir of bookDirs) {
    const bookPath = path.join(CLASSICS_REPORTS_DIR, bookDir);
    const stat = await fs.stat(bookPath);

    if (!stat.isDirectory()) continue;

    try {
      // 读取 canon.json
      const canonPath = path.join(bookPath, 'canon.json');
      let canon = {};
      try {
        const canonContent = await fs.readFile(canonPath, 'utf-8');
        canon = JSON.parse(canonContent);
      } catch (err) {
        console.warn(`警告: 无法读取 ${bookDir}/canon.json`);
      }

      // 读取中文内容
      const zhReportPath = path.join(bookPath, 'zh', 'report.md');
      try {
        const zhContent = await fs.readFile(zhReportPath, 'utf-8');

        // 确定分类
        let category = 'Foundation';
        for (const [cat, ids] of Object.entries(CATEGORY_GROUPS)) {
          if (ids.some(id => bookDir.includes(id))) {
            category = cat;
            break;
          }
        }

        zhBooks.push({
          id: bookDir,
          title: canon.title_zh || canon.title || bookDir,
          author: canon.author || 'Unknown',
          summary: canon.summary_zh || canon.summary || '',
          cover_url: canon.cover_url || null,
          keywords: canon.keywords_zh || canon.keywords || [],
          category: category,
          content: zhContent,
        });

        console.log(`✓ 已导入中文: ${bookDir}`);
      } catch (err) {
        console.warn(`警告: 无法读取 ${bookDir}/zh/report.md`);
      }

      // 读取英文内容
      const enReportPath = path.join(bookPath, 'en', 'report.md');
      try {
        const enContent = await fs.readFile(enReportPath, 'utf-8');

        // 确定分类
        let category = 'Foundation';
        for (const [cat, ids] of Object.entries(CATEGORY_GROUPS)) {
          if (ids.some(id => bookDir.includes(id))) {
            category = cat;
            break;
          }
        }

        enBooks.push({
          id: bookDir,
          title: canon.title_en || canon.title || bookDir,
          author: canon.author || 'Unknown',
          summary: canon.summary_en || canon.summary || '',
          cover_url: canon.cover_url || null,
          keywords: canon.keywords_en || canon.keywords || [],
          category: category,
          content: enContent,
        });

        console.log(`✓ 已导入英文: ${bookDir}`);
      } catch (err) {
        console.warn(`警告: 无法读取 ${bookDir}/en/report.md`);
      }
    } catch (err) {
      console.error(`错误: 处理 ${bookDir} 时出错:`, err.message);
    }
  }

  // 生成输出文件
  const output = `// AUTO-GENERATED: Wiki classics markdown content
// Generated at: ${new Date().toISOString()}
// Source: backend/data/classics_reports

export const WIKI_CLASSICS_MARKDOWN_ZH = ${JSON.stringify(zhBooks, null, 2)};

export const WIKI_CLASSICS_MARKDOWN_EN = ${JSON.stringify(enBooks, null, 2)};

// Helper functions for backend API
export function getWikiClassics(lang) {
  return lang === 'en' ? WIKI_CLASSICS_MARKDOWN_EN : WIKI_CLASSICS_MARKDOWN_ZH;
}

export function getWikiClassicDetail(id, lang) {
  const books = lang === 'en' ? WIKI_CLASSICS_MARKDOWN_EN : WIKI_CLASSICS_MARKDOWN_ZH;
  return books.find(book => book.id === id) || null;
}
`;

  await fs.writeFile(OUTPUT_FILE, output, 'utf-8');
  console.log(`\n✓ 成功生成 ${OUTPUT_FILE}`);
  console.log(`  中文书籍: ${zhBooks.length} 本`);
  console.log(`  英文书籍: ${enBooks.length} 本`);
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
