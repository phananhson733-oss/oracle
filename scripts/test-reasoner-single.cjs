/**
 * 测试 deepseek-reasoner 模型生成单本书
 */
const fs = require('fs');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-9071dfaab4224a4eb8f5517df25a1610';
const BASE_URL = 'https://api.deepseek.com';

// 测试一本新书：星座与原型 (Symbol & Key)
const TEST_BOOK = {
  id: 'symbol-key',
  title: '占星符号与原型',
  enTitle: 'Astrology: Using the Deep Wisdom of the Birth Chart',
  author: 'Marion March'
};

async function generateWithReasoner() {
  console.log('使用 deepseek-reasoner 生成单本书测试\n');
  
  const prompt = `# 占星学专家
深度拆解《${TEST_BOOK.title}》(作者:${TEST_BOOK.author})

输出JSON：
{
  "title": "${TEST_BOOK.title}",
  "author": "${TEST_BOOK.author}",
  "summary": "一句话核心价值",
  "keywords": ["占星学", "符号", "原型", "出生星盘"],
  "context": {
    "title": "1. 全局定位与背景",
    "position": "书籍地位（200字）",
    "author_background": "作者背景（250字）",
    "contribution": "核心贡献（250字）"
  }
}
Valid JSON only.`;

  console.log('调用 deepseek-reasoner...');
  const startTime = Date.now();
  
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

  const elapsed = Date.now() - startTime;
  console.log(`响应时间: ${elapsed/1000}秒`);

  if (!response.ok) {
    console.log('API Error:', response.status);
    return;
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  
  console.log('\n模型确认: deepseek-reasoner');
  console.log('Content:', message?.content?.substring(0, 200) + '...');
  
  const jsonMatch = message?.content?.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}'));
      console.log('\n✓ 生成成功!');
      console.log('Title:', result.title);
      console.log('Summary:', result.summary);
      console.log('Context Position:', result.context?.position?.substring(0, 50) + '...');
      return result;
    } catch (e) {
      console.error('JSON Error:', e.message);
    }
  }
}

generateWithReasoner().catch(console.error);
