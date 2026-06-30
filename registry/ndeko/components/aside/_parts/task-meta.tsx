import {
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  EclipseIcon,
  EyeIcon,
  MinusIcon,
  TriangleAlertIcon,
  ZapIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

export type Meta = { label: string; color: string; icon: Icon };

export type StatusId =
  'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';

export type PriorityId = 'urgent' | 'high' | 'medium' | 'low';

export type IssueType = 'task' | 'bug' | 'story' | 'epic';

export const STATUS_ORDER: StatusId[] = [
  'backlog',
  'todo',
  'in-progress',
  'in-review',
  'done',
];

export const STATUS_META: Record<StatusId, Meta> = {
  backlog: {
    label: 'Backlog',
    color: 'var(--muted-foreground)',
    icon: CircleDashedIcon,
  },
  todo: { label: 'Todo', color: 'var(--info)', icon: CircleIcon },
  'in-progress': {
    label: 'In progress',
    color: 'var(--warning)',
    icon: EclipseIcon,
  },
  'in-review': { label: 'In review', color: 'var(--primary)', icon: EyeIcon },
  done: { label: 'Done', color: 'var(--success)', icon: CircleCheckIcon },
};

export const PRIORITY_ORDER: PriorityId[] = ['urgent', 'high', 'medium', 'low'];

export const PRIORITY_META: Record<PriorityId, Meta> = {
  urgent: {
    label: 'Urgent',
    color: 'var(--destructive)',
    icon: TriangleAlertIcon,
  },
  high: { label: 'High', color: 'var(--warning)', icon: ChevronUpIcon },
  medium: { label: 'Medium', color: 'var(--info)', icon: MinusIcon },
  low: {
    label: 'Low',
    color: 'var(--muted-foreground)',
    icon: ChevronDownIcon,
  },
};

export const ISSUE_TYPE_META: Record<IssueType, Meta> = {
  task: { label: 'Task', color: 'var(--info)', icon: CheckIcon },
  bug: { label: 'Bug', color: 'var(--destructive)', icon: CircleAlertIcon },
  story: { label: 'Story', color: 'var(--success)', icon: BookmarkIcon },
  epic: { label: 'Epic', color: 'var(--primary)', icon: ZapIcon },
};

export function isStatusId(value: unknown): value is StatusId {
  return STATUS_ORDER.some((status) => status === value);
}

export function IssueTypeGem({
  type,
  className,
}: {
  type: IssueType;
  className?: string;
}) {
  const meta = ISSUE_TYPE_META[type];
  const TypeGlyph = meta.icon;
  const gemStyle = { '--gem': meta.color } as React.CSSProperties;

  return (
    <span
      style={gemStyle}
      className={cn(
        'gem-plate inline-flex size-4 shrink-0 items-center justify-center rounded-[4px]',
        className
      )}
    >
      <TypeGlyph className='size-2.5' strokeWidth={2.75} />
      <span className='sr-only'>{meta.label}</span>
    </span>
  );
}

export function MetaGlyph({
  meta,
  className,
}: {
  meta: Meta;
  className?: string;
}) {
  const Glyph = meta.icon;
  const glyphStyle = { color: meta.color } as React.CSSProperties;

  return (
    <Glyph
      style={glyphStyle}
      strokeWidth={2.25}
      className={cn('size-3.5 shrink-0', className)}
    />
  );
}
