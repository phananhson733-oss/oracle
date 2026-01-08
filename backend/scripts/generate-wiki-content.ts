#!/usr/bin/env tsx

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'test';
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

async function callDeepSeekAPI(prompt: string): Promise<any> {
  console.log('Calling DeepSeek API...');
  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a JSON expert. Return ONLY valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    throw new Error('API Error');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned');
  }

  console.log('Response length:', content.length);
  console.log('Response preview:', content.substring(0, 300));
  
  // Extract JSON from markdown code block
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    console.log('No JSON found');
    return {};
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  console.log('Extracted JSON length:', jsonStr.length);
  
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
    console.log('Parsed keys:', Object.keys(parsed));
  } catch (e) {
    console.error('JSON parse error:', e);
    return {};
  }
  
  return parsed;
}

const category = process.argv[2] || 'planets';
const itemId = process.argv[4];
const lang = (process.argv[3] || 'zh') as 'zh' | 'en';

console.log('Category:', category, 'Language:', lang, 'Item ID:', itemId);

async function main() {
  const wiki: any = await import('../src/data/wiki.js');
  console.log('Wiki module keys:', Object.keys(wiki));
  
  const wikiContent = wiki.WIKI_CONTENT;
  console.log('WIKI_CONTENT keys:', Object.keys(wikiContent));
  
  const itemsZh = wikiContent?.zh?.items || [];
  console.log('Items in zh:', itemsZh.length);
  
  let items: any[] = [];
  
  if (category === 'planets') {
    const planetIds = itemId ? [itemId] : ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'uranus', 'neptune', 'pluto'];
    items = itemsZh.filter((item: any) => planetIds.includes(item.id));
  } else if (category === 'signs') {
    const signIds = itemId ? [itemId] : ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    items = itemsZh.filter((item: any) => signIds.includes(item.id));
  } else if (category === 'houses') {
    const houseIds = itemId ? [itemId] : Array.from({ length: 12 }, (_, i) => `house-${i + 1}`);
    items = itemsZh.filter((item: any) => houseIds.includes(item.id));
  } else if (category === 'aspects') {
    const aspectIds = itemId ? [itemId] : ['conjunction', 'opposition', 'square', 'trine', 'sextile'];
    items = itemsZh.filter((item: any) => aspectIds.includes(item.id));
  }

  console.log('Items found:', items.length);

  if (items.length === 0) {
    console.error('No items found for category:', category);
    process.exit(1);
  }

  for (const item of items) {
    try {
      const prompt = lang === 'zh' 
        ? `Generate deep dive content for ${item.title} in JSON format only (no markdown). Return ONLY this structure with EXACTLY 8 steps:
{
  "astronomy_myth": "astronomy and myth background (150-200 Chinese characters)",
  "psychology": "Jungian psychology interpretation (200-300 Chinese characters)",
  "shadow": "shadow traits and manifestations (100-150 Chinese characters)",
  "integration": "how to integrate the energy (150-200 Chinese characters)",
  "deep_dive": [
    {"step": 1, "title": "step title", "description": "step description (100-150 characters)"},
    {"step": 2, "title": "step title", "description": "step description (100-150 characters)"},
    {"step": 3, "title": "step title", "description": "step description (100-150 characters)"},
    {"step": 4, "title": "step title", "description": "step description (100-150 characters)"},
    {"step": 5, "title": "step title", "description": "step description (100-150 characters)"},
    {"step": 6, "title": "step title", "description": "step description (100-150 characters)"},
    {"step": 7, "title": "step title", "description": "step description (100-150 characters)"},
    {"step": 8, "title": "step title", "description": "step description (100-150 characters)"}
  ]
}`
        : `Generate deep dive content for ${item.title} in JSON format only (no markdown). Return ONLY this structure with EXACTLY 8 steps:
{
  "astronomy_myth": "astronomy and myth background (150-200 English words)",
  "psychology": "Jungian psychology interpretation (200-300 English words)",
  "shadow": "shadow traits and manifestations (100-150 English words)",
  "integration": "how to integrate the energy (150-200 English words)",
  "deep_dive": [
    {"step": 1, "title": "step title", "description": "step description (100-150 words)"},
    {"step": 2, "title": "step title", "description": "step description (100-150 words)"},
    {"step": 3, "title": "step title", "description": "step description (100-150 words)"},
    {"step": 4, "title": "step title", "description": "step description (100-150 words)"},
    {"step": 5, "title": "step title", "description": "step description (100-150 words)"},
    {"step": 6, "title": "step title", "description": "step description (100-150 words)"},
    {"step": 7, "title": "step title", "description": "step description (100-150 words)"},
    {"step": 8, "title": "step title", "description": "step description (100-150 words)"}
  ]
}`;
      
      const result = await callDeepSeekAPI(prompt);
      console.log('Generated:', item.title);
      console.log('astronomy_myth:', result.astronomy_myth?.substring(0, 80) + '...');
      console.log('deep_dive steps:', result.deep_dive?.length);
      console.log('---');
    } catch (error) {
      console.error('Failed:', item.title, error instanceof Error ? error.message : String(error));
    }
  }
}

main();
