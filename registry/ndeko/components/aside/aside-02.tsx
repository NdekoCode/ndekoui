'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowUpRightIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Badge, type BadgeProps } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import {
  AsideCloseButton,
  AsideDescription,
  AsidePreview,
  AsideTitle,
} from './_parts/aside-frame';
import { CopyIconButton } from './_parts/copy-icon-button';
import { travelOf } from './_parts/motion';
import { PEOPLE } from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import { IssueTypeGem, STATUS_META } from './_parts/task-meta';

type Day = 'today' | 'yesterday';

type ProjectTime = { id: string; name: string; color: string; minutes: number };

type Note = {
  id: string;
  authorId: string;
  isPrivate: boolean;
  date: string;
  text: string;
};

type MemberFile = { id: string; name: string; size: string; icon: Icon };

const MEMBER = PEOPLE[2];

const PROJECT_COLORS = {
  atlas: 'var(--primary)',
  billing: 'var(--info)',
  support: 'var(--warning)',
  reviews: 'var(--success)',
};

const TIME_BY_DAY: Record<Day, ProjectTime[]> = {
  today: [
    {
      id: 'atlas',
      name: 'Atlas redesign',
      color: PROJECT_COLORS.atlas,
      minutes: 150,
    },
    {
      id: 'billing',
      name: 'Billing API',
      color: PROJECT_COLORS.billing,
      minutes: 95,
    },
    {
      id: 'support',
      name: 'Support',
      color: PROJECT_COLORS.support,
      minutes: 40,
    },
    {
      id: 'reviews',
      name: 'Code reviews',
      color: PROJECT_COLORS.reviews,
      minutes: 25,
    },
  ],
  yesterday: [
    {
      id: 'atlas',
      name: 'Atlas redesign',
      color: PROJECT_COLORS.atlas,
      minutes: 75,
    },
    {
      id: 'billing',
      name: 'Billing API',
      color: PROJECT_COLORS.billing,
      minutes: 230,
    },
    {
      id: 'support',
      name: 'Support',
      color: PROJECT_COLORS.support,
      minutes: 60,
    },
    {
      id: 'reviews',
      name: 'Code reviews',
      color: PROJECT_COLORS.reviews,
      minutes: 45,
    },
  ],
};

const NOTES: Note[] = [
  {
    id: 'note-1',
    authorId: 'lucas',
    isPrivate: true,
    date: 'Oct 28',
    text: 'Wants to lead the accessibility review next quarter.',
  },
  {
    id: 'note-2',
    authorId: 'hana',
    isPrivate: false,
    date: 'Oct 14',
    text: 'Owns the date picker and the chart components.',
  },
];

const FILES: MemberFile[] = [
  {
    id: 'file-1',
    name: 'Onboarding plan.pdf',
    size: '1.4 MB',
    icon: FileTextIcon,
  },
  {
    id: 'file-2',
    name: 'Time off 2026.csv',
    size: '12 KB',
    icon: FileSpreadsheetIcon,
  },
];

function isDay(value: string | undefined): value is Day {
  const isToday = value === 'today';
  const isYesterday = value === 'yesterday';
  return isToday || isYesterday;
}

function durationOf(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const paddedRest = String(rest).padStart(2, '0');
  return `${hours}h ${paddedRest}m`;
}

function percentText(value: number) {
  return `${value}%`;
}

function totalOf(projects: ProjectTime[]) {
  let total = 0;
  for (const project of projects) {
    total += project.minutes;
  }
  return total;
}

function shareOf(minutes: number, total: number) {
  const share = (minutes * 100) / total;
  return Math.round(share);
}

type NoteBadge = {
  label: string;
  variant: BadgeProps['variant'];
  className?: string;
};

function noteBadgeOf(isPrivate: boolean): NoteBadge {
  if (isPrivate) {
    return {
      label: 'Private',
      variant: 'secondary',
      className: 'text-muted-foreground',
    };
  }
  return { label: 'Team', variant: 'info' };
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='grid min-h-8 grid-cols-[5.5rem_1fr] items-center gap-2 text-[13px]'>
      <span className='text-muted-foreground'>{label}</span>
      <div className='flex min-w-0 items-center gap-1'>{children}</div>
    </div>
  );
}

