'use client';

import Link from 'next/link';

import { CategoryThumbnail } from '@/app/components/_catalog/category-thumbnail';
import {
  StickyScroll,
  type StickyScrollStep,
} from '@/components/core/sticky-scroll';
import { countLabel } from '@/lib/site';

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

const FULL_PREVIEW = 4;
const SHORT_PREVIEW = 2;

/** Two columns of tiles never leave a hole: four tiles when the family has them, two otherwise. */
function previewCountOf(total: number) {
  if (total >= FULL_PREVIEW) {
    return FULL_PREVIEW;
  }
  return Math.min(total, SHORT_PREVIEW);
}

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

function FamilyPreview({ family }: { family: SystemFamily }) {
  const previewCount = previewCountOf(family.categories.length);
  const shown = family.categories.slice(0, previewCount);

  return (
    <div className='bg-foreground/[0.03] hidden items-center rounded-3xl p-4 @xl:flex'>
      <ul className='grid w-full grid-cols-2 gap-3'>
        {shown.map((category) => (
          <li
            key={category.slug}
            className='bg-card hairline-ring ring-border flex flex-col gap-2.5 rounded-2xl p-2 pb-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            <CategoryThumbnail slug={category.slug} />
            <span className='flex items-baseline justify-between gap-2 px-1'>
              <span className='truncate text-[13px] font-medium'>
                {category.name}
              </span>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {category.count}
              </span>
            </span>
          </li>
        ))}
      </ul>
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
