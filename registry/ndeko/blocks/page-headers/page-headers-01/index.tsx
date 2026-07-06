'use client';

import { useEffect, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { CalendarIcon, ListChecksIcon } from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { Chip } from '@/registry/ndeko/ui/chip';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { CondensedBar } from './condensed-bar';
import { MEMBERS, PROJECT, TABS, WORKSPACE, type TabId } from './data';
import { HeaderActions } from './header-actions';
import { ActivityPanel, FilesPanel, OverviewPanel, TasksPanel } from './panels';
import { INITIAL, LOOP_AFTER_MS, reducer, RESTING, SCRIPT } from './session';
import { TitleEditor } from './title-editor';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The height of the bar: the title counts as gone once it has passed under it. */
const BAR_HEIGHT_PX = 48;

const COPIED_FOR_MS = 1600;

const PROJECT_LINK = 'https://morrow.example/projects/harbour-street';

const SHOWN_MEMBERS = 4;

const STATUS_LABELS = [PROJECT.status, 'Archived'];

const PANELS: Record<TabId, React.ReactNode> = {
  overview: <OverviewPanel />,
  tasks: <TasksPanel />,
  files: <FilesPanel />,
  activity: <ActivityPanel />,
};

function tabOf(value: unknown) {
  const tab = TABS.find((candidate) => candidate.id === value);
  return tab?.id;
}

function statusLabelOf(isArchived: boolean) {
  if (isArchived) {
    return 'Archived';
  }
  return PROJECT.status;
}

function statusColorOf(isArchived: boolean) {
  if (isArchived) {
    return 'var(--muted-foreground)';
  }
  return 'var(--success)';
}

function watchLineOf(isWatching: boolean) {
  if (isWatching) {
    return 'You are watching this project';
  }
  return 'You stopped watching this project';
}

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function archiveLineOf(isArchived: boolean) {
  if (isArchived) {
    return 'Project archived';
  }
  return 'Project restored';
}

export default function PageHeaders01() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
    takeOver,
  } = useSession(SESSION);
  const { schedule } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [isCondensed, setIsCondensed] = useState(false);
  const [title, setTitle] = useState(PROJECT.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [spoken, setSpoken] = useState('');
  const progress = PROJECT.tasksDone / PROJECT.tasksTotal;
  const percent = Math.round(progress * 100);
  const progressStyle = { transform: `scaleX(${progress})` };
  const statusLabel = statusLabelOf(isArchived);
  const statusColor = statusColorOf(isArchived);
  const otherMembers = MEMBERS.length - SHOWN_MEMBERS;
  const shownMembers = MEMBERS.slice(0, SHOWN_MEMBERS);
  const message = spokenUnless(isAutoplaying, spoken);
  const canReplay = isFinished && !isAutoplaying;

  useEffect(() => {
    if (state.scrollRequest === 0) {
      return;
    }
    frameRef.current?.scrollTo({ top: state.scrollTop, behavior: 'smooth' });
  }, [state.scrollRequest, state.scrollTop]);

  useEffect(() => {
    const frame = frameRef.current;
    const row = rowRef.current;
    if (!frame || !row) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) {
          return;
        }
        const rootTop = entry.rootBounds?.top ?? 0;
        const isAbove = entry.boundingClientRect.top < rootTop;
        setIsCondensed(!entry.isIntersecting && isAbove);
      },
      {
        root: frame,
        rootMargin: `-${BAR_HEIGHT_PX}px 0px 0px 0px`,
        threshold: 0,
      }
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** A wheel or a trackpad scrolling the frame is a person reading: the demonstration stops for good. */
  function yieldToWheel() {
    if (isAutoplaying) {
      takeOver();
    }
  }

  function pickTab(value: unknown) {
    const tab = tabOf(value);
    if (tab) {
      act({ type: 'tabPicked', tab });
    }
  }

  function startEditing() {
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    frameRef.current?.scrollTo({ top: 0, behavior });
    setIsEditing(true);
  }

  function leaveEditing() {
    setIsEditing(false);
    focusLater('[data-action="edit"], [data-action="more"]');
  }

  function saveTitle(next: string) {
    setTitle(next);
    setSpoken(`Project renamed to ${next}`);
    leaveEditing();
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(PROJECT_LINK);
    } catch {
      setSpoken('The link could not be copied');
      return;
    }
    setIsLinkCopied(true);
    setSpoken('Link to the project copied');
    schedule(() => setIsLinkCopied(false), COPIED_FOR_MS);
  }

  function toggleWatching() {
    const next = !isWatching;
    setIsWatching(next);
    const line = watchLineOf(next);
    setSpoken(line);
  }

  function toggleArchived() {
    const next = !isArchived;
    setIsArchived(next);
    const line = archiveLineOf(next);
    setSpoken(line);
  }

  function replay() {
    frameRef.current?.scrollTo({ top: 0 });
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative flex h-dvh min-h-[36rem] w-full flex-col overflow-hidden'
      >
        <div
          ref={frameRef}
          onWheel={yieldToWheel}
          className='relative min-h-0 flex-1 overflow-y-auto overscroll-contain'
        >
          <div className='sticky top-0 z-20 h-0'>
            <CondensedBar
              isShown={isCondensed}
              title={title}
              statusLabel={statusLabel}
              statusColor={statusColor}
              progress={progress}
              onEdit={startEditing}
            />
          </div>

          <div className='mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-5 pb-16 @2xl:px-8 @2xl:pt-8'>
            <header className='flex flex-col gap-4'>
              <div className='flex min-h-7 items-center gap-3'>
                <Breadcrumb className='min-w-0 flex-1'>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        href={WORKSPACE.href}
                        className='flex items-center gap-1.5'
                      >
                        <CompanyMark seed={WORKSPACE.name} size='sm' />
                        {WORKSPACE.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href={WORKSPACE.projectsHref}>
                        Projects
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className='min-w-0'>
                      <BreadcrumbPage className='truncate'>
                        {title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <ReplayButton
                  isShown={canReplay}
                  onReplay={replay}
                  label='Replay'
                />
              </div>

              <div ref={rowRef} className='relative flex items-start gap-3'>
                {isEditing && (
                  <TitleEditor
                    title={title}
                    onSave={saveTitle}
                    onCancel={leaveEditing}
                  />
                )}
                {!isEditing && (
                  <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2'>
                    <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
                      {title}
                    </h1>
                    <Chip color={statusColor}>
                      <WordRoll text={statusLabel} labels={STATUS_LABELS} />
                    </Chip>
                  </div>
                )}
                {!isEditing && (
                  <HeaderActions
                    rowRef={rowRef}
                    isWatching={isWatching}
                    isLinkCopied={isLinkCopied}
                    isArchived={isArchived}
                    onEdit={startEditing}
                    onShare={share}
                    onWatch={toggleWatching}
                    onArchive={toggleArchived}
                  />
                )}
              </div>

              <ul className='text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]'>
                <li className='flex items-center gap-2'>
                  <Avatar seed={PROJECT.lead} className='size-5' />
                  <span>
                    <span className='text-foreground'>{PROJECT.lead}</span>{' '}
                    leads
                  </span>
                </li>
                <li className='flex items-center gap-1.5'>
                  <CalendarIcon className='size-4' />
                  {PROJECT.due}
                </li>
                <li className='flex items-center gap-1.5 tabular-nums'>
                  <ListChecksIcon className='size-4' />
                  {PROJECT.tasksDone} of {PROJECT.tasksTotal} tasks done
                </li>
                <li className='flex items-center gap-2'>
                  <span className='flex -space-x-1.5' aria-hidden='true'>
                    {shownMembers.map((member) => (
                      <Avatar
                        key={member.name}
                        seed={member.name}
                        className='ring-background size-5 ring-2'
                      />
                    ))}
                  </span>
                  <span className='tabular-nums'>
                    {MEMBERS.length} members
                    <span className='sr-only'>, {otherMembers} not shown</span>
                  </span>
                </li>
              </ul>

              <div className='flex items-center gap-3'>
                <div
                  role='progressbar'
                  aria-label='Tasks done'
                  aria-valuemin={0}
                  aria-valuemax={PROJECT.tasksTotal}
                  aria-valuenow={PROJECT.tasksDone}
                  className='bg-foreground/10 h-1.5 flex-1 overflow-hidden rounded-full'
                >
                  <div
                    style={progressStyle}
                    className='bg-primary h-full w-full origin-left rounded-full'
                  />
                </div>
                <span className='text-muted-foreground w-9 text-end text-xs tabular-nums'>
                  {percent}%
                </span>
              </div>
            </header>

            <Tabs value={state.tab} onValueChange={pickTab} className='gap-6'>
              <div className='relative -mx-4 overflow-x-auto px-4 @2xl:mx-0 @2xl:px-0'>
                <TabsList>
                  {TABS.map((tab) => (
                    <TabsTab
                      key={tab.id}
                      value={tab.id}
                      className={pressedQuietOf(pressed === `tab-${tab.id}`)}
                    >
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className='text-muted-foreground text-xs tabular-nums'>
                          {tab.count}
                        </span>
                      )}
                    </TabsTab>
                  ))}
                </TabsList>
              </div>
              {TABS.map((tab) => (
                <TabsPanel key={tab.id} value={tab.id}>
                  {PANELS[tab.id]}
                </TabsPanel>
              ))}
            </Tabs>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
