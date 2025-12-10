// Vercel Serverless Function: /api/depth
// Generate deep analysis reports (paid feature)

import type { VercelRequest, VercelResponse } from '@vercel/node'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const REPORT_TYPES = {
  natal: 'Deep psychological profile based on natal chart',
  transit: 'Detailed transit analysis for a specific period',
  dimension: 'In-depth analysis of a specific life dimension',
}

const SYSTEM_PROMPT = `You are The Void, providing premium deep psychological astrology analysis. Your insights are profound, specific, and transformative.

Your analysis should:
1. Reference specific planetary placements with degrees
2. Explain psychological patterns and their origins
3. Identify shadow work opportunities
4. Provide actionable guidance for growth
5. Be 400-600 words for depth reports

Output in JSON format:
{
  "title": "Report title",
  "summary": "Executive summary (2-3 sentences)",
  "sections": [
    {
      "heading": "Section title",
      "content": "Detailed analysis",
      "key_placements": ["Relevant placements"]
    }
  ],
  "advice": ["3-5 actionable recommendations"],
  "affirmation": "A personalized affirmation based on the chart"
}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, dimension, lang = 'en' } = req.body

  if (!type || !REPORT_TYPES[type as keyof typeof REPORT_TYPES]) {
    return res.status(400).json({ error: 'Invalid report type' })
  }

  try {
    // Use Gemini for premium reports
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}

Report Type: ${type}
${dimension ? `Dimension Focus: ${dimension}` : ''}
Language: ${lang === 'zh' ? 'Chinese' : 'English'}

User's Natal Chart:
- Sun: Scorpio 8°42' (4th house)
- Moon: Cancer 15°18' (12th house)
- Mercury: Scorpio 20°05' (4th house)
- Venus: Libra 15°30' (3rd house)
- Mars: Taurus 15°00' (10th house)
- Jupiter: Capricorn 10°22' (6th house)
- Saturn: Virgo 15°45' (2nd house)
- Pluto: Scorpio 15° (4th house)
- North Node: Aquarius 18° (7th house)
- Ascendant: Leo 12°

Generate the depth report JSON.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates[0].content.parts[0].text

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return res.status(200).json(JSON.parse(jsonMatch[0]))
    }

    throw new Error('Failed to parse response')
  } catch (error) {
    console.error('Depth API error:', error)

    // Return mock data
    return res.status(200).json({
      title: 'Deep Psychological Profile',
      summary: 'Your chart reveals a soul on a profound journey of transformation, with deep emotional currents running beneath a powerful exterior.',
      sections: [
        {
          heading: 'Core Identity & Life Purpose',
          content: 'With your Sun in Scorpio in the 4th house, your identity is deeply intertwined with themes of transformation, emotional depth, and family dynamics. You are here to excavate truth from the depths of experience.',
          key_placements: ['Sun in Scorpio 4th house', 'Pluto conjunct Sun'],
        },
        {
          heading: 'Emotional Landscape',
          content: 'Your Moon in Cancer in the 12th house creates a rich inner world that often remains hidden from others. You possess profound intuitive abilities and a deep connection to the collective unconscious.',
          key_placements: ['Moon in Cancer 12th house'],
        },
        {
          heading: 'Shadow Work',
          content: 'The Pluto-Sun conjunction in your 4th house suggests early experiences of power dynamics within the family. Your growth comes through consciously integrating these shadow elements.',
          key_placements: ['Pluto in Scorpio 4th house'],
        },
      ],
      advice: [
        'Honor your need for emotional privacy while building trust with select individuals',
        'Channel your investigative nature into meaningful psychological or research work',
        'Practice regular emotional release through journaling or therapy',
        'Embrace transformation as your superpower rather than fearing change',
      ],
      affirmation: 'I am the phoenix rising. My depth is my gift, and my transformation serves the world.',
    })
  }
}
