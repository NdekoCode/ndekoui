'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, ScanIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { ScanCells } from './_parts/scan-cells';
import { BADGE_GAP, CARD_PADDING, GRID, grainsOf } from './_parts/scan-pattern';
import { useHover } from './_parts/use-hover';

type UnitStyle = React.CSSProperties & { '--u': string };

/** One module of the code: 9px, and narrower where the container is too narrow for the whole code. */
const UNIT_STYLE: UnitStyle = { '--u': 'min(0.5625rem, 3.4cqw)' };

const CARD_STYLE: React.CSSProperties = {
  padding: `calc(var(--u) * ${CARD_PADDING})`,
};

const CODE_STYLE: React.CSSProperties = {
  width: `calc(var(--u) * ${GRID})`,
};

const BADGE_STYLE: React.CSSProperties = {
  marginTop: `calc(var(--u) * ${BADGE_GAP})`,
};

/** The badge reads Scanned once most of the grains have landed in it. */
const LABEL_AT_MS = 1100;

/** The tint rises in the badge from the first grain that lands to the last. */
const FILL_DELAY_MS = 400;

const FILL_MS = 900;

const DRAIN_MS = 200;

const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const STILL_FADE = 'opacity 200ms linear';

const STATUS_ROW = 'flex items-center gap-1.5';

const READY_LABEL = 'Ready to scan';

const SCANNED_LABEL = 'Scanned';

function landingDelayOf(isStill: boolean) {
  if (isStill) {
    return 0;
  }
  return LABEL_AT_MS;
}

function statusKeyOf(isScanned: boolean) {
  if (isScanned) {
    return 'scanned';
  }
  return 'ready';
}

function fillOpacityOf(isFilled: boolean) {
  if (isFilled) {
    return 1;
  }
  return 0;
}

function fillStyleOf(isFilled: boolean, isStill: boolean): React.CSSProperties {
  if (isStill) {
    return { opacity: fillOpacityOf(isFilled), transition: STILL_FADE };
  }
  if (isFilled) {
    const rise = `scale ${FILL_MS}ms ${EASE_IN_OUT} ${FILL_DELAY_MS}ms`;
    return { scale: '1 1', transition: rise };
  }
  return { scale: '1 0', transition: `scale ${DRAIN_MS}ms ${EASE_OUT}` };
}

/** True once the grains of a scan have had the time to land. Going back to unscanned is at once. */
function useLanded(isScanned: boolean, landingMs: number) {
  const [hasLanded, setHasLanded] = useState(isScanned);

  useEffect(() => {
    if (!isScanned || hasLanded) {
      return;
    }
    const timer = window.setTimeout(() => setHasLanded(true), landingMs);
    return () => window.clearTimeout(timer);
  }, [isScanned, hasLanded, landingMs]);

  if (!isScanned && hasLanded) {
    setHasLanded(false);
  }

  return isScanned && hasLanded;
}

type StatusProps = {
  isScanned: boolean;
  readyLabel: string;
  scannedLabel: string;
};

function Status({ isScanned, readyLabel, scannedLabel }: StatusProps) {
  if (isScanned) {
    return (
      <span className={STATUS_ROW}>
        <CheckIcon strokeWidth={2.25} />
        {scannedLabel}
      </span>
    );
  }
  return (
    <span className={STATUS_ROW}>
      <ScanIcon />
      {readyLabel}
    </span>
  );
}

export type ScanBadgeProps = {
  /** What the code stands for. Its cells are drawn from this text, so one text always draws one code. It is a picture of a code, not one a camera can read. */
  value: string;
  /** True once the code was scanned: its cells pour into the badge. Back to false, they grow back. */
  isScanned: boolean;
  /** What the badge says before the scan. */
  readyLabel?: string;
  /** What it says once the cells have landed. */
  scannedLabel?: string;
  className?: string;
};

/**
 * A code drawn in cells, with a badge under it. When the code is scanned the cells fall like grains
 * into the badge, which fills with the success tint as they land and then says Scanned; when it is
 * ready again they grow back from the top left corner. Each cell is a transition of its own, so the
 * browser moves them and nothing runs at rest. Under reduced motion the cells fade where they stand.
 * The change is not announced: say it where the scan is handled.
 */
export function ScanBadge({
  value,
  isScanned,
  readyLabel = READY_LABEL,
  scannedLabel = SCANNED_LABEL,
  className,
}: ScanBadgeProps) {
  const isStill = usePrefersReducedMotion();
  const grains = useMemo(() => grainsOf(value), [value]);
  const isLabelScanned = useLanded(isScanned, landingDelayOf(isStill));

  return (
    <div className={cn('@container w-full', className)}>
      <div
        style={UNIT_STYLE}
        className='mx-auto flex w-fit flex-col items-center'
      >
        <div
          style={CARD_STYLE}
          className='bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        >
          <div style={CODE_STYLE} className='relative aspect-square'>
            <ScanCells grains={grains} isFallen={isScanned} isStill={isStill} />
          </div>
        </div>
        <Badge
          variant='outline'
          data-scanned={isLabelScanned}
          style={BADGE_STYLE}
          className='data-[scanned=true]:text-success-foreground data-[scanned=true]:ring-success/30 relative z-10 h-6 gap-0 overflow-hidden rounded-full px-2.5 transition-[color,box-shadow] duration-300'
        >
          <span
            aria-hidden='true'
            style={fillStyleOf(isScanned, isStill)}
            className='bg-success/10 absolute inset-0 origin-bottom'
          />
          <AnimatedSize as='span' axis='width' contentClassName='relative flex'>
            <Swap swapKey={statusKeyOf(isLabelScanned)}>
              <Status
                isScanned={isLabelScanned}
                readyLabel={readyLabel}
                scannedLabel={scannedLabel}
              />
            </Swap>
          </AnimatedSize>
        </Badge>
      </div>
    </div>
  );
}

type ScanPhase = 'ready' | 'scanned';

const PHASES: Segment<ScanPhase>[] = [
  { value: 'ready', label: 'Ready' },
  { value: 'scanned', label: 'Scanned' },
];

/** Long enough in each state for the pour, the landing and the growing back to be seen whole. */
const READY_HOLD_MS = 1500;

const SCANNED_HOLD_MS = 3700;

const REGROW_HOLD_MS = 1200;

const SAMPLE_CODE = 'ndekoui-entry-0042';

function phaseOf(isScanned: boolean): ScanPhase {
  if (isScanned) {
    return 'scanned';
  }
  return 'ready';
}

function statusLineOf(isScanned: boolean) {
  if (isScanned) {
    return SCANNED_LABEL;
  }
  return READY_LABEL;
}

export default function Badge14() {
  const [isScanned, setIsScanned] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = [
    { after: READY_HOLD_MS, run: () => setIsScanned(true) },
    { after: SCANNED_HOLD_MS, run: () => setIsScanned(false) },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: REGROW_HOLD_MS,
    onReset: () => setIsScanned(false),
    isEnabled: !isHovered,
  });

  useKeptHeight(ref);

  function choose(phase: ScanPhase) {
    const isScannedNow = phase === 'scanned';
    setIsScanned(isScannedNow);
    setAnnouncement(statusLineOf(isScannedNow));
  }

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-5'
      {...hoverHandlers}
    >
      <ScanBadge value={SAMPLE_CODE} isScanned={isScanned} />
      <Segments
        value={phaseOf(isScanned)}
        segments={PHASES}
        onValueChange={choose}
        label='Scan state'
      />
      <LiveRegion message={announcement} />
    </div>
  );
}
