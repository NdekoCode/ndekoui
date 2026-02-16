'use client';

import {
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  format,
  isAfter,
  isBefore,
  startOfYear,
} from 'date-fns';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { CaptionLabelProps, MonthGridProps } from 'react-day-picker';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/ndeko/ui/collapsible';
import { ScrollArea } from '@/registry/ndeko/ui/scroll-area';

import { AnimatedCalendar } from './_parts/animated-calendar';

const START_MONTH = new Date(1980, 6);
const END_MONTH = new Date(2030, 6);
const YEARS = eachYearOfInterval({
  start: startOfYear(START_MONTH),
  end: endOfYear(END_MONTH),
});
const FOCUS_DELAY_MS = 100;

type YearViewState = {
  isYearView: boolean;
  toggleYearView: () => void;
  currentYear: number;
  currentMonth: number;
  selectMonth: (month: Date) => void;
};

const YearViewContext = createContext<YearViewState | null>(null);

function useYearView() {
  const state = useContext(YearViewContext);
  if (!state) {
    throw new Error('The year view parts must sit inside its provider.');
  }
  return state;
}

function refWhen<T>(isTarget: boolean, ref: React.RefObject<T | null>) {
  if (isTarget) {
    return ref;
  }
  return undefined;
}

function monthVariantOf(isCurrentMonth: boolean) {
  if (isCurrentMonth) {
    return 'default';
  }
  return 'outline';
}

function isOutsideRange(month: Date) {
  const isTooEarly = isBefore(month, START_MONTH);
  const isTooLate = isAfter(month, END_MONTH);
  return isTooEarly || isTooLate;
}

function monthsOf(year: Date) {
  return eachMonthOfInterval({
    start: startOfYear(year),
    end: endOfYear(year),
  });
}

function YearViewCaption({ children }: CaptionLabelProps) {
  const { isYearView, toggleYearView } = useYearView();

  return (
    <Button
      variant='ghost'
      size='sm'
      className='-ms-2 text-[13px] font-medium'
      aria-expanded={isYearView}
      onClick={toggleYearView}
    >
      {children}
      <ChevronDownIcon
        className={cn(
          'text-muted-foreground shrink-0 transition-transform duration-200',
          isYearView && 'rotate-180'
        )}
      />
    </Button>
  );
}

function YearSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className='hairline-t border-border px-2 py-1.5'
    >
      <CollapsibleTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            className='w-full justify-start text-[13px] font-medium [&[data-panel-open]>svg]:rotate-180'
          />
        }
      >
        <ChevronDownIcon className='text-muted-foreground shrink-0 transition-transform duration-200' />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='grid grid-cols-3 gap-2 px-3 py-1'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function YearList() {
  const { currentYear, currentMonth, selectMonth } = useYearView();
  const listRef = useRef<HTMLDivElement>(null);
  const currentYearRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const viewport = listRef.current?.querySelector<HTMLElement>(
      '[data-slot=scroll-area-viewport]'
    );
    const yearElement = currentYearRef.current;
    if (viewport && yearElement) {
      viewport.scrollTop = yearElement.offsetTop;
    }
    const focusTimer = window.setTimeout(() => {
      currentMonthRef.current?.focus();
    }, FOCUS_DELAY_MS);
    return () => window.clearTimeout(focusTimer);
  }, []);

  return (
    <div ref={listRef} className='bg-card absolute inset-0 z-20 -mx-2 -mb-2'>
      <ScrollArea className='h-full'>
        {YEARS.map((year) => {
          const yearNumber = year.getFullYear();
          const isCurrentYear = yearNumber === currentYear;

          return (
            <div key={yearNumber} ref={refWhen(isCurrentYear, currentYearRef)}>
              <YearSection
                title={String(yearNumber)}
                defaultOpen={isCurrentYear}
              >
                {monthsOf(year).map((month) => {
                  const isSameMonthNumber = month.getMonth() === currentMonth;
                  const isCurrentMonth = isSameMonthNumber && isCurrentYear;

                  return (
                    <Button
                      key={month.getTime()}
                      ref={refWhen(isCurrentMonth, currentMonthRef)}
                      variant={monthVariantOf(isCurrentMonth)}
                      size='sm'
                      disabled={isOutsideRange(month)}
                      onClick={() => selectMonth(month)}
                    >
                      {format(month, 'MMM')}
                    </Button>
                  );
                })}
              </YearSection>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}

function YearViewGrid({ children, ...props }: MonthGridProps) {
  const { isYearView } = useYearView();

  return (
    <div className='relative'>
      <table {...props}>{children}</table>
      {isYearView && <YearList />}
    </div>
  );
}

export default function CalendarDatePicker18() {
  const [month, setMonth] = useState(() => new Date());
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [isYearView, setIsYearView] = useState(false);

  function toggleYearView() {
    setIsYearView((isOpen) => !isOpen);
  }

  function selectMonth(selectedMonth: Date) {
    setMonth(selectedMonth);
    setIsYearView(false);
  }

  const yearView: YearViewState = {
    isYearView,
    toggleYearView,
    currentYear: month.getFullYear(),
    currentMonth: month.getMonth(),
    selectMonth,
  };

  return (
    <YearViewContext.Provider value={yearView}>
      <AnimatedCalendar
        mode='single'
        selected={date}
        onSelect={setDate}
        month={month}
        onMonthChange={setMonth}
        startMonth={START_MONTH}
        endMonth={END_MONTH}
        className='bg-card hairline-ring ring-border overflow-hidden rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        classNames={{
          month_caption: 'ms-2.5 me-20 justify-start',
          nav: 'justify-end',
        }}
        components={{
          CaptionLabel: YearViewCaption,
          MonthGrid: YearViewGrid,
        }}
      />
    </YearViewContext.Provider>
  );
}
