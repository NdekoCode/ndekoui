'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { shareOf, type Perk } from './data';
import { PerkMark } from './perk-marks';

type TintStyle = React.CSSProperties & { '--tint': string; '--gem': string };

function easedOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return 'transition-none';
  }
  return 'transition-transform duration-700 ease-(--ease-out-strong)';
}

type ClaimPhase = 'open' | 'claimed' | 'full';

function phaseOf(hasClaimed: boolean, isFull: boolean): ClaimPhase {
  if (hasClaimed) {
    return 'claimed';
  }
  if (isFull) {
    return 'full';
  }
  return 'open';
}

type PerkCardProps = {
  perk: Perk;
  claimed: number;
  hasClaimed: boolean;
  pressed: string | null;
  onClaim: (id: Perk['id']) => void;
};

export function PerkCard({
  perk,
  claimed,
  hasClaimed,
  pressed,
  onClaim,
}: PerkCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const eased = easedOf(shouldReduceMotion);
  const share = shareOf(claimed, perk.cap);
  const isFull = claimed >= perk.cap;
  const left = perk.cap - claimed;
  const phase = phaseOf(hasClaimed, isFull);
  const open = 1 - share;
  const remaining = open * 100;
  const fillStyle = { transform: `translateX(-${remaining}%)` };
  const color = seriesColorOf(perk.series);
  const tint: TintStyle = { '--tint': color, '--gem': color };
  const isPressed = pressed === `claim-${perk.id}`;

  return (
    <article
      style={tint}
      className='hairline-ring ring-border flex flex-col gap-5 rounded-xl bg-[color-mix(in_oklab,var(--tint)_7%,var(--card))] p-5 @2xl:p-6'
    >
      <header className='flex items-center gap-3'>
        <span className='gem-plate inline-flex size-9 shrink-0 items-center justify-center rounded-lg'>
          <PerkMark perk={perk.id} className='size-5' />
        </span>
        <h3 className='text-sm font-medium'>{perk.title}</h3>
      </header>
      <p className='text-muted-foreground text-[13px] leading-relaxed text-pretty'>
        {perk.detail}
      </p>
      <div className='mt-auto flex flex-col gap-3'>
        <div className='flex flex-col gap-2'>
          <p className='flex items-baseline gap-1.5'>
            <MotionNumber value={claimed} className='text-3xl font-semibold' />
            <span className='text-muted-foreground text-[13px] tabular-nums'>
              of {perk.cap} claimed
            </span>
          </p>
          <div
            role='meter'
            aria-label={`${perk.title}: spots claimed`}
            aria-valuemin={0}
            aria-valuemax={perk.cap}
            aria-valuenow={claimed}
            className='bg-foreground/10 h-2 overflow-hidden rounded-full'
          >
            <span
              style={fillStyle}
              className={cn('block h-full rounded-full bg-(--tint)', eased)}
            />
          </div>
          <p className='text-muted-foreground flex items-baseline gap-1 text-xs'>
            <MotionNumber value={left} />
            left
          </p>
        </div>
        <Swap swapKey={phase} className='self-start'>
          {phase === 'open' && (
            <Button
              type='button'
              variant='outline'
              onClick={() => onClaim(perk.id)}
              className={pressedQuietOf(isPressed)}
            >
              Claim this perk
            </Button>
          )}
          {phase === 'claimed' && (
            <span className='text-success-foreground flex h-8 items-center gap-1.5 text-[13px] font-medium'>
              <DrawnCheck tone='success' entrance='draw' />
              Claimed
            </span>
          )}
          {phase === 'full' && (
            <Button type='button' variant='outline' disabled>
              All spots claimed
            </Button>
          )}
        </Swap>
      </div>
    </article>
  );
}
