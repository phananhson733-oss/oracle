// INPUT: wiki 文章对象（embeddedTool / psychAdjacent 标记）。
// OUTPUT: isAdEligibleArticle —— 判断某篇 wiki 文章是否允许投广告（结构化收口门控#1 的排除规则）。
// POS: 广告投放资格判定；若更新此文件，务必更新 components/ads/FOLDER.md。

// 广告红线（评审 B4，结构化收口而非散落在调用方）：
//   - embeddedTool：tool-led 转化漏斗文章（含北交点迷你计算器 CTA）→ 不投广告，保护转化。
//   - psychAdjacent：心理敏感文章（带临床安全 footer）→ 不投广告，尊重心理安全。
// 每个 placement 都经此判定，防 PR3+ 加广告位时漏抄任一排除规则而违反红线。
export interface AdEligibleArticle {
  embeddedTool?: unknown;
  psychAdjacent?: unknown;
}

export const isAdEligibleArticle = (
  article: AdEligibleArticle | null | undefined,
): boolean => !!article && !article.embeddedTool && !article.psychAdjacent;
