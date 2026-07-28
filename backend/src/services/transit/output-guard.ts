// INPUT: 任意"生成文案"字符串（未来 LLM 节点/分类叙事，或客户端派生文案的回归 corpus）。
// OUTPUT: inspectGeneratedCopy（纯检测）+ guardGeneratedCopy（命中→确定性回落 + 脱敏 telemetry）+ 类型 + SAFE_FALLBACK。
// POS: Phase A0 安全底座——LLM/派生文案落地前的运行时输出护栏库（prompt 侧 NO_FATE 之外的第二道）。
//      ⚠️ 现状=library + tests only：尚未接入任何展示路径（B1/B2 LLM 文案上线时在生成边界接入 guardGeneratedCopy + 加 contract test）。
//      隐私：GuardHit.token 是每条规则的稳定 PII-free 标识（编译期常量，绝不来自用户输入）——telemetry 只发 category+token+sanitized label。
//      高精度优先 + allow-scrub：扫描前先剔除否定式安全免责声明（not guaranteed / 不一定会 / 这不是临床诊断 等），再扫禁词。
//      换行视为句界（同 .!?，靠 [^.!?\n] 窗口排除）——换行拆分的 FN 属精度优先的可接受延后项（plan INVESTIGATE ①），优先于跨行误伤善意文案。
//      若新增 LLM 触发面消费本模块，务必接入真实 telemetry sink（onHit）并更新所属 FOLDER.md。

export type GuardCategory = "fate" | "medical" | "financial" | "market";

export interface GuardHit {
  /** 命中的禁词类别 */
  category: GuardCategory;
  /** 稳定的规则标识（PII-free：每条 PATTERN 的编译期常量，绝不含用户原文 / PII）。 */
  token: string;
}

export interface GuardReport {
  safe: boolean;
  hits: GuardHit[];
}

export interface GuardOptions {
  /** 命中时的脱敏 telemetry sink（仅收到 category + 稳定 token + 校验过的 label，无原文 / PII）。抛错被吞，绝不影响 fallback。 */
  onHit?: (hits: GuardHit[], label?: string) => void;
  /** 调用面标签（如 "timeline.node-narrative"），仅用于 telemetry 归因。运行时按 LABEL_RE 白名单校验，非法（如误传用户字段）则丢弃。 */
  label?: string;
}

/** 命中后绝不外泄的确定性兜底文案（自身保证安全：不含任何禁词）。 */
export const SAFE_FALLBACK =
  "A period worth noticing in your own rhythm — explore it your own way.";

/** label 白名单：仅允许 telemetry 归因用的静态短标识，挡住误传的 user.email / 动态 PII 字段。 */
const LABEL_RE = /^[a-z0-9._:-]{1,80}$/i;

// =============================================================================
// ALLOW：否定式安全免责声明会合法地包含"否则被禁"的 token（diagnosis / 诊断 / guaranteed / 一定会 / forecast）。
// 匹配检测前先把这些 span 抹成空格，避免 guard 把安全免责声明本身替换成 fallback（Codex P1）。
// =============================================================================
const ALLOW: RegExp[] = [
  /not a clinical diagnosis/gi,
  /not a diagnosis/gi,
  /not medical advice/gi,
  /not financial advice/gi,
  /not legal advice/gi,
  /not a forecast/gi,
  // 否定式 "guaranteed" 是合规免责声明，不是宿命断言（Codex 二审 false-positive）。
  /\b(?:not|never)\s+guaranteed\b/gi,
  /\bnothing is guaranteed\b/gi,
  /\bno\s+\w+\s+is\s+guaranteed\b/gi,
  /这不是临床诊断/g,
  /不是诊断/g,
  /并非诊断/g,
  /不是必然/g,
  /并非必然/g,
  /不代表必然/g,
  /不是注定/g,
  /不是命运/g,
  // 否定式 "一定会"：不一定会 / 未必会 是反宿命的安全表达，子串会误伤（Codex 二审）。
  /不一定会/g,
  /未必会/g,
  /\bnot money\b/gi,
  /这不是投资建议/g,
  /不是投资建议/g,
];

