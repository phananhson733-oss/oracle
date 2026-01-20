---
name: astrology-book-analyzer
description: >
  占星书籍深度拆解工具 | Astrology Book Deep Analysis Tool
  输入任意占星书籍的书名+作者,输出深度拆解报告(中文约10000字 + 英文约10000字)。
  Input any astrology book title + author, output deep analysis report (Chinese ~10000 words + English ~10000 words).
  适用范围:现代心理占星、古典希腊化占星、中世纪占星、卜卦占星、择日占星、世俗占星、医疗占星等所有占星传统。
  Applicable: Modern psychological astrology, Hellenistic astrology, Medieval astrology, Horary, Electional, Mundane, Medical astrology, and all astrological traditions.
---

# 占星书籍深度拆解工具 v4.1 | Astrology Book Deep Analysis Tool v4.1

## 核心理念 | Core Philosophy

**深度优先 · 易读为本 · 实用至上**
**Depth First · Readability Focused · Practicality Oriented**

本工具旨在生成**真正有深度、易于理解、实用性强**的占星书籍拆解报告,避免走马观花式的表面总结,也避免过度专业化的学术腔调。

This tool aims to generate astrology book analysis reports that are **truly in-depth, easy to understand, and highly practical**, avoiding superficial summaries and overly academic jargon.

---

## 最佳实践与配置 | Best Practices & Configuration

### 参数设置建议 | Parameter Recommendations

为获得最佳的分析效果，建议按照以下参数配置您的 LLM：

*   **Temperature (温度): 0.5** (推荐范围: 0.4 - 0.6)
    *   **原因**: 经典书籍拆解需要平衡“准确性”与“可读性”。
    *   **太低 (0 - 0.3)**: 容易导致行文枯燥、机械，缺乏生动的比喻，难以服务初级用户。
    *   **太高 (0.7 - 1.0)**: 容易导致核心概念漂移、过度演绎甚至产生幻觉，损害资深用户的信任。
    *   **0.5 平衡点**: 既能严格遵循原书逻辑，又能生成流畅、富有同理心的解读。

### 双层受众平衡策略 | Dual-Audience Strategy

本 Skill 采用结构化设计来同时满足初级和资深用户：

1.  **针对资深用户 (The Anchor)**
    *   保留英文原词 (Original Terminology)
    *   提供专业定义 (Professional Definitions)
    *   包含批判性分析与学术讨论 (Critical Analysis)

2.  **针对初级用户 (The Bridge)**
    *   强制要求通俗解释 (Plain Explanations)
    *   强制要求生活比喻 (Life Analogies)
    *   提供立即行动建议 (Actionable Steps)

---

## 文件结构 | File Structure

本 skill 采用模块化设计，详细内容分布在以下文件中：

**核心文件 Core Files:**
- `SKILL.md` (本文件): 核心工作流程和使用指南
- `references/methodology.md`: 详细的分析方法论和步骤
- `references/quality-standards.md`: 写作质量标准和检查清单
- `references/astrology-reference.md`: 占星术语速查表

**模板文件 Template Files:**
- `assets/report-template-chinese.md`: 中文报告完整模板
- `assets/report-template-english.md`: 英文报告完整模板

---

## 使用方法 | How to Use

当用户提供占星书籍的**书名**和**作者名**时，按照以下工作流程进行：

### 第一步：识别书籍类型 | Step 1: Identify Book Type

**三种主要类型 | Three Main Types:**

1.  **工具性书籍 (Practical/Technical books)**
    - 侧重技法、操作、案例
    - 示例: Planets in Transit (Robert Hand), Christian Astrology (William Lilly)
    - 报告重点: 实践内容60-70%, 理论20-30%, 评价10-20%

2.  **哲学类书籍 (Philosophical books)**
    - 侧重理论、思想、世界观
    - 示例: Cosmos and Psyche (Richard Tarnas), The Pulse of Life (Dane Rudhyar)
    - 报告重点: 理论60-70%, 实践20-30%, 评价10-20%

3.  **综合性书籍 (Comprehensive books)**
    - 理论与实践并重
    - 示例: The Inner Sky (Steven Forrest), Hellenistic Astrology (Chris Brennan)
    - 报告重点: 理论40%, 实践40%, 评价20%

### 第二步：执行分析流程 | Step 2: Execute Analysis Process

**核心分析步骤 | Core Analysis Steps:**

1.  **整体概览 (Overview)**
    - 快速通读全书框架
    - 确定书籍定位（传统、难度、主题）
    - 识别核心问题

2.  **章节拆解 (Chapter Deconstruction)**
    - 逐章精读并记录核心论点
    - 整理概念与术语（专业定义 + 通俗解释）
    - 提炼方法论与理论

3.  **深入分析 (Deep Analysis)**
    - 核心论点深度分析
    - 批判性评估（优势与局限）
    - 与其他著作对话

4.  **总结提炼 (Summary)**
    - 经典金句摘录（5-8条）
    - 核心思想一句话
    - 整合整体框架

