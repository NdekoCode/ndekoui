import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { hashOf, pickedFrom } from '@/registry/ndeko/lib/seeded';
import { cn } from '@/registry/ndeko/lib/utils';

import { TOPIC_GLYPH, topicOf, type TopicId } from './data';

type CoverStyle = React.CSSProperties & { '--topic': string };

type GemStyle = React.CSSProperties & { '--gem': string };

type Placement = {
  gem: string;
  near: string;
  far: string;
};

/** A post always lands on the same placement, so its cover never changes between visits. */
const PLACEMENTS: Placement[] = [
  {
    gem: 'left-[24%] top-[52%]',
    near: 'left-[40%] top-[30%]',
    far: 'left-[54%] top-[66%]',
  },
  {
    gem: 'left-1/2 top-[46%]',
    near: 'left-[30%] top-[66%]',
    far: 'left-[70%] top-[28%]',
  },
  {
    gem: 'left-[72%] top-[52%]',
    near: 'left-[54%] top-[28%]',
    far: 'left-[38%] top-[66%]',
  },
];

const PLATE = 'absolute -translate-x-1/2 -translate-y-1/2';

const GHOST =
  'bg-[color-mix(in_oklab,var(--topic)_10%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--topic)_30%,transparent)]';

const SIZE_CLASS = {
  card: {
    frame: 'aspect-[16/9] rounded-lg',
    gem: 'size-12 rounded-[14px] [&_svg]:size-6',
    ghost: 'size-9 rounded-[11px]',
  },
  featured: {
    frame: 'aspect-[16/9] rounded-xl @3xl:aspect-auto @3xl:h-full',
    gem: 'size-16 rounded-[18px] [&_svg]:size-8',
    ghost: 'size-12 rounded-[14px]',
  },
};

type CoverProps = {
  topic: TopicId;
  seed: string;
  size?: keyof typeof SIZE_CLASS;
};

export function Cover({ topic, seed, size = 'card' }: CoverProps) {
  const Glyph = TOPIC_GLYPH[topic];
  const { series } = topicOf(topic);
  const color = seriesColorOf(series);
  const hash = hashOf(seed);
  const placement = pickedFrom(PLACEMENTS, hash);
  const sizeClass = SIZE_CLASS[size];
  const coverStyle: CoverStyle = {
    '--topic': color,
    backgroundColor: 'color-mix(in oklab, var(--topic) 9%, var(--card))',
  };
  const hatchStyle = {
    backgroundImage: hatchOf('var(--topic)', 14),
    maskImage: 'linear-gradient(to left, black, transparent 75%)',
  };
  const gemStyle: GemStyle = { '--gem': color };

  return (
    <div
      aria-hidden='true'
      style={coverStyle}
      className={cn('relative isolate w-full overflow-hidden', sizeClass.frame)}
    >
      <span style={hatchStyle} className='absolute inset-0' />
      <span className={cn(PLATE, GHOST, sizeClass.ghost, placement.far)} />
      <span className={cn(PLATE, GHOST, sizeClass.ghost, placement.near)} />
      <span
        style={gemStyle}
        className={cn(
          PLATE,
          'gem-plate flex items-center justify-center',
          sizeClass.gem,
          placement.gem
        )}
      >
        <Glyph />
      </span>
    </div>
  );
}
