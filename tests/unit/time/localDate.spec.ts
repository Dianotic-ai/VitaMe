// file: tests/unit/time/localDate.spec.ts — local date key helpers

import { describe, expect, it } from 'vitest';
import { addLocalDays, isoToLocalDateKey, localDateKey } from '@/lib/time/localDate';

describe('localDate helpers', () => {
  it('formats a Date with the local calendar day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('converts ISO timestamps back to local calendar days', () => {
    const local = new Date(2026, 3, 27, 21, 15);
    expect(isoToLocalDateKey(local.toISOString())).toBe('2026-04-27');
  });

  it('adds calendar days in local time', () => {
    expect(localDateKey(addLocalDays(new Date(2026, 3, 1, 12), -1))).toBe('2026-03-31');
  });
});
