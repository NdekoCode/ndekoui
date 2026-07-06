import { percentOf } from './scale';

type TodayMarkProps = {
  /** From 0 at the left edge of the plot to 1 at its right edge. */
  ratio: number;
  /** Pixels from the top of the plot down to the value today. */
  top: number;
};

/** Where what happened ends and what might happen starts: a hairline, its word, and the value both leave from. */
export function TodayMark({ ratio, top }: TodayMarkProps) {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-y-0 w-0'
      style={{ left: percentOf(ratio) }}
    >
      <span className='hairline-l border-foreground/25 absolute inset-y-0 left-0' />
      <span className='text-muted-foreground absolute top-0 right-1.5 text-[11px] whitespace-nowrap'>
        Today
      </span>
      <span
        className='bg-primary ring-card absolute left-0 size-2 -translate-1/2 rounded-full ring-2'
        style={{ top }}
      />
    </div>
  );
}
