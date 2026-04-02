import { type ShapeId } from './data';

function OrbitShape() {
  return (
    <>
      <circle
        cx='12'
        cy='12'
        r='7.5'
        fill='none'
        strokeWidth='2.5'
        className='stroke-current'
      />
      <circle cx='18.5' cy='6' r='2.5' className='fill-current' />
    </>
  );
}

function PeaksShape() {
  return (
    <>
      <path d='M2 19 9 6l7 13Z' className='fill-current' />
      <path d='m11 19 5.5-9 5.5 9Z' className='fill-current' />
    </>
  );
}

function StackShape() {
  return (
    <>
      <rect x='3' y='4' width='18' height='4' rx='2' className='fill-current' />
      <rect
        x='5'
        y='10'
        width='14'
        height='4'
        rx='2'
        className='fill-current'
      />
      <rect
        x='7'
        y='16'
        width='10'
        height='4'
        rx='2'
        className='fill-current'
      />
    </>
  );
}

function PetalsShape() {
  return (
    <>
      <circle cx='12' cy='7' r='4.5' className='fill-current' />
      <circle cx='12' cy='17' r='4.5' className='fill-current' />
      <circle cx='7' cy='12' r='4.5' className='fill-current' />
      <circle cx='17' cy='12' r='4.5' className='fill-current' />
    </>
  );
}

function ArchShape() {
  return (
    <path
      d='M4 20V12a8 8 0 0 1 16 0v8h-4.5v-8a3.5 3.5 0 0 0-7 0v8Z'
      className='fill-current'
    />
  );
}

function HexagonShape() {
  return (
    <>
      <path
        d='M12 2.5 20.5 7.25v9.5L12 21.5l-8.5-4.75v-9.5Z'
        className='fill-current'
      />
      <path d='M12 8 15.5 10v4L12 16l-3.5-2v-4Z' className='fill-background' />
    </>
  );
}

function SplitShape() {
  return (
    <>
      <circle
        cx='12'
        cy='12'
        r='8.5'
        fill='none'
        strokeWidth='2'
        className='stroke-current'
      />
      <path d='M12 3.5a8.5 8.5 0 0 1 0 17Z' className='fill-current' />
    </>
  );
}

function TilesShape() {
  return (
    <>
      <rect x='3' y='3' width='8' height='8' rx='2' className='fill-current' />
      <rect x='13' y='3' width='8' height='8' rx='4' className='fill-current' />
      <rect x='3' y='13' width='8' height='8' rx='4' className='fill-current' />
      <rect
        x='13'
        y='13'
        width='8'
        height='8'
        rx='2'
        className='fill-current'
      />
    </>
  );
}

const SHAPES: Record<ShapeId, () => React.ReactNode> = {
  orbit: OrbitShape,
  peaks: PeaksShape,
  stack: StackShape,
  petals: PetalsShape,
  arch: ArchShape,
  hexagon: HexagonShape,
  split: SplitShape,
  tiles: TilesShape,
};

export function MarkShape({ shape }: { shape: ShapeId }) {
  const Shape = SHAPES[shape];

  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' className='size-6 shrink-0'>
      <Shape />
    </svg>
  );
}
