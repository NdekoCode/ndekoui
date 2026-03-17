export const TASK_GRID = [
  'grid items-center gap-x-2 px-2 sm:px-4',
  'grid-cols-[1.25rem_1.75rem_minmax(0,1fr)_3.75rem]',
  '@2xl:grid-cols-[1.25rem_1.75rem_4rem_1.75rem_minmax(0,1fr)_4.25rem_4.25rem]',
  '@4xl:grid-cols-[1.25rem_1.75rem_4rem_1.75rem_minmax(0,1fr)_11rem_4.25rem_4.25rem]',
].join(' ');

export const PRIORITY_CELL = 'hidden @2xl:flex';

export const ID_CELL = 'hidden @2xl:flex';

export const LABELS_CELL = 'hidden min-w-0 @4xl:flex';

export const DUE_CELL = 'hidden @2xl:flex';

export const GUTTER_CELL = 'flex items-center justify-center';

export const DRAFT_TITLE_CELL = 'col-[3/-1] @2xl:col-[5/-1]';

export const ROW_CLASS =
  'group/row relative h-10 overflow-hidden hairline-b border-border transition-colors duration-150 hover:bg-foreground/[0.025]';

export const SELECTED_ROW = 'bg-primary/[0.06] hover:bg-primary/[0.08]';

export const TRACKED_ROW =
  'before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary';

export const BAND_FILL =
  'bg-[color-mix(in_oklab,var(--foreground)_3%,var(--background))]';

export const COUNT_CHIP =
  'inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-foreground/[0.06] px-1.5 text-xs font-medium text-muted-foreground';

export const CELL_TRIGGER =
  'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none transition-colors duration-150 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:bg-foreground/5';

export const HOVER_ONLY =
  'opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100 in-data-popup-open:opacity-100 pointer-coarse:opacity-100';
