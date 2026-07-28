/**
 * 占星经典书籍深度解读生成器 (简化版)
 * 分段生成 + 跨模块引用确保一致性
 */
const fs = require('fs');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-9071dfaab4224a4eb8f5517df25a1610';
const BASE_URL = 'https://api.deepseek.com';

const CLASSIC_BOOKS = [
  { id: 'contemporary-astrologers-handbook', title: '当代占星研究', enTitle: 'The Contemporary Astrologer\'s Handbook', author: 'Sue Tompkins', stage: '第一阶段' },
  { id: 'aspects-in-astrology', title: '占星相位研究', enTitle: 'Aspects in Astrology', author: 'Sue Tompkins', stage: '第一阶段' },
  { id: 'twelve-houses-sasportas', title: '占星十二宫位', enTitle: 'The Twelve Houses', author: 'Howard Sasportas', stage: '第一阶段' },
  { id: 'four-elements', title: '生命四元素', enTitle: 'Astrology, Psychology, and the Four Elements', author: 'Stephen Arroyo', stage: '第一阶段' },
  { id: 'chart-interpretation-handbook', title: '占星护照', enTitle: 'Chart Interpretation Handbook', author: 'Stephen Arroyo', stage: '第一阶段' },
  { id: 'inner-sky', title: '内在的天空', enTitle: 'The Inner Sky', author: 'Steven Forrest', stage: '第一阶段' },
  { id: 'twelve-houses-marks', title: '人生的十二个面向', enTitle: 'The Twelve Houses', author: 'Tracy Marks', stage: '第一阶段' },
  { id: 'saturn-new-look', title: '土星：从新观点看老恶魔', enTitle: 'Saturn: A New Look at an Old Devil', author: 'Liz Greene', stage: '第二阶段' },
  { id: 'astrological-neptune', title: '海王星', enTitle: 'The Astrological Neptune', author: 'Liz Greene', stage: '第二阶段' },
  { id: 'pluto-evolutionary-journey', title: '冥王星：灵魂的演化之旅', enTitle: 'Pluto: The Evolutionary Journey of the Soul', author: 'Jeff Green', stage: '第二阶段' },
  { id: 'chiron-healing-journey', title: '凯龙星：灵魂的创伤与疗愈', enTitle: 'Chiron and the Healing Journey', author: 'Melanie Reinhart', stage: '第二阶段' },
  { id: 'family-astrology', title: '家族占星', enTitle: 'Family Astrology', author: 'Liz Greene', stage: '第二阶段' },
  { id: 'astrology-karma-transformation', title: '占星、业力与转化', enTitle: 'Astrology, Karma & Transformation', author: 'Stephen Arroyo', stage: '第二阶段' },
  { id: 'relationships-life-cycles', title: '人际关系占星学', enTitle: 'Relationships and Life Cycles', author: 'Stephen Arroyo', stage: '第二阶段' },
  { id: 'gods-of-change', title: '生命的轨迹', enTitle: 'The Gods of Change', author: 'Howard Sasportas', stage: '第二阶段' },
  { id: 'planets-in-transit', title: '行星行运全书', enTitle: 'Planets in Transit', author: 'Robert Hand', stage: '第三阶段' },
  { id: 'predictive-astrology-eagle', title: '预测占星学', enTitle: 'Predictive Astrology: The Eagle and the Lark', author: 'Bernadette Brady', stage: '第三阶段' },
  { id: 'solar-arcs', title: '太阳弧推运法', enTitle: 'Solar Arcs', author: 'Noel Tyl', stage: '第三阶段' },
  { id: 'planets-in-composite', title: '组合盘', enTitle: 'Planets in Composite', author: 'Robert Hand', stage: '第三阶段' },
  { id: 'synastry-davison', title: '关系合盘', enTitle: 'Synastry', author: 'Ronald Davison', stage: '第三阶段' },
  { id: 'progressed-moon', title: '月亮推运法', enTitle: 'The Progressed Moon', author: 'Various', stage: '第三阶段' },
  { id: 'hellenistic-astrology', title: '希腊化占星', enTitle: 'Hellenistic Astrology: The Study of Fate and Fortune', author: 'Chris Brennan', stage: '第四阶段' },
  { id: 'ancient-astrology-vol1', title: '古代占星理论 第一卷', enTitle: 'Ancient Astrology in Theory and Practice, Vol 1', author: 'Demetra George', stage: '第四阶段' },
  { id: 'ancient-astrology-vol2', title: '古代占星实践 第二卷', enTitle: 'Ancient Astrology in Theory and Practice, Vol 2', author: 'Demetra George', stage: '第四阶段' },
  { id: 'christian-astrology', title: '基督徒占星', enTitle: 'Christian Astrology', author: 'William Lilly', stage: '第四阶段' },
  { id: 'carmen-astrologicum', title: '卡门占星', enTitle: 'Carmen Astrologicum', author: 'Dorotheus of Sidon', stage: '第四阶段' },
  { id: 'tetrabiblos', title: '四书', enTitle: 'Tetrabiblos', author: 'Ptolemy', stage: '第四阶段' },
  { id: 'traditional-astrology-today', title: '传统占星学', enTitle: 'Traditional Astrology for Today', author: 'Benjamin Dykes', stage: '第四阶段' },
  { id: 'horary-textbook', title: '卜卦全书', enTitle: 'The Horary Textbook', author: 'John Frawley', stage: '第四阶段' },
  { id: 'real-astrology-applied', title: '真正实用的占星学', enTitle: 'The Real Astrology Applied', author: 'John Frawley', stage: '第四阶段' },
  { id: 'brady-book-fixed-stars', title: '布雷迪恒星书', enTitle: 'Brady\'s Book of Fixed Stars', author: 'Bernadette Brady', stage: '第五阶段' },
  { id: 'combination-stellar-influences', title: '中点组合论', enTitle: 'The Combination of Stellar Influences', author: 'Reinhold Ebertin', stage: '第五阶段' },
  { id: 'electional-astrology', title: '择日占星', enTitle: 'Electional Astrology', author: 'Vivian Robson', stage: '第五阶段' },
  { id: 'mundane-astrology', title: '世俗占星学', enTitle: 'Mundane Astrology', author: 'Baigent et al.', stage: '第五阶段' },
  { id: 'medical-astrology', title: '占星医案', enTitle: 'Medical Astrology', author: 'Eileen Nauman', stage: '第五阶段' },
  { id: 'cosmos-psyche', title: '宇宙与心灵', enTitle: 'Cosmos and Psyche', author: 'Richard Tarnas', stage: '第六阶段' },
  { id: 'pulse-of-life', title: '生命的脉动', enTitle: 'The Pulse of Life', author: 'Dane Rudhyar', stage: '第六阶段' },
  { id: 'jung-astrology', title: '荣格与占星学', enTitle: 'Jung and Astrology', author: 'Maggie Hyde', stage: '第六阶段' },
  { id: 'retrograde-planets', title: '逆行行星', enTitle: 'Retrograde Planets', author: 'Erin Sullivan', stage: '补充' },
  { id: 'book-of-moon', title: '月亮之书', enTitle: 'The Book of the Moon', author: 'Steven Forrest', stage: '补充' },
  { id: 'vocational-astrology', title: '职业占星', enTitle: 'Vocational Astrology', author: 'Judith Hill', stage: '补充' },
  { id: 'vettius-valens-anthology', title: 'Vettius Valens选集', enTitle: 'Anthology', author: 'Vettius Valens', stage: '补充' },
  { id: 'bonatti-astrology', title: 'Bonatti占星', enTitle: 'Bonatti on Astrology', author: 'Guido Bonatti', stage: '补充' },
  { id: 'visual-astrology', title: '视觉占星', enTitle: 'Visual Astrology', author: 'Bernadette Brady', stage: '补充' },
  { id: 'sabian-symbols', title: '萨比恩征象', enTitle: 'The Sabian Symbols', author: 'Marc Edmund Jones', stage: '补充' },
  { id: 'planetary-cycles', title: '行星周期', enTitle: 'Planetary Cycles', author: 'Andre Barbault', stage: '补充' },
  { id: 'houses-temples-sky', title: '宫位：天空的神殿', enTitle: 'The Houses: Temples of the Sky', author: 'Deborah Houlding', stage: '补充' },
  { id: 'astrology-for-soul', title: '灵魂占星', enTitle: 'Astrology for the Soul', author: 'Jan Spiller', stage: '补充' },
  { id: 'dynamics-aspect-analysis', title: '相位图形分析', enTitle: 'Dynamics of Aspect Analysis', author: 'Bil Tierney', stage: '补充' },
  { id: 'financial-astrology', title: '金融占星', enTitle: 'Financial Astrology', author: 'David Williams', stage: '补充' },
  { id: 'consulting-astrology', title: '占星咨询', enTitle: 'Consulting with Astrology', author: 'Wendy Ashley', stage: '补充' },
  { id: 'manilius-astronomica', title: '占星诗集', enTitle: 'Astronomica', author: 'Marcus Manilius', stage: '补充' },
  { id: 'astrology-personality', title: '人格的占星学', enTitle: 'Astrology of Personality', author: 'Dane Rudhyar', stage: '补充' }
];

