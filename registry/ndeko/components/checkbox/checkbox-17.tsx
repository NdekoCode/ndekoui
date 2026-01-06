import { useId } from 'react';

import {
  BrushIcon,
  EraserIcon,
  type Icon,
  ScissorsIcon,
  SwatchBookIcon,
} from '@/registry/ndeko/lib/icons';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

type Tool = {
  value: string;
  label: string;
  Icon: Icon;
  defaultChecked?: boolean;
};

const TOOLS: Tool[] = [
  {
    value: 'palette',
    label: 'Palette',
    Icon: SwatchBookIcon,
    defaultChecked: true,
  },
  { value: 'brush', label: 'Brush', Icon: BrushIcon },
  { value: 'eraser', label: 'Eraser', Icon: EraserIcon },
  { value: 'cut', label: 'Cut', Icon: ScissorsIcon },
];

const CHOICE_CARD = [
  'relative flex flex-col gap-4 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

export default function Checkbox17() {
  const id = useId();

  return (
    <div
      role='group'
      aria-label='Tools'
      className='grid w-full grid-cols-2 gap-3'
    >
      {TOOLS.map((tool) => {
        const itemId = `${id}-${tool.value}`;

        return (
          <div key={tool.value} className={CHOICE_CARD}>
            <div className='flex justify-between gap-2'>
              <Checkbox
                id={itemId}
                value={tool.value}
                defaultChecked={tool.defaultChecked}
                className='order-1 after:absolute after:inset-0'
              />
              <tool.Icon className='text-muted-foreground size-4' />
            </div>
            <Label htmlFor={itemId}>{tool.label}</Label>
          </div>
        );
      })}
    </div>
  );
}
