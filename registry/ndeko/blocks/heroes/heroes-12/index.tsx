'use client';

import { useMemo, useState } from 'react';

import {
  type AutoplayStep,
  typingSteps,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { AgentFace } from './agent-face';
import { HERO, INITIAL_VIEW, PHRASES, type PhraseView } from './data';
import { TypedPhrase } from './typed-phrase';

const HOLD_MS = 1800;
const ERASE_MS = 22;
const BEFORE_TYPING_MS = 350;
const TYPE_MS = 55;

const FACE = <AgentFace />;

const SPOKEN_PHRASES = PHRASES.join(', ');

type ShowView = (view: PhraseView) => void;

function erasingSteps(index: number, show: ShowView): AutoplayStep[] {
  const prefixes = prefixesOf(PHRASES[index]);
  const shorter = prefixes.slice(0, -1);
  const remaining = [...shorter.reverse(), ''];
  return remaining.map((typed, position) => {
    const after = keyDelayOf(position, HOLD_MS, ERASE_MS);
    return { after, run: () => show({ index, typed }) };
  });
}

function writingSteps(index: number, show: ShowView): AutoplayStep[] {
  const options = { startAfter: BEFORE_TYPING_MS, characterMs: TYPE_MS };
  return typingSteps(
    PHRASES[index],
    (typed) => show({ index, typed }),
    options
  );
}

/** Each phrase is erased and the next one typed; the last one types the first again, so a round ends where it began. */
function phraseSteps(show: ShowView): AutoplayStep[] {
  const rounds = PHRASES.map((_, index) => {
    const next = (index + 1) % PHRASES.length;
    return [...erasingSteps(index, show), ...writingSteps(next, show)];
  });
  return rounds.flat();
}

function shownTextOf(isAutoplaying: boolean, typed: string, phrase: string) {
  if (isAutoplaying) {
    return typed;
  }
  return phrase;
}

export default function Heroes12() {
  const [view, setView] = useState<PhraseView>(INITIAL_VIEW);

  function startOver() {
    setView(INITIAL_VIEW);
  }

  const steps = useMemo(() => phraseSteps(setView), []);
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 0,
    onReset: startOver,
  });
  const phrase = PHRASES[view.index];
  const typed = shownTextOf(isAutoplaying, view.typed, phrase);

  return (
    <section className='@container'>
      <div ref={ref} className='relative isolate'>
        <Wash className='h-[26rem]' />
        <div className='mx-auto grid max-w-5xl items-center gap-8 px-4 py-16 @2xl:px-6 @2xl:py-24 @3xl:grid-cols-[auto_minmax(0,1fr)] @3xl:gap-14'>
          {FACE}
          <div className='flex min-w-0 flex-col items-start gap-6'>
            <h1 className='text-4xl font-semibold text-balance @2xl:text-5xl @4xl:text-6xl'>
              {HERO.titleStart}{' '}
              <span className='sr-only'>{SPOKEN_PHRASES}</span>
              <span className='block'>
                <TypedPhrase
                  phrase={phrase}
                  typed={typed}
                  hasCaret={isAutoplaying}
                  isLive={isInView}
                />
              </span>
            </h1>
            <p className='text-muted-foreground max-w-xl text-base text-pretty'>
              {HERO.description}
            </p>
            <div className='flex flex-wrap gap-2'>
              <Button size='lg' nativeButton={false} render={<a href='#' />}>
                {HERO.primaryAction}
                <ArrowRightIcon />
              </Button>
              <Button
                size='lg'
                variant='outline'
                nativeButton={false}
                render={<a href='#' />}
              >
                {HERO.secondaryAction}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