const MODULES = ['context', 'philosophy', 'structure', 'methodology', 'quotes', 'criticism', 'action'];

// 简化版 Prompt 模板
const PROMPTS = {
  context: (title, author, isZh) => {
    if (isZh) {
      return `# 占星学专家
拆解《${title}》作者${author}
输出：
{"title":"${title}","author":"${author}","summary":"一句话","keywords":["kw1","kw2","kw3","kw4"],"context":{"title":"1.全局定位","position":"地位(200字)","author_background":"作者(250字)","contribution":"贡献(250字)"}}
JSON only`;
    }
    return `# Astrology Expert
Analysis of "${title}" by ${author}
Output:
{"title":"${title}","author":"${author}","summary":"one sentence","keywords":["kw1","kw2","kw3","kw4"],"context":{"title":"1.Context","position":"status(200)","author_background":"author(250)","contribution":"contribution(250)"}}
JSON only`;
  },
  philosophy: (title, author, isZh, prev) => {
    if (isZh) {
      return `# 占星学专家
拆解《${title}》
前序：${prev}
输出：
{"philosophy":{"title":"2.核心哲学","core_logic":"逻辑(300字)","metaphor":"比喻(150字)"}}
JSON only`;
    }
    return `# Astrology Expert
Analysis of "${title}" by ${author}
Previous: ${prev}
Output:
{"philosophy":{"title":"2.Core Philosophy","core_logic":"logic(300)","metaphor":"metaphor(150)"}}
JSON only`;
  },
  structure: (title, author, isZh, prev) => {
    if (isZh) {
      return `# 占星学专家
拆解《${title}》
前序：${prev}
输出：
{"structure":{"title":"3.结构导读","logic_flow":"脉络(150字)","modules":[{"name":"第一部分","content":"内容(300字)"},{"name":"第二部分","content":"内容(300字)"}],"highlights":[{"topic":"重点","insight":"洞见(200字)"}]}}
JSON only`;
    }
    return `# Astrology Expert
Analysis of "${title}"
Previous: ${prev}
Output:
{"structure":{"title":"3.Structure","logic_flow":"flow(150)","modules":[{"name":"Part1","content":"content(300)"},{"name":"Part2","content":"content(300)"}],"highlights":[{"topic":"Key","insight":"insight(200)"}]}}
JSON only`;
  },
  methodology: (title, author, isZh, prev) => {
    if (isZh) {
      return `# 占星学专家
拆解《${title}》
前序：${prev}
输出：
{"methodology":{"title":"4.方法论","steps":["步骤1(200字)","步骤2(200字)","步骤3(200字)"]}}
JSON only`;
    }
    return `# Astrology Expert
Analysis of "${title}"
Previous: ${prev}
Output:
{"methodology":{"title":"4.Methodology","steps":["Step1(200)","Step2(200)","Step3(200)"]}}
JSON only`;
  },
  quotes: (title, author, isZh, prev) => {
    if (isZh) {
      return `# 占星学专家
拆解《${title}》
前序：${prev}
输出：
{"quotes":{"title":"5.金句","items":[{"quote":"金句1","interpretation":"解读(150字)"},{"quote":"金句2","interpretation":"解读(150字)"},{"quote":"金句3","interpretation":"解读(150字)"}]}}
JSON only`;
    }
    return `# Astrology Expert
Analysis of "${title}"
Previous: ${prev}
Output:
{"quotes":{"title":"5.Quotes","items":[{"quote":"Quote1","interpretation":"analysis(150)"},{"quote":"Quote2","interpretation":"analysis(150)"},{"quote":"Quote3","interpretation":"analysis(150)"}]}}
JSON only`;
  },
  criticism: (title, author, isZh, prev) => {
    if (isZh) {
      return `# 占星学专家
拆解《${title}》
前序：${prev}
输出：
{"criticism":{"title":"6.批判","limitations":"局限(150字)","misconcepts":"误区(150字)","debates":"争议(150字)"}}
JSON only`;
    }
    return `# Astrology Expert
Analysis of "${title}"
Previous: ${prev}
Output:
{"criticism":{"title":"6.Criticism","limitations":"limit(150)","misconcepts":"misconception(150)","debates":"debate(150)"}}
JSON only`;
  },
  action: (title, author, isZh, prev) => {
    if (isZh) {
      return `# 占星学专家
拆解《${title}》
前序：${prev}
输出：
{"action":{"title":"7.行动指南","phases":[{"phase":"阶段一","task":"任务(150字)"},{"phase":"阶段二","task":"任务(150字)"}],"immediate_action":"立即行动(100字)"}}
JSON only`;
    }
    return `# Astrology Expert
Analysis of "${title}"
Previous: ${prev}
Output:
{"action":{"title":"7.Action","phases":[{"phase":"Phase1","task":"task(150)"},{"phase":"Phase2","task":"task(150)"}],"immediate_action":"action(100)"}}
JSON only`;
  }
};

