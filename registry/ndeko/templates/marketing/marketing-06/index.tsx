'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import type { Manager, InstallTab } from './data';
import { DocPage } from './doc-page';
import { DocsHeader } from './docs-header';
import { DocsNav } from './docs-nav';
import { HomePage } from './home-page';
import { initCommandOf } from './install';
import { pageOf, type DocPage as DocPageContent, type PageId } from './pages';
import { searchOf, type SearchResult } from './search';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  TOP,
  type Route,
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
const SIDEBAR_FROM_REM = 48;

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function docPageOf(route: Route): DocPageContent | null {
  if (route === 'home') {
    return null;
  }
  return pageOf(route);
}

function headingOfResult(result: SearchResult) {
  return result.entry.headingId ?? undefined;
}

/** The heading the rail marks, once the page it belongs to is the one on screen. */
function activeHeadingOf(page: DocPageContent, activeId: string) {
  const isOnPage = page.sections.some((section) => section.id === activeId);
  if (isOnPage) {
    return activeId;
  }
  return page.sections[0].id;
}

function readHeadingOf(frame: HTMLElement, fallback: string) {
  const frameTop = frame.getBoundingClientRect().top;
  const headings = frame.querySelectorAll<HTMLElement>('[data-heading]');
  let active = fallback;
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

export default function Marketing06() {
  const {
    ref,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
    takeOver,
  } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isNarrow = useIsNarrow(ref, SIDEBAR_FROM_REM);
  const baseId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const pendingFrame = useRef<number | null>(null);
  const [activeId, setActiveId] = useState('');
  const page = docPageOf(state.route);
  const isHome = page === null;
  const hasSidebar = !isHome;
  const canShowSheet = isNarrow && hasSidebar;
  const isSheetShown = canShowSheet && state.isNavOpen;
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const searchId = `${baseId}-search`;

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
        frame.scrollTo({ top: 0, behavior: 'auto' });
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

  useEffect(() => {
    if (state.readRequest === 0) {
      return;
    }
    scrollFrameTo(state.readTo);
  }, [state.readRequest, state.readTo, scrollFrameTo]);

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
    return () => {
      const frameRequest = pendingFrame.current;
      if (frameRequest !== null) {
        cancelAnimationFrame(frameRequest);
      }
    };
  }, []);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** The page changes under the pointer of a person, so the keyboard starts reading from the top of the new one. */
  function startReading() {
    focusLater('[data-frame]');
  }

  function openPage(pageId: PageId) {
    act({ type: 'opened', route: pageId });
    startReading();
  }

  function openHome() {
    act({ type: 'opened', route: 'home' });
    startReading();
  }

  function openResult(result: SearchResult) {
    const heading = headingOfResult(result);
    act({ type: 'opened', route: result.entry.pageId, heading });
    startReading();
  }

  function openFirstResult() {
    const [first] = searchOf(state.query);
    if (first) {
      openResult(first);
    }
  }

  function search(query: string) {
    act({ type: 'searched', query });
  }

  function measureReading() {
    pendingFrame.current = null;
    const frame = frameRef.current;
    if (frame && page) {
      const first = page.sections[0].id;
      setActiveId(readHeadingOf(frame, first));
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

  function openSheet() {
    act({ type: 'nav', isOpen: true });
    focusLater('[data-sheet-nav] input');
  }

  function closeSheet() {
    act({ type: 'nav', isOpen: false });
    focusLater('[data-sheet-trigger]');
  }

  function replay() {
    frameRef.current?.scrollTo({ top: 0 });
    restart();
  }

  const install = {
    manager: state.manager,
    tab: state.installTab,
    isCommandCopied: state.isCommandCopied,
    pressed,
    onPickManager: (manager: Manager) =>
      act({ type: 'managerPicked', manager }),
    onPickTab: (tab: InstallTab) => act({ type: 'tabPicked', tab }),
    onCopyCommand: copyCommand,
  };

  const nav = page && (
    <DocsNav
      searchId={searchId}
      query={state.query}
      pageId={page.id}
      pressed={pressed}
      onSearch={search}
      onEnter={openFirstResult}
      onOpenResult={openResult}
      onOpenPage={openPage}
    />
  );

  return (
    <div
      ref={ref}
      className='bg-background text-foreground @container relative flex h-dvh min-h-[36rem] w-full flex-col overflow-hidden'
    >
      <div inert={isSheetShown} className='flex min-h-0 flex-1 flex-col'>
        <DocsHeader
          isHome={isHome}
          pressed={pressed}
          canReplay={canReplay}
          onOpenHome={openHome}
          onOpenMenu={openSheet}
          onReplay={replay}
        />
        <div className='flex min-h-0 flex-1'>
          {!isHome && (
            <aside
              aria-label='Sidebar'
              className='hairline-r border-border hidden w-64 shrink-0 overflow-y-auto p-4 @3xl:block'
            >
              {!isNarrow && nav}
            </aside>
          )}
          <div
            ref={frameRef}
            data-frame
            tabIndex={-1}
            onScroll={followReading}
            onWheel={yieldToWheel}
            className='relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none'
          >
            {isHome && (
              <HomePage
                searchId={searchId}
                query={state.query}
                pressed={pressed}
                onSearch={search}
                onEnter={openFirstResult}
                onOpenResult={openResult}
                onOpenPage={openPage}
              />
            )}
            {page && (
              <DocPage
                page={page}
                activeId={activeHeadingOf(page, activeId)}
                pressed={pressed}
                install={install}
                headingIdOf={headingIdOf}
                onJump={jumpTo}
                onOpenPage={openPage}
                onOpenHome={openHome}
              />
            )}
          </div>
        </div>
      </div>
      <InlineSheet
        side='start'
        isOpen={isSheetShown}
        onClose={closeSheet}
        label='Docs'
        closeLabel='Close the docs menu'
        className='z-40 @3xl:hidden'
        panelClassName='gap-2 overflow-y-auto p-3'
      >
        <div data-sheet-nav className='px-1 pb-2'>
          {isNarrow && nav}
        </div>
      </InlineSheet>
      <LiveRegion message={message} />
    </div>
  );
}
