import { useId } from 'react';

import { CheckIcon, MinusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

type ThemeName = 'light' | 'dark' | 'system';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const PREVIEW = [
  'relative block h-18 w-22 overflow-hidden rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'peer-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] peer-data-checked:ring-primary/45',
  'peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/25',
].join(' ');

const STATE_GLYPH =
  'col-start-1 row-start-1 size-4 transition-[opacity,scale,filter] duration-150 ease-(--ease-out-strong)';

const CHECKED_GLYPH = [
  'scale-60 opacity-0 blur-[2px]',
  'group-has-data-checked/theme:scale-100 group-has-data-checked/theme:opacity-100 group-has-data-checked/theme:blur-[0px]',
].join(' ');

const UNCHECKED_GLYPH =
  'group-has-data-checked/theme:scale-60 group-has-data-checked/theme:opacity-0 group-has-data-checked/theme:blur-[2px]';

const LIGHT_WINDOW = 'bg-white text-black/10';

const DARK_WINDOW = 'dark bg-background text-foreground/15';

function WindowSketch({ className }: { className?: string }) {
  return (
    <span className={cn('absolute inset-0 flex gap-1.5 p-2', className)}>
      <span className='flex w-4 flex-col gap-1'>
        <span className='h-1 rounded-full bg-current' />
        <span className='h-1 rounded-full bg-current' />
        <span className='h-1 rounded-full bg-current' />
      </span>
      <span className='flex flex-1 flex-col gap-1'>
        <span className='h-1.5 w-2/3 rounded-full bg-current' />
        <span className='h-1 rounded-full bg-current' />
        <span className='h-1 w-4/5 rounded-full bg-current' />
        <span className='bg-primary mt-auto h-2.5 w-6 rounded-full' />
      </span>
    </span>
  );
}

function ThemeSketch({ theme }: { theme: ThemeName }) {
  if (theme === 'light') {
    return <WindowSketch className={LIGHT_WINDOW} />;
  }
  if (theme === 'dark') {
    return <WindowSketch className={DARK_WINDOW} />;
  }
  return (
    <>
      <WindowSketch className={LIGHT_WINDOW} />
      <WindowSketch
        className={cn(DARK_WINDOW, '[clip-path:inset(0_0_0_50%)]')}
      />
    </>
  );
}

export default function Radio19() {
  const captionId = useId();

  return (
    <div className='flex flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        Theme
      </span>
      <RadioGroup
        defaultValue='light'
        aria-labelledby={captionId}
        className='flex gap-3'
      >
        {THEMES.map((theme) => (
          <label
            key={theme.value}
            className='group/theme flex cursor-pointer flex-col'
          >
            <RadioGroupItem value={theme.value} className='sr-only' />
            <span className={PREVIEW}>
              <ThemeSketch theme={theme.value} />
            </span>
            <span className='text-muted-foreground group-has-data-checked/theme:text-foreground mt-2 flex items-center gap-1 transition-colors duration-150'>
              <span className='grid'>
                <CheckIcon className={cn(STATE_GLYPH, CHECKED_GLYPH)} />
                <MinusIcon className={cn(STATE_GLYPH, UNCHECKED_GLYPH)} />
              </span>
              <span className='text-xs font-medium'>{theme.label}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
