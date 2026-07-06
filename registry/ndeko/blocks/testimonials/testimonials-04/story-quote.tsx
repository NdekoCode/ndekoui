import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import type { QuotePart, Story } from './data';

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

export function StoryQuote({ story }: { story: Story }) {
  const { person } = story;

  return (
    <figure className='flex flex-col gap-6'>
      <blockquote className='text-xl leading-snug font-medium text-pretty @4xl:text-[1.75rem] @4xl:leading-[1.3]'>
        <p>
          {story.parts.map((part, index) => (
            <QuotePartView key={index} part={part} />
          ))}
        </p>
      </blockquote>
      <figcaption className='flex flex-col gap-0.5'>
        <span className='text-sm font-medium'>{person.name}</span>
        <span className='text-muted-foreground text-[13px]'>
          {person.role}, {person.company}
        </span>
      </figcaption>
    </figure>
  );
}
