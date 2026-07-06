import { Avatar } from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import type { QuotePart, Slide } from './data';

function QuotePartView({ part }: { part: QuotePart }) {
  if (part.kind === 'brand') {
    return (
      <span className='whitespace-nowrap'>
        <BrandTile
          brand={part.brand}
          size='md'
          className='me-1.5 align-[-0.15em]'
        />
        {part.text}
      </span>
    );
  }
  return part.text;
}

/** The person sits at the foot of the tallest slide, so their line stays put from one quote to the next. */
export function QuoteSlide({ slide }: { slide: Slide }) {
  const { person } = slide;

  return (
    <figure className='flex h-full flex-col justify-between gap-8'>
      <blockquote className='text-lg leading-8 font-medium text-pretty @2xl:text-2xl @2xl:leading-9'>
        <p>
          {slide.parts.map((part, index) => (
            <QuotePartView key={index} part={part} />
          ))}
        </p>
      </blockquote>
      <figcaption className='flex items-center gap-3'>
        <Avatar seed={person.name} className='size-10' />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-sm font-medium'>{person.name}</span>
          <span className='text-muted-foreground truncate text-[13px]'>
            {person.role}, {person.company}
          </span>
        </span>
        <CompanyMark seed={person.company} size='lg' />
      </figcaption>
    </figure>
  );
}
