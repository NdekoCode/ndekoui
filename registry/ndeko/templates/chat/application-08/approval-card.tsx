'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CircleXIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Spinner } from '@/registry/ndeko/ui/spinner';
import { Wash } from '@/registry/ndeko/ui/wash';

import { DECLINED_LINE, FORWARDER_CONTACT, REQUEST } from './data';
import type { Decision, RequestView } from './session';

type RequestBodyProps = {
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

function RequestBody({ pressed, onDecide }: RequestBodyProps) {
  const titleId = useId();
  const keysId = useId();

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
      className='focus-visible:ring-ring/25 relative isolate flex flex-col gap-3 rounded-xl p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
    >
      <Wash color='var(--warning)' />
      <div className='flex items-center gap-2.5'>
        <BrandTile brand='googledrive' size='lg' title='Google Drive' />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <h2 id={titleId} className='text-sm font-medium'>
            Read a file shared with you
          </h2>
          <span className='text-muted-foreground truncate text-xs'>
            {REQUEST.file}
          </span>
        </div>
        <Badge variant='warning' className='hidden @md:inline-flex'>
          Waiting on you
        </Badge>
      </div>
      <dl className='bg-foreground/[0.04] flex flex-col gap-2 rounded-lg p-2.5 text-xs'>
        <div className='flex items-center gap-2'>
          <dt className='text-muted-foreground w-14 shrink-0'>Owner</dt>
          <dd className='flex min-w-0 items-center gap-1.5'>
            <Avatar seed={FORWARDER_CONTACT.name} className='size-5' />
            <span className='min-w-0 truncate'>
              {FORWARDER_CONTACT.name}
              <span className='text-muted-foreground'>
                , {FORWARDER_CONTACT.role}
              </span>
            </span>
          </dd>
        </div>
        <div className='flex gap-2'>
          <dt className='text-muted-foreground w-14 shrink-0'>Access</dt>
          <dd className='min-w-0'>{REQUEST.access}</dd>
        </div>
        <div className='flex gap-2'>
          <dt className='text-muted-foreground w-14 shrink-0'>Why</dt>
          <dd className='min-w-0'>{REQUEST.reason}</dd>
        </div>
      </dl>
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

function ResultGlyph({ view }: { view: RequestView }) {
  if (view === 'reading') {
    return <Spinner aria-hidden='true' />;
  }
  if (view === 'read') {
    return <DrawnCheck tone='success' entrance='draw' />;
  }
  return <CircleXIcon className='text-muted-foreground size-4 shrink-0' />;
}

function resultLineOf(view: RequestView) {
  if (view === 'reading') {
    return 'Reading the rate sheet';
  }
  if (view === 'read') {
    return 'Allowed. The rate sheet was read, with two quotes in it';
  }
  if (view === 'denied') {
    return DECLINED_LINE;
  }
  return 'Not answered. The run was stopped before the sheet was read';
}

function ResultLine({ view }: { view: RequestView }) {
  return (
    <div className='flex min-h-11 items-start gap-2.5 p-3 text-[13px] leading-5'>
      <Swap swapKey={view} className='mt-px'>
        <ResultGlyph view={view} />
      </Swap>
      <p
        key={view}
        className='min-w-0 transition-opacity duration-300 starting:opacity-0'
      >
        {resultLineOf(view)}
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

type ApprovalCardProps = RequestBodyProps & {
  view: RequestView;
};

export function ApprovalCard({ view, pressed, onDecide }: ApprovalCardProps) {
  const fade = fadePresence();
  const isAsking = view === 'asking';

  return (
    <section
      data-request
      tabIndex={-1}
      aria-label='Request to read the rate sheet'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-300 outline-none starting:opacity-0'
    >
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={viewKeyOf(isAsking)} {...fade}>
            {isAsking && <RequestBody pressed={pressed} onDecide={onDecide} />}
            {!isAsking && <ResultLine view={view} />}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
    </section>
  );
}
