'use client';

import { MorphingLabel } from '@/registry/ndeko/components/navbar/_parts/morphing-label';
import { UserMenu } from '@/registry/ndeko/components/navbar/_parts/user-menu';
import {
  BotMessageSquareIcon,
  MessageCircleDashedIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const MODELS = [
  {
    value: 'orion-alpha-45',
    label: 'Orion-Alpha 4.5',
    description: 'Balanced performance and creativity',
  },
  {
    value: 'orion-code-4',
    label: 'Orion-Code 4',
    description: 'Optimized for code generation and understanding',
  },
  {
    value: 'nova-chat-4',
    label: 'Nova-Chat 4',
    description: 'Excels at natural, engaging conversations',
  },
  {
    value: 'galaxy-max-4',
    label: 'Galaxy-Max 4',
    description: 'Most powerful model for complex tasks',
  },
];

function modelLabelOf(value: string) {
  const model = MODELS.find((option) => option.value === value);
  return model?.label ?? value;
}

function renderModel(value: string) {
  return <MorphingLabel value={value}>{modelLabelOf(value)}</MorphingLabel>;
}

export default function Navbar15() {
  return (
    <header className='hairline-b border-border px-4 md:px-6'>
      <div className='flex h-16 items-center justify-between gap-4'>
        <Select items={MODELS} defaultValue='orion-alpha-45'>
          <SelectTrigger aria-label='Select AI model' className='w-fit'>
            <BotMessageSquareIcon className='text-muted-foreground' />
            <SelectValue className='flex'>{renderModel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Models</SelectLabel>
              {MODELS.map((model) => (
                <SelectItem
                  key={model.value}
                  value={model.value}
                  className='h-auto py-1.5'
                >
                  <span className='flex flex-col gap-0.5'>
                    <span>{model.label}</span>
                    <span className='text-muted-foreground text-xs'>
                      {model.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Start a temporary chat'
            className='text-muted-foreground'
          >
            <MessageCircleDashedIcon />
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
