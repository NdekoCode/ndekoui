'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Settle, SettleItem } from '@/registry/ndeko/ui/settle';

import { HERO_ACTIONS, type StudioSection } from './data';

const HEADING = 'text-2xl font-semibold text-balance sm:text-4xl lg:text-5xl';

type SectionCopyProps = {
  section: StudioSection;
  isFirst: boolean;
};

function FirstActions() {
  return (
    <div className='flex flex-wrap gap-2 pt-1'>
      <Button
        size='lg'
        nativeButton={false}
        render={<a href={HERO_ACTIONS.primaryHref} />}
      >
        {HERO_ACTIONS.primary}
        <ArrowRightIcon />
      </Button>
      <Button
        size='lg'
        variant='outline'
        nativeButton={false}
        render={<a href={HERO_ACTIONS.secondaryHref} />}
      >
        {HERO_ACTIONS.secondary}
      </Button>
    </div>
  );
}

export function SectionCopy({ section, isFirst }: SectionCopyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isShown = useInView(ref, { once: true, amount: 0.3 });
  const titleId = `${section.id}-title`;

  return (
    <div ref={ref}>
      <Settle isShown={isShown} className='flex flex-col items-start gap-5'>
        <SettleItem>
          <p className='text-primary-ink text-xs font-medium'>
            <span className='tabular-nums'>{section.number}</span>{' '}
            {section.name}
          </p>
        </SettleItem>
        <SettleItem>
          {isFirst && (
            <h1 id={titleId} className={HEADING}>
              {section.title}
            </h1>
          )}
          {!isFirst && (
            <h2 id={titleId} className={HEADING}>
              {section.title}
            </h2>
          )}
        </SettleItem>
        <SettleItem>
          <p className='text-muted-foreground text-base text-pretty'>
            {section.description}
          </p>
        </SettleItem>
        <SettleItem>
          <ul className='hidden flex-col gap-2.5 text-[13px] sm:flex'>
            {section.points.map((point) => (
              <li key={point} className='flex items-center gap-2.5'>
                <span
                  aria-hidden='true'
                  className='bg-foreground/25 size-1 shrink-0 rounded-full'
                />
                {point}
              </li>
            ))}
          </ul>
        </SettleItem>
        <SettleItem>
          {isFirst && <FirstActions />}
          {!isFirst && (
            <Button
              variant='link'
              className='h-auto px-0'
              nativeButton={false}
              render={<a href='#' />}
            >
              {section.linkLabel}
              <ArrowRightIcon className='size-3.5' />
            </Button>
          )}
        </SettleItem>
      </Settle>
    </div>
  );
}
