import { notFound } from 'next/navigation';

import {
  groupOf,
  groupsOf,
  isBundleKind,
  previewOf,
} from '@/app/blocks/_shared/bundles';

type ViewPageProps = {
  params: Promise<{ kind: string; group: string; name: string }>;
};

export function generateStaticParams() {
  const kinds = ['blocks', 'templates'] as const;
  return kinds.flatMap((kind) =>
    groupsOf(kind).flatMap((group) =>
      group.entries.map((entry) => ({
        kind,
        group: group.slug,
        name: entry.name,
      }))
    )
  );
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { kind, group: groupSlug, name } = await params;
  if (!isBundleKind(kind)) {
    notFound();
  }
  const group = groupOf(kind, groupSlug);
  if (!group) {
    notFound();
  }
  const Preview = await previewOf(kind, groupSlug, name);
  if (!Preview) {
    notFound();
  }
  return <Preview />;
}
