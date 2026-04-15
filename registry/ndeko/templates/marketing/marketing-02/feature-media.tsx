import { FileSpreadsheetIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import {
  ARCHIVE,
  ARCHIVED_ISSUES,
  ISSUE,
  ISSUE_QUEUE,
  type MediaId,
  SUBSCRIBER_IMPORT,
  SUBSCRIBERS,
} from './data';

const SURFACE =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]';

function ScheduleMedia() {
  return (
    <div className={cn(SURFACE, 'flex w-full max-w-sm flex-col gap-1 p-2')}>
      <p className='text-muted-foreground px-2.5 pt-2 pb-1 text-xs font-medium'>
        {ISSUE.publication}
      </p>
      <ol className='flex flex-col gap-1'>
        {ISSUE_QUEUE.map((issue) => (
          <li key={issue.number} className='flex items-center gap-3 p-2.5'>
            <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
              <issue.icon />
            </span>
            <div className='flex min-w-0 flex-1 flex-col'>
              <p className='truncate text-[13px] font-medium'>
                {issue.subject}
              </p>
              <p className='text-muted-foreground text-xs tabular-nums'>
                {issue.number}, {issue.when}
              </p>
            </div>
            <Chip color={issue.color}>{issue.status}</Chip>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SubscribersMedia() {
  return (
    <div className='relative w-full max-w-sm pt-10 sm:pt-0'>
      <div className={cn(SURFACE, 'flex flex-col gap-1 p-2')}>
        <p className='text-muted-foreground flex items-center gap-2 px-2.5 pt-2 pb-1 text-xs font-medium'>
          <FileSpreadsheetIcon className='size-3.5' />
          {SUBSCRIBER_IMPORT.file}
        </p>
        <ul className='flex flex-col gap-1'>
          {SUBSCRIBERS.map((subscriber) => (
            <li
              key={subscriber.name}
              className='flex items-center justify-between gap-3 p-2.5'
            >
              <div className='flex min-w-0 flex-col'>
                <p className='truncate text-[13px] font-medium'>
                  {subscriber.name}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {subscriber.since}
                </p>
              </div>
              <Chip color={subscriber.color}>{subscriber.status}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <div className='surface-raised absolute -top-2 right-0 flex items-center gap-2.5 rounded-xl py-2 ps-2 pe-3.5 sm:-top-6 sm:-right-4'>
        <StatusOrb tone='success' size='sm' className='[&>span]:animate-none' />
        <p className='text-[13px] font-medium'>{SUBSCRIBER_IMPORT.notice}</p>
      </div>
    </div>
  );
}

function ArchiveMedia() {
  return (
    <div className={cn(SURFACE, 'flex w-full max-w-sm flex-col gap-1 p-2')}>
      <div className='flex items-center justify-between gap-3 px-2.5 pt-2 pb-1'>
        <p className='text-muted-foreground text-xs font-medium'>
          {ARCHIVE.title}
        </p>
        <Chip color='var(--success)'>{ARCHIVE.visibility}</Chip>
      </div>
      <ul className='flex flex-col gap-1'>
        {ARCHIVED_ISSUES.map((issue) => (
          <li key={issue.number} className='flex items-center gap-3 p-2.5'>
            <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
              <issue.icon />
            </span>
            <div className='flex min-w-0 flex-1 flex-col'>
              <p className='truncate text-[13px] font-medium'>
                {issue.subject}
              </p>
              <p className='text-muted-foreground text-xs tabular-nums'>
                {issue.number}
              </p>
            </div>
            <Chip color={issue.color}>{issue.access}</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}

const MEDIA_BY_ID: Record<MediaId, () => React.ReactNode> = {
  schedule: ScheduleMedia,
  subscribers: SubscribersMedia,
  archive: ArchiveMedia,
};

export function FeatureMedia({ id }: { id: MediaId }) {
  const Media = MEDIA_BY_ID[id];

  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.025] flex min-h-72 items-center justify-center rounded-2xl p-4 sm:p-10'
    >
      <Media />
    </div>
  );
}
