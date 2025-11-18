'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { cn } from '@/registry/ndeko/lib/utils';

type SliderValue = number | readonly number[];

type SliderProps = Omit<SliderPrimitive.Root.Props, 'className'> & {
  className?: string;
  thumbLabels?: readonly string[];
  thumbClassName?: string;
  /** Content drawn inside each thumb, such as a `SliderThumbValue`. */
  thumbContent?: (index: number) => React.ReactNode;
  /** The value each thumb announces, for example "3 stars" instead of "3". */
  getAriaValueText?: SliderPrimitive.Thumb.Props['getAriaValueText'];
};

function countThumbs(value: SliderValue | undefined) {
  if (Array.isArray(value)) {
    return value.length;
  }
  return 1;
}

const THUMB = [
  'block size-4 shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.18)] hairline-ring ring-foreground/15 outline-none',
  'transition-[scale,box-shadow] duration-150 ease-(--ease-out-strong) has-focus-visible:ring-[3px] has-focus-visible:ring-ring/30 data-dragging:scale-110',
  'data-disabled:pointer-events-none',
].join(' ');

const THUMB_VALUE = [
  'pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-background tabular-nums',
  'origin-bottom scale-95 opacity-0 transition-[opacity,scale] duration-150 ease-(--ease-out-strong)',
  'group-data-dragging/thumb:scale-100 group-data-dragging/thumb:opacity-100 group-has-focus-visible/thumb:scale-100 group-has-focus-visible/thumb:opacity-100',
].join(' ');

/** A value bubble above the thumb, shown while it is dragged or focused from the keyboard. */
function SliderThumbValue({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='slider-thumb-value'
      aria-hidden
      className={cn(THUMB_VALUE, className)}
      {...props}
    />
  );
}

function Slider({
  className,
  value,
  defaultValue,
  thumbLabels,
  thumbClassName,
  thumbContent,
  getAriaValueText,
  ...props
}: SliderProps) {
  const thumbCount = countThumbs(value ?? defaultValue);
  const thumbIndexes = Array.from({ length: thumbCount }, (_, index) => index);

  return (
    <SliderPrimitive.Root
      data-slot='slider'
      value={value}
      defaultValue={defaultValue}
      className={cn(
        'data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Control className='relative flex touch-none items-center select-none data-disabled:opacity-50 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:py-2 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-2'>
        <SliderPrimitive.Track className='bg-foreground/10 relative grow rounded-full data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1'>
          <SliderPrimitive.Indicator className='bg-primary rounded-full' />
          {thumbIndexes.map((index) => (
            <SliderPrimitive.Thumb
              key={index}
              index={index}
              aria-label={thumbLabels?.[index]}
              getAriaValueText={getAriaValueText}
              className={cn(THUMB, 'group/thumb relative', thumbClassName)}
            >
              {thumbContent?.(index)}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider, SliderThumbValue, type SliderProps };
