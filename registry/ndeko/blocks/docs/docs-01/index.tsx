'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MenuIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { CopyPage } from './copy-page';
import {
  CHECK_CODE,
  CHECK_TEXT,
  DOCS,
  HEADINGS,
  KEY_CODE,
  KEYS_TEXT,
  KEYS_WARNING,
  NEXT,
  NEXT_STEPS,
  PAGE,
  PREVIOUS,
  REQUIREMENTS,
  type Manager,
} from './data';
import { DocsNav } from './docs-nav';
import { CodeLine, initCommandOf, Install } from './install';
import { OnThisPage } from './on-this-page';
import { pageTextOf, type TextFormat } from './page-text';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  TOP,
  type InstallTab,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** A heading counts as read once it rises above this line of the frame. */
const READ_LINE_PX = 96;

/** Where a heading lands after a jump, just under the read line. */
const LANDING_PX = 64;

const COPIED_FOR_MS = 1600;

/** The width of the `@3xl` container step, where the sidebar takes the place of the sheet. */
const SIDEBAR_FROM_PX = 768;

const FIRST_HEADING = HEADINGS[0].id;

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function readHeadingOf(frame: HTMLElement) {
  const frameTop = frame.getBoundingClientRect().top;
  const headings = frame.querySelectorAll<HTMLElement>('[data-heading]');
  let active = FIRST_HEADING;
  for (const heading of headings) {
    const top = heading.getBoundingClientRect().top - frameTop;
    const isRead = top <= READ_LINE_PX;
    const id = heading.dataset.heading;
    if (isRead && id) {
      active = id;
    }
  }
  return active;
}

function titleOfHeading(headingId: string) {
  const heading = HEADINGS.find((candidate) => candidate.id === headingId);
  return heading?.title ?? '';
}

type SectionProps = {
  headingId: string;
  headingIdOf: (headingId: string) => string;
  children: React.ReactNode;
};

function Section({ headingId, headingIdOf, children }: SectionProps) {
  return (
    <section className='flex flex-col gap-4'>
      <h2
        id={headingIdOf(headingId)}
        data-heading={headingId}
        tabIndex={-1}
        className={cn(
          'rounded-sm text-xl font-semibold text-balance',
          FOCUS_RING
        )}
      >
        {titleOfHeading(headingId)}
      </h2>
      {children}
    </section>
  );
}

