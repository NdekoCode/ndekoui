import { format, parseISO } from 'date-fns';

import { Chip } from '@/registry/ndeko/ui/chip';

import { type Release, TAG_STYLES } from './data';

const DATE_PATTERN = 'd MMM yyyy';

function readableDateOf(isoDate: string) {
  const parsed = parseISO(isoDate);
  return format(parsed, DATE_PATTERN);
}

export function releaseAnchorOf(version: string) {
  return `marketing-04-release-${version}`;
}

export function ReleaseEntry({ release }: { release: Release }) {
  const readableDate = readableDateOf(release.date);
  const anchor = releaseAnchorOf(release.version);

  return (
    <article
      id={anchor}
      tabIndex={-1}
      aria-labelledby={`${anchor}-title`}
      className='focus-visible:ring-ring/25 grid gap-3 rounded-lg outline-none focus-visible:ring-[3px] md:grid-cols-[10rem_minmax(0,1fr)] md:gap-8'
    >
      <div className='flex items-baseline gap-3 md:flex-col md:gap-1'>
        <time dateTime={release.date} className='text-[13px] font-medium'>
          {readableDate}
        </time>
        <span className='text-muted-foreground text-xs tabular-nums'>
          Version {release.version}
        </span>
      </div>
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-2'>
          <h2
            id={`${anchor}-title`}
            className='text-lg font-semibold text-balance'
          >
            {release.title}
          </h2>
          <ul aria-label='Kind of change' className='flex flex-wrap gap-1.5'>
            {release.tags.map((tag) => {
              const tagStyle = TAG_STYLES[tag];

              return (
                <li key={tag}>
                  <Chip color={tagStyle.color}>{tagStyle.label}</Chip>
                </li>
              );
            })}
          </ul>
        </div>
        <p className='text-muted-foreground max-w-2xl text-sm leading-relaxed text-pretty'>
          {release.summary}
        </p>
        <ul className='flex flex-col gap-1.5 text-[13px]'>
          {release.changes.map((change) => (
            <li key={change} className='flex items-baseline gap-2.5'>
              <span
                aria-hidden='true'
                className='bg-foreground/25 size-1 shrink-0 translate-y-[-0.2em] rounded-full'
              />
              {change}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
