'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { CircleAlertIcon, RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Card } from '@/registry/ndeko/ui/card';
import { Label } from '@/registry/ndeko/ui/label';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Switch } from '@/registry/ndeko/ui/switch';

type SweepLight = 'sweeping' | 'still';

const SweepContext = createContext<SweepLight>('still');

const BAND_WIDTH_PX = 280;
const SPEED_PX_PER_MS = 0.7;
const PASS_SHARE = 0.72;

const BLOCK_BASE = [
  'relative block overflow-hidden rounded-md',
  '[--sweep-light:color-mix(in_oklab,var(--card)_85%,transparent)] dark:[--sweep-light:color-mix(in_oklab,var(--foreground)_10%,transparent)]',
].join(' ');

const BAND =
  'pointer-events-none absolute inset-y-0 left-0 w-[280px] bg-[linear-gradient(90deg,transparent,var(--sweep-light),transparent)]';

function tintOf(light: SweepLight) {
  if (light === 'sweeping') {
    return 'bg-foreground/[0.06]';
  }
  return 'bg-foreground/[0.08]';
}

function lightOf(isSweeping: boolean): SweepLight {
  if (isSweeping) {
    return 'sweeping';
  }
  return 'still';
}

function keyframesOf(blockLeft: number, viewportWidth: number): Keyframe[] {
  const start = -BAND_WIDTH_PX - blockLeft;
  const end = viewportWidth - blockLeft;
  const from = `${start}px 0`;
  const to = `${end}px 0`;
  return [
    { translate: from, offset: 0 },
    { translate: to, offset: PASS_SHARE },
    { translate: to, offset: 1 },
  ];
}

function periodOf(viewportWidth: number) {
  const travel = viewportWidth + BAND_WIDTH_PX;
  const passMs = travel / SPEED_PX_PER_MS;
  return Math.round(passMs / PASS_SHARE);
}

/**
 * Every band runs on the document timeline (start time 0), so all of them are at the same phase,
 * and each is shifted by the left edge of its own block, so they draw one light across the page.
 */
function SweepBand() {
  const bandRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    const block = band?.parentElement;
    if (!band || !block) {
      return;
    }
    let animation: Animation | undefined;

    const restart = () => {
      animation?.cancel();
      const { left } = block.getBoundingClientRect();
      const width = window.innerWidth;
      const keyframes = keyframesOf(left, width);
      animation = band.animate(keyframes, {
        duration: periodOf(width),
        iterations: Infinity,
      });
      animation.startTime = 0;
    };

    restart();
    const observer = new ResizeObserver(restart);
    observer.observe(block);
    window.addEventListener('resize', restart);

    return () => {
      animation?.cancel();
      observer.disconnect();
      window.removeEventListener('resize', restart);
    };
  }, []);

  return <span ref={bandRef} aria-hidden='true' className={BAND} />;
}

type SweepScopeProps = {
  isActive: boolean;
  children: React.ReactNode;
};

export function SweepScope({ isActive, children }: SweepScopeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isSweeping = isActive && !shouldReduceMotion;
  const light = lightOf(isSweeping);

  return (
    <SweepContext.Provider value={light}>{children}</SweepContext.Provider>
  );
}

export function SweepBlock({ className }: { className?: string }) {
  const light = useContext(SweepContext);
  const isSweeping = light === 'sweeping';

  return (
    <span
      data-slot='sweep-block'
      aria-hidden='true'
      className={cn(BLOCK_BASE, tintOf(light), className)}
    >
      {isSweeping && <SweepBand />}
    </span>
  );
}

export type GateStatus = 'loading' | 'ready' | 'error';

const LAYER =
  'transition-opacity duration-200 ease-(--ease-out-strong) motion-reduce:duration-150';

const HIDDEN_LAYER = 'pointer-events-none opacity-0';

const SHOWN_LAYER = 'opacity-100';

function layerStateOf(isShown: boolean) {
  if (isShown) {
    return SHOWN_LAYER;
  }
  return HIDDEN_LAYER;
}

type LoadingGateProps = {
  status: GateStatus;
  skeleton: React.ReactNode;
  /** The real content. It is always laid out, which is what keeps the box the same size. */
  children: React.ReactNode;
  onRetry: () => void;
  errorTitle?: string;
  errorHint?: string;
  retryClassName?: string;
  className?: string;
};

export function LoadingGate({
  status,
  skeleton,
  children,
  onRetry,
  errorTitle = 'Could not load this',
  errorHint = 'Check your connection, then try again.',
  retryClassName,
  className,
}: LoadingGateProps) {
  const isLoading = status === 'loading';
  const isReady = status === 'ready';
  const isFailed = status === 'error';

  return (
    <div
      data-slot='loading-gate'
      data-status={status}
      aria-busy={isLoading}
      className={cn('relative min-h-44', className)}
    >
      <div inert={!isReady} className={cn(LAYER, layerStateOf(isReady))}>
        {children}
      </div>
      <div
        aria-hidden='true'
        className={cn('absolute inset-0', LAYER, layerStateOf(isLoading))}
      >
        <SweepScope isActive={isLoading}>{skeleton}</SweepScope>
      </div>
      <div
        inert={!isFailed}
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3 text-center',
          LAYER,
          layerStateOf(isFailed)
        )}
      >
        <span className='bg-destructive/10 text-destructive-ink flex size-9 items-center justify-center rounded-lg'>
          <CircleAlertIcon className='size-4' />
        </span>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium'>{errorTitle}</p>
          <p className='text-muted-foreground text-xs'>{errorHint}</p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={onRetry}
          className={retryClassName}
        >
          <RefreshCwIcon className='size-3.5 opacity-60' />
          Retry
        </Button>
      </div>
    </div>
  );
}

