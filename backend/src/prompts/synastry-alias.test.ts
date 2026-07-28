// INPUT: backend/src/prompts/common.ts 的 resolveSynastryName / formatSynastryContextBlock。
// OUTPUT: 隐私红线回归——验证真实姓名永远不会进入 LLM prompt 上下文，始终使用 Person A/B 别名。
// POS: synastry name aliasing 隐私测试；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from 'vitest';
import {
  resolveSynastryName,
  formatSynastryContextBlock,
} from './common.js';

describe('resolveSynastryName (privacy red line)', () => {
  it('always returns Person A alias for nameA in English context', () => {
    const ctx = { lang: 'en', nameA: 'Alice Smith', nameB: 'Bob Jones' };
    expect(resolveSynastryName(ctx, 'nameA')).toBe('Person A');
    expect(resolveSynastryName(ctx, 'nameB')).toBe('Person B');
  });

  it('always returns A/B alias for nameA in Chinese context', () => {
    const ctx = { lang: 'zh', nameA: '张三', nameB: '李四' };
    expect(resolveSynastryName(ctx, 'nameA')).toBe('A');
    expect(resolveSynastryName(ctx, 'nameB')).toBe('B');
  });

  it('returns alias even when raw name is empty', () => {
    const ctx = { lang: 'en', nameA: '', nameB: '' };
    expect(resolveSynastryName(ctx, 'nameA')).toBe('Person A');
    expect(resolveSynastryName(ctx, 'nameB')).toBe('Person B');
  });

  it('returns alias even when name field is undefined', () => {
    const ctx = { lang: 'en' };
    expect(resolveSynastryName(ctx, 'nameA')).toBe('Person A');
    expect(resolveSynastryName(ctx, 'nameB')).toBe('Person B');
  });
});

describe('formatSynastryContextBlock (privacy red line)', () => {
  it('omits real names from English prompt context block', () => {
    const block = formatSynastryContextBlock({
      lang: 'en',
      nameA: 'Alice Smith',
      nameB: 'Bob Jones',
      chartA: { sample: true },
      chartB: { sample: true },
      synastry: {},
      relationship_type: 'romantic',
    });
    expect(block).not.toContain('Alice');
    expect(block).not.toContain('Smith');
    expect(block).not.toContain('Bob');
    expect(block).not.toContain('Jones');
    expect(block).toContain('Person A');
    expect(block).toContain('Person B');
  });

  it('omits real names from Chinese prompt context block', () => {
    const block = formatSynastryContextBlock({
      lang: 'zh',
      nameA: '张三',
      nameB: '李四',
      chartA: { sample: true },
      chartB: { sample: true },
      synastry: {},
      relationship_type: '伴侣',
    });
    expect(block).not.toContain('张三');
    expect(block).not.toContain('李四');
    expect(block).toContain('A 的本命盘');
    expect(block).toContain('B 的本命盘');
  });

  it('omits real names from birth_accuracy line', () => {
    const block = formatSynastryContextBlock({
      lang: 'en',
      nameA: 'Alice Smith',
      nameB: 'Bob Jones',
      chartA: {},
      chartB: {},
      synastry: {},
      birth_accuracy: { nameA: 'exact', nameB: 'approximate' },
    });
    expect(block).not.toContain('Alice Smith');
    expect(block).not.toContain('Bob Jones');
    expect(block).toContain('Person A: exact');
    expect(block).toContain('Person B: approximate');
  });
});
