'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { AreaChart } from '@/registry/ndeko/components/chart/chart-03';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  PromptInput,
  PromptInputActions,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/registry/ndeko/ui/chat-prompt-input';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { Switch } from '@/registry/ndeko/ui/switch';

const DRAFT = 'Summarise what shipped this week and who needs a reply.';

const SEND_MS = 1400;

export function PreviewComposer() {
  const [draft, setDraft] = useState(DRAFT);
  const [isSending, setIsSending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function clearTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function finish() {
    timer.current = null;
    setIsSending(false);
  }

  function send() {
    clearTimer();
    setIsSending(true);
    timer.current = setTimeout(finish, SEND_MS);
  }

  function stop() {
    clearTimer();
    setIsSending(false);
  }

  return (
    <PromptInput
      value={draft}
      onValueChange={setDraft}
      isLoading={isSending}
      onSubmit={send}
      className='w-full'
    >
      <PromptInputTextarea aria-label='Message' placeholder='Ask anything' />
      <PromptInputActions className='justify-between gap-2 pt-1'>
        <span className='text-muted-foreground ps-2 text-xs'>
          Enter to send
        </span>
        <PromptInputSubmit onStop={stop} />
      </PromptInputActions>
    </PromptInput>
  );
}

export function PreviewButtons() {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button>Primary</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='outline'>Outline</Button>
      <Button variant='destructive'>Destructive</Button>
    </div>
  );
}

export function PreviewSwitch() {
  const id = useId();

  return (
    <div className='flex items-center gap-2'>
      <Switch id={id} defaultChecked />
      <Label htmlFor={id}>Email alerts</Label>
    </div>
  );
}

type Range = 'day' | 'week' | 'month';

const RANGE_SEGMENTS: readonly Segment<Range>[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

type RangeData = {
  labels: string[];
  values: number[];
  noun: string;
};

const RANGE_DATA: Record<Range, RangeData> = {
  day: {
    labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
    values: [4, 12, 22, 18, 26, 9],
    noun: 'time',
  },
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [48, 52, 55, 49, 51, 38, 35],
    noun: 'day',
  },
  month: {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'],
    values: [310, 342, 365, 331, 389],
    noun: 'week',
  },
};

export function PreviewChart() {
  const [range, setRange] = useState<Range>('week');
  const data = RANGE_DATA[range];

  return (
    <AreaChart
      title='Signups'
      note='Illustrative'
      labels={data.labels}
      values={data.values}
      valueName='Signups'
      positionNoun={data.noun}
      actions={
        <Segments
          value={range}
          segments={RANGE_SEGMENTS}
          onValueChange={setRange}
          label='Range'
        />
      }
    />
  );
}

const MEMBERS = ['Amani Kabongo', 'Grace Mbuyi', 'Joel Mukendi', 'Lea Mwamba'];

function PreviewPeople() {
  return (
    <div className='flex items-center gap-3'>
      <div className='flex -space-x-2'>
        {MEMBERS.map((name) => (
          <Avatar
            key={name}
            seed={name}
            role='img'
            aria-label={name}
            className='ring-background size-8 ring-2'
          />
        ))}
      </div>
      <p className='text-muted-foreground text-xs'>and 3 others</p>
    </div>
  );
}

function PreviewBadges() {
  return (
    <div className='flex flex-wrap gap-1.5'>
      <Badge>Brand</Badge>
      <Badge variant='success'>Active</Badge>
      <Badge variant='warning'>Pending</Badge>
      <Badge variant='info'>Info</Badge>
      <Badge variant='destructive'>Failed</Badge>
    </div>
  );
}

function PreviewField() {
  return (
    <Field>
      <FieldLabel>Project name</FieldLabel>
      <Input placeholder='Untitled project' />
    </Field>
  );
}

export function PreviewSide() {
  return (
    <div className='flex flex-col justify-between gap-4'>
      <PreviewPeople />
      <PreviewBadges />
      <PreviewField />
    </div>
  );
}