// 调用 API
async function callAPI(prompt) {
  const response = await fetch(BASE_URL + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
    },
    body: JSON.stringify({
      model: 'deepseek-reasoner',
      messages: [
        { role: 'system', content: 'Output valid JSON only. No markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// 生成单本书
async function generateBook(book, isZh) {
  const title = isZh ? book.title : book.enTitle;
  const results = {};
  let prevSummary = '';

  for (const moduleName of MODULES) {
    const prompt = PROMPTS[moduleName](title, book.author, isZh, prevSummary);
    process.stdout.write(`[${moduleName}]...`);
    
    const result = await callAPI(prompt);
    if (result) {
      results[moduleName] = result[moduleName] || result;
      if (moduleName === 'context') {
        results.title = result.title;
        results.author = result.author;
        results.summary = result.summary;
        results.keywords = result.keywords;
        prevSummary = `${result.context?.position || ''} ${result.context?.contribution || ''}`;
      } else if (moduleName === 'philosophy') {
        prevSummary += ` ${result.philosophy?.core_logic || ''}`;
      } else {
        prevSummary = JSON.stringify(result).substring(0, 500);
      }
      console.log(' ✓');
    } else {
      console.log(' ✗');
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

// 保存结果
function saveResults(results) {
  const fileContent = `// Generated by script
import type { Language, WikiClassicSections } from '../types/api.js';
type GeneratedContent = Record<Language, Record<string,{summary:string,keywords:string[],sections:WikiClassicSections}>>;
export const WIKI_CLASSICS_GENERATED: GeneratedContent = ${JSON.stringify(results, null, 2)};
export default WIKI_CLASSICS_GENERATED;`;
  fs.writeFileSync('./backend/src/data/wiki-classics-generated.ts', fileContent, 'utf-8');
}

async function main() {
  const args = process.argv.slice(2);
  const start = parseInt(args[0]) || 0;
  const end = args[1] ? parseInt(args[1]) : CLASSIC_BOOKS.length;
  const force = args.includes('--force');
  const zhOnly = args.includes('--zh-only');
  const enOnly = args.includes('--en-only');
  
  console.log(`生成器启动 (范围: ${start}-${end-1})\n`);
  
  let results = { zh: {}, en: {} };
  const books = CLASSIC_BOOKS.slice(start, end);
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const idx = start + i;
    console.log(`\n[${idx + 1}/${CLASSIC_BOOKS.length}] ${book.title}`);
    
    if (!zhOnly && (!results.zh[book.id] || force)) {
      const zh = await generateBook(book, true);
      if (zh.context) {
        results.zh[book.id] = { summary: zh.summary, keywords: zh.keywords, sections: zh };
        console.log(`  ✓ ZH`);
        saveResults(results);
      }
    }
    
    if (!enOnly && (!results.en[book.id] || force)) {
      const en = await generateBook(book, false);
      if (en.context) {
        results.en[book.id] = { summary: en.summary, keywords: en.keywords, sections: en };
        console.log(`  ✓ EN`);
        saveResults(results);
      }
    }
  }
  
  console.log(`\n完成! ZH:${Object.keys(results.zh).length} EN:${Object.keys(results.en).length}`);
}

main().catch(console.error);
