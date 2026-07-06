import {
  InfoIcon,
  LightbulbIcon,
  TriangleAlertIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import type { Tone } from './pages';

const TRAY: Record<Tone, string> = {
  info: 'bg-info/10',
  warning: 'bg-warning/10',
  tip: 'bg-success/10',
};

const GLYPH_TONE: Record<Tone, string> = {
  info: 'text-info-foreground',
  warning: 'text-warning-foreground',
  tip: 'text-success-foreground',
};

const GLYPH: Record<Tone, Icon> = {
  info: InfoIcon,
  warning: TriangleAlertIcon,
  tip: LightbulbIcon,
};

const WORD: Record<Tone, string> = {
  info: 'Note',
  warning: 'Warning',
  tip: 'Tip',
};

type CalloutProps = {
  tone: Tone;
  children: React.ReactNode;
};

export function Callout({ tone, children }: CalloutProps) {
  const ToneIcon = GLYPH[tone];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] leading-5',
        TRAY[tone]
      )}
    >
      <ToneIcon className={cn('mt-px size-4 shrink-0', GLYPH_TONE[tone])} />
      <p className='min-w-0 text-pretty'>
        <span className='sr-only'>{WORD[tone]}: </span>
        {children}
      </p>
    </div>
  );
}
