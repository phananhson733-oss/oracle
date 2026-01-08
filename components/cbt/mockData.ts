// INPUT: CBT 类型与增量示例数据（snake_case）。
// OUTPUT: 导出 mock 数据生成器。
// POS: CBT mock 数据工具。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { CBTRecord, EmojiMood } from './types';

const MOODS = ['焦虑', '悲伤', '愤怒', '不知所措', '充满希望', '羞愧'];
const EMOJIS: EmojiMood[] = ['very_happy', 'happy', 'okay', 'annoyed', 'terrible'];
const DISTORTIONS = ['读心术', '灾难化', '非黑即白', '过度概括'];

export const generateMockHistory = (): CBTRecord[] => {
  const history: CBTRecord[] = [];
  const now = Date.now();
  const dayMs = 86400000;

  for (let i = 0; i < 15; i++) {
    const daysAgo = i;
    const timestamp = now - (daysAgo * dayMs);

    const moodName = MOODS[Math.floor(Math.random() * MOODS.length)];
    const initial = 60 + Math.floor(Math.random() * 40);
    const final = initial - Math.floor(Math.random() * 30) - 10;
    const emojiMood = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    history.push({
      id: `mock-${i}`,
      timestamp,
      emojiMood,
      situation: "在周会上被领导点名询问进度，当时还没完全准备好。",
      moods: [{
        id: `m-${i}`,
        name: moodName,
        initialIntensity: initial,
        finalIntensity: final
      }],
      automaticThoughts: ["他肯定觉得我能力不行", "我要被开除了"],
      hotThought: "他肯定觉得我能力不行",
      evidenceFor: ["进度确实比预期慢了两天"],
      evidenceAgainst: ["他之前还夸我上个项目做得好", "他在会上其实也问了别人的进度"],
      balancedEntries: [{
        id: `b-${i}`,
        text: "领导询问进度是正常的管理行为，我只需要客观说明原因并给出调整计划。",
        belief: 85
      }],
      analysis: {
        cognitive_analysis: {
          distortions: [DISTORTIONS[Math.floor(Math.random() * DISTORTIONS.length)]],
          summary: "识别出读心术的倾向是重塑认知的关键起点。"
        },
        astro_context: {
          aspect: "水星刑土星",
          interpretation: "当前的沟通可能存在压力，但这正是磨练专业表达的契机。"
        },
        jungian_insight: {
          archetype_active: "受难者",
          archetype_solution: "战士",
          insight: "从被动的防御转向主动的掌控，是内在力量的觉醒。"
        },
        actions: ["找领导私下沟通详细进度。", "整理下周的工作计划。", "完成三分钟的正念练习。"]
      }
    });
  }

  return history.sort((a, b) => b.timestamp - a.timestamp);
};
