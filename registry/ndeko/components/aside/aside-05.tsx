'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  ClockIcon,
  HashIcon,
  PencilIcon,
  UserIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import {
  AsideCloseButton,
  AsidePreview,
  AsideTitle,
} from './_parts/aside-frame';
import { rowVariantsOf } from './_parts/motion';
import { PEOPLE, type Person } from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import { Swap } from './_parts/swap';
import {
  MetaGlyph,
  STATUS_META,
  STATUS_ORDER,
  type StatusId,
} from './_parts/task-meta';

type ProjectMember = { person: Person; role: 'Manager' | 'Member' };

const SHOWN_MEMBERS = 4;

const TASK_COUNTS: Record<StatusId, number> = {
  backlog: 6,
  todo: 8,
  'in-progress': 5,
  'in-review': 2,
  done: 29,
};

const MEMBERS: ProjectMember[] = [
  { person: PEOPLE[1], role: 'Manager' },
  { person: PEOPLE[0], role: 'Manager' },
  { person: PEOPLE[2], role: 'Member' },
  { person: PEOPLE[3], role: 'Member' },
  { person: PEOPLE[4], role: 'Member' },
  { person: PEOPLE[5], role: 'Member' },
  { person: PEOPLE[6], role: 'Member' },
];

const FACTS = [
  { label: 'Created', value: 'Oct 2 by Lucas Moreau' },
  { label: 'Last change', value: 'Today at 11:40' },
  { label: 'Visibility', value: 'Members of the project' },
  { label: 'Time logged', value: '214 h of 320 h' },
];

const DISPLAY_ORDER: StatusId[] = [...STATUS_ORDER].reverse();

function taskTotal() {
  let total = 0;
  for (const status of STATUS_ORDER) {
    total += TASK_COUNTS[status];
  }
  return total;
}

function foldLabelOf(isExpanded: boolean, hiddenCount: number) {
  if (isExpanded) {
    return 'Show less';
  }
  return `Show ${hiddenCount} more`;
}

function PropertyRow({
  icon: RowIcon,
  label,
  children,
}: {
  icon: Icon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='grid min-h-8 grid-cols-[6rem_1fr] items-center gap-2 text-[13px]'>
      <span className='text-muted-foreground flex items-center gap-2'>
        <RowIcon className='size-3.5 shrink-0' />
        {label}
      </span>
      <div className='flex min-w-0 flex-wrap items-center gap-1'>
        {children}
      </div>
    </div>
  );
}

