'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { TrendingDownIcon, TrendingUpIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { StreamedInk } from '@/registry/ndeko/ui/streamed-text';
import { Wash } from '@/registry/ndeko/ui/wash';

import { CUSTOMERS, type Customer } from './testimonials-data';

const RESULT_LABELS = CUSTOMERS.map((customer) => customer.result.label);

const PERCENT_SUFFIX = '%';

const WORD_MS = 38;

const FADE_IN =
  'transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0';

/** The quote a visitor reaches first is already written: only a quote that replaced another one arrives. */
function arrivalOf(isStreamed: boolean) {
  if (isStreamed) {
    return FADE_IN;
  }
  return undefined;
}

/** Under reduced motion a new quote fades in whole instead of word by word. */
function wholeQuoteFadeOf(isStreamed: boolean, shouldReduceMotion: boolean) {
  if (!shouldReduceMotion) {
    return undefined;
  }
  return arrivalOf(isStreamed);
}

type FeaturedResultProps = {
  customer: Customer;
  /** The place of the customer in the list, so the label rolls in the direction of the change. */
  position: number;
  isStreamed: boolean;
};

export function FeaturedResult({
  customer,
  position,
  isStreamed,
}: FeaturedResultProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const { person, result } = customer;
  const isUp = result.trend === 'up';
  const isWordByWord = isStreamed && !shouldReduceMotion;

  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] relative isolate grid grid-cols-1 gap-8 rounded-2xl p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @2xl:p-8 @3xl:grid-cols-[minmax(0,1fr)_17rem] @3xl:gap-12'>
      <Wash />
      <figure className='flex flex-col justify-between gap-8'>
        <blockquote className='grid text-lg leading-8 font-medium text-pretty *:col-start-1 *:row-start-1 @3xl:text-xl @3xl:leading-8'>
          {CUSTOMERS.map((candidate) => (
            <p key={candidate.id} aria-hidden='true' className='invisible'>
              {candidate.long}
            </p>
          ))}
          <p
            key={customer.id}
            className={wholeQuoteFadeOf(isStreamed, shouldReduceMotion)}
          >
            <StreamedInk
              text={customer.long}
              isStreaming={isWordByWord}
              wordMs={WORD_MS}
            />
          </p>
        </blockquote>
        <figcaption
          key={customer.id}
          className={cn('flex items-center gap-3', arrivalOf(isStreamed))}
        >
          <Avatar seed={person.name} className='size-10' />
          <span className='flex min-w-0 flex-1 flex-col'>
            <span className='truncate text-sm font-medium'>{person.name}</span>
            <span className='text-muted-foreground truncate text-[13px]'>
              {person.role}, {customer.company}
            </span>
          </span>
          <CompanyMark seed={customer.company} size='lg' />
        </figcaption>
      </figure>
      <div className='bg-foreground/[0.04] flex flex-col justify-between gap-6 rounded-xl p-5'>
        <span className='text-muted-foreground text-xs'>
          The number that moved
        </span>
        <div className='flex flex-col gap-2'>
          <MotionNumber
            value={result.percent}
            suffix={PERCENT_SUFFIX}
            className='text-5xl font-semibold'
          />
          <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
            <Swap swapKey={result.trend} className='text-success-foreground'>
              {isUp && <TrendingUpIcon className='size-4' />}
              {!isUp && <TrendingDownIcon className='size-4' />}
            </Swap>
            <WordRoll
              text={result.label}
              labels={RESULT_LABELS}
              value={position}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