// =============================================================================
// 禁词表（高精度）。EN 用 \b 词边界 + "谓词+对象"邻近组合（避免裸 will/buy 误伤）；CJK 无 \b 用子串。
// 每条带稳定 token（PII-free 规则标识，进 telemetry 而非 m[0]）。
// 已逐条对照：已上线安全文案 + 未来自我成长文案零误伤；宿命/医疗/金钱坏例全检出（含 Codex 补的 false-negatives）。
// =============================================================================
const PATTERNS: ReadonlyArray<{
  category: GuardCategory;
  token: string;
  re: RegExp;
}> = [
  // ---- fate-certainty：宿命/确定性断言 ----
  { category: "fate", token: "fate-destined-to", re: /\bdestined to\b/i },
  { category: "fate", token: "fate-destined-for", re: /\bdestined for\b/i },
  { category: "fate", token: "fate-doomed-to", re: /\bdoomed to\b/i },
  { category: "fate", token: "fate-guaranteed", re: /\bguaranteed\b/i },
  {
    category: "fate",
    token: "fate-bound-to-outcome",
    re: /\bbound to\s+(?:fail|happen|lose|suffer|repeat|end|break)\b/i,
  },
  {
    category: "fate",
    token: "fate-will-adverb",
    re: /\bwill\s+(?:definitely|certainly|surely|always|never)\b/i,
  },
  // will/must/won't + 人生事件结果（不裸拦 will/must，避免 "this will help" / "you must rest" 误伤）
  {
    category: "fate",
    token: "fate-modal-life-event",
    re: /\b(?:will|must|won'?t|going to|gonna)\b[^.!?\n]{0,30}\b(?:meet|marry|married|divorce|break\s?up|find love|get rich|become rich|fall ill|get sick|conceive|get pregnant|inherit|fail|die|leave (?:your|this|him|her|them))\b/i,
  },
  { category: "fate", token: "fate-zh-zhuding", re: /注定/ },
  { category: "fate", token: "fate-zh-biran", re: /必然/ },
  { category: "fate", token: "fate-zh-yidinghui", re: /一定会/ },
  { category: "fate", token: "fate-zh-bijiang", re: /必将/ },
  { category: "fate", token: "fate-zh-shibi", re: /势必/ },
  { category: "fate", token: "fate-zh-wufagaibian", re: /无法改变/ },
  { category: "fate", token: "fate-zh-biding", re: /必定/ },
  { category: "fate", token: "fate-zh-zhongjiang", re: /终将/ },

  // ---- medical：诊断/治疗断言 + "(have|develop|suffer from) + 临床病名"（诊断免责声明已被 allow-scrub 剔除）----
  // 注：删除了裸 cancer（本产品 Cancer=巨蟹座，会灾难性误伤 "have Cancer rising"）；
  //    临床词用多词短语（anxiety disorder 等），不加裸 anxiety（避免 "have anxiety about work" 误伤）。
  { category: "medical", token: "medical-diagnose", re: /\bdiagnos\w*/i },
  { category: "medical", token: "medical-cure", re: /\bcur(?:e|es|ed|ing)\b/i },
  { category: "medical", token: "medical-prescribe", re: /\bprescrib\w*/i },
  { category: "medical", token: "medical-medication", re: /\bmedication\b/i },
  {
    category: "medical",
    token: "medical-have-condition",
    re: /\b(?:have|has|had|got|having|develop|develops|developed|developing|suffer from|suffers from|suffered from|suffering from)\s+(?:\w+\s+){0,2}(?:depression|bipolar|adhd|ocd|ptsd|schizophreni\w*|anxiety disorder|panic disorder|eating disorder|substance use disorder)\b/i,
  },
  { category: "medical", token: "medical-zh-zhenduan", re: /诊断/ },
  { category: "medical", token: "medical-zh-zhiyu", re: /治愈/ },
  { category: "medical", token: "medical-zh-genzhi", re: /根治/ },
  { category: "medical", token: "medical-zh-chufang", re: /处方/ },
  { category: "medical", token: "medical-zh-yiyuzheng", re: /抑郁症/ },
  { category: "medical", token: "medical-zh-jiaolvzheng", re: /焦虑症/ },
  { category: "medical", token: "medical-zh-zaoyu", re: /躁郁/ },

  // ---- financial：投资/买卖建议（动词须邻近"资产/资金对象"，避免 "invest in rest" 误伤）----
  {
    category: "financial",
    token: "financial-verb-asset",
    re: /\b(?:invest|investing|investment|invested|buy|buying|sell|selling)\b[^.!?\n]{0,24}\b(?:stocks?|crypto\w*|bitcoin|shares|equit\w*|forex|nft|the market|money)\b/i,
  },
  {
    category: "financial",
    token: "financial-asset-verb",
    re: /\b(?:stocks?|crypto\w*|bitcoin|shares|the market)\b[^.!?\n]{0,24}\b(?:buy|buying|sell|selling|invest\w*)\b/i,
  },
  // 强金融标准词（无需对象）
  { category: "financial", token: "financial-get-rich", re: /\bget rich\b/i },
  { category: "financial", token: "financial-put-money", re: /\bput money\b/i },
  {
    category: "financial",
    token: "financial-take-profit",
    re: /\btake profit\b/i,
  },
  { category: "financial", token: "financial-stop-loss", re: /\bstop loss\b/i },
  { category: "financial", token: "financial-cash-out", re: /\bcash out\b/i },
  // CJK：动词邻近对象 + 强标准词（删裸 买/卖 与 钱，避免 "买东西要花钱"/"卖力赚钱" 误伤）
  {
    category: "financial",
    token: "financial-zh-verb-asset",
    re: /(?:投资|买入|卖出)[^。！？\n]{0,16}(?:股票|股市|币|基金|比特币|资金|期权)/,
  },
  { category: "financial", token: "financial-zh-chaogu", re: /炒股/ },
  { category: "financial", token: "financial-zh-gupiao", re: /股票/ },
  { category: "financial", token: "financial-zh-jiedai", re: /借贷/ },
  { category: "financial", token: "financial-zh-facai", re: /发财/ },
  { category: "financial", token: "financial-zh-bitcoin", re: /比特币/ },
  { category: "financial", token: "financial-zh-qiquan", re: /期权/ },

  // ---- market-direction：把能量图当成行情/交易信号 ----
  { category: "market", token: "market-bullish", re: /\bbullish\b/i },
  { category: "market", token: "market-bearish", re: /\bbearish\b/i },
  { category: "market", token: "market-buy-the-dip", re: /\bbuy the dip\b/i },
  {
    category: "market",
    token: "market-signal",
    re: /\b(?:buy|sell)\s+signal\b/i,
  },
  { category: "market", token: "market-zh-kanzhang", re: /看涨/ },
  { category: "market", token: "market-zh-kandie", re: /看跌/ },
  { category: "market", token: "market-zh-chaodi", re: /抄底/ },
  { category: "market", token: "market-zh-niushi", re: /牛市/ },
  { category: "market", token: "market-zh-xiongshi", re: /熊市/ },
];

/** 先剔除否定式安全免责声明，再交给禁词扫描（防免责声明本身被误判）。 */
function scrubAllowed(text: string): string {
  let out = text;
  for (const re of ALLOW) {
    out = out.replace(re, " ");
  }
  return out;
}

/**
 * 纯函数：扫描生成文案，返回所有命中（含稳定 PII-free token）。无副作用，便于测试与组合。
 */
export function inspectGeneratedCopy(text: string): GuardReport {
  const scrubbed = scrubAllowed(text);
  const hits: GuardHit[] = [];
  for (const { category, token, re } of PATTERNS) {
    if (re.test(scrubbed)) {
      hits.push({ category, token });
    }
  }
  return { safe: hits.length === 0, hits };
}

/** label 仅当通过白名单校验才上报，否则丢弃（防误传 user.email 等 PII）。 */
function sanitizeLabel(label?: string): string | undefined {
  return label && LABEL_RE.test(label) ? label : undefined;
}

/**
 * 护栏：文案安全则原样返回；命中禁词则返回确定性 fallback（绝不泄露命中串），
 * 并通过 onHit 发出脱敏 telemetry。
 * - 若 caller 提供的 fallback 自身不安全（如 B1 插值出禁词），降级到模块常量 SAFE_FALLBACK（Codex：fallback 也不可泄露）。
 * - onHit 抛错被吞——telemetry 故障绝不影响安全回落（Codex P2）。
 */
export function guardGeneratedCopy(
  text: string,
  fallback: string,
  opts?: GuardOptions,
): string {
  const report = inspectGeneratedCopy(text);
  if (report.safe) {
    return text;
  }
  if (opts?.onHit) {
    try {
      opts.onHit(report.hits, sanitizeLabel(opts.label));
    } catch {
      // telemetry sink 故障不得影响安全回落
    }
  }
  // fallback 也必须安全：插值/派生 fallback 可能自带禁词。
  return inspectGeneratedCopy(fallback).safe ? fallback : SAFE_FALLBACK;
}
