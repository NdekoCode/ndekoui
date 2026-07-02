import type { Metadata } from 'next';
import Link from 'next/link';

import type { BundleTile } from '@/app/_site/bundle-tiles';
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
import { BuiltWith } from './_home/built-with';
import { BundlesShowcase, type BundleShelf } from './_home/bundles-showcase';
import { ClosingBand } from './_home/closing-band';
import { EditorMarquee } from './_home/editor-marquee';
import { EditorSection } from './_home/editor-section';
import { EveryScreen } from './_home/every-screen';
import { HomeFaq } from './_home/home-faq';
import { HeroBackdrop, HomeHero } from './_home/home-hero';
import { HeroStage } from './_home/hero-stage';
import { HowItWorks, type FoundCategory } from './_home/how-it-works';
import { MotionShowcase } from './_home/motion-showcase';
import { Pillars } from './_home/pillars';
import { PrimitivesShowcase } from './_home/primitives-showcase';
import { Reveal } from './_home/reveal';
import { SectionHeading } from './_home/section-heading';
import { Statement } from './_home/statement';
import {
  SystemScroll,
  type SystemCategory,
  type SystemFamily,
} from './_home/system-scroll';

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

const SEARCH_EXAMPLE_COUNT = 5;

const SHELF_TILE_COUNT = 6;

/* One rhythm for the whole page: the same space between sections, the same space under a heading. */
const PAGE_RHYTHM = 'flex flex-col gap-24 lg:gap-32';
const SECTION = 'mx-auto w-full max-w-7xl px-4 md:px-8';
const SECTION_STACK = 'flex flex-col gap-10 lg:gap-12';

/** Without scripts nothing would ever mark a block as entered, so they all show from the start. */
const NO_SCRIPT_STYLE =
  '.reveal,.reveal-plain{opacity:1;translate:none;filter:none}';

function systemCategoryOf(category: (typeof catalog)[number]) {
  const shown: SystemCategory = {
    slug: category.slug,
    name: category.name,
    count: category.entries.length,
  };
  return shown;
}

function systemFamilies(): SystemFamily[] {
  return publishedFamilies(catalog).map((family) => ({
    name: family.name,
    description: family.description,
    count: countComponents(family.categories),
    categories: family.categories.map(systemCategoryOf),
  }));
}

function searchExamples(): FoundCategory[] {
  const largestFirst = [...catalog].sort(
    (first, second) => second.entries.length - first.entries.length
  );
  const largest = largestFirst.slice(0, SEARCH_EXAMPLE_COUNT);
  return largest.map(systemCategoryOf);
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

/** The template groups as quiet links, under the screens that already show two of them live. */
function GroupLinks({ tiles }: { tiles: BundleTile[] }) {
  return (
    <ul className='flex flex-wrap justify-center gap-2'>
      {tiles.map((tile) => (
        <li key={tile.href}>
          <Link
            href={tile.href}
            className='bg-foreground/[0.05] hover:bg-foreground/[0.09] focus-visible:ring-ring/25 inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px]'
          >
            {tile.name}
            <span className='text-muted-foreground text-xs font-normal tabular-nums'>
              {countLabel(tile.count, tile.singular, tile.plural)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
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
  const motionTotal = motionComponentTotal();
  const categoryCount = countLabel(catalog.length, 'category', 'categories');

  return (
    <TooltipProvider>
      <div
        className={`${SYSTEM_FONT_CLASS} bg-background text-foreground relative isolate min-h-screen antialiased`}
      >
        <noscript>
          <style>{NO_SCRIPT_STYLE}</style>
        </noscript>
        <HeroBackdrop />
        <AnnouncementBar />
        <SiteHeader isWide />
        <main className={PAGE_RHYTHM}>
          <HomeHero componentTotal={componentTotal} starCount={starCount}>
            <HeroStage />
          </HomeHero>
          <div className={SECTION}>
            <Statement
              componentTotal={componentTotal}
              blockTotal={blockTotal}
              templateTotal={templateTotal}
            />
          </div>
          <section
            aria-labelledby='why-title'
            className={`${SECTION} ${SECTION_STACK}`}
          >
            <SectionHeading
              id='why-title'
              icon={ZapIcon}
              eyebrow='Why Ndeko UI'
              lead='Everything a screen needs,'
              title='already moving'
              description='Each piece carries the small motion of its state changes, installs in one line and follows one set of tokens'
              align='center'
            />
            <Pillars />
          </section>
          <section aria-labelledby='how-title' className={SECTION}>
            <HowItWorks
              categories={searchExamples()}
              heading={
                <SectionHeading
                  id='how-title'
                  icon={RocketIcon}
                  eyebrow='How it works'
                  lead='From the catalogue'
                  title='to your project in three steps'
                  description='Find a piece, install it with the command it shows, and change it like any other file of yours'
                />
              }
            />
          </section>
          <section
            aria-labelledby='components-title'
            className={`${SECTION} flex flex-col gap-4`}
          >
            <SectionHeading
              id='components-title'
              icon={ComponentIcon}
              eyebrow={`${countLabel(componentTotal, 'component', 'components')} in ${categoryCount}`}
              lead='Every component,'
              title='grouped by what it does'
              description='Scroll through the families: each one lists its categories and how many components they hold'
              action={
                <LinkButton href='/components'>
                  {`All ${catalog.length} categories`}
                </LinkButton>
              }
            />
            <SystemScroll families={systemFamilies()} />
            <BuiltWith name='Sticky scroll' href='/docs/sticky-scroll' />
          </section>
          <section
            aria-labelledby='primitives-title'
            className={`${SECTION} ${SECTION_STACK}`}
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
            <Reveal isLarge>
              <PrimitivesShowcase />
            </Reveal>
          </section>
          <section
            aria-labelledby='editor-title'
            className='dark bg-background text-foreground flex flex-col gap-12 overflow-hidden py-16 lg:gap-16 lg:py-20 dark:bg-[hsl(240_6%_4.5%)] dark:shadow-[inset_0_1px_0_var(--border),inset_0_-1px_0_var(--border)]'
          >
            <div className='flex flex-col gap-4'>
              <EditorMarquee />
              <div className={SECTION}>
                <BuiltWith
                  name='Scroll text marquee'
                  href='/docs/scroll-text-marquee'
                />
              </div>
            </div>
            <div className={`${SECTION} ${SECTION_STACK}`}>
              <SectionHeading
                id='editor-title'
                icon={CpuIcon}
                eyebrow='MCP server'
                lead='The library,'
                title='inside your editor'
                description='Claude Code, Cursor, Windsurf and the rest search the catalogue, read the source and install what the screen needs'
              />
              <EditorSection />
            </div>
          </section>
          <section
            aria-labelledby='screens-title'
            className={`${SECTION} ${SECTION_STACK}`}
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
            <Reveal isLarge>
              <EveryScreen />
            </Reveal>
            <GroupLinks tiles={templateTiles} />
          </section>
          <section
            aria-labelledby='blocks-title'
            className={`${SECTION} ${SECTION_STACK}`}
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
            <Reveal isLarge>
              <BundlesShowcase shelves={blockShelves()} />
            </Reveal>
          </section>
          <section
            aria-labelledby='motion-title'
            className={`${SECTION} ${SECTION_STACK}`}
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
            <Reveal isLarge>
              <MotionShowcase />
            </Reveal>
          </section>
          <div className={SECTION}>
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
