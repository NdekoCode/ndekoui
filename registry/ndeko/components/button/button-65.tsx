'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

export type ThemeRevealMode = 'circle' | 'wipe' | 'fade';

export type RevealOrigin = {
  x: number;
  y: number;
};

const REVEAL_MS = 520;

const REVEAL_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

const ROOT_CLASS_FILTER = ['class'];

const VIEW_TRANSITION_STYLE = [
  '::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }',
  '::view-transition-old(root) { z-index: 1; }',
  '::view-transition-new(root) { z-index: 2; }',
].join('\n');

function subscribeToRootClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ROOT_CLASS_FILTER,
  });
  return () => observer.disconnect();
}

function readRootIsDark() {
  return document.documentElement.classList.contains('dark');
}

function readRootOnServer() {
  return false;
}

function useRootIsDark() {
  return useSyncExternalStore(
    subscribeToRootClass,
    readRootIsDark,
    readRootOnServer
  );
}

const SUN_BODY = [
  'origin-[12px_12px] transition-transform duration-300 ease-(--ease-out-strong)',
].join(' ');

const MOON_CUTTER =
  'transition-[translate] duration-300 ease-(--ease-out-strong)';

const RAYS =
  'origin-[12px_12px] transition-[scale,rotate,opacity] duration-300 ease-(--ease-out-strong)';

function bodyStateOf(isDark: boolean) {
  if (isDark) {
    return 'scale-[1.8]';
  }
  return 'scale-100';
}

function cutterStateOf(isDark: boolean) {
  if (isDark) {
    return '-translate-x-1.5 translate-y-2';
  }
  return 'translate-x-0 translate-y-0';
}

function raysStateOf(isDark: boolean) {
  if (isDark) {
    return 'scale-50 rotate-90 opacity-0';
  }
  return 'scale-100 rotate-0 opacity-100';
}

function SunMoonIcon({ isDark }: { isDark: boolean }) {
  const maskId = useId();

  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' className='size-[18px]'>
      <mask id={maskId}>
        <rect width='24' height='24' fill='white' />
        <circle
          cx='24'
          cy='-2'
          r='8.5'
          fill='black'
          className={cn(MOON_CUTTER, cutterStateOf(isDark))}
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <circle
          cx='12'
          cy='12'
          r='5'
          fill='currentColor'
          className={cn(SUN_BODY, bodyStateOf(isDark))}
        />
      </g>
      <path
        d='M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        className={cn(RAYS, raysStateOf(isDark))}
      />
    </svg>
  );
}

function farthestCornerOf(origin: RevealOrigin, width: number, height: number) {
  const reachX = Math.max(origin.x, width - origin.x);
  const reachY = Math.max(origin.y, height - origin.y);
  return Math.hypot(reachX, reachY);
}

function circleClipsOf(origin: RevealOrigin, width: number, height: number) {
  const radius = farthestCornerOf(origin, width, height);
  const from = `circle(0px at ${origin.x}px ${origin.y}px)`;
  const to = `circle(${radius}px at ${origin.x}px ${origin.y}px)`;
  return [from, to];
}

function wipeClips() {
  return ['inset(0 100% 0 0)', 'inset(0 0 0 0)'];
}

function clipKeyframesOf(
  mode: ThemeRevealMode,
  origin: RevealOrigin,
  width: number,
  height: number
): Keyframe[] {
  if (mode === 'fade') {
    return [{ opacity: 0 }, { opacity: 1 }];
  }
  if (mode === 'wipe') {
    const [from, to] = wipeClips();
    return [{ clipPath: from }, { clipPath: to }];
  }
  const [from, to] = circleClipsOf(origin, width, height);
  return [{ clipPath: from }, { clipPath: to }];
}

function mountViewTransitionStyle(mode: ThemeRevealMode) {
  if (mode === 'fade') {
    return null;
  }
  const style = document.createElement('style');
  style.textContent = VIEW_TRANSITION_STYLE;
  document.head.appendChild(style);
  return style;
}

function applyDocumentTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

function canTransitionDocument() {
  return typeof document.startViewTransition === 'function';
}

function animateDocumentReveal(mode: ThemeRevealMode, origin: RevealOrigin) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const keyframes = clipKeyframesOf(mode, origin, width, height);
  document.documentElement.animate(keyframes, {
    duration: REVEAL_MS,
    easing: REVEAL_EASING,
    pseudoElement: '::view-transition-new(root)',
  });
}

