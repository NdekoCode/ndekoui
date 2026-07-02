import type { Metadata } from 'next';
import Link from 'next/link';

import { countLabel } from '@/lib/site';

import { CategoryThumbnail } from './_catalog/category-thumbnail';
import { countComponents, publishedFamilies } from './_catalog/families';
import { catalog } from './_generated/catalog';

export const metadata: Metadata = {
  title: 'Components - ndekoui',
  description:
    'Ready-made components built on ndekoui primitives, grouped by family, each installable with the shadcn CLI.',
};

export default function ComponentsIndexPage() {
  const families = publishedFamilies(catalog);
  const hasFamilies = families.length > 0;
  const total = countComponents(catalog);

  return (
    <div className='flex flex-col gap-14'>
      <header className='grid gap-6 md:grid-cols-2 md:items-end'>
        <div className='flex flex-col gap-2'>
          <p className='text-primary-ink text-xs font-medium'>
            {countLabel(total, 'component', 'components')}
          </p>
          <h1 className='text-3xl font-semibold text-balance sm:text-4xl'>
            Components for the screens you build every week
          </h1>
        </div>
        <p className='text-muted-foreground max-w-md text-[13px] text-pretty md:justify-self-end'>
          Compositions built on the primitives and grouped by what they do. Open
          a category to try them, read their code and copy the command that
          installs them in your project.
        </p>
      </header>
      {!hasFamilies && (
        <p className='hairline-border border-foreground/20 text-muted-foreground rounded-xl border-dashed p-6 text-[13px]'>
          No category is published yet. Run pnpm registry:build after adding a
          category manifest.
        </p>
      )}
      {families.map((family) => (
        <section key={family.name} className='flex flex-col gap-5'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-base font-semibold'>{family.name}</h2>
            <p className='text-muted-foreground text-[13px]'>
              {family.description}
            </p>
          </div>
          <ul className='grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4'>
            {family.categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/components/${category.slug}`}
                  className='group bg-card hairline-ring ring-border hover:bg-foreground/[0.015] focus-visible:ring-ring/25 flex flex-col gap-3 rounded-xl p-2 pb-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[background-color,box-shadow] outline-none focus-visible:ring-[3px]'
                >
                  <CategoryThumbnail slug={category.slug} />
                  <span className='flex items-baseline justify-between gap-2 px-1'>
                    <span className='text-[13px] font-medium'>
                      {category.name}
                    </span>
                    <span className='text-muted-foreground text-xs tabular-nums'>
                      {countLabel(
                        category.entries.length,
                        'component',
                        'components'
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
