'use client';

import { addDays, format } from 'date-fns';
import { createContext, useContext, useState } from 'react';
import { DayButton, type DayButtonProps } from 'react-day-picker';

import { cn } from '@/registry/ndeko/lib/utils';

import { AnimatedCalendar } from './_parts/animated-calendar';

const GOOD_PRICE_THRESHOLD = 100;
const PRICED_DAYS = 180;
const LOWEST_PRICE = 80;
const PRICE_SPREAD = 121;
const DATE_KEY = 'yyyy-MM-dd';

const PRICING_CLASS_NAMES = {
  months: 'gap-8 sm:flex-col md:flex-row',
  month: [
    'relative before:absolute before:bg-border first-of-type:before:hidden',
    'max-md:before:inset-x-2 max-md:before:-top-4 max-md:before:h-(--hairline)',
    'md:before:inset-y-2 md:before:-left-4 md:before:w-(--hairline)',
  ].join(' '),
  weekday: 'w-12',
  day_button: 'size-12',
  today: '*:after:hidden',
};

type Prices = Record<string, number>;

const PricesContext = createContext<Prices>({});

function priceOfDay(dayIndex: number) {
  const wave = Math.sin(dayIndex * 12.9898) * 43758.5453;
  const fraction = wave - Math.floor(wave);
  const offset = Math.floor(fraction * PRICE_SPREAD);
  return LOWEST_PRICE + offset;
}

function buildPrices(): Prices {
  const today = new Date();
  const prices: Prices = {};
  for (let dayIndex = 0; dayIndex < PRICED_DAYS; dayIndex++) {
    const day = addDays(today, dayIndex);
    const key = format(day, DATE_KEY);
    prices[key] = priceOfDay(dayIndex);
  }
  return prices;
}

function PricedDayButton({ children, ...props }: DayButtonProps) {
  const prices = useContext(PricesContext);
  const price = prices[format(props.day.date, DATE_KEY)];
  const hasPrice = price !== undefined;
  const isGoodPrice = price < GOOD_PRICE_THRESHOLD;

  return (
    <DayButton {...props}>
      <span className='flex flex-col'>
        {children}
        {hasPrice && (
          <span
            className={cn(
              'text-muted-foreground group-data-selected:text-primary-foreground/70 text-[10px] font-medium tabular-nums',
              isGoodPrice &&
                'text-success-foreground group-data-selected:text-primary-foreground'
            )}
          >
            ${price}
          </span>
        )}
      </span>
    </DayButton>
  );
}

export default function CalendarDatePicker24() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [prices] = useState(buildPrices);

  function isUnpriced(day: Date) {
    return prices[format(day, DATE_KEY)] === undefined;
  }

  return (
    <PricesContext.Provider value={prices}>
      <AnimatedCalendar
        mode='single'
        selected={date}
        onSelect={setDate}
        numberOfMonths={2}
        pagedNavigation
        showOutsideDays={false}
        className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        classNames={PRICING_CLASS_NAMES}
        components={{ DayButton: PricedDayButton }}
        disabled={isUnpriced}
      />
    </PricesContext.Provider>
  );
}
