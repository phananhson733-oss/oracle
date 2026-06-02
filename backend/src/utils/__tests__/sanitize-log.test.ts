// INPUT: sanitize-log helper (SENSITIVE_FIELDS + sanitizeForLog); vitest.
// OUTPUT: 隐私日志脱敏护栏的行为契约单测（深克隆、不可变、嵌套/数组/birth.*整树/lat-lon、非PII放行）。
// POS: 守护隐私红线 #3「服务端日志不写原文」的机械执行原语。若改 sanitize-log.ts 同步此测试。

import { describe, it, expect } from 'vitest';
import { sanitizeForLog, SENSITIVE_FIELDS } from '../sanitize-log.js';

const REDACTED = '[redacted]';

describe('SENSITIVE_FIELDS', () => {
  it('covers the privacy-red-line PII keys', () => {
    for (const key of [
      'question',
      'situation',
      'moods',
      'automaticThoughts',
      'hotThought',
      'balancedEntries',
      'nameA',
      'nameB',
      'birth',
      'lat',
      'lon',
    ]) {
      expect(SENSITIVE_FIELDS.has(key)).toBe(true);
    }
  });
});

describe('sanitizeForLog', () => {
  it('redacts top-level sensitive keys and preserves non-PII', () => {
    const out = sanitizeForLog({
      question: 'why am I sad',
      category: 'love',
      question_length: 11,
    });
    expect(out.question).toBe(REDACTED);
    expect(out.category).toBe('love');
    expect(out.question_length).toBe(11);
  });

  it('redacts the whole birth subtree (birth.*) and standalone lat/lon', () => {
    const out = sanitizeForLog({
      birth: { birthCity: 'Paris', birthDate: '1990-01-01' },
      lat: 48.8,
      lon: 2.3,
      module: 'natal',
    });
    expect(out.birth).toBe(REDACTED);
    expect(out.lat).toBe(REDACTED);
    expect(out.lon).toBe(REDACTED);
    expect(out.module).toBe('natal');
  });

  it('recurses into nested non-sensitive objects', () => {
    const out = sanitizeForLog({ meta: { question: 'x', category: 'y' } });
    expect(out.meta.question).toBe(REDACTED);
    expect(out.meta.category).toBe('y');
  });

  it('redacts sensitive keys deep inside non-sensitive containers', () => {
    const out = sanitizeForLog({ payload: { user: { nameA: 'Alice', age: 30 } } });
    expect(out.payload.user.nameA).toBe(REDACTED);
    expect(out.payload.user.age).toBe(30);
  });

  it('handles arrays of objects', () => {
    const out = sanitizeForLog({
      entries: [
        { hotThought: 'a', when: 'mon' },
        { hotThought: 'b', when: 'tue' },
      ],
    });
    expect(out.entries[0].hotThought).toBe(REDACTED);
    expect(out.entries[0].when).toBe('mon');
    expect(out.entries[1].hotThought).toBe(REDACTED);
  });

  it('tolerates null / undefined / primitives without throwing', () => {
    expect(sanitizeForLog(null)).toBe(null);
    expect(sanitizeForLog(undefined)).toBe(undefined);
    expect(sanitizeForLog('plain string')).toBe('plain string');
    expect(sanitizeForLog(42)).toBe(42);
    expect(sanitizeForLog({})).toEqual({});
  });

  it('does NOT mutate the original payload (immutability)', () => {
    const original = {
      question: 'secret',
      birth: { birthCity: 'Paris' },
      category: 'love',
    };
    const snapshot = JSON.parse(JSON.stringify(original));
    const out = sanitizeForLog(original);
    expect(original).toEqual(snapshot);
    expect(out).not.toBe(original);
    expect(out.question).toBe(REDACTED);
  });

  it('accepts a custom fields set', () => {
    const out = sanitizeForLog({ token: 'abc', name: 'ok' }, new Set(['token']));
    expect(out.token).toBe(REDACTED);
    expect(out.name).toBe('ok');
  });

  it('treats Date and other class instances as leaves (not recursed away)', () => {
    const d = new Date('2026-06-02T00:00:00Z');
    const out = sanitizeForLog({ at: d, question: 'x' });
    expect(out.at).toBe(d);
    expect(out.question).toBe(REDACTED);
  });
});
