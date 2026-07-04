import Link from 'next/link';

import {
  familyAnchorOf,
  publishedFamilies,
} from '@/app/components/_catalog/families';
import { catalog } from '@/app/components/_generated/catalog';
import { countLabel } from '@/lib/site';
import { BotIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import { Reveal } from '../reveal';
import { SectionHeading } from '../section-heading';
import { AiStage } from './ai-stage';

const AI_FAMILY = 'AI';

function aiFamilyOf() {
  const families = publishedFamilies(catalog);
  return families.find((family) => family.name === AI_FAMILY);
}

function totalOf(counts: number[]) {
  let total = 0;
  for (const count of counts) {
    total += count;
  }
  return total;
}

const CATEGORY_PILL =
  'bg-card hairline-ring ring-border text-foreground hover:bg-foreground/[0.03] focus-visible:ring-ring/25 inline-flex h-8 items-center gap-2 rounded-full px-3 text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none transition-colors focus-visible:ring-[3px]';

export function AiKitSection({ className }: { className: string }) {
  const family = aiFamilyOf();
  if (!family) {
    return null;
  }
  const counts = family.categories.map((category) => category.entries.length);
  const total = totalOf(counts);
  const anchor = familyAnchorOf(AI_FAMILY);

  return (
    <section aria-labelledby='ai-kit-title' className={className}>
      <SectionHeading
        id='ai-kit-title'
        icon={BotIcon}
        eyebrow={countLabel(total, 'AI component', 'AI components')}
        lead='For products with agents in them,'
        title='one run moves every view'
        description='Plans, tool calls, approvals, context and cost read the same run. Here one scripted run feeds four of them at once, and it waits for your yes before it sends anything.'
        action={
          <Button
            variant='outline'
            className='rounded-full'
            nativeButton={false}
            render={<Link href={`/components#${anchor}`} />}
          >
            Browse the AI kit
          </Button>
        }
      />
      <Reveal isLarge>
        <AiStage />
      </Reveal>
      <Reveal>
        <nav aria-label='AI categories' className='flex flex-wrap gap-2'>
          {family.categories.map((category) => (
            <Link
              key={category.slug}
              href={`/components/${category.slug}`}
              className={CATEGORY_PILL}
            >
              {category.name}
              <span className='text-muted-foreground tabular-nums'>
                {category.entries.length}
              </span>
            </Link>
          ))}
        </nav>
      </Reveal>
    </section>
  );
}
