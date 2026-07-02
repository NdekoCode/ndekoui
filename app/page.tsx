import type { Metadata } from 'next';
import Link from 'next/link';

import { fetchStarCount } from '@/app/_site/repository';
import { SiteFooter } from '@/app/_site/site-footer';
import { SiteHeader } from '@/app/_site/site-header';
import { groupsOf } from '@/app/blocks/_shared/bundles';
import { countComponents } from '@/app/components/_catalog/families';
import { catalog } from '@/app/components/_generated/catalog';
import { countLabel, SYSTEM_FONT_CLASS } from '@/lib/site';
import { chatItems } from '@/registry/chat-items';
import { primitiveItems } from '@/registry/items';
import { CpuIcon, LayersIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Toaster } from '@/registry/ndeko/ui/sonner';
import { TooltipProvider } from '@/registry/ndeko/ui/tooltip';

import { AnnouncementBar } from './_home/announcement-bar';
import { ClosingBand } from './_home/closing-band';
import { EditorGrid } from './_home/editor-grid';
import { EditorMarquee } from './_home/editor-marquee';
import { HomeFaq } from './_home/home-faq';
import { HeroShowcase } from './_home/hero-showcase';
import { HeroBackdrop, HomeHero } from './_home/home-hero';
import { PrimitivesShowcase } from './_home/primitives-showcase';
import { Reveal } from './_home/reveal';
import { SectionHeading } from './_home/section-heading';
import { Statement } from './_home/statement';

export const metadata: Metadata = {
  title: 'ndekoui - React components that animate every change of state',
  description:
    'Open-source primitives, components, blocks and templates for React, built on Base UI, motion and Tailwind CSS, installable with the shadcn CLI or through MCP.',
};

/* One rhythm for the whole page: the same space between sections, the same space under a heading. */
const PAGE_RHYTHM = 'flex flex-col gap-24 lg:gap-32';
const SECTION = 'mx-auto w-full max-w-7xl px-4 md:px-8';
const SECTION_STACK = 'flex flex-col gap-10 lg:gap-12';

/** Without scripts nothing would ever mark a block as entered, so they all show from the start. */
const NO_SCRIPT_STYLE =
  '.reveal,.reveal-plain{opacity:1;translate:none;filter:none}';

function entryTotal(kind: 'blocks' | 'templates') {
  let total = 0;
  for (const group of groupsOf(kind)) {
    total += group.entries.length;
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
  const templateTotal = entryTotal('templates');

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
            <HeroShowcase />
          </HomeHero>
          <div className={SECTION}>
            <Statement
              componentTotal={componentTotal}
              blockTotal={blockTotal}
              templateTotal={templateTotal}
            />
          </div>
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
            className='dark bg-background text-foreground flex flex-col gap-12 overflow-hidden py-16 lg:gap-16 lg:py-24'
          >
            <EditorMarquee />
            <div className={`${SECTION} ${SECTION_STACK}`}>
              <SectionHeading
                id='editor-title'
                icon={CpuIcon}
                eyebrow='MCP server'
                lead='Connect Claude, Codex and Cursor'
                title='to ndekoui with MCP'
                description='The ndekoui server lets your editor search the catalogue, read the full source and install what a screen needs, with the theme and the design rules it follows.'
              />
              <Reveal isLarge>
                <EditorGrid />
              </Reveal>
            </div>
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