function StatusBreakdown() {
  const total = taskTotal();
  const exactShare = (TASK_COUNTS.done * 100) / total;
  const doneShare = Math.round(exactShare);

  return (
    <section aria-label='Progress' className='flex flex-col gap-3'>
      <div className='flex items-baseline gap-2'>
        <h3 className='text-sm font-medium'>Progress</h3>
        <span className='ml-auto text-sm font-medium tabular-nums'>
          {`${doneShare}% done`}
        </span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {`${TASK_COUNTS.done} of ${total} tasks`}
        </span>
      </div>
      <div aria-hidden='true' className='flex h-2.5 w-full gap-0.5'>
        {DISPLAY_ORDER.map((status) => {
          const segmentStyle = {
            flexGrow: TASK_COUNTS[status],
            backgroundColor: STATUS_META[status].color,
          };

          return (
            <span
              key={status}
              style={segmentStyle}
              className='block h-full basis-0 rounded-[3px]'
            />
          );
        })}
      </div>
      <ul className='grid grid-cols-2 gap-x-4 gap-y-1.5'>
        {DISPLAY_ORDER.map((status) => {
          const meta = STATUS_META[status];

          return (
            <li key={status} className='flex items-center gap-2 text-xs'>
              <MetaGlyph meta={meta} />
              <span className='min-w-0 flex-1 truncate'>{meta.label}</span>
              <span className='text-muted-foreground tabular-nums'>
                {TASK_COUNTS[status]}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MemberRow({ member }: { member: ProjectMember }) {
  return (
    <div className='flex h-10 items-center gap-2.5'>
      <PersonAvatar
        person={member.person}
        size='sm'
        presence={member.person.presence}
      />
      <span className='min-w-0 flex-1 truncate text-[13px]'>
        {member.person.name}
      </span>
      <span className='text-muted-foreground text-xs'>{member.role}</span>
    </div>
  );
}

function ProjectMembers() {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const firstMembers = MEMBERS.slice(0, SHOWN_MEMBERS);
  const otherMembers = MEMBERS.slice(SHOWN_MEMBERS);
  const hiddenCount = otherMembers.length;
  const canExpand = hiddenCount > 0;
  const foldLabel = foldLabelOf(isExpanded, hiddenCount);

  function toggle() {
    setIsExpanded((previous) => !previous);
  }

  return (
    <section aria-label='Members' className='flex flex-col gap-1'>
      <h3 className='flex items-baseline gap-2 text-sm font-medium'>
        Members
        <span className='text-muted-foreground text-xs font-normal tabular-nums'>
          {MEMBERS.length}
        </span>
      </h3>
      <ul className='flex flex-col'>
        {firstMembers.map((member) => (
          <li key={member.person.id}>
            <MemberRow member={member} />
          </li>
        ))}
        <AnimatePresence initial={false}>
          {isExpanded &&
            otherMembers.map((member) => (
              <motion.li
                key={member.person.id}
                variants={rowVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <MemberRow member={member} />
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>
      {canExpand && (
        <Button
          variant='ghost'
          size='sm'
          aria-expanded={isExpanded}
          onClick={toggle}
          className='text-muted-foreground -ml-2.5 self-start'
        >
          <ChevronDownIcon
            className={cn(
              'transition-transform duration-200 ease-(--ease-out-strong)',
              isExpanded && 'rotate-180'
            )}
          />
          <AnimatedSize axis='width' as='span'>
            <Swap swapKey={foldLabel} kind='label'>
              {foldLabel}
            </Swap>
          </AnimatedSize>
        </Button>
      )}
    </section>
  );
}

function ProjectDetails() {
  const statusStyle = { '--chip': 'var(--success)' } as React.CSSProperties;

  return (
    <div className='flex flex-col gap-6 p-5'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-start gap-3'>
          <MeshTile
            seed='Atlas redesign'
            color='var(--primary)'
            className='size-10 rounded-lg'
          />
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <AsideTitle>Atlas redesign</AsideTitle>
            <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <span className='tabular-nums'>ATL</span>
              <span aria-hidden='true'>·</span>
              <span
                style={statusStyle}
                className='chip-3d inline-flex h-5 items-center gap-1 rounded-md px-1.5 font-medium'
              >
                <CircleCheckIcon className='size-3' strokeWidth={2.25} />
                On track
              </span>
            </p>
          </div>
          <AsideCloseButton
            label='Close project details'
            className='-mt-1 -mr-2'
          />
        </div>
        <div className='flex gap-2'>
          <Button render={<a href='#' />} nativeButton={false} size='sm'>
            Open project
            <ArrowUpRightIcon />
          </Button>
          <Button
            variant='outline'
            size='sm'
            render={<a href='#' />}
            nativeButton={false}
          >
            <PencilIcon />
            Edit
          </Button>
        </div>
      </div>
      <div className='flex flex-col gap-0.5'>
        <PropertyRow icon={UserIcon} label='Lead'>
          <PersonAvatar person={PEOPLE[1]} size='xs' />
          {PEOPLE[1].name}
        </PropertyRow>
        <PropertyRow icon={CalendarIcon} label='Dates'>
          <span className='tabular-nums'>Oct 6</span>
          <ArrowRightIcon className='text-muted-foreground size-3' />
          <span className='tabular-nums'>Dec 12</span>
          <span className='text-muted-foreground ml-1 text-xs'>67 days</span>
        </PropertyRow>
        <PropertyRow icon={UsersIcon} label='Teams'>
          <Badge variant='secondary' className='text-muted-foreground'>
            Product
          </Badge>
          <Badge variant='secondary' className='text-muted-foreground'>
            Platform
          </Badge>
        </PropertyRow>
        <PropertyRow icon={ClockIcon} label='Budget'>
          <span className='tabular-nums'>320 h</span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            106 h left
          </span>
        </PropertyRow>
        <PropertyRow icon={HashIcon} label='Labels'>
          <Badge variant='secondary' className='text-muted-foreground'>
            Design system
          </Badge>
          <Badge variant='secondary' className='text-muted-foreground'>
            Q4
          </Badge>
        </PropertyRow>
      </div>
      <p className='bg-foreground/[0.03] rounded-xl px-3.5 py-3 text-[13px] leading-5'>
        Move every screen of the web app to the new components, starting with
        the timesheet and the task board.
      </p>
      <StatusBreakdown />
      <ProjectMembers />
      <dl className='flex flex-col gap-2.5'>
        {FACTS.map((fact) => (
          <div key={fact.label} className='flex items-baseline gap-3 text-xs'>
            <dt className='text-muted-foreground w-24 shrink-0'>
              {fact.label}
            </dt>
            <dd className='tabular-nums'>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Aside05() {
  return (
    <AsidePreview triggerLabel='Open project details'>
      <ProjectDetails />
    </AsidePreview>
  );
}
