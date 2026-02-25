'use client';
import { useRef } from 'react';
import { ScrollProgress } from '@/components/core/scroll-progress';

const ARTICLE = [
  'Harbor Lane started as a spreadsheet. Three volunteers kept the stall bookings for the Saturday market in one shared file, and every Friday night someone overwrote someone else.',
  'When the market grew to sixty stalls, the file stopped working. Traders called to ask whether their pitch was confirmed, and the answer was often a guess.',
  'We spent the first week watching. Léa sat at the welcome desk with a notebook and wrote down every question a trader asked before nine in the morning.',
  'Most questions were the same four: where is my pitch, can I swap with a neighbour, when do I pay, and who do I call if it rains.',
  'The new booking page answers those four questions on one screen. A trader sees the map of the street, their pitch in the brand colour and the neighbours on either side.',
  'Swapping became a request instead of a phone call. The other trader gets a message, accepts or declines, and the map updates for both of them.',
  'Payment moved to the end of the week. Kofi argued for it after noticing that most traders waited for the weather forecast before committing.',
  'The rain plan is a single switch for the organisers. When it is on, every trader gets the covered pitch assigned to them and a short note with the new time.',
  'We kept the spreadsheet as an export. The volunteers still like to print it on Saturday morning, and nothing about the new tool should take that away from them.',
  'Six weeks in, the Friday night calls have stopped. The welcome desk now hands out coffee instead of answers.',
];

const articleParagraphs = ARTICLE.map((paragraph) => (
  <p key={paragraph} className='text-muted-foreground pb-4 text-sm'>
    {paragraph}
  </p>
));

export function ScrollProgressBasic2() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className='h-[350px] overflow-auto px-8 pt-16 pb-4' ref={containerRef}>
      <div className='bg-card absolute top-0 left-0 z-10 h-10 w-full'>
        <ScrollProgress
          className='bg-foreground/[0.06] absolute top-0 h-10'
          containerRef={containerRef}
        />
        <div className='absolute top-0 left-0 flex h-10 items-center space-x-6 px-8 text-[13px] font-medium'>
          <a
            href='#'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            Magazine
          </a>
          <a
            href='#'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            Blog
          </a>
          <a
            href='#'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            About
          </a>
        </div>
      </div>
      {articleParagraphs}
    </div>
  );
}
