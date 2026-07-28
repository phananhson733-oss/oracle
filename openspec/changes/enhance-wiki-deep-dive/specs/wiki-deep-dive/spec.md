# Specification: Wiki Deep Dive 内容增强与前端缓存

## 概述

本规范定义了 Wiki 百科深度解读(deep_dive)内容的生成、存储、展示以及前端缓存要求。

---

## ADDED Requirements

### REQ-WIKI-DD-001: Prompt 模板管理
系统必须提供结构化的 prompt 模板管理机制，用于生成不同类别占星条目的深度解读内容。

#### Scenario: 星座类 prompt 模板
**Given** 需要生成白羊座的深度解读
**When** 系统加载星座类 prompt 模板
**Then** 模板应包含：
- 基础 prompt 结构（8 步骤框架）
- 白羊座专属变体（火象、基本模式、火星守护、开创能量侧重）
- 中英文双语指令

#### Scenario: 宫位类 prompt 模板
**Given** 需要生成第 7 宫的深度解读
**When** 系统加载宫位类 prompt 模板
**Then** 模板应包含：
- 基础 prompt 结构（8 步骤框架）
- 第 7 宫专属变体（婚姻、合作、投射机制、对宫关系侧重）
- 中英文双语指令

#### Scenario: 行星类 prompt 模板
**Given** 需要生成太阳的深度解读
**When** 系统加载行星类 prompt 模板
**Then** 模板应包含：
- 基础 prompt 结构（8 步骤框架）
- 太阳专属变体（英雄之旅、父亲原型、自我实现侧重）
- 中英文双语指令

---

### REQ-WIKI-DD-002: Deep Dive 步骤数量规范
每个 deep_dive 内容必须包含 4-8 个步骤，具体数量根据条目类型而定。

#### Scenario: 行星类 deep_dive 步骤
**Given** 生成太阳的 deep_dive 内容
**When** 内容生成完成
**Then** 应包含以下 8 个步骤：
1. 行星的基本含义
2. 行星在不同星座的表现
3. 行星在不同宫位的表现
4. 行星与其他行星的相位
5. 行星逆行的影响
6. 行星的成长与成熟作用
7. 行星的实际应用与生活意义
8. 总结与实用建议

#### Scenario: 星座类 deep_dive 步骤
**Given** 生成白羊座的 deep_dive 内容
**When** 内容生成完成
**Then** 应包含以下 8 个步骤：
1. 星座的基本含义
2. 星座的宫位影响
3. 星座与行星的相位分析
4. 星座的逆行与回归
5. 星座的成长与成熟作用
6. 星座的周期与影响
7. 星座的实际应用与生活意义
8. 总结与实用建议

#### Scenario: 相位类 deep_dive 步骤
**Given** 生成合相的 deep_dive 内容
**When** 内容生成完成
**Then** 应包含至少 4 个步骤：
1. 相位的基本含义
2. 常见行星组合的解读
3. 相位的心理动力学
4. 整合建议

---

### REQ-WIKI-DD-003: 内容字段完整性
每个占星条目必须具备完整的解读内容，不允许使用占位符文本。

#### Scenario: 完整条目内容 - 现有字段
**Given** 用户访问金牛座详情页
**When** 页面加载完成
**Then** 应显示：
- `astronomy_myth`: 非占位符的天文神话内容（> 100 字符）
- `psychology`: 非占位符的心理解读（> 100 字符）
- `shadow`: 非占位符的阴影特质（> 50 字符）
- `integration`: 非占位符的整合建议（> 50 字符）
- `deep_dive`: 4-8 个步骤的深度解读

#### Scenario: 完整条目内容 - 新增字段
**Given** 用户访问金牛座详情页
**When** 页面加载完成
**Then** 应显示：
- `life_areas`: 至少 2 个生活领域的影响描述
- `growth_path`: 成长路径建议（> 50 字符）
- `practical_tips`: 3-5 条实用小贴士
- `common_misconceptions`: 2-3 条常见误解澄清
- `affirmation`: 1 条正向肯定语

#### Scenario: 检测占位符内容
**Given** 系统运行内容完整性检查
**When** 发现任何条目包含"编撰中"、"in progress"、"..."等占位符文本
**Then** 应在日志中报告该条目需要补全

