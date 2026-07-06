export const SECTION = {
  label: 'Before and after',
  caption:
    'Most of a support week went to busywork: copying figures, chasing replies, filing the same note twice. Now an agent drafts it, and the week goes to judgment.',
  note: 'Illustrative split of one team week',
};

export const BLOCK_COUNT = 25;

export const BLOCK_SHARE = 100 / BLOCK_COUNT;

export const BUSYWORK_BEFORE = 18;

export const BUSYWORK_AFTER = 5;

export const FLIP_COUNT = BUSYWORK_BEFORE - BUSYWORK_AFTER;

/** The blocks flip from the edge of the judgment side toward the left, one after another. */
export function flipRankOf(blockIndex: number) {
  const isBeforeBusywork = blockIndex < BUSYWORK_BEFORE;
  const isKept = blockIndex < BUSYWORK_AFTER;
  if (!isBeforeBusywork || isKept) {
    return null;
  }
  return BUSYWORK_BEFORE - 1 - blockIndex;
}

export const BLOCKS = Array.from({ length: BLOCK_COUNT }, (_, index) => index);

export const CAPTION_WORDS = SECTION.caption.split(' ');

/** The words light during the first part of the story, the blocks flip during the rest. */
export const WORDS_END = 0.55;

export const FLIPS_START = 0.3;
