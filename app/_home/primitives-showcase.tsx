'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { CheckIcon, UserIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/registry/ndeko/ui/dialog';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Slider, SliderThumbValue } from '@/registry/ndeko/ui/slider';
import { Spinner } from '@/registry/ndeko/ui/spinner';
import { Switch } from '@/registry/ndeko/ui/switch';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

type SaveState = 'idle' | 'saving' | 'saved';

const SAVE_DELAY = 800;
const SAVED_HOLD = 1400;

const LABEL_SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.3 };
const INSTANT: Transition = { duration: 0 };

const SWAP = {
  initial: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const SWAP_TRANSITION: Transition = { duration: 0.15 };

function swapOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return SWAP;
}

function labelTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LABEL_SPRING;
}

function SaveLabel({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return (
      <>
        <Spinner />
        Saving
      </>
    );
  }
  if (state === 'saved') {
    return (
      <>
        <CheckIcon />
        Saved
      </>
    );
  }
  return <>Save changes</>;
}

function MorphingSave() {
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const isBusy = state !== 'idle';

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function save() {
    setState('saving');
    timer.current = setTimeout(() => {
      setState('saved');
      timer.current = setTimeout(() => setState('idle'), SAVED_HOLD);
    }, SAVE_DELAY);
  }

  return (
    <Button onClick={save} disabled={isBusy} aria-live='polite'>
      <motion.span
        layout
        transition={labelTransitionOf(shouldReduceMotion)}
        className='flex items-center gap-1.5 overflow-hidden'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={state}
            {...swapOf(shouldReduceMotion)}
            transition={SWAP_TRANSITION}
            className='flex items-center gap-1.5 whitespace-nowrap'
          >
            <SaveLabel state={state} />
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </Button>
  );
}

function VolumeSlider() {
  const [volume, setVolume] = useState(40);

  function updateVolume(next: number | readonly number[]) {
    if (typeof next === 'number') {
      setVolume(next);
    }
  }

  return (
    <Slider
      value={volume}
      onValueChange={updateVolume}
      thumbLabels={['Volume']}
      className='w-48'
      thumbContent={() => <SliderThumbValue>{volume}</SliderThumbValue>}
    />
  );
}

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const INVITE_ROLES = [
  {
    value: 'member',
    label: 'Member',
    detail: 'Creates and edits tasks in every project',
  },
  {
    value: 'guest',
    label: 'Guest',
    detail: 'Sees only the projects they are invited to',
  },
];

function InviteDialog() {
  const [step, setStep] = useState<'email' | 'role'>('email');
  const isEmailStep = step === 'email';

  function resetOnClose(isOpen: boolean) {
    if (!isOpen) {
      setStep('email');
    }
  }

  return (
    <Dialog onOpenChange={resetOnClose}>
      <DialogTrigger render={<Button variant='outline' />}>
        <UserIcon />
        Invite people
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            The dialog grows to fit each step.
          </DialogDescription>
        </DialogHeader>
        {isEmailStep && (
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input placeholder='amara@lumen.example' size='lg' />
          </Field>
        )}
        {!isEmailStep && (
          <RadioGroup defaultValue='member' aria-label='Role'>
            {INVITE_ROLES.map((role) => (
              <Label key={role.value} className='items-start'>
                <RadioGroupItem value={role.value} />
                <span className='flex flex-col gap-0.5'>
                  <span>{role.label}</span>
                  <span className='text-muted-foreground text-xs font-normal'>
                    {role.detail}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}
        <DialogFooter>
          {isEmailStep && (
            <Button size='lg' onClick={() => setStep('role')}>
              Choose a role
            </Button>
          )}
          {!isEmailStep && (
            <DialogClose render={<Button size='lg' />}>Send invite</DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PrimitiveCell = {
  name: string;
  motion: string;
  demo: React.ReactNode;
};

const CELLS: PrimitiveCell[] = [
  {
    name: 'Button',
    motion: 'Gives on press, then its label morphs',
    demo: <MorphingSave />,
  },
  {
    name: 'Dialog',
    motion: 'Resizes to the content of each step',
    demo: <InviteDialog />,
  },
  {
    name: 'Tabs',
    motion: 'The thumb travels to the new choice',
    demo: (
      <Tabs defaultValue='week'>
        <TabsList variant='segmented' aria-label='Period'>
          <TabsTab value='day'>Day</TabsTab>
          <TabsTab value='week'>Week</TabsTab>
          <TabsTab value='month'>Month</TabsTab>
        </TabsList>
      </Tabs>
    ),
  },
  {
    name: 'Slider',
    motion: 'A bubble follows the thumb while it moves',
    demo: <VolumeSlider />,
  },
  {
    name: 'Switch',
    motion: 'The thumb slides to its new side',
    demo: (
      <Label>
        <Switch defaultChecked />
        Email digest
      </Label>
    ),
  },
  {
    name: 'Checkbox',
    motion: 'The mark swaps in when checked',
    demo: (
      <div className='flex flex-col gap-3'>
        <Label>
          <Checkbox defaultChecked />
          Notify assignees
        </Label>
        <Label>
          <Checkbox />
          Notify watchers
        </Label>
      </div>
    ),
  },
  {
    name: 'Select',
    motion: 'The list grows from its trigger',
    demo: (
      <Select items={PRIORITIES} defaultValue='medium'>
        <SelectTrigger aria-label='Priority' className='w-40'>
          <SelectValue placeholder='Pick a priority' />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((priority) => (
            <SelectItem key={priority.value} value={priority.value}>
              {priority.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },
  {
    name: 'Radio group',
    motion: 'The dot swaps in when picked',
    demo: (
      <RadioGroup defaultValue='weekly' aria-label='Digest frequency'>
        <Label>
          <RadioGroupItem value='daily' />
          Daily digest
        </Label>
        <Label>
          <RadioGroupItem value='weekly' />
          Weekly digest
        </Label>
      </RadioGroup>
    ),
  },
];

export function PrimitivesShowcase() {
  return (
    <ul className='grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4'>
      {CELLS.map((cell) => (
        <li key={cell.name} className='flex flex-col gap-3'>
          <div className='bg-foreground/[0.025] flex h-44 items-center justify-center rounded-2xl px-4'>
            {cell.demo}
          </div>
          <div className='flex flex-col gap-0.5 px-1'>
            <p className='text-[13px] font-medium'>{cell.name}</p>
            <p className='text-muted-foreground text-xs'>{cell.motion}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
