import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import { ARTICLE, SITE_NAME } from './data';

type SitePageProps = {
  aside?: React.ReactNode;
};

/** The page the banner sits on: a guide on the site of a fictional product, there to be read. */
export function SitePage({ aside }: SitePageProps) {
  return (
    <div className='flex flex-col'>
      <header className='hairline-b border-border flex h-14 shrink-0 items-center gap-2.5 px-4 @xl:px-8'>
        <CompanyMark seed={SITE_NAME} size='lg' />
        <span className='text-sm font-semibold'>{SITE_NAME}</span>
        <span className='text-muted-foreground ms-3 hidden text-[13px] @md:inline'>
          {ARTICLE.section}
        </span>
        <span className='ms-auto flex items-center'>{aside}</span>
      </header>
      <article className='mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-10 pb-56 @xl:px-8 @xl:pt-14'>
        <div className='flex flex-col gap-2'>
          <p className='text-primary-ink text-xs font-medium'>
            {ARTICLE.section}
          </p>
          <h1 className='text-2xl font-semibold text-balance @xl:text-3xl'>
            {ARTICLE.title}
          </h1>
          <p className='text-muted-foreground text-xs'>{ARTICLE.meta}</p>
        </div>
        {ARTICLE.paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className='text-muted-foreground text-base leading-relaxed text-pretty'
          >
            {paragraph}
          </p>
        ))}
      </article>
    </div>
  );
}