---

### REQ-WIKI-DD-004: 中英文双语一致性
所有条目的中英文内容结构必须一致，术语翻译必须准确。

#### Scenario: 步骤结构一致
**Given** 太阳条目的中文版 deep_dive 有 8 个步骤
**When** 用户切换到英文版
**Then** 英文版 deep_dive 也应有 8 个步骤，且每个步骤主题对应

#### Scenario: 术语翻译准确
**Given** 中文内容使用"土星回归"术语
**When** 对应英文内容
**Then** 应翻译为 "Saturn Return"，而非直译

#### Scenario: 新增字段双语一致
**Given** 中文版有 `practical_tips` 包含 4 条建议
**When** 用户切换到英文版
**Then** 英文版 `practical_tips` 也应包含 4 条对应的建议

---

### REQ-WIKI-DD-005: 新增细分条目
系统必须支持四元素和三模式的细分条目。

#### Scenario: 四元素细分条目
**Given** 用户访问 Wiki 百科列表
**When** 筛选"核心概念"类别
**Then** 应显示以下条目：
- 四元素（总论）- id: `elements`
- 火元素 - id: `fire-element`
- 土元素 - id: `earth-element`
- 风元素 - id: `air-element`
- 水元素 - id: `water-element`

#### Scenario: 三模式细分条目
**Given** 用户访问 Wiki 百科列表
**When** 筛选"核心概念"类别
**Then** 应显示以下条目：
- 三大模式（总论）- id: `modes`
- 基本模式 - id: `cardinal-mode`
- 固定模式 - id: `fixed-mode`
- 变动模式 - id: `mutable-mode`

#### Scenario: 细分条目与总论条目关联
**Given** 用户访问"火元素"详情页
**When** 页面加载完成
**Then** `related_ids` 应包含 `elements`（总论条目）

---

### REQ-WIKI-DD-006: 内容生成脚本
系统必须提供自动化脚本用于批量生成 deep_dive 内容。

#### Scenario: 运行生成脚本
**Given** 管理员执行 `npm run generate:wiki-content`
**When** 脚本执行完成
**Then** 应：
- 生成指定条目的中英文 deep_dive 内容
- 输出生成报告（成功/失败数量）
- 将内容写入对应的数据文件

#### Scenario: 增量生成
**Given** 部分条目已有完整 deep_dive 内容
**When** 运行生成脚本
**Then** 应跳过已有内容的条目，仅生成缺失内容

#### Scenario: 单条目生成
**Given** 管理员执行 `npm run generate:wiki-content -- --item=aries`
**When** 脚本执行完成
**Then** 应仅生成白羊座的内容，不影响其他条目

---

### REQ-WIKI-DD-007: WikiItem 类型扩展
系统必须扩展 WikiItem 类型以支持新增字段。

#### Scenario: 新增字段类型定义
**Given** 开发者查看 `backend/src/types/api.ts`
**When** 查看 WikiItem 接口
**Then** 应包含以下新增可选字段：
```typescript
life_areas?: WikiLifeArea[];
growth_path?: string;
practical_tips?: string[];
common_misconceptions?: string[];
affirmation?: string;
```

#### Scenario: WikiLifeArea 类型定义
**Given** 开发者查看 `backend/src/types/api.ts`
**When** 查看 WikiLifeArea 接口
**Then** 应定义为：
```typescript
interface WikiLifeArea {
  area: 'career' | 'love' | 'health' | 'finance' | 'family' | 'spiritual';
  description: string;
}
```

---

### REQ-WIKI-DD-008: 前端永久缓存 - Wiki Items 列表
前端必须对 Wiki 条目列表实现永久缓存。

#### Scenario: 首次加载缓存
**Given** 用户首次访问 Wiki 列表页
**When** API 返回数据
**Then** 应将数据存入 localStorage，key 格式为 `astro:wiki_items:v1:{lang}`

#### Scenario: 缓存命中
**Given** 用户已访问过 Wiki 列表页（缓存存在）
**When** 用户再次访问 Wiki 列表页
**Then** 应直接从 localStorage 读取，不发起网络请求

#### Scenario: 版本更新缓存失效
**Given** 缓存版本号从 v1 更新为 v2
**When** 用户访问 Wiki 列表页
**Then** 应忽略旧版本缓存，重新请求 API 并写入新版本缓存