async function switchDocumentTheme(
  isDark: boolean,
  mode: ThemeRevealMode,
  origin: RevealOrigin,
  shouldReduceMotion: boolean
) {
  if (shouldReduceMotion || !canTransitionDocument()) {
    applyDocumentTheme(isDark);
    return;
  }
  const hasClipReveal = mode !== 'fade';
  const style = mountViewTransitionStyle(mode);
  const transition = document.startViewTransition(() => {
    applyDocumentTheme(isDark);
  });
  try {
    await transition.ready;
  } catch {
    style?.remove();
    return;
  }
  if (hasClipReveal) {
    animateDocumentReveal(mode, origin);
  }
  await transition.finished;
  style?.remove();
}

function originOf(event: React.MouseEvent<HTMLButtonElement>): RevealOrigin {
  const isFromKeyboard = event.detail === 0;
  if (isFromKeyboard) {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }
  return { x: event.clientX, y: event.clientY };
}

function centerOf(element: HTMLElement | null): RevealOrigin {
  if (!element) {
    return { x: 0, y: 0 };
  }
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

function shownDarkOf(
  scope: 'document' | 'local',
  documentIsDark: boolean,
  localIsDark: boolean
) {
  if (scope === 'document') {
    return documentIsDark;
  }
  return localIsDark;
}

export type ThemeSwitchProps = {
  /** `document` switches the whole page, `local` leaves the change to the parent through `onDarkChange`. */
  scope?: 'document' | 'local';
  mode?: ThemeRevealMode;
  isDark?: boolean;
  /** Local scope only: the theme asked for, and the point the reveal starts from. */
  onDarkChange?: (isDark: boolean, origin: RevealOrigin) => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
  className?: string;
};

export function ThemeSwitch({
  scope = 'document',
  mode = 'circle',
  isDark = false,
  onDarkChange,
  buttonRef,
  className,
}: ThemeSwitchProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const documentIsDark = useRootIsDark();
  const shownIsDark = shownDarkOf(scope, documentIsDark, isDark);
  const nextIsDark = !shownIsDark;

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    const origin = originOf(event);
    if (scope === 'local') {
      onDarkChange?.(nextIsDark, origin);
      return;
    }
    void switchDocumentTheme(nextIsDark, mode, origin, shouldReduceMotion);
  }

  return (
    <Button
      ref={buttonRef}
      variant='outline'
      size='icon'
      aria-label='Dark theme'
      aria-pressed={shownIsDark}
      onClick={toggle}
      className={cn('text-foreground', className)}
    >
      <SunMoonIcon isDark={shownIsDark} />
    </Button>
  );
}

type Reveal = {
  id: number;
  nextIsDark: boolean;
  origin: RevealOrigin;
  mode: ThemeRevealMode;
};

function darkClassOf(isDark: boolean) {
  if (isDark) {
    return 'dark';
  }
  return undefined;
}

function hiddenStartOf(mode: ThemeRevealMode) {
  if (mode === 'fade') {
    return 'opacity-0';
  }
  if (mode === 'wipe') {
    return '[clip-path:inset(0_100%_0_0)]';
  }
  return '[clip-path:circle(0px_at_50%_50%)]';
}

const STAGE_SURFACE = 'bg-background text-foreground';

type RevealLayerProps = {
  reveal: Reveal;
  onFinish: (isDark: boolean) => void;
  children: React.ReactNode;
};

/** The next theme drawn above the current one and uncovered by a clip, so the page around it keeps its theme. */
function RevealLayer({ reveal, onFinish, children }: RevealLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const stage = layer?.parentElement;
    if (!layer || !stage) {
      return;
    }
    const box = stage.getBoundingClientRect();
    const origin = {
      x: reveal.origin.x - box.left,
      y: reveal.origin.y - box.top,
    };
    const keyframes = clipKeyframesOf(
      reveal.mode,
      origin,
      box.width,
      box.height
    );
    const animation = layer.animate(keyframes, {
      duration: REVEAL_MS,
      easing: REVEAL_EASING,
      fill: 'forwards',
    });
    animation.onfinish = () => onFinish(reveal.nextIsDark);
    return () => animation.cancel();
  }, [reveal, onFinish]);

  return (
    <div
      ref={layerRef}
      aria-hidden='true'
      className={cn(
        'absolute inset-0',
        STAGE_SURFACE,
        darkClassOf(reveal.nextIsDark),
        hiddenStartOf(reveal.mode)
      )}
    >
      {children}
    </div>
  );
}

