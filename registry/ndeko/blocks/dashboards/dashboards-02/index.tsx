'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';

import { MEMBERS, TEAM_NAME, WEEKS, type Member, type Week } from './data';
import { DayBars } from './day-bars';
import { DurationFigure } from './duration-figure';
import {
  averageWorkdayMinutesOf,
  csvRowsOf,
  dayBarsOf,
  memberOf,
  rankingOf,
  totalMinutesOf,
  weekOf,
  workingDaysSoFarOf,
  type Scope,
  type WeekQuery,
} from './figures';
import { ProjectRanking } from './project-ranking';
import {
  ExportButton,
  PeriodSwitch,
  REPORT_SURFACE,
  ReportToolbar,
  downloadCsv,
  useSimulatedLoad,
  type PeriodOption,
} from './report-frame';

type ScopeOption = { value: Scope; label: string; member: Member | null };

const WEEK_OPTIONS: PeriodOption<Week['id']>[] = WEEKS.map((week) => ({
  id: week.id,
  label: `Week ${week.number}`,
}));

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: 'everyone', label: 'Everyone', member: null },
  ...MEMBERS.map((member) => ({
    value: member.id,
    label: member.name,
    member,
  })),
];

const INITIAL_QUERY: WeekQuery = { weekId: 'w45', scope: 'everyone' };

const SKELETON_ROWS = ['first', 'second', 'third', 'fourth'];

function queryKeyOf(query: WeekQuery) {
  return `${query.weekId}:${query.scope}`;
}

