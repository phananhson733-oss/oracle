// Vercel Serverless Function: /api/synastry
// Generate relationship analysis between two charts

import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

const SYSTEM_PROMPT = `You are The Void, analyzing the cosmic connection between two souls. Your analysis is deep, psychological, and grounded in astrological specifics.

Generate a synastry report in the following JSON format:
{
  "summary": "2-3 sentence overview of the relationship dynamic",
  "compatibility_score": 75,
  "themes": {
    "intimacy": {
      "score": 80,
      "summary": "Brief description",
      "details": "Detailed analysis with specific aspects"
    },
    "communication": {
      "score": 70,
      "summary": "Brief description",
      "details": "Detailed analysis"
    },
    "values": {
      "score": 85,
      "summary": "Brief description",
      "details": "Detailed analysis"
    },
    "power": {
      "score": 60,
      "summary": "Brief description",
      "details": "Detailed analysis"
    }
  },
  "key_aspects": [
    {
      "aspect": "Sun conjunct Venus",
      "type": "harmony",
      "description": "Strong mutual attraction and appreciation"
    }
  ],
  "karmic_indicators": "Analysis of North Node connections and past life themes"
}

Be specific about inter-chart aspects. Reference house overlays.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { personA, personB, relationshipType = 'romantic', lang = 'en' } = req.body

  try {
    const userPrompt = `
Relationship Type: ${relationshipType}
Language: ${lang === 'zh' ? 'Chinese' : 'English'}

Person A (${personA?.name || 'Person A'}):
- Sun: Scorpio 8°42' (4th house)
- Moon: Cancer 15°18' (12th house)
- Venus: Libra 15°30' (3rd house)
- Mars: Taurus 15°00' (10th house)
- Ascendant: Leo

Person B (${personB?.name || 'Person B'}):
- Sun: Pisces 15°20' (7th house)
- Moon: Scorpio 22°45' (3rd house)
- Venus: Aquarius 8°10' (6th house)
- Mars: Virgo 20°30' (1st house)
- Ascendant: Virgo

Key Inter-chart Aspects:
- A's Sun conjunct B's Moon (orb 14°) - Emotional understanding
- A's Venus square B's Mars - Passionate tension
- A's Moon trine B's Sun - Nurturing connection
- B's Venus opposite A's Mars - Magnetic attraction

Generate the synastry report JSON.`

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
    const report = JSON.parse(data.choices[0].message.content)

    return res.status(200).json(report)
  } catch (error) {
    console.error('Synastry API error:', error)

    // Return mock data
    return res.status(200).json({
      summary: 'This connection carries deep karmic significance. Your charts reveal a powerful soul contract focused on transformation and emotional growth.',
      compatibility_score: 78,
      themes: {
        intimacy: { score: 85, summary: 'Deep emotional bond', details: 'Moon connections create profound emotional understanding.' },
        communication: { score: 72, summary: 'Intuitive understanding', details: 'Mercury aspects support mental connection.' },
        values: { score: 80, summary: 'Complementary priorities', details: 'Venus placements show shared appreciation for beauty.' },
        power: { score: 65, summary: 'Dynamic tension', details: 'Mars aspects create passionate but challenging dynamics.' },
      },
      key_aspects: [
        { aspect: 'Sun conjunct Moon', type: 'harmony', description: 'Core identity meets emotional needs' },
        { aspect: 'Venus square Mars', type: 'tension', description: 'Passionate attraction with friction' },
      ],
      karmic_indicators: 'North Node connections suggest past life recognition and shared destiny.',
    })
  }
}
