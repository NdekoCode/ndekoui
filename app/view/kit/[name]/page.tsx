import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { previewMetadataOf } from '@/app/_site/seo';
import { kitItemOf, kitUnitOf, kitViewParamsOf } from '@/app/kit/kit-catalog';
import { kitAnchorPathOf } from '@/app/kit/kit-paths';
import { ItemPresentation } from '@/app/view/_present/item-presentation';

type KitViewPageProps = {
  params: Promise<{ name: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return kitViewParamsOf();
}

export async function generateMetadata({
  params,
}: KitViewPageProps): Promise<Metadata> {
  const { name } = await params;
  const item = kitItemOf(name);
  if (!item) {
    return {};
  }
  return previewMetadataOf({
    title: `${item.title} - ndekoui`,
    description: item.description,
    path: `/view/kit/${name}`,
  });
}

export default async function KitViewPage({ params }: KitViewPageProps) {
  const { name } = await params;
  const item = kitItemOf(name);
  const unit = kitUnitOf(name);
  if (!item || !unit) {
    notFound();
  }
  const { Demo, width } = unit;
  const backHref = kitAnchorPathOf(item.name);

  return (
    <ItemPresentation
      title={item.title}
      itemName={item.name}
      backLabel='Primitives'
      backHref={backHref}
      width={width}
    >
      <Demo />
    </ItemPresentation>
  );
}
