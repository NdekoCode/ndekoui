'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { DOCUMENTS, PAGE, type ContentBlock, type LegalDocument } from './data';
import {
  documentOf,
  isDocumentId,
  readingTimeOf,
  sectionDomIdOf,
} from './legal-model';
import { SectionIndex, useCurrentSection } from './section-index';

const ARTICLE_ID = 'legal-01-document';

const SCROLL_MARGIN_PX = 32;

const CROSSFADE_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.23, 1, 0.32, 1],
};

const CROSSFADE_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(4px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const DOCUMENT_OPTIONS = DOCUMENTS.map((legalDocument) => ({
  value: legalDocument.id,
  label: legalDocument.title,
}));

function crossfadeVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return CROSSFADE_VARIANTS;
}

function tabIdOf(documentId: string) {
  return `legal-01-tab-${documentId}`;
}

function Block({ block }: { block: ContentBlock }) {
  if (block.kind === 'paragraph') {
    return <p className='text-pretty'>{block.text}</p>;
  }
  return (
    <ul className='marker:text-muted-foreground flex list-disc flex-col gap-2 ps-5'>
      {block.items.map((item) => (
        <li key={item.term} className='text-pretty'>
          <span className='text-foreground font-medium'>{item.term}:</span>{' '}
          {item.text}
        </li>
      ))}
    </ul>
  );
}

function DocumentBody({ legalDocument }: { legalDocument: LegalDocument }) {
  const readingTime = readingTimeOf(legalDocument);

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-xl font-semibold text-balance'>
          {legalDocument.title}
        </h2>
        <p className='text-muted-foreground text-xs'>
          Effective {legalDocument.effective} · {readingTime}
        </p>
      </div>
      <section
        aria-label='In short'
        className='bg-foreground/[0.025] flex flex-col gap-2 rounded-xl p-4'
      >
        <h3 className='text-primary-ink text-xs font-medium'>In short</h3>
        <ul className='marker:text-muted-foreground flex list-disc flex-col gap-1.5 ps-5 text-[13px] leading-relaxed'>
          {legalDocument.summary.map((line) => (
            <li key={line} className='text-pretty'>
              {line}
            </li>
          ))}
        </ul>
      </section>
      {legalDocument.sections.map((section) => {
        const domId = sectionDomIdOf(legalDocument.id, section.id);

        return (
          <section key={section.id} aria-labelledby={domId}>
            <h3
              id={domId}
              tabIndex={-1}
              className='scroll-mt-8 text-base font-semibold text-balance outline-none'
            >
              {section.title}
            </h3>
            <div className='text-muted-foreground mt-3 flex flex-col gap-3 text-sm leading-relaxed'>
              {section.blocks.map((block, index) => (
                <Block key={`${section.id}-${index}`} block={block} />
              ))}
            </div>
          </section>
        );
      })}
      <p className='text-muted-foreground text-[13px]'>
        Questions about this document go to{' '}
        <a
          href={`mailto:${PAGE.contact}`}
          className='text-primary-ink focus-visible:ring-ring/25 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
        >
          {PAGE.contact}
        </a>
      </p>
    </div>
  );
}

export default function Legal01() {
  const [documentId, setDocumentId] = useState(DOCUMENTS[0].id);
  const articleRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const crossfadeVariants = crossfadeVariantsOf(shouldReduceMotion);
  const legalDocument = documentOf(documentId);
  const currentSectionId = useCurrentSection(
    legalDocument.id,
    legalDocument.sections
  );

  /** A new document starts at its title, so a reader deep in the last one does not land mid-text. */
  function bringArticleIntoView() {
    const article = articleRef.current;
    if (!article) {
      return;
    }
    const top = article.getBoundingClientRect().top;
    if (top >= 0) {
      return;
    }
    const target = window.scrollY + top - SCROLL_MARGIN_PX;
    window.scrollTo({ top: target });
  }

  function openDocument(value: unknown) {
    if (!isDocumentId(value)) {
      return;
    }
    setDocumentId(value);
    bringArticleIntoView();
  }

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <div className='mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16'>
        <header className='flex max-w-2xl flex-col gap-3'>
          <p className='text-primary-ink text-xs font-medium'>{PAGE.eyebrow}</p>
          <h1 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {PAGE.title}
          </h1>
          <p className='text-muted-foreground text-base text-pretty'>
            {PAGE.description}
          </p>
          <p className='text-muted-foreground text-xs'>{PAGE.notice}</p>
        </header>
        <div className='mt-10 grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[11rem_minmax(0,1fr)_11rem]'>
          <div className='lg:sticky lg:top-8 lg:self-start'>
            <div className='lg:hidden'>
              <Select
                items={DOCUMENT_OPTIONS}
                value={documentId}
                onValueChange={openDocument}
              >
                <SelectTrigger aria-label='Document' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TabsPrimitive.Root
              value={documentId}
              onValueChange={openDocument}
              orientation='vertical'
              className='hidden lg:block'
            >
              <TabsPrimitive.List
                aria-label='Documents'
                className='relative flex flex-col gap-0.5'
              >
                {DOCUMENTS.map((option) => (
                  <TabsPrimitive.Tab
                    key={option.id}
                    value={option.id}
                    id={tabIdOf(option.id)}
                    aria-controls={ARTICLE_ID}
                    className='text-muted-foreground hover:text-foreground data-active:text-foreground focus-visible:ring-ring/25 relative z-10 flex h-8 w-full cursor-pointer items-center rounded-md px-2.5 text-start text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-[3px]'
                  >
                    {option.title}
                  </TabsPrimitive.Tab>
                ))}
                <TabsPrimitive.Indicator className='bg-foreground/[0.05] dark:bg-foreground/[0.07] pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-full translate-y-(--active-tab-top) rounded-md transition-[translate,height] duration-300 ease-(--ease-out-strong)' />
              </TabsPrimitive.List>
            </TabsPrimitive.Root>
          </div>
          <article
            ref={articleRef}
            id={ARTICLE_ID}
            role='tabpanel'
            aria-labelledby={tabIdOf(legalDocument.id)}
            className='max-w-2xl min-w-0'
          >
            <AnimatedSize contentClassName='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.div
                  key={legalDocument.id}
                  variants={crossfadeVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={CROSSFADE_TRANSITION}
                >
                  <DocumentBody legalDocument={legalDocument} />
                </motion.div>
              </AnimatePresence>
            </AnimatedSize>
          </article>
          <aside className='hidden xl:sticky xl:top-8 xl:block xl:self-start'>
            <SectionIndex
              key={legalDocument.id}
              documentId={legalDocument.id}
              sections={legalDocument.sections}
              currentId={currentSectionId}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
