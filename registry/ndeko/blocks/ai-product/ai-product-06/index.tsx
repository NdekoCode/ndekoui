'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { PlugIcon } from '@/registry/ndeko/lib/icons';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { AppTile, type Anchor } from './app-tile';
import {
  APPS,
  appOf,
  DEMO_CONNECT,
  RESTING_ID,
  SECTION,
  type AppId,
} from './data';

const LOOP_AFTER_MS = 2800;

function anchorOf(index: number): Anchor {
  const lastIndex = APPS.length - 1;
  if (index <= 1) {
    return 'start';
  }
  if (index >= lastIndex - 1) {
    return 'end';
  }
  return 'center';
}

/** Under reduced motion nothing walks, so the shelf rests with one card open. */
function shownIdOf(activeId: AppId | null, shouldReduceMotion: boolean) {
  if (activeId === null && shouldReduceMotion) {
    return RESTING_ID;
  }
  return activeId;
}

function tabStopIdOf(shownId: AppId | null) {
  if (shownId === null) {
    return APPS[0].id;
  }
  return shownId;
}

function targetIndexOf(key: string, index: number) {
  const lastIndex = APPS.length - 1;
  if (key === 'ArrowRight') {
    const after = index + 1;
    return Math.min(lastIndex, after);
  }
  if (key === 'ArrowLeft') {
    const before = index - 1;
    return Math.max(0, before);
  }
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return lastIndex;
  }
  return null;
}

export default function AiProduct06() {
  const [activeId, setActiveId] = useState<AppId | null>(null);
  const [connected, setConnected] = useState<AppId[]>([]);
  const [message, setMessage] = useState('');
  const [isPointerInside, setIsPointerInside] = useState(false);
  const { pressed, press } = usePress<string>();
  const shouldReduceMotion = usePrefersReducedMotion();

  function connect(id: AppId) {
    const app = appOf(id);
    const isConnected = connected.includes(id);
    setActiveId(id);
    if (isConnected) {
      return;
    }
    setConnected((current) => [...current, id]);
    setMessage(`${app.name} connected`);
  }

  function resetDemonstration() {
    setActiveId(null);
    setConnected([]);
    setMessage('');
  }

  const steps = [
    { after: 900, run: () => setActiveId(APPS[0].id) },
    { after: 1800, run: () => setActiveId(APPS[1].id) },
    { after: 1800, run: () => setActiveId(APPS[2].id) },
    { after: 1200, run: () => press(`connect-${DEMO_CONNECT}`) },
    { after: PRESS_LEAD_MS, run: () => connect(DEMO_CONNECT) },
    { after: 1800, run: () => setActiveId(APPS[3].id) },
    { after: 1800, run: () => setActiveId(APPS[4].id) },
  ];
  const { ref, isAutoplaying } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: resetDemonstration,
    isEnabled: !isPointerInside,
  });
  const shownId = shownIdOf(activeId, shouldReduceMotion);
  const tabStopId = tabStopIdOf(shownId);
  const hasActive = shownId !== null;
  const spoken = spokenUnless(isAutoplaying, message);

  function enterRow(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse') {
      setIsPointerInside(true);
    }
  }

  function leaveRow(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') {
      return;
    }
    setIsPointerInside(false);
    setActiveId(null);
  }

  /** A click on a button that takes no focus (Safari) leaves no next element: the card stays for it. */
  function leaveFocus(event: React.FocusEvent<HTMLUListElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Node)) {
      return;
    }
    const isStillInside = event.currentTarget.contains(next);
    if (!isStillInside) {
      setActiveId(null);
    }
  }

  function moveFocus(event: React.KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'Escape') {
      setActiveId(null);
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const currentId = target.dataset.appTile;
    const index = APPS.findIndex((app) => app.id === currentId);
    if (index < 0) {
      return;
    }
    const nextIndex = targetIndexOf(event.key, index);
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    const next = APPS[nextIndex];
    const tile = ref.current?.querySelector<HTMLElement>(
      `[data-app-tile="${next.id}"]`
    );
    tile?.focus();
  }

  return (
    <section ref={ref} className='@container'>
      <div className='mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24'>
        <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3'>
          <div className='flex max-w-xl flex-col gap-3'>
            <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
              <PlugIcon className='size-4' />
              {SECTION.label}
            </p>
            <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {SECTION.lead}
            </p>
          </div>
          <p className='text-muted-foreground flex items-baseline gap-1 text-[13px]'>
            <MotionNumber
              value={connected.length}
              className='text-foreground'
            />
            of {APPS.length} connected
          </p>
        </header>
        <ul
          aria-label='Apps'
          onKeyDown={moveFocus}
          onBlur={leaveFocus}
          onPointerEnter={enterRow}
          onPointerLeave={leaveRow}
          className='flex justify-center gap-2 pb-44 @lg:gap-5 @2xl:gap-6'
        >
          {APPS.map((app, index) => (
            <AppTile
              key={app.id}
              app={app}
              anchor={anchorOf(index)}
              isActive={shownId === app.id}
              isDimmed={hasActive && shownId !== app.id}
              isConnected={connected.includes(app.id)}
              isTabStop={tabStopId === app.id}
              pressed={pressed}
              onActivate={setActiveId}
              onConnect={connect}
            />
          ))}
        </ul>
      </div>
      <LiveRegion message={spoken} />
    </section>
  );
}
