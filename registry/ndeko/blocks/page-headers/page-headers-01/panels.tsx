import {
  CheckIcon,
  CircleDashedIcon,
  CircleIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  LayersIcon,
  LoaderCircleIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Chip } from '@/registry/ndeko/ui/chip';

import {
  ACTIVITY,
  FILES,
  MEMBERS,
  MILESTONES,
  PROJECT,
  TASKS,
  type ActivityItem,
  type MilestoneState,
  type ProjectFile,
  type TaskState,
} from './data';

const SECTION_TITLE = 'text-[13px] font-medium';

const SURFACE =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const MILESTONE_GLYPH: Record<MilestoneState, React.ReactNode> = {
  done: <CheckIcon className='text-success-foreground size-3.5' />,
  current: <span className='bg-primary size-2 rounded-full' />,
  upcoming: <CircleDashedIcon className='text-muted-foreground size-3.5' />,
};

const MILESTONE_TRAY: Record<MilestoneState, string> = {
  done: 'bg-success/10',
  current: 'bg-primary/10',
  upcoming: 'bg-foreground/[0.05]',
};

const TASK_LABEL: Record<TaskState, string> = {
  todo: 'To do',
  doing: 'In progress',
  done: 'Done',
};

const TASK_COLOR: Record<TaskState, string> = {
  todo: 'var(--muted-foreground)',
  doing: 'var(--info)',
  done: 'var(--success)',
};

const TASK_GLYPH: Record<TaskState, Icon> = {
  todo: CircleIcon,
  doing: LoaderCircleIcon,
  done: CheckIcon,
};

const FILE_GLYPH: Record<ProjectFile['kind'], Icon> = {
  drawing: LayersIcon,
  sheet: FileSpreadsheetIcon,
  document: FileTextIcon,
};

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className='flex items-start gap-3 px-3 py-2.5'>
      <Avatar seed={item.person} className='size-6' />
      <p className='min-w-0 flex-1 text-[13px] text-pretty'>
        <span className='font-medium'>{item.person}</span>{' '}
        <span className='text-muted-foreground'>{item.action}</span>{' '}
        {item.target}
      </p>
      <span className='text-muted-foreground shrink-0 text-xs'>
        {item.when}
      </span>
    </li>
  );
}

export function OverviewPanel() {
  const recent = ACTIVITY.slice(0, 4);

  return (
    <div className='flex flex-col gap-8'>
      <section className='flex flex-col gap-2'>
        <h2 className={SECTION_TITLE}>About this project</h2>
        <p className='text-muted-foreground max-w-2xl text-sm leading-relaxed text-pretty'>
          {PROJECT.summary}
        </p>
      </section>

      <section className='flex flex-col gap-2'>
        <h2 className={SECTION_TITLE}>Milestones</h2>
        <ol className={cn(SURFACE, 'flex flex-col p-1')}>
          {MILESTONES.map((milestone) => (
            <li
              key={milestone.id}
              className='flex items-center gap-3 rounded-lg px-3 py-2.5'
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  MILESTONE_TRAY[milestone.state]
                )}
              >
                {MILESTONE_GLYPH[milestone.state]}
              </span>
              <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
                {milestone.title}
              </span>
              <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                {milestone.date}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className='flex flex-col gap-2'>
        <h2 className={SECTION_TITLE}>Recent activity</h2>
        <ul className={cn(SURFACE, 'flex flex-col p-1')}>
          {recent.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      </section>

      <section className='flex flex-col gap-2'>
        <h2 className={SECTION_TITLE}>Team</h2>
        <ul className='grid gap-2 @md:grid-cols-2 @3xl:grid-cols-3'>
          {MEMBERS.map((member) => (
            <li
              key={member.name}
              className='bg-foreground/[0.025] flex items-center gap-2.5 rounded-xl px-3 py-2'
            >
              <Avatar seed={member.name} className='size-6' />
              <span className='truncate text-[13px]'>{member.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function TasksPanel() {
  return (
    <section className='flex flex-col gap-2'>
      <p className='text-muted-foreground text-xs tabular-nums'>
        Showing {TASKS.length} of {PROJECT.tasksTotal} tasks, open ones first
      </p>
      <ul className={cn(SURFACE, 'flex flex-col p-1')}>
        {TASKS.map((task) => {
          const Glyph = TASK_GLYPH[task.state];
          return (
            <li
              key={task.id}
              className='flex items-center gap-3 rounded-lg px-3 py-2.5'
            >
              <Glyph className='text-muted-foreground size-4 shrink-0' />
              <span className='min-w-0 flex-1 truncate text-[13px]'>
                {task.title}
              </span>
              <Chip color={TASK_COLOR[task.state]} className='@max-md:sr-only'>
                {TASK_LABEL[task.state]}
              </Chip>
              <span className='text-muted-foreground hidden w-12 shrink-0 text-end text-xs tabular-nums @sm:inline'>
                {task.due}
              </span>
              <Avatar
                seed={task.owner}
                role='img'
                aria-label={task.owner}
                className='size-5'
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FilesPanel() {
  return (
    <ul className={cn(SURFACE, 'flex flex-col p-1')}>
      {FILES.map((file) => {
        const Glyph = FILE_GLYPH[file.kind];
        return (
          <li
            key={file.id}
            className='flex items-center gap-3 rounded-lg px-3 py-2.5'
          >
            <span className='keycap-3d flex size-7 shrink-0 items-center justify-center rounded-md'>
              <Glyph className='text-muted-foreground size-3.5' />
            </span>
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-[13px] font-medium'>
                {file.name}
              </span>
              <span className='text-muted-foreground truncate text-xs'>
                {file.updatedBy}, {file.updated}
              </span>
            </div>
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {file.size}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ActivityPanel() {
  return (
    <ul className={cn(SURFACE, 'flex flex-col p-1')}>
      {ACTIVITY.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
