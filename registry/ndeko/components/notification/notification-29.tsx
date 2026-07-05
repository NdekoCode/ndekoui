'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArrowUpRightIcon,
  RotateCcwIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb, type StatusOrbTone } from '@/registry/ndeko/ui/status-orb';

import { rowCollapseOf } from './_parts/collapse';

type ToneCard = {
  id: string;
  tone: StatusOrbTone;
  color: string;
  title: string;
  description: string;
  action: string;
};

const CARDS: ToneCard[] = [
  {
    id: 'paid',
    tone: 'success',
    color: 'var(--success)',
    title: 'Invoice 2041 is paid',
    description:
      'Fernhall Studio settled the March invoice. The receipt is in Billing.',
    action: 'View receipt',
  },
  {
    id: 'sync',
    tone: 'error',
    color: 'var(--destructive)',
    title: 'Calendar sync stopped',
    description:
      'The connection to your work calendar expired. Plans after Friday are not imported.',
    action: 'Reconnect calendar',
  },
  {
    id: 'sign-in',
    tone: 'info',
    color: 'var(--info)',
    title: 'New sign-in on a laptop',
    description:
      'Someone signed in from Lisbon at 08:12. If it was not you, end that session.',
    action: 'Review sessions',
  },
];

function ToneNotice({
  card,
  onDismiss,
}: {
  card: ToneCard;
  onDismiss: (cardId: string) => void;
}) {
  const toneStyle = { '--tone': card.color } as React.CSSProperties;

  return (
    <div
      role='status'
      style={toneStyle}
      className='bg-card hairline-ring relative isolate flex items-start gap-3 overflow-hidden rounded-2xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-[color-mix(in_oklab,var(--tone)_28%,var(--border))]'
    >
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_140%_at_0%_0%,color-mix(in_oklab,var(--tone)_11%,transparent),transparent_55%)]'
      />
      <StatusOrb tone={card.tone} />
      <div className='flex min-w-0 flex-1 flex-col gap-2 pt-1'>
        <div className='flex flex-col gap-0.5 text-[13px] leading-5'>
          <p className='font-medium'>{card.title}</p>
          <p className='text-muted-foreground'>{card.description}</p>
        </div>
        <div>
          <Button variant='link' size='sm' className='h-auto px-0 text-[13px]'>
            {card.action}
            <ArrowUpRightIcon />
          </Button>
        </div>
      </div>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Dismiss: ${card.title}`}
        onClick={() => onDismiss(card.id)}
        className='text-muted-foreground -me-1.5 -mt-1.5'
      >
        <XIcon />
      </Button>
    </div>
  );
}

export default function Notification29() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [cards, setCards] = useState(CARDS);
  const isEmpty = cards.length === 0;
  const collapse = rowCollapseOf(shouldReduceMotion);

  function dismiss(cardId: string) {
    setCards((current) => current.filter((card) => card.id !== cardId));
  }

  function restore() {
    setCards(CARDS);
  }

  return (
    <div className='-mx-1 -mt-1 -mb-2 flex w-full max-w-[26rem] flex-col'>
      <AnimatePresence initial={false}>
        {cards.map((card) => (
          <motion.div
            key={card.id}
            variants={collapse}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='overflow-hidden'
          >
            <div className='px-1 pt-1 pb-2'>
              <ToneNotice card={card} onDismiss={dismiss} />
            </div>
          </motion.div>
        ))}
        {isEmpty && (
          <motion.div
            key='empty'
            variants={collapse}
            initial='hidden'
            animate='shown'
            exit='hidden'
            className='overflow-hidden'
          >
            <div className='flex flex-col items-center gap-3 px-1 pt-6 pb-8 text-center'>
              <p className='text-muted-foreground text-[13px]'>
                Every notice is cleared
              </p>
              <Button size='sm' variant='outline' onClick={restore}>
                <RotateCcwIcon />
                Show them again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
