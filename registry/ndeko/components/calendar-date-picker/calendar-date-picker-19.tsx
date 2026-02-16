'use client';

import { format } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import { ScrollArea } from '@/registry/ndeko/ui/scroll-area';

import { AnimatedCalendar } from './_parts/animated-calendar';

const TIME_SLOTS = [
  { time: '09:00', isAvailable: false },
  { time: '09:30', isAvailable: false },
  { time: '10:00', isAvailable: true },
  { time: '10:30', isAvailable: true },
  { time: '11:00', isAvailable: true },
  { time: '11:30', isAvailable: true },
  { time: '12:00', isAvailable: false },
  { time: '12:30', isAvailable: true },
  { time: '13:00', isAvailable: true },
  { time: '13:30', isAvailable: true },
  { time: '14:00', isAvailable: true },
  { time: '14:30', isAvailable: false },
  { time: '15:00', isAvailable: false },
  { time: '15:30', isAvailable: true },
  { time: '16:00', isAvailable: true },
  { time: '16:30', isAvailable: true },
  { time: '17:00', isAvailable: true },
  { time: '17:30', isAvailable: true },
];

function slotVariantOf(isPicked: boolean) {
  if (isPicked) {
    return 'default';
  }
  return 'outline';
}

export default function CalendarDatePicker19() {
  const [today] = useState(() => new Date());
  const [date, setDate] = useState(today);
  const [time, setTime] = useState<string | null>(null);

  function pickDay(day: Date | undefined) {
    if (!day) {
      return;
    }
    setDate(day);
    setTime(null);
  }

  return (
    <div className='bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex max-sm:flex-col'>
        <AnimatedCalendar
          mode='single'
          selected={date}
          onSelect={pickDay}
          className='p-2 sm:pe-5'
          disabled={[{ before: today }]}
        />
        <div className='relative w-full max-sm:h-48 sm:w-40'>
          <div className='max-sm:hairline-t border-border absolute inset-0 py-4'>
            <ScrollArea className='sm:hairline-l border-border h-full'>
              <div className='flex flex-col gap-3'>
                <p className='flex h-5 shrink-0 items-center px-5 text-sm font-medium'>
                  {format(date, 'EEEE, d')}
                </p>
                <div className='grid gap-1.5 px-5 max-sm:grid-cols-2'>
                  {TIME_SLOTS.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={slotVariantOf(time === slot.time)}
                      size='sm'
                      className='w-full tabular-nums'
                      onClick={() => setTime(slot.time)}
                      disabled={!slot.isAvailable}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
