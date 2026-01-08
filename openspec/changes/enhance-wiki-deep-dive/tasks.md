# Tasks: 增强 Wiki Deep Dive 内容与前端缓存

## 阶段 1：准备工作

### 1.1 定义 Prompt 模板结构
- [x] 创建 `backend/src/data/wiki-prompts.ts` 文件
- [x] 定义 `WikiDeepDivePrompt` 接口
- [x] 编写基础 prompt 模板结构

### 1.2 拆解用户提供的综合 Prompt
- [x] 星座类 prompt → 12 个星座专属 prompt 变体
- [x] 宫位类 prompt → 12 个宫位专属 prompt 变体
- [x] 相位类 prompt → 5 个相位专属 prompt 变体
- [x] 行星类 prompt → 10 个行星专属 prompt 变体
- [x] 虚点和小行星 prompt → 5 个专属 prompt 变体
- [x] 四轴 prompt → 4 个专属 prompt 变体（优化现有）
- [x] 四元素 prompt → 1 总论 + 4 元素专属 prompt
- [x] 三模式 prompt → 1 总论 + 3 模式专属 prompt
- [x] 星盘类型 prompt → 4 个星盘专属 prompt（优化现有）

**验证**：所有 prompt 模板完成编写，可通过代码 review 确认

---

## 阶段 2：类型扩展与脚本框架

### 2.1 扩展 WikiItem 类型
- [ ] 在 `backend/src/types/api.ts` 中添加 `WikiLifeArea` 接口
- [ ] 在 `WikiItem` 中添加 `life_areas` 字段
- [ ] 在 `WikiItem` 中添加 `growth_path` 字段
- [ ] 在 `WikiItem` 中添加 `practical_tips` 字段
- [ ] 在 `WikiItem` 中添加 `common_misconceptions` 字段
- [ ] 在 `WikiItem` 中添加 `affirmation` 字段

**验证**：TypeScript 编译通过，类型定义正确

### 2.2 编写生成脚本基础框架
- [ ] 创建 `backend/scripts/generate-wiki-content.ts`
- [ ] 实现 DeepSeek API 调用封装
- [ ] 实现 prompt 模板填充逻辑
- [ ] 实现中英文双语生成逻辑

### 2.3 实现内容解析与存储
- [ ] 解析大模型返回的 deep_dive 步骤结构
- [ ] 将内容写入 `wiki.ts` 或独立文件
- [ ] 实现增量生成（避免重复生成已有内容）

**验证**：运行脚本可成功生成 1 个测试条目的完整内容

---

## 阶段 3：批量内容生成

### 3.1 行星类内容生成（10 条目）
- [ ] Sun（太阳）- 生成 deep_dive + 补全所有字段
- [ ] Moon（月亮）
- [ ] Mercury（水星）
- [ ] Venus（金星）
- [ ] Mars（火星）
- [ ] Jupiter（木星）
- [ ] Saturn（土星）- 优化现有 deep_dive 为 8 步骤
- [ ] Uranus（天王星）
- [ ] Neptune（海王星）
- [ ] Pluto（冥王星）

**验证**：运行 `npm run dev`，访问 Wiki 页面确认内容显示正确

### 3.2 星座类内容生成（12 条目）
- [ ] Aries（白羊座）
- [ ] Taurus（金牛座）
- [ ] Gemini（双子座）
- [ ] Cancer（巨蟹座）
- [ ] Leo（狮子座）
- [ ] Virgo（处女座）
- [ ] Libra（天秤座）
- [ ] Scorpio（天蝎座）
- [ ] Sagittarius（射手座）
- [ ] Capricorn（摩羯座）
- [ ] Aquarius（水瓶座）
- [ ] Pisces（双鱼座）

**验证**：运行 `npm run dev`，访问 Wiki 页面确认内容显示正确

### 3.3 宫位类内容生成（12 条目）
- [ ] House 1（第 1 宫）
- [ ] House 2（第 2 宫）
- [ ] House 3（第 3 宫）
- [ ] House 4（第 4 宫）
- [ ] House 5（第 5 宫）
- [ ] House 6（第 6 宫）
- [ ] House 7（第 7 宫）
- [ ] House 8（第 8 宫）
- [ ] House 9（第 9 宫）
- [ ] House 10（第 10 宫）
- [ ] House 11（第 11 宫）
- [ ] House 12（第 12 宫）

**验证**：运行 `npm run dev`，访问 Wiki 页面确认内容显示正确

### 3.4 相位类内容生成（5 条目）
- [ ] Conjunction（合相）
- [ ] Opposition（冲相）
- [ ] Square（刑相）
- [ ] Trine（拱相）
- [ ] Sextile（六合）

**验证**：运行 `npm run dev`，访问 Wiki 页面确认内容显示正确

