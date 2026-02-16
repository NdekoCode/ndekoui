import { addDays } from 'date-fns';

import { AnimatedCalendar } from './_parts/animated-calendar';

export default function CalendarDatePicker06() {
  const today = new Date();
  const closedDays = [
    { before: today },
    today,
    { dayOfWeek: [0, 6] },
    { from: addDays(today, 14), to: addDays(today, 16) },
    { from: addDays(today, 23), to: addDays(today, 24) },
  ];

  return (
    <AnimatedCalendar
      mode='range'
      disabled={closedDays}
      excludeDisabled
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    />
  );
}
