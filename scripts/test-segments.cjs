/**
 * 单本测试脚本 - 验证分段生成流程
 */
const fs = require('fs');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-9071dfaab4224a4eb8f5517df25a1610';
const BASE_URL = 'https://api.deepseek.com';

const TEST_BOOK = {
  id: 'contemporary-astrologers-handbook',
  title: '当代占星研究',
  enTitle: 'The Contemporary Astrologer\'s Handbook',
  author: 'Sue Tompkins'
};

const MODULES = ['context', 'philosophy', 'structure', 'methodology', 'quotes', 'criticism', 'action'];

async function callAPI(prompt) {
  const response = await fetch(BASE_URL + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Output ONLY valid JSON. No thinking process.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    console.log('API Error:', response.status);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']'));
    } catch (e) {
      console.error('JSON Error:', e.message);
      return null;
    }
  }
  return null;
}

async function test() {
  console.log('测试分段生成流程...\n');
  
  // 模块1: Context
  console.log('[1/7] 生成 Context 模块...');
  const contextPrompt = `# Role: 占星学专家
Task: 对《${TEST_BOOK.title}》(作者:${TEST_BOOK.author})深度拆解

JSON:
{
  "title": "${TEST_BOOK.title}",
  "author": "${TEST_BOOK.author}",
  "summary": "一句话核心价值",
  "keywords": ["占星学", "心理占星", "入门", "经典"],
  "context": {
    "title": "1. 全局定位与背景",
    "position": "书籍地位（200字）",
    "author_background": "作者背景（250字）",
    "contribution": "核心贡献（250字）"
  }
}
Valid JSON only.`;

  const ctx = await callAPI(contextPrompt);
  if (ctx) {
    console.log('✓ Context 生成成功');
    console.log('  Summary:', ctx.summary);
    console.log('  Keywords:', ctx.keywords);
  }

  // 模块2: Philosophy (传入Context摘要)
  console.log('\n[2/7] 生成 Philosophy 模块（带Context引用）...');
  const philPrompt = `# Role: 占星学专家
Task: 对《${TEST_BOOK.title}》深度拆解

前序信息：
- 书籍地位：${ctx?.context?.position || ''}
- 核心贡献：${ctx?.context?.contribution || ''}

JSON:
{
  "philosophy": {
    "title": "2. 核心哲学",
    "core_logic": "底层逻辑（300字，必须与前序一致）",
    "metaphor": "比喻（150字）"
  }
}
Valid JSON only.`;

  const phil = await callAPI(philPrompt);
  if (phil) {
    console.log('✓ Philosophy 生成成功');
    console.log('  Core logic preview:', phil.philosophy?.core_logic?.substring(0, 50) + '...');
  }

  // 模块3: Structure (传入Context和Philosophy)
  console.log('\n[3/7] 生成 Structure 模块（带前序引用）...');
  const structPrompt = `# Role: 占星学专家
Task: 对《${TEST_BOOK.title}》深度拆解

前序内容：
- 核心贡献：${ctx?.context?.contribution || ''}
- 核心理论：${phil?.philosophy?.core_logic || ''}

JSON:
{
  "structure": {
    "title": "3. 结构化导读",
    "logic_flow": "逻辑脉络（150字）",
    "modules": [
      {"name": "第一部分", "content": "内容（200字）"},
      {"name": "第二部分", "content": "内容（200字）"}
    ],
    "highlights": [
      {"topic": "重点", "insight": "洞见（150字）"}
    ]
  }
}
Valid JSON only.`;

  const struct = await callAPI(structPrompt);
  if (struct) {
    console.log('✓ Structure 生成成功');
  }

  console.log('\n测试完成！各模块内容应保持逻辑一致。');
  
  // 保存测试结果
  const testResult = {
    book: TEST_BOOK.title,
    modules: {
      context: ctx,
      philosophy: phil,
      structure: struct
    }
  };
  fs.writeFileSync('./backend/src/data/test-segments.json', JSON.stringify(testResult, null, 2));
  console.log('\n测试结果已保存到 test-segments.json');
}

test().catch(console.error);
