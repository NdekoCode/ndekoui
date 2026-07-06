'use client';

import { motion, useTransform, type MotionValue } from 'motion/react';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { coverOpacityOf, coverStackOf, coverTransformOf } from './cover-math';
import type { GroupCard } from './data';

type FaceStyle = React.CSSProperties & { '--face': string };

function faceStyleOf(card: GroupCard): FaceStyle {
  const hue = seriesColorOf(card.series);
  return { '--face': `color-mix(in oklab, ${hue} 78%, black)` };
}

export function CardFace({ card }: { card: GroupCard }) {
  const visibleMembers = card.members.slice(0, 4);

  return (
    <div
      style={faceStyleOf(card)}
      className='text-primary-foreground relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-2xl bg-(--face) p-4 shadow-[0_1px_2px_rgb(0_0_0/0.2),0_16px_32px_-12px_rgb(0_0_0/0.35)] @sm:p-5'
    >
      <span
        aria-hidden='true'
        className='bg-primary-foreground/10 absolute -top-10 -right-10 size-40 rounded-full'
      />
      <span
        aria-hidden='true'
        className='bg-primary-foreground/[0.07] absolute -bottom-16 -left-8 size-36 rounded-full'
      />
      <div className='relative flex items-center justify-between gap-3'>
        <span className='flex items-center gap-2 text-sm font-semibold'>
          <span
            aria-hidden='true'
            className='border-primary-foreground/90 flex size-5 items-center justify-center rounded-full border-2'
          >
            <span className='bg-primary-foreground/90 size-1.5 rounded-full' />
          </span>
          Tallypot
        </span>
        <span className='text-primary-foreground/90 truncate text-xs font-medium'>
          {card.name}
        </span>
      </div>
      <div className='relative flex flex-col gap-3'>
        <p className='text-primary-foreground/90 font-mono text-sm tabular-nums'>
          •••• •••• •••• {card.last4}
        </p>
        <div className='flex items-end justify-between gap-3'>
          <div className='flex -space-x-2'>
            {visibleMembers.map((member) => (
              <Avatar
                key={member}
                seed={member}
                role='img'
                aria-label={member}
                className='ring-primary-foreground/40 size-6 ring-2'
              />
            ))}
          </div>
          <BrandTile brand={card.network} size='xl' title={card.networkName} />
        </div>
      </div>
    </div>
  );
}

type CoverCardProps = {
  card: GroupCard;
  index: number;
  position: MotionValue<number>;
  isActive: boolean;
  onPick: (index: number) => void;
  className?: string;
};

export function CoverCard({
  card,
  index,
  position,
  isActive,
  onPick,
  className,
}: CoverCardProps) {
  const transform = useTransform(position, (latest) =>
    coverTransformOf(index - latest)
  );
  const opacity = useTransform(position, (latest) =>
    coverOpacityOf(index - latest)
  );
  const zIndex = useTransform(position, (latest) =>
    coverStackOf(index - latest)
  );

  function pick() {
    onPick(index);
  }

  return (
    <motion.li
      style={{ transform, opacity, zIndex }}
      onClick={pick}
      aria-hidden={!isActive}
      className={cn(
        'absolute top-0 left-[calc(50%-var(--card-w)/2)] w-(--card-w) cursor-grab select-none active:cursor-grabbing',
        className
      )}
    >
      <CardFace card={card} />
    </motion.li>
  );
}
