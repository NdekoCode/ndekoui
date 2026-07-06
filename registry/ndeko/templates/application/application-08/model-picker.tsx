'use client';

import { WordRoll } from '@/components/core/word-roll';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { modelOf, MODELS, type ModelId } from './data';

const MODEL_NAMES = MODELS.map((model) => model.name);

type ModelPickerProps = {
  value: ModelId;
  onValueChange: (model: ModelId) => void;
};

/** The menu belongs to a person. The demonstration changes the value, and the name rolls to the new one. */
export function ModelPicker({ value, onValueChange }: ModelPickerProps) {
  const model = modelOf(value);

  function change(next: unknown) {
    const found = MODELS.find((candidate) => candidate.id === next);
    if (found) {
      onValueChange(found.id);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label={`Model: ${model.name}`}
            className='text-foreground gap-1.5 px-2'
          />
        }
      >
        <Swap swapKey={model.brand}>
          <BrandTile brand={model.brand} size='sm' />
        </Swap>
        <span className='sr-only @lg:not-sr-only'>
          <WordRoll text={model.name} labels={MODEL_NAMES} />
        </span>
        <ChevronDownIcon className='size-3.5 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='bottom' align='end' className='w-56'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>
            Model for the next message
          </DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={change}>
            {MODELS.map((option) => (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                closeOnClick
              >
                <BrandTile brand={option.brand} size='sm' />
                {option.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
