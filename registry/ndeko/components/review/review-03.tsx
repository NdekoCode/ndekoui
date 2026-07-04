'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import type { RiskLevel } from '@/registry/ndeko/lib/agent-run';
import { CircleAlertIcon, TriangleAlertIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { INSTANT, springOf } from '@/registry/ndeko/lib/motion-presets';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

export type AutonomyLevel = 'ask' | 'risky' | 'auto';

export type ToolRule = {
  id: string;
  label: string;
  /** A risky tool never acts on its own without a confirmation, and caps at Ask when risky by default. */
  risk?: RiskLevel;
  followsDefault: boolean;
  level: AutonomyLevel;
};

const LEVELS: AutonomyLevel[] = ['ask', 'risky', 'auto'];

/** The track sits inside the drag area by this much on each side, so the knob never leaves it. */
const TRACK_INSET_PX = 10;

const STOP_LABEL: Record<AutonomyLevel, string> = {
  ask: 'Ask every time',
  risky: 'Ask when risky',
  auto: 'Act on its own',
};

/** Short enough to stay on one line at phone width: the sentence rolls word by word. */
const LEVEL_SENTENCE: Record<AutonomyLevel, string> = {
  ask: 'It asks you before every action.',
  risky: 'It acts alone, asks before risky steps.',
  auto: 'It acts alone and tells you after.',
};

const LEVEL_PHRASE: Record<AutonomyLevel, string> = {
  ask: 'Asks every time',
  risky: 'Asks when risky',
  auto: 'Acts on its own',
};

const ROW_SEGMENTS: Segment<AutonomyLevel>[] = [
  { value: 'ask', label: 'Ask' },
  { value: 'risky', label: 'If risky' },
  { value: 'auto', label: 'On its own' },
];

type RiskBadge = {
  label: string;
  variant: 'success' | 'warning' | 'destructive';
  icon: React.ReactNode;
};

const RISK_BADGE: Record<RiskLevel, RiskBadge> = {
  low: { label: 'Low risk', variant: 'success', icon: null },
  medium: {
    label: 'Medium risk',
    variant: 'warning',
    icon: <TriangleAlertIcon />,
  },
  high: {
    label: 'High risk',
    variant: 'destructive',
    icon: <CircleAlertIcon />,
  },
};

function indexOfLevel(level: AutonomyLevel) {
  return LEVELS.indexOf(level);
}

function levelAt(index: number): AutonomyLevel {
  const bounded = Math.min(LEVELS.length - 1, Math.max(0, index));
  return LEVELS[bounded];
}

function percentOfIndex(index: number) {
  const last = LEVELS.length - 1;
  const share = index / last;
  return share * 100;
}

function nearestIndexOf(percent: number) {
  const last = LEVELS.length - 1;
  const position = (percent / 100) * last;
  return Math.round(position);
}

function isRisky(rule: ToolRule) {
  const isMedium = rule.risk === 'medium';
  const isHigh = rule.risk === 'high';
  return isMedium || isHigh;
}

/** Following the default, a risky tool stays at Ask when risky even when the default lets the agent act alone. */
function effectiveLevelOf(rule: ToolRule, defaultLevel: AutonomyLevel) {
  if (!rule.followsDefault) {
    return rule.level;
  }
  const isCapped = isRisky(rule) && defaultLevel === 'auto';
  if (isCapped) {
    return 'risky';
  }
  return defaultLevel;
}

function ruleLineOf(rule: ToolRule, defaultLevel: AutonomyLevel) {
  const effective = effectiveLevelOf(rule, defaultLevel);
  const phrase = LEVEL_PHRASE[effective];
  if (!rule.followsDefault) {
    return `${phrase}, set for this tool`;
  }
  const isCapped = effective !== defaultLevel;
  if (isCapped) {
    return `${phrase}, capped for a risky tool`;
  }
  return `${phrase}, like the default`;
}

function stopAlignOf(index: number) {
  if (index === 0) {
    return 'start-0 text-start';
  }
  if (index === LEVELS.length - 1) {
    return 'end-0 text-end';
  }
  return 'start-1/2 -translate-x-1/2 text-center';
}

function stopToneOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'text-foreground';
  }
  return 'text-muted-foreground hover:text-foreground';
}

type AutonomyDialProps = {
  value: AutonomyLevel;
  onValueChange: (level: AutonomyLevel) => void;
  label: string;
};