function dayCountLabelOf(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

function dayNoteOf(week: Week) {
  if (week.todayIndex === null) {
    return 'Monday to Sunday';
  }
  const today = week.days[week.todayIndex];
  const lastIndex = week.days.length - 1;
  const aheadCount = lastIndex - week.todayIndex;
  const aheadLabel = dayCountLabelOf(aheadCount, 'day', 'days');
  return `${today.name} so far, ${aheadLabel} ahead`;
}

function scopeLabelOf(member: Member | null) {
  if (member) {
    return member.name;
  }
  return TEAM_NAME;
}

function firstNameOf(member: Member | null) {
  if (!member) {
    return 'the team';
  }
  const [firstName] = member.name.split(' ');
  return firstName;
}

function MemberFace({ member }: { member: Member }) {
  return <Avatar className='size-5' seed={member.name} />;
}

function WeekSkeleton() {
  return (
    <div
      aria-hidden='true'
      className='grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'
    >
      <div className={cn(REPORT_SURFACE, 'flex flex-col gap-5 p-5')}>
        <Skeleton className='h-3.5 w-28' />
        <div className='flex gap-8'>
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-9 w-24' />
        </div>
        <Skeleton className='h-[204px] w-full rounded-lg' />
      </div>
      <div className={cn(REPORT_SURFACE, 'flex flex-col gap-4 p-5')}>
        <Skeleton className='h-3.5 w-36' />
        {SKELETON_ROWS.map((row) => (
          <div key={row} className='flex flex-col gap-2'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-1 w-3/4' />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboards02() {
  const load = useSimulatedLoad<WeekQuery>(INITIAL_QUERY, queryKeyOf);
  const shownQuery = load.loaded ?? load.requested;
  const week = weekOf(shownQuery.weekId);
  const member = memberOf(shownQuery.scope);
  const bars = dayBarsOf(shownQuery);
  const totalMinutes = totalMinutesOf(bars);
  const averageMinutes = averageWorkdayMinutesOf(bars, week);
  const workingDays = workingDaysSoFarOf(week);
  const ranking = rankingOf(shownQuery);
  const isEmptyWeek = totalMinutes === 0;
  const scopeLabel = scopeLabelOf(member);
  const title = `Week ${week.number}`;
  const meta = `${week.rangeLabel} · ${scopeLabel}`;
  const dayNote = dayNoteOf(week);
  const workingDaysLabel = dayCountLabelOf(
    workingDays,
    'working day',
    'working days'
  );
  const projectCountLabel = dayCountLabelOf(
    ranking.projectCount,
    'project',
    'projects'
  );
  const chartTitle = `Hours by day in week ${week.number}, ${scopeLabel}`;
  const firstName = firstNameOf(member);
  const emptyLine = `Nothing to rank for ${firstName} in week ${week.number}`;

  function changeWeek(weekId: Week['id']) {
    load.request((previous) => ({ ...previous, weekId }));
  }

  function changeScope(value: unknown) {
    const option = SCOPE_OPTIONS.find((candidate) => candidate.value === value);
    if (!option) {
      return;
    }
    load.request((previous) => ({ ...previous, scope: option.value }));
  }

  function showEveryone() {
    load.request((previous) => ({ ...previous, scope: 'everyone' }));
  }

  function exportWeek() {
    const rows = csvRowsOf(bars);
    const fileName = `tidewell-week-${week.number}-${shownQuery.scope}.csv`;
    downloadCsv(fileName, rows);
  }

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <ReportToolbar title={title} meta={meta}>
        <Select
          items={SCOPE_OPTIONS}
          value={load.requested.scope}
          onValueChange={changeScope}
        >
          <SelectTrigger aria-label='Whose time' className='w-40 sm:w-44'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align='end'>
            {SCOPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.member && <MemberFace member={option.member} />}
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ExportButton disabled={load.isFirstLoad} onExport={exportWeek} />
      </ReportToolbar>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 md:px-6'>
        <PeriodSwitch
          label='Week'
          options={WEEK_OPTIONS}
          value={load.requested.weekId}
          isUpdating={load.isUpdating}
          onValueChange={changeWeek}
        />
        {load.isFirstLoad && <WeekSkeleton />}
        {!load.isFirstLoad && (
          <div
            aria-busy={load.isUpdating}
            className='grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'
          >
            <section
              aria-label='Hours by day'
              className={cn(REPORT_SURFACE, 'flex flex-col gap-5 p-5')}
            >
              <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
                <div className='flex flex-col gap-0.5'>
                  <h2 className='text-sm font-medium'>Hours by day</h2>
                  <p className='text-muted-foreground text-xs'>{dayNote}</p>
                </div>
                <span className='text-muted-foreground text-xs'>
                  Illustrative figures
                </span>
              </div>
              <div className='flex flex-wrap gap-x-10 gap-y-3'>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-muted-foreground text-xs'>Tracked</span>
                  <DurationFigure
                    minutes={totalMinutes}
                    className='text-lg leading-7 font-semibold'
                  />
                </div>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-muted-foreground text-xs'>
                    Average a working day
                  </span>
                  <DurationFigure
                    minutes={averageMinutes}
                    className='text-lg leading-7 font-semibold'
                  />
                  <span className='text-muted-foreground text-xs'>
                    {`Over ${workingDaysLabel}`}
                  </span>
                </div>
              </div>
              <DayBars
                title={chartTitle}
                bars={bars}
                emptyState={
                  isEmptyWeek && (
                    <div className='bg-card flex flex-col items-center gap-3 rounded-lg px-3 py-2'>
                      <p className='text-[13px] font-medium text-balance'>
                        {`${scopeLabel} has no time in week ${week.number}`}
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={showEveryone}
                      >
                        Show everyone
                      </Button>
                    </div>
                  )
                }
              />
            </section>
            <section
              aria-label='Where the time went'
              className={cn(REPORT_SURFACE, 'flex flex-col gap-3 p-5')}
            >
              <div className='flex items-baseline justify-between gap-3'>
                <h2 className='text-sm font-medium'>Where the time went</h2>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {projectCountLabel}
                </span>
              </div>
              <ProjectRanking
                rows={ranking.rows}
                other={ranking.other}
                emptyLine={emptyLine}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
