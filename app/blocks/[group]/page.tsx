import { groupsOf } from '../_shared/bundles';
import { BundleGroupPage } from '../_shared/bundle-pages';

type BlockGroupPageProps = {
  params: Promise<{ group: string }>;
};

export function generateStaticParams() {
  return groupsOf('blocks').map((group) => ({ group: group.slug }));
}

export default async function BlockGroupPage({ params }: BlockGroupPageProps) {
  const { group } = await params;
  return <BundleGroupPage kind='blocks' slug={group} />;
}
