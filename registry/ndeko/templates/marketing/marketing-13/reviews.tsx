import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { REVIEWS, REVIEWS_SECTION, type Review } from './data';
import { Reveal } from './reveal';

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col justify-between gap-6 rounded-2xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function Byline({ review }: { review: Review }) {
  return (
    <div className='flex items-center gap-3'>
      <Avatar seed={review.name} role='img' aria-label={review.name} />
      <div className='flex min-w-0 flex-col gap-0.5'>
        <p className='truncate text-[13px] font-medium'>{review.name}</p>
        <p className='text-muted-foreground truncate text-xs'>{review.role}</p>
        <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <CompanyMark seed={review.company} size='sm' />
          <span className='truncate'>{review.company}</span>
        </p>
      </div>
    </div>
  );
}

type QuoteProps = {
  review: Review;
  className?: string;
  quoteClassName: string;
};

function Quote({ review, className, quoteClassName }: QuoteProps) {
  return (
    <figure className={cn(CARD, className)}>
      <div className='flex flex-col gap-4'>
        <Badge variant='secondary' className='w-fit'>
          Sample review
        </Badge>
        <blockquote className={cn('text-pretty', quoteClassName)}>
          {`“${review.quote}”`}
        </blockquote>
      </div>
      <figcaption>
        <Byline review={review} />
      </figcaption>
    </figure>
  );
}

export function Reviews() {
  const [featured, ...others] = REVIEWS;

  return (
    <section className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'>
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {REVIEWS_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {REVIEWS_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem className='grid gap-3 @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
          <Quote
            review={featured}
            className='p-6 @3xl:p-8'
            quoteClassName='text-xl leading-snug font-medium @3xl:text-2xl'
          />
          <div className='flex flex-col gap-3'>
            {others.map((review) => (
              <Quote
                key={review.id}
                review={review}
                className='flex-1'
                quoteClassName='text-[15px] leading-relaxed'
              />
            ))}
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
