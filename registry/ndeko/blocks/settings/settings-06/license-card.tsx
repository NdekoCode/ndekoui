'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { Fragment, useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import {
  NEAR_LIMIT_SHARE,
  type License,
  type LicenseId,
  type LicenseStatus,
} from './data';
import { keyTextOf, type LicenseState } from './session';
import { SURFACE } from './settings-frame';

const MASK = '••••';

const ROLL_STAGGER_S = 0.06;

const ROLL_IN = { y: '0%', opacity: 1, filter: 'blur(0px)' };

const ROLL_BELOW = { y: '100%', opacity: 0, filter: 'blur(4px)' };

const ROLL_ABOVE = { y: '-100%', opacity: 0, filter: 'blur(4px)' };

const FADE_IN = { opacity: 1 };

const FADE_OUT = { opacity: 0 };

const STATUS_VARIANT: Record<LicenseStatus, 'success' | 'warning'> = {
  active: 'success',
  expiring: 'warning',
};

const REGENERATE_LABELS: Record<MorphState, string> = {
  idle: 'Regenerate key',
  busy: 'Regenerating',
  done: 'Regenerated',
};

type Tone = 'calm' | 'near';

const FILL_TONE: Record<Tone, string> = {
  calm: 'bg-primary',
  near: 'bg-warning',
};

const NOTE_TONE: Record<Tone, string> = {
  calm: 'text-muted-foreground',
  near: 'text-warning-foreground',
};

function rollOf(shouldReduceMotion: boolean, index: number) {
  const transition: Transition = {
    duration: 0.28,
    ease: EASE_OUT_STRONG,
    delay: index * ROLL_STAGGER_S,
  };
  if (shouldReduceMotion) {
    return { initial: FADE_OUT, animate: FADE_IN, exit: FADE_OUT, transition };
  }
  return {
    initial: ROLL_BELOW,
    animate: ROLL_IN,
    exit: ROLL_ABOVE,
    transition,
  };
}

/** The first and the last groups stay readable, so a hidden key can still be told apart. */
function shownGroupOf(
  group: string,
  index: number,
  count: number,
  isRevealed: boolean
) {
  const isEnd = index === 0 || index === count - 1;
  if (isRevealed || isEnd) {
    return group;
  }
  return MASK;
}

