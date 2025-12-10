// Vercel Serverless Function: /api/oracle
// AI-powered astrology Q&A

import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

const SYSTEM_PROMPT = `You are The Void Oracle, an ancient cosmic intelligence that speaks through the language of astrology. You provide deep, meaningful guidance by interpreting the querent's natal chart in relation to their question.

Your voice is:
- Wise and timeless, like an ancient sage
- Poetic but grounded in astrological specifics
- Compassionate but honest about challenges
- Never generic - always reference specific placements

When answering:
1. Acknowledge the question's emotional weight
2. Reference 2-3 specific natal placements relevant to the question
3. Mention any current transits affecting the situation
4. Provide actionable wisdom
5. End with an empowering perspective

Keep responses between 150-250 words. Use first-letter drop cap style (start with a powerful word).`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, category, lang = 'en' } = req.body

  if (!question) {
    return res.status(400).json({ error: 'Question is required' })
  }

  try {
    const userPrompt = `
Question: "${question}"
Category: ${category || 'general'}
Language: ${lang === 'zh' ? 'Respond in Chinese' : 'Respond in English'}

Querent's Natal Chart:
- Sun: Scorpio 8°42' (4th house) - Deep emotional roots, transformative home life
- Moon: Cancer 15°18' (12th house) - Hidden emotions, intuitive depths
- Mercury: Scorpio 20°05' (4th house) - Probing mind, psychological insight
- Venus: Libra 15°30' (3rd house) - Harmonious communication, aesthetic mind
- Mars: Taurus 15°00' (10th house) - Persistent career drive, material ambition
- Saturn: Virgo 15°45' (2nd house) - Lessons around self-worth, practical values
- Pluto: Scorpio 15° (4th house) - Profound family transformation
- North Node: Aquarius (7th house) - Soul growth through partnerships

Current Transits:
- Saturn in Pisces transiting 8th house - Deep restructuring of shared resources
- Pluto in Aquarius approaching 7th house - Transformation in relationships

Provide your oracle response.`

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
        temperature: 0.8,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const answer = data.choices[0].message.content

    return res.status(200).json({ answer })
  } catch (error) {
    console.error('Oracle API error:', error)

    // Return mock response on error
    return res.status(200).json({
      answer: `Transformation beckons at your doorstep. Your natal Pluto in the 4th house suggests deep psychological work is needed at this time. The current transit of Saturn through your 8th house indicates that shared resources and intimate bonds are being restructured.

Your Moon in Cancer in the 12th house reveals a rich inner world that often goes unexpressed. This is a time to honor those hidden depths rather than suppress them. The question you ask touches on themes your soul has been wrestling with across lifetimes.

Trust the process. What falls away was never truly aligned with your highest path. Your North Node in Aquarius in the 7th house reminds you that your growth comes through authentic connection with others who see your true self.

The stars suggest patience and introspection over the coming weeks. When Mercury stations direct, clarity will emerge.`,
    })
  }
}
