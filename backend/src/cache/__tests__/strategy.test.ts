// INPUT: backend/src/cache/strategy.ts 的 hashInput 工具。
// OUTPUT: 隐私红线回归——验证缓存键 hash 使用 SHA-256（不可逆且抗碰撞）。
// POS: cache strategy 单测；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { describe, it, expect } from 'vitest';
import { hashInput } from '../strategy.js';

describe('hashInput (privacy red line)', () => {
  it('produces SHA-256 hex digest (64 chars)', () => {
    const out = hashInput({ date: '1990-01-01', city: 'Beijing' });
    expect(out).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    const input = { date: '1990-01-01', time: '12:00', city: 'Beijing', lat: 39.9, lon: 116.4 };
    expect(hashInput(input)).toBe(hashInput(input));
  });

  it('produces different digests for different inputs', () => {
    const a = hashInput({ date: '1990-01-01', city: 'Beijing' });
    const b = hashInput({ date: '1990-01-02', city: 'Beijing' });
    expect(a).not.toBe(b);
  });

  it('does not embed the plaintext input value', () => {
    const out = hashInput({ city: 'Beijing-very-unique-string' });
    expect(out).not.toContain('Beijing');
  });

  it('is not the legacy djb2 short hash (which produced ~7-char base36)', () => {
    const out = hashInput({ a: 1 });
    expect(out.length).toBeGreaterThan(40);
  });
});
