import type { Metadata } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/app/_site/json-ld';
import { PauseOffscreen } from '@/app/_site/pause-offscreen';
import { fetchStarCount } from '@/app/_site/repository';
import { pageMetadataOf } from '@/app/_site/seo';
import { SiteFooter } from '@/app/_site/site-footer';
import { SiteHeader } from '@/app/_site/site-header';
import { CATALOG_STATS, componentCountPhraseOf } from '@/lib/catalog-stats';
import { countLabel, SYSTEM_FONT_CLASS } from '@/lib/site';
import { CpuIcon, LayersIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Toaster } from '@/registry/ndeko/ui/sonner';
import { TooltipProvider } from '@/registry/ndeko/ui/tooltip';

import { AiKitSection } from './_home/ai-kit/ai-kit-section';
import { AnnouncementBar } from './_home/announcement-bar';
import { ClosingBand } from './_home/closing-band';
import { EditorGrid } from './_home/editor-grid';
import { EditorMarquee } from './_home/editor-marquee';
import { HomeFaq } from './_home/home-faq';
import { homeStructuredDataOf } from './_home/home-structured-data';
import { HeroShowcase } from './_home/hero-showcase';
import { HeroBackdrop, HomeHero } from './_home/home-hero';
import { PrimitivesShowcase } from './_home/primitives-showcase';
import { ReplaySection } from './_home/replay/replay-section';
import { Reveal } from './_home/reveal';
import { SectionHeading } from './_home/section-heading';
import { StatesSection } from './_home/states/states-section';
import { Statement } from './_home/statement';

const COMPONENT_PHRASE = componentCountPhraseOf(CATALOG_STATS);

/* The title names the kind of thing ndekoui is, for people who do not know the name yet. */
const HOME_TITLE = 'ndekoui - Animated React UI component library';

const HOME_DESCRIPTION = `Free, open-source React components: ${COMPONENT_PHRASE}, plus blocks and templates, built on Base UI, motion and Tailwind CSS 4. Install them with the shadcn CLI or through MCP.`;

export const metadata: Metadata = pageMetadataOf({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/',
});

/* One rhythm for the whole page: the same space between sections, the same space under a heading. */
const PAGE_RHYTHM = 'flex flex-col gap-24 lg:gap-32';
const SECTION = 'mx-auto w-full max-w-7xl px-4 md:px-8';
const SECTION_STACK = 'flex flex-col gap-10 lg:gap-12';

/** Without scripts nothing would ever mark a block as entered, so they all show from the start. */
const NO_SCRIPT_STYLE =
  '.reveal,.reveal-plain{opacity:1;translate:none;filter:none}';

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
  const primitiveTotal = CATALOG_STATS.primitives;
  const blockTotal = CATALOG_STATS.blocks;
  const templateTotal = CATALOG_STATS.templates;

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
          <HomeHero componentPhrase={COMPONENT_PHRASE} starCount={starCount}>
            <PauseOffscreen>
              <HeroShowcase />
            </PauseOffscreen>
          </HomeHero>
          <div className={SECTION}>
            <Statement
              componentPhrase={COMPONENT_PHRASE}
              blockTotal={blockTotal}
              templateTotal={templateTotal}
            />
          </div>
          <PauseOffscreen>
            <AiKitSection className={`${SECTION} ${SECTION_STACK}`} />
          </PauseOffscreen>
          <PauseOffscreen>
            <StatesSection className={`${SECTION} ${SECTION_STACK}`} />
          </PauseOffscreen>
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
              <PauseOffscreen>
                <PrimitivesShowcase />
              </PauseOffscreen>
            </Reveal>
          </section>
          <section
            aria-labelledby='replay-title'
            className={`${SECTION} ${SECTION_STACK}`}
          >
            <SectionHeading
              id='replay-title'
              icon={PlayIcon}
              eyebrow='From prompt to page'
              lead='Ask in your editor'
              title='and it lands in your project'
              description='A replay of the whole path in Claude Code: the ndekoui server finds the component, the shadcn CLI installs it, and it shows up on the page. The search results, the command and the files it writes are the real ones.'
            />
            <Reveal isLarge>
              <PauseOffscreen>
                <ReplaySection />
              </PauseOffscreen>
            </Reveal>
          </section>
          <section
            aria-labelledby='editor-title'
            className='dark bg-background text-foreground flex flex-col gap-12 overflow-hidden py-16 lg:gap-16 lg:py-24'
          >
            <PauseOffscreen>
              <EditorMarquee />
            </PauseOffscreen>
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
          <PauseOffscreen>
            <ClosingBand starCount={starCount} />
          </PauseOffscreen>
        </main>
        <SiteFooter />
        <JsonLd data={homeStructuredDataOf(HOME_DESCRIPTION)} />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
