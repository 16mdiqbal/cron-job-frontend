import type { Job } from '@/types';

const parseExecutionMs = (value?: string): number | null => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};

export const compareJobsByDefaultOrder = (a: Job, b: Job): number => {
  const aActive = Boolean(a.is_active);
  const bActive = Boolean(b.is_active);
  if (aActive !== bActive) return aActive ? -1 : 1;

  const aNext = parseExecutionMs(a.next_execution_at);
  const bNext = parseExecutionMs(b.next_execution_at);
  const aHasNext = aNext !== null;
  const bHasNext = bNext !== null;

  if (aHasNext !== bHasNext) return aHasNext ? -1 : 1;
  if (aHasNext && bHasNext && aNext !== bNext) return aNext - bNext;

  const aName = (a.name || '').toLowerCase();
  const bName = (b.name || '').toLowerCase();
  const nameCmp = aName.localeCompare(bName);
  if (nameCmp !== 0) return nameCmp;

  return String(a.id).localeCompare(String(b.id));
};

export const sortJobsByDefaultOrder = (jobs: Job[]): Job[] => [...jobs].sort(compareJobsByDefaultOrder);

