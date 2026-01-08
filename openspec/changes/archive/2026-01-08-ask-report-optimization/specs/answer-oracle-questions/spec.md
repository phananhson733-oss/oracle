<!-- INPUT: Ask 报告优化后的 Oracle 问答能力增量需求、口语化分类标题与短问题库。 -->
<!-- OUTPUT: OpenSpec answer-oracle-questions 增量规范（含关爱型语气约束）。 -->
<!-- POS: 能力变更规范文件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。 -->
一旦我被更新，务必更新我的开头注释，以及所属的文件夹的md。
# Capability: Answer Oracle Questions

## MODIFIED Requirements

### Requirement: Question selection
系统 SHALL 提供 6 个问答类别与附录 A 的预设问题库，并支持自由输入问题。

分类 ID 与口语化展示名（可本地化调整）如下：
- `self_discovery`｜EN: Me & My Vibe｜ZH: 我是谁 / 个人特质｜定义: 独特性、自信与个人气场
- `shadow_work`｜EN: Mental Health｜ZH: 情绪与心理｜定义: 情绪内耗、焦虑与潜意识恐惧
- `relationships`｜EN: Love & Relationships｜ZH: 恋爱与情感｜定义: 关系模式与亲密需求
- `vocation`｜EN: Money & Career｜ZH: 搞钱与搞事业｜定义: 财富路径、天赋变现与职业方向
- `family_roots`｜EN: Family & Trauma｜ZH: 原生家庭与创伤｜定义: 原生家庭影响与创伤修复
- `time_cycles`｜EN: Future & Destiny｜ZH: 未来与命运｜定义: 时机、转折点与年度主题

#### Scenario: User selects a preset category
- **WHEN** 用户选择某个类别
- **THEN** 系统展示该类别对应的 10 个问题（见附录 A）

#### Scenario: User switches language
- **WHEN** 用户切换语言
- **THEN** 系统展示该类别的本地化问题文案（非即时翻译）

### Requirement: Oracle response generation
系统 SHALL 通过后端使用 reasoning 模型生成结构化回答，并以心理疗愈 + 占星学视角关爱用户（共情、无评判、支持性），避免宿命论与确定性预测。

#### Scenario: Single-language response
- **WHEN** 用户提交问题并携带 `lang`
- **THEN** 系统仅返回该语言的回答内容

#### Scenario: Structured response with professional terminology
- **WHEN** 系统生成回答
- **THEN** 内容包含专业占星术语并给予通俗解释，且遵循输出格式规范（见“输出格式契约”）

#### Scenario: Caring tone and emotional safety
- **WHEN** 系统生成回答
- **THEN** 先确认用户感受并使用关爱、支持性的表达，避免指责或绝对化结论

## ADDED Requirements

### Requirement: Modular prompt assembly
系统 SHALL 按顺序组装 Prompt：`Base System` + `Category Module` + `User Data` + `Output Format`。

#### Scenario: Category-specific prompt assembly
- **GIVEN** 类别为 `shadow_work`
- **WHEN** 生成回答
- **THEN** Prompt 依序拼接 Base System、Mental Health Module、用户数据与 Output Format

### Requirement: Category modules
系统 SHALL 提供 6 个类别模块，定义分析重点与关键星象：
- `self_discovery`：聚焦个人特质与自信议题，关联太阳/月亮/上升的身份整合。
- `shadow_work`：聚焦情绪内耗与潜意识恐惧，关联冥王/土星/凯龙与 8/12 宫。
- `relationships`：聚焦恋爱与关系模式，关联金星/月亮/第七宫与依恋需求。
- `vocation`：聚焦财富路径与职业方向，关联 MC/北交/第十宫与成就阻碍。
- `family_roots`：聚焦原生家庭与创伤修复，关联月亮/土星/IC 与再抚育议题。
- `time_cycles`：聚焦时机与转折点，关联行运与周期（木星/土星/天王/冥王等）。

#### Scenario: Unknown category fallback
- **GIVEN** 类别未知或缺失
- **WHEN** 生成回答
- **THEN** 默认使用 `self_discovery` 模块

### Requirement: Output formatting contract
系统 SHALL 按以下结构输出内容，并严格使用指定标题与字段名：
1) The Essence（Headline / The Insight）
2) The Astrological Signature（Planet/Point in Sign/House 或 Aspect）
3) Deep Dive Analysis（The Mirror / The Root / The Shadow / The Light）
4) Soulwork（Journal Prompt / Micro-Habit）
5) The Cosmic Takeaway（Summary / Affirmation）
输出除段落标题外使用纯文本标签，不使用 Markdown 强调/列表/反引号。

