import {
  BRANDS,
  BrandLogo,
  type BrandSlug,
} from '@/registry/ndeko/lib/brand-logos';

type Slot = {
  left: string;
  top: string;
};

/** Three staggered rows, two, three and two marks, like cells of a honeycomb. */
const SLOTS: Slot[] = [
  { left: '50%', top: '50%' },
  { left: '34%', top: '15%' },
  { left: '66%', top: '15%' },
  { left: '20%', top: '50%' },
  { left: '80%', top: '50%' },
  { left: '34%', top: '85%' },
  { left: '66%', top: '85%' },
];

const FLOAT_STEP_SECONDS = 0.85;

function floatStyleOf(index: number): React.CSSProperties {
  const seconds = index * FLOAT_STEP_SECONDS;
  return { animationDelay: `-${seconds}s` };
}

type ConstellationProps = {
  label: string;
  brands: BrandSlug[];
};

export function Constellation({ label, brands }: ConstellationProps) {
  const shown = brands.slice(0, SLOTS.length);

  return (
    <ul aria-label={label} className='relative h-40 w-52'>
      {shown.map((brand, index) => {
        const slot = SLOTS[index];
        const title = BRANDS[brand].title;

        return (
          <li
            key={brand}
            style={slot}
            className='absolute -translate-x-1/2 -translate-y-1/2'
          >
            <span
              style={floatStyleOf(index)}
              className='keycap-3d animate-float flex size-9 items-center justify-center rounded-full motion-reduce:animate-none'
            >
              <BrandLogo brand={brand} title={title} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
