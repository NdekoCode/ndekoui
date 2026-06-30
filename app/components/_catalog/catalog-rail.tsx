import Link from 'next/link';

import type { PublishedFamily } from './families';

type CatalogRailProps = {
  families: PublishedFamily[];
  currentSlug: string;
};

function ariaCurrentOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'page' as const;
  }
  return undefined;
}

const RAIL_LINK =
  'flex h-7 items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-[current=page]:bg-foreground/5 aria-[current=page]:font-medium aria-[current=page]:text-foreground';

export function CatalogRail({ families, currentSlug }: CatalogRailProps) {
  return (
    <nav
      aria-label='Component categories'
      className='sticky top-20 hidden max-h-[calc(100dvh-6rem)] flex-col gap-5 overflow-y-auto pb-6 lg:flex'
    >
      {families.map((family) => (
        <div key={family.name} className='flex flex-col gap-1'>
          <p className='text-muted-foreground/80 px-2 pb-1 text-xs font-medium'>
            {family.name}
          </p>
          {family.categories.map((category) => {
            const isCurrent = category.slug === currentSlug;
            return (
              <Link
                key={category.slug}
                href={`/components/${category.slug}`}
                scroll={false}
                aria-current={ariaCurrentOf(isCurrent)}
                className={RAIL_LINK}
              >
                <span className='truncate'>{category.name}</span>
                <span className='text-muted-foreground/80 ms-auto text-[11px] tabular-nums'>
                  {category.entries.length}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