type LocalThemeStageProps = {
  isDark: boolean;
  reveal: Reveal | null;
  onRevealEnd: (isDark: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

export function LocalThemeStage({
  isDark,
  reveal,
  onRevealEnd,
  children,
  className,
}: LocalThemeStageProps) {
  return (
    <div
      inert
      aria-hidden='true'
      className={cn(
        'hairline-ring ring-foreground/10 relative overflow-hidden rounded-xl',
        STAGE_SURFACE,
        darkClassOf(isDark),
        className
      )}
    >
      {children}
      {reveal && (
        <RevealLayer key={reveal.id} reveal={reveal} onFinish={onRevealEnd}>
          {children}
        </RevealLayer>
      )}
    </div>
  );
}

const BAR_HEIGHTS = ['h-6', 'h-9', 'h-5', 'h-11', 'h-8', 'h-12', 'h-10'];

function MiniPage() {
  return (
    <div className='flex h-44 flex-col gap-3 p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>This week</span>
          <span className='text-muted-foreground text-xs'>
            Illustrative figures
          </span>
        </div>
        <span className='bg-primary text-primary-foreground flex h-7 items-center rounded-full px-3 text-xs font-medium'>
          Export
        </span>
      </div>
      <div className='flex items-end justify-between gap-4'>
        <span className='text-2xl font-semibold tabular-nums'>2,480</span>
        <div className='flex h-12 items-end gap-1.5'>
          {BAR_HEIGHTS.map((height, index) => (
            <span
              key={`${index}-${height}`}
              className={cn('bg-primary/70 w-2 rounded-sm', height)}
            />
          ))}
        </div>
      </div>
      <div className='flex gap-2'>
        <span className='bg-foreground/[0.06] h-3 w-1/3 rounded-full' />
        <span className='bg-foreground/[0.06] h-3 w-1/4 rounded-full' />
      </div>
    </div>
  );
}

const MODES: Segment<ThemeRevealMode>[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'wipe', label: 'Wipe' },
  { value: 'fade', label: 'Fade' },
];

export default function Button65() {
  const [mode, setMode] = useState<ThemeRevealMode>('circle');
  const [isDark, setIsDark] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const revealCount = useRef(0);
  const switchRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { pressed, press } = usePress<'switch'>();
  const shownIsDark = reveal?.nextIsDark ?? isDark;

  const finishReveal = useCallback((nextIsDark: boolean) => {
    setIsDark(nextIsDark);
    setReveal(null);
  }, []);

  function changeTheme(nextIsDark: boolean, origin: RevealOrigin) {
    if (shouldReduceMotion) {
      setIsDark(nextIsDark);
      return;
    }
    revealCount.current += 1;
    setReveal({ id: revealCount.current, nextIsDark, origin, mode });
  }

  function changeFromPerson(nextIsDark: boolean, origin: RevealOrigin) {
    changeTheme(nextIsDark, origin);
    if (nextIsDark) {
      setAnnouncement('Dark theme on');
      return;
    }
    setAnnouncement('Dark theme off');
  }

  function toggleFromDemo() {
    const origin = centerOf(switchRef.current);
    changeTheme(!shownIsDark, origin);
  }

  function startOver() {
    setMode('circle');
    setIsDark(false);
    setReveal(null);
  }

  const steps: AutoplayStep[] = [
    { after: 2200, run: () => press('switch') },
    { after: PRESS_LEAD_MS, run: toggleFromDemo },
    { after: 3000, run: () => press('switch') },
    { after: PRESS_LEAD_MS, run: toggleFromDemo },
    { after: 1600, run: () => setMode('wipe') },
    { after: 900, run: () => press('switch') },
    { after: PRESS_LEAD_MS, run: toggleFromDemo },
    { after: 2800, run: () => press('switch') },
    { after: PRESS_LEAD_MS, run: toggleFromDemo },
    { after: 1600, run: () => setMode('fade') },
    { after: 900, run: () => press('switch') },
    { after: PRESS_LEAD_MS, run: toggleFromDemo },
    { after: 2600, run: () => press('switch') },
    { after: PRESS_LEAD_MS, run: toggleFromDemo },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 2200,
    onReset: startOver,
  });

  return (
    <div ref={ref} className='flex w-full max-w-sm flex-col gap-3'>
      <div className='flex items-center justify-between gap-3'>
        <Segments
          label='Reveal'
          value={mode}
          segments={MODES}
          onValueChange={setMode}
        />
        <ThemeSwitch
          scope='local'
          mode={mode}
          isDark={shownIsDark}
          onDarkChange={changeFromPerson}
          buttonRef={switchRef}
          className={pressedQuietOf(pressed === 'switch')}
        />
      </div>
      <LocalThemeStage
        isDark={isDark}
        reveal={reveal}
        onRevealEnd={finishReveal}
      >
        <MiniPage />
      </LocalThemeStage>
      <LiveRegion message={announcement} />
    </div>
  );
}