> **详细方法论**: 查看 `references/methodology.md` 了解每个步骤的详细操作指南

### 第三步：生成报告 | Step 3: Generate Reports

**生成两份完整报告 | Generate Two Complete Reports:**
- 中文报告: 约10000字 (Chinese report: ~10000 words)
- 英文报告: 约10000字 (English report: ~10000 words)

**报告标准结构 | Standard Report Structure:**

```
一、引言: 为什么要读这本书 (800-1000字)
   Introduction: Why Read This Book

二、书籍概览: 全书架构与逻辑 (1000-1500字)
   Book Overview: Structure and Logic

三、核心概念与理论深度拆解 (3000-3500字) 【报告核心】
   Core Concepts and Theories: Deep Dive

   字数分配根据书籍类型调整:
   - 工具性书籍: 20-30%
   - 哲学类书籍: 60-70%
   - 综合性书籍: 40%

四、占星方法与技巧详解 (2000字)
   Astrological Methods and Techniques

   字数分配根据书籍类型调整:
   - 工具性书籍: 60-70%
   - 哲学类书籍: 20-30%
   - 综合性书籍: 40%

五、批判性分析与学术讨论 (1500字)
   Critical Analysis and Academic Discussion

六、结论: 学习路径与行动建议 (1000-1200字)
   Conclusion: Learning Path and Action Plan
```

> **完整模板**:
> - 中文模板: `assets/report-template-chinese.md`
> - 英文模板: `assets/report-template-english.md`

---

## 核心质量要求 | Core Quality Requirements

### 1. 深度标准 | Depth Standard

*   **必须达到 Must Achieve:**
    - 每个章节都有独立的分析视角
    - 概念解释有深度，揭示"为什么"
    - 揭示作者的底层逻辑和隐含假设
    - 批判性评价有理有据

*   **避免 Avoid:**
    - 仅仅复述书中内容
    - 只列举概念，不深入解释
    - 空泛的赞美或贬低

### 2. 易读性标准 | Readability Standard

*   **必须达到 Must Achieve:**
    - **专业术语必须配通俗解释** (核心要求)
    - 使用生活比喻帮助理解抽象概念
    - 段落长度适中（3-5句）
    - 使用图表、流程图辅助说明

*   **避免 Avoid:**
    - 专业术语没有通俗解释
    - 大段理论堆砌
    - 缺少案例和比喻

### 3. 实用性标准 | Practicality Standard

*   **必须达到 Must Achieve:**
    - 理论连接实践应用
    - 技法有清晰的操作步骤
    - 提供分阶段学习计划（4个阶段，每阶段有目标、行动、检验标准）
    - 给出立即行动建议（5条具体可执行）

*   **避免 Avoid:**
    - 理论与实践脱节
    - 没有可操作的学习建议
    - 缺少"如何应用"的指导

> **完整质量标准**: 查看 `references/quality-standards.md` 了解详细的质量控制清单

---

## 关键写作原则 | Key Writing Principles

### 术语解释模板 | Terminology Explanation Template

对于每个核心术语，必须包含：

```
┌─────────────────────────────────────┐
│ 术语: [概念名称]                      │
│                                     │
│ [专业定义]                           │
│ [作者的原始定义]                     │
│                                     │
│ [通俗解释] *核心要求*                │
│ [用日常语言解释,必须让普通读者听懂]  │
│                                     │
│ [生活比喻]                           │
│ [用日常生活的例子类比]               │
│                                     │
│ [实例说明]                           │
│ [在实际星盘中如何体现]               │
│                                     │
│ [与其他概念的关系]                   │
│ [在作者的理论体系中的位置]           │
└─────────────────────────────────────┘
```

### 技法解释模板 | Technique Explanation Template

对于每个核心技法，必须包含：

```
┌─────────────────────────────────────┐
│ 技法名称: [名称]                     │
│                                     │
│ [操作流程图] *可操作性关键*          │
│ 步骤1: [具体操作] -> 注意事项       │
│   ↓                                 │
│ 步骤2: [具体操作] -> 注意事项       │
│   ↓                                 │
│ 步骤3: [具体操作] -> 注意事项       │
│   ↓                                 │
│ 结论/判断: [如何得出结论]            │
│                                     │
│ [案例示范]                           │
│ [用具体案例演示整个流程]             │
│                                     │
│ [判断规则清单]                       │
│ - 规则1: 如果A -> 则B               │
│ - 规则2: 如果C -> 则D               │
│                                     │
│ [常见错误提醒]                       │
│ - 错误做法: ...                     │
│ - 正确做法: ...                     │
└─────────────────────────────────────┘
```

### 批判性评价原则 | Critical Assessment Principle

> **重要原则 Important Principle:**
> 批判不是否定，而是明确边界！告诉读者这本书"能做什么"和"不能做什么"。
> Critique is not rejection but boundary clarification! Tell readers what the book "can do" and "cannot do."