function GroupSlot({ text, index }: { text: string; index: number }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const roll = rollOf(shouldReduceMotion, index);

  return (
    <span className='relative inline-flex overflow-hidden'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span key={text} className='inline-block' {...roll}>
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function spokenKeyOf(groups: string[], isRevealed: boolean) {
  if (isRevealed) {
    return `Key ${keyTextOf(groups)}`;
  }
  const last = groups[groups.length - 1];
  return `Key hidden, ends with ${last}`;
}

/** Each group rolls on its own, a beat after the one before: shown, hidden or made anew. */
function KeyText({
  groups,
  isRevealed,
}: {
  groups: string[];
  isRevealed: boolean;
}) {
  const shown = groups.map((group, index) =>
    shownGroupOf(group, index, groups.length, isRevealed)
  );

  return (
    <span className='flex min-w-0 flex-wrap items-center font-mono text-[13px]'>
      <span className='sr-only'>{spokenKeyOf(groups, isRevealed)}</span>
      <span aria-hidden='true' className='flex flex-wrap items-center'>
        {shown.map((group, index) => (
          <Fragment key={`group-${index}`}>
            {index > 0 && (
              <span className='text-muted-foreground px-0.5'>-</span>
            )}
            <GroupSlot text={group} index={index} />
          </Fragment>
        ))}
      </span>
    </span>
  );
}

function toneOf(used: number, limit: number): Tone {
  const share = used / limit;
  if (share >= NEAR_LIMIT_SHARE) {
    return 'near';
  }
  return 'calm';
}

function countOf(count: number, words: { one: string; many: string }) {
  if (count === 1) {
    return `1 ${words.one}`;
  }
  return `${count} ${words.many}`;
}

function meterNoteOf(license: License, isFresh: boolean) {
  const left = license.limit - license.used;
  const isFull = left <= 0;
  if (isFresh && license.used === 0) {
    return `Every ${license.holders.one} signs in again with the new key`;
  }
  if (isFull) {
    return `All ${countOf(license.limit, license.unit)} in use: one more ${license.holders.one} cannot start`;
  }
  return `${countOf(left, license.unit)} left`;
}

function SeatMeter({
  license,
  isFresh,
}: {
  license: License;
  isFresh: boolean;
}) {
  const tone = toneOf(license.used, license.limit);
  const share = license.used / license.limit;
  const fillStyle = { transform: `scaleX(${share})` };
  const note = meterNoteOf(license, isFresh);
  const label = license.meterLabel;
  const spokenValue = `${license.used} of ${license.limit} ${license.unit.many} in use`;

  return (
    <div className='flex flex-col gap-1.5'>
      <p className='flex items-baseline justify-between gap-3 text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='tabular-nums'>
          <MotionNumber value={license.used} />
          <span className='text-muted-foreground'> of {license.limit}</span>
        </span>
      </p>
      <div
        role='meter'
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={license.limit}
        aria-valuenow={license.used}
        aria-valuetext={spokenValue}
        className='bg-foreground/10 h-1.5 overflow-hidden rounded-full'
      >
        <span
          style={fillStyle}
          className={cn(
            'block h-full origin-left rounded-full transition-[transform,background-color] duration-500 ease-(--ease-out-strong) rtl:origin-right',
            FILL_TONE[tone]
          )}
        />
      </div>
      <p className={cn('text-xs text-pretty', NOTE_TONE[tone])}>
        <Swap swapKey={note}>{note}</Swap>
      </p>
    </div>
  );
}

function holdersLineOf(license: License) {
  if (license.used === 0) {
    return `No ${license.holders.one} uses it yet, so none has to sign in again.`;
  }
  const holders = countOf(license.used, license.holders);
  return `The ${holders} using it ask for the new one.`;
}

type RegenerateConfirmProps = {
  license: License;
  pressed: string | null;
  onKeep: () => void;
  onConfirm: (id: LicenseId) => void;
};

function RegenerateConfirm({
  license,
  pressed,
  onKeep,
  onConfirm,
}: RegenerateConfirmProps) {
  const holdersLine = holdersLineOf(license);

  function keepOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    onKeep();
  }

  return (
    <div
      role='group'
      aria-label={`Regenerate the key for ${license.product}`}
      onKeyDown={keepOnEscape}
      className='bg-destructive/[0.06] flex flex-col gap-3 rounded-lg p-3'
    >
      <p className='text-[13px] text-pretty'>
        <span className='font-medium'>The old key stops working at once.</span>{' '}
        {holdersLine}
      </p>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-keep-key={license.id}
          onClick={onKeep}
        >
          Keep this key
        </Button>
        <Button
          type='button'
          variant='destructive'
          size='sm'
          onClick={() => onConfirm(license.id)}
          className={pressedSolidOf(pressed === `confirm-${license.id}`)}
        >
          Regenerate key
        </Button>
      </div>
    </div>
  );
}

function termLineOf(license: License, isFresh: boolean) {
  if (isFresh) {
    return 'New key made just now. The old one no longer works';
  }
  return `Issued ${license.issuedOn} · ${license.termLine}`;
}

function revealLabelOf(isRevealed: boolean, product: string) {
  if (isRevealed) {
    return `Hide the key for ${product}`;
  }
  return `Show the key for ${product}`;
}

function copyLabelOf(isCopied: boolean, product: string) {
  if (isCopied) {
    return 'Copied';
  }
  return `Copy the key for ${product}`;
}

function regenerateStateOf(isRegenerating: boolean): MorphState {
  if (isRegenerating) {
    return 'busy';
  }
  return 'idle';
}

type LicenseCardProps = {
  license: License;
  state: LicenseState;
  pressed: string | null;
  onReveal: (id: LicenseId) => void;
  onCopy: (license: License) => void;
  onRegenerate: (id: LicenseId) => void;
  onKeep: () => void;
  onConfirm: (id: LicenseId) => void;
};

export function LicenseCard({
  license,
  state,
  pressed,
  onReveal,
  onCopy,
  onRegenerate,
  onKeep,
  onConfirm,
}: LicenseCardProps) {
  const titleId = useId();
  const id = license.id;
  const isRevealed = state.revealedIds.includes(id);
  const isCopied = state.copiedId === id;
  const isConfirming = state.confirmingId === id;
  const isRegenerating = state.regeneratingId === id;
  const isFresh = state.freshIds.includes(id);
  const termLine = termLineOf(license, isFresh);

  return (
    <article
      aria-labelledby={titleId}
      className={cn(SURFACE, 'flex flex-col gap-4 p-4 @xl:p-5')}
    >
      <header className='flex items-start gap-3'>
        <CompanyMark seed={license.product} size='lg' />
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <h3 id={titleId} className='text-sm font-medium'>
            {license.product}
          </h3>
          <p className='text-muted-foreground text-xs'>{license.plan}</p>
        </div>
        <Badge variant={STATUS_VARIANT[license.status]}>
          {license.statusLabel}
        </Badge>
      </header>
      <div className='flex flex-col gap-2'>
        <div className='bg-foreground/[0.04] flex items-center gap-2 rounded-lg py-1 ps-3 pe-1'>
          <KeyText groups={license.groups} isRevealed={isRevealed} />
          <span className='ms-auto flex shrink-0 items-center'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={revealLabelOf(isRevealed, license.product)}
              onClick={() => onReveal(id)}
              className={cn(
                'text-muted-foreground',
                pressedQuietOf(pressed === `reveal-${id}`)
              )}
            >
              <Swap swapKey={String(isRevealed)}>
                {isRevealed && <EyeOffIcon />}
                {!isRevealed && <EyeIcon />}
              </Swap>
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={copyLabelOf(isCopied, license.product)}
              onClick={() => onCopy(license)}
              className={cn(
                'text-muted-foreground',
                pressedQuietOf(pressed === `copy-${id}`)
              )}
            >
              <Swap swapKey={String(isCopied)}>
                {isCopied && <CheckIcon />}
                {!isCopied && <CopyIcon />}
              </Swap>
            </Button>
          </span>
        </div>
        <p className='text-muted-foreground flex text-xs'>
          <Swap swapKey={termLine}>{termLine}</Swap>
        </p>
      </div>
      <SeatMeter license={license} isFresh={isFresh} />
      <div className='flex flex-col gap-3'>
        <div className='flex justify-end'>
          <MorphButton
            type='button'
            variant='outline'
            size='sm'
            data-regenerate={id}
            aria-expanded={isConfirming}
            state={regenerateStateOf(isRegenerating)}
            labels={REGENERATE_LABELS}
            onClick={() => onRegenerate(id)}
            className={pressedQuietOf(pressed === `regenerate-${id}`)}
          />
        </div>
        <Fold open={isConfirming}>
          <RegenerateConfirm
            license={license}
            pressed={pressed}
            onKeep={onKeep}
            onConfirm={onConfirm}
          />
        </Fold>
      </div>
    </article>
  );
}