const FAST_LOAD_MS = 900;
const SLOW_LOAD_MS = 3200;

function loadDurationOf(isSlow: boolean) {
  if (isSlow) {
    return SLOW_LOAD_MS;
  }
  return FAST_LOAD_MS;
}

function outcomeOf(shouldFail: boolean): GateStatus {
  if (shouldFail) {
    return 'error';
  }
  return 'ready';
}

const STATUS_MESSAGES: Record<GateStatus, string> = {
  loading: 'Loading the invoice',
  ready: 'Invoice loaded',
  error: 'The invoice could not be loaded. Retry is available',
};

function InvoiceSkeleton() {
  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center gap-3'>
        <SweepBlock className='size-10 shrink-0 rounded-full' />
        <div className='flex flex-1 flex-col gap-2'>
          <SweepBlock className='h-3.5 w-2/5 rounded-full' />
          <SweepBlock className='h-3 w-1/4 rounded-full' />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <SweepBlock className='h-7 w-1/3 rounded-md' />
        <SweepBlock className='h-3 w-1/4 rounded-full' />
      </div>
      <div className='flex flex-col gap-2.5'>
        <SweepBlock className='h-3.5 w-full rounded-full' />
        <SweepBlock className='h-3.5 w-full rounded-full' />
        <SweepBlock className='h-3.5 w-full rounded-full' />
      </div>
    </div>
  );
}

function InvoiceRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex h-5 items-center justify-between gap-3 text-[13px]'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='flex items-center tabular-nums'>{children}</dd>
    </div>
  );
}

function InvoiceSummary() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-3'>
        <Avatar seed='Amani Kasongo' className='size-10' />
        <div className='flex min-w-0 flex-col'>
          <p className='truncate text-sm font-medium'>Amani Kasongo</p>
          <p className='text-muted-foreground text-xs'>Invoice INV-2048</p>
        </div>
      </div>
      <div className='flex flex-col'>
        <p className='text-2xl font-semibold tabular-nums'>$1,284.00</p>
        <p className='text-muted-foreground text-xs'>Illustrative amount</p>
      </div>
      <dl className='flex flex-col gap-2'>
        <InvoiceRow label='Issued'>12 Nov 2026</InvoiceRow>
        <InvoiceRow label='Due'>26 Nov 2026</InvoiceRow>
        <InvoiceRow label='Status'>
          <Badge variant='success'>Paid</Badge>
        </InvoiceRow>
      </dl>
    </div>
  );
}

export default function Loading07() {
  const slowId = 'loading-07-slow';
  const failId = 'loading-07-fail';
  const [status, setStatus] = useState<GateStatus>('ready');
  const [isSlow, setIsSlow] = useState(false);
  const [shouldFail, setShouldFail] = useState(false);
  const { pressed, press } = usePress<'reload' | 'retry'>();
  const { schedule, clearAll } = useTimeouts();

  function load() {
    clearAll();
    setStatus('loading');
    const duration = loadDurationOf(isSlow);
    const outcome = outcomeOf(shouldFail);
    schedule(() => setStatus(outcome), duration);
  }

  function startOver() {
    clearAll();
    setStatus('ready');
    setIsSlow(false);
    setShouldFail(false);
  }

  const steps: AutoplayStep[] = [
    { after: 2600, run: () => press('reload') },
    { after: PRESS_LEAD_MS, run: load },
    { after: 2200, run: () => setIsSlow(true) },
    { after: 800, run: () => press('reload') },
    { after: PRESS_LEAD_MS, run: load },
    { after: 4600, run: () => setIsSlow(false) },
    { after: 600, run: () => setShouldFail(true) },
    { after: 800, run: () => press('reload') },
    { after: PRESS_LEAD_MS, run: load },
    { after: 2600, run: () => setShouldFail(false) },
    { after: 900, run: () => press('retry') },
    { after: PRESS_LEAD_MS, run: load },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 3400,
    onReset: startOver,
  });

  useKeptHeight(ref);

  const isLoading = status === 'loading';
  const message = spokenUnless(isAutoplaying, STATUS_MESSAGES[status]);

  return (
    <div
      ref={ref}
      className='flex min-h-[25rem] w-full max-w-sm flex-col gap-3'
    >
      <Card className='px-5'>
        <LoadingGate
          status={status}
          skeleton={<InvoiceSkeleton />}
          onRetry={load}
          errorTitle='Could not load the invoice'
          errorHint='The connection dropped. Nothing was lost.'
          retryClassName={pressedQuietOf(pressed === 'retry')}
          className='min-h-[12.25rem]'
        >
          <InvoiceSummary />
        </LoadingGate>
      </Card>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 px-1'>
        <div className='flex items-center gap-2'>
          <Switch id={slowId} checked={isSlow} onCheckedChange={setIsSlow} />
          <Label htmlFor={slowId} className='text-xs'>
            Simulate slow
          </Label>
        </div>
        <div className='flex items-center gap-2'>
          <Switch
            id={failId}
            checked={shouldFail}
            onCheckedChange={setShouldFail}
          />
          <Label htmlFor={failId} className='text-xs'>
            Simulate error
          </Label>
        </div>
        <Button
          variant='outline'
          size='sm'
          disabled={isLoading}
          onClick={load}
          className={cn('ms-auto', pressedQuietOf(pressed === 'reload'))}
        >
          <RefreshCwIcon className='size-3.5 opacity-60' />
          Reload
        </Button>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
