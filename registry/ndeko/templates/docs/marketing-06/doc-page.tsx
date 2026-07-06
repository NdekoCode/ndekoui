'use client';

import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/registry/ndeko/ui/breadcrumb';

import { SAMPLE_NOTE } from './data';
import { DocBlocks } from './doc-blocks';
import { OnThisPage } from './on-this-page';
import { PageFooter } from './page-footer';
import type { DocPage as DocPageContent, PageId } from './pages';

type DocPageProps = {
  page: DocPageContent;
  activeId: string;
  pressed: string | null;
  install: React.ComponentProps<typeof DocBlocks>['install'];
  headingIdOf: (headingId: string) => string;
  onJump: (headingId: string) => void;
  onOpenPage: (pageId: PageId) => void;
  onOpenHome: () => void;
};

export function DocPage({
  page,
  activeId,
  pressed,
  install,
  headingIdOf,
  onJump,
  onOpenPage,
  onOpenHome,
}: DocPageProps) {
  function openHome(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    onOpenHome();
  }

  return (
    <div className='mx-auto grid max-w-5xl gap-10 px-4 py-8 @2xl:px-8 @5xl:grid-cols-[minmax(0,1fr)_11rem]'>
      <article className='flex min-w-0 flex-col gap-10'>
        <header className='flex flex-col gap-4'>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='#home' onClick={openHome}>
                  Docs
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{page.category}</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{page.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className='text-2xl font-semibold text-balance @sm:text-3xl'>
            {page.title}
          </h1>
          <p className='text-muted-foreground text-base leading-7 text-pretty'>
            {page.lead}
          </p>
        </header>
        {page.sections.map((section) => (
          <section key={section.id} className='flex flex-col gap-4'>
            <h2
              id={headingIdOf(section.id)}
              data-heading={section.id}
              tabIndex={-1}
              className={cn(
                'rounded-sm text-xl font-semibold text-balance',
                FOCUS_RING
              )}
            >
              {section.title}
            </h2>
            <DocBlocks
              blocks={section.blocks}
              install={install}
              onOpenPage={onOpenPage}
            />
          </section>
        ))}
        <PageFooter pageId={page.id} pressed={pressed} onOpen={onOpenPage} />
        <p className='text-muted-foreground text-xs'>{SAMPLE_NOTE}</p>
      </article>
      <aside className='hidden @5xl:block'>
        <div className='sticky top-6'>
          <OnThisPage
            sections={page.sections}
            activeId={activeId}
            headingIdOf={headingIdOf}
            onJump={onJump}
          />
        </div>
      </aside>
    </div>
  );
}
