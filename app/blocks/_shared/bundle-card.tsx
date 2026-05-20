import { CodeDialog } from '@/app/_site/code-dialog';
import { Button } from '@/registry/ndeko/ui/button';
import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';

import { BundleFrame } from './bundle-frame';
import { viewPathOf } from './bundles';
import type { BundleEntry, BundleKind } from './types';

type BundleCardProps = {
  kind: BundleKind;
  entry: BundleEntry;
};

export function BundleCard({ kind, entry }: BundleCardProps) {
  const viewPath = viewPathOf(kind, entry.group, entry.name);

  const actions = (
    <>
      <Button
        variant='ghost'
        size='sm'
        nativeButton={false}
        aria-label={`Open ${entry.title} in a new tab`}
        render={<a href={viewPath} target='_blank' rel='noreferrer' />}
      >
        Open
        <ArrowUpRightIcon />
      </Button>
      <CodeDialog
        title={entry.title}
        description={entry.description}
        itemName={entry.name}
      />
    </>
  );

  const heading = (
    <div className='flex flex-col gap-0.5'>
      <h2 className='text-sm font-semibold'>{entry.title}</h2>
      <p className='text-muted-foreground text-xs text-pretty'>
        {entry.description}
      </p>
    </div>
  );

  return (
    <article>
      <BundleFrame
        src={viewPath}
        title={entry.title}
        height={entry.previewHeight}
        heading={heading}
        actions={actions}
      />
    </article>
  );
}
