import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { SECTIONS, type ArticleBlock } from './data';

function Block({ block }: { block: ArticleBlock }) {
  if (block.kind === 'quote') {
    return (
      <figure className='bg-foreground/[0.03] flex flex-col gap-3 rounded-xl p-5'>
        <blockquote className='text-lg leading-8 text-pretty'>
          {block.text}
        </blockquote>
        <figcaption className='flex items-center gap-2.5 text-[13px]'>
          <Avatar seed={block.person} className='size-6' />
          <span>
            <span className='font-medium'>{block.person}</span>
            <span className='text-muted-foreground'>, {block.role}</span>
          </span>
        </figcaption>
      </figure>
    );
  }
  if (block.kind === 'list') {
    return (
      <ul className='flex flex-col gap-2 text-base leading-7'>
        {block.items.map((item) => (
          <li key={item} className='flex items-baseline gap-3'>
            <span
              aria-hidden='true'
              className='bg-foreground/30 size-1.5 shrink-0 translate-y-[-0.15em] rounded-full'
            />
            {item}
          </li>
        ))}
      </ul>
    );
  }
  if (block.kind === 'code') {
    return (
      <figure className='flex flex-col gap-2'>
        <pre className='bg-foreground/[0.04] relative overflow-x-auto rounded-xl px-4 py-3 font-mono text-[13px] leading-relaxed'>
          <code>{block.code}</code>
        </pre>
        <figcaption className='text-muted-foreground text-xs'>
          {block.caption}
        </figcaption>
      </figure>
    );
  }
  return <p className='text-base leading-7 text-pretty'>{block.text}</p>;
}

type ArticleBodyProps = {
  /** The id a heading carries in the page, unique for each copy of the block. */
  headingIdOf: (sectionId: string) => string;
};

export function ArticleBody({ headingIdOf }: ArticleBodyProps) {
  return (
    <div className='flex flex-col gap-10'>
      {SECTIONS.map((section) => (
        <section key={section.id} className='flex flex-col gap-5'>
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
          {section.blocks.map((block, index) => (
            <Block key={`${section.id}-${index}`} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