function AutonomyDial({ value, onValueChange, label }: AutonomyDialProps) {
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const spring = springOf(shouldReduceMotion);
  const index = indexOfLevel(value);
  const restingPercent = percentOfIndex(index);
  const isDragging = dragPercent !== null;
  const knobPercent = dragPercent ?? restingPercent;
  const knobShare = knobPercent / 100;
  const knobTransition = knobTransitionOf(isDragging, spring);
  const valueText = `${STOP_LABEL[value]}. ${LEVEL_SENTENCE[value]}`;

  function percentAt(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const trackStart = rect.left + TRACK_INSET_PX;
    const trackWidth = rect.width - TRACK_INSET_PX * 2;
    const offset = event.clientX - trackStart;
    const share = offset / trackWidth;
    const bounded = Math.min(1, Math.max(0, share));
    return bounded * 100;
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    knobRef.current?.focus({ preventScroll: true });
    setDragPercent(percentAt(event));
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) {
      return;
    }
    setDragPercent(percentAt(event));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) {
      return;
    }
    const percent = percentAt(event);
    const nearest = nearestIndexOf(percent);
    setDragPercent(null);
    onValueChange(levelAt(nearest));
  }

  function cancelDrag() {
    setDragPercent(null);
  }

  function moveFromKeys(event: React.KeyboardEvent<HTMLSpanElement>) {
    const isBack = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
    const isForward = event.key === 'ArrowRight' || event.key === 'ArrowUp';
    if (isBack) {
      event.preventDefault();
      onValueChange(levelAt(index - 1));
      return;
    }
    if (isForward) {
      event.preventDefault();
      onValueChange(levelAt(index + 1));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onValueChange(levelAt(0));
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onValueChange(levelAt(LEVELS.length - 1));
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
        className='relative h-8 cursor-pointer touch-none px-2.5 select-none'
      >
        <div className='relative h-full'>
          <span className='bg-foreground/[0.08] absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full' />
          <motion.span
            aria-hidden='true'
            initial={false}
            animate={{ scaleX: knobShare }}
            transition={knobTransition}
            className='bg-primary/80 absolute inset-x-0 top-1/2 h-1.5 origin-left -translate-y-1/2 rounded-full'
          />
          {LEVELS.map((level, stopIndex) => (
            <span
              key={level}
              aria-hidden='true'
              className='bg-foreground/25 absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full'
              style={{ left: `${percentOfIndex(stopIndex)}%` }}
            />
          ))}
          <motion.span
            ref={knobRef}
            role='slider'
            tabIndex={0}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={LEVELS.length - 1}
            aria-valuenow={index}
            aria-valuetext={valueText}
            onKeyDown={moveFromKeys}
            initial={false}
            animate={{ left: `${knobPercent}%` }}
            transition={knobTransition}
            className='bg-card hairline-ring ring-foreground/15 dark:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.18)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
          />
        </div>
      </div>
      <div className='relative h-5 text-xs'>
        {LEVELS.map((level, stopIndex) => (
          <button
            key={level}
            type='button'
            tabIndex={-1}
            onClick={() => onValueChange(level)}
            className={cn(
              'absolute top-0 cursor-pointer whitespace-nowrap transition-colors duration-150',
              stopAlignOf(stopIndex),
              stopToneOf(level === value)
            )}
          >
            {STOP_LABEL[level]}
          </button>
        ))}
      </div>
    </div>
  );
}

function knobTransitionOf(
  isDragging: boolean,
  spring: ReturnType<typeof springOf>
) {
  if (isDragging) {
    return INSTANT;
  }
  return spring;
}

type ToolRowProps = {
  rule: ToolRule;
  defaultLevel: AutonomyLevel;
  onChange: (rule: ToolRule) => void;
};

function ToolRow({ rule, defaultLevel, onChange }: ToolRowProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmId = useId();
  const checkboxId = useId();
  const effective = effectiveLevelOf(rule, defaultLevel);
  const line = ruleLineOf(rule, defaultLevel);
  const risky = isRisky(rule);
  const riskBadge = riskBadgeOf(rule);

  function pick(level: AutonomyLevel) {
    const needsConfirm = risky && level === 'auto';
    if (needsConfirm) {
      setIsConfirming(true);
      return;
    }
    setIsConfirming(false);
    onChange({ ...rule, followsDefault: false, level });
  }

  function confirmAuto() {
    setIsConfirming(false);
    onChange({ ...rule, followsDefault: false, level: 'auto' });
  }

  function cancelAuto() {
    setIsConfirming(false);
  }

  function changeFollows(checked: boolean) {
    setIsConfirming(false);
    if (checked) {
      onChange({ ...rule, followsDefault: true });
      return;
    }
    onChange({ ...rule, followsDefault: false, level: effective });
  }

  return (
    <div className='flex flex-col gap-2 py-3'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <span className='text-[13px] font-medium'>{rule.label}</span>
        {riskBadge && (
          <Badge variant={riskBadge.variant}>
            {riskBadge.icon}
            {riskBadge.label}
          </Badge>
        )}
      </div>
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
        <Segments
          value={effective}
          segments={ROW_SEGMENTS}
          onValueChange={pick}
          label={`${rule.label}: how much it may do on its own`}
        />
        <label
          htmlFor={checkboxId}
          className='text-muted-foreground flex cursor-pointer items-center gap-2 text-xs'
        >
          <Checkbox
            id={checkboxId}
            checked={rule.followsDefault}
            onCheckedChange={changeFollows}
          />
          Same as default
        </label>
      </div>
      <p className='text-muted-foreground text-xs'>
        <WordRoll text={line} value={indexOfLevel(effective)} />
      </p>
      <Fold open={isConfirming} id={confirmId}>
        <div
          role='group'
          aria-label={`Confirm that ${rule.label} may act on its own`}
          className='bg-destructive/10 flex flex-col gap-2.5 rounded-lg p-3'
        >
          <p className='text-destructive-ink flex items-start gap-2 text-xs leading-5'>
            <CircleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
            {rule.label} on its own means no one checks it before it happens.
            Some of it cannot be undone.
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              size='sm'
              variant='destructive'
              onClick={confirmAuto}
            >
              Let it act on its own
            </Button>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={cancelAuto}
            >
              Keep asking
            </Button>
          </div>
        </div>
      </Fold>
    </div>
  );
}

