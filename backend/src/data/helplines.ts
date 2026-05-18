// INPUT: 区域代码到求助热线信息的静态映射（US/UK/CN/HK/TW + INTL 兜底）。
// OUTPUT: 导出 RegionCode、Helpline 类型、HELPLINES 表与 getHelplineForRegion 解析函数。
// POS: CBT 危机检测数据；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

/**
 * 热线数据 v0 —— 归档前需要产品/法务复核电话与 URL 的现行有效性。
 *
 * INTL 不提供电话号码（各国差异大），仅提供 Befrienders Worldwide URL，
 * 该站点会按用户所在国家路由到对应本地热线。
 */

export type RegionCode = 'US' | 'UK' | 'CN' | 'HK' | 'TW' | 'INTL';

export interface Helpline {
  region: RegionCode;
  name_en: string;
  name_zh: string;
  phone: string;
  url: string;
}

export const HELPLINES: Readonly<Record<RegionCode, Helpline>> = Object.freeze({
  US: {
    region: 'US',
    name_en: '988 Suicide & Crisis Lifeline',
    name_zh: '988 自杀与危机求助热线',
    phone: '988',
    url: 'https://988lifeline.org',
  },
  UK: {
    region: 'UK',
    name_en: 'Samaritans',
    name_zh: '撒玛利亚会',
    phone: '116 123',
    url: 'https://www.samaritans.org',
  },
  CN: {
    region: 'CN',
    name_en: 'Beijing Crisis Hotline',
    name_zh: '北京心理危机研究与干预中心',
    phone: '010-82951332',
    url: 'https://www.crisis.org.cn',
  },
  HK: {
    region: 'HK',
    name_en: 'Samaritans Hong Kong',
    name_zh: '香港撒玛利亚防止自杀会',
    phone: '2389 2222',
    url: 'https://www.sbhk.org.hk',
  },
  TW: {
    region: 'TW',
    name_en: 'Lifeline Taiwan',
    name_zh: '生命线协谈',
    phone: '1995',
    url: 'https://www.life1995.org.tw',
  },
  INTL: {
    region: 'INTL',
    name_en: 'Befrienders Worldwide',
    name_zh: 'Befrienders 全球热线',
    phone: '',
    url: 'https://www.befrienders.org',
  },
});

/**
 * 解析区域代码 → 返回 Helpline 数据。
 *
 * 优先级：x-region header（外部传入）→ 通过 lang 推断 → INTL 兜底。
 *
 * @param region 由调用方解析后的区域代码或 undefined。
 * @param lang  当前请求语言，仅在 region 缺失时作为兜底依据使用。
 */
export function getHelplineForRegion(
  region: string | undefined,
  lang: 'zh' | 'en',
): Helpline {
  if (region) {
    const upper = region.toUpperCase() as RegionCode;
    if (HELPLINES[upper]) {
      return HELPLINES[upper];
    }
  }
  if (lang === 'zh') return HELPLINES.CN;
  if (lang === 'en') return HELPLINES.US;
  return HELPLINES.INTL;
}
