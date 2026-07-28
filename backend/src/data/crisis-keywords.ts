// INPUT: 中英双语的危机/自伤关键词集合（v0 初始版，需心理健康专业人士审阅）。
// OUTPUT: 导出已编译的英文正则数组 + 中文关键词字符串数组。
// POS: CBT 危机检测数据；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

/**
 * v0 关键词列表 —— 需心理健康专业人士审阅。
 *
 * 设计原则：
 * - 英文使用 `\b` 词边界，避免与正常词汇冲突（如 "endeavor" 不应匹配 "end"）。
 * - 中文使用子串匹配（无空格分词），常见自伤/自杀直白表达。
 * - 大小写不敏感由调用方统一处理（`toLowerCase()` 后再 `re.test()` 即可）。
 * - 倾向"宁可误报不漏报"：v0 接受少量误报，频次驱动下一轮裁剪。
 *
 * 扩展流程：每次新增需在 PR 中由心理专家签字（按 add-cbt-crisis-detection 提案约定）。
 */
export const EN_PATTERNS: ReadonlyArray<RegExp> = Object.freeze([
  /\bsuicide\b/i,
  /\bsuicidal\b/i,
  /\bkill myself\b/i,
  /\bkilling myself\b/i,
  /\bend it all\b/i,
  /\bend my life\b/i,
  /\bhurt myself\b/i,
  /\bhurting myself\b/i,
  /\bself[\s-]?harm\b/i,
  /\bwant to die\b/i,
  // v0.2 expansion — methods, slang, despair markers.
  /\boverdose\b/i,
  /\bcut myself\b/i,
  /\bcutting myself\b/i,
  /\bjump off\b/i,
  /\bkms\b/i,
  /\bkms please\b/i,
  /\bcan't go on\b/i,
  /\bcannot go on\b/i,
  /\bno reason to live\b/i,
  /\bgive up on life\b/i,
  /\btaking my life\b/i,
  /\bslit my wrist\b/i,
  /\bslit my wrists\b/i,
  /\bhang myself\b/i,
  /\bno point living\b/i,
  /\bno point in living\b/i,
]);

export const ZH_KEYWORDS: ReadonlyArray<string> = Object.freeze([
  "想死",
  "自杀",
  "结束生命",
  "自残",
  "活不下去",
  "不想活",
  "了结自己",
  "没有意义活",
  // v0.2 expansion — direct methods and despair markers.
  "轻生",
  "割腕",
  "跳楼",
  "上吊",
  "服毒",
  "结束一切",
  "撑不下去",
  "自我伤害",
]);
