'use client';

import {
  formatCost,
  formatDuration,
  formatTokens,
} from '@/registry/ndeko/lib/agent-run';
import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';

import { VALUE_BRAND } from './data';
import {
  valueLabelOf,
  type PivotCell,
  type PivotRow,
  type PivotTable,
  type ValueSpec,
} from './pivot';
import type { PivotAction } from './session';

/** One hue from pale to full, low to high. */
const HEAT_CLASS = [
  'bg-chart-4/45 dark:bg-chart-4/10',
  'bg-chart-3/55 dark:bg-chart-3/15',
  'bg-chart-2/55 dark:bg-chart-2/25',
  'bg-chart-1/55 dark:bg-chart-1/35',
];

const COUNT_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const HEAD_CELL =
  'text-muted-foreground h-8 px-2.5 text-end text-xs font-medium whitespace-nowrap';

const ROW_HEAD =
  'bg-card sticky left-0 z-10 h-8 max-w-44 ps-2.5 pe-3 text-start text-xs whitespace-nowrap';

/** 12, $4.20, 48k, 1m 34s: each figure in the format of its measure. */
export function formatValue(spec: ValueSpec, value: number | null) {
  if (value === null) {
    return '';
  }
  if (spec.aggregation === 'count') {
    return COUNT_FORMAT.format(value);
  }
  if (spec.measure === 'cost') {
    return formatCost(value);
  }
  if (spec.measure === 'tokens') {
    return formatTokens(value);
  }
  if (spec.measure === 'duration') {
    return formatDuration(value);
  }
  return COUNT_FORMAT.format(value);
}

function heatClassOf(cell: PivotCell) {
  if (cell.heat === null) {
    return undefined;
  }
  return HEAT_CLASS[cell.heat];
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-90';
  }
  return 'rotate-0';
}

function indentOf(depth: number) {
  if (depth > 0) {
    return 'ps-9';
  }
  return undefined;
}

function pressedOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.97] bg-foreground/[0.07]';
  }
  return undefined;
}

function ValueLabel({ label }: { label: string }) {
  const brand = VALUE_BRAND[label];

  return (
    <span className='flex min-w-0 items-center gap-1.5'>
      {brand && <BrandTile brand={brand} size='sm' />}
      <span className='truncate'>{label}</span>
    </span>
  );
}

type FigureCellProps = {
  cell: PivotCell;
  spec: ValueSpec;
  isStrong?: boolean;
};

function FigureCell({ cell, spec, isStrong = false }: FigureCellProps) {
  const text = formatValue(spec, cell.value);
  const isEmpty = cell.value === null;

  return (
    <td className='p-px'>
      <span
        className={cn(
          'flex h-7 min-w-14 items-center justify-end rounded-[5px] px-2 text-xs tabular-nums transition-colors duration-300',
          heatClassOf(cell),
          isStrong && 'font-medium'
        )}
      >
        {text}
        {isEmpty && <span className='sr-only'>No run</span>}
      </span>
    </td>
  );
}

type BodyRowProps = {
  row: PivotRow;
  table: PivotTable;
  isFolded: boolean;
  isPressed: boolean;
  onToggleGroup: (key: string) => void;
};

function BodyRow({
  row,
  table,
  isFolded,
  isPressed,
  onToggleGroup,
}: BodyRowProps) {
  const valueCount = table.values.length;

  return (
    <tr className='transition-opacity duration-300 starting:opacity-0'>
      <th
        scope='row'
        className={cn(
          ROW_HEAD,
          indentOf(row.depth),
          !row.isGroup && 'font-normal'
        )}
      >
        {row.isGroup && (
          <button
            type='button'
            aria-expanded={!isFolded}
            onClick={() => onToggleGroup(row.key)}
            className={cn(
              'focus-visible:ring-ring/25 hover:bg-foreground/[0.05] -ms-1.5 flex h-7 max-w-full cursor-pointer items-center gap-1 rounded-md ps-1 pe-2 font-medium transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px]',
              pressedOf(isPressed)
            )}
          >
            <ChevronRightIcon
              className={cn(
                'text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
                chevronTurnOf(!isFolded)
              )}
            />
            <ValueLabel label={row.label} />
          </button>
        )}
        {!row.isGroup && <ValueLabel label={row.label} />}
      </th>
      {row.cells.map((cell, index) => (
        <FigureCell
          key={index}
          cell={cell}
          spec={table.values[index % valueCount]}
          isStrong={row.isGroup}
        />
      ))}
      {table.hasColumns &&
        row.totals.map((cell, index) => (
          <FigureCell
            key={`total-${index}`}
            cell={cell}
            spec={table.values[index]}
            isStrong
          />
        ))}
    </tr>
  );
}