function DayTime() {
  const [day, setDay] = useState<Day>('today');
  const shouldReduceMotion = usePrefersReducedMotion();
  const transition = travelOf(shouldReduceMotion);
  const projects = TIME_BY_DAY[day];
  const total = totalOf(projects);

  function changeDay(values: string[]) {
    const [nextDay] = values;
    if (isDay(nextDay)) {
      setDay(nextDay);
    }
  }

  return (
    <section aria-label='Time by project' className='flex flex-col gap-3'>
      <div className='flex items-center gap-2'>
        <h3 className='text-sm font-medium'>Time</h3>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {durationOf(total)}
        </span>
        <ToggleGroup
          value={[day]}
          onValueChange={changeDay}
          travel
          size='sm'
          aria-label='Day'
          className='bg-foreground/[0.05] ml-auto rounded-lg p-0.5'
          indicatorClassName='bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09]'
        >
          <ToggleGroupItem value='today' className='h-6 px-2 text-xs'>
            Today
          </ToggleGroupItem>
          <ToggleGroupItem value='yesterday' className='h-6 px-2 text-xs'>
            Yesterday
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div aria-hidden='true' className='flex h-2.5 w-full gap-0.5'>
        {projects.map((project) => {
          const segmentStyle = {
            flexGrow: project.minutes,
            backgroundColor: project.color,
            borderRadius: 3,
          };

          return (
            <motion.span
              key={project.id}
              layout
              transition={transition}
              style={segmentStyle}
              className='block h-full basis-0'
            />
          );
        })}
      </div>
      <ul className='flex flex-col gap-1.5'>
        {projects.map((project) => {
          const swatchStyle = { backgroundColor: project.color };
          const share = shareOf(project.minutes, total);

          return (
            <li key={project.id} className='flex items-center gap-2 text-xs'>
              <span
                aria-hidden='true'
                style={swatchStyle}
                className='size-2 shrink-0 rounded-[3px]'
              />
              <span className='min-w-0 flex-1 truncate'>{project.name}</span>
              <span className='text-muted-foreground tabular-nums'>
                {durationOf(project.minutes)}
              </span>
              <span className='w-9 text-right font-medium tabular-nums'>
                {percentText(share)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MemberProfile() {
  const status = STATUS_META['in-review'];
  const statusStyle = { '--chip': status.color } as React.CSSProperties;
  const StatusGlyph = status.icon;

  return (
    <div className='flex flex-col gap-6 p-5'>
      <div className='flex items-start gap-3'>
        <PersonAvatar person={MEMBER} size='lg' presence={MEMBER.presence} />
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <AsideTitle>{MEMBER.name}</AsideTitle>
          <AsideDescription className='flex items-center gap-1.5'>
            {MEMBER.title}
            <Chip color='var(--success)'>Manager</Chip>
          </AsideDescription>
        </div>
        <AsideCloseButton label='Close profile' className='-mt-1 -mr-2' />
      </div>
      <div className='flex flex-col gap-0.5'>
        <DetailRow label='E-mail'>
          <span className='truncate'>{MEMBER.email}</span>
          <CopyIconButton
            text={MEMBER.email}
            label={`Copy ${MEMBER.email}`}
            announcement='E-mail address copied'
          />
        </DetailRow>
        <DetailRow label='Local time'>
          <span className='tabular-nums'>16:20</span>
          <span className='text-muted-foreground text-xs'>
            UTC+1, 1 h ahead of you
          </span>
        </DetailRow>
        <DetailRow label='Teams'>
          <Badge variant='secondary' className='text-muted-foreground'>
            Product
          </Badge>
          <Badge variant='secondary' className='text-muted-foreground'>
            Platform
          </Badge>
        </DetailRow>
      </div>
      <DayTime />
      <section aria-label='Current task' className='flex flex-col gap-2'>
        <h3 className='text-sm font-medium'>Working on</h3>
        <div className='bg-foreground/[0.03] flex flex-col gap-1.5 rounded-xl px-3.5 py-3'>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <IssueTypeGem type='story' />
            <span className='tabular-nums'>LAT-136</span>
            <span
              style={statusStyle}
              className='chip-3d ml-auto inline-flex h-5 items-center gap-1 rounded-md px-1.5 font-medium'
            >
              <StatusGlyph className='size-3' strokeWidth={2.25} />
              {status.label}
            </span>
          </p>
          <p className='text-[13px] font-medium'>
            Chart the hours of the week as day bars
          </p>
          <p className='text-muted-foreground text-xs tabular-nums'>
            1h 20m today, 3h 30m in total
          </p>
        </div>
      </section>
      <section aria-label='Notes' className='flex flex-col gap-3'>
        <h3 className='text-sm font-medium'>Notes</h3>
        <ul className='flex flex-col gap-3'>
          {NOTES.map((note) => {
            const author = PEOPLE.find((person) => person.id === note.authorId);
            const badge = noteBadgeOf(note.isPrivate);

            return (
              <li key={note.id} className='flex flex-col gap-1'>
                <p className='flex items-center gap-1.5 text-xs'>
                  <span className='font-medium'>{author?.name}</span>
                  <Badge variant={badge.variant} className={badge.className}>
                    {badge.label}
                  </Badge>
                  <span className='text-muted-foreground ml-auto'>
                    {note.date}
                  </span>
                </p>
                <p className='text-[13px] leading-5'>{note.text}</p>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-label='Files' className='flex flex-col gap-2'>
        <h3 className='text-sm font-medium'>Files</h3>
        <ul className='flex flex-col gap-2'>
          {FILES.map((file) => {
            const FileGlyph = file.icon;

            return (
              <li key={file.id} className='flex items-center gap-2.5'>
                <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
                  <FileGlyph className='size-4' />
                </span>
                <span className='flex min-w-0 flex-col'>
                  <span className='truncate text-[13px] font-medium'>
                    {file.name}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {file.size}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <Button
        variant='outline'
        render={<a href='#' />}
        nativeButton={false}
        className='self-start'
      >
        Open full profile
        <ArrowUpRightIcon />
      </Button>
    </div>
  );
}

export default function Aside02() {
  return (
    <AsidePreview triggerLabel='Open member profile'>
      <MemberProfile />
    </AsidePreview>
  );
}