#### Scenario: Markdown format compliance
- **WHEN** 生成回答
- **THEN** 输出以 `## 1. The Essence` 开始，且包含 5 个完整段落与对应字段（不含 Markdown 强调/列表/反引号）

### Requirement: Language-specific storage & regeneration
系统 SHALL 按语言存储 Ask 回答，切换语言时重新生成并缓存目标语言结果，不做即时翻译。

#### Scenario: Language switch triggers regeneration
- **GIVEN** 已存在中文回答但缺少英文回答
- **WHEN** 用户切换到英文
- **THEN** 系统生成英文回答并缓存

## Appendix A: 预设问题库（规范性）

### Category: Me & My Vibe（self_discovery）
定义: 独特性、自信与个人气场
- SD-01｜EN: "What is my hidden superpower?"｜ZH: "我隐藏的超能力是什么？"｜意图: 潜在优势
- SD-02｜EN: "Why do I feel so different from everyone else?"｜ZH: "为什么我觉得自己像个异类？"｜意图: 异类感
- SD-03｜EN: "What is my true personality type?"｜ZH: "我真正的人格类型是什么？"｜意图: 人格核心
- SD-04｜EN: "How do others really see me?"｜ZH: "别人眼里真实的我长什么样？"｜意图: 他人视角
- SD-05｜EN: "How can I stop doubting myself?"｜ZH: "如何停止自我怀疑？"｜意图: 自我怀疑
- SD-06｜EN: "What are my biggest blind spots?"｜ZH: "我最大的性格盲点是什么？"｜意图: 性格盲点
- SD-07｜EN: "Why am I so sensitive?"｜ZH: "为什么我这么敏感？"｜意图: 敏感根源
- SD-08｜EN: "What makes me magnetic to others?"｜ZH: "我吸引人的点在哪里？"｜意图: 个人魅力
- SD-09｜EN: "How do I find my real confidence?"｜ZH: "如何找到真正的自信？"｜意图: 真实自信
- SD-10｜EN: "What is my soul trying to learn?"｜ZH: "我的灵魂想学什么课题？"｜意图: 灵魂课题

### Category: Mental Health（shadow_work）
定义: 情绪内耗、焦虑与潜意识恐惧
- SW-01｜EN: "Why do I feel so empty?"｜ZH: "为什么我感到如此空虚？"｜意图: 空虚感
- SW-02｜EN: "How do I stop overthinking?"｜ZH: "如何停止精神内耗？"｜意图: 过度思考
- SW-03｜EN: "Why do I sabotage my own happiness?"｜ZH: "为什么我总破坏自己的幸福？"｜意图: 自我破坏
- SW-04｜EN: "What is my biggest subconscious fear?"｜ZH: "我潜意识里最大的恐惧是什么？"｜意图: 潜意识恐惧
- SW-05｜EN: "Why do I feel like a fake (Imposter)?"｜ZH: "为什么我觉得自己像个冒牌货？"｜意图: 冒充者感
- SW-06｜EN: "How do I manage my anxiety?"｜ZH: "如何管理我的焦虑？"｜意图: 焦虑管理
- SW-07｜EN: "Why is it hard for me to trust?"｜ZH: "为什么我很难信任别人？"｜意图: 信任困难
- SW-08｜EN: "What am I repressing?"｜ZH: "我在压抑什么？"｜意图: 压抑内容
- SW-09｜EN: "How do I find inner peace?"｜ZH: "如何找到内心的平静？"｜意图: 内心平静
- SW-10｜EN: "Why am I so hard on myself?"｜ZH: "为什么我对自己这么苛刻？"｜意图: 自我苛责

### Category: Love & Relationships（relationships）
定义: 关系模式与亲密需求
- RA-01｜EN: "Why am I still single?"｜ZH: "为什么我还单身？"｜意图: 单身原因
- RA-02｜EN: "Who is my true soulmate?"｜ZH: "谁是我的灵魂伴侣？"｜意图: 灵魂伴侣
- RA-03｜EN: "Why do I attract toxic people?"｜ZH: "为什么我总吸引有毒的人？"｜意图: 有毒吸引
- RA-04｜EN: "Is my current relationship going to last?"｜ZH: "我现在的这段关系会长久吗？"｜意图: 关系走向
- RA-05｜EN: "What are my red flags in dating?"｜ZH: "我在约会中有哪些危险信号？"｜意图: 约会红旗
- RA-06｜EN: "How do I get over my ex?"｜ZH: "如何忘掉前任？"｜意图: 走出前任
- RA-07｜EN: "What kind of partner do I actually need?"｜ZH: "我到底需要什么样的伴侣？"｜意图: 理想伴侣
- RA-08｜EN: "Why am I afraid of commitment?"｜ZH: "为什么我害怕承诺？"｜意图: 承诺恐惧
- RA-09｜EN: "How do I attract real love?"｜ZH: "如何吸引真正的爱？"｜意图: 吸引真爱
- RA-10｜EN: "What is my love language?"｜ZH: "我的爱的语言是什么？"｜意图: 爱的语言

