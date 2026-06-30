'use client';
import { cn } from '@/lib/utils';
import {
  HTMLMotionProps,
  motion,
  MotionConfig,
  useReducedMotion,
} from 'motion/react';

export const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};

function ReducedMotionConfig({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  if (!prefersReducedMotion) {
    return children;
  }
  return <MotionConfig reducedMotion='always'>{children}</MotionConfig>;
}

function maskColorOf(stopIndex: number) {
  const isInsideBand = stopIndex === 1 || stopIndex === 2;
  if (isInsideBand) {
    return 'black';
  }
  return 'transparent';
}

/** Without explicit levels, each layer blurs `index * intensity` pixels, as before. */
function blursOf(
  blurLevels: readonly number[] | undefined,
  blurLayers: number,
  blurIntensity: number
) {
  const hasLevels = blurLevels !== undefined && blurLevels.length > 0;
  if (hasLevels) {
    return [...blurLevels];
  }
  const layerCount = Math.max(blurLayers, 2);
  return Array.from({ length: layerCount }, (_, index) => {
    return index * blurIntensity;
  });
}

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES;
  blurLayers?: number;
  className?: string;
  blurIntensity?: number;
  blurLevels?: readonly number[];
} & HTMLMotionProps<'div'>;

export function ProgressiveBlur({
  direction = 'bottom',
  blurLayers = 8,
  className,
  blurIntensity = 0.25,
  blurLevels,
  ...props
}: ProgressiveBlurProps) {
  const blurs = blursOf(blurLevels, blurLayers, blurIntensity);
  const bandCount = blurs.length + 1;
  const segmentSize = 1 / bandCount;

  return (
    <ReducedMotionConfig>
      <div aria-hidden='true' className={cn('relative', className)}>
        {blurs.map((blur, index) => {
          const angle = GRADIENT_ANGLES[direction];
          const gradientStops = [
            index * segmentSize,
            (index + 1) * segmentSize,
            (index + 2) * segmentSize,
            (index + 3) * segmentSize,
          ].map((pos, posIndex) => `${maskColorOf(posIndex)} ${pos * 100}%`);

          const gradient = `linear-gradient(${angle}deg, ${gradientStops.join(
            ', '
          )})`;

          return (
            <motion.div
              key={index}
              className='pointer-events-none absolute inset-0 rounded-[inherit]'
              style={{
                maskImage: gradient,
                WebkitMaskImage: gradient,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
              }}
              {...props}
            />
          );
        })}
      </div>
    </ReducedMotionConfig>
  );
}
