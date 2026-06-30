'use client';

import {
  composeRenderProps,
  DateField as DateFieldRac,
  DateInput as DateInputRac,
  DateSegment as DateSegmentRac,
  TimeField as TimeFieldRac,
  type DateFieldProps,
  type DateInputProps as DateInputRacProps,
  type DateSegmentProps,
  type DateValue,
  type TimeFieldProps,
  type TimeValue,
} from 'react-aria-components';

import { cn } from '@/registry/ndeko/lib/utils';

function DateField<T extends DateValue>({
  className,
  children,
  ...props
}: DateFieldProps<T>) {
  return (
    <DateFieldRac
      className={composeRenderProps(className, (value) => cn(value))}
      {...props}
    >
      {children}
    </DateFieldRac>
  );
}

function TimeField<T extends TimeValue>({
  className,
  children,
  ...props
}: TimeFieldProps<T>) {
  return (
    <TimeFieldRac
      className={composeRenderProps(className, (value) => cn(value))}
      {...props}
    >
      {children}
    </TimeFieldRac>
  );
}

const SEGMENT = [
  'inline rounded-[4px] p-0.5 tabular-nums text-foreground caret-transparent outline-none',
  'data-placeholder:text-muted-foreground/75 data-[type=literal]:px-0 data-[type=literal]:text-muted-foreground/75',
  'data-focused:bg-primary/10 data-focused:text-foreground data-focused:data-placeholder:text-foreground',
  'data-invalid:text-destructive-ink data-invalid:data-placeholder:text-destructive-ink data-invalid:data-focused:bg-destructive data-invalid:data-focused:text-white data-invalid:data-focused:data-placeholder:text-white',
  'data-disabled:cursor-not-allowed data-disabled:opacity-50',
].join(' ');

const NARROW_NO_BREAK_SPACE = '\u202f';

/**
 * Node and the browser ship different ICU data: one puts a narrow no-break space before AM and PM,
 * the other a plain space, so the server HTML would not match and React would rebuild the field.
 */
function segmentTextOf(text: string) {
  return text.replaceAll(NARROW_NO_BREAK_SPACE, ' ');
}

function DateSegment({
  className,
  children,
  segment,
  ...props
}: DateSegmentProps) {
  const content = children ?? segmentTextOf(segment.text);

  return (
    <DateSegmentRac
      segment={segment}
      className={composeRenderProps(className, (value) => cn(SEGMENT, value))}
      {...props}
    >
      {content}
    </DateSegmentRac>
  );
}

const dateInputStyle = [
  'relative inline-flex h-8 w-full items-center overflow-hidden whitespace-nowrap rounded-md border border-transparent bg-card px-2.5 text-[13px]',
  'shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12 outline-none transition-[color,box-shadow,border-color] dark:bg-foreground/[0.04] dark:ring-foreground/15',
  'data-focus-within:border-foreground/30 data-focus-within:ring-[3px] data-focus-within:ring-ring/25 dark:data-focus-within:ring-ring/25',
  'data-focus-within:has-aria-invalid:border-destructive/60 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40',
].join(' ');

type DateInputProps = Omit<DateInputRacProps, 'children' | 'className'> & {
  className?: string;
  unstyled?: boolean;
};

function DateInput({ className, unstyled = false, ...props }: DateInputProps) {
  const isStyled = !unstyled;

  return (
    <DateInputRac
      className={composeRenderProps(className, (value) =>
        cn(isStyled && dateInputStyle, value)
      )}
      {...props}
    >
      {(segment) => <DateSegment segment={segment} />}
    </DateInputRac>
  );
}

export { DateField, DateInput, DateSegment, TimeField, dateInputStyle };
export type { DateInputProps };
