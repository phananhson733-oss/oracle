/**
 * 单本测试脚本 - Reasoner 模型验证
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

const ZH_PROMPT = `# Role: 占星学专家
Task: 深度拆解《${TEST_BOOK.title}》(作者:${TEST_BOOK.author})

输出JSON格式（约5000字），只输出JSON：

{
  "title": "${TEST_BOOK.title}",
  "author": "${TEST_BOOK.author}",
  "summary": "核心价值",
  "keywords": ["kw1", "kw2", "kw3", "kw4"],
  "sections": {
    "context": {
      "title": "1. 全局定位与背景",
      "position": "书籍地位（300字）",
      "author_background": "作者背景（300字）",
      "contribution": "核心贡献（300字）"
    },
    "philosophy": {
      "title": "2. 核心哲学",
      "core_logic": "底层逻辑（400字）",
      "metaphor": "比喻（200字）"
    },
    "structure": {
      "title": "3. 结构化导读",
      "logic_flow": "逻辑（200字）",
      "modules": [
        {"name": "模块一", "content": "内容（300字）"},
        {"name": "模块二", "content": "内容（300字）"}
      ],
      "highlights": [
        {"topic": "重点1", "insight": "洞见（300字）"}
      ]
    },
    "methodology": {
      "title": "4. 方法论",
      "steps": ["步骤1（200字）", "步骤2（200字）"]
    },
    "quotes": {
      "title": "5. 金句解读",
      "items": [
        {"quote": "金句", "interpretation": "解读（200字）"},
        {"quote": "金句", "interpretation": "解读（200字）"}
      ]
    },
    "criticism": {
      "title": "6. 批判思考",
      "limitations": "局限（200字）",
      "misconcepts": "误区（200字）",
      "debates": "争议（200字）"
    },
    "action": {
      "title": "7. 行动指南",
      "phases": [
        {"phase": "阶段一", "task": "任务（200字）"},
        {"phase": "阶段二", "task": "任务（200字）"}
      ],
      "immediate_action": "立即行动（150字）"
    }
  }
}

JSON格式正确，无多余逗号。只输出JSON。`;

// 简化版：先测试 chat 模型验证流程
async function testChat() {
  console.log('测试 Chat 模型...');
  const response = await fetch(BASE_URL + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Output ONLY valid JSON. No thinking process. No markdown.' },
        { role: 'user', content: ZH_PROMPT }
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    console.log('Error:', await response.text().substring(0, 500));
    return;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  console.log('Response length:', content.length);

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}'));
      console.log('\n✓ 解析成功!');
      console.log('Title:', result.title);
      console.log('Summary:', result.summary);
      console.log('Keywords:', result.keywords);
      fs.writeFileSync('./backend/src/data/test-result.json', JSON.stringify(result, null, 2));
      console.log('已保存到 test-result.json');
    } catch (e) {
      console.error('JSON错误:', e.message);
    }
  }
}

testChat().catch(console.error);
