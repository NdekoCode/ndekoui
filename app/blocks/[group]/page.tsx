import type { Metadata } from 'next';

import { groupsOf } from '../_shared/bundles';
import {
  BundleGroupPage,
  bundleGroupMetadataOf,
} from '../_shared/bundle-pages';

type BlockGroupPageProps = {
  params: Promise<{ group: string }>;
};

export function generateStaticParams() {
  return groupsOf('blocks').map((group) => ({ group: group.slug }));
}

export async function generateMetadata({
  params,
}: BlockGroupPageProps): Promise<Metadata> {
  const { group } = await params;
  return bundleGroupMetadataOf('blocks', group);
}

export default async function BlockGroupPage({ params }: BlockGroupPageProps) {
  const { group } = await params;
  return <BundleGroupPage kind='blocks' slug={group} />;
}
