import { ProgressiveBlur } from '@/components/core/progressive-blur';

const RELEASES = [
  { version: '2.14', change: 'Pinned views in the sidebar' },
  { version: '2.13', change: 'Faster search across projects' },
  { version: '2.12', change: 'Bulk edit for due dates' },
  { version: '2.11', change: 'Comments on single cells' },
  { version: '2.10', change: 'Calendar sync every five minutes' },
  { version: '2.9', change: 'Keyboard shortcuts for labels' },
  { version: '2.8', change: 'Archived projects stay searchable' },
  { version: '2.7', change: 'Exports keep your filters' },
  { version: '2.6', change: 'Weekly digest by email' },
  { version: '2.5', change: 'Mentions in task descriptions' },
  { version: '2.4', change: 'Smaller downloads on mobile' },
  { version: '2.3', change: 'Dark theme for printed reports' },
];

const TOP_LEVELS = [0.5, 1, 2, 4];

const BOTTOM_LEVELS = [0.5, 1, 2, 4, 8, 16];

export function ProgressiveBlurScroll() {
  return (
    <div className='bg-card hairline-ring ring-border relative h-[300px] w-full max-w-xs overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <ul
        tabIndex={0}
        aria-label='Change log'
        className='focus-visible:ring-ring/25 h-full overflow-y-auto rounded-xl px-4 pt-10 pb-20 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        {RELEASES.map((release) => (
          <li
            key={release.version}
            className='flex items-baseline gap-3 py-2 text-[13px]'
          >
            <span className='text-muted-foreground w-9 shrink-0 font-mono text-xs tabular-nums'>
              {release.version}
            </span>
            <span className='text-foreground'>{release.change}</span>
          </li>
        ))}
      </ul>
      <ProgressiveBlur
        direction='top'
        blurLevels={TOP_LEVELS}
        className='pointer-events-none absolute inset-x-0 top-0 h-10'
      />
      <ProgressiveBlur
        direction='bottom'
        blurLevels={BOTTOM_LEVELS}
        className='pointer-events-none absolute inset-x-0 bottom-0 h-20'
      />
    </div>
  );
}
