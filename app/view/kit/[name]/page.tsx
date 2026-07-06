import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { kitItemOf, kitUnitOf } from '@/app/kit/kit-catalog';
import { kitAnchorPathOf } from '@/app/kit/kit-paths';
import { ItemPresentation } from '@/app/view/_present/item-presentation';

type KitViewPageProps = {
  params: Promise<{ name: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: KitViewPageProps): Promise<Metadata> {
  const { name } = await params;
  const item = kitItemOf(name);
  if (!item) {
    return {};
  }
  return {
    title: `${item.title} - ndekoui`,
    description: item.description,
  };
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