function HeadRows({ table }: { table: PivotTable }) {
  const valueCount = table.values.length;
  const hasValueRow = table.hasColumns && valueCount > 1;
  const valueLabels = table.values.map(valueLabelOf);
  let rowSpan = 1;
  if (hasValueRow) {
    rowSpan = 2;
  }

  return (
    <thead>
      <tr>
        <th
          scope='col'
          rowSpan={rowSpan}
          className={cn(
            ROW_HEAD,
            'text-muted-foreground align-bottom font-medium'
          )}
        >
          {table.rowHeader}
        </th>
        {!table.hasColumns &&
          valueLabels.map((label) => (
            <th key={label} scope='col' className={HEAD_CELL}>
              {label}
            </th>
          ))}
        {table.hasColumns &&
          table.columnKeys.map((columnKey) => (
            <th
              key={columnKey}
              scope='col'
              colSpan={valueCount}
              className={HEAD_CELL}
            >
              {columnKey}
            </th>
          ))}
        {table.hasColumns && (
          <th
            scope='col'
            colSpan={valueCount}
            className={cn(HEAD_CELL, 'text-foreground')}
          >
            Total
          </th>
        )}
      </tr>
      {hasValueRow && (
        <tr>
          {table.columnKeys.map((columnKey) =>
            valueLabels.map((label) => (
              <th
                key={`${columnKey}-${label}`}
                scope='col'
                className={cn(HEAD_CELL, 'font-normal')}
              >
                {label}
              </th>
            ))
          )}
          {valueLabels.map((label) => (
            <th
              key={`total-${label}`}
              scope='col'
              className={cn(HEAD_CELL, 'font-normal')}
            >
              {label}
            </th>
          ))}
        </tr>
      )}
    </thead>
  );
}

function HeatLegend() {
  return (
    <p className='text-muted-foreground flex items-center gap-1.5 text-[11px]'>
      Low
      <span aria-hidden='true' className='flex gap-0.5'>
        {HEAT_CLASS.map((heat) => (
          <span key={heat} className={cn('size-3 rounded-[3px]', heat)} />
        ))}
      </span>
      High
    </p>
  );
}

export type PivotTableViewProps = {
  table: PivotTable;
  title: string;
  collapsed: string[];
  pressed: string | null;
  onAction: (action: PivotAction) => void;
};

/** A long table scrolls inside its own frame and its first column stays in place. */
export function PivotTableView({
  table,
  title,
  collapsed,
  pressed,
  onAction,
}: PivotTableViewProps) {
  const hasValues = table.values.length > 0;
  const hasRecords = table.recordCount > 0;

  if (!hasValues) {
    return (
      <div className={cn(SURFACE, 'flex flex-col items-start gap-3 p-4')}>
        <p className='text-muted-foreground text-[13px]'>
          The table needs a figure. Drop Runs, Cost, Tokens or Duration in
          Values.
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() =>
            onAction({ type: 'placed', field: 'runs', well: 'values' })
          }
        >
          Count the runs
        </Button>
      </div>
    );
  }

  if (!hasRecords) {
    return (
      <div className={cn(SURFACE, 'flex flex-col items-start gap-3 p-4')}>
        <p className='text-muted-foreground text-[13px]'>
          No run matches these filters
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => onAction({ type: 'filtersCleared' })}
        >
          Remove the filters
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className={cn(SURFACE, 'relative overflow-x-auto p-1.5')}>
        <table className='w-full border-separate border-spacing-0'>
          <caption className='sr-only'>{title}</caption>
          <HeadRows table={table} />
          <tbody>
            {table.rows.map((row) => (
              <BodyRow
                key={row.key}
                row={row}
                table={table}
                isFolded={collapsed.includes(row.key)}
                isPressed={pressed === `group-${row.key}`}
                onToggleGroup={(key) => onAction({ type: 'groupToggled', key })}
              />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope='row' className={cn(ROW_HEAD, 'font-medium')}>
                Total
              </th>
              {table.grandCells.map((cell, index) => (
                <FigureCell
                  key={index}
                  cell={cell}
                  spec={table.values[index % table.values.length]}
                  isStrong
                />
              ))}
              {table.hasColumns &&
                table.grandTotals.map((cell, index) => (
                  <FigureCell
                    key={`total-${index}`}
                    cell={cell}
                    spec={table.values[index]}
                    isStrong
                  />
                ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <HeatLegend />
    </div>
  );
}
