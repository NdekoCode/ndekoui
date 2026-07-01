import { memo } from 'react';

import { ClockIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  ISSUE_TYPES,
  LABELS,
  PEOPLE,
  PRIORITIES,
  type IssueType,
  type Person,
  type Task,
} from './data';

const VISIBLE_LABELS = 2;

const VISIBLE_ASSIGNEES = 3;

export const CARD_SURFACE =
  'bg-card hairline-ring ring-border rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

export const TRACKED_CARD = 'ring-primary/45';

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const paddedRest = String(rest).padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
}

function personOf(personId: string): Person | undefined {
  return PEOPLE.find((person) => person.id === personId);
}

function isPerson(value: Person | undefined): value is Person {
  return value !== undefined;
}

function progressOf(task: Task) {
  if (task.estimateMinutes === 0) {
    return 0;
  }
  const ratio = task.workedMinutes / task.estimateMinutes;
  return Math.min(100, Math.round(ratio * 100));
}

export function IssueTypeGem({ type }: { type: IssueType }) {
  const meta = ISSUE_TYPES[type];
  const TypeGlyph = meta.icon;
  const gemStyle = { '--gem': meta.color } as React.CSSProperties;

  return (
    <span
      style={gemStyle}
      className='gem-plate inline-flex size-4 shrink-0 items-center justify-center rounded-[4px]'
    >
      <TypeGlyph className='size-2.5' strokeWidth={2.75} />
      <span className='sr-only'>{meta.label}</span>
    </span>
  );
}

function AssigneeStack({ assigneeIds }: { assigneeIds: string[] }) {
  const people = assigneeIds.map(personOf).filter(isPerson);
  const shown = people.slice(0, VISIBLE_ASSIGNEES);
  const hiddenCount = people.length - shown.length;
  const hasHidden = hiddenCount > 0;
  const isUnassigned = people.length === 0;

  if (isUnassigned) {
    return <span className='text-muted-foreground text-xs'>Unassigned</span>;
  }

  return (
    <span className='flex items-center'>
      {shown.map((person) => (
        <Avatar
          key={person.id}
          className='ring-card -ml-1 size-5 text-[9px] ring-2 first:ml-0'
        >
          {person.avatar && <AvatarImage src={person.avatar} alt='' />}
          <AvatarFallback>{person.initials}</AvatarFallback>
        </Avatar>
      ))}
      {hasHidden && (
        <span className='bg-muted text-muted-foreground ring-card -ml-1 inline-flex size-5 items-center justify-center rounded-full text-[9px] font-medium ring-2'>
          +{hiddenCount}
        </span>
      )}
      <span className='sr-only'>
        {`Assigned to ${people.map((person) => person.name).join(', ')}`}
      </span>
    </span>
  );
}

type TaskCardBodyProps = {
  task: Task;
};

/** The content of a card. Memoised, so a drag re-renders only the thin sortable wrapper around it. */
export const TaskCardBody = memo(function TaskCardBody({
  task,
}: TaskCardBodyProps) {
  const priority = PRIORITIES[task.priority];
  const shownLabels = task.labels.slice(0, VISIBLE_LABELS);
  const hiddenLabelCount = task.labels.length - shownLabels.length;
  const hasHiddenLabels = hiddenLabelCount > 0;
  const hasEstimate = task.estimateMinutes > 0;
  const progress = progressOf(task);
  const progressStyle = { width: `${progress}%` } as React.CSSProperties;

  return (
    <div className='flex flex-col gap-2.5 p-3'>
      <div className='flex flex-wrap items-center gap-1'>
        <Chip color={priority.color}>{priority.label}</Chip>
        {task.size && (
          <Badge variant='secondary' className='text-muted-foreground'>
            {`Size ${task.size}`}
          </Badge>
        )}
        {shownLabels.map((labelId) => {
          const label = LABELS[labelId];
          return (
            <Chip key={labelId} color={label.color}>
              {label.label}
            </Chip>
          );
        })}
        {hasHiddenLabels && (
          <Badge
            variant='secondary'
            className='text-muted-foreground tabular-nums'
          >
            {`+${hiddenLabelCount}`}
          </Badge>
        )}
      </div>
      <div className='flex flex-col gap-1'>
        <span className='text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums'>
          <IssueTypeGem type={task.type} />
          {task.number}
        </span>
        <p className='line-clamp-2 text-[13px] leading-snug font-medium text-balance'>
          {task.title}
        </p>
      </div>
      {hasEstimate && (
        <div
          role='meter'
          aria-label={`${formatDuration(task.workedMinutes)} of ${formatDuration(task.estimateMinutes)} estimated`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className='bg-foreground/[0.06] h-1 overflow-hidden rounded-full'
        >
          <span
            style={progressStyle}
            className='bg-primary block h-full rounded-full'
          />
        </div>
      )}
      <div className='hairline-t border-border flex items-center justify-between gap-2 border-dashed pt-2.5'>
        <AssigneeStack assigneeIds={task.assigneeIds} />
        <span
          className={cn(
            'text-muted-foreground flex items-center gap-1.5 text-xs font-medium tabular-nums',
            task.isTracked && 'text-primary-ink'
          )}
        >
          {task.isTracked && (
            <span className='bg-primary size-1.5 rounded-full'>
              <span className='sr-only'>Timer running,</span>
            </span>
          )}
          {!task.isTracked && <ClockIcon className='size-3.5' />}
          {formatDuration(task.workedMinutes)}
        </span>
      </div>
    </div>
  );
});
