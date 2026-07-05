'use client';

import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import type { RiskLevel } from '@/registry/ndeko/lib/agent-run';
import { hold, spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { CircleAlertIcon, TriangleAlertIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
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

export type AutonomyDialHandle = {
  /** Glides the knob to a stop, held the way a finger holds it, and lets it catch there. */
  moveTo: (level: AutonomyLevel) => void;
};

const LEVELS: AutonomyLevel[] = ['ask', 'risky', 'auto'];

const LAST_INDEX = LEVELS.length - 1;

/** A spring just short of settling in one go: the knob runs a hair past its stop and comes back to it. */
const CATCH = { type: 'spring', stiffness: 420, damping: 34 } as const;

/** How far a flick carries, in seconds of its release velocity. */
const PROJECTION_S = 0.16;

/** Past either end the knob follows the finger at this fraction of the distance. */
const EDGE_RESISTANCE = 0.18;

/** How long the knob looks held when it is moved from outside: the time of its glide. */
const HELD_MS = 420;

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
  const bounded = Math.min(LAST_INDEX, Math.max(0, index));
  return LEVELS[bounded];
}

function shareOfIndex(index: number) {
  return index / LAST_INDEX;
}

function percentOfIndex(index: number) {
  const share = shareOfIndex(index);
  return share * 100;
}

function nearestIndexOf(share: number) {
  const position = share * LAST_INDEX;
  return Math.round(position);
}

/** The knob travels by transform: its share of the width of the track, which is a size container. */
function knobOffsetOf(share: number) {
  return `calc(${share} * 100cqw)`;
}

function clampedShare(share: number) {
  return Math.min(1, Math.max(0, share));
}

function rubberBand(share: number) {
  if (share < 0) {
    return share * EDGE_RESISTANCE;
  }
  if (share > 1) {
    const overshoot = share - 1;
    return 1 + overshoot * EDGE_RESISTANCE;
  }
  return share;
}

/** Sends the knob to a stop with the catch, or puts it there at once when motion is reduced. */
function glideTo(
  share: MotionValue<number>,
  target: number,
  velocity: number,
  shouldReduceMotion: boolean | null
) {
  if (shouldReduceMotion) {
    share.set(target);
    return null;
  }
  return animate(share, target, { ...CATCH, velocity });
}

function heldScaleOf(isHeld: boolean, shouldReduceMotion: boolean | null) {
  const canScale = isHeld && !shouldReduceMotion;
  if (canScale) {
    return { scale: 1.15 };
  }
  return { scale: 1 };
}

function cursorOf(isGrabbing: boolean) {
  if (isGrabbing) {
    return 'cursor-grabbing';
  }
  return 'cursor-grab';
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
  if (index === LAST_INDEX) {
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
  handleRef?: React.Ref<AutonomyDialHandle>;
};

function AutonomyDial({
  value,
  onValueChange,
  label,
  handleRef,
}: AutonomyDialProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const index = indexOfLevel(value);
  const share = useMotionValue(shareOfIndex(index));
  const knobX = useTransform(share, knobOffsetOf);
  const fillScale = useTransform(share, clampedShare);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isLifted, setIsLifted] = useState(false);
  const { schedule, clearAll } = useTimeouts();
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const isDragging = useRef(false);
  const settling = useRef<ReturnType<typeof animate> | null>(null);
  const releasedAt = useRef<number | null>(null);
  const isHeld = isGrabbing || isLifted;
  const valueText = `${STOP_LABEL[value]}. ${LEVEL_SENTENCE[value]}`;

  useEffect(() => {
    if (isDragging.current) {
      return;
    }
    const wasReleasedHere = releasedAt.current === index;
    releasedAt.current = null;
    // A release already sent the knob to this stop with the speed of the hand: it is left to land.
    if (wasReleasedHere) {
      return;
    }
    const target = shareOfIndex(index);
    settling.current?.stop();
    settling.current = glideTo(share, target, 0, shouldReduceMotion);
  }, [index, share, shouldReduceMotion]);

  function shareAt(clientX: number) {
    const track = trackRef.current;
    if (!track) {
      return share.get();
    }
    const rect = track.getBoundingClientRect();
    const offset = clientX - rect.left;
    const raw = offset / rect.width;
    return rubberBand(raw);
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    settling.current?.stop();
    isDragging.current = true;
    setIsGrabbing(true);
    knobRef.current?.focus({ preventScroll: true });
    share.set(shareAt(event.clientX));
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) {
      return;
    }
    share.set(shareAt(event.clientX));
  }

  function endDrag() {
    if (!isDragging.current) {
      return;
    }
    isDragging.current = false;
    setIsGrabbing(false);
    const velocity = share.getVelocity();
    const carried = velocity * PROJECTION_S;
    const projected = share.get() + carried;
    const nearest = nearestIndexOf(projected);
    const level = levelAt(nearest);
    const stopIndex = indexOfLevel(level);
    const target = shareOfIndex(stopIndex);
    releasedAt.current = stopIndex;
    settling.current = glideTo(share, target, velocity, shouldReduceMotion);
    onValueChange(level);
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
      onValueChange(levelAt(LAST_INDEX));
    }
  }

  function moveTo(level: AutonomyLevel) {
    clearAll();
    setIsLifted(true);
    schedule(() => setIsLifted(false), HELD_MS);
    onValueChange(level);
  }

  useImperativeHandle(handleRef, () => ({ moveTo }));

  return (
    <div className='flex flex-col gap-2'>
      <div
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          'relative h-8 touch-none px-2.5 select-none',
          cursorOf(isGrabbing)
        )}
      >
        <div ref={trackRef} className='@container relative h-full'>
          <span className='bg-foreground/[0.08] absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full' />
          <motion.span
            aria-hidden='true'
            style={{ scaleX: fillScale }}
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
            aria-valuemax={LAST_INDEX}
            aria-valuenow={index}
            aria-valuetext={valueText}
            onKeyDown={moveFromKeys}
            style={{ x: knobX }}
            animate={heldScaleOf(isHeld, shouldReduceMotion)}
            transition={{ duration: 0.12 }}
            className='bg-card hairline-ring ring-foreground/15 dark:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 left-0 -mt-2.5 -ml-2.5 size-5 rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.18)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
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
              'absolute top-0 cursor-pointer whitespace-nowrap transition-[color,scale] duration-150 active:scale-[0.97]',
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
  /** Moves the dial from outside, for a demonstration or a control beside it. */
  dialRef?: React.Ref<AutonomyDialHandle>;
  className?: string;
};

