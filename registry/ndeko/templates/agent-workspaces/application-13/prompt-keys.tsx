'use client';

import { WordRoll } from '@/components/core/word-roll';
import {
  ChevronDownIcon,
  HandIcon,
  ListChecksIcon,
  ZapIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
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

import {
  modelOf,
  MODELS,
  modeOf,
  MODES,
  type ModeId,
  type ModelId,
} from './data';

/** Both controls are drawn as key caps, the material of a key. */
const KEY = 'keycap-3d text-foreground h-7 gap-1.5 rounded-md px-2 text-xs';

const MODEL_NAMES = MODELS.map((model) => model.name);

const MODE_LABELS = MODES.map((mode) => mode.label);

const MODE_ICON: Record<ModeId, Icon> = {
  ask: HandIcon,
  plan: ListChecksIcon,
  act: ZapIcon,
};

type ModelKeyProps = {
  value: ModelId;
  onValueChange: (model: ModelId) => void;
};

/** The menu belongs to a person. The demonstration changes the value, and the key rolls to its new name. */
export function ModelKey({ value, onValueChange }: ModelKeyProps) {
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
            className={KEY}
          />
        }
      >
        <Swap swapKey={model.brand}>
          <BrandTile brand={model.brand} size='sm' />
        </Swap>
        <WordRoll text={model.name} labels={MODEL_NAMES} />
        <ChevronDownIcon className='size-3.5 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-56'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Model</DropdownMenuGroupLabel>
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

type ModeKeyProps = {
  value: ModeId;
  onValueChange: (mode: ModeId) => void;
};

export function ModeKey({ value, onValueChange }: ModeKeyProps) {
  const mode = modeOf(value);
  const ModeIcon = MODE_ICON[value];

  function change(next: unknown) {
    const found = MODES.find((candidate) => candidate.id === next);
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
            aria-label={`Mode: ${mode.label}`}
            className={KEY}
          />
        }
      >
        <Swap swapKey={value}>
          <ModeIcon className='size-3.5' />
        </Swap>
        <WordRoll text={mode.label} labels={MODE_LABELS} />
        <ChevronDownIcon className='size-3.5 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-72'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>How the agent works</DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={change}>
            {MODES.map((option) => {
              const OptionIcon = MODE_ICON[option.id];
              return (
                <DropdownMenuRadioItem
                  key={option.id}
                  value={option.id}
                  closeOnClick
                  className='h-auto items-start py-1.5'
                >
                  <OptionIcon className='mt-0.5' />
                  <span className='flex min-w-0 flex-col'>
                    <span>{option.label}</span>
                    <span className='text-muted-foreground text-xs'>
                      {option.hint}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
