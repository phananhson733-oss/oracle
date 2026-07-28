/**
 * 单本测试脚本 - 使用 chat 模型
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

// 简化版 prompt（更快响应）
const ZH_PROMPT = `# Role: 占星学专家
Task: 对《${TEST_BOOK.title}》(作者:${TEST_BOOK.author})进行1000字深度拆解。

要求：输出JSON格式
{
  "title": "书名",
  "author": "作者",
  "summary": "一句话核心价值",
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4"],
  "sections": {
    "context": {
      "title": "1. 全局定位与背景",
      "position": "书籍地位(100字)",
      "author_background": "作者背景(100字)",
      "contribution": "核心贡献(100字)"
    },
    "philosophy": {
      "title": "2. 核心哲学/理论基石",
      "core_logic": "底层逻辑(150字)",
      "metaphor": "通俗比喻(100字)"
    },
    "structure": {
      "title": "3. 结构化深度导读",
      "logic_flow": "逻辑脉络(80字)",
      "modules": [
        {"name": "模块一", "content": "核心内容(100字)"},
        {"name": "模块二", "content": "核心内容(100字)"},
        {"name": "模块三", "content": "核心内容(100字)"}
      ],
      "highlights": [
        {"topic": "重点1", "insight": "观点(100字)"},
        {"topic": "重点2", "insight": "观点(100字)"}
      ]
    },
    "methodology": {
      "title": "4. 方法论与实操工具",
      "steps": ["步骤1(80字)", "步骤2(80字)", "步骤3(80字)"]
    },
    "quotes": {
      "title": "5. 经典名句与深层解读",
      "items": [
        {"quote": "金句", "interpretation": "解读(80字)"},
        {"quote": "金句", "interpretation": "解读(80字)"},
        {"quote": "金句", "interpretation": "解读(80字)"}
      ]
    },
    "criticism": {
      "title": "6. 批判性思考与局限",
      "limitations": "局限(80字)",
      "misconceptions": "误区(80字)",
      "debates": "争议(80字)"
    },
    "action": {
      "title": "7. 读者行动指南",
      "phases": [
        {"phase": "阶段一", "task": "任务(80字)"},
        {"phase": "阶段二", "task": "任务(80字)"},
        {"phase": "阶段三", "task": "任务(80字)"}
      ],
      "immediate_action": "立即行动(80字)"
    }
  }
}

确保JSON格式正确，无多余逗号。`;

async function callAPI(prompt, model = 'deepseek-chat') {
  console.log(`调用 ${model}...`);
  const response = await fetch(BASE_URL + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are a JSON expert. Return ONLY valid JSON. No markdown fences. No trailing commas.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error ${response.status}: ${err.substring(0, 300)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  console.log('响应长度:', content.length);
  
  // 提取并解析 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON解析错误:', e.message);
      return null;
    }
  }
  return null;
}

async function main() {
  console.log('测试:', TEST_BOOK.title, '\n');
  
  // 尝试 chat 模型
  const result = await callAPI(ZH_PROMPT, 'deepseek-chat');
  
  if (result) {
    console.log('\n✓ 生成成功!');
    console.log('Summary:', result.summary);
    console.log('Keywords:', result.keywords);
    
    const outputPath = './backend/src/data/test-result.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log('已保存:', outputPath);
  } else {
    console.log('\n✗ 生成失败');
  }
}

main().catch(console.error);
