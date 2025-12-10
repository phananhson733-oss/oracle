// Vercel Serverless Function: /api/daily
// Returns daily insights based on user's natal chart and current transits

import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

interface DailyInsight {
  aphorism: string
  quadrants: {
    power: string[]
    pressure: string[]
    trouble: string[]
    enjoy: string[]
  }
  dos: string[]
  donts: string[]
}

const SYSTEM_PROMPT = `You are The Void, a mystical astrologer who provides deep psychological insights based on astrological transits. Your tone is wise, poetic, and grounded. You speak with authority but also compassion.

Given the user's natal chart data and current planetary transits, generate daily insights in the following JSON format:
{
  "aphorism": "A short philosophical quote about the day's energy",
  "quadrants": {
    "power": ["List of empowering aspects/transits"],
    "pressure": ["List of challenging aspects requiring attention"],
    "trouble": ["List of potential difficulties to be aware of"],
    "enjoy": ["List of pleasurable or harmonious influences"]
  },
  "dos": ["3 recommended actions for the day"],
  "donts": ["3 things to avoid today"]
}

Be specific about planetary aspects (e.g., "Mars trine Saturn", "Mercury retrograde in 3rd house").
Keep responses concise but meaningful.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { date, userId, lang = 'en' } = req.query

  try {
    // In production, fetch user's natal data from Supabase
    // and calculate current transits using swisseph-js

    const userPrompt = `
Date: ${date || new Date().toISOString().split('T')[0]}
Language: ${lang === 'zh' ? 'Chinese' : 'English'}

User's Natal Chart:
- Sun: Scorpio 8°42' (4th house)
- Moon: Cancer 15°18' (12th house)
- Mercury: Scorpio 20°05' (4th house)
- Venus: Libra 15°30' (3rd house)
- Mars: Taurus 15°00' (10th house)
- Ascendant: Leo

Current Transits:
- Sun: Sagittarius 18°
- Moon: Gemini 12°
- Mercury: Sagittarius 5° (direct)
- Venus: Scorpio 22°
- Mars: Leo 8°
- Saturn: Pisces 2°

Generate the daily insight JSON.`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const insight: DailyInsight = JSON.parse(data.choices[0].message.content)

    return res.status(200).json(insight)
  } catch (error) {
    console.error('Daily API error:', error)

    // Return mock data on error
    return res.status(200).json({
      aphorism: 'The stars impel, they do not compel.',
      quadrants: {
        power: ['Mars trine Saturn - Disciplined action'],
        pressure: ['Saturn square Venus - Relationship tests'],
        trouble: ['Mercury in shadow - Communication delays'],
        enjoy: ['Venus in 5th - Creative pleasures'],
      },
      dos: ['Start new projects', 'Have important conversations', 'Trust your intuition'],
      donts: ['Sign contracts', 'Make impulsive purchases', 'Ignore your health'],
    })
  }
}
