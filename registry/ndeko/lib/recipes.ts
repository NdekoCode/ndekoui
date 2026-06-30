export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25';

export const CONTROL_RECIPE = [
  'w-full min-w-0 rounded-md border border-transparent bg-card text-base text-foreground',
  'shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12 outline-none',
  'transition-[color,box-shadow,border-color] duration-150',
  'selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground/75 md:text-[13px]',
  'dark:bg-foreground/[0.04] dark:ring-foreground/15',
  'focus-visible:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/25 dark:focus-visible:border-foreground/25 dark:focus-visible:ring-ring/25',
  'aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
  'data-invalid:border-destructive/60 data-invalid:ring-destructive/20 dark:data-invalid:ring-destructive/40',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

export const CONTROL_SIZES = {
  sm: 'h-7 px-2 text-xs md:text-xs',
  default: 'h-8 px-2.5',
  lg: 'h-9 px-3',
} as const;

export type ControlSize = keyof typeof CONTROL_SIZES;

export const POPUP_TRANSITION =
  'origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-(--ease-out-strong) data-ending-style:duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0';

export const MENU_POPUP = [
  'surface-raised max-h-(--available-height) min-w-48 overflow-y-auto rounded-xl p-1 outline-none',
  POPUP_TRANSITION,
].join(' ');

export const MENU_ITEM = [
  'relative flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-md px-2 text-[13px] text-foreground outline-none',
  'data-highlighted:bg-foreground/5 data-disabled:pointer-events-none data-disabled:opacity-50',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
].join(' ');

export const MENU_ITEM_DESTRUCTIVE =
  "text-destructive-ink data-highlighted:bg-destructive/10 [&_svg:not([class*='text-'])]:text-destructive-ink";

export const MENU_LABEL =
  'px-2 py-1.5 text-xs font-medium text-muted-foreground';

export const MENU_SEPARATOR = '-mx-1 my-1 h-(--hairline) bg-border';

export const MENU_SHORTCUT =
  'ml-auto text-xs tabular-nums tracking-normal text-muted-foreground';

export const OVERLAY_BACKDROP =
  'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0';
