/**
 * 单本测试脚本 - 验证生成流程
 */
const fs = require('fs');
const path = require('path');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-9071dfaab4224a4eb8f5517df25a1610';
const BASE_URL = 'https://api.deepseek.com';

// 第一本书
const TEST_BOOK = {
  id: 'contemporary-astrologers-handbook',
  title: '当代占星研究',
  enTitle: 'The Contemporary Astrologer\'s Handbook',
  author: 'Sue Tompkins'
};

const ZH_PROMPT = `# Role: 占星学专家 & 资深图书主编
# Task: 对《${TEST_BOOK.title}》（作者：${TEST_BOOK.author}）进行专家级深度拆解
# 要求：约10000字深度解读，严格按JSON格式输出

## 拆解框架（7个模块）
1. 全局定位与背景 - 书籍地位、作者背景、核心贡献
2. 核心哲学/理论基石 - 底层逻辑、通俗比喻
3. 结构化深度导读 - 逻辑脉络、模块拆解、重点挖掘
4. 方法论与实操工具 - Step-by-Step步骤
5. 经典名句与深层解读 - 3-5句金句及解读
6. 批判性思考与局限 - 时代局限、初学误区、不同声音
7. 读者行动指南 - 分阶段计划、立即行动

## 输出格式（JSON）
{
  "title": "书名",
  "author": "作者", 
  "summary": "一句话核心价值（20字以内）",
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4"],
  "sections": {
    "context": {
      "title": "1. 全局定位与背景",
      "position": "书籍地位描述",
      "author_background": "作者背景描述",
      "contribution": "核心贡献描述"
    },
    "philosophy": {
      "title": "2. 核心哲学/理论基石",
      "core_logic": "底层逻辑描述",
      "metaphor": "通俗比喻"
    },
    "structure": {
      "title": "3. 结构化深度导读",
      "logic_flow": "逻辑脉络描述",
      "modules": [
        { "name": "模块一", "content": "核心知识点" },
        { "name": "模块二", "content": "核心知识点" },
        { "name": "模块三", "content": "核心知识点" }
      ],
      "highlights": [
        { "topic": "重点话题1", "insight": "打破认知的观点" },
        { "topic": "重点话题2", "insight": "打破认知的观点" }
      ]
    },
    "methodology": {
      "title": "4. 方法论与实操工具",
      "steps": ["Step 1: 具体步骤", "Step 2: 具体步骤", "Step 3: 具体步骤"]
    },
    "quotes": {
      "title": "5. 经典名句与深层解读",
      "items": [
        { "quote": "金句原文", "interpretation": "深层解读" },
        { "quote": "金句原文", "interpretation": "深层解读" },
        { "quote": "金句原文", "interpretation": "深层解读" }
      ]
    },
    "criticism": {
      "title": "6. 批判性思考与局限",
      "limitations": "时代局限性",
      "misconceptions": "初学误区",
      "debates": "不同声音"
    },
    "action": {
      "title": "7. 读者行动指南",
      "phases": [
        { "phase": "阶段一", "task": "具体任务" },
        { "phase": "阶段二", "task": "具体任务" },
        { "phase": "阶段三", "task": "具体任务" }
      ],
      "immediate_action": "立即行动建议"
    }
  }
}

确保JSON格式正确，不要有多余逗号。`;

async function callAPI(prompt) {
  console.log('调用 DeepSeek API...');
  const response = await fetch(BASE_URL + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY,
    },
    body: JSON.stringify({
      model: 'deepseek-reasoner',
      messages: [
        { role: 'system', content: 'You are a JSON expert. Return ONLY valid JSON. Ensure format is correct, no trailing commas.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 16384,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error ${response.status}: ${err.substring(0, 500)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  console.log('原始响应长度:', content.length);
  
  // 提取 JSON
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
  console.log('测试生成:', TEST_BOOK.title);
  
  const result = await callAPI(ZH_PROMPT);
  
  if (result) {
    console.log('\n生成成功!');
    console.log('Summary:', result.summary);
    console.log('Keywords:', result.keywords);
    
    // 保存测试结果
    const outputPath = './backend/src/data/test-result.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log('\n结果已保存到:', outputPath);
  } else {
    console.log('\n生成失败');
  }
}

main().catch(console.error);
