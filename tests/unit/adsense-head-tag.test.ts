// INPUT: scripts/lib/adsense-head-tag.mjs 的 buildAdsenseHeadTag 纯函数 + 构造的 env 对象。
// OUTPUT: AdSense <head> loader 注入的门控与防注入契约测试。
// POS: 守住「审核期开 loader / 平时零第三方脚本」两级门控与 client id 格式校验；
//      该 tag 会进 442 个静态 stub 与 SPA 壳的原始 HTML，格式校验是唯一的注入防线。
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。
import { describe, it, expect } from 'vitest';
// @ts-expect-error —— .mjs 构建期共享模块，无 .d.ts；本测试只用其运行时行为。
import { buildAdsenseHeadTag } from '../../scripts/lib/adsense-head-tag.mjs';

const VALID = 'ca-pub-2217119707453176';

describe('buildAdsenseHeadTag —— 门控', () => {
  it('HEAD_LOADER_ENABLED 未设时不注入', () => {
    expect(buildAdsenseHeadTag({ VITE_ADSENSE_CLIENT_ID: VALID })).toBe('');
  });

  it('HEAD_LOADER_ENABLED 非字面量 "true" 时不注入', () => {
    for (const v of ['1', 'yes', 'TRUE', 'True', '']) {
      expect(
        buildAdsenseHeadTag({ VITE_ADSENSE_HEAD_LOADER_ENABLED: v, VITE_ADSENSE_CLIENT_ID: VALID }),
      ).toBe('');
    }
  });

  it('开关开启但 client id 缺失/空串时不注入', () => {
    for (const v of [undefined, '', '   ']) {
      expect(
        buildAdsenseHeadTag({ VITE_ADSENSE_HEAD_LOADER_ENABLED: 'true', VITE_ADSENSE_CLIENT_ID: v }),
      ).toBe('');
    }
  });

  it('两级门控齐备时注入带 client 的 loader', () => {
    const tag = buildAdsenseHeadTag({
      VITE_ADSENSE_HEAD_LOADER_ENABLED: 'true',
      VITE_ADSENSE_CLIENT_ID: VALID,
    });
    expect(tag).toContain(`client=${VALID}`);
    expect(tag).toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
    expect(tag).toContain('async');
    expect(tag).toContain('crossorigin="anonymous"');
  });

  it('共用 id="astro-adsense"，避免前端 loadAdsense 重复注入', () => {
    const tag = buildAdsenseHeadTag({
      VITE_ADSENSE_HEAD_LOADER_ENABLED: 'true',
      VITE_ADSENSE_CLIENT_ID: VALID,
    });
    expect(tag).toContain('id="astro-adsense"');
  });

  it('client id 前后空白被 trim 后仍视为合法', () => {
    const tag = buildAdsenseHeadTag({
      VITE_ADSENSE_HEAD_LOADER_ENABLED: 'true',
      VITE_ADSENSE_CLIENT_ID: `  ${VALID}\n`,
    });
    expect(tag).toContain(`client=${VALID}`);
    expect(tag).not.toContain(' \n');
  });
});

describe('buildAdsenseHeadTag —— 防注入', () => {
  // tag 直接拼进静态 stub 的原始 HTML，格式校验是唯一防线：任何不匹配
  // ^ca-pub-\d{10,25}$ 的输入都必须整体拒绝，而不是转义后放行。
  const MALICIOUS = [
    'ca-pub-123"></script><script>alert(1)</script>',
    'ca-pub-123" onload="alert(1)',
    '"><img src=x onerror=alert(1)>',
    'ca-pub-abcdefghij',
    'ca-pub-',
    'pub-2217119707453176',
    'ca-pub-123456789',
    `ca-pub-${'9'.repeat(26)}`,
    'ca-pub-2217119707453176 extra',
  ];

  it.each(MALICIOUS)('拒绝非法 client id: %s', (client) => {
    expect(
      buildAdsenseHeadTag({ VITE_ADSENSE_HEAD_LOADER_ENABLED: 'true', VITE_ADSENSE_CLIENT_ID: client }),
    ).toBe('');
  });

  it('合法输出不含未转义的断标签字符', () => {
    const tag = buildAdsenseHeadTag({
      VITE_ADSENSE_HEAD_LOADER_ENABLED: 'true',
      VITE_ADSENSE_CLIENT_ID: VALID,
    });
    expect(tag.match(/<script/g)).toHaveLength(1);
    expect(tag.match(/<\/script>/g)).toHaveLength(1);
  });

  it('边界长度（10 位与 25 位数字）被接受', () => {
    for (const digits of ['0123456789', '9'.repeat(25)]) {
      expect(
        buildAdsenseHeadTag({
          VITE_ADSENSE_HEAD_LOADER_ENABLED: 'true',
          VITE_ADSENSE_CLIENT_ID: `ca-pub-${digits}`,
        }),
      ).toContain(`client=ca-pub-${digits}`);
    }
  });
});

describe('buildAdsenseHeadTag —— 默认参数', () => {
  it('不传 env 时读 process.env，且默认关闭', () => {
    const saved = { ...process.env };
    delete process.env.VITE_ADSENSE_HEAD_LOADER_ENABLED;
    delete process.env.VITE_ADSENSE_CLIENT_ID;
    try {
      expect(buildAdsenseHeadTag()).toBe('');
    } finally {
      process.env = saved;
    }
  });
});
