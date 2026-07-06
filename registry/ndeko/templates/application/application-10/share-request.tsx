'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CircleXIcon, ShareIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Spinner } from '@/registry/ndeko/ui/spinner';

import {
  KEPT_LINE,
  MEMO_TITLE,
  RECEIVERS,
  SHARED_LINE,
  type Person,
} from './data';
import type { Decision, Stage } from './session';

export function peopleOf(count: number) {
  if (count === 1) {
    return '1 person';
  }
  return `${count} people`;
}

function Receiver({ person }: { person: Person }) {
  return (
    <li className='flex items-center gap-2.5'>
      <Avatar className='size-6' seed={person.name} />
      <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
        {person.name}
      </span>
      <span className='text-muted-foreground shrink-0 text-xs'>
        {person.role}
      </span>
    </li>
  );
}

type RequestBodyProps = {
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

function RequestBody({ pressed, onDecide }: RequestBodyProps) {
  const titleId = useId();
  const keysId = useId();
  const people = peopleOf(RECEIVERS.length);

  function allow() {
    onDecide('approved');
  }

  function deny() {
    onDecide('denied');
  }

  function decideFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      deny();
      return;
    }
    const isOnCard = event.target === event.currentTarget;
    const isEnter = event.key === 'Enter';
    if (isEnter && isOnCard) {
      event.preventDefault();
      allow();
    }
  }

  return (
    <div
      role='group'
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={keysId}
      onKeyDown={decideFromKeys}
      className='focus-visible:ring-ring/25 flex flex-col gap-3 rounded-xl p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
    >
      <div className='flex items-center gap-2.5'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <ShareIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h2 id={titleId} className='text-sm font-medium'>
            Share the memo with {people}
          </h2>
          <span className='text-muted-foreground truncate text-xs'>
            {MEMO_TITLE}
          </span>
        </div>
        <Badge variant='warning' className='hidden @md:inline-flex'>
          Waiting on you
        </Badge>
      </div>
      <ul
        aria-label='Who will receive it'
        className='bg-foreground/[0.04] flex flex-col gap-2 rounded-lg p-2.5'
      >
        {RECEIVERS.map((person) => (
          <Receiver key={person.id} person={person} />
        ))}
      </ul>
      <p className='text-muted-foreground text-xs leading-5'>
        Each of them gets a link and can comment. Nothing is sent before you
        allow it.
      </p>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          onClick={allow}
          className={pressedSolidOf(pressed === 'allow')}
        >
          Allow
          <Kbd className='ms-0.5'>Enter</Kbd>
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={deny}>
          Deny
          <Kbd className='ms-0.5'>Esc</Kbd>
        </Button>
        <span id={keysId} className='sr-only'>
          Enter allows, Escape denies
        </span>
      </div>
    </div>
  );
}

function ResultGlyph({ stage }: { stage: Stage }) {
  if (stage === 'sharing') {
    return <Spinner aria-hidden='true' />;
  }
  if (stage === 'kept') {
    return <CircleXIcon className='text-muted-foreground size-4 shrink-0' />;
  }
  return <DrawnCheck tone='success' entrance='draw' />;
}

function resultLineOf(stage: Stage) {
  if (stage === 'sharing') {
    return 'Sharing the memo';
  }
  if (stage === 'kept') {
    return KEPT_LINE;
  }
  return SHARED_LINE;
}

function ResultLine({ stage }: { stage: Stage }) {
  return (
    <div className='flex min-h-11 items-start gap-2.5 p-3 text-[13px] leading-5'>
      <Swap swapKey={stage} className='mt-px'>
        <ResultGlyph stage={stage} />
      </Swap>
      <p
        key={stage}
        className='min-w-0 transition-opacity duration-300 starting:opacity-0'
      >
        {resultLineOf(stage)}
      </p>
    </div>
  );
}

function viewKeyOf(isAsking: boolean) {
  if (isAsking) {
    return 'request';
  }
  return 'result';
}

type ShareRequestProps = RequestBodyProps & {
  stage: Stage;
};

/** The request resizes into one line that keeps a trace of what the person decided. */
export function ShareRequest({ stage, pressed, onDecide }: ShareRequestProps) {
  const fade = fadePresence();
  const isAsking = stage === 'asking';

  return (
    <section
      data-request
      tabIndex={-1}
      aria-label='Request to share the memo'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-300 outline-none starting:opacity-0'
    >
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={viewKeyOf(isAsking)} {...fade}>
            {isAsking && <RequestBody pressed={pressed} onDecide={onDecide} />}
            {!isAsking && <ResultLine stage={stage} />}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
    </section>
  );
}
