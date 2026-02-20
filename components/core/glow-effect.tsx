'use client';
import { cn } from '@/lib/utils';
import { motion, Transition, useReducedMotion } from 'motion/react';
import { useSyncExternalStore } from 'react';

export type GlowEffectProps = {
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  mode?:
    'rotate' | 'pulse' | 'breathe' | 'colorShift' | 'flowHorizontal' | 'static';
  blur?:
    | number
    | 'softest'
    | 'soft'
    | 'medium'
    | 'strong'
    | 'stronger'
    | 'strongest'
    | 'none';
  transition?: Transition;
  scale?: number;
  duration?: number;
};

const DEFAULT_COLORS = [
  'var(--primary)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
];

const COLOR_SEPARATOR = '|';

const CSS_VARIABLE = /^var\((--[\w-]+)\)$/;

type GlowKeyframes = string | string[] | number[];

type GlowAnimation = {
  background: string | string[];
  scale?: number[];
  opacity?: number[];
  transition?: Transition;
};

function subscribeToThemeChange(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });
  return () => observer.disconnect();
}

function resolveColor(color: string, rootStyle: CSSStyleDeclaration) {
  const match = CSS_VARIABLE.exec(color.trim());
  if (!match) {
    return color;
  }
  const value = rootStyle.getPropertyValue(match[1]).trim();
  if (!value) {
    return color;
  }
  return value;
}

function firstFrameOf(keyframes: GlowKeyframes) {
  if (Array.isArray(keyframes)) {
    return keyframes[0];
  }
  return keyframes;
}

function stillFrameOf(animation: GlowAnimation) {
  const still: Record<string, string | number> = {
    background: firstFrameOf(animation.background),
  };
  if (animation.scale) {
    still.scale = firstFrameOf(animation.scale);
  }
  if (animation.opacity) {
    still.opacity = firstFrameOf(animation.opacity);
  }
  return still;
}

function glowAnimationOf(
  prefersReducedMotion: boolean | null,
  animation: GlowAnimation
) {
  if (prefersReducedMotion) {
    return stillFrameOf(animation);
  }
  return animation;
}

export function GlowEffect({
  className,
  style,
  colors = DEFAULT_COLORS,
  mode = 'rotate',
  blur = 'medium',
  transition,
  scale = 1,
  duration = 5,
}: GlowEffectProps) {
  const prefersReducedMotion = useReducedMotion();
  const colorList = colors.join(COLOR_SEPARATOR);

  // Motion cannot blend var() colours inside a gradient, so token colours are read as values and read again when the theme changes.
  const resolvedColorList = useSyncExternalStore(
    subscribeToThemeChange,
    () => {
      const rootStyle = getComputedStyle(document.documentElement);
      return colors
        .map((color) => resolveColor(color, rootStyle))
        .join(COLOR_SEPARATOR);
    },
    () => colorList
  );
  const glowColors = resolvedColorList.split(COLOR_SEPARATOR);

  const BASE_TRANSITION: Transition = {
    repeat: Infinity,
    duration: duration,
    ease: 'linear',
  };

  const animations: Record<
    NonNullable<GlowEffectProps['mode']>,
    GlowAnimation
  > = {
    rotate: {
      background: [
        `conic-gradient(from 0deg at 50% 50%, ${glowColors.join(', ')})`,
        `conic-gradient(from 360deg at 50% 50%, ${glowColors.join(', ')})`,
      ],
      transition: {
        ...(transition ?? BASE_TRANSITION),
      },
    },
    pulse: {
      background: glowColors.map(
        (color) =>
          `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`
      ),
      scale: [1 * scale, 1.1 * scale, 1 * scale],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror' as const,
        }),
      },
    },
    breathe: {
      background: [
        ...glowColors.map(
          (color) =>
            `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`
        ),
      ],
      scale: [1 * scale, 1.05 * scale, 1 * scale],
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror' as const,
        }),
      },
    },
    colorShift: {
      background: glowColors.map((color, index) => {
        const nextColor = glowColors[(index + 1) % glowColors.length];
        return `conic-gradient(from 0deg at 50% 50%, ${color} 0%, ${nextColor} 50%, ${color} 100%)`;
      }),
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror' as const,
        }),
      },
    },
    flowHorizontal: {
      background: glowColors.map((color) => {
        const nextColor =
          glowColors[(glowColors.indexOf(color) + 1) % glowColors.length];
        return `linear-gradient(to right, ${color}, ${nextColor})`;
      }),
      transition: {
        ...(transition ?? {
          ...BASE_TRANSITION,
          repeatType: 'mirror' as const,
        }),
      },
    },
    static: {
      background: `linear-gradient(to right, ${glowColors.join(', ')})`,
    },
  };

  const getBlurClass = (blur: GlowEffectProps['blur']) => {
    if (typeof blur === 'number') {
      return `blur-[${blur}px]`;
    }

    const presets = {
      softest: 'blur-xs',
      soft: 'blur-sm',
      medium: 'blur-md',
      strong: 'blur-lg',
      stronger: 'blur-xl',
      strongest: 'blur-xl',
      none: 'blur-none',
    };

    return presets[blur as keyof typeof presets];
  };

  const animate = glowAnimationOf(prefersReducedMotion, animations[mode]);

  return (
    <motion.div
      style={
        {
          ...style,
          '--scale': scale,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        } as React.CSSProperties
      }
      animate={animate}
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        'scale-[var(--scale)] transform-gpu',
        getBlurClass(blur),
        className
      )}
    />
  );
}
