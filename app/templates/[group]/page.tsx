import type { Metadata } from 'next';

import { groupsOf } from '@/app/blocks/_shared/bundles';
import {
  BundleGroupPage,
  bundleGroupMetadataOf,
} from '@/app/blocks/_shared/bundle-pages';

type TemplateGroupPageProps = {
  params: Promise<{ group: string }>;
};

export function generateStaticParams() {
  return groupsOf('templates').map((group) => ({ group: group.slug }));
}

export async function generateMetadata({
  params,
}: TemplateGroupPageProps): Promise<Metadata> {
  const { group } = await params;
  return bundleGroupMetadataOf('templates', group);
}

export default async function TemplateGroupPage({
  params,
}: TemplateGroupPageProps) {
  const { group } = await params;
  return <BundleGroupPage kind='templates' slug={group} />;
}
