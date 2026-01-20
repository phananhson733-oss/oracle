# Change: Add Wiki Classics Shelf

## Why
- 现有百科缺少“经典占星书籍”的可视化入口，用户难以系统地阅读与回顾权威著作。
- 需要一个接近“书架/藏书阁”的浏览体验，承载长篇静态解读内容。
- 经典内容将由人工整理提供，需与现有 Wiki 体系保持语言与风格一致。

## What Changes
- 在 /wiki 增加第三个页签“经典/Classics”，提供书架式列表与详情阅读体验。
- 新增经典书籍的后端静态数据与 API（列表、详情），并在前端本地永久缓存。
- 经典条目支持中英文双语展示：中文做校对排版，英文为面向欧美读者的占星语境译写（非直译）。
- Wiki 搜索结果纳入经典条目并支持跳转至详情页。
- 首批上架 20 本经典书籍，按阅读优先级顺序展示。

## Impact
- Affected specs: 新增 provide-wiki-classics、serve-wiki-classics-content 能力规范。
- Affected code: `components/wiki/*`、`services/apiClient.ts`、`constants.ts`、`backend/src/api/wiki.ts`、`backend/src/data/*`、`types.ts`、`backend/src/types/api.ts`。
- Dependencies: 与 `integrate-astro-wiki`、`enhance-wiki-deep-dive` 的 Wiki 结构与缓存策略保持一致。

## Initial Classics Set (Priority Order)
1. 《占星、心理学与四元素》｜*Astrology, Psychology, and the Four Elements*｜史蒂芬·阿罗约 (Stephen Arroyo)
2. 《内在的天空》｜*The Inner Sky*｜史蒂芬·福里斯特 (Steven Forrest)
3. 《占星相位研究》｜*Aspects in Astrology*｜苏·汤普金斯 (Sue Tompkins)
4. 《占星十二宫位》｜*The Twelve Houses*｜霍华德·萨司波塔斯 (Howard Sasportas)
5. 《心理占星学》｜*Psychological Astrology: A Synthesis of Jungian Psychology and Astrology*｜卡伦·哈马克-宗达格 (Karen Hamaker-Zondag)
6. 《发光体：太阳与月亮心理学》｜*The Luminaries: The Psychology of the Sun and Moon in the Horoscope*｜丽兹·格林 & 霍华德·萨司波塔斯
7. 《内行星：构建现实的砖瓦》｜*The Inner Planets: Building Blocks of Personal Reality*｜丽兹·格林 & 霍华德·萨司波塔斯
8. 《人格的发展》｜*The Development of the Personality*｜丽兹·格林 & 霍华德·萨司波塔斯
9. 《土星：从新观点看老恶魔》｜*Saturn: A New Look at an Old Devil*｜丽兹·格林 (Liz Greene)
10. 《海王星：生命是一场追寻救赎的旅程》｜*The Astrological Neptune*｜丽兹·格林 (Liz Greene)
11. 《冥王星：灵魂的演化之旅》｜*Pluto: The Evolutionary Journey of the Soul*｜杰夫·格林 (Jeff Green)
12. 《凯龙星：灵魂的创伤与疗愈》｜*Chiron and the Healing Journey*｜梅兰妮·瑞哈特 (Melanie Reinhart)
13. 《占星、业力与转化》｜*Astrology, Karma & Transformation*｜史蒂芬·阿罗约 (Stephen Arroyo)
14. 《无意识的动力》｜*Dynamics of the Unconscious*｜丽兹·格林 & 霍华德·萨司波塔斯
15. 《灵魂的暗夜：星盘中的心理病理学》｜*The Dark of the Soul: Psychopathology in the Horoscope*｜丽兹·格林 (Liz Greene)
16. 《人际关系占星学》｜*Relating: An Astrological Guide to Living with Others on a Small Planet*｜丽兹·格林 (Liz Greene)
17. 《生命的轨迹：痛苦、危机与天海冥的行运》｜*The Gods of Change: Pain, Crisis and the Transits of Uranus, Neptune, and Pluto*｜霍华德·萨司波塔斯 (Howard Sasportas)
18. 《逆行行星：探索内在的风景》｜*Retrograde Planets: Traversing the Inner Landscape*｜艾琳·苏利文 (Erin Sullivan)
19. 《荣格与占星学》｜*Jung and Astrology*｜玛吉·海德 (Maggie Hyde)
20. 《宇宙与心灵》｜*Cosmos and Psyche: Intimations of a New World View*｜理查德·塔纳斯 (Richard Tarnas)
