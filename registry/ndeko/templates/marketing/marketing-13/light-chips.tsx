'use client';

import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { LIGHTS, type LightId } from './data';

const CHIP =
  'h-7 rounded-full px-3 text-xs data-pressed:text-primary-ink data-pressed:ring-primary/50';

type LightChipsProps = {
  value: LightId;
  onValueChange: (light: LightId) => void;
};

export function LightChips({ value, onValueChange }: LightChipsProps) {
  const pressedValues = [value];

  function changeValue(nextValues: unknown[]) {
    const [nextValue] = nextValues;
    const light = LIGHTS.find((candidate) => candidate.id === nextValue);
    if (light) {
      onValueChange(light.id);
    }
  }

  return (
    <ToggleGroup
      aria-label='Lighting'
      value={pressedValues}
      onValueChange={changeValue}
      variant='outline'
      className='flex-wrap gap-1.5'
    >
      {LIGHTS.map((light) => (
        <ToggleGroupItem key={light.id} value={light.id} className={CHIP}>
          {light.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
