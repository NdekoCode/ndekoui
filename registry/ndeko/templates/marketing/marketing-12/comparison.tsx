'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';
import { Segments } from '@/registry/ndeko/ui/segments';
import { SettleItem } from '@/registry/ndeko/ui/settle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

import {
  COMPARE_ANCHOR,
  COMPARE_SECTION,
  COMPARE_TEXT_ROWS,
  DEFAULT_PAGE_COUNT,
  EFFORT_BY_PAGES,
  PAGE_SEGMENTS,
  type PageCount,
} from './data';
import { Reveal } from './reveal';

const PAGE_TOUR: PageCount[] = ['40', '3', '12'];

const TOUR_STEP_MS = 2600;

const TOOL_COLUMN = 'bg-primary/[0.05]';

const ROW_HEAD =
  'text-foreground h-12 text-[13px] font-medium whitespace-normal';

type FigureRowProps = {
  label: string;
  handValue: number;
  toolValue: number;
  handSuffix?: string;
  toolSuffix?: string;
};

function FigureRow({
  label,
  handValue,
  toolValue,
  handSuffix,
  toolSuffix,
}: FigureRowProps) {
  return (
    <TableRow>
      <TableHead scope='row' className={ROW_HEAD}>
        {label}
      </TableHead>
      <TableCell className='tabular-nums'>
        <MotionNumber value={handValue} suffix={handSuffix} />
      </TableCell>
      <TableCell className={cn('font-medium tabular-nums', TOOL_COLUMN)}>
        <MotionNumber value={toolValue} suffix={toolSuffix} />
      </TableCell>
    </TableRow>
  );
}

export function Comparison() {
  const [pages, setPages] = useState<PageCount>(DEFAULT_PAGE_COUNT);
  const tourSteps = PAGE_TOUR.map((value) => ({
    after: TOUR_STEP_MS,
    run: () => setPages(value),
  }));
  const { ref } = useAutoplay(tourSteps, {
    loopAfter: TOUR_STEP_MS,
    onReset: () => setPages(DEFAULT_PAGE_COUNT),
  });
  const effort = EFFORT_BY_PAGES[pages];

  return (
    <section
      id={COMPARE_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-4xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {COMPARE_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {COMPARE_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div ref={ref} className='flex flex-col gap-4'>
            <Segments
              value={pages}
              segments={PAGE_SEGMENTS}
              onValueChange={setPages}
              label='Length of the statement'
              className='self-start'
            />
            <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <span className='sr-only'>What is compared</span>
                    </TableHead>
                    <TableHead>{COMPARE_SECTION.handLabel}</TableHead>
                    <TableHead className={cn('text-primary-ink', TOOL_COLUMN)}>
                      {COMPARE_SECTION.toolLabel}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <FigureRow
                    label='Time to a clean table'
                    handValue={effort.handMinutes}
                    toolValue={effort.toolSeconds}
                    handSuffix=' min'
                    toolSuffix=' s'
                  />
                  <FigureRow
                    label='Lines to double-check'
                    handValue={effort.handChecks}
                    toolValue={effort.toolChecks}
                  />
                  {COMPARE_TEXT_ROWS.map((row) => (
                    <TableRow key={row.label}>
                      <TableHead scope='row' className={ROW_HEAD}>
                        {row.label}
                      </TableHead>
                      <TableCell className='text-muted-foreground'>
                        {row.hand}
                      </TableCell>
                      <TableCell className={TOOL_COLUMN}>{row.tool}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </SettleItem>
        <SettleItem>
          <p className='text-muted-foreground text-xs'>
            {COMPARE_SECTION.footnote}
          </p>
        </SettleItem>
      </Reveal>
    </section>
  );
}
