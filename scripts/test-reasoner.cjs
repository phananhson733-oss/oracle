/**
 * 测试 DeepSeek Reasoner 模型
 */
const fs = require('fs');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-9071dfaab4224a4eb8f5517df25a1610';
const BASE_URL = 'https://api.deepseek.com';

const TEST_BOOK = {
  title: '当代占星研究',
  author: 'Sue Tompkins'
};

async function testReasoner() {
  console.log('测试 DeepSeek Reasoner 模型...\n');
  
  const prompt = `# Role: 占星学专家
Task: 对《${TEST_BOOK.title}》(作者:${TEST_BOOK.author})深度拆解

输出JSON格式：
{
  "title": "${TEST_BOOK.title}",
  "author": "${TEST_BOOK.author}",
  "summary": "一句话核心价值",
  "keywords": ["kw1", "kw2", "kw3", "kw4"],
  "context": {
    "title": "1. 全局定位与背景",
    "position": "书籍地位（300字）",
    "author_background": "作者背景（400字）",
    "contribution": "核心贡献（400字）"
  }
}

Valid JSON only, no trailing commas.`;

  console.log('调用 Reasoner...');
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
        { role: 'system', content: 'Output ONLY valid JSON. No thinking process. No markdown fences.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  const elapsed = Date.now() - startTime;
  console.log(`响应时间: ${elapsed/1000}秒`);

  if (!response.ok) {
    const err = await response.text();
    console.log('API Error:', response.status);
    console.log(err.substring(0, 500));
    return;
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  
  console.log('\n--- 响应结构 ---');
  console.log('Has reasoning_content:', !!message?.reasoning_content);
  console.log('Has content:', !!message?.content);
  console.log('Content length:', message?.content?.length || 0);
  
  // 只使用 content，不包含思考过程
  const content = message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']'));
      console.log('\n✓ 解析成功!');
      console.log('Title:', result.title);
      console.log('Summary:', result.summary);
      console.log('Keywords:', result.keywords);
      
      fs.writeFileSync('./backend/src/data/test-reasoner.json', JSON.stringify(result, null, 2));
      console.log('\n结果已保存到 test-reasoner.json');
    } catch (e) {
      console.error('JSON Error:', e.message);
    }
  } else {
    console.log('\n未找到JSON内容');
    console.log('Content preview:', content.substring(0, 300));
  }
}

testReasoner().catch(console.error);
