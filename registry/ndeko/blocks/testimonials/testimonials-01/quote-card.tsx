import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import type { Quote, QuotePart, ThemeChoice } from './data';

type Emphasis = 'even' | 'marked' | 'quiet';

function emphasisOf(quote: Quote, theme: ThemeChoice): Emphasis {
  if (theme === 'all') {
    return 'even';
  }
  if (quote.theme === theme) {
    return 'marked';
  }
  return 'quiet';
}

const TEXT_CLASS: Record<Emphasis, string> = {
  even: 'text-foreground',
  marked: 'text-foreground',
  quiet: 'text-muted-foreground',
};

/**
 * A flat tint drawn as an image, so its size can grow from the start of the phrase on every line it
 * wraps to. The browser paints a mark yellow by default: its own colour is cleared.
 */
const PHRASE =
  'from-primary/15 to-primary/15 -mx-0.5 rounded-[3px] bg-transparent bg-linear-to-r bg-no-repeat box-decoration-clone px-0.5 font-medium transition-[background-size,color] duration-500 ease-(--ease-out-strong) motion-reduce:transition-colors';

const PHRASE_CLASS: Record<Emphasis, string> = {
  even: 'text-primary-ink [background-size:0%_100%]',
  marked: 'text-primary-ink [background-size:100%_100%]',
  quiet: 'text-muted-foreground [background-size:0%_100%]',
};

type QuotePartViewProps = {
  part: QuotePart;
  emphasis: Emphasis;
};

function QuotePartView({ part, emphasis }: QuotePartViewProps) {
  if (part.kind === 'phrase') {
    return (
      <mark className={cn(PHRASE, PHRASE_CLASS[emphasis])}>{part.text}</mark>
    );
  }
  if (part.kind === 'brand') {
    return (
      <span className='whitespace-nowrap'>
        <BrandTile brand={part.brand} size='sm' className='me-1 align-[-3px]' />
        {part.text}
      </span>
    );
  }
  return part.text;
}

type QuoteCardProps = {
  quote: Quote;
  theme: ThemeChoice;
};

export function QuoteCard({ quote, theme }: QuoteCardProps) {
  const emphasis = emphasisOf(quote, theme);
  const { person } = quote;

  return (
    <figure className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-5 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <blockquote
        className={cn(
          'text-sm leading-6 text-pretty transition-colors duration-300',
          TEXT_CLASS[emphasis]
        )}
      >
        <p>
          {quote.parts.map((part, index) => (
            <QuotePartView key={index} part={part} emphasis={emphasis} />
          ))}
        </p>
      </blockquote>
      <figcaption className='flex items-center gap-3'>
        <Avatar seed={person.name} />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-[13px] font-medium'>
            {person.name}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {person.role}, {person.company}
          </span>
        </span>
        <CompanyMark seed={person.company} />
      </figcaption>
    </figure>
  );
}
