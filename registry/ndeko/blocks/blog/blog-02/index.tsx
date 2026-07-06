'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ArrowLeftIcon, ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ArticleBody } from './article-body';
import { OnThisPage, TableOfContents } from './contents';
import { BLOG, NEXT, POST, PREVIOUS, RELATED, SECTIONS } from './data';
import { PostActions } from './post-actions';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  TOP,
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

/** Where a heading lands after a jump: under the line, clear of the bar on phones. */
const LANDING_PX = 64;

const COPIED_FOR_MS = 1600;

const NO_PROGRESS = { transform: 'scaleX(0)' };

const FIRST_SECTION = SECTIONS[0].id;

const LAST_SECTION = SECTIONS[SECTIONS.length - 1].id;

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function isAtEndOf(frame: HTMLElement) {
  const bottom = frame.scrollTop + frame.clientHeight;
  const end = frame.scrollHeight - 1;
  return bottom >= end;
}

/** The post ends before its last heading can rise to the read line, so the end of the frame marks it. */
function readHeadingOf(frame: HTMLElement) {
  if (isAtEndOf(frame)) {
    return LAST_SECTION;
  }
  const frameTop = frame.getBoundingClientRect().top;
  const headings = frame.querySelectorAll<HTMLElement>('[data-heading]');
  let active = FIRST_SECTION;
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

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function shareReadOf(frame: HTMLElement) {
  const range = frame.scrollHeight - frame.clientHeight;
  if (range <= 0) {
    return 0;
  }
  return frame.scrollTop / range;
}

export default function Blog02() {
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
  const progressRef = useRef<HTMLSpanElement>(null);
  const pendingFrame = useRef<number | null>(null);
  const [activeId, setActiveId] = useState(FIRST_SECTION);
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  const headingIdOf = useCallback(
    (sectionId: string) => `${baseId}-${sectionId}`,
    [baseId]
  );

  const scrollFrameTo = useCallback(
    (sectionId: string) => {
      const frame = frameRef.current;
      const behavior = scrollBehaviorOf(shouldReduceMotion);
      if (!frame) {
        return null;
      }
      if (sectionId === TOP) {
        frame.scrollTo({ top: 0, behavior });
        return null;
      }
      const selector = `[data-heading="${sectionId}"]`;
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

  useEffect(() => {
    if (state.readRequest === 0) {
      return;
    }
    scrollFrameTo(state.readTo);
  }, [state.readRequest, state.readTo, scrollFrameTo]);

  useEffect(() => {
    if (!state.isLinkCopied) {
      return;
    }
    const timer = setTimeout(() => {
      act({ type: 'copyReset' });
    }, COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [state.isLinkCopied, act]);

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
    const bar = progressRef.current;
    if (!frame || !bar) {
      return;
    }
    const share = shareReadOf(frame);
    bar.style.transform = `scaleX(${share})`;
    const readId = readHeadingOf(frame);
    setActiveId(readId);
  }

  /** The line and the contents follow the scroll at most once a frame, without a render for the line. */
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
  function jumpTo(sectionId: string) {
    const heading = scrollFrameTo(sectionId);
    heading?.focus({ preventScroll: true });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(POST.link);
    } catch {
      return;
    }
    act({ type: 'linkCopied' });
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
        <span
          ref={progressRef}
          aria-hidden='true'
          style={NO_PROGRESS}
          className='bg-primary pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 origin-left'
        />
        <div
          ref={frameRef}
          onScroll={followReading}
          onWheel={yieldToWheel}
          className='relative min-h-0 flex-1 overflow-y-auto overscroll-contain'
        >
          <div className='mx-auto max-w-5xl px-4 pb-16 @2xl:px-8'>
            <div className='flex min-h-16 items-center gap-3'>
              <Breadcrumb className='min-w-0 flex-1'>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={BLOG.blogHref}
                      className='flex items-center gap-1.5'
                    >
                      <CompanyMark seed={BLOG.company} size='sm' />
                      Field notes
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={BLOG.topicHref}>
                      {POST.topic}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <ReplayButton
                isShown={canReplay}
                onReplay={replay}
                label='Replay'
              />
            </div>

            <div className='grid gap-10 @3xl:grid-cols-[minmax(0,1fr)_13rem] @3xl:gap-14'>
              <article className='flex min-w-0 flex-col gap-8'>
                <header className='flex flex-col gap-5 pt-2'>
                  <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
                    {POST.title}
                  </h1>
                  <p className='text-muted-foreground text-lg leading-8 text-pretty'>
                    {POST.lead}
                  </p>
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-3'>
                    <div className='flex min-w-0 flex-1 items-center gap-3'>
                      <Avatar seed={POST.author} className='size-9' />
                      <div className='flex min-w-0 flex-col'>
                        <p className='truncate text-[13px] font-medium'>
                          {POST.author}
                        </p>
                        <p className='text-muted-foreground truncate text-xs tabular-nums'>
                          <time dateTime={POST.isoDate}>{POST.date}</time>
                          {' · '}
                          {POST.minutes} min read
                        </p>
                      </div>
                    </div>
                    <PostActions
                      isLinkCopied={state.isLinkCopied}
                      isCopyPressed={pressed === 'copy-link'}
                      onCopy={copyLink}
                    />
                  </div>
                </header>

                <OnThisPage
                  activeId={activeId}
                  headingIdOf={headingIdOf}
                  onJump={jumpTo}
                />

                <ArticleBody headingIdOf={headingIdOf} />

                <nav
                  aria-label='More posts'
                  className='grid gap-3 pt-4 @lg:grid-cols-2'
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
                    <span className='text-sm font-medium text-pretty'>
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
                    <span className='text-sm font-medium text-pretty'>
                      {NEXT.title}
                    </span>
                  </a>
                </nav>

                <section
                  aria-labelledby={`${baseId}-related`}
                  className='flex flex-col gap-3'
                >
                  <h2
                    id={`${baseId}-related`}
                    className='text-[13px] font-medium'
                  >
                    Related posts
                  </h2>
                  <ul className='flex flex-col'>
                    {RELATED.map((post) => (
                      <li key={post.id}>
                        <a
                          href={post.href}
                          className={cn(
                            'group hover:bg-foreground/[0.03] -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-100',
                            FOCUS_RING
                          )}
                        >
                          <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                            <span className='truncate text-[13px] font-medium'>
                              {post.title}
                            </span>
                            <span className='text-muted-foreground text-xs tabular-nums'>
                              {post.topic} · {post.date} · {post.minutes} min
                              read
                            </span>
                          </span>
                          <ArrowRightIcon className='text-muted-foreground size-4 shrink-0 transition-transform duration-100 group-hover:translate-x-0.5' />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>

              <aside className='hidden @3xl:block'>
                <div className='sticky top-8 pt-2'>
                  <TableOfContents
                    activeId={activeId}
                    headingIdOf={headingIdOf}
                    onJump={jumpTo}
                    pressed={pressed}
                  />
                </div>
              </aside>
            </div>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