export default function Docs01() {
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
  const shouldReduceMotion = usePrefersReducedMotion();
  const baseId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const pendingFrame = useRef<number | null>(null);
  const [activeId, setActiveId] = useState(FIRST_HEADING);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  const headingIdOf = useCallback(
    (headingId: string) => `${baseId}-${headingId}`,
    [baseId]
  );

  const scrollFrameTo = useCallback(
    (headingId: string) => {
      const frame = frameRef.current;
      const behavior = scrollBehaviorOf(shouldReduceMotion);
      if (!frame) {
        return null;
      }
      if (headingId === TOP) {
        frame.scrollTo({ top: 0, behavior });
        return null;
      }
      const selector = `[data-heading="${headingId}"]`;
      const heading = frame.querySelector<HTMLElement>(selector);
      if (!heading) {
        return null;
      }
      const headingTop = heading.getBoundingClientRect().top;
      const frameTop = frame.getBoundingClientRect().top;
      const top = headingTop - frameTop + frame.scrollTop - LANDING_PX;
      frame.scrollTo({ top, behavior });
      return heading;
    },
    [shouldReduceMotion]
  );

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    requestAnimationFrame(() => {
      const trigger = ref.current?.querySelector<HTMLElement>(
        '[data-sheet-trigger]'
      );
      trigger?.focus();
    });
  }, [ref]);

  /** The sheet leaves the focus to whoever opened it: a person who did lands on its search. */
  function openSheet() {
    setIsSheetOpen(true);
    requestAnimationFrame(() => {
      const search = ref.current?.querySelector<HTMLElement>(
        '[data-sheet-nav] input'
      );
      search?.focus();
    });
  }

  useEffect(() => {
    if (state.readRequest === 0) {
      return;
    }
    scrollFrameTo(state.readTo);
  }, [state.readRequest, state.readTo, scrollFrameTo]);

  /** Once the docs are wide enough for the sidebar, the sheet has nothing left to hold. */
  useEffect(() => {
    const root = ref.current;
    if (!isSheetOpen || !root) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const isWide = root.clientWidth >= SIDEBAR_FROM_PX;
      if (isWide) {
        setIsSheetOpen(false);
      }
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [isSheetOpen, ref]);

  useEffect(() => {
    if (!state.isCommandCopied) {
      return;
    }
    const timer = setTimeout(() => {
      act({ type: 'commandReset' });
    }, COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [state.isCommandCopied, act]);

  useEffect(() => {
    if (!state.isPageCopied) {
      return;
    }
    const timer = setTimeout(() => {
      act({ type: 'pageReset' });
    }, COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [state.isPageCopied, act]);

  useEffect(() => {
    return () => {
      const frameRequest = pendingFrame.current;
      if (frameRequest !== null) {
        cancelAnimationFrame(frameRequest);
      }
    };
  }, []);

  function measureReading() {
    pendingFrame.current = null;
    const frame = frameRef.current;
    if (frame) {
      const readId = readHeadingOf(frame);
      setActiveId(readId);
    }
  }

  /** The rail follows the scroll at most once a frame. */
  function followReading() {
    if (pendingFrame.current !== null) {
      return;
    }
    pendingFrame.current = requestAnimationFrame(measureReading);
  }

  function yieldToWheel() {
    if (isAutoplaying) {
      takeOver();
    }
  }

  /** A jump also hands the focus to the heading, so the keyboard reads on from there. */
  function jumpTo(headingId: string) {
    const heading = scrollFrameTo(headingId);
    heading?.focus({ preventScroll: true });
  }

  async function copyCommand() {
    try {
      const command = initCommandOf(state.manager);
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    act({ type: 'commandCopied' });
  }

  async function copyPage(format: TextFormat) {
    const text = pageTextOf(state.manager, format);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    act({ type: 'pageCopied', format });
  }

  function openInNewTab() {
    const address = new URL(PAGE.href, window.location.href);
    window.open(address.href, '_blank', 'noopener,noreferrer');
  }

  function replay() {
    frameRef.current?.scrollTo({ top: 0 });
    restart();
  }

  const nav = (
    <DocsNav
      query={state.navQuery}
      pressed={pressed}
      onSearch={(query) => act({ type: 'navSearched', query })}
    />
  );

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative flex h-dvh min-h-[36rem] w-full flex-col overflow-hidden'
      >
        <header
          inert={isSheetOpen}
          className='hairline-b border-border flex h-14 shrink-0 items-center gap-3 px-4 @2xl:px-6'
        >
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label='Open the docs menu'
            data-sheet-trigger
            onClick={openSheet}
            className='text-muted-foreground -ms-1.5 @3xl:hidden'
          >
            <MenuIcon />
          </Button>
          <a
            href={DOCS.homeHref}
            className={cn(
              'flex items-center gap-2 rounded-md text-sm font-semibold',
              FOCUS_RING
            )}
          >
            <CompanyMark seed={DOCS.product} size='lg' />
            {DOCS.product}
            <span className='text-muted-foreground font-normal'>Docs</span>
          </a>
          <Badge variant='secondary' className='tabular-nums'>
            {DOCS.version}
          </Badge>
          <span className='flex-1' />
          <ReplayButton isShown={canReplay} onReplay={replay} label='Replay' />
        </header>

        <div inert={isSheetOpen} className='flex min-h-0 flex-1'>
          <aside className='hairline-r border-border hidden w-64 shrink-0 overflow-y-auto p-4 @3xl:block'>
            {nav}
          </aside>

          <div
            ref={frameRef}
            onScroll={followReading}
            onWheel={yieldToWheel}
            className='relative min-h-0 flex-1 overflow-y-auto overscroll-contain'
          >
            <div className='mx-auto grid max-w-5xl gap-10 px-4 py-8 @2xl:px-8 @5xl:grid-cols-[minmax(0,1fr)_11rem]'>
              <article className='flex min-w-0 flex-col gap-10'>
                <header className='flex flex-col gap-4'>
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href={DOCS.homeHref}>
                          Docs
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href={DOCS.sectionHref}>
                          {PAGE.section}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{PAGE.title}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
                      {PAGE.title}
                    </h1>
                    <CopyPage
                      isCopied={state.isPageCopied}
                      onCopy={copyPage}
                      onOpenInNewTab={openInNewTab}
                    />
                  </div>
                  <p className='text-muted-foreground text-base leading-7 text-pretty'>
                    {PAGE.lead}
                  </p>
                </header>

                <Section headingId='requirements' headingIdOf={headingIdOf}>
                  <ul className='flex flex-col gap-2 text-[15px] leading-6'>
                    {REQUIREMENTS.map((line) => (
                      <li key={line} className='flex items-baseline gap-3'>
                        <span
                          aria-hidden='true'
                          className='bg-foreground/30 size-1.5 shrink-0 translate-y-[-0.15em] rounded-full'
                        />
                        {line}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section headingId='install' headingIdOf={headingIdOf}>
                  <Install
                    manager={state.manager}
                    tab={state.installTab}
                    isCommandCopied={state.isCommandCopied}
                    pressed={pressed}
                    onPickManager={(manager: Manager) =>
                      act({ type: 'managerPicked', manager })
                    }
                    onPickTab={(tab: InstallTab) =>
                      act({ type: 'tabPicked', tab })
                    }
                    onCopyCommand={copyCommand}
                  />
                </Section>

                <Section headingId='keys' headingIdOf={headingIdOf}>
                  <p className='text-[15px] leading-7 text-pretty'>
                    {KEYS_TEXT}
                  </p>
                  <CodeLine code={KEY_CODE} />
                  <p className='bg-warning/10 flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] leading-5'>
                    <TriangleAlertIcon className='text-warning-foreground mt-px size-4 shrink-0' />
                    <span>{KEYS_WARNING}</span>
                  </p>
                </Section>

                <Section headingId='check' headingIdOf={headingIdOf}>
                  <p className='text-[15px] leading-7 text-pretty'>
                    {CHECK_TEXT}
                  </p>
                  <CodeLine code={CHECK_CODE} />
                </Section>

                <Section headingId='next' headingIdOf={headingIdOf}>
                  <ul className='flex flex-col'>
                    {NEXT_STEPS.map((step) => (
                      <li key={step.id}>
                        <a
                          href={step.href}
                          className={cn(
                            'group text-primary-ink inline-flex items-center gap-1.5 rounded-sm py-1 text-[15px] font-medium underline-offset-4 hover:underline',
                            FOCUS_RING
                          )}
                        >
                          {step.title}
                          <ArrowRightIcon className='size-4 transition-transform duration-100 group-hover:translate-x-0.5' />
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>

                <nav
                  aria-label='Previous and next pages'
                  className='grid gap-3 @lg:grid-cols-2'
                >
                  <a
                    href={PREVIOUS.href}
                    className={cn(
                      CARD,
                      'group hover:bg-foreground/[0.02] flex flex-col gap-1 p-4 transition-colors duration-100',
                      FOCUS_RING
                    )}
                  >
                    <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                      <ArrowLeftIcon className='size-3.5 transition-transform duration-100 group-hover:-translate-x-0.5' />
                      Previous
                    </span>
                    <span className='text-sm font-medium'>
                      {PREVIOUS.title}
                    </span>
                  </a>
                  <a
                    href={NEXT.href}
                    className={cn(
                      CARD,
                      'group hover:bg-foreground/[0.02] flex flex-col gap-1 p-4 transition-colors duration-100 @lg:items-end @lg:text-end',
                      FOCUS_RING
                    )}
                  >
                    <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                      Next
                      <ArrowRightIcon className='size-3.5 transition-transform duration-100 group-hover:translate-x-0.5' />
                    </span>
                    <span className='text-sm font-medium'>{NEXT.title}</span>
                  </a>
                </nav>
              </article>

              <aside className='hidden @5xl:block'>
                <div className='sticky top-6'>
                  <OnThisPage
                    activeId={activeId}
                    headingIdOf={headingIdOf}
                    onJump={jumpTo}
                  />
                </div>
              </aside>
            </div>
          </div>
        </div>

        <InlineSheet
          side='start'
          isOpen={isSheetOpen}
          onClose={closeSheet}
          label='Docs'
          closeLabel='Close the docs menu'
          className='z-40 @3xl:hidden'
          panelClassName='gap-2 overflow-y-auto p-3'
        >
          <div data-sheet-nav className='px-1 pb-2'>
            <DocsNav
              query={state.navQuery}
              pressed={pressed}
              onSearch={(query) => act({ type: 'navSearched', query })}
              onPick={closeSheet}
            />
          </div>
        </InlineSheet>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