### Category: Money & Career（vocation）
定义: 财富路径、天赋变现与职业方向
- VP-01｜EN: "What is my true life purpose?"｜ZH: "我真正的人生使命是什么？"｜意图: 人生使命
- VP-02｜EN: "How can I make the most money?"｜ZH: "我最赚钱的方式是什么？"｜意图: 赚钱方式
- VP-03｜EN: "Am I meant to be my own boss?"｜ZH: "我注定要自己当老板吗？"｜意图: 自主创业
- VP-04｜EN: "Why do I feel stuck in my job?"｜ZH: "为什么我在工作中感觉卡住了？"｜意图: 职业停滞
- VP-05｜EN: "What is my dream career path?"｜ZH: "我理想的职业路径是什么？"｜意图: 理想职业
- VP-06｜EN: "Am I destined for fame or success?"｜ZH: "我注定会出名或成功吗？"｜意图: 成名成功
- VP-07｜EN: "How do I stop burnout?"｜ZH: "如何停止职业倦怠？"｜意图: 职业倦怠
- VP-08｜EN: "What is blocking my financial abundance?"｜ZH: "是什么阻碍了我的财运？"｜意图: 财运阻碍
- VP-09｜EN: "Should I change my career right now?"｜ZH: "我现在该转行吗？"｜意图: 是否转行
- VP-10｜EN: "What is my unique talent?"｜ZH: "我独特的天赋是什么？"｜意图: 独特天赋

### Category: Family & Trauma（family_roots）
定义: 原生家庭与创伤修复
- FR-01｜EN: "How do I heal my 'Mommy Issues'?"｜ZH: "如何治愈我的“恋母/母亲创伤”？"｜意图: 母亲创伤
- FR-02｜EN: "How do I heal my 'Daddy Issues'?"｜ZH: "如何治愈我的“恋父/父亲创伤”？"｜意图: 父亲创伤
- FR-03｜EN: "What childhood wound is holding me back?"｜ZH: "哪个童年创伤在拖累我？"｜意图: 童年伤口
- FR-04｜EN: "Why do I feel like the 'Black Sheep'?"｜ZH: "为什么我觉得自己是家里的异类？"｜意图: 家庭异类感
- FR-05｜EN: "How do I break my family cycles?"｜ZH: "如何打破家族的恶性循环？"｜意图: 打破家族循环
- FR-06｜EN: "How do I set boundaries with parents?"｜ZH: "如何对父母设立边界？"｜意图: 亲子边界
- FR-07｜EN: "What did I inherit from my ancestors?"｜ZH: "我从祖先那里继承了什么？"｜意图: 祖辈影响
- FR-08｜EN: "How do I nurture my Inner Child?"｜ZH: "如何疗愈我的内在小孩？"｜意图: 内在小孩
- FR-09｜EN: "Why is my home life so chaotic?"｜ZH: "为什么我的家庭生活这么混乱？"｜意图: 家庭混乱感
- FR-10｜EN: "How do I forgive my past?"｜ZH: "如何宽恕我的过去？"｜意图: 宽恕过去

### Category: Future & Destiny（time_cycles）
定义: 时机、转折点与年度主题
- TC-01｜EN: "What is coming next for me?"｜ZH: "接下来会发生什么？"｜意图: 下一步
- TC-02｜EN: "When will my luck change?"｜ZH: "我的运气什么时候会好转？"｜意图: 运势转折
- TC-03｜EN: "Is a big life change coming?"｜ZH: "人生巨变要来了吗？"｜意图: 重大变化
- TC-04｜EN: "What is my theme for this year?"｜ZH: "我今年的主题是什么？"｜意图: 年度主题
- TC-05｜EN: "Should I take a risk right now?"｜ZH: "我现在该冒险吗？"｜意图: 是否冒险
- TC-06｜EN: "Why is everything so hard lately?"｜ZH: "为什么最近一切都这么难？"｜意图: 近期艰难
- TC-07｜EN: "Am I on the right path?"｜ZH: "我在正确的道路上吗？"｜意图: 道路校准
- TC-08｜EN: "What opportunities are coming?"｜ZH: "有什么机会正在向我走来？"｜意图: 即将机会
- TC-09｜EN: "What do I need to let go of?"｜ZH: "我需要放手什么？"｜意图: 放手主题
- TC-10｜EN: "What is the universe trying to tell me?"｜ZH: "宇宙想告诉我什么？"｜意图: 宇宙讯息
