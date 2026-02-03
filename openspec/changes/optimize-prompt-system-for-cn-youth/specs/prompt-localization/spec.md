# Prompt 内容本土化规范

## ADDED Requirements

### Requirement: 五行融合模块
新增五行与西方占星的融合映射，作为分析的补充视角。

#### Scenario: 行星五行映射
- **Given** 用户星盘中太阳在白羊座
- **When** AI 生成 natal-overview
- **Then** 输出中可包含五行视角的补充说明（如「火上加火，行动力拉满」）
- **And** 五行描述不超过输出总文字量的 15%
- **And** 不替代西方占星的核心分析

#### Scenario: 五行平衡分析
- **Given** 用户星盘数据
- **When** 计算五行平衡
- **Then** 输出简要的五行强弱描述（如「火旺水弱」）
- **And** 该描述注入到 UserPortrait 中

### Requirement: 节气语境模块
新增二十四节气与日运/行运的语境融合。

#### Scenario: 日运节气融合
- **Given** 当前日期处于某节气
- **When** AI 生成 daily-forecast
- **Then** 输出中包含节气相关的建议或氛围描述
- **And** 节气内容自然融入，不生硬

#### Scenario: 非节气期间
- **Given** 当前日期不在任何节气点（±3天）
- **When** AI 生成 daily-forecast
- **Then** 不强制添加节气内容

### Requirement: 生肖桥接模块
新增生肖与星座的趣味对比功能。

#### Scenario: 生肖星座对比
- **Given** 用户出生年份可推算生肖
- **When** AI 生成分析内容
- **Then** 可选包含「你是XX座的XX（生肖），双重XX属性」这类趣味描述
- **And** 仅作为趣味补充，不作为分析依据

## MODIFIED Requirements

### Requirement: 语言风格指南升级
所有 AI 输出的语言风格必须符合中国 18-35 岁年轻人的表达习惯。

#### Scenario: 年轻化表达
- **Given** AI 需要表达「用户具有较强的事业驱动力」这类含义
- **When** 生成输出文案
- **Then** 使用年轻化表达（如「搞钱能力拉满」「事业心max」）
- **And** 不使用过时网络用语（小仙女/666/集美）

#### Scenario: 场景代入感
- **Given** AI 需要举例说明某个星象特质
- **When** 选择场景
- **Then** 使用中国年轻人熟悉的具体场景（如「开会时被cue到突然发言」而非「社交场合感到不自在」）

#### Scenario: 中国传统文化元素适度融入
- **Given** AI 生成任何模块的分析内容
- **When** 涉及可关联中国传统文化的概念
- **Then** 每段分析最多包含 1 处中国传统文化引用
- **And** 使用过渡语自然引入（「有趣的是/从另一个角度看」）
- **And** 不出现封建迷信表述

### Requirement: 分享文案风格
所有 share_text 类字段的文案必须适合朋友圈/小红书传播。

#### Scenario: 分享文案
- **Given** AI 生成包含 share_text 的输出
- **When** 用户看到分享文案
- **Then** 文案风格接近小红书标题（引子+自嘲+行动号召）
- **And** 长度 20-30 字
- **And** 可包含 1-2 个 emoji
