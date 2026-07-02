'use client';

import Link from 'next/link';

import {
  StickyScroll,
  type StickyScrollStep,
} from '@/components/core/sticky-scroll';
import { countLabel } from '@/lib/site';

import { PIECES_BY_FAMILY } from './showcase-pieces';

export type SystemCategory = {
  slug: string;
  name: string;
  count: number;
};

export type SystemFamily = {
  name: string;
  description: string;
  count: number;
  categories: SystemCategory[];
};

function FamilyTitle({ family }: { family: SystemFamily }) {
  return (
    <span className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
      <span className='text-2xl'>{family.name}</span>
      <span className='text-muted-foreground text-sm font-normal tabular-nums'>
        {countLabel(family.count, 'component', 'components')}
      </span>
    </span>
  );
}

function FamilyDetails({ family }: { family: SystemFamily }) {
  return (
    <div className='flex flex-col gap-4 transition-opacity duration-200 group-data-[state=inactive]/step:opacity-60'>
      <p className='text-base'>{family.description}</p>
      <ul className='flex flex-wrap gap-1.5'>
        {family.categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/components/${category.slug}`}
              className='bg-foreground/[0.05] text-foreground hover:bg-foreground/[0.09] focus-visible:ring-ring/25 inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors outline-none focus-visible:ring-[3px]'
            >
              {category.name}
              <span className='text-muted-foreground text-xs tabular-nums'>
                {category.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The family's real components on one stage. The sticky panel is decorative for assistive
 * technology (the categories on the other side are the links), so the pieces are inert there.
 */
function FamilyPreview({ family }: { family: SystemFamily }) {
  const pieces = PIECES_BY_FAMILY[family.name] ?? [];

  return (
    <div className='bg-foreground/[0.03] hidden rounded-3xl p-3 @xl:block'>
      <div
        inert
        className='bg-card hairline-ring ring-border flex min-h-[30rem] flex-col items-center justify-center gap-8 rounded-2xl p-8 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        {pieces.map(({ name, Piece }) => (
          <div key={name} className='flex w-full flex-col items-center gap-2'>
            <div className='flex w-full justify-center'>
              <Piece />
            </div>
            <span className='text-muted-foreground font-mono text-xs'>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function stepOf(family: SystemFamily): StickyScrollStep {
  return {
    id: family.name,
    title: <FamilyTitle family={family} />,
    description: <FamilyDetails family={family} />,
    media: <FamilyPreview family={family} />,
  };
}

/** The families scroll past on one side while the preview of the current one stays in view. */
export function SystemScroll({ families }: { families: SystemFamily[] }) {
  const steps = families.map(stepOf);

  return (
    <StickyScroll
      steps={steps}
      stepClassName='min-h-0 py-5 @xl:min-h-[26svh] @xl:py-6'
      frameClassName='top-16 h-[calc(100svh-4rem)] max-h-[44rem]'
    />
  );
}
