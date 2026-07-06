import type { CSSProperties } from 'react';

import { ImageIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import type { SceneLook, SubjectId } from './data';

type MugStyle = CSSProperties & {
  '--wall': string;
  '--table': string;
  '--mug': string;
  '--coffee': string;
  '--patch': string;
  '--patch-opacity': number;
  '--patch-x': number;
  '--shadow': string;
  '--shadow-x': number;
  '--shadow-stretch': number;
  '--shadow-opacity': number;
};

function mugStyleOf(look: SceneLook): MugStyle {
  return {
    '--wall': look.wall,
    '--table': look.table,
    '--mug': look.mug,
    '--coffee': look.coffee,
    '--patch': look.patch,
    '--patch-opacity': look.patchOpacity,
    '--patch-x': look.patchX,
    '--shadow': look.shadow,
    '--shadow-x': look.shadowX,
    '--shadow-stretch': look.shadowStretch,
    '--shadow-opacity': look.shadowOpacity,
  };
}

const PATCH_STYLE: CSSProperties = {
  opacity: 'var(--patch-opacity)',
  translate: 'calc(var(--patch-x) * 1px) 0',
};

const SHADOW_STYLE: CSSProperties = {
  opacity: 'var(--shadow-opacity)',
  translate: 'calc(var(--shadow-x) * 1px) 0',
  scale: 'var(--shadow-stretch) 1',
};

const MUG_BASE_X = 80;

const MUG_BASE_Y = 88;

function mugTransformOf(look: SceneLook) {
  const shift = `translate(${look.mugX} 0)`;
  const pivot = `translate(${MUG_BASE_X} ${MUG_BASE_Y})`;
  const scale = `scale(${look.mugScale})`;
  const back = `translate(${-MUG_BASE_X} ${-MUG_BASE_Y})`;
  return `${shift} ${pivot} ${scale} ${back}`;
}

export function MugScene({ look }: { look: SceneLook }) {
  const shadowX = MUG_BASE_X + look.mugX;
  const shadowRadius = 24 * look.mugScale;

  return (
    <svg
      viewBox='0 0 160 120'
      preserveAspectRatio='xMidYMid slice'
      aria-hidden='true'
      className='size-full'
      style={mugStyleOf(look)}
    >
      <rect
        width='160'
        height='120'
        className='fill-(--wall) transition-[fill] duration-500'
      />
      <rect
        x='104'
        y='8'
        width='40'
        height='54'
        rx='3'
        style={PATCH_STYLE}
        className='fill-(--patch) transition-[fill,opacity,translate] duration-500'
      />
      <rect
        y='84'
        width='160'
        height='36'
        className='fill-(--table) transition-[fill] duration-500'
      />
      <ellipse
        cx={shadowX}
        cy='90'
        rx={shadowRadius}
        ry='3.5'
        style={SHADOW_STYLE}
        className='origin-center fill-(--shadow) transition-[opacity,translate,scale] duration-500 [transform-box:fill-box]'
      />
      <g transform={mugTransformOf(look)}>
        <path
          d='M98 60h6a8 8 0 0 1 0 16h-6'
          fill='none'
          strokeWidth='4'
          className='stroke-(--mug)'
        />
        <rect
          x='62'
          y='50'
          width='36'
          height='38'
          rx='8'
          className='fill-(--mug)'
        />
        <ellipse cx='80' cy='51' rx='16' ry='3.5' className='fill-(--coffee)' />
        <rect
          x='67'
          y='58'
          width='4'
          height='24'
          rx='2'
          className='fill-card/40'
        />
      </g>
    </svg>
  );
}

function BottlesScene() {
  return (
    <svg
      viewBox='0 0 160 120'
      preserveAspectRatio='xMidYMid slice'
      aria-hidden='true'
      className='size-full'
    >
      <rect width='160' height='120' className='fill-info/12' />
      <rect y='92' width='160' height='28' className='fill-foreground/10' />
      <rect y='90' width='160' height='3' className='fill-foreground/20' />
      <ellipse cx='44' cy='94' rx='18' ry='3' className='fill-foreground/15' />
      <ellipse cx='79' cy='94' rx='20' ry='3' className='fill-foreground/15' />
      <ellipse cx='119' cy='94' rx='22' ry='3' className='fill-foreground/15' />
      <rect
        x='40'
        y='34'
        width='8'
        height='20'
        rx='3'
        className='fill-success/60'
      />
      <rect
        x='32'
        y='50'
        width='24'
        height='42'
        rx='8'
        className='fill-success/60'
      />
      <rect
        x='36'
        y='64'
        width='16'
        height='14'
        rx='2'
        className='fill-card/60'
      />
      <rect
        x='74'
        y='20'
        width='10'
        height='24'
        rx='4'
        className='fill-primary/55'
      />
      <rect
        x='66'
        y='40'
        width='26'
        height='52'
        rx='9'
        className='fill-primary/55'
      />
      <rect
        x='70'
        y='58'
        width='18'
        height='16'
        rx='2'
        className='fill-card/60'
      />
      <rect
        x='114'
        y='46'
        width='10'
        height='14'
        rx='4'
        className='fill-warning/60'
      />
      <rect
        x='104'
        y='58'
        width='30'
        height='34'
        rx='10'
        className='fill-warning/60'
      />
      <rect
        x='109'
        y='68'
        width='20'
        height='12'
        rx='2'
        className='fill-card/60'
      />
    </svg>
  );
}

function PlantScene() {
  return (
    <svg
      viewBox='0 0 160 120'
      preserveAspectRatio='xMidYMid slice'
      aria-hidden='true'
      className='size-full'
    >
      <rect width='160' height='120' className='fill-success/10' />
      <rect y='98' width='160' height='22' className='fill-foreground/8' />
      <ellipse
        cx='80'
        cy='100'
        rx='26'
        ry='3.5'
        className='fill-foreground/15'
      />
      <ellipse
        cx='80'
        cy='46'
        rx='7'
        ry='24'
        transform='rotate(-55 80 70)'
        className='fill-success/45'
      />
      <ellipse
        cx='80'
        cy='46'
        rx='7'
        ry='24'
        transform='rotate(55 80 70)'
        className='fill-success/45'
      />
      <ellipse
        cx='80'
        cy='44'
        rx='8'
        ry='26'
        transform='rotate(-26 80 70)'
        className='fill-success/60'
      />
      <ellipse
        cx='80'
        cy='44'
        rx='8'
        ry='26'
        transform='rotate(26 80 70)'
        className='fill-success/60'
      />
      <ellipse cx='80' cy='40' rx='8' ry='30' className='fill-success/75' />
      <path
        d='M62 78h36l-4 20a4 4 0 0 1-4 3H70a4 4 0 0 1-4-3Z'
        className='fill-warning/65'
      />
      <rect
        x='58'
        y='72'
        width='44'
        height='8'
        rx='3'
        className='fill-warning/80'
      />
    </svg>
  );
}

function HillsScene() {
  return (
    <svg
      viewBox='0 0 160 120'
      preserveAspectRatio='xMidYMid slice'
      aria-hidden='true'
      className='size-full'
    >
      <rect width='160' height='120' className='fill-primary/14' />
      <circle cx='112' cy='40' r='15' className='fill-warning/70' />
      <rect
        x='20'
        y='26'
        width='34'
        height='7'
        rx='3.5'
        className='fill-card/60'
      />
      <rect
        x='32'
        y='36'
        width='24'
        height='6'
        rx='3'
        className='fill-card/45'
      />
      <path
        d='M0 84 Q30 58 62 76 T130 70 T160 80 V120 H0Z'
        className='fill-success/30'
      />
      <path
        d='M0 100 Q40 76 82 94 T160 92 V120 H0Z'
        className='fill-success/50'
      />
      <path
        d='M0 112 Q50 98 100 110 T160 106 V120 H0Z'
        className='fill-success/70'
      />
    </svg>
  );
}

function WindowScene() {
  return (
    <svg
      viewBox='0 0 160 120'
      preserveAspectRatio='xMidYMid slice'
      aria-hidden='true'
      className='size-full'
    >
      <rect width='160' height='120' className='fill-foreground/6' />
      <rect
        x='40'
        y='12'
        width='80'
        height='64'
        rx='3'
        className='fill-info/22'
      />
      <rect
        x='40'
        y='12'
        width='80'
        height='64'
        rx='3'
        fill='none'
        strokeWidth='3'
        className='stroke-foreground/35'
      />
      <path
        d='M80 12v64M40 44h80'
        fill='none'
        strokeWidth='2.5'
        className='stroke-foreground/35'
      />
      <rect
        x='34'
        y='76'
        width='92'
        height='5'
        rx='2'
        className='fill-foreground/25'
      />
      <path d='M48 96h64l12 20H36Z' className='fill-warning/25' />
      <rect
        x='60'
        y='86'
        width='42'
        height='6'
        rx='2'
        className='fill-foreground/50'
      />
      <rect
        x='96'
        y='62'
        width='6'
        height='30'
        rx='2'
        className='fill-foreground/50'
      />
      <rect
        x='62'
        y='92'
        width='4'
        height='20'
        rx='1.5'
        className='fill-foreground/50'
      />
      <rect
        x='96'
        y='92'
        width='4'
        height='20'
        rx='1.5'
        className='fill-foreground/50'
      />
    </svg>
  );
}

function BowlScene() {
  return (
    <svg
      viewBox='0 0 160 120'
      preserveAspectRatio='xMidYMid slice'
      aria-hidden='true'
      className='size-full'
    >
      <rect width='160' height='120' className='fill-warning/10' />
      <rect y='88' width='160' height='32' className='fill-foreground/9' />
      <ellipse cx='80' cy='94' rx='42' ry='4' className='fill-foreground/15' />
      <circle cx='66' cy='60' r='11' className='fill-destructive/55' />
      <circle cx='86' cy='56' r='12' className='fill-warning/70' />
      <circle cx='104' cy='61' r='10' className='fill-success/60' />
      <path d='M42 66h76a38 28 0 0 1-76 0Z' className='fill-primary/55' />
      <rect
        x='40'
        y='64'
        width='80'
        height='5'
        rx='2.5'
        className='fill-primary/75'
      />
    </svg>
  );
}

const SUBJECT_SCENES: Record<SubjectId, React.ReactNode> = {
  mug: null,
  bottles: <BottlesScene />,
  plant: <PlantScene />,
  hills: <HillsScene />,
  window: <WindowScene />,
  bowl: <BowlScene />,
};

type SubjectSceneProps = {
  id: SubjectId;
  mugLook: SceneLook;
};

export function SubjectScene({ id, mugLook }: SubjectSceneProps) {
  if (id === 'mug') {
    return <MugScene look={mugLook} />;
  }
  return SUBJECT_SCENES[id];
}

export type TakeState = 'idle' | 'developing' | 'ready';

const TAKE_STATE_CLASS: Record<TakeState, string> = {
  idle: 'opacity-0',
  developing: 'scale-[1.08] opacity-80 blur-lg saturate-50',
  ready: 'scale-100 opacity-100 blur-[0px] saturate-100',
};

function placeholderOf(state: TakeState) {
  if (state === 'idle') {
    return 'opacity-100';
  }
  return 'opacity-0';
}

const DEVELOPS =
  'starting:scale-[1.08] starting:opacity-80 starting:blur-lg starting:saturate-50';

function developsOf(develops: boolean) {
  if (develops) {
    return DEVELOPS;
  }
  return undefined;
}

type TakeFrameProps = {
  state: TakeState;
  className?: string;
  develops?: boolean;
  children: React.ReactNode;
};

export function TakeFrame({
  state,
  className,
  develops = false,
  children,
}: TakeFrameProps) {
  return (
    <div
      className={cn(
        'hairline-ring bg-foreground/[0.05] ring-border relative aspect-[4/3] overflow-hidden rounded-lg',
        className
      )}
    >
      <ImageIcon
        className={cn(
          'text-muted-foreground/50 absolute inset-0 m-auto size-5 transition-opacity duration-300',
          placeholderOf(state)
        )}
      />
      <div
        aria-hidden='true'
        className={cn(
          'absolute inset-0 transition-[filter,scale,opacity] duration-[900ms] ease-(--ease-out-strong)',
          TAKE_STATE_CLASS[state],
          developsOf(develops)
        )}
      >
        {children}
      </div>
    </div>
  );
}
