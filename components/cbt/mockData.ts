// INPUT: CBT 类型与增量示例数据（snake_case）。
// OUTPUT: 导出 mock 数据生成器。
// POS: CBT mock 数据工具。若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { CBTRecord, EmojiMood } from './types';

const SCENARIOS = [
  {
    situation: "在周会上被领导点名询问进度，当时还没完全准备好。",
    hotThought: "他肯定觉得我能力不行",
    moods: ["焦虑", "羞愧"],
    distortion: "读心术",
    balanced: "领导询问进度是正常的管理行为，我只需要客观说明原因并给出调整计划。"
  },
  {
    situation: "伴侣因为我加班太晚没有回消息而生气。",
    hotThought: "我们的关系要结束了，我总是搞砸一切",
    moods: ["恐惧", "悲伤"],
    distortion: "灾难化",
    balanced: "一次争吵并不代表关系结束，我们需要沟通彼此的需求。"
  },
  {
    situation: "提交的项目方案被客户提出了很多修改意见。",
    hotThought: "我写的方案一无是处，我不适合这份工作",
    moods: ["沮丧", "自我怀疑"],
    distortion: "非黑即白",
    balanced: "客户提出修改是为了完善方案，其中也有很多部分得到了认可。"
  },
  {
    situation: "看到朋友圈里大家都在晒旅行照片，而我还在加班。",
    hotThought: "只有我的生活这么悲惨，别人都过得比我好",
    moods: ["嫉妒", "失落"],
    distortion: "过度概括",
    balanced: "社交媒体展示的只是生活的一面，每个人都有自己的压力和快乐。"
  },
  {
    situation: "在聚会上说了一个笑话，但没几个人笑。",
    hotThought: "我是个无趣的人，大家都在心里嘲笑我",
    moods: ["尴尬", "社恐"],
    distortion: "贴标签",
    balanced: "笑话没响可能是环境嘈杂或者get不到点，并不代表我这个人无趣。"
  },
  {
    situation: "因为身体不舒服请了一天假。",
    hotThought: "我太脆弱了，这点小病都扛不住，会耽误团队进度",
    moods: ["内疚", "焦虑"],
    distortion: "应该模式",
    balanced: "生病休息是身体的正常需求，照顾好自己才能更好地工作。"
  },
  {
    situation: "收到信用卡账单，发现上个月花超了。",
    hotThought: "我毫无自制力，我永远存不下钱",
    moods: ["愤怒", "悔恨"],
    distortion: "以偏概全",
    balanced: "这个月确实有些额外支出，但我可以复盘消费记录，下个月调整预算。"
  },
  {
    situation: "给朋友发消息，过了一天还没回复。",
    hotThought: "他肯定是对我有意见，不想理我了",
    moods: ["被抛弃感", "不安"],
    distortion: "妄下结论",
    balanced: "他可能只是太忙忘记了，或者没看到消息，不一定是对我有意见。"
  },
  {
    situation: "虽然完成了任务，但发现了一个小错误。",
    hotThought: "这个错误毁了整个项目，我是个失败者",
    moods: ["挫败", "羞耻"],
    distortion: "过滤",
    balanced: "瑕不掩瑜，整体任务完成得很好，这个小错误可以修正并吸取教训。"
  },
  {
    situation: "听到同事在茶水间低声说话，感觉是在议论我。",
    hotThought: "他们肯定在说我的坏话",
    moods: ["多疑", "愤怒"],
    distortion: "个性化",
    balanced: "他们可能在聊任何事情，我没有证据表明这与我有关，不需要对号入座。"
  },
  {
    situation: "原本计划周末去爬山，结果下大雨了。",
    hotThought: "我的运气真差，什么事都不顺",
    moods: ["失望", "烦躁"],
    distortion: "情绪化推理",
    balanced: "天气变化是自然现象，与我运气好坏无关，我可以换个室内活动。"
  },
  {
    situation: "父母打电话来催婚，语气比较重。",
    hotThought: "如果不结婚，我就是不孝顺，这辈子都完了",
    moods: ["压力", "委屈"],
    distortion: "灾难化",
    balanced: "父母的催促源于关心，但我有自己的人生节奏，结婚不是衡量幸福的唯一标准。"
  },
  {
    situation: "在新学的技能上进展缓慢，比别人慢。",
    hotThought: "我太笨了，根本学不会",
    moods: ["无力感", "自卑"],
    distortion: "贴标签",
    balanced: "每个人的学习曲线不同，慢一点不代表学不会，重要的是坚持。"
  },
  {
    situation: "拒绝了同事不合理的帮忙请求。",
    hotThought: "我太自私了，同事会讨厌我",
    moods: ["愧疚", "担忧"],
    distortion: "读心术",
    balanced: "设立合理的边界是必要的，拒绝不合理请求是对自己工作的负责，不代表自私。"
  },
  {
    situation: "在这个月的业绩排名中没有进前三。",
    hotThought: "如果不是第一名，就是彻底的失败",
    moods: ["失落", "不甘"],
    distortion: "非黑即白",
    balanced: "没有进前三不代表失败，我的业绩也在稳步增长，需要看到自己的进步。"
  }
];