### 3.5 优化现有内容（四轴、虚点、小行星、星盘类型）
- [ ] Ascendant（上升点）- 优化为 8 步骤
- [ ] Descendant（下降点）- 优化为 8 步骤
- [ ] Midheaven（中天）- 优化为 8 步骤
- [ ] Imum Coeli（下中天）- 优化为 8 步骤
- [ ] North Node（北交点）- 优化为 8 步骤
- [ ] South Node（南交点）- 优化为 8 步骤
- [ ] Chiron（凯龙星）- 优化为 8 步骤
- [ ] Lilith（莉莉丝）- 优化为 8 步骤
- [ ] Juno（婚神星）- 优化为 8 步骤
- [ ] Natal Chart（本命盘）- 优化为 8 步骤
- [ ] Synastry（比较盘）- 优化为 8 步骤
- [ ] Composite（组合盘）- 优化为 8 步骤
- [ ] Transits（行运盘）- 优化为 8 步骤

**验证**：运行 `npm run dev`，访问 Wiki 页面确认内容显示正确

---

## 阶段 4：新增细分条目

### 4.1 四元素细分条目
- [ ] 新增 fire-element（火元素）条目
- [ ] 新增 earth-element（土元素）条目
- [ ] 新增 air-element（风元素）条目
- [ ] 新增 water-element（水元素）条目
- [ ] 更新 elements 总论条目的 related_ids

**验证**：新条目在 Wiki 列表页正常显示，可点击进入详情

### 4.2 三模式细分条目
- [ ] 新增 cardinal-mode（基本模式）条目
- [ ] 新增 fixed-mode（固定模式）条目
- [ ] 新增 mutable-mode（变动模式）条目
- [ ] 更新 modes 总论条目的 related_ids

**验证**：新条目在 Wiki 列表页正常显示，可点击进入详情

---

## 阶段 5：前端缓存实现

### 5.1 缓存工具函数
- [ ] 在 `services/apiClient.ts` 中定义 `WIKI_CACHE_VERSION` 常量
- [ ] 实现 `buildWikiItemsCacheKey(lang)` 函数
- [ ] 实现 `buildWikiItemCacheKey(id, lang)` 函数
- [ ] 实现缓存读取辅助函数
- [ ] 实现缓存写入辅助函数

**验证**：辅助函数单元测试通过（如有）

### 5.2 Wiki Items 列表缓存
- [ ] 修改 `fetchWikiItems` 函数
- [ ] 首先检查 localStorage 缓存
- [ ] 缓存命中时直接返回
- [ ] 缓存未命中时请求 API 并写入缓存

**验证**：首次加载后，刷新页面不再发起网络请求

### 5.3 Wiki Item 详情缓存
- [ ] 修改 `fetchWikiItem` 函数
- [ ] 首先检查 localStorage 缓存
- [ ] 缓存命中时直接返回
- [ ] 缓存未命中时请求 API 并写入缓存

**验证**：首次加载详情后，再次访问不再发起网络请求

### 5.4 缓存清理机制（可选）
- [ ] 实现 `clearWikiCache()` 函数
- [ ] 在设置页面添加"清除 Wiki 缓存"按钮（可选）

**验证**：点击清除按钮后，下次访问重新请求 API

---

## 阶段 6：内容审核与优化

### 6.1 中英文一致性校验
- [ ] 对照中英文内容结构一致性
- [ ] 校验占星术语翻译准确性
- [ ] 修正格式问题（Markdown 语法）

### 6.2 内容质量审核
- [ ] 检查生成内容的专业准确性
- [ ] 检查是否有重复或矛盾的表述
- [ ] 优化过长或过于抽象的描述

**验证**：人工抽查 10% 条目内容质量

---

## 阶段 7：数据文件拆分与集成测试

### 7.1 数据文件拆分
- [ ] 创建 `wiki-planets.ts` 并迁移行星数据
- [ ] 创建 `wiki-signs.ts` 并迁移星座数据
- [ ] 创建 `wiki-houses.ts` 并迁移宫位数据
- [ ] 创建 `wiki-aspects.ts` 并迁移相位数据
- [ ] 创建 `wiki-concepts.ts` 并迁移核心概念数据
- [ ] 更新 `wiki.ts` 统一导出

**验证**：API 返回数据与拆分前一致

### 7.2 前端显示测试
- [ ] 测试 WikiItemCard 组件显示 deep_dive 步骤
- [ ] 测试 WikiItemCard 组件显示新增字段
- [ ] 测试移动端适配
- [ ] 测试中英文切换

### 7.3 缓存功能测试
- [ ] 测试首次加载缓存写入
- [ ] 测试二次加载缓存读取
- [ ] 测试版本号更新后缓存失效
- [ ] 测试离线访问

### 7.4 性能测试
- [ ] 检查 wiki.ts 文件体积
- [ ] 测试首屏加载时间
- [ ] 确认前端缓存生效

**验证**：所有测试用例通过

---

## 依赖关系

```
阶段 1 ──→ 阶段 2 ──→ 阶段 3 ──→ 阶段 6
                      ↓
                   阶段 4 ──→ 阶段 6 ──→ 阶段 7

阶段 2 ──→ 阶段 5 ──→ 阶段 7
```

- 阶段 3、4、5 可并行执行
- 阶段 6 依赖阶段 3、4 完成
- 阶段 7 依赖阶段 5、6 完成
