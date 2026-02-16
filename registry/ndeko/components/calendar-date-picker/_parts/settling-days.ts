/**
 * The react-aria calendar cells cannot take classes from outside, so the press that lets a picked
 * day settle in is applied from the calendar root.
 */
export const SETTLING_DAYS =
  '[&_td>div]:transition-[color,background-color,border-radius,box-shadow,scale] [&_td>div]:ease-(--ease-out-strong) [&_td>[data-pressed]]:scale-90';
