import type { Metadata } from 'next';

import { pageMetadataOf } from '@/app/_site/seo';

import { BundleIndexPage } from './_shared/bundle-pages';

export const metadata: Metadata = pageMetadataOf({
  title: 'Blocks - ndekoui',
  description:
    'Whole sections of a product built from ndekoui components with fictional data, installable with the shadcn CLI.',
  path: '/blocks',
});

export default function BlocksPage() {
  return <BundleIndexPage kind='blocks' />;
}
