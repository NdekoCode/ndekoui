'use client';
import { useId, useState } from 'react';
import { SmoothScroll } from '@/components/core/smooth-scroll';
import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

const PARAGRAPHS = [
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

export function SmoothScrollCompare() {
  const switchId = useId();
  const [isSmooth, setIsSmooth] = useState(true);

  return (
    <div className='flex w-full flex-col'>
      <div className='flex items-center justify-between gap-4 px-6 pt-5 pb-3'>
        <p className='text-muted-foreground text-xs'>
          Use a mouse wheel over the text
        </p>
        <div className='inline-flex items-center gap-2'>
          <Switch
            id={switchId}
            checked={isSmooth}
            onCheckedChange={setIsSmooth}
          />
          <Label htmlFor={switchId}>Smooth wheel</Label>
        </div>
      </div>
      <SmoothScroll enabled={isSmooth} className='h-[360px] px-6 pb-8'>
        <article className='mx-auto flex max-w-md flex-col gap-4 pt-4'>
          <h3 className='text-foreground text-xl font-semibold text-balance'>
            Six weeks at Harbor Lane
          </h3>
          {PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className='text-muted-foreground text-sm'>
              {paragraph}
            </p>
          ))}
        </article>
      </SmoothScroll>
    </div>
  );
}
