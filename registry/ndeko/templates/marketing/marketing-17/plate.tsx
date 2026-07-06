'use client';

import { useId } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { PILLARS, PILLARS_SECTION, type Pillar } from './data';
import { APOTHEM, sidePathOf, sideStyleOf } from './plate-geometry';

type PlateStyle = React.CSSProperties & { '--turn': string };

const EDGE_PERCENT = 50 + APOTHEM;

const CONNECTOR_PERCENT = 100 - EDGE_PERCENT;

const SIDE_LEFT = { left: `${EDGE_PERCENT}%`, width: `${CONNECTOR_PERCENT}%` };

const SIDE_DOWN = { top: `${EDGE_PERCENT}%`, height: `${CONNECTOR_PERCENT}%` };

function plateStyleOf(turn: number): PlateStyle {
  return { '--turn': `${turn}deg` };
}

function sideToneOf(isActive: boolean) {
  if (isActive) {
    return 'stroke-foreground';
  }
  return 'stroke-foreground/25';
}

function sideWidthOf(isActive: boolean) {
  if (isActive) {
    return 2.2;
  }
  return 0.7;
}

function buttonToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground text-background';
  }
  return 'text-muted-foreground hover:text-foreground';
}

function tabIndexOf(isActive: boolean) {
  if (isActive) {
    return 0;
  }
  return -1;
}

type SideButtonProps = {
  pillar: Pillar;
  index: number;
  isActive: boolean;
  onPick: (index: number) => void;
};

function SideButton({ pillar, index, isActive, onPick }: SideButtonProps) {
  function pick() {
    onPick(index);
  }

  return (
    <button
      type='button'
      role='radio'
      aria-checked={isActive}
      aria-label={pillar.name}
      tabIndex={tabIndexOf(isActive)}
      data-pillar={pillar.id}
      onClick={pick}
      style={sideStyleOf(index)}
      className={cn(
        'focus-visible:ring-ring absolute flex w-[5.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-center outline-none focus-visible:ring-2',
        'rotate-[calc((var(--turn)_+_var(--face))*-1)] transition-[rotate,color,background-color] duration-[700ms,200ms,200ms] ease-(--ease-out-strong)',
        buttonToneOf(isActive)
      )}
    >
      <span className='text-[10px] tabular-nums opacity-70'>
        {pillar.number}
      </span>
      <span className='text-[11px] leading-tight font-medium @xl:text-xs'>
        {pillar.name}
      </span>
    </button>
  );
}

type PlateProps = {
  activeIndex: number;
  turn: number;
  onPick: (index: number) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

export function Plate({ activeIndex, turn, onPick, onKeyDown }: PlateProps) {
  const labelId = useId();
  const activeId = PILLARS[activeIndex].id;

  return (
    <div
      role='radiogroup'
      aria-labelledby={labelId}
      onKeyDown={onKeyDown}
      style={plateStyleOf(turn)}
      className='relative aspect-square w-full [--face:90deg] @3xl:[--face:0deg]'
    >
      <p id={labelId} className='sr-only'>
        {PILLARS_SECTION.groupLabel}
      </p>
      <div className='absolute inset-0 rotate-[calc(var(--turn)_+_var(--face))] transition-[rotate] duration-700 ease-(--ease-out-strong)'>
        <svg
          viewBox='0 0 100 100'
          aria-hidden='true'
          className='absolute inset-0 size-full overflow-visible'
        >
          {PILLARS.map((pillar, index) => {
            const isActive = index === activeIndex;
            return (
              <path
                key={pillar.id}
                d={sidePathOf(index)}
                fill='none'
                strokeLinecap='round'
                strokeWidth={sideWidthOf(isActive)}
                className={cn(
                  'transition-[stroke,stroke-width] duration-500',
                  sideToneOf(isActive)
                )}
              />
            );
          })}
        </svg>
        {PILLARS.map((pillar, index) => (
          <SideButton
            key={pillar.id}
            pillar={pillar}
            index={index}
            isActive={index === activeIndex}
            onPick={onPick}
          />
        ))}
      </div>
      <span
        key={`across-${activeId}`}
        aria-hidden='true'
        style={SIDE_LEFT}
        className='bg-foreground/60 absolute top-1/2 hidden h-px origin-left transition-transform duration-300 ease-(--ease-out-strong) @3xl:block starting:scale-x-0'
      />
      <span
        key={`down-${activeId}`}
        aria-hidden='true'
        style={SIDE_DOWN}
        className='bg-foreground/60 absolute left-1/2 w-px origin-top transition-transform duration-300 ease-(--ease-out-strong) @3xl:hidden starting:scale-y-0'
      />
    </div>
  );
}
