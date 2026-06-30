import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/app/_site/site-footer';
import { SiteHeader } from '@/app/_site/site-header';
import { BundleTileGrid } from '@/app/_site/bundle-tiles';
import { groupsOf, tilesOf } from '@/app/blocks/_shared/bundles';
import {
  countComponents,
  publishedFamilies,
} from '@/app/components/_catalog/families';
import { catalog } from '@/app/components/_generated/catalog';
import { NAVIGATION } from '@/app/docs/navigation';
import { countLabel, SYSTEM_FONT_CLASS } from '@/lib/site';
import { chatItems } from '@/registry/chat-items';
import { primitiveItems } from '@/registry/items';
import { Button } from '@/registry/ndeko/ui/button';
import { Toaster } from '@/registry/ndeko/ui/sonner';
import { TooltipProvider } from '@/registry/ndeko/ui/tooltip';

import { BundlesShowcase, type BundleShelf } from './_home/bundles-showcase';
import {
  ComponentsShowcase,
  type ShowcaseCategory,
  type ShowcaseShelf,
} from './_home/components-showcase';
import { HomeFaq } from './_home/home-faq';
import { HomeHero } from './_home/home-hero';
import { InstallSteps } from './_home/install-steps';
import { LivingWall } from './_home/living-wall';
import { MotionShowcase } from './_home/motion-showcase';
import { PrimitivesShowcase } from './_home/primitives-showcase';
import { SectionHeading } from './_home/section-heading';

export const metadata: Metadata = {
  title: 'Ndeko UI - React components that animate every change of state',
  description:
    'Open-source primitives, components, blocks and templates for React, built on Base UI, motion and Tailwind CSS, installable with the shadcn CLI.',
};

const MARKETING_GROUPS = new Set([
  'headers',
  'heroes',
  'features',
  'logo-clouds',
  'pricing',
  'faqs',
  'ctas',
  'footers',
  'contact',
  'changelog',
  'legal',
]);

const GETTING_STARTED = 'Getting Started';

function showcaseCategoryOf(category: (typeof catalog)[number]) {
  const showcased: ShowcaseCategory = {
    slug: category.slug,
    name: category.name,
    count: category.entries.length,
  };
  return showcased;
}

function componentShelves(): ShowcaseShelf[] {
  const largestFirst = [...catalog].sort(
    (first, second) => second.entries.length - first.entries.length
  );
  const allShelf: ShowcaseShelf = {
    name: 'Largest',
    categories: largestFirst.map(showcaseCategoryOf),
  };
  const familyShelves = publishedFamilies(catalog).map((family) => ({
    name: family.name,
    categories: family.categories.map(showcaseCategoryOf),
  }));
  return [allShelf, ...familyShelves];
}

function isMarketingGroup(slug: string) {
  return MARKETING_GROUPS.has(slug);
}

function blockShelves(): BundleShelf[] {
  const groups = groupsOf('blocks');
  const applicationGroups = groups.filter(
    (group) => !isMarketingGroup(group.slug)
  );
  const marketingGroups = groups.filter((group) =>
    isMarketingGroup(group.slug)
  );
  const shelves: BundleShelf[] = [
    { name: 'Application', tiles: tilesOf('blocks', applicationGroups) },
    { name: 'Marketing', tiles: tilesOf('blocks', marketingGroups) },
  ];
  return shelves.filter((shelf) => shelf.tiles.length > 0);
}

function entryTotal(kind: 'blocks' | 'templates') {
  let total = 0;
  for (const group of groupsOf(kind)) {
    total += group.entries.length;
  }
  return total;
}

function motionComponentTotal() {
  let total = 0;
  for (const group of NAVIGATION) {
    if (group.name === GETTING_STARTED) {
      continue;
    }
    total += group.children.length;
  }
  return total;
}

function LinkButton({ href, children }: { href: string; children: string }) {
  return (
    <Button
      variant='outline'
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}

export default function HomePage() {
  const componentTotal = countComponents(catalog);
  const primitiveTotal = primitiveItems.length + chatItems.length;
  const blockTotal = entryTotal('blocks');
  const blockGroupTotal = groupsOf('blocks').length;
  const templateTotal = entryTotal('templates');
  const templateTiles = tilesOf('templates', groupsOf('templates'));
  const hasTemplates = templateTiles.length > 0;
  const motionTotal = motionComponentTotal();

  return (
    <TooltipProvider>
      <div
        className={`${SYSTEM_FONT_CLASS} bg-background text-foreground min-h-screen antialiased`}
      >
        <SiteHeader />
        <main className='mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pt-12 pb-24 md:px-6 md:pt-16'>
          <div className='flex flex-col gap-10'>
            <HomeHero />
            <LivingWall />
          </div>
          <section
            aria-labelledby='components-title'
            className='flex flex-col gap-8'
          >
            <SectionHeading
              id='components-title'
              eyebrow={`${countLabel(componentTotal, 'component', 'components')} in ${countLabel(catalog.length, 'category', 'categories')}`}
              title='Components grouped by what they do'
              description='Every category shows its variants side by side, each with its code and the command that installs it.'
              action={
                <LinkButton href='/components'>
                  {`All ${catalog.length} categories`}
                </LinkButton>
              }
            />
            <ComponentsShowcase shelves={componentShelves()} />
          </section>
          <section
            aria-labelledby='primitives-title'
            className='flex flex-col gap-8'
          >
            <SectionHeading
              id='primitives-title'
              eyebrow={countLabel(primitiveTotal, 'primitive', 'primitives')}
              title='Try the pieces before you install them'
              description='Every component is built from these primitives on Base UI. Press, slide and open them here: the motion you feel is the motion you install.'
              action={<LinkButton href='/kit'>See every primitive</LinkButton>}
            />
            <PrimitivesShowcase />
          </section>
          <section
            aria-labelledby='blocks-title'
            className='flex flex-col gap-8'
          >
            <SectionHeading
              id='blocks-title'
              eyebrow={`${countLabel(blockTotal, 'block', 'blocks')} in ${countLabel(blockGroupTotal, 'group', 'groups')}`}
              title='Whole sections of a product, with fictional data'
              description='App shells, boards, task lists, settings and marketing sections. Each one installs with its parts and works from a phone to a wide screen.'
              action={<LinkButton href='/blocks'>All blocks</LinkButton>}
            />
            <BundlesShowcase shelves={blockShelves()} />
          </section>
          {hasTemplates && (
            <section
              aria-labelledby='templates-title'
              className='flex flex-col gap-8'
            >
              <SectionHeading
                id='templates-title'
                eyebrow={countLabel(templateTotal, 'template', 'templates')}
                title='Complete pages to start a product from'
                description='Landing, pricing, changelog and contact pages assembled from the blocks, one fictional product each.'
                action={
                  <LinkButton href='/templates'>All templates</LinkButton>
                }
              />
              <BundleTileGrid tiles={templateTiles} />
            </section>
          )}
          <section
            aria-labelledby='motion-title'
            className='flex flex-col gap-8'
          >
            <SectionHeading
              id='motion-title'
              eyebrow={countLabel(
                motionTotal,
                'motion component',
                'motion components'
              )}
              title='Motion you can drop into any screen'
              description='Numbers that slide, labels that morph, highlights that follow the pointer. Each one reads the reduced motion setting.'
              action={
                <LinkButton href='/docs'>All motion components</LinkButton>
              }
            />
            <MotionShowcase />
          </section>
          <InstallSteps />
          <HomeFaq />
        </main>
        <SiteFooter />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