export function AutonomySettings({
  defaultLevel,
  onDefaultLevelChange,
  rules,
  onRuleChange,
  agentName,
  dialRef,
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
          handleRef={dialRef}
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

const START_LEVEL: AutonomyLevel = 'risky';

export default function Review03() {
  const [defaultLevel, setDefaultLevel] = useState<AutonomyLevel>(START_LEVEL);
  const [rules, setRules] = useState(INITIAL_RULES);
  const [message, setMessage] = useState('');
  const dial = useRef<AutonomyDialHandle>(null);

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

  function resetDemo() {
    setDefaultLevel(START_LEVEL);
    setRules(INITIAL_RULES);
  }

  const steps: AutoplayStep[] = [
    { after: 1600, run: () => dial.current?.moveTo('auto') },
    { after: 2400, run: () => dial.current?.moveTo('risky') },
    { after: 800, run: () => dial.current?.moveTo('ask') },
    { after: 2400, run: () => dial.current?.moveTo('risky') },
    { after: 1200, run: hold },
  ];
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2600,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex w-full max-w-[30rem] flex-col gap-2'>
      <ClockGate isActive={isInView}>
        <AutonomySettings
          agentName='Researcher'
          defaultLevel={defaultLevel}
          onDefaultLevelChange={changeDefault}
          rules={rules}
          onRuleChange={changeRule}
          dialRef={dial}
        />
      </ClockGate>
      <LiveRegion message={spokenUnless(isAutoplaying, message)} />
    </div>
  );
}
