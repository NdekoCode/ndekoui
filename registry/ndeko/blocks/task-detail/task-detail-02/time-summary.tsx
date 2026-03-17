import { cn } from '@/registry/ndeko/lib/utils';

import type { TaskDetail } from './data';
import { durationLabel, personOf, workedMinutesOf } from './detail-model';
import { PersonAvatar } from './task-glyphs';

function limitShareOf(worked: number, estimate: number) {
  if (estimate <= 0) {
    return 0;
  }
  return Math.min(worked / estimate, 1);
}

function verdictOf(worked: number, estimate: number | undefined) {
  if (estimate === undefined) {
    return 'Add an estimate to compare the time spent';
  }
  const left = estimate - worked;
  if (left >= 0) {
    return `${durationLabel(left)} left`;
  }
  return `${durationLabel(-left)} over the estimate`;
}

function scaleStyleOf(share: number) {
  return { transform: `scaleX(${share})` } as React.CSSProperties;
}

export function TimeSummary({ task }: { task: TaskDetail }) {
  const worked = workedMinutesOf(task);
  const estimate = task.estimateMinutes;
  const hasEstimate = estimate !== undefined;
  const hasWorked = worked > 0;
  const isOver = hasEstimate && worked > estimate;

  if (!hasWorked) {
    return (
      <p className='text-muted-foreground py-1 text-[13px]'>
        No time tracked on this task yet
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-3 py-1'>
      <div className='flex flex-col gap-1.5'>
        <p className='text-[13px]'>
          <span className='font-medium tabular-nums'>
            {durationLabel(worked)}
          </span>
          {hasEstimate && (
            <span className='text-muted-foreground'>
              {' '}
              of <span className='tabular-nums'>
                {durationLabel(estimate)}
              </span>{' '}
              estimated
            </span>
          )}
        </p>
        {hasEstimate && (
          <span className='bg-foreground/10 relative h-1.5 overflow-hidden rounded-full'>
            <span
              style={scaleStyleOf(limitShareOf(worked, estimate))}
              className={cn(
                'absolute inset-0 origin-left rounded-full transition-transform duration-300 ease-(--ease-out-strong)',
                isOver && 'bg-destructive',
                !isOver && 'bg-primary'
              )}
            />
          </span>
        )}
        <p
          className={cn(
            'text-xs',
            isOver && 'text-destructive-ink',
            !isOver && 'text-muted-foreground'
          )}
        >
          {verdictOf(worked, estimate)}
        </p>
      </div>
      <ul className='flex flex-col gap-2'>
        {task.worked.map((entry) => {
          const person = personOf(entry.personId);
          const share = entry.minutes / worked;
          return (
            <li key={entry.personId} className='flex items-center gap-2'>
              <PersonAvatar person={person} />
              <span className='min-w-0 flex-1 truncate text-[13px]'>
                {person.name}
              </span>
              <span className='bg-foreground/10 relative h-1 w-12 overflow-hidden rounded-full'>
                <span
                  style={scaleStyleOf(share)}
                  className='bg-primary/70 absolute inset-0 origin-left rounded-full'
                />
              </span>
              <span className='text-muted-foreground w-14 text-right text-xs tabular-nums'>
                {durationLabel(entry.minutes)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
