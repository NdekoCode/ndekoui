'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';

import {
  isThemeName,
  THEMES,
  type ThemeDefinition,
  type ThemeName,
} from '@/lib/themes';

import { ThemeMiniature } from './theme-miniature';

const SWATCH = [
  'bg-card hairline-ring ring-border flex cursor-pointer flex-col gap-2 rounded-xl p-1.5 text-start shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none',
  'transition-[box-shadow,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.98]',
  'data-checked:ring-foreground/50 data-checked:ring-2',
  'focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid',
].join(' ');

function ThemeSwatch({ theme }: { theme: ThemeDefinition }) {
  return (
    <RadioPrimitive.Root value={theme.name} className={SWATCH}>
      <ThemeMiniature scope={theme.name} />
      <span className='px-1 pb-0.5 text-[13px] font-medium'>{theme.title}</span>
    </RadioPrimitive.Root>
  );
}

type ThemeGalleryProps = {
  /** The swatch that is picked, or none while the generator is the one drawing the preview. */
  pickedName: ThemeName | null;
  onPick: (name: ThemeName) => void;
};

export function ThemeGallery({ pickedName, onPick }: ThemeGalleryProps) {
  function pick(value: unknown) {
    if (typeof value !== 'string') {
      return;
    }
    if (!isThemeName(value)) {
      return;
    }
    onPick(value);
  }

  return (
    <RadioGroupPrimitive
      aria-label='Themes'
      value={pickedName}
      onValueChange={pick}
      className='grid grid-cols-3 gap-2'
    >
      {THEMES.map((theme) => (
        <ThemeSwatch key={theme.name} theme={theme} />
      ))}
    </RadioGroupPrimitive>
  );
}
