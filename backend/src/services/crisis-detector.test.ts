// INPUT: crisis-detector 服务的单元测试（双语关键词、词边界、异常路径、字段提取与区域解析）。
// OUTPUT: vitest 测试套件，覆盖 detectCrisis / resolveRegion / extractFreeText / buildCrisisResponse。
// POS: CBT 危机检测测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import {
  detectCrisis,
  resolveRegion,
  extractFreeText,
  buildCrisisResponse,
} from './crisis-detector.js';

function makeReq(
  headers: Record<string, string | string[] | undefined> = {},
): Request {
  return { headers } as unknown as Request;
}

describe('detectCrisis - English patterns', () => {
  it('matches direct "suicide" mention', () => {
    expect(detectCrisis(['I have suicidal thoughts'])).toEqual({
      hit: true,
      reason: 'self_harm_en',
    });
  });

  it('matches "kill myself" phrase', () => {
    expect(detectCrisis(['I want to kill myself']).hit).toBe(true);
  });

  it('matches "end it all"', () => {
    expect(detectCrisis(['I just want to end it all']).hit).toBe(true);
  });

  it('matches "self-harm" with hyphen', () => {
    expect(detectCrisis(['thinking about self-harm']).hit).toBe(true);
  });

  it('matches "self harm" with space', () => {
    expect(detectCrisis(['thinking about self harm']).hit).toBe(true);
  });

  it('matches "want to die"', () => {
    expect(detectCrisis(['I just want to die']).hit).toBe(true);
  });

  it('is case-insensitive (SUICIDE)', () => {
    expect(detectCrisis(['SUICIDE']).hit).toBe(true);
  });

  it('uses word boundaries: "endeavor" must not trigger "end"', () => {
    expect(detectCrisis(['I finished the project endeavor']).hit).toBe(false);
  });

  it('uses word boundaries: "endurance" must not trigger', () => {
    expect(detectCrisis(['Running tests my endurance']).hit).toBe(false);
  });

  it('does not match unrelated words containing "kill"', () => {
    expect(detectCrisis(['That movie was a killer']).hit).toBe(false);
  });
});

describe('detectCrisis - Chinese keywords', () => {
  it('matches "想死"', () => {
    expect(detectCrisis(['我真的想死了']).hit).toBe(true);
    expect(detectCrisis(['我真的想死了']).reason).toBe('self_harm_zh');
  });

  it('matches "活不下去"', () => {
    expect(detectCrisis(['我活不下去了']).hit).toBe(true);
  });

  it('matches "自杀"', () => {
    expect(detectCrisis(['有自杀念头']).hit).toBe(true);
  });

  it('matches "自残"', () => {
    expect(detectCrisis(['想自残']).hit).toBe(true);
  });

  it('does not match unrelated Chinese text', () => {
    expect(detectCrisis(['我今天去公园散步']).hit).toBe(false);
  });
});

describe('detectCrisis - edge cases', () => {
  it('returns no-hit on empty array', () => {
    expect(detectCrisis([]).hit).toBe(false);
  });

  it('returns no-hit on array of undefined/null/empty', () => {
    expect(detectCrisis([undefined, null, '', '   '] as unknown as string[]).hit).toBe(
      false,
    );
  });

  it('skips non-string items', () => {
    expect(
      detectCrisis([
        123 as unknown as string,
        { foo: 'bar' } as unknown as string,
        'I want to die',
      ]).hit,
    ).toBe(true);
  });

  it('scans multiple texts and returns first hit', () => {
    expect(detectCrisis(['safe text', 'I want to die', 'more text']).hit).toBe(
      true,
    );
  });

  it('never throws even on weird input', () => {
    expect(() =>
      detectCrisis(null as unknown as string[]),
    ).not.toThrow();
  });

  it('returns no-hit (not throw) on null input', () => {
    expect(detectCrisis(null as unknown as string[]).hit).toBe(false);
  });
});

