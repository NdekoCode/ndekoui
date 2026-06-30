'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { CheckIcon, LoaderIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Switch } from '@/registry/ndeko/ui/switch';

import { KIND_META, type NotificationKind } from './_parts/sender-avatar';
import { Swap } from './_parts/swap';

type Preference = {
  kind: NotificationKind;
  title: string;
  trigger: string;
};

type SaveState = 'idle' | 'saving' | 'saved';

const PREFERENCES: Preference[] = [
  {
    kind: 'mention',
    title: 'Mentions',
    trigger: 'Someone writes your name in a task, a comment or a document',
  },
  {
    kind: 'assigned',
    title: 'Assignments',
    trigger: 'A task is assigned to you or taken off your plate',
  },
  {
    kind: 'comment',
    title: 'Comments on your tasks',
    trigger: 'Someone replies on a task you created or follow',
  },
  {
    kind: 'status',
    title: 'Status changes',
    trigger: 'A task you follow moves to another column',
  },
  {
    kind: 'invite',
    title: 'Invitations',
    trigger: 'You are invited to a team or a project',
  },
];

const INITIAL_ENABLED: Record<NotificationKind, boolean> = {
  mention: true,
  assigned: true,
  comment: true,
  status: false,
  invite: true,
};

const SAVE_DELAY_MS = 600;

function saveLabelOf(state: SaveState) {
  if (state === 'saving') {
    return 'Saving';
  }
  if (state === 'saved') {
    return 'Saved';
  }
  return 'Saved automatically';
}

function enabledCountLabelOf(count: number) {
  if (count === 1) {
    return '1 kind on';
  }
  return `${count} kinds on`;
}

function useSaveState() {
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function save() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    setState('saving');
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setState('saved');
    }, SAVE_DELAY_MS);
  }

  return { state, save };
}

type PreferenceRowProps = {
  preference: Preference;
  isEnabled: boolean;
  onToggle: (kind: NotificationKind, isEnabled: boolean) => void;
};

function PreferenceRow({
  preference,
  isEnabled,
  onToggle,
}: PreferenceRowProps) {
  const labelId = useId();
  const triggerId = useId();
  const meta = KIND_META[preference.kind];
  const Glyph = meta.glyph;
  const badgeStyle = { '--chip': meta.color } as React.CSSProperties;

  return (
    <li className='flex items-center gap-3 py-2.5'>
      <span
        aria-hidden='true'
        style={badgeStyle}
        className={cn(
          'chip-3d inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-opacity duration-200',
          !isEnabled && 'opacity-45'
        )}
      >
        <Glyph strokeWidth={2.25} className='size-3.5' />
      </span>
      <div className='min-w-0 flex-1'>
        <p id={labelId} className='text-[13px] leading-5 font-medium'>
          {preference.title}
        </p>
        <p id={triggerId} className='text-muted-foreground text-xs'>
          {preference.trigger}
        </p>
      </div>
      <Switch
        checked={isEnabled}
        onCheckedChange={(checked) => onToggle(preference.kind, checked)}
        aria-labelledby={labelId}
        aria-describedby={triggerId}
      />
    </li>
  );
}

export default function Notification30() {
  const titleId = useId();
  const [enabled, setEnabled] = useState(INITIAL_ENABLED);
  const { state: saveState, save } = useSaveState();
  const isSaving = saveState === 'saving';
  const enabledCount = PREFERENCES.filter(
    (preference) => enabled[preference.kind]
  ).length;

  function toggle(kind: NotificationKind, isEnabled: boolean) {
    setEnabled((current) => ({ ...current, [kind]: isEnabled }));
    save();
  }

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border w-full max-w-[28rem] rounded-xl px-4 pt-4 pb-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-start justify-between gap-3'>
        <div>
          <h3 id={titleId} className='text-sm font-medium'>
            Notify me about
          </h3>
          <p className='text-muted-foreground text-xs tabular-nums'>
            {enabledCountLabelOf(enabledCount)}
          </p>
        </div>
        <p
          role='status'
          className='text-muted-foreground flex h-5 items-center gap-1.5 text-xs'
        >
          <Swap swapKey={String(isSaving)}>
            {isSaving && <LoaderIcon className='size-3.5 animate-spin' />}
            {!isSaving && <CheckIcon className='size-3.5' />}
          </Swap>
          {saveLabelOf(saveState)}
        </p>
      </header>
      <ul aria-label='Kinds of notification' className='mt-2'>
        {PREFERENCES.map((preference) => (
          <PreferenceRow
            key={preference.kind}
            preference={preference}
            isEnabled={enabled[preference.kind]}
            onToggle={toggle}
          />
        ))}
      </ul>
    </section>
  );
}
