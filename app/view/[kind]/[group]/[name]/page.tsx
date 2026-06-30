import { notFound } from 'next/navigation';

import {
  groupOf,
  isBundleKind,
  previewOf,
  viewParamsOf,
} from '@/app/blocks/_shared/bundles';

type ViewPageProps = {
  params: Promise<{ kind: string; group: string; name: string }>;
};

export function generateStaticParams() {
  return viewParamsOf();
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
