import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';

/** A chart of one series draws it in the primary colour; with more, each one wears its own series colour. */
export function markColorOf(slot: SeriesSlot, seriesCount: number) {
  if (seriesCount === 1) {
    return 'var(--primary)';
  }
  return seriesColorOf(slot);
}
