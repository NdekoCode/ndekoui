'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { QuoteIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { QUOTES, SECTION, type ThemeChoice } from './data';
import { QuoteCard } from './quote-card';
import { spokenLineOf, ThemePicker } from './theme-picker';

const DEMO_THEMES: ThemeChoice[] = ['replies', 'handoffs', 'setup', 'all'];

const FIRST_PICK_MS = 2200;

const READ_MS = 3400;

const LOOP_AFTER_MS = 2600;

function delayBeforePick(index: number) {
  if (index === 0) {
    return FIRST_PICK_MS;
  }
  return READ_MS;
}

export default function Testimonials01() {
  const [theme, setTheme] = useState<ThemeChoice>('all');
  const [message, setMessage] = useState('');
  const { pressed, press } = usePress<ThemeChoice>();

  const steps = DEMO_THEMES.flatMap((choice, index) => [
    { after: delayBeforePick(index), run: () => press(choice) },
    { after: PRESS_LEAD_MS, run: () => setTheme(choice) },
  ]);
  const { ref } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: () => setTheme('all'),
  });

  function pick(choice: ThemeChoice) {
    setTheme(choice);
    setMessage(spokenLineOf(choice));
  }

  return (
    <section ref={ref} className='@container'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex max-w-2xl flex-col gap-3'>
          <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
            <QuoteIcon className='size-4' />
            {SECTION.label}
          </p>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.lead}
          </p>
        </header>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <ThemePicker value={theme} pressed={pressed} onValueChange={pick} />
            <Badge variant='secondary'>Sample quotes</Badge>
          </div>
          <div className='columns-1 gap-4 *:mb-4 *:break-inside-avoid @xl:columns-2 @4xl:columns-3'>
            {QUOTES.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} theme={theme} />
            ))}
          </div>
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
