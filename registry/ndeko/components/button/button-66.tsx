'use client';

import { useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';

import { GLYPHS, type LivingIconName } from './_parts/living-glyphs';
import { useHover } from './_parts/use-hover';
import { usePose, type Pose } from './_parts/use-pose';

export type LivingTone =
  'secondary' | 'outline' | 'destructive' | 'info' | 'success' | 'warning';

type ToneRecipe = {
  variant: ButtonProps['variant'];
  className?: string;
};

const TONES: Record<LivingTone, ToneRecipe> = {
  secondary: { variant: 'secondary' },
  outline: { variant: 'outline' },
  destructive: { variant: 'destructive' },
  info: {
    variant: 'secondary',
    className: 'bg-info/10 text-info-foreground hover:bg-info/15',
  },
  success: {
    variant: 'secondary',
    className: 'bg-success/10 text-success-foreground hover:bg-success/15',
  },
  warning: {
    variant: 'secondary',
    className: 'bg-warning/10 text-warning-foreground hover:bg-warning/15',
  },
};

/** A demonstration presses deeper than a finger does, so the press reads from across the page. */
const DEMO_PRESSED = 'scale-[0.94]';

function demoPressOf(forcedPose: Pose | undefined) {
  if (forcedPose === 'press') {
    return DEMO_PRESSED;
  }
  return undefined;
}

export type LivingButtonProps = Omit<ButtonProps, 'variant'> & {
  /** The icon that answers the hand: the arrow leaves and returns, the bin lifts its lid, the bell swings once, the download drops. */
  icon: LivingIconName;
  tone?: LivingTone;
  /** Holds the icon in a pose, for a demonstration that plays it without a pointer. */
  pose?: Pose;
};

/**
 * A button whose icon acts out its verb when the hand reaches it and when it is pressed, once and
 * never in a loop. The keyboard gets the same answers as the pointer. The arrow follows the label;
 * the other icons come before it. Under reduced motion the arrow and the bell keep still, and the
 * bin and the download change pose without travelling there.
 */
export function LivingButton({
  icon,
  tone = 'secondary',
  pose: forcedPose,
  className,
  children,
  ...props
}: LivingButtonProps) {
  const { pose: livePose, poseHandlers } = usePose<HTMLSpanElement>();
  const shownPose = forcedPose ?? livePose;
  const recipe = TONES[tone];
  const Glyph = GLYPHS[icon];
  const followsLabel = icon === 'arrow';

  return (
    <span className='contents' {...poseHandlers}>
      <Button
        variant={recipe.variant}
        className={cn(recipe.className, demoPressOf(forcedPose), className)}
        {...props}
      >
        {!followsLabel && <Glyph pose={shownPose} />}
        {children}
        {followsLabel && <Glyph pose={shownPose} />}
      </Button>
    </span>
  );
}

type DemoButton = 'continue' | 'download' | 'delete' | 'remind';

type Forced = {
  button: DemoButton;
  pose: Pose;
};

type DemoBeat = Forced & {
  after: number;
};

type ButtonSpec = {
  id: DemoButton;
  icon: LivingIconName;
  tone: LivingTone;
  label: string;
};

const BUTTONS: ButtonSpec[] = [
  { id: 'continue', icon: 'arrow', tone: 'secondary', label: 'Continue' },
  { id: 'download', icon: 'download', tone: 'outline', label: 'Download' },
  { id: 'delete', icon: 'bin', tone: 'destructive', label: 'Delete' },
  { id: 'remind', icon: 'bell', tone: 'info', label: 'Remind me' },
];

/** Each button is reached, pressed and let go in turn. The bin is reached again after the press, as a hand that stays on it would. */
const BEATS: DemoBeat[] = [
  { after: 1100, button: 'continue', pose: 'hover' },
  { after: 1200, button: 'continue', pose: 'press' },
  { after: 380, button: 'continue', pose: 'rest' },
  { after: 700, button: 'download', pose: 'hover' },
  { after: 1100, button: 'download', pose: 'press' },
  { after: 380, button: 'download', pose: 'rest' },
  { after: 700, button: 'delete', pose: 'hover' },
  { after: 1300, button: 'delete', pose: 'press' },
  { after: 420, button: 'delete', pose: 'hover' },
  { after: 700, button: 'delete', pose: 'rest' },
  { after: 700, button: 'remind', pose: 'hover' },
  { after: 1300, button: 'remind', pose: 'press' },
  { after: 700, button: 'remind', pose: 'rest' },
];

function forcedWhile(isAutoplaying: boolean, forced: Forced | null) {
  if (isAutoplaying) {
    return forced;
  }
  return null;
}

function poseOfButton(forced: Forced | null, id: DemoButton) {
  if (forced === null) {
    return undefined;
  }
  if (forced.button !== id) {
    return undefined;
  }
  return forced.pose;
}

export default function Button66() {
  const [forced, setForced] = useState<Forced | null>(null);
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = BEATS.map((beat) => ({
    after: beat.after,
    run: () => setForced({ button: beat.button, pose: beat.pose }),
  }));
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1500,
    onReset: () => setForced(null),
    isEnabled: !isHovered,
  });
  const shown = forcedWhile(isAutoplaying, forced);

  return (
    <div
      ref={ref}
      className='@container w-full max-w-[34rem]'
      {...hoverHandlers}
    >
      <div className='grid grid-cols-2 justify-items-center gap-3 @lg:flex @lg:flex-wrap @lg:justify-center'>
        {BUTTONS.map((spec) => (
          <LivingButton
            key={spec.id}
            icon={spec.icon}
            tone={spec.tone}
            pose={poseOfButton(shown, spec.id)}
          >
            {spec.label}
          </LivingButton>
        ))}
      </div>
    </div>
  );
}
