import { type ShapeId } from './data';

function LeafShape() {
  return (
    <>
      <path
        d='M4 20C4 10 10 4 20 4c0 10-6 16-16 16Z'
        className='fill-current'
      />
      <path
        d='M6 18 15 9'
        fill='none'
        strokeWidth='1.75'
        strokeLinecap='round'
        className='stroke-background'
      />
    </>
  );
}

function WaveShape() {
  return (
    <>
      <path
        d='M2 9c3.33-3 6.67-3 10 0s6.67 3 10 0'
        fill='none'
        strokeWidth='2.5'
        strokeLinecap='round'
        className='stroke-current'
      />
      <path
        d='M2 16c3.33-3 6.67-3 10 0s6.67 3 10 0'
        fill='none'
        strokeWidth='2.5'
        strokeLinecap='round'
        className='stroke-current'
      />
    </>
  );
}

function BoltShape() {
  return (
    <>
      <rect width='24' height='24' rx='6' className='fill-current' />
      <path
        d='M13.5 4 7 13.5h4.5L10.5 20 17 10.5h-4.5Z'
        className='fill-background'
      />
    </>
  );
}

function RingShape() {
  return (
    <>
      <path
        d='M12 4a8 8 0 1 1-8 8'
        fill='none'
        strokeWidth='3'
        strokeLinecap='round'
        className='stroke-current'
      />
      <circle cx='5.5' cy='5.5' r='2.5' className='fill-current' />
    </>
  );
}

function QuarterShape() {
  return (
    <>
      <path d='M3 21V3a18 18 0 0 1 18 18Z' className='fill-current' />
      <circle cx='18' cy='6' r='3' className='fill-current' />
    </>
  );
}

function DiamondShape() {
  return (
    <>
      <path
        d='m12 3 9 9-9 9-9-9Z'
        fill='none'
        strokeWidth='2'
        strokeLinejoin='round'
        className='stroke-current'
      />
      <path d='m12 8 4 4-4 4-4-4Z' className='fill-current' />
    </>
  );
}

const SHAPES: Record<ShapeId, () => React.ReactNode> = {
  leaf: LeafShape,
  wave: WaveShape,
  bolt: BoltShape,
  ring: RingShape,
  quarter: QuarterShape,
  diamond: DiamondShape,
};

export function MarkShape({ shape }: { shape: ShapeId }) {
  const Shape = SHAPES[shape];

  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' className='size-5 shrink-0'>
      <Shape />
    </svg>
  );
}
