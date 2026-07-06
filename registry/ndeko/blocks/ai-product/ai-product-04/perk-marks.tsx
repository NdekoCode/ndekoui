import type { PerkId } from './data';

const STROKE: React.SVGAttributes<SVGElement> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const PRICE = (
  <>
    <path
      {...STROKE}
      d='M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7a2 2 0 0 1 1.4.6l6.3 6.3a2 2 0 0 1 0 2.8l-6.7 6.7a2 2 0 0 1-2.8 0l-6.3-6.3a2 2 0 0 1-.6-1.4Z'
    />
    <circle {...STROKE} cx='8.2' cy='8.2' r='1.3' />
    <path {...STROKE} d='m11 14 3-3' />
  </>
);

const CALL = (
  <>
    <path
      {...STROKE}
      d='M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.4A7.5 7.5 0 1 1 20 11.5Z'
    />
    <path {...STROKE} d='M9 11.5h.01M12.5 11.5h.01M16 11.5h.01' />
  </>
);

const CREDITS = (
  <>
    <ellipse {...STROKE} cx='12' cy='6.5' rx='6.5' ry='2.8' />
    <path
      {...STROKE}
      d='M5.5 6.5v5.2c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8V6.5'
    />
    <path
      {...STROKE}
      d='M5.5 11.7v5.1c0 1.5 2.9 2.7 6.5 2.7s6.5-1.2 6.5-2.7v-5.1'
    />
  </>
);

const MARKS: Record<PerkId, React.ReactNode> = {
  price: PRICE,
  call: CALL,
  credits: CREDITS,
};

type PerkMarkProps = {
  perk: PerkId;
  className?: string;
};

export function PerkMark({ perk, className }: PerkMarkProps) {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      focusable='false'
      className={className}
    >
      {MARKS[perk]}
    </svg>
  );
}