**评价框架 Assessment Framework:**

*   **优势与贡献 Strengths:**
    - 内容全面性
    - 逻辑严谨性
    - 实用价值
    - 创新程度
    - 可读性

*   **局限与争议 Limitations:**
    - 理论局限（边界在哪里）
    - 时代局限（受写作时代的限制）
    - 观点争议（占星界的不同意见）
    - 缺失内容（应该讲但没讲的）

---

## 书籍定位参考 | Book Positioning Reference

### 占星传统归属 | Astrological Tradition

| 传统 Tradition | 核心特征 Core Features | 代表著作 Examples |
|---------------|----------------------|-------------------|
| 现代心理占星 Modern Psychological | 荣格心理学、原型分析、成长导向 | The Inner Sky, Person-Centered Astrology |
| 希腊化占星 Hellenistic | 时间主星、Lots系统、整宫制、命运主题 | Hellenistic Astrology (Brennan) |
| 中世纪占星 Medieval | 综合希腊-阿拉伯、重视尊贵力量 | Christian Astrology (Lilly) |
| 进化占星 Evolutionary | 灵魂进化、南北交点、业力主题 | Pluto (J. Green) |

### 难度层次 | Difficulty Level

| 层次 Level | 适合读者 Target Readers | 特征 Characteristics |
|-----------|------------------------|---------------------|
| 入门 Introductory | 零基础 | 基础概念、行星星座宫位入门 |
| 进阶 Intermediate | 1-2年学习经验 | 相位深化、综合解读、基础推运 |
| 高阶 Advanced | 3-5年学习经验 | 专题深入、复杂技法、案例分析 |
| 专家 Expert | 专业占星师 | 原典研究、技法创新、学术探讨 |

### 主题类型 | Topic Type

| 主题 Topic | 内容范围 Content |
|-----------|-----------------|
| 本命占星 Natal | 出生图解读、性格分析、潜能评估 |
| 推运占星 Predictive | 行运、推进、返照、大运 |
| 关系占星 Relationship | 合盘、组合盘、人际关系 |
| 卜卦占星 Horary | 具体问题判断、时机选择 |
| 世俗占星 Mundane | 国运、政治、经济周期 |
| 专题占星 Specialized | 特定行星、相位、宫位等深入研究 |

> **术语参考**: 查看 `references/astrology-reference.md` 了解完整的占星术语速查表

---

## 报告完成检查清单 | Report Completion Checklist

在提交报告前，必须确认以下要点：

### 内容完整性 | Content Completeness

- [ ] 六大模块全部完成
- [ ] 字数达到约10000字（允许±10%浮动）
- [ ] 根据书籍类型调整了字数分配
- [ ] 包含5-8条经典金句摘录与解读
- [ ] 包含3-5段经典段落引用与深度解析
- [ ] 包含全书核心思想一句话提炼
- [ ] 包含3-5个核心概念的通俗解释和生活比喻
- [ ] 包含底层逻辑分析（核心问题+底层假设+论证主线）
- [ ] 包含分阶段学习计划（4个阶段，每阶段有目标、行动、检验标准）
- [ ] 包含立即行动建议（5条具体可执行）

### 质量检查 | Quality Check

- [ ] **深度**: 每个概念都有独立分析，不是仅仅复述
- [ ] **易读性**: 专业术语都配通俗解释和生活比喻
- [ ] **实用性**: 理论都连接了实践应用，有可操作的学习计划
- [ ] **准确性**: 书名、作者名、术语定义准确
- [ ] **格式**: 标题层级清晰，表格格式正确

> **详细检查清单**: 查看 `references/quality-standards.md` 了解详细的质量控制标准

---

## 重要提醒 | Important Reminders

### 核心原则 | Core Principles

1.  **专业术语必须配通俗解释** - 不能让读者看不懂！
    Technical terms MUST be accompanied by plain explanations!

2.  **理论必须连接实践** - 告诉读者如何应用！
    Theory MUST connect to practice!

3.  **批判是明确边界** - 不是否定，而是说明适用范围！
    Critique is boundary clarification!

4.  **深度优先** - 避免走马观花式的表面总结！
    Depth first - avoid superficial summaries!

### 语言风格 | Language Style

**中文报告 Chinese Report:**
- 使用清晰、准确的现代汉语
- 专业术语首次出现时附英文
- 避免过度学术化的表述
- 适当使用"你"/"读者"等称呼，增加亲切感
- **禁止使用Emoji图标** (No Emojis allowed)

**英文报告 English Report:**
- Use clear, professional English
- Avoid overly academic jargon
- Use "you" when appropriate for engagement
- Maintain consistent terminology
- **No Emojis allowed**

---

**版本 Version**: 4.1
**最后更新 Last Updated**: 2026年1月
**更新说明 Update Notes**:
- 移除所有Emoji图标以保持专业风格
- 增加参数设置建议(Temperature 0.5)
- 增加双层受众平衡策略说明
