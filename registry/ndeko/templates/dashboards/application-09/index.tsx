'use client';

import { useRef, useState } from 'react';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { AppSidebar, type PageCounts } from './app-sidebar';
import {
  CURRENT_PERSON,
  EMPTY_PAGES,
  NAV_GROUPS,
  REQUESTS,
  WORKSPACES,
  type PageId,
  type RequestId,
  type RequestSeed,
  type Workspace,
} from './data';
import { EmptyPage } from './empty-page';
import { OverviewPage } from './overview-page';
import { SearchPalette } from './search-palette';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type Decision,
} from './session';
import { TopBar } from './top-bar';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@3xl` container variant: under it the sidebar lives in a sheet. */
const SIDEBAR_SHEET_BELOW_REM = 48;

/** The room left above the requests when the page jumps to them. */
const REVIEW_MARGIN_PX = 16;

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function navItemOf(pageId: PageId) {
  const item = NAV_ITEMS.find((candidate) => candidate.id === pageId);
  return item ?? NAV_ITEMS[0];
}

function emptyPageOf(pageId: PageId) {
  if (pageId === 'overview') {
    return null;
  }
  return EMPTY_PAGES[pageId];
}

function workspaceOf(workspaceId: string) {
  const workspace = WORKSPACES.find(
    (candidate) => candidate.id === workspaceId
  );
  return workspace ?? WORKSPACES[0];
}

function scrollBehaviorOf(shouldReduceMotion: boolean): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function isSearchShortcut(event: React.KeyboardEvent<HTMLElement>) {
  const isKKey = event.key.toLowerCase() === 'k';
  const hasModifier = event.metaKey || event.ctrlKey;
  return isKKey && hasModifier;
}

/** Nothing calls a network. A real app plugs in here: the answer of a person to a request, and a change of workspace. */
export type Application09Props = {
  onApprove?: (request: RequestSeed) => void;
  onDeny?: (request: RequestSeed) => void;
  onWorkspaceChange?: (workspace: Workspace) => void;
};

export default function Application09({
  onApprove,
  onDeny,
  onWorkspaceChange,
}: Application09Props) {
  const { ref, isAutoplaying, state, act, pressed, isFinished, restart } =
    useSession(SESSION);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isNarrow = useIsNarrow(ref, SIDEBAR_SHEET_BELOW_REM);
  const [workspaceId, setWorkspaceId] = useState(WORKSPACES[0].id);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const workspace = workspaceOf(workspaceId);
  const page = navItemOf(state.pageId);
  const isOverview = state.pageId === 'overview';
  const emptyPage = emptyPageOf(state.pageId);
  const isSheetShown = isNarrow && state.isNavOpen;
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const counts: PageCounts = { approvals: state.pending.length };

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** The answered request leaves, and with it the button that was pressed: the focus goes to the card that holds the next one. */
  function decide(requestId: RequestId, decision: Decision) {
    act({ type: 'decided', id: requestId, decision });
    focusLater('[data-needs-you]');
    const request = REQUESTS[requestId];
    if (decision === 'denied') {
      onDeny?.(request);
      return;
    }
    onApprove?.(request);
  }

  function review() {
    const scroller = scrollerRef.current;
    const target = ref.current?.querySelector<HTMLElement>('[data-needs-you]');
    if (!scroller || !target) {
      return;
    }
    const targetTop = target.getBoundingClientRect().top;
    const scrollerTop = scroller.getBoundingClientRect().top;
    const top = targetTop - scrollerTop + scroller.scrollTop - REVIEW_MARGIN_PX;
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    scroller.scrollTo({ top, behavior });
    target.focus({ preventScroll: true });
  }

  function showRequests() {
    act({ type: 'page', id: 'overview' });
    requestAnimationFrame(review);
  }

  function navigate(pageId: PageId) {
    act({ type: 'page', id: pageId });
    act({ type: 'nav', isOpen: false });
  }

  function changeWorkspace(nextId: string) {
    setWorkspaceId(nextId);
    const next = workspaceOf(nextId);
    onWorkspaceChange?.(next);
  }

  function openNavigation() {
    act({ type: 'nav', isOpen: true });
    focusLater('[data-sheet-close="navigation"]');
  }

  function closeNavigation() {
    act({ type: 'nav', isOpen: false });
    focusLater('[data-nav-open]');
  }

  function openSearchFromKeys(event: React.KeyboardEvent<HTMLElement>) {
    if (isSearchShortcut(event)) {
      event.preventDefault();
      setIsSearchOpen((isOpen) => !isOpen);
    }
  }

  const sidebar = {
    workspaces: WORKSPACES,
    workspace,
    groups: NAV_GROUPS,
    activePageId: state.pageId,
    counts,
    person: CURRENT_PERSON,
    onWorkspaceChange: changeWorkspace,
    onNavigate: navigate,
  };

  return (
    <div
      ref={ref}
      onKeyDown={openSearchFromKeys}
      className='bg-sidebar text-foreground @container/app min-h-dvh w-full'
    >
      <div className='relative flex h-dvh min-h-[40rem] overflow-hidden @3xl/app:p-2'>
        <div inert={isSheetShown} className='flex min-h-0 min-w-0 flex-1'>
          <aside
            aria-label='Sidebar'
            className='hidden w-60 shrink-0 pe-2 @3xl/app:block'
          >
            {!isNarrow && <AppSidebar {...sidebar} className='h-full' />}
          </aside>
          <main className='bg-background @3xl/app:hairline-ring @3xl/app:ring-border flex min-w-0 flex-1 flex-col overflow-clip @3xl/app:rounded-xl @3xl/app:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
            <TopBar
              workspaceName={workspace.name}
              page={page}
              notifications={state.notifications}
              onOpenNavigation={openNavigation}
              onOpenSearch={() => setIsSearchOpen(true)}
              onReadNotifications={() => act({ type: 'read' })}
            />
            <div ref={scrollerRef} className='min-h-0 flex-1 overflow-y-auto'>
              <div className='@container/page mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 @2xl/app:px-6'>
                {isOverview && (
                  <OverviewPage
                    state={state}
                    pressed={pressed}
                    workspaceName={workspace.name}
                    canReplay={canReplay}
                    onReplay={restart}
                    onReview={review}
                    onDecide={decide}
                  />
                )}
                {emptyPage && <EmptyPage item={page} page={emptyPage} />}
              </div>
            </div>
          </main>
        </div>
        <InlineSheet
          name='navigation'
          label='Navigation'
          closeLabel='Close the navigation'
          side='start'
          isOpen={isSheetShown}
          className='@3xl/app:hidden'
          panelClassName='bg-sidebar gap-1 p-2'
          onClose={closeNavigation}
        >
          {isNarrow && <AppSidebar {...sidebar} className='flex-1' />}
        </InlineSheet>
        <SearchPalette
          open={isSearchOpen}
          groups={NAV_GROUPS}
          canReview={state.pending.length > 0}
          onOpenChange={setIsSearchOpen}
          onNavigate={navigate}
          onReview={showRequests}
        />
        <LiveRegion message={message} />
      </div>
    </div>
  );
}