describe('resolveRegion', () => {
  it('honors x-region header (UK)', () => {
    expect(resolveRegion(makeReq({ 'x-region': 'UK' }), 'en')).toBe('UK');
  });

  it('normalizes header case', () => {
    expect(resolveRegion(makeReq({ 'x-region': 'uk' }), 'en')).toBe('UK');
  });

  it('falls back to CN when lang=zh and no header', () => {
    expect(resolveRegion(makeReq(), 'zh')).toBe('CN');
  });

  it('falls back to US when lang=en and no header', () => {
    expect(resolveRegion(makeReq(), 'en')).toBe('US');
  });

  it('ignores unknown header regions and falls through to lang', () => {
    expect(resolveRegion(makeReq({ 'x-region': 'ZZ' }), 'zh')).toBe('CN');
  });

  it('handles array headers', () => {
    expect(resolveRegion(makeReq({ 'x-region': ['UK'] }), 'en')).toBe('UK');
  });
});

describe('buildCrisisResponse', () => {
  it('returns crisis_detected status', () => {
    const r = buildCrisisResponse('US', 'en');
    expect(r.status).toBe('crisis_detected');
  });

  it('includes a non-empty bilingual message pair', () => {
    const r = buildCrisisResponse('US', 'en');
    expect(r.message_zh.length).toBeGreaterThan(0);
    expect(r.message_en.length).toBeGreaterThan(0);
  });

  it('returns matching helpline for region', () => {
    expect(buildCrisisResponse('UK', 'en').helpline.phone).toBe('116 123');
    expect(buildCrisisResponse('CN', 'zh').helpline.region).toBe('CN');
  });

  it('returns INTL helpline (Befrienders) when region is INTL', () => {
    const r = buildCrisisResponse('INTL', 'en');
    expect(r.helpline.region).toBe('INTL');
    expect(r.helpline.url).toContain('befrienders');
  });
});

describe('extractFreeText', () => {
  it('extracts situation / hotThought / automaticThoughts', () => {
    const body = {
      situation: 'work pressure',
      hotThought: 'I am useless',
      automaticThoughts: ['always failing', 'no one cares'],
    };
    const texts = extractFreeText(body);
    expect(texts).toContain('work pressure');
    expect(texts).toContain('I am useless');
    expect(texts).toContain('always failing');
    expect(texts).toContain('no one cares');
  });

  it('extracts balanced entries text and mood names', () => {
    const body = {
      balancedEntries: [{ id: '1', text: 'I can handle this', belief: 60 }],
      moods: [
        { id: '1', name: 'anxiety', initialIntensity: 50 },
        { id: '2', name: 'sadness' },
      ],
    };
    const texts = extractFreeText(body);
    expect(texts).toContain('I can handle this');
    expect(texts).toContain('anxiety');
    expect(texts).toContain('sadness');
  });

  it('extracts stats notes/text/label fields recursively', () => {
    const body = {
      period: '2025-05',
      somatic_stats: {
        items: [{ label: 'feeling tired', notes: 'severe insomnia' }],
      },
    };
    const texts = extractFreeText(body);
    expect(texts).toContain('feeling tired');
    expect(texts).toContain('severe insomnia');
  });

  it('returns empty array on null body', () => {
    expect(extractFreeText(null)).toEqual([]);
  });

  it('returns empty array on non-object body', () => {
    expect(extractFreeText('string body')).toEqual([]);
  });

  it('ignores unrelated stats keys', () => {
    const body = { other_stat: { foo: 'something else' } };
    expect(extractFreeText(body)).toEqual([]);
  });
});

describe('detectCrisis - integration with extractFreeText', () => {
  it('catches crisis in nested balancedEntries', () => {
    const body = {
      situation: 'ok',
      balancedEntries: [{ id: '1', text: 'I want to die', belief: 80 }],
    };
    expect(detectCrisis(extractFreeText(body)).hit).toBe(true);
  });

  it('catches crisis in stats notes', () => {
    const body = {
      somatic_stats: { items: [{ notes: '我活不下去了' }] },
    };
    expect(detectCrisis(extractFreeText(body)).hit).toBe(true);
  });
});
