'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState } from 'react';

import {
  ChevronRightIcon,
  SettingsIcon,
  UserRoundPlusIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { ActivityFeed } from './activity-feed';
import {
  ACTIVITY,
  FIGURES,
  MEMBERS,
  PERIOD_LABELS,
  TEAM,
  WORKSPACE_NAME,
  type Period,
} from './data';
import { MemberList } from './member-list';
import { formatMinutes, SlidingFigure, TeamTile } from './parts';

const PERIODS: Period[] = ['this', 'last'];

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

const SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const ARRIVE: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] };
const LEAVE: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const BLUR_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: ARRIVE },
  exit: { opacity: 0, filter: 'blur(2px)', transition: LEAVE },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: ARRIVE },
  exit: { opacity: 0, transition: LEAVE },
};

function blurOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return BLUR_VARIANTS;
}

function isPeriod(value: unknown): value is Period {
  return PERIODS.some((period) => period === value);
}

function countOf(value: number) {
  return String(value);
}

function trackingLabelOf(count: number) {
  return `${count} of ${MEMBERS.length}`;
}

function activityTitleOf(memberName: string | null) {
  if (memberName === null) {
    return 'Recent activity';
  }
  return `Activity of ${memberName}`;
}

function memberNameOf(memberId: string | null) {
  const member = MEMBERS.find((candidate) => candidate.id === memberId);
  if (member) {
    return member.name;
  }
  return null;
}

type FigureProps = {
  label: string;
  value: number;
  format: (value: number) => string;
};

function Figure({ label, value, format }: FigureProps) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='text-lg font-semibold'>
        <SlidingFigure value={value} format={format} />
      </dd>
    </div>
  );
}

function TeamHead() {
  const faces = MEMBERS.slice(0, 4);
  const restCount = MEMBERS.length - faces.length;

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
      <div className='flex min-w-0 items-start gap-3'>
        <TeamTile initials={TEAM.initials} color={TEAM.color} />
        <div className='min-w-0'>
          <h1 className='text-lg font-semibold'>{TEAM.name}</h1>
          <p className='text-muted-foreground text-[13px] text-balance'>
            {TEAM.description}
          </p>
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-3'>
        <span className='flex items-center ps-1.5'>
          {faces.map((member) => (
            <Avatar
              key={member.id}
              className='ring-background -ms-1.5 size-7 text-[10px] ring-2'
            >
              {member.avatar && <AvatarImage src={member.avatar} alt='' />}
              <AvatarFallback>{member.initials}</AvatarFallback>
            </Avatar>
          ))}
          <span className='bg-muted text-muted-foreground ring-background -ms-1.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[10px] font-medium tabular-nums ring-2'>
            +{restCount}
          </span>
        </span>
        <Button variant='outline' size='sm'>
          <UserRoundPlusIcon />
          Invite
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label='Team settings'
          className='text-muted-foreground'
        >
          <SettingsIcon />
        </Button>
      </div>
    </div>
  );
}

export default function Team04() {
  const shouldReduceMotion = useReducedMotion();
  const membersTitleId = useId();
  const [period, setPeriod] = useState<Period>('this');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const figures = FIGURES[period];
  const trackingCount = MEMBERS.filter(
    (member) => member.presence === 'tracking'
  ).length;
  const selectedName = memberNameOf(selectedId);
  const hasSelection = selectedName !== null;
  const activityTitle = activityTitleOf(selectedName);
  const activity = ACTIVITY.filter((item) => {
    if (selectedId === null) {
      return true;
    }
    return item.memberId === selectedId;
  });
  const pressedPeriods = [period];

  function changePeriod(values: unknown[]) {
    const [value] = values;
    if (isPeriod(value)) {
      setPeriod(value);
    }
  }

  function toggleMember(memberId: string) {
    setSelectedId((current) => {
      if (current === memberId) {
        return null;
      }
      return memberId;
    });
  }

  function showEveryone() {
    setSelectedId(null);
  }

  return (
    <div className='bg-background text-foreground flex min-h-svh w-full flex-col'>
      <header className='hairline-b border-border flex h-11 shrink-0 items-center gap-3 px-3 sm:px-5'>
        <nav
          aria-label='Breadcrumb'
          className='flex min-w-0 items-center gap-1.5 text-[13px]'
        >
          <span className='text-muted-foreground'>{WORKSPACE_NAME}</span>
          <ChevronRightIcon className='text-muted-foreground size-3.5' />
          <span className='text-muted-foreground'>Teams</span>
          <ChevronRightIcon className='text-muted-foreground size-3.5' />
          <span className='truncate font-medium'>{TEAM.name}</span>
        </nav>
      </header>
      <main className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6'>
        <TeamHead />
        <section aria-label='Figures' className='flex flex-col gap-3'>
          <ToggleGroup
            aria-label='Period'
            value={pressedPeriods}
            onValueChange={changePeriod}
            travel
            size='sm'
            indicatorClassName={THUMB}
            className='bg-foreground/[0.05] rounded-lg p-0.5'
          >
            {PERIODS.map((value) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className='h-6 rounded-md px-2.5 text-xs'
              >
                {PERIOD_LABELS[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <dl className='grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4'>
            <Figure
              label='Open tasks'
              value={figures.openTasks}
              format={countOf}
            />
            <Figure label='Done' value={figures.doneTasks} format={countOf} />
            <Figure
              label='Tracked'
              value={figures.trackedMinutes}
              format={formatMinutes}
            />
            <Figure
              label='Tracking now'
              value={trackingCount}
              format={trackingLabelOf}
            />
          </dl>
        </section>
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]'>
          <section aria-labelledby={membersTitleId} className={SURFACE}>
            <div className='flex items-baseline justify-between gap-3 px-4 pt-4 pb-2'>
              <h2 id={membersTitleId} className='text-sm font-medium'>
                Members
              </h2>
              <p className='text-muted-foreground text-xs'>
                Pick someone to see their activity
              </p>
            </div>
            <div className='px-1.5 pb-1.5'>
              <MemberList
                members={MEMBERS}
                period={period}
                selectedId={selectedId}
                onToggle={toggleMember}
              />
            </div>
          </section>
          <section aria-label='Activity' className={SURFACE}>
            <div className='flex min-h-12 items-center justify-between gap-3 px-4 pt-2'>
              <h2 className='text-sm font-medium'>
                <AnimatedSize as='span' axis='width'>
                  <AnimatePresence mode='popLayout' initial={false}>
                    <motion.span
                      key={activityTitle}
                      variants={blurOf(shouldReduceMotion)}
                      initial='enter'
                      animate='visible'
                      exit='exit'
                      className='block whitespace-nowrap'
                    >
                      {activityTitle}
                    </motion.span>
                  </AnimatePresence>
                </AnimatedSize>
              </h2>
              <AnimatePresence initial={false}>
                {hasSelection && (
                  <motion.span
                    key='clear'
                    variants={blurOf(shouldReduceMotion)}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                  >
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={showEveryone}
                      className='text-muted-foreground'
                    >
                      <XIcon />
                      Show everyone
                    </Button>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className='px-4 pt-2 pb-2'>
              <ActivityFeed activity={activity} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
