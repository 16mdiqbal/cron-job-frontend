import { describe, expect, it } from 'vitest';
import type { Job } from '@/types';
import { sortJobsByDefaultOrder } from './jobSorting';

const job = (overrides: Partial<Job> & Pick<Job, 'id' | 'name' | 'is_active'>): Job => ({
  id: overrides.id,
  name: overrides.name,
  is_active: overrides.is_active,
  cron_expression: '* * * * *',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  ...overrides,
});

describe('sortJobsByDefaultOrder', () => {
  it('orders active jobs by nearest next execution, then active without next, then inactive', () => {
    const jobs = [
      job({ id: 'a3', name: 'Active no next', is_active: true, next_execution_at: undefined }),
      job({ id: 'i1', name: 'Inactive soon', is_active: false, next_execution_at: '2026-01-01T00:00:10.000Z' }),
      job({ id: 'a2', name: 'Active later', is_active: true, next_execution_at: '2026-01-01T00:00:20.000Z' }),
      job({ id: 'a1', name: 'Active soon', is_active: true, next_execution_at: '2026-01-01T00:00:10.000Z' }),
      job({ id: 'a4', name: 'Active invalid next', is_active: true, next_execution_at: 'not-a-date' }),
      job({ id: 'i2', name: 'Inactive no next', is_active: false, next_execution_at: undefined }),
    ];

    const sorted = sortJobsByDefaultOrder(jobs);

    expect(sorted.map((j) => j.id)).toEqual(['a1', 'a2', 'a4', 'a3', 'i1', 'i2']);
  });

  it('uses name and id as tie-breakers when next execution is equal or missing', () => {
    const jobs = [
      job({ id: '2', name: 'Same', is_active: true, next_execution_at: '2026-01-01T00:00:10.000Z' }),
      job({ id: '1', name: 'Same', is_active: true, next_execution_at: '2026-01-01T00:00:10.000Z' }),
      job({ id: '3', name: 'Another', is_active: true, next_execution_at: '2026-01-01T00:00:10.000Z' }),
    ];

    const sorted = sortJobsByDefaultOrder(jobs);
    expect(sorted.map((j) => j.id)).toEqual(['3', '1', '2']);
  });
});