---

### REQ-WIKI-DD-009: 前端永久缓存 - Wiki Item 详情
前端必须对 Wiki 条目详情实现永久缓存。

#### Scenario: 首次加载详情缓存
**Given** 用户首次访问白羊座详情页
**When** API 返回数据
**Then** 应将数据存入 localStorage，key 格式为 `astro:wiki_item:v1:aries:{lang}`

#### Scenario: 详情缓存命中
**Given** 用户已访问过白羊座详情页（缓存存在）
**When** 用户再次访问白羊座详情页
**Then** 应直接从 localStorage 读取，不发起网络请求

#### Scenario: 离线访问
**Given** 用户已缓存白羊座详情数据
**When** 用户在离线状态下访问白羊座详情页
**Then** 应正常显示缓存内容

---

### REQ-WIKI-DD-010: 缓存清理机制
系统应提供缓存清理功能（可选）。

#### Scenario: 手动清理缓存
**Given** 用户点击"清除 Wiki 缓存"按钮
**When** 确认清除
**Then** 应删除所有 Wiki 相关的 localStorage 条目

#### Scenario: 清理后重新加载
**Given** 用户已清除 Wiki 缓存
**When** 用户访问 Wiki 页面
**Then** 应重新从 API 加载数据

---

## MODIFIED Requirements

### REQ-WIKI-DD-011: 数据文件拆分
将现有的 `wiki.ts` 文件拆分为多个模块文件。

#### Scenario: 按类别拆分
**Given** 现有 wiki.ts 包含所有类别的条目
**When** 完成拆分重构
**Then** 应形成以下文件结构：
```
backend/src/data/
├── wiki.ts              # 保留基础结构和导出
├── wiki-planets.ts      # 行星内容
├── wiki-signs.ts        # 星座内容
├── wiki-houses.ts       # 宫位内容
├── wiki-aspects.ts      # 相位内容
└── wiki-concepts.ts     # 核心概念内容
```

#### Scenario: 导出兼容性
**Given** 前端代码 `import { getWikiStaticContent } from './wiki'`
**When** 数据文件完成拆分
**Then** 导出接口应保持不变，前端无需修改

---

### REQ-WIKI-DD-012: 现有 deep_dive 内容优化
将现有仅 2 步骤的 deep_dive 优化为 8 步骤。

#### Scenario: 四轴内容优化
**Given** 现有 Ascendant 的 deep_dive 仅 2 步骤
**When** 内容优化完成
**Then** deep_dive 应扩展为 8 步骤，覆盖：
1. 基本含义
2. 星座影响
3. 行星相位
4. 与对轴的关系
5. 成长作用
6. 周期影响
7. 实际应用
8. 总结建议

#### Scenario: 虚点和小行星内容优化
**Given** 现有 North Node 的 deep_dive 仅 2 步骤
**When** 内容优化完成
**Then** deep_dive 应扩展为 8 步骤

#### Scenario: 星盘类型内容优化
**Given** 现有 Natal Chart 的 deep_dive 仅 2 步骤
**When** 内容优化完成
**Then** deep_dive 应扩展为 8 步骤

---

## 验收标准

### 内容完整性
1. 所有 88+ 个占星条目都有完整的 deep_dive 内容（4-8 步骤）
2. 无任何条目包含占位符文本
3. 所有条目的现有字段（astronomy_myth, psychology, shadow, integration）完整
4. 所有条目的新增字段（life_areas, growth_path, practical_tips, common_misconceptions, affirmation）完整

### 双语一致性
5. 中英文内容结构一致
6. 占星术语翻译准确

### 新增内容
7. 新增的 7 个细分条目（4 元素 + 3 模式）正常显示
8. 细分条目与总论条目正确关联

### 前端缓存
9. Wiki Items 列表首次加载后缓存生效
10. Wiki Item 详情首次加载后缓存生效
11. 重复访问时无网络请求（从缓存读取）
12. 版本更新时自动失效旧缓存
13. 离线状态可访问已缓存内容

### 技术实现
14. 生成脚本可正常运行
15. 文件拆分后 API 兼容性测试通过
16. WikiItem 类型扩展正确
