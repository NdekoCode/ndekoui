import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/app/_site/json-ld';
import { breadcrumbOf, itemListOf, pageMetadataOf } from '@/app/_site/seo';
import { countLabel } from '@/lib/site';

import { Button } from '@/registry/ndeko/ui/button';

import { CatalogRail } from '../_catalog/catalog-rail';
import { ComponentPreview } from '../_catalog/component-preview';
import { ComponentTile } from '../_catalog/component-tile';
import { publishedFamilies } from '../_catalog/families';
import { catalog } from '../_generated/catalog';

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

function categoryOf(slug: string) {
  return catalog.find((category) => category.slug === slug);
}

export function generateStaticParams() {
  return catalog.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = categoryOf(slug);
  if (!category) {
    return {};
  }
  const count = countLabel(category.entries.length, 'component', 'components');
  const subject = category.name.toLowerCase();
  return pageMetadataOf({
    title: `${category.name} components for React and Tailwind CSS - ndekoui`,
    description: `${count} of the ${subject} category for React, built on Base UI, motion and Tailwind CSS 4, animated and installable with the shadcn CLI.`,
    path: `/components/${category.slug}`,
    keywords: [
      `React ${subject} component`,
      `${subject} component`,
      `Tailwind CSS ${subject}`,
      `shadcn ${subject}`,
      `animated ${subject}`,
    ],
  });
}

const CATEGORY_LINK =
  'inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-[current=page]:bg-foreground aria-[current=page]:font-medium aria-[current=page]:text-background';

function ariaCurrentOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = categoryOf(slug);
  if (!category) {
    notFound();
  }
  const count = countLabel(category.entries.length, 'component', 'components');
  const families = publishedFamilies(catalog);
  const categoryPath = `/components/${category.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbOf([
        { name: 'ndekoui', path: '/' },
        { name: 'Components', path: '/components' },
        { name: category.name, path: categoryPath },
      ]),
      itemListOf(categoryPath, category.entries),
    ],
  };

  return (
    <div className='grid gap-10 lg:grid-cols-[12.5rem_minmax(0,1fr)]'>
      <JsonLd data={structuredData} />
      <CatalogRail families={families} currentSlug={category.slug} />
      <div className='flex min-w-0 flex-col gap-8'>
        <header className='flex flex-col gap-1'>
          <p className='text-primary-ink text-xs font-medium'>{count}</p>
          <h1 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {category.name}
          </h1>
          <p className='text-muted-foreground max-w-xl text-[13px] text-balance'>
            Every variant is built on ndekoui primitives and its design
            language. Open the code of any of them to copy it or the command
            that installs it.
          </p>
        </header>
        <nav
          aria-label='Categories'
          className='-mx-2 flex gap-1 overflow-x-auto px-2 pb-1 lg:hidden'
        >
          {catalog.map((item) => {
            const isCurrent = item.slug === category.slug;
            return (
              <Link
                key={item.slug}
                href={`/components/${item.slug}`}
                scroll={false}
                aria-current={ariaCurrentOf(isCurrent)}
                className={CATEGORY_LINK}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-6'>
          {category.entries.map((entry) => (
            <ComponentTile
              key={entry.name}
              entry={entry}
              preview={
                <ComponentPreview category={category.slug} name={entry.name} />
              }
            />
          ))}
        </div>
        <SuggestComponent categoryName={category.name} />
      </div>
    </div>
  );
}

const SUGGEST_URL = 'https://github.com/ndekocode/ndekoui/issues/new';

function SuggestComponent({ categoryName }: { categoryName: string }) {
  return (
    <aside className='bg-foreground/[0.025] flex flex-col items-start gap-3 rounded-xl p-6 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-sm font-semibold'>
          Missing a {categoryName.toLowerCase()} pattern?
        </h2>
        <p className='text-muted-foreground text-[13px]'>
          Describe it in an issue and it joins the list of what comes next.
        </p>
      </div>
      <Button
        variant='outline'
        nativeButton={false}
        render={<a href={SUGGEST_URL} />}
      >
        Suggest a component
      </Button>
    </aside>
  );
}
