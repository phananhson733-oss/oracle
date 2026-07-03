<!-- INPUT: services/llmText 的结构块 + 编辑部纸墨 token。 -->
<!-- OUTPUT: 全站 LLM 解读内容的统一文档式排版原语。 -->
<!-- POS: components/ 子域；LLM 内容排版唯一来源，消费方禁止手搓节卡片/彩虹眉标/圆点假列表。 -->

# components/llm/

LLM 解读内容统一排版原语（artifact 文档式：单列文档流 + mono 眉标节头 + 发丝线分节 + 最多一层容器）。
风格 token 沿用编辑部纸墨；本目录只管排版结构。规格入口：COLOR_SYSTEM_GUIDE.md §LLM 内容排版。

## 文件清单

- LlmDoc.tsx｜地位：排版原语集｜功能：LlmDoc（文档根）/LlmSection（发丝线分节+眉标+标题）/LlmProse（原始 LLM 字符串 → 段落/清单/引言文档流）/LlmList（bullet/ordered/rows 无框清单）/LlmQuote（左线斜体引言）/LlmCallout（唯一允许的一层内嵌容器）/LlmKV（键值行）。

## 红线

1. 节与节之间用发丝线 + 留白分隔，**不得**再包卡片。
2. 眉标全站单色 mono，**不得**按节轮换颜色。
3. 清单项**不得**逐项装框；LlmCallout 内**不得**再出现带 border/bg 的块。
4. LLM 内部结构（LAYER N、Key:/Mechanism: 前缀）**不得**泄漏进 UI（llmText 已剥）。

## 近期变更

- 2026-07-03 创建：/goal LLM 排版统一（42 面盘点后落地），吸收 12+ 手搓解析器为 services/llmText.ts。
