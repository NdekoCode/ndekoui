import type { Metadata } from 'next';
import Link from 'next/link';

import { BundleTileGrid } from '@/app/_site/bundle-tiles';
import { fetchStarCount } from '@/app/_site/repository';
import { SiteFooter } from '@/app/_site/site-footer';
import { SiteHeader } from '@/app/_site/site-header';
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
import {
  BlocksIcon,
  ComponentIcon,
  CpuIcon,
  LayersIcon,
  MonitorIcon,
  MotionIcon,
  RocketIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Toaster } from '@/registry/ndeko/ui/sonner';
import { TooltipProvider } from '@/registry/ndeko/ui/tooltip';

import { AnnouncementBar } from './_home/announcement-bar';
import { BundlesShowcase, type BundleShelf } from './_home/bundles-showcase';
import {
  CatalogueExplorer,
  type ExplorerCategory,
  type ExplorerFamily,
} from './_home/catalogue-explorer';
import { ClosingBand } from './_home/closing-band';
import { EditorSection } from './_home/editor-section';
import { EveryScreen } from './_home/every-screen';
import { HomeFaq } from './_home/home-faq';
import { HeroBackdrop, HomeHero } from './_home/home-hero';
import { HowItWorks, type FoundCategory } from './_home/how-it-works';
import { MotionShowcase } from './_home/motion-showcase';
import { Pillars } from './_home/pillars';
import { PrimitivesShowcase } from './_home/primitives-showcase';
import { ProductStage } from './_home/product-stage';
import { SectionHeading } from './_home/section-heading';
import { Statement } from './_home/statement';