function riskBadgeOf(rule: ToolRule) {
  if (!rule.risk) {
    return null;
  }
  if (rule.risk === 'low') {
    return null;
  }
  return RISK_BADGE[rule.risk];
}

export type AutonomySettingsProps = {
  defaultLevel: AutonomyLevel;
  onDefaultLevelChange: (level: AutonomyLevel) => void;
  rules: ToolRule[];
  onRuleChange: (rule: ToolRule) => void;
  agentName: string;
  className?: string;
};

export function AutonomySettings({
  defaultLevel,
  onDefaultLevelChange,
  rules,
  onRuleChange,
  agentName,
  className,
}: AutonomySettingsProps) {
  const titleId = useId();
  const levelIndex = indexOfLevel(defaultLevel);

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header>
        <h3 id={titleId} className='text-sm font-medium'>
          What {agentName} may do on its own
        </h3>
        <p className='text-muted-foreground text-xs'>
          The default applies to every tool that follows it.
        </p>
      </header>
      <div className='flex flex-col gap-3'>
        <AutonomyDial
          value={defaultLevel}
          onValueChange={onDefaultLevelChange}
          label={`Default autonomy of ${agentName}`}
        />
        <p className='bg-foreground/[0.03] rounded-lg px-3 py-2 text-[13px] leading-5'>
          <WordRoll text={LEVEL_SENTENCE[defaultLevel]} value={levelIndex} />
        </p>
      </div>
      <ul aria-label='Tools' className='flex flex-col gap-1'>
        {rules.map((rule) => (
          <li key={rule.id}>
            <ToolRow
              rule={rule}
              defaultLevel={defaultLevel}
              onChange={onRuleChange}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

const INITIAL_RULES: ToolRule[] = [
  {
    id: 'search',
    label: 'Search the web',
    followsDefault: true,
    level: 'risky',
  },
  { id: 'read', label: 'Read files', followsDefault: true, level: 'risky' },
  {
    id: 'write',
    label: 'Write files',
    risk: 'medium',
    followsDefault: true,
    level: 'risky',
  },
  {
    id: 'commands',
    label: 'Run commands',
    risk: 'high',
    followsDefault: false,
    level: 'ask',
  },
  {
    id: 'email',
    label: 'Send email',
    risk: 'high',
    followsDefault: true,
    level: 'risky',
  },
];

function ruleAnnouncementOf(rule: ToolRule, defaultLevel: AutonomyLevel) {
  const line = ruleLineOf(rule, defaultLevel);
  return `${rule.label}: ${line}`;
}

export default function Review03() {
  const [defaultLevel, setDefaultLevel] = useState<AutonomyLevel>('risky');
  const [rules, setRules] = useState(INITIAL_RULES);
  const [message, setMessage] = useState('');

  function changeDefault(level: AutonomyLevel) {
    setDefaultLevel(level);
    setMessage(`Default set to ${STOP_LABEL[level]}`);
  }

  function changeRule(next: ToolRule) {
    setRules((current) =>
      current.map((rule) => {
        if (rule.id !== next.id) {
          return rule;
        }
        return next;
      })
    );
    setMessage(ruleAnnouncementOf(next, defaultLevel));
  }

  return (
    <div className='flex w-full max-w-[30rem] flex-col gap-2'>
      <AutonomySettings
        agentName='Researcher'
        defaultLevel={defaultLevel}
        onDefaultLevelChange={changeDefault}
        rules={rules}
        onRuleChange={changeRule}
      />
      <LiveRegion message={message} />
    </div>
  );
}
