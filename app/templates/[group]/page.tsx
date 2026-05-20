import { groupsOf } from '@/app/blocks/_shared/bundles';
import { BundleGroupPage } from '@/app/blocks/_shared/bundle-pages';

type TemplateGroupPageProps = {
  params: Promise<{ group: string }>;
};

export function generateStaticParams() {
  return groupsOf('templates').map((group) => ({ group: group.slug }));
}

export default async function TemplateGroupPage({
  params,
}: TemplateGroupPageProps) {
  const { group } = await params;
  return <BundleGroupPage kind='templates' slug={group} />;
}