export const metadata: Metadata = {
  title: 'Ndeko UI - React components that animate every change of state',
  description:
    'Open-source primitives, components, blocks and templates for React, built on Base UI, motion and Tailwind CSS, installable with the shadcn CLI or through MCP.',
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

const SEARCH_EXAMPLE_COUNT = 6;

const SHELF_TILE_COUNT = 6;

const SECTION = 'mx-auto w-full max-w-6xl px-4 md:px-6';

const SECTION_GAP = 'flex flex-col gap-12';

function explorerCategoryOf(category: (typeof catalog)[number]) {
  const explored: ExplorerCategory = {
    slug: category.slug,
    name: category.name,
    count: category.entries.length,
  };
  return explored;
}

function largestCategoriesFirst() {
  return [...catalog].sort(
    (first, second) => second.entries.length - first.entries.length
  );
}

function explorerFamilies(): ExplorerFamily[] {
  const allFamily: ExplorerFamily = {
    name: 'All components',
    count: countComponents(catalog),
    categories: largestCategoriesFirst().map(explorerCategoryOf),
  };
  const families = publishedFamilies(catalog).map((family) => ({
    name: family.name,
    count: countComponents(family.categories),
    categories: family.categories.map(explorerCategoryOf),
  }));
  return [allFamily, ...families];
}

function searchExamples(): FoundCategory[] {
  const largest = largestCategoriesFirst().slice(0, SEARCH_EXAMPLE_COUNT);
  return largest.map((category) => ({
    name: category.name,
    count: category.entries.length,
  }));
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
  const applicationTiles = tilesOf('blocks', applicationGroups);
  const marketingTiles = tilesOf('blocks', marketingGroups);
  const shelves: BundleShelf[] = [
    {
      name: 'Application',
      tiles: applicationTiles.slice(0, SHELF_TILE_COUNT),
    },
    { name: 'Marketing', tiles: marketingTiles.slice(0, SHELF_TILE_COUNT) },
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
      className='rounded-full'
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}

export default async function HomePage() {
  const starCount = await fetchStarCount();
  const componentTotal = countComponents(catalog);
  const primitiveTotal = primitiveItems.length + chatItems.length;
  const blockTotal = entryTotal('blocks');
  const blockGroupTotal = groupsOf('blocks').length;
  const templateTotal = entryTotal('templates');
  const templateTiles = tilesOf('templates', groupsOf('templates'));
  const hasTemplates = templateTiles.length > 0;
  const motionTotal = motionComponentTotal();
  const categoryCount = countLabel(catalog.length, 'category', 'categories');

  return (
    <TooltipProvider>
      <div
        className={`${SYSTEM_FONT_CLASS} bg-background text-foreground relative isolate min-h-screen antialiased`}
      >
        <HeroBackdrop />
        <AnnouncementBar />
        <SiteHeader />
        <main className='flex flex-col'>
          <HomeHero componentTotal={componentTotal} starCount={starCount} />
          <div className={`${SECTION} pt-16 sm:pt-20`}>
            <ProductStage />
          </div>
          <div className={`${SECTION} py-28 sm:py-36`}>
            <Statement
              componentTotal={componentTotal}
              blockTotal={blockTotal}
              templateTotal={templateTotal}
            />
          </div>
          <section
            aria-labelledby='why-title'
            className={`${SECTION} ${SECTION_GAP} pb-24 sm:pb-32`}
          >
            <SectionHeading
              id='why-title'
              icon={ZapIcon}
              eyebrow='Why Ndeko UI'
              lead='Everything a screen needs,'
              title='already moving'
              description='Each piece carries the small motion of its state changes, installs in one line and follows one set of tokens.'
              align='center'
            />
            <Pillars />
          </section>
          <section
            aria-labelledby='how-title'
            className={`${SECTION} ${SECTION_GAP} py-24 sm:py-32`}
          >
            <SectionHeading
              id='how-title'
              icon={RocketIcon}
              eyebrow='How it works'
              lead='From the catalogue'
              title='to your project in three steps'
              description='Find a piece, install it with the command it shows, and change it like any other file of yours.'
              align='center'
            />
            <HowItWorks categories={searchExamples()} />
          </section>
          <section
            aria-labelledby='components-title'
            className={`${SECTION} ${SECTION_GAP} py-24 sm:py-32`}
          >
            <SectionHeading
              id='components-title'
              icon={ComponentIcon}
              eyebrow={`${countLabel(componentTotal, 'component', 'components')} in ${categoryCount}`}
              lead='Every component,'
              title='grouped by what it does'
              description='Each category shows its variants side by side, with their code and the command that installs them.'
              action={
                <LinkButton href='/components'>
                  {`All ${catalog.length} categories`}
                </LinkButton>
              }
            />
            <CatalogueExplorer families={explorerFamilies()} />
          </section>
          <section
            aria-labelledby='primitives-title'
            className={`${SECTION} ${SECTION_GAP} py-24 sm:py-32`}
          >
            <SectionHeading
              id='primitives-title'
              icon={LayersIcon}
              eyebrow={countLabel(primitiveTotal, 'primitive', 'primitives')}
              lead='Try the pieces'
              title='before you install them'
              description='Every component is built from these primitives on Base UI. Press, slide and open them here: the motion you feel is the motion you install.'
              action={<LinkButton href='/kit'>See every primitive</LinkButton>}
            />
            <PrimitivesShowcase />
          </section>
          <section
            aria-labelledby='editor-title'
            className='dark bg-background text-foreground'
          >
            <div className={`${SECTION} ${SECTION_GAP} py-24 sm:py-32`}>
              <SectionHeading
                id='editor-title'
                icon={CpuIcon}
                eyebrow='MCP server'
                lead='The library,'
                title='inside your editor'
                description='Claude Code, Cursor, Windsurf and the rest search the catalogue, read the source and install what the screen needs.'
              />
              <EditorSection />
            </div>
          </section>
          <section
            aria-labelledby='screens-title'
            className={`${SECTION} ${SECTION_GAP} py-24 sm:py-32`}
          >
            <SectionHeading
              id='screens-title'
              icon={MonitorIcon}
              eyebrow={countLabel(templateTotal, 'template', 'templates')}
              lead='One system,'
              title='every screen'
              description='Complete pages assembled from the blocks, one fictional product each. The same pieces reorder from a phone to a wide screen.'
              action={<LinkButton href='/templates'>All templates</LinkButton>}
            />
            <EveryScreen />
            {hasTemplates && <BundleTileGrid tiles={templateTiles} />}
          </section>
          <section
            aria-labelledby='blocks-title'
            className={`${SECTION} ${SECTION_GAP} py-24 sm:py-32`}
          >
            <SectionHeading
              id='blocks-title'
              icon={BlocksIcon}
              eyebrow={`${countLabel(blockTotal, 'block', 'blocks')} in ${countLabel(blockGroupTotal, 'group', 'groups')}`}
              lead='Whole sections of a product,'
              title='with fictional data'
              description='App shells, boards, task lists, settings and marketing sections. Each one installs with its parts.'
              action={<LinkButton href='/blocks'>All blocks</LinkButton>}
            />
            <BundlesShowcase shelves={blockShelves()} />
          </section>
          <section
            aria-labelledby='motion-title'
            className={`${SECTION} ${SECTION_GAP} py-24 sm:py-32`}
          >
            <SectionHeading
              id='motion-title'
              icon={MotionIcon}
              eyebrow={countLabel(
                motionTotal,
                'motion component',
                'motion components'
              )}
              lead='Motion you can drop'
              title='into any screen'
              description='Numbers that slide, labels that morph, highlights that follow the pointer. Each one reads the reduced motion setting.'
              action={
                <LinkButton href='/docs'>All motion components</LinkButton>
              }
            />
            <MotionShowcase />
          </section>
          <div className={`${SECTION} py-24 sm:py-32`}>
            <HomeFaq />
          </div>
          <ClosingBand starCount={starCount} />
        </main>
        <SiteFooter />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
