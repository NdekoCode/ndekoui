import { BundleFrame } from './bundle-frame';
import { presentPathOf, viewPathOf } from './bundles';
import type { BundleEntry, BundleKind } from './types';

type BundleCardProps = {
  kind: BundleKind;
  entry: BundleEntry;
};

export function BundleCard({ kind, entry }: BundleCardProps) {
  const viewPath = viewPathOf(kind, entry.group, entry.name);
  const presentPath = presentPathOf(kind, entry.group, entry.name);

  return (
    <article id={entry.name} className='scroll-mt-20'>
      <BundleFrame
        src={viewPath}
        fullPageHref={presentPath}
        title={entry.title}
        description={entry.description}
        itemName={entry.name}
        height={entry.previewHeight}
      />
    </article>
  );
}