const EMOJIS: EmojiMood[] = ['very_happy', 'happy', 'okay', 'annoyed', 'terrible'];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateMockHistory = (): CBTRecord[] => {
  const history: CBTRecord[] = [];
  
  // 目标日期范围：2026年1月1日 - 2026年1月16日
  const startTimestamp = new Date('2026-01-01T00:00:00').getTime();
  const endTimestamp = new Date('2026-01-16T23:59:59').getTime();
  const totalDays = 16;
  const dayMs = 86400000;

  for (let i = 0; i < 15; i++) {
    // 随机选择一天
    const dayOffset = randomInt(0, totalDays - 1);
    // 随机时间
    const timeOffset = randomInt(0, dayMs - 1);
    const timestamp = startTimestamp + (dayOffset * dayMs) + timeOffset;

    // 确保不超出结束时间
    const finalTimestamp = Math.min(timestamp, endTimestamp);

    const scenario = SCENARIOS[i % SCENARIOS.length];
    const emojiMood = EMOJIS[randomInt(2, 4)]; // 偏向负面情绪以生成CBT记录

    history.push({
      id: `mock-${i}`,
      timestamp: finalTimestamp,
      emojiMood,
      situation: scenario.situation,
      moods: scenario.moods.map((m, idx) => {
        const initial = randomInt(60, 95);
        const final = initial - randomInt(15, 40);
        return {
          id: `m-${i}-${idx}`,
          name: m,
          initialIntensity: initial,
          finalIntensity: Math.max(0, final)
        };
      }),
      automaticThoughts: [scenario.hotThought, "这种感觉太糟糕了", "我不知道该怎么办"],
      hotThought: scenario.hotThought,
      evidenceFor: ["当时确实感觉到了这种情绪", "事情发生得太突然了"],
      evidenceAgainst: ["客观来看情况没那么糟", "过去也有过类似的经历后来都解决了", "这可能只是我的一种认知偏差"],
      balancedEntries: [{
        id: `b-${i}`,
        text: scenario.balanced,
        belief: randomInt(70, 95)
      }],
      analysis: {
        cognitive_analysis: {
          distortions: [scenario.distortion],
          summary: `在这个情境中，${scenario.distortion}的思维模式导致了情绪的放大。`
        },
        astro_context: {
          aspect: i % 2 === 0 ? "月亮刑火星" : "水星合土星",
          interpretation: i % 2 === 0 
            ? "情绪波动较大，容易冲动，需要注意情绪管理。" 
            : "思维严谨但略显压抑，适合进行深度的自我反思。"
        },
        jungian_insight: {
          archetype_active: i % 2 === 0 ? "孤儿" : "受难者",
          archetype_solution: i % 2 === 0 ? "智者" : "战士",
          insight: "每一次的情绪困扰都是内在原型在寻求表达，看见即是疗愈。"
        },
        actions: ["深呼吸三次，让自己冷静下来。", "尝试从旁观者的角度重新审视这件事。", "记录下此刻的感受，过后再回头看。"]
      },
      completedActionIndices: i > 2 ? [0] : [] // 随机完成一些行动
    });
  }

  return history.sort((a, b) => b.timestamp - a.timestamp);
};
